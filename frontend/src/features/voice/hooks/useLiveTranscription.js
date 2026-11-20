import { useRef, useState, useCallback, useEffect } from "react";
import { ZENO_STATES } from "../../../components/ZenoCharacter";
import {
  downsampleTo24k,
  floatTo16BitPCM,
  getSupportedMimeType,
} from "../../../utils/audioUtils";
import { combineDeltas, createRequestId } from "../../../utils/textUtils";
import {
  VAD_CONFIG,
  TRANSCRIBE_WS_URL,
} from "../../../constants/audioConstants";
import { NO_SPEECH_TIMEOUT_MS } from "../../../constants/appConstants";

export function useLiveTranscription({
  onSendMessage,
  onNoSpeechTimeout,
  input,
  setInput,
  setCharacterState,
  characterStateRef,
  getPlaybackAudioContext,
  stopAudioPlayback,
  activeRequestIdRef,
  socketRef,
  setLoading,
  setMessages,
  setSpokenBubbles,
  loadingRef,
  isPlayingAudioRef,
}) {
  const [isRecording, setIsRecording] = useState(false);
  const isRecordingRef = useRef(false);
  const [liveTranscript, setLiveTranscript] = useState("");
  const liveTranscriptRef = useRef("");
  const [vadStatus, setVadStatus] = useState("idle");
  const [liveAudioLevel, setLiveAudioLevel] = useState(0);
  const [micError, setMicError] = useState(null);

  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const activeRecordingIdRef = useRef(null);
  const lastDeltaTimestampRef = useRef(null);
  const initialInputRef = useRef("");
  const isSubmittingRef = useRef(false);

  // Web Audio VAD & Analyser refs
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceNodeRef = useRef(null);
  const scriptProcessorRef = useRef(null);
  const muteGainRef = useRef(null);
  const vadAnimationRef = useRef(null);
  const vadStateRef = useRef(null);
  const vadIntervalRef = useRef(null);
  const currentAudioLevelRef = useRef(0);
  const transcribeWsRef = useRef(null);

  const closeTranscribeSocket = useCallback(() => {
    if (transcribeWsRef.current) {
      try {
        if (
          transcribeWsRef.current.readyState === WebSocket.OPEN ||
          transcribeWsRef.current.readyState === WebSocket.CONNECTING
        ) {
          transcribeWsRef.current.close();
        }
      } catch {
        // Ignore close errors
      }
      transcribeWsRef.current = null;
    }
  }, []);

  const cleanupAudioNodes = useCallback(
    (closeSocket = false) => {
      if (vadIntervalRef.current) {
        clearInterval(vadIntervalRef.current);
        vadIntervalRef.current = null;
      }
      if (vadAnimationRef.current) {
        cancelAnimationFrame(vadAnimationRef.current);
        vadAnimationRef.current = null;
      }
      if (scriptProcessorRef.current) {
        try {
          scriptProcessorRef.current.disconnect();
        } catch {
          // Ignore
        }
        scriptProcessorRef.current.onaudioprocess = null;
        scriptProcessorRef.current = null;
      }
      if (muteGainRef.current) {
        try {
          muteGainRef.current.disconnect();
        } catch {
          // Ignore
        }
        muteGainRef.current = null;
      }
      if (sourceNodeRef.current) {
        try {
          sourceNodeRef.current.disconnect();
        } catch {
          // Ignore
        }
        sourceNodeRef.current = null;
      }
      if (analyserRef.current) {
        try {
          analyserRef.current.disconnect();
        } catch {
          // Ignore
        }
        analyserRef.current = null;
      }
      if (audioContextRef.current) {
        try {
          if (audioContextRef.current.state !== "closed") {
            audioContextRef.current.close();
          }
        } catch {
          // Ignore
        }
        audioContextRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (closeSocket) {
        closeTranscribeSocket();
      }
    },
    [closeTranscribeSocket]
  );

  const cancelRecording = useCallback(
    (reason = null) => {
      isSubmittingRef.current = true;
      if (vadIntervalRef.current) {
        clearInterval(vadIntervalRef.current);
        vadIntervalRef.current = null;
      }
      if (vadStateRef.current) {
        vadStateRef.current.isFinished = true;
      }
      if (
        transcribeWsRef.current &&
        transcribeWsRef.current.readyState === WebSocket.OPEN
      ) {
        try {
          transcribeWsRef.current.send(
            JSON.stringify({
              type: "cancel",
              recording_id: activeRecordingIdRef.current,
            })
          );
        } catch {
          // Ignore
        }
      }
      activeRecordingIdRef.current = null;
      closeTranscribeSocket();
      chunksRef.current = [];
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== "inactive"
      ) {
        try {
          mediaRecorderRef.current.stop();
        } catch {
          // Ignore
        }
      }

      cleanupAudioNodes(true);
      setIsRecording(false);
      isRecordingRef.current = false;
      setVadStatus("idle");
      setLiveAudioLevel(0);
      setLiveTranscript("");
      liveTranscriptRef.current = "";
      lastDeltaTimestampRef.current = null;
      if (initialInputRef.current) {
        setInput(initialInputRef.current);
      }

      if (typeof reason === "string" && reason.trim()) {
        setMicError(reason);
      } else {
        setMicError(null);
      }
      setTimeout(() => {
        isSubmittingRef.current = false;
      }, 200);
    },
    [cleanupAudioNodes, closeTranscribeSocket, setInput]
  );

  const stopAndSubmit = useCallback(
    (directText = null) => {
      if (isSubmittingRef.current) return;
      isSubmittingRef.current = true;

      if (vadIntervalRef.current) {
        clearInterval(vadIntervalRef.current);
        vadIntervalRef.current = null;
      }
      if (vadStateRef.current) {
        vadStateRef.current.isFinished = true;
      }

      const textCandidate = (
        directText ||
        liveTranscriptRef.current ||
        liveTranscript ||
        input
      ).trim();

      cleanupAudioNodes(false);
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== "inactive"
      ) {
        try {
          mediaRecorderRef.current.stop();
        } catch {
          // Ignore
        }
      }
      setIsRecording(false);
      isRecordingRef.current = false;
      setVadStatus("idle");
      setLiveAudioLevel(0);

      if (textCandidate) {
        getPlaybackAudioContext?.();
        setLiveTranscript(textCandidate);
        liveTranscriptRef.current = "";
        lastDeltaTimestampRef.current = null;
        initialInputRef.current = "";
        setInput("");

        setCharacterState(ZENO_STATES.THINKING);
        if (characterStateRef) characterStateRef.current = ZENO_STATES.THINKING;

        if (
          transcribeWsRef.current &&
          transcribeWsRef.current.readyState === WebSocket.OPEN
        ) {
          try {
            transcribeWsRef.current.send(
              JSON.stringify({
                type: "commit",
                recording_id: activeRecordingIdRef.current,
              })
            );
          } catch {
            // Ignore
          }
        }

        onSendMessage?.(textCandidate);

        setTimeout(() => {
          closeTranscribeSocket();
          isSubmittingRef.current = false;
        }, 400);
      } else {
        console.log("[Zeno] No words transcribed yet. Keeping microphone open...");
        isSubmittingRef.current = false;
        if (vadStateRef.current) {
          vadStateRef.current.hasSpoken = false;
          vadStateRef.current.silenceStartTime = null;
          vadStateRef.current.isFinished = false;
        }
        setVadStatus("listening");
        setCharacterState(ZENO_STATES.LISTENING);
        if (characterStateRef) characterStateRef.current = ZENO_STATES.LISTENING;
      }
    },
    [
      characterStateRef,
      cleanupAudioNodes,
      closeTranscribeSocket,
      getPlaybackAudioContext,
      input,
      liveTranscript,
      onSendMessage,
      setCharacterState,
      setInput,
    ]
  );

  const startRecording = useCallback(async () => {
    setMicError(null);
    getPlaybackAudioContext?.();

    // Guard: Clean up any existing recording session first
    if (isRecordingRef.current) {
      cleanupAudioNodes(true);
      isRecordingRef.current = false;
      setIsRecording(false);
    }

    // If speech is playing, clicking mic acts as an interrupt
    if (loadingRef?.current || isPlayingAudioRef?.current) {
      stopAudioPlayback?.();
      const cancelReqId = activeRequestIdRef?.current;
      if (socketRef?.current?.readyState === WebSocket.OPEN && cancelReqId) {
        socketRef.current.send(
          JSON.stringify({
            type: "cancel_generation",
            request_id: cancelReqId,
          })
        );
      }
      if (activeRequestIdRef) activeRequestIdRef.current = null;
      setLoading?.(false);
      setMessages?.((prev) =>
        prev.map((msg) => (msg.streaming ? { ...msg, streaming: false } : msg))
      );
    }

    // Set character to Listening animation
    setCharacterState(ZENO_STATES.LISTENING);
    if (characterStateRef) characterStateRef.current = ZENO_STATES.LISTENING;
    setSpokenBubbles?.([]);

    setMicError(null);
    setLiveTranscript("");
    liveTranscriptRef.current = "";
    lastDeltaTimestampRef.current = null;
    initialInputRef.current = input;
    isRecordingRef.current = true;

    const newRecordingId = createRequestId();
    activeRecordingIdRef.current = newRecordingId;

    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia ||
      typeof MediaRecorder === "undefined"
    ) {
      if (typeof window !== "undefined" && !window.isSecureContext) {
        setMicError(
          `Microphone is blocked by Chrome on HTTP over Wi-Fi (${window.location.hostname}). To enable: open chrome://flags/#unsafely-treat-insecure-origin-as-secure, add ${window.location.origin}, enable and relaunch.`
        );
      } else {
        setMicError(
          "Microphone recording is not supported or was blocked by this browser."
        );
      }
      setCharacterState(ZENO_STATES.SAD);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      try {
        const transcribeWs = new WebSocket(
          `${TRANSCRIBE_WS_URL}?recording_id=${newRecordingId}`
        );
        transcribeWs.binaryType = "arraybuffer";
        transcribeWsRef.current = transcribeWs;

        transcribeWs.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (
              data.recording_id &&
              data.recording_id !== activeRecordingIdRef.current
            ) {
              return;
            }

            if (data.type === "transcript_delta") {
              const now = Date.now();
              lastDeltaTimestampRef.current = now;
              if (vadStateRef.current) {
                vadStateRef.current.hasSpoken = true;
                vadStateRef.current.silenceStartTime = null;
              }
              const updated = combineDeltas(
                liveTranscriptRef.current,
                data.delta
              );
              liveTranscriptRef.current = updated;
              setLiveTranscript(updated);

              const prefix = initialInputRef.current
                ? `${initialInputRef.current.trim()} `
                : "";
              setInput(prefix + updated.trimStart());
            } else if (data.type === "transcript_complete") {
              const completedText = (data.transcript || "").trim();
              if (completedText) {
                liveTranscriptRef.current = completedText;
                stopAndSubmit(completedText);
              } else if (isRecordingRef.current) {
                if (liveTranscriptRef.current.trim()) {
                  stopAndSubmit(liveTranscriptRef.current);
                } else {
                  onNoSpeechTimeout?.();
                }
              }
            } else if (data.type === "error") {
              setMicError(
                `Transcription error: ${data.message || "Failed to transcribe audio."}`
              );
              setCharacterState(ZENO_STATES.SAD);
              closeTranscribeSocket();
            }
          } catch {
            // Ignore parse errors
          }
        };
      } catch (err) {
        console.warn("Could not initiate transcription socket:", err);
      }

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      let audioContext;
      try {
        audioContext = new AudioCtx({ sampleRate: 24000 });
      } catch {
        audioContext = new AudioCtx();
      }
      if (audioContext.state === "suspended") {
        await audioContext.resume();
      }
      audioContextRef.current = audioContext;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = VAD_CONFIG.fftSize;
      analyser.smoothingTimeConstant = VAD_CONFIG.smoothingTimeConstant;
      analyserRef.current = analyser;

      const sourceNode = audioContext.createMediaStreamSource(stream);
      sourceNodeRef.current = sourceNode;

      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      scriptProcessorRef.current = processor;

      const muteGain = audioContext.createGain();
      muteGain.gain.value = 0;
      muteGainRef.current = muteGain;

      sourceNode.connect(analyser);
      analyser.connect(processor);
      processor.connect(muteGain);
      muteGain.connect(audioContext.destination);

      processor.onaudioprocess = (e) => {
        const inputChannel = e.inputBuffer.getChannelData(0);

        let sumSquares = 0;
        for (let i = 0; i < inputChannel.length; i++) {
          sumSquares += inputChannel[i] * inputChannel[i];
        }
        const rms = Math.sqrt(sumSquares / inputChannel.length);
        const level = Math.min(100, Math.round(rms * 400));
        currentAudioLevelRef.current = level;

        const now = Date.now();
        if (vadStateRef.current && !vadStateRef.current.isFinished) {
          if (
            level >= VAD_CONFIG.speechThreshold ||
            rms >= VAD_CONFIG.rmsThreshold
          ) {
            vadStateRef.current.hasSpoken = true;
            vadStateRef.current.silenceStartTime = null;
            vadStateRef.current.totalSpeechTime += 100;
            setVadStatus("speaking");
          } else if (vadStateRef.current.hasSpoken) {
            if (vadStateRef.current.silenceStartTime === null) {
              vadStateRef.current.silenceStartTime = now;
            }
            setVadStatus("pausing");
          }
        }

        if (
          transcribeWsRef.current &&
          transcribeWsRef.current.readyState === WebSocket.OPEN
        ) {
          const resampled = downsampleTo24k(
            inputChannel,
            audioContext.sampleRate
          );
          const pcmBuffer = floatTo16BitPCM(resampled);
          transcribeWsRef.current.send(pcmBuffer);
        }
      };

      const mimeType = getSupportedMimeType();
      const options = mimeType ? { mimeType } : undefined;
      const recorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        cleanupAudioNodes(false);
        setIsRecording(false);
        isRecordingRef.current = false;
        setVadStatus("idle");
        setLiveAudioLevel(0);
      };

      recorder.onerror = (event) => {
        setMicError(
          `Microphone recording error: ${event.error?.message || "Unknown error"}`
        );
        setCharacterState(ZENO_STATES.SAD);
        cancelRecording();
      };

      recorder.start(100);
      setIsRecording(true);
      isRecordingRef.current = true;
      setVadStatus("listening");

      const vadState = {
        hasSpoken: false,
        silenceStartTime: null,
        totalSpeechTime: 0,
        recordingStartTime: Date.now(),
        isFinished: false,
      };
      vadStateRef.current = vadState;

      const vadInterval = setInterval(() => {
        if (!isRecordingRef.current || isSubmittingRef.current) {
          clearInterval(vadInterval);
          return;
        }

        const now = Date.now();
        const state = vadStateRef.current;
        if (!state || state.isFinished) {
          clearInterval(vadInterval);
          return;
        }

        const hasRecognizedWords = Boolean(
          liveTranscriptRef.current &&
            liveTranscriptRef.current.trim().length > 0
        );
        if (hasRecognizedWords) {
          state.hasSpoken = true;
        }

        if (!state.hasSpoken) {
          const initialElapsed = now - state.recordingStartTime;
          if (initialElapsed >= NO_SPEECH_TIMEOUT_MS) {
            clearInterval(vadInterval);
            onNoSpeechTimeout?.();
            return;
          }
        }

        const transcriptText = (liveTranscriptRef.current || "").trim();
        const trailingCutOff = Boolean(
          transcriptText &&
            /\b(and|or|but|to|the|a|an|is|are|was|were|of|in|for|with|about|that|which|who|whom|at|by|from|on|into|because|so|if|than|like|also|what\s+about)\s*$/i.test(
              transcriptText
            )
        );
        const effectiveSilenceMs = trailingCutOff
          ? 3200
          : VAD_CONFIG.silenceDurationMs;

        const deltaElapsed = lastDeltaTimestampRef.current
          ? now - lastDeltaTimestampRef.current
          : null;

        if (
          hasRecognizedWords &&
          deltaElapsed !== null &&
          deltaElapsed >= effectiveSilenceMs
        ) {
          clearInterval(vadInterval);
          stopAndSubmit();
          return;
        }

        const hasTranscribedText = Boolean(
          transcriptText && transcriptText.length > 0
        );

        if (
          hasTranscribedText &&
          state.hasSpoken &&
          state.silenceStartTime !== null
        ) {
          const silenceElapsed = now - state.silenceStartTime;
          if (silenceElapsed >= effectiveSilenceMs) {
            clearInterval(vadInterval);
            stopAndSubmit();
            return;
          }
        }

        if (now - state.recordingStartTime >= VAD_CONFIG.maxRecordingDurationMs) {
          clearInterval(vadInterval);
          stopAndSubmit();
          return;
        }
      }, 50);
      vadIntervalRef.current = vadInterval;

      let lastVisualizerUpdate = 0;
      const runVisualizerLoop = (timestamp) => {
        if (!isRecordingRef.current) return;
        if (!timestamp || timestamp - lastVisualizerUpdate >= 45) {
          lastVisualizerUpdate = timestamp || performance.now();
          setLiveAudioLevel(currentAudioLevelRef.current);
        }
        vadAnimationRef.current = requestAnimationFrame(runVisualizerLoop);
      };
      vadAnimationRef.current = requestAnimationFrame(runVisualizerLoop);
    } catch (err) {
      cleanupAudioNodes(true);
      setIsRecording(false);
      isRecordingRef.current = false;
      setVadStatus("idle");
      setLiveAudioLevel(0);
      setCharacterState(ZENO_STATES.SAD);
      if (
        err.name === "NotAllowedError" ||
        err.name === "PermissionDeniedError"
      ) {
        if (typeof window !== "undefined" && !window.isSecureContext) {
          setMicError(
            `Microphone access is blocked by browser security on HTTP (${window.location.hostname}). Open chrome://flags/#unsafely-treat-insecure-origin-as-secure, add ${window.location.origin}, enable and relaunch.`
          );
        } else {
          setMicError(
            "Microphone access was denied. Please allow microphone permissions in your browser."
          );
        }
      } else if (
        err.name === "NotFoundError" ||
        err.name === "DevicesNotFoundError"
      ) {
        setMicError("No microphone device was detected on your system.");
      } else {
        setMicError(`Unable to start microphone: ${err.message || err.name}`);
      }
    }
  }, [
    activeRequestIdRef,
    cancelRecording,
    characterStateRef,
    cleanupAudioNodes,
    closeTranscribeSocket,
    getPlaybackAudioContext,
    input,
    isPlayingAudioRef,
    loadingRef,
    onNoSpeechTimeout,
    setCharacterState,
    setInput,
    setLoading,
    setMessages,
    setSpokenBubbles,
    socketRef,
    stopAndSubmit,
    stopAudioPlayback,
  ]);

  const handleToggleMic = useCallback(() => {
    if (isPlayingAudioRef?.current) {
      stopAudioPlayback?.();
      return;
    }

    if (isRecordingRef.current) {
      console.log("[Zeno] User manually clicked mic button while recording.");
      const textCandidate = (
        liveTranscriptRef.current ||
        liveTranscript ||
        input
      ).trim();

      if (textCandidate) {
        stopAndSubmit(textCandidate);
      } else {
        console.log("[Zeno] Turning off microphone manually.");
        cancelRecording();
      }
      return;
    }

    startRecording();
  }, [
    cancelRecording,
    input,
    isPlayingAudioRef,
    liveTranscript,
    startRecording,
    stopAndSubmit,
    stopAudioPlayback,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupAudioNodes(true);
    };
  }, [cleanupAudioNodes]);

  return {
    isRecording,
    isRecordingRef,
    liveTranscript,
    liveTranscriptRef,
    vadStatus,
    liveAudioLevel,
    micError,
    setMicError,
    startRecording,
    stopAndSubmit,
    cancelRecording,
    cleanupAudioNodes,
    handleToggleMic,
  };
}
