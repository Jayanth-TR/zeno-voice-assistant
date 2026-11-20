import { useEffect, useRef, useState, useCallback } from "react";
import "./App.css";
import { ZENO_STATES } from "./components/ZenoCharacter";
import DemoRequestMobileForm from "./components/DemoRequestMobileForm";
import StartScreen from "./pages/StartScreen";
import ConversationScreen from "./pages/ConversationScreen";
import HoloBoxKiosk from "./features/holobox/HoloBoxKiosk";
import { DEFAULT_INDUSTRIES } from "./config/industriesData";
import { getZenoActionsForQuestion } from "./config/zenoActionsData";
import { apiService } from "./services/apiService";
import {
  GREETING_TEXT,
  GOODBYE_TEXT,
} from "./constants/appConstants";
import {
  greetingAudioSrc,
  goodbyeAudioSrc,
  BUNDLED_INDUSTRY_GREETINGS,
} from "./constants/audioConstants";
import { useAudioPlayback } from "./features/voice/hooks/useAudioPlayback";
import { useLiveTranscription } from "./features/voice/hooks/useLiveTranscription";
import { useVoiceWebSocket } from "./features/voice/hooks/useVoiceWebSocket";

function App() {
  // Screen Mode: "start" | "conversation"
  const [currentScreen, setCurrentScreen] = useState("start");
  const currentScreenRef = useRef("start");

  // Industry & Challenge Selection State
  const [industries, setIndustries] = useState(DEFAULT_INDUSTRIES);
  const [selectedIndustry, setSelectedIndustry] = useState(null);
  const selectedIndustryRef = useRef(null);
  const [activeChallenge, setActiveChallenge] = useState(null);
  const activeChallengeRef = useRef(null);
  const [hasAskedPrimary, setHasAskedPrimary] = useState(false);
  const hasAskedPrimaryRef = useRef(false);
  const [isIndustryModalOpen, setIsIndustryModalOpen] = useState(false);
  const [showSampleQuestions, setShowSampleQuestions] = useState(false);

  // WhatsApp QR Code Lead Capture & Admin Dashboard State
  const [isWhatsAppQROpen, setIsWhatsAppQROpen] = useState(false);
  const [leadContext, setLeadContext] = useState({
    industry: "Retail & E-commerce",
    challenge: "Custom Enterprise Demo",
  });
  const [isAdminLeadsOpen, setIsAdminLeadsOpen] = useState(false);

  // Character animation state
  const [characterState, setCharacterState] = useState(ZENO_STATES.IDLE);
  const characterStateRef = useRef(ZENO_STATES.IDLE);

  // Screen notices & interaction flags
  const [startPromptMessage, setStartPromptMessage] = useState(null);
  const [isGreetingActive, setIsGreetingActive] = useState(false);
  const [isEndingConversation, setIsEndingConversation] = useState(false);

  // Chat Drawer toggle
  const [isChatOpen, setIsChatOpen] = useState(false);
  const chatWindowRef = useRef(null);
  const [input, setInput] = useState("");

  // What Zeno Does on Screen - Live Action Steps
  const [activeThinkingSteps, setActiveThinkingSteps] = useState([]);
  const [activeThinkingStepIndex, setActiveThinkingStepIndex] = useState(0);
  const thinkingTimerRef = useRef(null);

  // Turn synchronization refs
  const greetingAnimationFinishedRef = useRef(false);
  const greetingAudioFinishedRef = useRef(false);
  const isGreetingTurnRef = useRef(false);
  const greetingAudioSentRef = useRef(false);
  const greetingSafetyTimeoutRef = useRef(null);
  const isDismissalTurnRef = useRef(false);
  const goodbyeAnimationFinishedRef = useRef(false);
  const goodbyeAudioFinishedRef = useRef(false);
  const goodbyeSafetyTimeoutRef = useRef(null);
  const hasTriggeredCompletionRef = useRef(false);
  const startRecordingRef = useRef(null);

  // Fetch dynamic industry configuration on mount
  useEffect(() => {
    apiService.fetchIndustries().then((fetched) => {
      if (Array.isArray(fetched) && fetched.length > 0) {
        setIndustries(fetched);
      }
    });
  }, []);

  const triggerThinkingSteps = useCallback((questionText, challengeId = null) => {
    const steps = getZenoActionsForQuestion(
      questionText,
      challengeId,
      selectedIndustryRef.current?.id
    );
    setActiveThinkingSteps(steps);
    setActiveThinkingStepIndex(0);

    if (thinkingTimerRef.current) {
      clearInterval(thinkingTimerRef.current);
      thinkingTimerRef.current = null;
    }

    let stepIdx = 0;
    thinkingTimerRef.current = setInterval(() => {
      stepIdx++;
      if (steps.length > 0) {
        setActiveThinkingStepIndex(stepIdx % steps.length);
      }
    }, 2000);
  }, []);

  const clearThinkingSteps = useCallback(() => {
    if (thinkingTimerRef.current) {
      clearInterval(thinkingTimerRef.current);
      thinkingTimerRef.current = null;
    }
  }, []);

  // Fullscreen helper for HoloBox kiosk installation
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else if (document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Synchronize greeting completion
  const checkGreetingComplete = useCallback(() => {
    if (
      greetingAnimationFinishedRef.current &&
      greetingAudioFinishedRef.current
    ) {
      console.log(
        "[Zeno] Greeting video & audio completed. Transitioning to Question suggestions."
      );
      if (greetingSafetyTimeoutRef.current) {
        clearTimeout(greetingSafetyTimeoutRef.current);
        greetingSafetyTimeoutRef.current = null;
      }
      setIsGreetingActive(false);
      isGreetingTurnRef.current = false;
      setCharacterState(ZENO_STATES.LISTENING);
      characterStateRef.current = ZENO_STATES.LISTENING;
      setShowSampleQuestions(true);

      setTimeout(() => {
        setSpokenBubbles([]);
      }, 500);

      setTimeout(() => {
        if (
          currentScreenRef.current === "conversation" &&
          !isEndingConversation
        ) {
          startRecordingRef.current?.();
        }
      }, 400);
    }
  }, [isEndingConversation]);

  // Audio Playback Hook
  const {
    isPlayingAudio,
    isPlayingAudioRef,
    audioQueueManagerRef,
    timingMetricsRef,
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
  } = useAudioPlayback({
    onAllAudioCompleted: () => {
      // 1. If this was greeting turn
      if (isGreetingTurnRef.current) {
        greetingAudioFinishedRef.current = true;
        checkGreetingComplete();
        return;
      }

      // 2. Dismissal / Goodbye turn
      if (isDismissalTurnRef.current) {
        isDismissalTurnRef.current = false;
        triggerGoodbyeAndReturnHome(GOODBYE_TEXT, true);
        return;
      }

      // 3. Normal question answer complete -> auto-listen
      if (currentScreenRef.current === "conversation" && !isEndingConversation) {
        setCharacterState(ZENO_STATES.LISTENING);
        characterStateRef.current = ZENO_STATES.LISTENING;

        if (selectedIndustryRef.current) {
          setShowSampleQuestions(true);
        }

        setTimeout(() => {
          if (!isPlayingAudioRef.current) {
            setSpokenBubbles([]);
          }
        }, 700);

        setTimeout(() => {
          if (
            currentScreenRef.current === "conversation" &&
            !isEndingConversation &&
            !isPlayingAudioRef.current
          ) {
            startRecordingRef.current?.();
          }
        }, 400);
      }
    },
    clearThinkingSteps,
    setCharacterState,
    characterStateRef,
    isGreetingTurnRef,
    isDismissalTurnRef,
    isEndingConversation,
    loadingRef: { current: false },
  });

  const returnToHomePage = useCallback(() => {
    if (goodbyeSafetyTimeoutRef.current) {
      clearTimeout(goodbyeSafetyTimeoutRef.current);
      goodbyeSafetyTimeoutRef.current = null;
    }

    setTimeout(() => {
      setIsEndingConversation(false);
      resetConversation();
      setCurrentScreen("start");
      currentScreenRef.current = "start";
      setSelectedIndustry(null);
      selectedIndustryRef.current = null;
      setActiveChallenge(null);
      activeChallengeRef.current = null;
      setHasAskedPrimary(false);
      hasAskedPrimaryRef.current = false;
      setShowSampleQuestions(false);
      setIsIndustryModalOpen(false);
      setCharacterState(ZENO_STATES.IDLE);
      characterStateRef.current = ZENO_STATES.IDLE;
      setStartPromptMessage(null);
    }, 250);
  }, []);

  const triggerGoodbyeAndReturnHome = useCallback(
    (spokenCaption = GOODBYE_TEXT, shouldPlayAudio = true) => {
      setIsEndingConversation(true);
      setShowSampleQuestions(false);
      clearThinkingSteps();
      cancelRecording();
      stopAudioPlayback();
      stopWordStreamTimer();
      setSpokenBubbles([]);
      setStreamingBubbleDelta("");

      const audioCtx = getPlaybackAudioContext();
      if (audioCtx && audioCtx.state === "suspended") {
        audioCtx.resume().catch(() => {});
      }

      const cancelReqId = activeRequestIdRef.current;
      if (cancelReqId && socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(
          JSON.stringify({
            type: "cancel_generation",
            request_id: cancelReqId,
          })
        );
      }

      setLoading(false);
      if (loadingRef) loadingRef.current = false;

      goodbyeAnimationFinishedRef.current = false;
      goodbyeAudioFinishedRef.current = false;

      setCharacterState(ZENO_STATES.GOODBYE);
      characterStateRef.current = ZENO_STATES.GOODBYE;

      const checkGoodbyeComplete = () => {
        if (
          goodbyeAudioFinishedRef.current &&
          goodbyeAnimationFinishedRef.current
        ) {
          returnToHomePage();
        }
      };

      if (shouldPlayAudio) {
        playStandaloneAudio(
          goodbyeAudioSrc,
          preloadedGoodbyeBufferRef.current,
          () => {
            goodbyeAudioFinishedRef.current = true;
            checkGoodbyeComplete();
          }
        );
      } else {
        goodbyeAudioFinishedRef.current = true;
      }

      if (goodbyeSafetyTimeoutRef.current) {
        clearTimeout(goodbyeSafetyTimeoutRef.current);
      }
      goodbyeSafetyTimeoutRef.current = setTimeout(() => {
        returnToHomePage();
      }, 9500);
    },
    [
      clearThinkingSteps,
      getPlaybackAudioContext,
      playStandaloneAudio,
      preloadedGoodbyeBufferRef,
      returnToHomePage,
      setSpokenBubbles,
      setStreamingBubbleDelta,
      stopAudioPlayback,
      stopWordStreamTimer,
    ]
  );

  // Voice WebSocket Connection Hook
  const {
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
    reconnect,
  } = useVoiceWebSocket({
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
    setMicError: (err) => setMicError(err),
    hasTriggeredCompletionRef,
    greetingAudioFinishedRef,
    checkGreetingComplete,
  });

  const cancelRecordingRef = useRef(null);

  // No-speech timeout handler
  const handleNoSpeechTimeout = useCallback(() => {
    cancelRecordingRef.current?.();
    if (currentScreenRef.current === "conversation") {
      setCharacterState(ZENO_STATES.LISTENING);
      characterStateRef.current = ZENO_STATES.LISTENING;
      if (selectedIndustryRef.current) {
        setShowSampleQuestions(true);
      }
      return;
    }
    setCurrentScreen("start");
    currentScreenRef.current = "start";
    setCharacterState(ZENO_STATES.IDLE);
    characterStateRef.current = ZENO_STATES.IDLE;
    setStartPromptMessage("Are you still there? Let's try again!");
  }, []);

  // Live Transcription & VAD Hook
  const {
    isRecording,
    liveTranscript,
    vadStatus,
    liveAudioLevel,
    micError,
    setMicError,
    startRecording,
    stopAndSubmit,
    cancelRecording,
    handleToggleMic,
  } = useLiveTranscription({
    onSendMessage: (text) => sendMessage(text),
    onNoSpeechTimeout: handleNoSpeechTimeout,
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
  });

  useEffect(() => {
    startRecordingRef.current = startRecording;
    cancelRecordingRef.current = cancelRecording;
  });

  // Audio Context unlock on initial user gesture
  useEffect(() => {
    const handleFirstGesture = () => {
      getPlaybackAudioContext();
    };
    window.addEventListener("click", handleFirstGesture, { once: true });
    window.addEventListener("keydown", handleFirstGesture, { once: true });
    return () => {
      window.removeEventListener("click", handleFirstGesture);
      window.removeEventListener("keydown", handleFirstGesture);
    };
  }, [getPlaybackAudioContext]);

  // Video ended events coordinator
  const handleCharacterEnded = (endedState) => {
    if (endedState === ZENO_STATES.GREETING) {
      greetingAnimationFinishedRef.current = true;
      if (
        currentScreenRef.current === "conversation" &&
        characterStateRef.current === ZENO_STATES.GREETING
      ) {
        if (isPlayingAudioRef.current) {
          setCharacterState(ZENO_STATES.TALKING);
          characterStateRef.current = ZENO_STATES.TALKING;
        } else {
          const nextState = selectedIndustryRef.current
            ? ZENO_STATES.LISTENING
            : ZENO_STATES.IDLE;
          setCharacterState(nextState);
          characterStateRef.current = nextState;
        }
      }
      checkGreetingComplete();
    } else if (endedState === ZENO_STATES.GOODBYE) {
      goodbyeAnimationFinishedRef.current = true;
      if (goodbyeAudioFinishedRef.current) {
        returnToHomePage();
      }
    }
  };

  // Industry Greeting Trigger
  const triggerIndustryGreeting = async (industryObj) => {
    const audioCtx = getPlaybackAudioContext();
    if (audioCtx && audioCtx.state === "suspended") {
      audioCtx.resume().catch(() => {});
    }
    setStartPromptMessage(null);
    setMicError(null);

    const greetingText = industryObj?.greeting || GREETING_TEXT;

    greetingAnimationFinishedRef.current = false;
    greetingAudioFinishedRef.current = false;
    isGreetingTurnRef.current = true;
    greetingAudioSentRef.current = true;
    hasTriggeredCompletionRef.current = false;

    setIsGreetingActive(true);
    setCharacterState(ZENO_STATES.GREETING);
    characterStateRef.current = ZENO_STATES.GREETING;

    const words = greetingText.split(/\s+/).length;
    const estDuration = Math.max(3.5, words / 2.6);
    const estDurationMs = Math.round((estDuration + 3.5) * 1000);
    startSpeakingWordStream(0, greetingText, estDuration, true);

    if (greetingSafetyTimeoutRef.current) {
      clearTimeout(greetingSafetyTimeoutRef.current);
    }
    greetingSafetyTimeoutRef.current = setTimeout(() => {
      if (isGreetingTurnRef.current) {
        greetingAudioFinishedRef.current = true;
        greetingAnimationFinishedRef.current = true;
        checkGreetingComplete();
      }
    }, estDurationMs);

    // ZERO-LATENCY INSTANT PLAYBACK: Pre-decoded buffer
    const preloadedBuffer =
      preloadedIndustryBuffersRef.current[industryObj?.id];

    if (preloadedBuffer) {
      const audioDuration = preloadedBuffer.duration || estDuration;
      startSpeakingWordStream(0, greetingText, audioDuration, true);
      playStandaloneAudio(
        null,
        preloadedBuffer,
        () => {
          greetingAudioFinishedRef.current = true;
          checkGreetingComplete();
        },
        estDurationMs
      );
      return;
    }

    // Dynamic TTS synthesis fallback
    try {
      const audioBase64 = await apiService.synthesizeSpeech(greetingText);
      if (audioBase64) {
        const audioSrc = `data:audio/mp3;base64,${audioBase64}`;
        playStandaloneAudio(
          audioSrc,
          null,
          () => {
            greetingAudioFinishedRef.current = true;
            checkGreetingComplete();
          },
          estDurationMs
        );
        return;
      }
    } catch (err) {
      console.warn(
        "[Zeno] Failed to fetch dynamic industry greeting, using fallback audio:",
        err
      );
    }

    // Bundled fallback
    const bundledIndustrySrc = BUNDLED_INDUSTRY_GREETINGS[industryObj?.id];
    const fallbackBuffer =
      preloadedBuffer || preloadedIndustryBuffersRef.current[industryObj?.id];
    const fallbackSrc = bundledIndustrySrc || greetingAudioSrc;

    playStandaloneAudio(
      fallbackSrc,
      fallbackBuffer,
      () => {
        greetingAudioFinishedRef.current = true;
        checkGreetingComplete();
      },
      estDurationMs
    );
  };

  const handleStartConversationClick = () => {
    try {
      const ctx = getPlaybackAudioContext();
      if (ctx && ctx.state === "suspended") {
        ctx.resume().catch(() => {});
      }
    } catch {}
    setStartPromptMessage(null);
    setMicError(null);
    setIsIndustryModalOpen(true);
  };

  const handleSelectIndustry = (ind) => {
    try {
      const ctx = getPlaybackAudioContext();
      if (ctx && ctx.state === "suspended") {
        ctx.resume().catch(() => {});
      }
    } catch {}
    setSelectedIndustry(ind);
    selectedIndustryRef.current = ind;
    setActiveChallenge(null);
    activeChallengeRef.current = null;
    setHasAskedPrimary(false);
    hasAskedPrimaryRef.current = false;
    setIsIndustryModalOpen(false);
    setCurrentScreen("conversation");
    currentScreenRef.current = "conversation";

    cancelRecording();
    stopAudioPlayback();
    stopWordStreamTimer();
    setSpokenBubbles([]);
    setStreamingBubbleDelta("");
    setLoading(false);
    if (loadingRef) loadingRef.current = false;

    triggerIndustryGreeting(ind);
  };

  const handleSelectQuestion = (questionText, challengeId = null) => {
    if (
      loadingRef.current ||
      isPlayingAudioRef.current ||
      isGreetingTurnRef.current ||
      isEndingConversation
    ) {
      return;
    }

    cancelRecording();

    if (challengeId && selectedIndustry?.challenges) {
      const found = selectedIndustry.challenges.find(
        (c) => c.id === challengeId
      );
      if (found) {
        setActiveChallenge(found);
        activeChallengeRef.current = found;
      }
    }

    if (socketRef.current?.readyState !== WebSocket.OPEN) {
      setMicError(
        "Connecting to Zeno voice server... Please tap your question again in a moment."
      );
      reconnect();
      return;
    }

    setHasAskedPrimary(true);
    hasAskedPrimaryRef.current = true;

    try {
      const ctx = getPlaybackAudioContext();
      if (ctx && ctx.state === "suspended") {
        ctx.resume().catch(() => {});
      }
    } catch {}

    setShowSampleQuestions(true);

    if (currentScreenRef.current !== "conversation") {
      setCurrentScreen("conversation");
      currentScreenRef.current = "conversation";
    }

    sendMessage(questionText, challengeId);
  };

  const resetConversation = () => {
    clearThinkingSteps();
    setActiveThinkingSteps([]);
    setActiveThinkingStepIndex(0);
    cancelRecording();
    stopAudioPlayback();
    stopWordStreamTimer();
    if (pendingSpeechStreamRef) pendingSpeechStreamRef.current = null;
    sentenceTextsRef?.current?.clear();
    setLoading(false);
    setCharacterState(ZENO_STATES.IDLE);
    characterStateRef.current = ZENO_STATES.IDLE;
    setSpokenBubbles([]);
    setStreamingBubbleDelta("");
    setActiveBubbleIndex(0);
    setInput("");
    isDismissalTurnRef.current = false;

    if (goodbyeSafetyTimeoutRef.current) {
      clearTimeout(goodbyeSafetyTimeoutRef.current);
      goodbyeSafetyTimeoutRef.current = null;
    }

    resetSession();
  };

  const handleEndConversation = () => {
    if (isEndingConversation) return;

    if (loadingRef.current) {
      const cancelReqId = activeRequestIdRef.current;
      if (socketRef.current?.readyState === WebSocket.OPEN && cancelReqId) {
        socketRef.current.send(
          JSON.stringify({
            type: "cancel_generation",
            request_id: cancelReqId,
          })
        );
      }
      setLoading(false);
    }

    triggerGoodbyeAndReturnHome(GOODBYE_TEXT, true);
  };

  // Mobile Web Form (Opened when visitor scans event QR code)
  const isMobileDemoForm =
    typeof window !== "undefined" &&
    (window.location.pathname === "/demo-request" ||
      window.location.pathname.startsWith("/demo-request") ||
      new URLSearchParams(window.location.search).has("demo") ||
      new URLSearchParams(window.location.search).get("view") ===
        "demo-request");

  if (isMobileDemoForm) {
    return <DemoRequestMobileForm />;
  }

  // Legacy view fallback (accessible with ?view=legacy)
  const isLegacyView =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("view") === "legacy";

  if (isLegacyView) {
    if (currentScreen === "start") {
      return (
        <StartScreen
          connection={connection}
          onReconnect={reconnect}
          onToggleFullscreen={toggleFullscreen}
          characterState={characterState}
          onCharacterEnded={handleCharacterEnded}
          startPromptMessage={startPromptMessage}
          micError={micError}
          onDismissMicError={() => setMicError(null)}
          onStartConversationClick={handleStartConversationClick}
          isIndustryModalOpen={isIndustryModalOpen}
          onCloseIndustryModal={() => setIsIndustryModalOpen(false)}
          industries={industries}
          selectedIndustry={selectedIndustry}
          onSelectIndustry={handleSelectIndustry}
        />
      );
    }

    return (
      <ConversationScreen
        connection={connection}
        onReconnect={reconnect}
        onToggleFullscreen={toggleFullscreen}
        isChatOpen={isChatOpen}
        setIsChatOpen={setIsChatOpen}
        characterState={characterState}
        onCharacterEnded={handleCharacterEnded}
        spokenBubbles={spokenBubbles}
        activeBubbleIndex={activeBubbleIndex}
        streamingBubbleDelta={streamingBubbleDelta}
        isPlayingAudio={isPlayingAudio}
        loading={loading}
        isGreetingActive={isGreetingActive}
        isGreetingTurn={isGreetingTurnRef.current}
        isEndingConversation={isEndingConversation}
        isDismissalTurn={isDismissalTurnRef.current}
        activeThinkingSteps={activeThinkingSteps}
        activeThinkingStepIndex={activeThinkingStepIndex}
        showSampleQuestions={showSampleQuestions}
        selectedIndustry={selectedIndustry}
        activeChallenge={activeChallenge}
        hasAskedPrimary={hasAskedPrimary}
        onSelectQuestion={handleSelectQuestion}
        onSelectChallenge={(ch) => {
          setActiveChallenge(ch);
          activeChallengeRef.current = ch;
          setHasAskedPrimary(false);
          hasAskedPrimaryRef.current = false;
        }}
        onResetChallenge={() => {
          setActiveChallenge(null);
          activeChallengeRef.current = null;
          setHasAskedPrimary(false);
          hasAskedPrimaryRef.current = false;
        }}
        onOpenIndustryModal={() => setIsIndustryModalOpen(true)}
        onOpenWhatsAppLead={(ctx) => {
          setLeadContext({
            industry:
              ctx?.industry || selectedIndustry?.name || "Banking & Fintech",
          });
          setIsWhatsAppQROpen(true);
        }}
        isRecording={isRecording}
        liveAudioLevel={liveAudioLevel}
        vadStatus={vadStatus}
        liveTranscript={liveTranscript}
        onToggleMic={handleToggleMic}
        onEndConversation={handleEndConversation}
        micError={micError}
        onRetryMic={() => {
          setMicError(null);
          startRecording();
        }}
        onDismissMicError={() => setMicError(null)}
        messages={messages}
        chatWindowRef={chatWindowRef}
        input={input}
        setInput={setInput}
        onSendMessage={sendMessage}
        onStopAndSubmit={stopAndSubmit}
        onResetConversation={resetConversation}
        isIndustryModalOpen={isIndustryModalOpen}
        onCloseIndustryModal={() => {
          setIsIndustryModalOpen(false);
          if (!selectedIndustryRef.current) {
            returnToHomePage();
          }
        }}
        industries={industries}
        onSelectIndustry={handleSelectIndustry}
        isWhatsAppQROpen={isWhatsAppQROpen}
        setIsWhatsAppQROpen={setIsWhatsAppQROpen}
        leadContext={leadContext}
        isAdminLeadsOpen={isAdminLeadsOpen}
        setIsAdminLeadsOpen={setIsAdminLeadsOpen}
        isAudioSettingsOpen={isAudioSettingsOpen}
        setIsAudioSettingsOpen={setIsAudioSettingsOpen}
        selectedSinkId={selectedSinkId}
        onAudioSinkChange={handleAudioSinkChange}
        audioOutputDevices={audioOutputDevices}
        isTestingAudio={isTestingAudio}
        onTestAudio={handleTestAudio}
      />
    );
  }

  // Primary Default: HoloBox Agency Kiosk Mode
  return (
    <HoloBoxKiosk
      onSelectIndustry={handleSelectIndustry}
      onSelectQuestion={handleSelectQuestion}
      onToggleMic={handleToggleMic}
      isRecording={isRecording}
      liveAudioLevel={liveAudioLevel}
      vadStatus={vadStatus}
      liveTranscript={liveTranscript}
      characterState={characterState}
      isPlayingAudio={isPlayingAudio}
      loading={loading}
      onResetConversation={resetConversation}
    />
  );
}

export default App;
