import { useEffect, useRef, useState, useCallback } from "react";
import { AudioQueueManager } from "../../../audioQueueManager";
import { decodeAudioBuffer } from "../../../utils/audioUtils";
import { ZENO_STATES } from "../../../components/ZenoCharacter";
import {
  greetingAudioSrc,
  goodbyeAudioSrc,
  BUNDLED_INDUSTRY_GREETINGS,
} from "../../../constants/audioConstants";

export function useAudioPlayback({
  onAllAudioCompleted,
  clearThinkingSteps,
  setCharacterState,
  characterStateRef,
  isGreetingTurnRef,
  isDismissalTurnRef,
  isEndingConversation,
  loadingRef,
}) {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const isPlayingAudioRef = useRef(false);
  const audioQueueManagerRef = useRef(null);
  const timingMetricsRef = useRef(new Map());
  const standaloneAudioRef = useRef(null);

  const preloadedGreetingBufferRef = useRef(null);
  const preloadedGoodbyeBufferRef = useRef(null);
  const preloadedIndustryBuffersRef = useRef({});

  // Word-by-word streaming state
  const [spokenBubbles, setSpokenBubbles] = useState([]);
  const [activeBubbleIndex, setActiveBubbleIndex] = useState(0);
  const [streamingBubbleDelta, setStreamingBubbleDelta] = useState("");
  const sentenceTextsRef = useRef(new Map());
  const wordStreamTimerRef = useRef(null);
  const pendingSpeechStreamRef = useRef(null);

  // Audio Device Selection
  const [isAudioSettingsOpen, setIsAudioSettingsOpen] = useState(false);
  const [audioOutputDevices, setAudioOutputDevices] = useState([]);
  const [selectedSinkId, setSelectedSinkId] = useState(() =>
    typeof localStorage !== "undefined"
      ? localStorage.getItem("zeno_audio_sink_id") || "default"
      : "default"
  );
  const [isTestingAudio, setIsTestingAudio] = useState(false);

  const stopWordStreamTimer = useCallback(() => {
    if (wordStreamTimerRef.current) {
      clearInterval(wordStreamTimerRef.current);
      wordStreamTimerRef.current = null;
    }
  }, []);

  const startSpeakingWordStream = useCallback(
    (sequence, fullText, duration, isGreeting = false) => {
      stopWordStreamTimer();
      if (!fullText || typeof fullText !== "string") return;
      if (isEndingConversation || isDismissalTurnRef.current) return;

      const isGreetingMsg = Boolean(isGreeting || isGreetingTurnRef.current);
      const cleanText = fullText.replace(/[*_#`]/g, "").trim();
      if (!cleanText) return;

      const words = cleanText.split(/\s+/).filter(Boolean);
      if (words.length === 0) return;

      const bubbleId = `bubble-seq-${sequence}`;
      const chunkDuration =
        duration && duration > 0 ? duration : Math.max(words.length * 0.28, 1.8);
      const totalPacingMs = chunkDuration * 1000 * 0.88;
      const intervalMs = Math.max(
        Math.min(Math.floor(totalPacingMs / Math.max(words.length, 1)), 350),
        60
      );

      setSpokenBubbles((prev) => {
        const next = [...prev];
        next[sequence] = {
          id: bubbleId,
          sequence,
          text: words[0],
          isStreaming: words.length > 1,
          isActive: true,
          isGreeting: isGreetingMsg,
        };
        return next;
      });

      if (words.length <= 1) return;

      let currentWordIdx = 1;
      wordStreamTimerRef.current = setInterval(() => {
        if (currentWordIdx < words.length) {
          const displayedText = words.slice(0, currentWordIdx + 1).join(" ");
          const stillStreaming = currentWordIdx < words.length - 1;
          setSpokenBubbles((prev) => {
            const next = [...prev];
            if (next[sequence]) {
              next[sequence] = {
                ...next[sequence],
                text: displayedText,
                isStreaming: stillStreaming,
                isActive: true,
                isGreeting: isGreetingMsg,
              };
            }
            return next;
          });
          currentWordIdx++;
        } else {
          stopWordStreamTimer();
        }
      }, intervalMs);
    },
    [isEndingConversation, isDismissalTurnRef, isGreetingTurnRef, stopWordStreamTimer]
  );

  const getPlaybackAudioContext = useCallback(() => {
    return audioQueueManagerRef.current?.getAudioContext();
  }, []);

  const stopAudioPlayback = useCallback(() => {
    stopWordStreamTimer();
    pendingSpeechStreamRef.current = null;
    if (audioQueueManagerRef.current) {
      audioQueueManagerRef.current.stop();
    }
    if (standaloneAudioRef.current) {
      try {
        standaloneAudioRef.current.pause();
        standaloneAudioRef.current.currentTime = 0;
      } catch {}
      standaloneAudioRef.current = null;
    }
    isPlayingAudioRef.current = false;
    setIsPlayingAudio(false);
  }, [stopWordStreamTimer]);

  // Initialize AudioQueueManager once
  if (!audioQueueManagerRef.current) {
    audioQueueManagerRef.current = new AudioQueueManager({
      sinkId:
        typeof localStorage !== "undefined"
          ? localStorage.getItem("zeno_audio_sink_id")
          : null,
      onPlaybackStart: ({ requestId }) => {
        const m = timingMetricsRef.current.get(requestId);
        if (m && m.t_first_audio_playback === null) {
          m.t_first_audio_playback = performance.now();
        }
        setIsPlayingAudio(true);
        isPlayingAudioRef.current = true;
        if (!isGreetingTurnRef.current) {
          setCharacterState(ZENO_STATES.TALKING);
          characterStateRef.current = ZENO_STATES.TALKING;
        }
      },
      onChunkStart: ({ requestId, sequence, duration }) => {
        clearThinkingSteps();
        setIsPlayingAudio(true);
        isPlayingAudioRef.current = true;
        setActiveBubbleIndex(sequence);
        if (!isGreetingTurnRef.current) {
          setCharacterState(ZENO_STATES.TALKING);
          characterStateRef.current = ZENO_STATES.TALKING;
        }

        if (isDismissalTurnRef.current || isEndingConversation) {
          setSpokenBubbles([]);
          pendingSpeechStreamRef.current = null;
          return;
        }

        const entry = sentenceTextsRef.current.get(sequence);
        if (entry && entry.text) {
          startSpeakingWordStream(sequence, entry.text, duration);
          pendingSpeechStreamRef.current = null;
        } else {
          pendingSpeechStreamRef.current = { requestId, sequence, duration };
        }
      },
      onChunkEnd: ({ sequence }) => {
        stopWordStreamTimer();
        if (isDismissalTurnRef.current || isEndingConversation) {
          setSpokenBubbles([]);
          return;
        }

        const entry = sentenceTextsRef.current.get(sequence);
        const fullText = entry ? entry.text : null;

        setSpokenBubbles((prev) => {
          const next = [...prev];
          if (next[sequence]) {
            next[sequence] = {
              ...next[sequence],
              text: fullText ? fullText.replace(/[*_#`]/g, "").trim() : next[sequence].text,
              isStreaming: false,
              isActive: false,
              isGreeting: Boolean(isGreetingTurnRef.current || next[sequence].isGreeting),
            };
          }
          return next;
        });

        if (loadingRef.current && audioQueueManagerRef.current?.chunks.size === 0) {
          setCharacterState(ZENO_STATES.THINKING);
          characterStateRef.current = ZENO_STATES.THINKING;
        }
      },
      onPlaybackComplete: ({ requestId }) => {
        stopWordStreamTimer();
        pendingSpeechStreamRef.current = null;

        setSpokenBubbles((prev) =>
          prev.map((b) => (b ? { ...b, isActive: false, isStreaming: false } : b))
        );

        const m = timingMetricsRef.current.get(requestId);
        if (m) {
          m.t_last_audio_playback = performance.now();
        }
        setIsPlayingAudio(false);
        isPlayingAudioRef.current = false;
        onAllAudioCompleted?.();
      },
      onPlaybackError: ({ sequence, error }) => {
        console.warn(`[Zeno Audio] Error on chunk ${sequence}:`, error);
      },
    });
  }

  // Pre-decode audio assets in memory on mount
  useEffect(() => {
    const ctx = getPlaybackAudioContext();
    fetch(greetingAudioSrc)
      .then((res) => res.arrayBuffer())
      .then((arr) => {
        if (ctx) return decodeAudioBuffer(ctx, arr);
      })
      .then((buf) => {
        if (buf) preloadedGreetingBufferRef.current = buf;
      })
      .catch(() => {});

    fetch(goodbyeAudioSrc)
      .then((res) => res.arrayBuffer())
      .then((arr) => {
        if (ctx) return decodeAudioBuffer(ctx, arr);
      })
      .then((buf) => {
        if (buf) preloadedGoodbyeBufferRef.current = buf;
      })
      .catch(() => {});

    Object.entries(BUNDLED_INDUSTRY_GREETINGS).forEach(([indId, audioSrc]) => {
      fetch(audioSrc)
        .then((res) => res.arrayBuffer())
        .then((arr) => {
          if (ctx) return decodeAudioBuffer(ctx, arr);
        })
        .then((buf) => {
          if (buf) preloadedIndustryBuffersRef.current[indId] = buf;
        })
        .catch(() => {});
    });
  }, [getPlaybackAudioContext]);

  // Audio Device Selection
  useEffect(() => {
    const updateAudioDevices = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return;
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const outputs = devices.filter((d) => d.kind === "audiooutput");
        setAudioOutputDevices(outputs);
      } catch {}
    };

    updateAudioDevices();
    navigator.mediaDevices?.addEventListener("devicechange", updateAudioDevices);
    return () => {
      navigator.mediaDevices?.removeEventListener("devicechange", updateAudioDevices);
    };
  }, []);

  const handleAudioSinkChange = (newSinkId) => {
    setSelectedSinkId(newSinkId);
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("zeno_audio_sink_id", newSinkId);
    }
    if (audioQueueManagerRef.current) {
      audioQueueManagerRef.current.setSinkId(newSinkId);
    }
    if (standaloneAudioRef.current && typeof standaloneAudioRef.current.setSinkId === "function") {
      standaloneAudioRef.current.setSinkId(newSinkId).catch(() => {});
    }
  };

  const handleTestAudio = () => {
    setIsTestingAudio(true);
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        const testCtx = new AudioCtx();
        if (selectedSinkId && selectedSinkId !== "default" && typeof testCtx.setSinkId === "function") {
          testCtx.setSinkId(selectedSinkId).catch(() => {});
        }
        if (testCtx.state === "suspended") {
          testCtx.resume().catch(() => {});
        }
        const now = testCtx.currentTime;
        [523.25, 659.25, 783.99].forEach((freq, idx) => {
          const osc = testCtx.createOscillator();
          const gain = testCtx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, now + idx * 0.14);
          gain.gain.setValueAtTime(0.25, now + idx * 0.14);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.14 + 0.35);
          osc.connect(gain);
          gain.connect(testCtx.destination);
          osc.start(now + idx * 0.14);
          osc.stop(now + idx * 0.14 + 0.38);
        });
        setTimeout(() => {
          try {
            testCtx.close();
          } catch {}
        }, 1500);
      }
    } catch {}
    setTimeout(() => {
      setIsTestingAudio(false);
    }, 1200);
  };

  const playStandaloneAudio = (audioSrc, audioBuffer, onEndedCallback, maxWatchdogMs = 12000) => {
    let settled = false;
    let safetyTimer = null;

    const handleEnded = () => {
      if (settled) return;
      settled = true;
      if (safetyTimer) {
        clearTimeout(safetyTimer);
        safetyTimer = null;
      }
      isPlayingAudioRef.current = false;
      setIsPlayingAudio(false);
      standaloneAudioRef.current = null;
      onEndedCallback?.();
    };

    safetyTimer = setTimeout(() => {
      handleEnded();
    }, maxWatchdogMs);

    setIsPlayingAudio(true);
    isPlayingAudioRef.current = true;

    try {
      if (audioBuffer && audioQueueManagerRef.current) {
        const playedDirectly = audioQueueManagerRef.current.playDirectBuffer(audioBuffer, handleEnded);
        if (playedDirectly) return;
      }

      if (!audioSrc) {
        handleEnded();
        return;
      }

      const audio = new Audio(audioSrc);
      standaloneAudioRef.current = audio;
      audio.volume = 1.0;

      if (selectedSinkId && selectedSinkId !== "default" && typeof audio.setSinkId === "function") {
        audio.setSinkId(selectedSinkId).catch(() => {});
      }

      audio.onended = () => {
        standaloneAudioRef.current = null;
        handleEnded();
      };

      audio.onerror = () => {
        standaloneAudioRef.current = null;
        if (audioBuffer && audioQueueManagerRef.current) {
          audioQueueManagerRef.current.playDirectBuffer(audioBuffer, handleEnded);
        } else {
          handleEnded();
        }
      };

      audio.play().catch(() => {
        standaloneAudioRef.current = null;
        if (audioBuffer && audioQueueManagerRef.current) {
          audioQueueManagerRef.current.playDirectBuffer(audioBuffer, handleEnded);
        } else {
          handleEnded();
        }
      });
    } catch {
      handleEnded();
    }
  };

  return {
    isPlayingAudio,
    isPlayingAudioRef,
    audioQueueManagerRef,
    timingMetricsRef,
    standaloneAudioRef,
    preloadedGreetingBufferRef,
    preloadedGoodbyeBufferRef,
    preloadedIndustryBuffersRef,
    spokenBubbles,
    setSpokenBubbles,
    activeBubbleIndex,
    setActiveBubbleIndex,
    streamingBubbleDelta,
    setStreamingBubbleDelta,
    sentenceTextsRef,
    pendingSpeechStreamRef,
    isAudioSettingsOpen,
    setIsAudioSettingsOpen,
    audioOutputDevices,
    selectedSinkId,
    isTestingAudio,
    getPlaybackAudioContext,
    stopAudioPlayback,
    stopWordStreamTimer,
    startSpeakingWordStream,
    handleAudioSinkChange,
    handleTestAudio,
    playStandaloneAudio,
  };
}
