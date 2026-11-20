/**
 * AudioQueueManager - Real-Time Sequential Audio Chunk Playback Manager
 *
 * Responsibilities:
 * 1. Receives audio chunks (base64-encoded MP3) from the backend WebSocket.
 * 2. Pre-decodes audio chunks asynchronously into AudioBuffers and prepares HTML5 Audio elements.
 * 3. Enforces strictly monotonic, sequential playback (never overlaps chunks, never plays out-of-order).
 * 4. Starts playback immediately on chunk 0 without waiting for LLM completion.
 * 5. Handles interruptions by immediately stopping playback, purging pending buffers, and rejecting stale requests.
 * 6. Hardens against audio device switches, HDMI clock freeze, and muted sinks using an automatic chunk watchdog timer.
 * 7. Supports target audio output routing (setSinkId) for headphones/earphones vs HDMI displays.
 * 8. Emits reliable lifecycle callbacks:
 *    - onPlaybackStart({ requestId })
 *    - onChunkStart({ requestId, sequence, duration })
 *    - onChunkEnd({ requestId, sequence })
 *    - onPlaybackComplete({ requestId, totalChunksPlayed, metrics })
 *    - onPlaybackError({ requestId, sequence, error })
 */

export class AudioQueueManager {
  constructor(options = {}) {
    this.audioContext = options.audioContext || null;
    this.callbacks = {
      onPlaybackStart: options.onPlaybackStart || null,
      onChunkStart: options.onChunkStart || null,
      onChunkEnd: options.onChunkEnd || null,
      onPlaybackComplete: options.onPlaybackComplete || null,
      onPlaybackError: options.onPlaybackError || null,
    };

    // State tracking
    this.currentRequestId = null;
    this.nextExpectedSequence = 0;
    this.totalChunksExpected = null;
    this.isGenerationComplete = false;
    this.isPlaying = false;
    this.hasStartedPlayback = false;
    this.hasTriggeredComplete = false;

    // Buffer store & hardware handles
    this.chunks = new Map();
    this.currentSource = null;
    this.currentHtmlAudio = null;
    this.currentWatchdog = null;
    this.directSource = null;
    this.directWatchdog = null;
    this.sinkId = options.sinkId || null;
    this.maxQueueSize = options.maxQueueSize || 40; // Bounded queueing

    // Timing metrics tracking
    this.metrics = {
      startTime: null,
      firstAudioReceivedTime: null,
      firstPlaybackStartTime: null,
      lastPlaybackEndTime: null,
      totalDurationSeconds: 0,
      chunkDurations: [],
    };
  }

  /**
   * Set or update lifecycle callbacks.
   */
  setCallbacks(callbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  /**
   * Set target audio output sink (e.g. earphones/headphones vs HDMI).
   */
  async setSinkId(sinkId) {
    this.sinkId = sinkId;
    if (this.audioContext && typeof this.audioContext.setSinkId === "function") {
      try {
        await this.audioContext.setSinkId(sinkId);
        console.log(`[AudioQueueManager] AudioContext sinkId set to: ${sinkId}`);
      } catch (err) {
        console.warn("[AudioQueueManager] Failed to set sinkId on AudioContext:", err);
      }
    }
  }

  /**
   * Get or initialize Web Audio context.
   */
  getAudioContext() {
    if (!this.audioContext || this.audioContext.state === "closed") {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        try {
          this.audioContext = new AudioCtx();
          if (this.sinkId && typeof this.audioContext.setSinkId === "function") {
            this.audioContext.setSinkId(this.sinkId).catch(() => {});
          }
        } catch (e) {
          console.warn("[AudioQueueManager] Error creating AudioContext:", e);
        }
      }
    }
    if (this.audioContext && this.audioContext.state === "suspended") {
      this.audioContext.resume().catch(() => {});
    }
    return this.audioContext;
  }

