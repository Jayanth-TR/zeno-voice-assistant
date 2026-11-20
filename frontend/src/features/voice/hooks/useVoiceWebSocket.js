import { useRef, useState, useEffect, useCallback } from "react";
import { ZENO_STATES } from "../../../components/ZenoCharacter";
import {
  GREETING_TEXT,
  GOODBYE_TEXT,
  INITIAL_MESSAGE,
  isGreetingText,
  isNegativeDismissalText,
} from "../../../constants/appConstants";
import {
  getVoiceWsUrls,
  greetingAudioSrc,
} from "../../../constants/audioConstants";
import { createRequestId } from "../../../utils/textUtils";
import { decodeAudioBuffer } from "../../../utils/audioUtils";

export function useVoiceWebSocket({
  audioQueueManagerRef,
  timingMetricsRef,
  preloadedGreetingBufferRef,
  preloadedGoodbyeBufferRef,
  setCharacterState,
  characterStateRef,
  stopAudioPlayback,
  stopWordStreamTimer,
  startSpeakingWordStream,
  sentenceTextsRef,
  pendingSpeechStreamRef,
  setSpokenBubbles,
  setActiveBubbleIndex,
  setStreamingBubbleDelta,
  isGreetingTurnRef,
  isDismissalTurnRef,
  isEndingConversation,
  getPlaybackAudioContext,
  playStandaloneAudio,
  triggerGoodbyeAndReturnHome,
  startRecordingRef,
  currentScreenRef,
  selectedIndustryRef,
  activeChallengeRef,
  triggerThinkingSteps,
  clearThinkingSteps,
  setInput,
  setMicError,
  hasTriggeredCompletionRef,
  greetingAudioFinishedRef,
  checkGreetingComplete,
}) {
  const [connection, setConnection] = useState("Connecting...");
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [loading, setLoading] = useState(false);
  const loadingRef = useRef(false);

  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptRef = useRef(0);
  const isComponentMountedRef = useRef(true);
  const activeRequestIdRef = useRef(null);
  const activeAudioRequestIdRef = useRef(null);
  const enqueuedChunkSequencesRef = useRef(new Set());
  const connectSocketRef = useRef(null);

  const handleFrontendGreeting = useCallback(
    (requestId, userText) => {
      setMessages((previous) => [
        ...previous,
        {
          id: `user-${requestId}`,
          role: "user",
          content: userText,
        },
        {
          id: `assistant-${requestId}`,
          role: "assistant",
          content: GREETING_TEXT,
        },
      ]);

      setLoading(false);
      loadingRef.current = false;

      setCharacterState(ZENO_STATES.TALKING);
      if (characterStateRef) characterStateRef.current = ZENO_STATES.TALKING;

      const onEnded = () => {
        stopWordStreamTimer();
        setSpokenBubbles([]);
        if (
          currentScreenRef?.current === "conversation" &&
          !isEndingConversation
        ) {
          setCharacterState(ZENO_STATES.LISTENING);
          if (characterStateRef)
            characterStateRef.current = ZENO_STATES.LISTENING;
          setTimeout(() => {
            startRecordingRef?.current?.();
          }, 200);
        }
      };

      const audioDuration =
        preloadedGreetingBufferRef?.current?.duration || 6.1;
      startSpeakingWordStream(0, GREETING_TEXT, audioDuration, true);
      playStandaloneAudio(
        greetingAudioSrc,
        preloadedGreetingBufferRef?.current,
        onEnded
      );
    },
    [
      characterStateRef,
      currentScreenRef,
      isEndingConversation,
      playStandaloneAudio,
      preloadedGreetingBufferRef,
      setCharacterState,
      setSpokenBubbles,
      startRecordingRef,
      startSpeakingWordStream,
      stopWordStreamTimer,
    ]
  );

  const handleFrontendDismissal = useCallback(
    (requestId, userText) => {
      setMessages((previous) => [
        ...previous,
        {
          id: `user-${requestId}`,
          role: "user",
          content: userText,
        },
        {
          id: `assistant-${requestId}`,
          role: "assistant",
          content: GOODBYE_TEXT,
        },
      ]);

      setLoading(false);
      loadingRef.current = false;

      stopWordStreamTimer();
      setSpokenBubbles([]);
      setStreamingBubbleDelta("");

      triggerGoodbyeAndReturnHome?.(GOODBYE_TEXT);
    },
    [
      setSpokenBubbles,
      setStreamingBubbleDelta,
      stopWordStreamTimer,
      triggerGoodbyeAndReturnHome,
    ]
  );

  const sendMessage = useCallback(
    (messageText, challengeId = null) => {
      const text = (messageText || "").trim();
      if (!text) return;

      getPlaybackAudioContext?.();
      stopAudioPlayback?.();
      stopWordStreamTimer?.();
      if (pendingSpeechStreamRef) pendingSpeechStreamRef.current = null;
      sentenceTextsRef?.current?.clear();

      const requestId = createRequestId();
      activeRequestIdRef.current = requestId;
      activeAudioRequestIdRef.current = requestId;
      audioQueueManagerRef?.current?.startRequest(requestId);
      if (hasTriggeredCompletionRef) hasTriggeredCompletionRef.current = false;

      // Fast-path 1: Greeting messages ("hi", "hello", "hey", etc.)
      if (isGreetingText(text)) {
        console.log("[Zeno Frontend] Handled greeting locally:", text);
        handleFrontendGreeting(requestId, text);
        setInput?.("");
        return;
      }

      // Fast-path 2: Dismissal / Goodbye messages ("no", "thank you", "thanks", "nope", etc.)
      if (isNegativeDismissalText(text)) {
        console.log("[Zeno Frontend] Handled dismissal / goodbye locally:", text);
        handleFrontendDismissal(requestId, text);
        setInput?.("");
        return;
      }

      // Substantive questions -> Sent to backend WebSocket
      if (socketRef.current?.readyState !== WebSocket.OPEN) {
        console.warn(
          `[Zeno] Cannot send message: WebSocket is not open (readyState: ${socketRef.current?.readyState}). Triggering immediate reconnection...`
        );
        setMicError?.(
          "Connecting to Zeno voice server... Please tap your question again in a moment."
        );
        connectSocketRef.current?.(true);
        return;
      }

      setSpokenBubbles?.([]);
      setStreamingBubbleDelta?.("");
      setActiveBubbleIndex?.(0);

      timingMetricsRef?.current?.set(requestId, {
        requestId,
        t_sent: performance.now(),
        t_first_delta: null,
        t_first_audio_chunk: null,
        t_first_audio_playback: null,
        t_last_audio_playback: null,
        backend_metrics: null,
      });

      setMessages((previous) => [
        ...previous,
        {
          id: `user-${requestId}`,
          role: "user",
          content: text,
        },
      ]);

      setLoading(true);
      loadingRef.current = true;
      setCharacterState(ZENO_STATES.THINKING);
      if (characterStateRef) characterStateRef.current = ZENO_STATES.THINKING;

      let activeChId = challengeId || activeChallengeRef?.current?.id || null;

      // If active challenge not explicitly set, match by question text
      if (!activeChId && selectedIndustryRef?.current?.challenges?.length) {
        const lower = text.toLowerCase();
        const matched =
          selectedIndustryRef.current.challenges.find((c) => {
            const qMatch =
              c.question && lower.includes(c.question.toLowerCase().slice(0, 15));
            const tMatch = c.title && lower.includes(c.title.toLowerCase());
            const idMatch = c.id && lower.includes(c.id.replace(/_/g, " "));
            return qMatch || tMatch || idMatch;
          }) || selectedIndustryRef.current.challenges[0];

        if (matched) {
          activeChId = matched.id;
          if (activeChallengeRef) activeChallengeRef.current = matched;
        }
      }

      triggerThinkingSteps?.(text, activeChId);

      socketRef.current.send(
        JSON.stringify({
          type: "user_message",
          request_id: requestId,
          message: text,
          industry: selectedIndustryRef?.current?.name || null,
          challenge_id: activeChId,
        })
      );

      setInput?.("");
    },
    [
      activeChallengeRef,
      audioQueueManagerRef,
      characterStateRef,
      getPlaybackAudioContext,
      handleFrontendDismissal,
      handleFrontendGreeting,
      hasTriggeredCompletionRef,
      pendingSpeechStreamRef,
      selectedIndustryRef,
      sentenceTextsRef,
      setActiveBubbleIndex,
      setCharacterState,
      setInput,
      setMicError,
      setSpokenBubbles,
      setStreamingBubbleDelta,
      stopAudioPlayback,
      stopWordStreamTimer,
      timingMetricsRef,
      triggerThinkingSteps,
    ]
  );

  const resetSession = useCallback(() => {
    clearThinkingSteps?.();
    stopAudioPlayback?.();
    stopWordStreamTimer?.();
    if (pendingSpeechStreamRef) pendingSpeechStreamRef.current = null;
    sentenceTextsRef?.current?.clear();
    activeRequestIdRef.current = null;
    activeAudioRequestIdRef.current = null;
    setLoading(false);
    loadingRef.current = false;
    setCharacterState(ZENO_STATES.IDLE);
    if (characterStateRef) characterStateRef.current = ZENO_STATES.IDLE;
    setSpokenBubbles?.([]);
    setStreamingBubbleDelta?.("");
    setActiveBubbleIndex?.(0);
    setMessages([INITIAL_MESSAGE]);
    setInput?.("");

    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: "reset_session" }));
    }
  }, [
    characterStateRef,
    clearThinkingSteps,
    pendingSpeechStreamRef,
    sentenceTextsRef,
    setActiveBubbleIndex,
    setCharacterState,
    setInput,
    setSpokenBubbles,
    setStreamingBubbleDelta,
    stopAudioPlayback,
    stopWordStreamTimer,
  ]);

  // WebSocket Connection Management Lifecycle
  useEffect(() => {
    isComponentMountedRef.current = true;
    let currentSocket = null;

    const connect = (isManual = false) => {
      if (!isComponentMountedRef.current) return;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      if (isManual) {
        reconnectAttemptRef.current = 0;
      }

      if (currentSocket) {
        try {
          currentSocket.onopen = null;
          currentSocket.onmessage = null;
          currentSocket.onerror = null;
          currentSocket.onclose = null;
          if (
            currentSocket.readyState === WebSocket.OPEN ||
            currentSocket.readyState === WebSocket.CONNECTING
          ) {
            currentSocket.close();
          }
        } catch {}
        currentSocket = null;
      }

      const candidateUrls = getVoiceWsUrls();
      const attempt = reconnectAttemptRef.current;
      const targetUrl = candidateUrls[attempt % candidateUrls.length];
      console.log(
        `[Zeno WebSocket] Connecting to ${targetUrl} (attempt ${attempt + 1})...`
      );

      setConnection("Connecting...");

      let socket;
      try {
        socket = new WebSocket(targetUrl);
      } catch (err) {
        console.warn(
          `[Zeno WebSocket] Failed to construct WebSocket for ${targetUrl}:`,
          err
        );
        scheduleReconnect();
        return;
      }

      currentSocket = socket;
      socketRef.current = socket;

      socket.onopen = () => {
        if (!isComponentMountedRef.current) return;
        console.log(`[Zeno WebSocket] Successfully connected to ${targetUrl}`);
        setConnection("Connected");
        reconnectAttemptRef.current = 0;
        if (characterStateRef?.current === ZENO_STATES.SAD) {
          setCharacterState(ZENO_STATES.IDLE);
          if (characterStateRef)
            characterStateRef.current = ZENO_STATES.IDLE;
        }

        try {
          socket.send(
            JSON.stringify({
              type: "greeting_tts",
              request_id: "preload-greeting",
              text: GREETING_TEXT,
            })
          );
          socket.send(
            JSON.stringify({
              type: "goodbye_tts",
              request_id: "preload-goodbye",
              text: GOODBYE_TEXT,
            })
          );
        } catch (sendErr) {
          console.warn(
            "[Zeno WebSocket] Failed to send preload requests:",
            sendErr
          );
        }
      };

      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        const requestId = data.request_id;

        // Preloaded greeting audio handler
        if (
          data.type === "preloaded_greeting_audio" ||
          (data.type === "assistant_audio" && requestId === "preload-greeting")
        ) {
          if (data.audio) {
            try {
              const byteChars = atob(data.audio);
              const byteNumbers = new Uint8Array(byteChars.length);
              for (let i = 0; i < byteChars.length; i++) {
                byteNumbers[i] = byteChars.charCodeAt(i);
              }
              const audioCtx = getPlaybackAudioContext?.();
              if (audioCtx) {
                decodeAudioBuffer(audioCtx, byteNumbers.buffer)
                  .then((buf) => {
                    if (preloadedGreetingBufferRef) {
                      preloadedGreetingBufferRef.current = buf;
                      console.log(
                        "[Zeno] Preloaded greeting audio decoded and ready in memory."
                      );
                    }
                  })
                  .catch(() => {});
              }
            } catch (err) {
              console.warn("Error processing preloaded greeting audio:", err);
            }
          }
          return;
        }

        // Preloaded goodbye audio handler
        if (
          data.type === "preloaded_goodbye_audio" ||
          (data.type === "assistant_audio" && requestId === "preload-goodbye")
        ) {
          if (data.audio) {
            try {
              const byteChars = atob(data.audio);
              const byteNumbers = new Uint8Array(byteChars.length);
              for (let i = 0; i < byteChars.length; i++) {
                byteNumbers[i] = byteChars.charCodeAt(i);
              }
              const audioCtx = getPlaybackAudioContext?.();
              if (audioCtx) {
                decodeAudioBuffer(audioCtx, byteNumbers.buffer)
                  .then((buf) => {
                    if (preloadedGoodbyeBufferRef) {
                      preloadedGoodbyeBufferRef.current = buf;
                      console.log(
                        "[Zeno] Preloaded goodbye audio decoded and ready in memory."
                      );
                    }
                  })
                  .catch(() => {});
              }
            } catch (err) {
              console.warn("Error processing preloaded goodbye audio:", err);
            }
          }
          return;
        }

        if (requestId === "preload-greeting" || requestId === "preload-goodbye") {
          return;
        }

        if (
          requestId &&
          requestId !== activeRequestIdRef.current &&
          requestId !== activeAudioRequestIdRef.current &&
          data.type !== "session_reset"
        ) {
          return;
        }

        if (data.type === "assistant_start") {
          if (hasTriggeredCompletionRef)
            hasTriggeredCompletionRef.current = false;
          stopWordStreamTimer?.();
          if (pendingSpeechStreamRef) pendingSpeechStreamRef.current = null;
          sentenceTextsRef?.current?.clear();
          setSpokenBubbles?.([]);
          setActiveBubbleIndex?.(0);
          setStreamingBubbleDelta?.("");
          enqueuedChunkSequencesRef.current?.clear();

          if (!data.is_greeting) {
            setLoading(true);
            loadingRef.current = true;
            audioQueueManagerRef?.current?.startRequest(requestId);
            setCharacterState(ZENO_STATES.THINKING);
            if (characterStateRef)
              characterStateRef.current = ZENO_STATES.THINKING;

            setMessages((previous) => [
              ...previous,
              {
                id: `assistant-${requestId}`,
                requestId,
                role: "assistant",
                content: "",
                streaming: true,
              },
            ]);
          }
          activeAudioRequestIdRef.current = requestId;
          activeRequestIdRef.current = requestId;
        }

        if (data.type === "assistant_delta") {
          const m = timingMetricsRef?.current?.get(requestId);
          if (m && m.t_first_delta === null && data.delta) {
            m.t_first_delta = performance.now();
          }
          if (!data.is_greeting && data.delta) {
            setMessages((previous) =>
              previous.map((message) =>
                message.id === `assistant-${requestId}`
                  ? {
                      ...message,
                      content: (message.content || "") + data.delta,
                    }
                  : message
              )
            );
          }
        }

        if (data.type === "assistant_sentence") {
          if (data.is_dismissal) {
            if (isDismissalTurnRef) isDismissalTurnRef.current = true;
            stopWordStreamTimer?.();
            setSpokenBubbles?.([]);
            if (pendingSpeechStreamRef) pendingSpeechStreamRef.current = null;
            return;
          }
          if (!data.is_greeting) {
            const sIdx =
              typeof data.sentence_index === "number" ? data.sentence_index : 0;
            const cleanMsg = data.spoken_text || data.message || "";

            sentenceTextsRef?.current?.set(sIdx, {
              text: cleanMsg,
              spokenText: data.spoken_text || cleanMsg,
            });

            if (
              pendingSpeechStreamRef?.current &&
              pendingSpeechStreamRef.current.sequence === sIdx
            ) {
              const { sequence, duration } = pendingSpeechStreamRef.current;
              pendingSpeechStreamRef.current = null;
              startSpeakingWordStream?.(sequence, cleanMsg, duration);
            }

            setMessages((previous) =>
              previous.map((message) => {
                if (
                  message.id === `assistant-${requestId}` &&
                  !message.content
                ) {
                  return {
                    ...message,
                    content: data.message,
                  };
                }
                return message;
              })
            );
          }
        }

        if (data.type === "audio_chunk" || data.type === "assistant_audio") {
          if (
            requestId !== activeAudioRequestIdRef.current &&
            requestId !== activeRequestIdRef.current
          ) {
            return;
          }

          const seq =
            typeof data.sequence === "number"
              ? data.sequence
              : data.sentence_index;
          const chunkKey = `${requestId}:${seq}`;

          if (enqueuedChunkSequencesRef.current?.has(chunkKey)) {
            return;
          }
          enqueuedChunkSequencesRef.current?.add(chunkKey);

          const m = timingMetricsRef?.current?.get(requestId);
          if (m && m.t_first_audio_chunk === null && data.audio) {
            m.t_first_audio_chunk = performance.now();
          }

          audioQueueManagerRef?.current?.enqueueChunk({
            requestId,
            sequence: seq,
            audio: data.audio,
            format: data.format || "mp3",
          });
        }

        if (data.type === "assistant_complete") {
          if (data.is_dismissal) {
            if (isDismissalTurnRef) isDismissalTurnRef.current = true;
          }

          const m = timingMetricsRef?.current?.get(requestId);
          if (m && data.metrics) {
            m.backend_metrics = data.metrics;
          }

          const totalChunks =
            typeof data.total_chunks === "number"
              ? data.total_chunks
              : data.total_sentences;

          audioQueueManagerRef?.current?.setGenerationComplete({
            requestId,
            totalChunks,
          });

          if (!data.is_greeting) {
            setStreamingBubbleDelta?.("");
            setMessages((previous) =>
              previous.map((message) =>
                message.id === `assistant-${requestId}`
                  ? {
                      ...message,
                      content: data.full_response || message.content,
                      streaming: false,
                      sources: data.sources || { internal: [], web: [] },
                    }
                  : message
              )
            );

            setLoading(false);
            loadingRef.current = false;
          }
        }

        if (data.type === "generation_cancelled") {
          stopAudioPlayback?.();
          stopWordStreamTimer?.();
          if (pendingSpeechStreamRef) pendingSpeechStreamRef.current = null;
          sentenceTextsRef?.current?.clear();
          setSpokenBubbles?.([]);
          setStreamingBubbleDelta?.("");
          setLoading(false);
          loadingRef.current = false;
          activeRequestIdRef.current = null;
          activeAudioRequestIdRef.current = null;
          setCharacterState(ZENO_STATES.IDLE);
          if (characterStateRef) characterStateRef.current = ZENO_STATES.IDLE;
          setMessages((previous) =>
            previous.map((message) =>
              message.streaming ? { ...message, streaming: false } : message
            )
          );
        }

        if (data.type === "error" || data.type === "assistant_error") {
          stopAudioPlayback?.();
          setMessages((previous) =>
            previous.map((message) =>
              message.id === `assistant-${requestId}`
                ? {
                    ...message,
                    content: data.message,
                    streaming: false,
                  }
                : message
            )
          );

          setLoading(false);
          loadingRef.current = false;
          activeRequestIdRef.current = null;
          activeAudioRequestIdRef.current = null;
          setCharacterState(ZENO_STATES.SAD);
          if (characterStateRef) characterStateRef.current = ZENO_STATES.SAD;

          if (isGreetingTurnRef?.current) {
            if (greetingAudioFinishedRef)
              greetingAudioFinishedRef.current = true;
            checkGreetingComplete?.();
          }
        }

        if (data.type === "session_reset") {
          stopAudioPlayback?.();
          activeRequestIdRef.current = null;
          activeAudioRequestIdRef.current = null;
          setMessages([INITIAL_MESSAGE]);
          setLoading(false);
          loadingRef.current = false;
          setCharacterState(ZENO_STATES.IDLE);
          if (characterStateRef) characterStateRef.current = ZENO_STATES.IDLE;
        }
      };

      socket.onerror = (err) => {
        console.warn(`[Zeno WebSocket] Socket error on ${targetUrl}:`, err);
        if (!isComponentMountedRef.current) return;
        setConnection("Connection error");
        setLoading(false);
        loadingRef.current = false;
      };

      socket.onclose = (event) => {
        console.warn(
          `[Zeno WebSocket] Socket closed (${targetUrl}, code=${event.code}). Scheduling auto-reconnect...`
        );
        if (!isComponentMountedRef.current) return;
        setConnection("Disconnected");
        setLoading(false);
        loadingRef.current = false;
        scheduleReconnect();
      };
    };

    const scheduleReconnect = () => {
      if (!isComponentMountedRef.current) return;
      if (reconnectTimeoutRef.current) return;
      reconnectAttemptRef.current += 1;
      const delay = Math.min(1000 + reconnectAttemptRef.current * 800, 3500);
      reconnectTimeoutRef.current = setTimeout(() => {
        reconnectTimeoutRef.current = null;
        connect();
      }, delay);
    };

    connectSocketRef.current = connect;
    connect();

    return () => {
      isComponentMountedRef.current = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      activeRequestIdRef.current = null;
      activeAudioRequestIdRef.current = null;
      if (currentSocket) {
        try {
          currentSocket.onopen = null;
          currentSocket.onmessage = null;
          currentSocket.onerror = null;
          currentSocket.onclose = null;
          if (
            currentSocket.readyState === WebSocket.OPEN ||
            currentSocket.readyState === WebSocket.CONNECTING
          ) {
            currentSocket.close();
          }
        } catch {}
      }
    };
  }, [
    activeAudioRequestIdRef,
    activeRequestIdRef,
    audioQueueManagerRef,
    characterStateRef,
    checkGreetingComplete,
    getPlaybackAudioContext,
    greetingAudioFinishedRef,
    hasTriggeredCompletionRef,
    isDismissalTurnRef,
    isGreetingTurnRef,
    pendingSpeechStreamRef,
    preloadedGoodbyeBufferRef,
    preloadedGreetingBufferRef,
    sentenceTextsRef,
    setActiveBubbleIndex,
    setCharacterState,
    setSpokenBubbles,
    setStreamingBubbleDelta,
    startSpeakingWordStream,
    stopAudioPlayback,
    stopWordStreamTimer,
    timingMetricsRef,
  ]);

  return {
    connection,
    messages,
    setMessages,
    loading,
    setLoading,
    loadingRef,
    socketRef,
    activeRequestIdRef,
    sendMessage,
    resetSession,
    reconnect: () => connectSocketRef.current?.(true),
  };
}
