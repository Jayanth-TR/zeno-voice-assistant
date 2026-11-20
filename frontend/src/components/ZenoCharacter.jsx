import React, { useEffect, useRef, useState, useCallback } from "react";
import idleVideo from "../assets/zeno/Idle.webm";
import greetingVideo from "../assets/zeno/Greeting.webm";
import listeningVideo from "../assets/zeno/Listening.webm";
import thinkingVideo from "../assets/zeno/Thinking.webm";
import talkingVideo from "../assets/zeno/Speaking.webm";
import sadVideo from "../assets/zeno/Sad.webm";
import goodbyeVideo from "../assets/zeno/Goodbye.webm";

export const ZENO_STATES = {
  IDLE: "idle",
  GREETING: "greeting",
  LISTENING: "listening",
  THINKING: "thinking",
  TALKING: "talking",
  SAD: "sad",
  GOODBYE: "goodbye",
};

const VIDEO_CONFIG = {
  [ZENO_STATES.IDLE]: {
    src: idleVideo,
    loop: true,
    label: "Zeno is waiting",
  },
  [ZENO_STATES.GREETING]: {
    src: greetingVideo,
    loop: false,
    label: "Zeno is greeting you",
  },
  [ZENO_STATES.LISTENING]: {
    src: listeningVideo,
    loop: true,
    label: "Zeno is listening",
  },
  [ZENO_STATES.THINKING]: {
    src: thinkingVideo,
    loop: true,
    label: "Zeno is thinking",
  },
  [ZENO_STATES.TALKING]: {
    src: talkingVideo,
    loop: true,
    label: "Zeno is speaking",
  },
  [ZENO_STATES.SAD]: {
    src: sadVideo,
    loop: false,
    label: "Zeno encountered an issue",
  },
  [ZENO_STATES.GOODBYE]: {
    src: goodbyeVideo,
    loop: false,
    label: "Zeno is saying goodbye",
  },
};

/**
 * High-Performance Dual-Buffer Video Engine
 * Uses exactly TWO persistent <video> elements (Slot 0 and Slot 1) to cross-fade between animations.
 * Eliminates GPU decoder overload and ensures non-looping animations (Greeting, Goodbye)
 * start playing immediately without freezing on the first frame.
 */