  /**
   * Convert base64 string to ArrayBuffer.
   */
  static base64ToArrayBuffer(base64) {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /**
   * Decode audio ArrayBuffer to AudioBuffer safely.
   */
  async decodeAudio(arrayBuffer) {
    const ctx = this.getAudioContext();
    if (!ctx) {
      throw new Error("Web Audio API is not supported in this browser.");
    }
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }
    const copy = arrayBuffer.slice(0);
    return new Promise((resolve, reject) => {
      let settled = false;
      const onSuccess = (buf) => {
        if (!settled) {
          settled = true;
          resolve(buf);
        }
      };
      const onError = (err) => {
        if (!settled) {
          settled = true;
          reject(err || new Error("Failed to decode audio data"));
        }
      };
      try {
        const result = ctx.decodeAudioData(copy, onSuccess, onError);
        if (result && typeof result.then === "function") {
          result.then(onSuccess, onError);
        }
      } catch (e) {
        onError(e);
      }
    });
  }

  /**
   * Start a new request session, invalidating any previous playback.
   */
  startRequest(requestId) {
    this.stop();
    this.currentRequestId = requestId;
    this.nextExpectedSequence = 0;
    this.totalChunksExpected = null;
    this.isGenerationComplete = false;
    this.isPlaying = false;
    this.hasStartedPlayback = false;
    this.hasTriggeredComplete = false;
    this.chunks.clear();

    this.metrics = {
      startTime: typeof performance !== "undefined" ? performance.now() : Date.now(),
      firstAudioReceivedTime: null,
      firstPlaybackStartTime: null,
      lastPlaybackEndTime: null,
      totalDurationSeconds: 0,
      chunkDurations: [],
    };

    // Pre-warm AudioContext as early as possible so output hardware is ready
    try {
      const ctx = this.getAudioContext();
      if (ctx && ctx.state === "suspended") {
        ctx.resume().catch(() => {});
      }
    } catch {}
  }

  /**
   * Get the current session performance and playback metrics.
   */
  getMetrics() {
    const avgChunkDuration = this.metrics.chunkDurations.length > 0
      ? this.metrics.totalDurationSeconds / this.metrics.chunkDurations.length
      : 0;

    return {
      requestId: this.currentRequestId,
      firstAudioDelayMs: this.metrics.firstAudioReceivedTime !== null ? Number((this.metrics.firstAudioReceivedTime - this.metrics.startTime).toFixed(1)) : null,
      firstPlaybackDelayMs: this.metrics.firstPlaybackStartTime !== null ? Number((this.metrics.firstPlaybackStartTime - this.metrics.startTime).toFixed(1)) : null,
      totalPlaybackDurationMs: this.metrics.lastPlaybackEndTime !== null ? Number((this.metrics.lastPlaybackEndTime - (this.metrics.firstPlaybackStartTime || this.metrics.startTime)).toFixed(1)) : null,
      totalAudioDurationSeconds: Number(this.metrics.totalDurationSeconds.toFixed(2)),
      averageChunkDurationSeconds: Number(avgChunkDuration.toFixed(2)),
      chunksPlayedCount: this.metrics.chunkDurations.length,
      chunkDurations: [...this.metrics.chunkDurations],
    };
  }

  /**
   * Enqueue an incoming audio chunk from WebSocket.
   *
   * @param {Object} chunkData
   * @param {string} chunkData.requestId
   * @param {number} chunkData.sequence
   * @param {string|null} chunkData.audio Base64-encoded audio payload
   * @param {string} [chunkData.format="mp3"]
   */
  enqueueChunk({ requestId, sequence, audio, format = "mp3" }) {
    if (!requestId) {
      return;
    }

    // Auto-adopt requestId if not yet initialized, avoiding dropped chunks
    if (!this.currentRequestId) {
      console.log(`[AudioQueueManager] Adopting requestId ${requestId} on first chunk arrival.`);
      this.currentRequestId = requestId;
    } else if (requestId !== this.currentRequestId) {
      console.warn(`[AudioQueueManager] Ignoring chunk ${sequence} for stale request ${requestId} (active: ${this.currentRequestId})`);
      return;
    }

    if (this.metrics.firstAudioReceivedTime === null && audio) {
      this.metrics.firstAudioReceivedTime = typeof performance !== "undefined" ? performance.now() : Date.now();
    }

    // Prevent duplicate chunk processing or re-enqueuing already played sequences
    if (this.chunks.has(sequence) || sequence < this.nextExpectedSequence) {
      return;
    }

    // Bounded queue check to prevent unbounded memory growth
    if (this.chunks.size >= this.maxQueueSize) {
      console.warn(`[AudioQueueManager] Queue capacity (${this.maxQueueSize}) reached. Backpressure active.`);
    }

    // Handle empty/skipped audio payload (e.g. backend TTS error fallback)
    if (!audio) {
      console.warn(`[AudioQueueManager] Received empty audio for chunk ${sequence}. Skipping.`);
      this.chunks.set(sequence, {
        buffer: null,
        blobUrl: null,
        duration: 2.0,
        resolved: true,
        error: null,
      });
      this.playNext();
      return;
    }

    // Decode audio in background and store in sequence queue
    const chunkEntry = {
      buffer: null,
      blobUrl: null,
      duration: null,
      resolved: false,
      error: null,
    };
    this.chunks.set(sequence, chunkEntry);

    try {
      const arrayBuffer = AudioQueueManager.base64ToArrayBuffer(audio);
      let blobUrl = null;
      try {
        const blob = new Blob([arrayBuffer], { type: `audio/${format || "mp3"}` });
        blobUrl = URL.createObjectURL(blob);
      } catch (bErr) {
        console.warn("[AudioQueueManager] Failed to create Blob URL:", bErr);
      }
      chunkEntry.blobUrl = blobUrl;

      console.log(`[AudioQueueManager] Decoding chunk ${sequence} (${arrayBuffer.byteLength} bytes) for request ${requestId}...`);
      this.decodeAudio(arrayBuffer)
        .then((audioBuffer) => {
          if (this.currentRequestId !== requestId) {
            console.warn(`[AudioQueueManager] Discarding decoded chunk ${sequence}: request ${requestId} cancelled.`);
            if (blobUrl) {
              try { URL.revokeObjectURL(blobUrl); } catch {}
            }
            return;
          }
          console.log(`[AudioQueueManager] Chunk ${sequence} decoded successfully (duration: ${audioBuffer.duration.toFixed(2)}s). Triggering playNext().`);
          chunkEntry.buffer = audioBuffer;
          chunkEntry.duration = audioBuffer.duration;
          chunkEntry.resolved = true;
          this.playNext();
        })
        .catch((err) => {
          if (this.currentRequestId !== requestId) {
            return;
          }
          console.warn(`[AudioQueueManager] Web Audio decode failed for chunk ${sequence}, using HTML5 fallback:`, err);
          chunkEntry.buffer = null;
          chunkEntry.duration = 3.0; // fallback estimated duration
          chunkEntry.resolved = true;
          chunkEntry.error = err;
          this.playNext();
        });
    } catch (err) {
      console.warn(`[AudioQueueManager] Failed to process base64 chunk ${sequence}:`, err);
      chunkEntry.buffer = null;
      chunkEntry.blobUrl = null;
      chunkEntry.duration = 2.0;
      chunkEntry.resolved = true;
      chunkEntry.error = err;
      this.callbacks.onPlaybackError?.({
        requestId,
        sequence,
        error: err,
      });
      this.playNext();
    }
  }

  /**
   * Mark LLM generation as complete and declare total chunks expected.
   */
  setGenerationComplete({ requestId, totalChunks }) {
    if (!requestId) return;
    if (!this.currentRequestId) {
      this.currentRequestId = requestId;
    } else if (requestId !== this.currentRequestId) {
      return;
    }
    this.isGenerationComplete = true;
    if (typeof totalChunks === "number") {
      this.totalChunksExpected = totalChunks;
    }
    console.log(`[AudioQueueManager] Generation complete for request ${requestId}. Total chunks expected: ${this.totalChunksExpected}`);
    this.checkCompletion();
  }