function ZenoCharacter({
  state = ZENO_STATES.IDLE,
  onEnded,
  className = "",
  size = "hero", // "hero" | "large" | "normal" | "compact"
}) {
  const [activeSlot, setActiveSlot] = useState(0);

  const initialConfig = VIDEO_CONFIG[state] || VIDEO_CONFIG[ZENO_STATES.IDLE];
  const [slotData, setSlotData] = useState({
    0: {
      src: initialConfig.src,
      loop: initialConfig.loop,
      label: initialConfig.label,
      state: state,
    },
    1: {
      src: "",
      loop: true,
      label: "",
      state: "",
    },
  });

  const videoRef0 = useRef(null);
  const videoRef1 = useRef(null);
  const currentSlotRef = useRef(0);
  const currentStateRef = useRef(state);
  const onEndedRef = useRef(onEnded);
  onEndedRef.current = onEnded;

  // Background pre-fetch of animation assets
  useEffect(() => {
    const prefetchVideos = [listeningVideo, talkingVideo, thinkingVideo, goodbyeVideo];
    const timer = setTimeout(() => {
      prefetchVideos.forEach((src) => {
        try {
          const link = document.createElement("link");
          link.rel = "prefetch";
          link.as = "video";
          link.href = src;
          document.head.appendChild(link);
        } catch (_) {}
      });
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // Safe playback helper that sets muted properties and starts playback
  const playVideoElement = useCallback((videoEl) => {
    if (!videoEl) return;
    videoEl.muted = true;
    videoEl.defaultMuted = true;
    const playPromise = videoEl.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        // Autoplay policy or interruption fallback
        console.warn("[ZenoCharacter] play() catch:", err.message);
      });
    }
  }, []);

  // Transition to new state
  useEffect(() => {
    if (state === currentStateRef.current) {
      // Re-verify that the currently active slot is actually playing
      const currentVideo = currentSlotRef.current === 0 ? videoRef0.current : videoRef1.current;
      if (currentVideo && currentVideo.paused) {
        playVideoElement(currentVideo);
      }
      return;
    }

    currentStateRef.current = state;
    const targetConfig = VIDEO_CONFIG[state] || VIDEO_CONFIG[ZENO_STATES.IDLE];
    const incomingSlot = currentSlotRef.current === 0 ? 1 : 0;
    const outgoingSlot = currentSlotRef.current;
    const incomingVideo = incomingSlot === 0 ? videoRef0.current : videoRef1.current;
    const outgoingVideo = outgoingSlot === 0 ? videoRef0.current : videoRef1.current;

    console.log(`[ZenoCharacter] Transitioning to "${state}" via Slot ${incomingSlot}`);

    // Update the incoming slot's data in React state
    setSlotData((prev) => ({
      ...prev,
      [incomingSlot]: {
        src: targetConfig.src,
        loop: targetConfig.loop,
        label: targetConfig.label,
        state: state,
      },
    }));

    if (incomingVideo) {
      incomingVideo.muted = true;
      incomingVideo.defaultMuted = true;
      incomingVideo.loop = targetConfig.loop;

      // If the incoming video already has this source, rewind to start and play
      if (incomingVideo.src.endsWith(targetConfig.src) || incomingVideo.src === targetConfig.src) {
        incomingVideo.currentTime = 0;
        playVideoElement(incomingVideo);
      } else {
        incomingVideo.src = targetConfig.src;
        incomingVideo.currentTime = 0;
        incomingVideo.load();
        playVideoElement(incomingVideo);
      }

      // Switch active slot immediately so the new animation begins displaying
      setActiveSlot(incomingSlot);
      currentSlotRef.current = incomingSlot;

      // Pause the outgoing video after cross-fade finishes (200ms)
      setTimeout(() => {
        if (outgoingVideo && currentSlotRef.current === incomingSlot) {
          outgoingVideo.pause();
        }
      }, 200);
    }
  }, [state, playVideoElement]);

  const handleVideoEnded = (slot) => {
    const config = slotData[slot];
    console.log(`[ZenoCharacter] Video ended for slot ${slot}, state:`, config?.state);
    if (onEndedRef.current && config && !config.loop) {
      onEndedRef.current(config.state);
    }
  };

  const handleCanPlay = (slot, e) => {
    const el = e.target;
    el.muted = true;
    el.defaultMuted = true;
    if (currentSlotRef.current === slot && el.paused) {
      playVideoElement(el);
    }
  };

  const handleLoadedData = (slot, e) => {
    const el = e.target;
    el.muted = true;
    el.defaultMuted = true;
    if (currentSlotRef.current === slot && el.paused) {
      playVideoElement(el);
    }
  };

  return (
    <div
      className={`zeno-character-wrapper size-${size} state-${state} ${className}`}
      data-state={state}
    >
      {/* Ambient Atmospheric Halo Glow behind the character stage */}
      <div className={`zeno-stage-halo halo-${state}`} aria-hidden="true" />

      {/* Main Character Stage: Ultra-fast 60 FPS Dual-Buffer Video Engine */}
      <div className="zeno-character-card">
        {/* Buffer Slot 0 */}
        <video
          ref={videoRef0}
          src={slotData[0].src}
          className={`zeno-video zeno-slot-0 ${activeSlot === 0 ? "video-active" : "video-standby"}`}
          playsInline
          autoPlay
          muted
          loop={slotData[0].loop}
          preload="auto"
          onEnded={() => handleVideoEnded(0)}
          onCanPlay={(e) => handleCanPlay(0, e)}
          onLoadedData={(e) => handleLoadedData(0, e)}
          aria-label={slotData[0].label}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            opacity: activeSlot === 0 ? 1 : 0,
            pointerEvents: activeSlot === 0 ? "auto" : "none",
            transition: "opacity 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
            zIndex: activeSlot === 0 ? 2 : 1,
            willChange: "opacity",
            transform: "translate3d(0, 0, 0)",
          }}
        />

        {/* Buffer Slot 1 */}
        <video
          ref={videoRef1}
          src={slotData[1].src || undefined}
          className={`zeno-video zeno-slot-1 ${activeSlot === 1 ? "video-active" : "video-standby"}`}
          playsInline
          autoPlay
          muted
          loop={slotData[1].loop}
          preload="auto"
          onEnded={() => handleVideoEnded(1)}
          onCanPlay={(e) => handleCanPlay(1, e)}
          onLoadedData={(e) => handleLoadedData(1, e)}
          aria-label={slotData[1].label}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            opacity: activeSlot === 1 ? 1 : 0,
            pointerEvents: activeSlot === 1 ? "auto" : "none",
            transition: "opacity 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
            zIndex: activeSlot === 1 ? 2 : 1,
            willChange: "opacity",
            transform: "translate3d(0, 0, 0)",
          }}
        />

        <div className={`zeno-status-glow glow-${state}`} aria-hidden="true" />
      </div>
    </div>
  );
}

export default React.memo(ZenoCharacter, (prev, next) => {
  return prev.state === next.state && prev.size === next.size && prev.className === next.className;
});