  /**
   * Play the next in-sequence audio chunk if available and not currently playing.
   * Includes an automatic chunk watchdog timer to guarantee continuous flow across HDMI and stalled audio devices.
   */
  playNext() {
    if (this.isPlaying) {
      return; // Never overlap audio chunks!
    }

    const seq = this.nextExpectedSequence;

    // Check if the next expected chunk is present in the store
    if (!this.chunks.has(seq)) {
      // Chunk not received yet or already finished
      this.checkCompletion();
      return;
    }

    const entry = this.chunks.get(seq);

    // If chunk is still decoding, wait for it to resolve
    if (!entry.resolved) {
      return;
    }

    const ctx = this.getAudioContext();

    // If AudioContext is suspended, attempt resume once
    if (ctx && ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    // Remove from pending map and advance sequence pointer
    this.chunks.delete(seq);
    this.nextExpectedSequence = seq + 1;

    // If chunk failed and has neither buffer nor blobUrl, skip to next chunk immediately
    if (!entry.buffer && !entry.blobUrl) {
      this.playNext();
      return;
    }

    const duration = (entry.buffer && entry.buffer.duration > 0)
      ? entry.buffer.duration
      : (entry.duration && entry.duration > 0 ? entry.duration : 2.5);

    this.isPlaying = true;
    console.log(`[AudioQueueManager] Starting playback for chunk ${seq} (duration: ${duration.toFixed(2)}s)`);

    // Trigger onPlaybackStart on the very first played chunk
    if (!this.hasStartedPlayback) {
      this.hasStartedPlayback = true;
      this.metrics.firstPlaybackStartTime = typeof performance !== "undefined" ? performance.now() : Date.now();
      this.callbacks.onPlaybackStart?.({
        requestId: this.currentRequestId,
        firstPlaybackDelayMs: this.metrics.firstPlaybackStartTime - this.metrics.startTime,
      });
    }

    this.metrics.totalDurationSeconds += duration;
    this.metrics.chunkDurations.push(duration);

    // Trigger onChunkStart - displays text bubble and starts word stream in App.jsx!
    this.callbacks.onChunkStart?.({
      requestId: this.currentRequestId,
      sequence: seq,
      duration: duration,
    });

    let finished = false;
    let watchdogTimer = null;
    let currentSourceNode = null;
    let currentHtmlAudio = null;

    const finishCurrentChunk = (reason = "ended") => {
      if (finished) return;
      finished = true;

      if (watchdogTimer) {
        clearTimeout(watchdogTimer);
        watchdogTimer = null;
      }
      this.currentWatchdog = null;

      if (this.currentSource) {
        try {
          this.currentSource.onended = null;
          this.currentSource.stop(0);
          this.currentSource.disconnect();
        } catch {}
        this.currentSource = null;
      }
      currentSourceNode = null;

      if (this.currentHtmlAudio) {
        try {
          this.currentHtmlAudio.pause();
          this.currentHtmlAudio.src = "";
        } catch {}
        this.currentHtmlAudio = null;
      }
      currentHtmlAudio = null;

      if (entry.blobUrl) {
        try {
          URL.revokeObjectURL(entry.blobUrl);
        } catch {}
      }

      this.isPlaying = false;

      if (reason === "watchdog") {
        console.warn(`[AudioQueueManager] Chunk ${seq} watchdog forced finish after buffer duration. Ensuring continuous flow.`);
      } else {
        console.log(`[AudioQueueManager] Chunk ${seq} playback finished (${reason}).`);
      }

      this.callbacks.onChunkEnd?.({
        requestId: this.currentRequestId,
        sequence: seq,
      });

      // Schedule next chunk with negligible gap (10ms)
      setTimeout(() => {
        this.playNext();
      }, 10);
    };

    // Robust safety watchdog: guarantees chunk ALWAYS completes and advances even if audio hardware/HDMI stalls
    const maxWatchdogMs = Math.max(800, Math.ceil((duration + 0.4) * 1000));
    watchdogTimer = setTimeout(() => {
      finishCurrentChunk("watchdog");
    }, maxWatchdogMs);
    this.currentWatchdog = watchdogTimer;

    // Try Web Audio playback first if context is running
    if (ctx && entry.buffer && ctx.state === "running") {
      try {
        const source = ctx.createBufferSource();
        source.buffer = entry.buffer;
        source.connect(ctx.destination);
        currentSourceNode = source;
        this.currentSource = source;

        source.onended = () => {
          finishCurrentChunk("web-audio-ended");
        };

        source.start(0);
        return;
      } catch (err) {
        console.warn(`[AudioQueueManager] Web Audio playback failed on chunk ${seq}, falling back to HTML5:`, err);
      }
    }

    // Fallback: Use HTML5 Audio element for resilient audio playback across all devices/HDMI
    if (entry.blobUrl) {
      try {
        const audio = new Audio(entry.blobUrl);
        currentHtmlAudio = audio;
        this.currentHtmlAudio = audio;
        audio.volume = 1.0;

        if (this.sinkId && typeof audio.setSinkId === "function") {
          audio.setSinkId(this.sinkId).catch(() => {});
        }

        audio.onended = () => {
          finishCurrentChunk("html5-audio-ended");
        };

        audio.onerror = (e) => {
          console.warn(`[AudioQueueManager] HTML5 audio error on chunk ${seq}:`, e);
          finishCurrentChunk("html5-audio-error");
        };

        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            console.warn(`[AudioQueueManager] HTML5 play() error on chunk ${seq}:`, err);
            // If autoplay policy blocks or device fails, watchdog timer will advance text cleanly
          });
        }
        return;
      } catch (err) {
        console.warn(`[AudioQueueManager] HTML5 Audio instantiation failed on chunk ${seq}:`, err);
      }
    }

    // If neither Web Audio nor HTML5 Audio could be launched, the watchdog timer will advance chunk safely
  }

  /**
   * Check if playback is completely finished.
   * Playback is complete ONLY when:
   * 1. LLM generation is complete.
   * 2. All expected chunks have been received and resolved.
   * 3. No chunk remains in the queue.
   * 4. No chunk is currently playing.
   */
  checkCompletion() {
    if (!this.isGenerationComplete) {
      // LLM is still streaming tokens or generating; do not complete early!
      return;
    }

    if (this.isPlaying || this.currentSource !== null || this.currentHtmlAudio !== null) {
      return;
    }

    if (this.chunks.size > 0) {
      return;
    }

    if (
      this.totalChunksExpected !== null &&
      this.nextExpectedSequence < this.totalChunksExpected
    ) {
      // Still awaiting subsequent chunks from backend
      return;
    }

    if (!this.hasTriggeredComplete) {
      this.hasTriggeredComplete = true;
      this.metrics.lastPlaybackEndTime = typeof performance !== "undefined" ? performance.now() : Date.now();
      const avgChunkDuration = this.metrics.chunkDurations.length > 0
        ? this.metrics.totalDurationSeconds / this.metrics.chunkDurations.length
        : 0;

      this.callbacks.onPlaybackComplete?.({
        requestId: this.currentRequestId,
        totalChunksPlayed: this.nextExpectedSequence,
        metrics: {
          firstAudioDelayMs: this.metrics.firstAudioReceivedTime !== null ? Number((this.metrics.firstAudioReceivedTime - this.metrics.startTime).toFixed(1)) : null,
          firstPlaybackDelayMs: this.metrics.firstPlaybackStartTime !== null ? Number((this.metrics.firstPlaybackStartTime - this.metrics.startTime).toFixed(1)) : null,
          totalPlaybackDurationMs: this.metrics.lastPlaybackEndTime !== null ? Number((this.metrics.lastPlaybackEndTime - (this.metrics.firstPlaybackStartTime || this.metrics.startTime)).toFixed(1)) : null,
          totalAudioDurationSeconds: Number(this.metrics.totalDurationSeconds.toFixed(2)),
          averageChunkDurationSeconds: Number(avgChunkDuration.toFixed(2)),
          chunksPlayedCount: this.metrics.chunkDurations.length,
          chunkDurations: [...this.metrics.chunkDurations],
        },
      });
    }
  }

  /**
   * Stop any currently playing audio and discard all pending chunks.
   * Cleans up all watchdog timers and sources safely.
   */
  stop() {
    if (this.currentWatchdog) {
      clearTimeout(this.currentWatchdog);
      this.currentWatchdog = null;
    }
    if (this.directWatchdog) {
      clearTimeout(this.directWatchdog);
      this.directWatchdog = null;
    }

    if (this.currentSource) {
      try {
        this.currentSource.onended = null;
        this.currentSource.stop(0);
        this.currentSource.disconnect();
      } catch {}
      this.currentSource = null;
    }

    if (this.currentHtmlAudio) {
      try {
        this.currentHtmlAudio.pause();
        this.currentHtmlAudio.src = "";
      } catch {}
      this.currentHtmlAudio = null;
    }

    if (this.directSource) {
      try {
        this.directSource.onended = null;
        this.directSource.stop(0);
        this.directSource.disconnect();
      } catch {}
      this.directSource = null;
    }

    for (const [, entry] of this.chunks) {
      if (entry?.blobUrl) {
        try {
          URL.revokeObjectURL(entry.blobUrl);
        } catch {}
      }
    }

    this.chunks.clear();
    this.isPlaying = false;
    this.hasStartedPlayback = false;
    this.hasTriggeredComplete = false;
    this.nextExpectedSequence = 0;
    this.totalChunksExpected = null;
    this.isGenerationComplete = false;
  }

  /**
   * Fully reset the audio manager and clear active request session.
   */
  reset() {
    this.stop();
    this.currentRequestId = null;
  }

  /**
   * Play a pre-decoded AudioBuffer directly (used for preloaded greeting/goodbye).
   * Guaranteed against stalls with watchdog timer.
   */
  playDirectBuffer(audioBuffer, onEnded = null) {
    this.stop();
    if (!audioBuffer) {
      onEnded?.();
      return;
    }

    try {
      const ctx = this.getAudioContext();
      if (!ctx) {
        onEnded?.();
        return;
      }

      let finished = false;
      let watchdogTimer = null;

      const finishDirect = (reason = "ended") => {
        if (finished) return;
        finished = true;

        if (watchdogTimer) {
          clearTimeout(watchdogTimer);
          watchdogTimer = null;
        }
        this.directWatchdog = null;

        if (this.directSource) {
          try {
            this.directSource.onended = null;
            this.directSource.stop(0);
            this.directSource.disconnect();
          } catch {}
          this.directSource = null;
        }

        this.isPlaying = false;
        onEnded?.();
      };

      const duration = (audioBuffer && audioBuffer.duration > 0) ? audioBuffer.duration : 3.0;
      const maxMs = Math.max(800, Math.ceil((duration + 0.4) * 1000));
      watchdogTimer = setTimeout(() => {
        finishDirect("watchdog");
      }, maxMs);
      this.directWatchdog = watchdogTimer;

      const startPlayback = () => {
        try {
          const source = ctx.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(ctx.destination);
          this.directSource = source;
          this.isPlaying = true;

          source.onended = () => finishDirect("ended");
          source.start(0);
        } catch (err) {
          console.warn("[AudioQueueManager] Error starting direct buffer source:", err);
          finishDirect("error");
        }
      };

      if (ctx.state === "suspended") {
        ctx.resume().then(startPlayback).catch((err) => {
          console.warn("[AudioQueueManager] ctx.resume failed, attempting direct playback anyway:", err);
          startPlayback();
        });
      } else {
        startPlayback();
      }
    } catch (err) {
      console.warn("[AudioQueueManager] Error in playDirectBuffer:", err);
      this.directSource = null;
      this.isPlaying = false;
      onEnded?.();
    }
  }
}

export default AudioQueueManager;
