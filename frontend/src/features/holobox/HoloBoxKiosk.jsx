import React, { useState, useEffect, useRef, useCallback } from "react";
import "../../styles/holobox.css";
import { HOLOBOX_DEMO_DATA } from "../../config/holoboxData";
import zenoAvatar from "../../assets/zeno_holobox_avatar.webp";
import ZenoCharacter, { ZENO_STATES } from "../../components/ZenoCharacter";

const ARROW = (
  <svg
    aria-hidden="true"
    width="30"
    height="30"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.4"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M4 12h15M13 6l6 6-6 6" />
  </svg>
);

const BACK = (
  <svg
    aria-hidden="true"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.6"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20 12H5M11 6l-6 6 6 6" />
  </svg>
);

const CHECK = (
  <svg
    aria-hidden="true"
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#000"
    strokeWidth="3.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
);

const MIC_ICON = (
  <svg
    aria-hidden="true"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.4"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" y1="19" x2="12" y2="22" />
  </svg>
);

export default function HoloBoxKiosk({
  onSelectIndustry,
  onSelectQuestion,
  onToggleMic,
  isRecording,
  liveAudioLevel,
  vadStatus,
  liveTranscript,
  characterState,
  isPlayingAudio,
  loading,
  onResetConversation,
}) {
  const [screen, setScreen] = useState("home"); // home | ch | ask | fu | out | story | lead
  const [indIdx, setIndIdx] = useState(0);
  const [chIdx, setChIdx] = useState(0);
  const [fuIdx, setFuIdx] = useState(0);
  const [activeStoryBrand, setActiveStoryBrand] = useState(null);
  const historyRef = useRef([]);
  const [timerTick, setTimerTick] = useState(0);
  const [seenFollowups, setSeenFollowups] = useState([]);

  // Inactivity timeout state (60s warn, 75s reset)
  const [warnTimeout, setWarnTimeout] = useState(false);
  const [countdownSeconds, setCountdownSeconds] = useState(15);
  const lastInteractionRef = useRef(0);

  const stageRef = useRef(null);

  // Initialize last interaction timestamp
  useEffect(() => {
    lastInteractionRef.current = Date.now();
  }, []);

  // Track interactions to prevent idle timeout
  const recordInteraction = useCallback(() => {
    lastInteractionRef.current = Date.now();
    if (warnTimeout) setWarnTimeout(false);
  }, [warnTimeout]);

  // Reset to home view
  const resetToHome = useCallback(() => {
    recordInteraction();
    historyRef.current = [];
    setScreen("home");
    setIndIdx(0);
    setChIdx(0);
    setFuIdx(0);
    setActiveStoryBrand(null);
    setSeenFollowups([]);
    setWarnTimeout(false);
    setTimerTick(0);
    onResetConversation?.();
  }, [onResetConversation, recordInteraction]);

  // Auto-fit 1080x1920 stage to window
  useEffect(() => {
    const handleFit = () => {
      if (stageRef.current) {
        const scale = Math.min(
          window.innerWidth / 1080,
          window.innerHeight / 1920
        );
        stageRef.current.style.transform = `translate(-50%, -50%) scale(${scale})`;
      }
    };

    handleFit();
    window.addEventListener("resize", handleFit);
    return () => window.removeEventListener("resize", handleFit);
  }, []);

  // Main animation / progress timer (40ms tick like the prototype)
  useEffect(() => {
    const interval = setInterval(() => {
      setTimerTick((t) => (t < 260 ? t + 1 : t));

      if (screen === "home") return;

      const idle = Date.now() - lastInteractionRef.current;
      if (idle > 75000) {
        // Reset to home after 75s of idle
        resetToHome();
      } else if (idle > 60000) {
        setWarnTimeout(true);
        setCountdownSeconds(Math.ceil((75000 - idle) / 1000));
      } else if (warnTimeout) {
        setWarnTimeout(false);
      }
    }, 40);

    return () => clearInterval(interval);
  }, [screen, warnTimeout, resetToHome]);

  const D = HOLOBOX_DEMO_DATA;
  const currentIndustry = D.ind[indIdx] || D.ind[0];
  const currentChallenge = currentIndustry?.ch[chIdx] || currentIndustry?.ch[0];
  const currentFu = screen === "fu" ? currentChallenge.fu[fuIdx] : null;
  const currentQuestionText =
    screen === "ask"
      ? currentChallenge.q
      : currentFu
        ? currentFu.q
        : "";

  // Timing helper for simulated progress and typing
  const getTiming = useCallback(() => {
    const steps =
      screen === "ask"
        ? currentChallenge.steps
        : currentFu
          ? [currentFu.does]
          : [];
    const per = screen === "ask" ? 16 : 22;
    const tq = Math.ceil(currentQuestionText.length / 1.5) + 6;
    return {
      steps,
      per,
      tq,
      readyAt: tq + steps.length * per + 4,
    };
  }, [currentChallenge, currentFu, currentQuestionText.length, screen]);

  const timing = getTiming();
  const typedCount = Math.min(
    currentQuestionText.length,
    Math.floor(timerTick * 1.5)
  );
  const isWorkDone = timerTick >= timing.readyAt || (!loading && timerTick > 30);

  // Navigation handlers
  const navigateTo = (nextState) => {
    recordInteraction();
    historyRef.current.push({ screen, indIdx, chIdx, fuIdx, activeStoryBrand });
    if (nextState.screen) setScreen(nextState.screen);
    if (typeof nextState.indIdx === "number") setIndIdx(nextState.indIdx);
    if (typeof nextState.chIdx === "number") setChIdx(nextState.chIdx);
    if (typeof nextState.fuIdx === "number") setFuIdx(nextState.fuIdx);
    if (nextState.activeStoryBrand !== undefined)
      setActiveStoryBrand(nextState.activeStoryBrand);

    setTimerTick(0);
    if (nextState.screen === "ask") {
      setSeenFollowups([]);
    }
    if (
      nextState.screen === "fu" &&
      typeof nextState.fuIdx === "number" &&
      !seenFollowups.includes(nextState.fuIdx)
    ) {
      setSeenFollowups((s) => [...s, nextState.fuIdx]);
    }
  };

  const handleBack = () => {
    recordInteraction();
    const last = historyRef.current.pop();
    if (last) {
      setScreen(last.screen);
      setIndIdx(last.indIdx);
      setChIdx(last.chIdx);
      setFuIdx(last.fuIdx);
      setActiveStoryBrand(last.activeStoryBrand);
    } else {
      setScreen("home");
    }
    setTimerTick(999);
  };

  const handleSelectIndustryClick = (idx) => {
    recordInteraction();
    setIndIdx(idx);
    navigateTo({ screen: "ch", indIdx: idx });
    const selectedInd = D.ind[idx];
    if (onSelectIndustry) {
      onSelectIndustry({
        id: selectedInd.name.toLowerCase().includes("ecom")
          ? "ecommerce"
          : selectedInd.name.toLowerCase().includes("bank")
            ? "banking"
            : "insurance",
        name: selectedInd.name,
      });
    }
  };

  const handleSelectChallengeClick = (idx) => {
    recordInteraction();
    setChIdx(idx);
    setFuIdx(0);
    navigateTo({ screen: "ask", chIdx: idx, fuIdx: 0 });
    const ch = currentIndustry.ch[idx];
    if (onSelectQuestion) {
      onSelectQuestion(ch.q, ch.title);
    }
  };

  const handleSelectFollowupClick = (targetFuIdx) => {
    recordInteraction();
    setFuIdx(targetFuIdx);
    navigateTo({ screen: "fu", fuIdx: targetFuIdx });
    const fu = currentChallenge.fu[targetFuIdx];
    if (onSelectQuestion && fu) {
      onSelectQuestion(fu.q);
    }
  };

  // Helper for rendering horizontal metric bars
  const renderMetricBars = (bars) => {
    const maxVal = Math.max(...bars.map((b) => b.v));
    return (
      <div className="bars">
        {bars.map((b, i) => (
          <div key={i} className="br">
            <div className="bl">{b.l}</div>
            <div className="bt">
              <div
                className="bb"
                style={{
                  width: `${Math.max(3, Math.round((b.v / maxVal) * 100))}%`,
                  background: b.h ? "#ff4502" : "#d5d7de",
                }}
              />
              <div className="bv">{b.s}</div>
              {b.m && <div className="bm">{b.m}</div>}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Staggered follow-up card content render
  const renderFollowupContent = () => {
    if (!currentFu) return null;

    if (currentFu.type === "segment") {
      return (
        <div className="col in" style={{ gap: "22px" }}>
          <div className="eb">SEGMENT FROM ONE SENTENCE</div>
          <div
            style={{
              padding: "30px 36px",
              borderRadius: "36px",
              background: "#f6f6f8",
              fontSize: "34px",
              fontWeight: 700,
              lineHeight: 1.3,
            }}
          >
            “{currentFu.sentence}”
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "18px" }}>
            <div
              style={{
                fontSize: "120px",
                fontWeight: 800,
                letterSpacing: "-.05em",
                lineHeight: 1,
              }}
            >
              {currentFu.users}
            </div>
            <div className="mu" style={{ fontSize: "30px", fontWeight: 700 }}>
              reachable users
            </div>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: "20px",
              borderTop: "2px solid #e4e4e8",
              paddingTop: "26px",
            }}
          >
            {currentFu.ch.map((c, i) => (
              <div key={i}>
                <div className="mu" style={{ fontSize: "24px", fontWeight: 700 }}>
                  {c.n}
                </div>
                <div
                  style={{
                    marginTop: "6px",
                    fontSize: "46px",
                    fontWeight: 800,
                    letterSpacing: "-.03em",
                  }}
                >
                  {c.v}
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: "14px" }}>
            <span className="pill t">View</span>
            <span className="pill l">Save segment</span>
          </div>
        </div>
      );
    }

    if (currentFu.type === "plan") {
      return (
        <div className="col in" style={{ gap: "22px" }}>
          <div className="eb">THE PLAN</div>
          <div
            style={{
              fontSize: "50px",
              fontWeight: 800,
              letterSpacing: "-.035em",
              lineHeight: 1.1,
            }}
          >
            {currentFu.title}
          </div>
          <div>
            {currentFu.items.map((p, i) => (
              <div
                key={i}
                className="row in"
                style={{ animationDelay: `${(0.06 * i).toFixed(2)}s` }}
              >
                <div
                  style={{
                    width: "170px",
                    flex: "none",
                    fontSize: "28px",
                    fontWeight: 800,
                    color: "#b93000",
                  }}
                >
                  {p.k}
                </div>
                <div
                  style={{
                    fontSize: "30px",
                    fontWeight: 600,
                    lineHeight: 1.35,
                  }}
                >
                  {p.t}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (currentFu.type === "report") {
      return (
        <div className="col in" style={{ gap: "22px" }}>
          <div className="eb">DEEP RESEARCH REPORT</div>
          <div
            style={{
              fontSize: "52px",
              fontWeight: 800,
              letterSpacing: "-.04em",
              lineHeight: 1.05,
            }}
          >
            {currentFu.title}
          </div>
          <div>
            {currentFu.screens.map((r, i) => (
              <div
                key={i}
                className="in"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "22px",
                  padding: "12px 0",
                  borderTop: "2px solid #e4e4e8",
                  fontSize: "30px",
                  fontWeight: 600,
                  animationDelay: `${(0.06 * i).toFixed(2)}s`,
                }}
              >
                <div
                  style={{
                    width: "52px",
                    height: "52px",
                    flex: "none",
                    borderRadius: "50%",
                    background: "#dcb8ff",
                    color: "#000",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "24px",
                    fontWeight: 800,
                  }}
                >
                  {r.n}
                </div>
                {r.t}
              </div>
            ))}
          </div>
          <div className="mu" style={{ fontSize: "26px", fontWeight: 500, lineHeight: 1.4 }}>
            {currentFu.cov}
          </div>
          <div style={{ display: "flex", gap: "14px" }}>
            <span className="pill">PDF</span>
            <span className="pill">Email</span>
            <span className="pill">Schedule</span>
          </div>
        </div>
      );
    }

    if (currentFu.type === "chart") {
      return (
        <div className="col in" style={{ gap: "22px" }}>
          <div className="eb">ZENO COMPARED THE OPTIONS</div>
          <div className="mu" style={{ fontSize: "26px", fontWeight: 700 }}>
            {currentFu.ctitle}
          </div>
          {renderMetricBars(currentFu.bars)}
          <div
            style={{
              marginTop: "10px",
              padding: "32px 38px",
              borderRadius: "36px",
              background: "#fff1eb",
            }}
          >
            <div className="eb" style={{ letterSpacing: ".14em" }}>
              RECOMMENDATION
            </div>
            <div
              style={{
                marginTop: "10px",
                fontSize: "38px",
                fontWeight: 800,
                letterSpacing: "-.02em",
                lineHeight: 1.25,
              }}
            >
              {currentFu.rec}
            </div>
          </div>
        </div>
      );
    }

    if (currentFu.type === "checks") {
      return (
        <div className="col in" style={{ gap: "22px" }}>
          <div className="eb">WHAT ZENO FLAGGED</div>
          <div>
            {currentFu.items.map((k, i) => (
              <div
                key={i}
                className="in"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "24px",
                  padding: "20px 0",
                  borderBottom: "2px solid #e4e4e8",
                  animationDelay: `${(0.06 * i).toFixed(2)}s`,
                }}
              >
                <div style={{ fontSize: "29px", fontWeight: 600, lineHeight: 1.35 }}>
                  {k.t}
                </div>
                <div
                  style={{
                    flex: "none",
                    height: "46px",
                    padding: "0 20px",
                    borderRadius: "999px",
                    display: "flex",
                    alignItems: "center",
                    fontSize: "22px",
                    fontWeight: 800,
                    background: k.ok ? "#c2ff01" : "#fff1eb",
                    color: k.ok ? "#000" : "#b93000",
                  }}
                >
                  {k.tag}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return null;
  };

  // Step 1 to 4 Progress Dots indicator
  const renderProgress = () => {
    let n = 0;
    if (screen === "ask") n = 1;
    else if (screen === "fu") n = 2 + Math.max(0, seenFollowups.indexOf(fuIdx));
    else if (screen === "out") n = 4;

    if (!n) return null;

    return (
      <div
        className="abs"
        aria-label={`Step ${n} of 4`}
        style={{
          left: 0,
          right: 0,
          top: "232px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "10px",
        }}
      >
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            style={{
              height: "12px",
              borderRadius: "6px",
              width: i === n ? "36px" : "12px",
              background:
                i < n ? "#1c1d22" : i === n ? "#ff4502" : "#e4e4e8",
              transition: "all .3s ease",
            }}
          />
        ))}
        <div className="mu" style={{ marginLeft: "8px", fontSize: "20px", fontWeight: 700 }}>
          Step {n} of 4
        </div>
      </div>
    );
  };

  // Dynamic Suggestion Action Dock (top: 1030px)
  const renderSuggestionDock = () => {
    if (screen === "ask" || screen === "fu") {
      if (!isWorkDone) {
        return (
          <button
            className="cta o in"
            style={{ flex: "1 1 0", maxWidth: "440px" }}
            onClick={() => {
              recordInteraction();
              setTimerTick(999);
            }}
          >
            <span>Show me now</span>
            {ARROW}
          </button>
        );
      }

      if (screen === "ask") {
        return (
          <>
            <button
              className="cta p in"
              style={{ flex: "1 1 0", maxWidth: "440px" }}
              onClick={() => handleSelectFollowupClick(0)}
            >
              <span>{currentChallenge.fu[0].q}</span>
              {ARROW}
            </button>
            <button
              className="cta p in"
              style={{ flex: "1 1 0", maxWidth: "440px" }}
              onClick={() => handleSelectFollowupClick(1)}
            >
              <span>{currentChallenge.fu[1].q}</span>
              {ARROW}
            </button>
          </>
        );
      }

      if (screen === "fu") {
        const otherIdx = 1 - fuIdx;
        const hasSeenOther = seenFollowups.includes(otherIdx);
        return (
          <>
            {!hasSeenOther && (
              <button
                className="cta p in"
                style={{ flex: "1 1 0", maxWidth: "440px" }}
                onClick={() => handleSelectFollowupClick(otherIdx)}
              >
                <span>{currentChallenge.fu[otherIdx].q}</span>
                {ARROW}
              </button>
            )}
            <button
              className={`cta ${hasSeenOther ? "p" : "o"} in`}
              style={{ flex: "1 1 0", maxWidth: "440px" }}
              onClick={() => navigateTo({ screen: "out" })}
            >
              <span>See the outcome</span>
              {ARROW}
            </button>
          </>
        );
      }
    }

    if (screen === "out" || screen === "story") {
      return (
        <>
          <button
            className="cta p in"
            style={{ flex: "1 1 0", maxWidth: "440px" }}
            onClick={() => navigateTo({ screen: "lead" })}
          >
            <span>See this on your own data</span>
            {ARROW}
          </button>
          <button
            className="cta o in"
            style={{ flex: "1 1 0", maxWidth: "440px" }}
            onClick={() => navigateTo({ screen: "ch" })}
          >
            <span>Try another challenge</span>
            {ARROW}
          </button>
        </>
      );
    }

    if (screen === "lead") {
      return (
        <button
          className="cta o in"
          style={{ flex: "1 1 0", maxWidth: "440px" }}
          onClick={() => navigateTo({ screen: "ch" })}
        >
          <span>Try another challenge</span>
          {ARROW}
        </button>
      );
    }

    return null;
  };

  // Avatar position coordinates exactly matching demo:
  // Home: left: 90px, top: 900px, width: 900px, height: 900px
  // Other: left: 160px, top: 1140px, width: 760px, height: 760px
  const isHomeScreen = screen === "home";
  const zenoStyle = isHomeScreen
    ? { left: "90px", top: "900px", width: "900px", height: "900px" }
    : { left: "160px", top: "1140px", width: "760px", height: "760px" };

  const shadowStyle = isHomeScreen
    ? { left: "270px", top: "1730px", width: "540px", height: "56px" }
    : { left: "310px", top: "1838px", width: "460px", height: "44px" };

  const crumb =
    screen === "ch" || screen === "story" || screen === "lead"
      ? currentIndustry.name
      : `${currentIndustry.name} · ${currentChallenge.title}`;

  return (
    <div
      id="stage"
      ref={stageRef}
      onPointerDown={recordInteraction}
      onClick={recordInteraction}
    >
      {/* 4 Colored Corner Accents */}
      <div
        className="q"
        aria-hidden="true"
        style={{ left: 0, top: 0, background: "#c2ff01", borderRadius: "0 0 100% 0" }}
      />
      <div
        className="q"
        aria-hidden="true"
        style={{ right: 0, top: 0, background: "#0044ff", borderRadius: "0 0 0 100%" }}
      />
      <div
        className="q"
        aria-hidden="true"
        style={{ left: 0, bottom: 0, background: "#ff4502", borderRadius: "0 100% 0 0" }}
      />
      <div
        className="q"
        aria-hidden="true"
        style={{ right: 0, bottom: 0, background: "#dcb8ff", borderRadius: "100% 0 0 0" }}
      />

      {/* Top Header Brand Title */}
      <div className="abs" style={{ top: "44px", left: 0, right: 0, textAlign: "center" }}>
        <div
          style={{
            fontSize: "60px",
            fontWeight: 800,
            letterSpacing: ".22em",
            lineHeight: 1,
            paddingLeft: ".22em",
          }}
        >
          ZENO
        </div>
        <div
          style={{
            marginTop: "12px",
            fontSize: "22px",
            fontWeight: 700,
            letterSpacing: ".3em",
            color: "#b93000",
            paddingLeft: ".3em",
          }}
        >
          NETCORE AI AMBASSADOR
        </div>
      </div>

      {/* Floor Shadow */}
      <div
        id="zshadow"
        className="abs"
        style={{
          borderRadius: "50%",
          background: "#f2f2f4",
          transition: "all .4s cubic-bezier(.33,1,.68,1)",
          ...shadowStyle,
        }}
      />

      {/* Floating Zeno Character Avatar */}
      <div
        id="zeno"
        className="abs flo"
        style={{
          transition: "all .4s cubic-bezier(.33,1,.68,1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none",
          ...zenoStyle,
        }}
      >
        {isPlayingAudio || characterState === ZENO_STATES.TALKING || characterState === ZENO_STATES.LISTENING ? (
          <ZenoCharacter
            state={characterState || ZENO_STATES.IDLE}
            size="hero"
          />
        ) : (
          <img
            src={zenoAvatar}
            alt="Zeno"
            style={{ width: "100%", height: "100%", objectFit: "contain" }}
          />
        )}
      </div>

      {/* Navigation Controls on Sub-screens (top: 1190px) */}
      {!isHomeScreen && (
        <div
          className="abs"
          style={{
            top: "1190px",
            left: "60px",
            right: "60px",
            display: "flex",
            justifyContent: "space-between",
            zIndex: 2,
            pointerEvents: "none",
          }}
        >
          <button
            className="nav"
            onClick={handleBack}
            style={{ pointerEvents: "auto" }}
          >
            {BACK} Back
          </button>

          {/* Integrated Microphone Voice Button */}
          {onToggleMic && (
            <button
              className={`nav ${isRecording ? "mic-active mic-listening" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                recordInteraction();
                onToggleMic();
              }}
              style={{
                pointerEvents: "auto",
                boxShadow:
                  isRecording && liveAudioLevel > 0.05
                    ? `0 0 0 ${Math.min(14, Math.round(liveAudioLevel * 28))}px rgba(255, 69, 2, 0.28)`
                    : undefined,
              }}
              title="Click to speak"
            >
              {MIC_ICON}
              <span>
                {isRecording
                  ? vadStatus === "speech"
                    ? "Speaking..."
                    : "Listening..."
                  : "Speak"}
              </span>
            </button>
          )}

          <button
            className="nav"
            onClick={resetToHome}
            style={{ pointerEvents: "auto" }}
          >
            Start over
          </button>
        </div>
      )}

      {/* Suggestion Dock (top: 1030px) */}
      <div
        id="sugg"
        className="abs"
        style={{
          left: "90px",
          right: "90px",
          top: "1030px",
          display: "flex",
          justifyContent: "center",
          gap: "20px",
          zIndex: 2,
        }}
      >
        {renderSuggestionDock()}
      </div>

      {/* Main Content Area */}
      <div id="view">
        {isHomeScreen ? (
          /* =========================================================
             HOME SCREEN
             ========================================================= */
          <>
            <div
              className="abs in"
              style={{ top: "236px", left: "90px", width: "900px", textAlign: "center" }}
            >
              <h1
                style={{
                  margin: 0,
                  fontSize: "84px",
                  fontWeight: 800,
                  letterSpacing: "-.04em",
                  lineHeight: 1,
                }}
              >
                Hi, I’m Zeno.
              </h1>
              <p
                className="mu"
                style={{
                  margin: "22px 0 0",
                  fontSize: "36px",
                  fontWeight: 500,
                  lineHeight: 1.35,
                }}
              >
                Pick an industry. Ask me a real marketing question and watch me work it out.
              </p>
            </div>

            <div
              className="abs col"
              style={{ left: "160px", top: "500px", width: "760px", gap: "22px" }}
            >
              {D.ind.map((x, i) => (
                <button
                  key={i}
                  className="cta o in"
                  style={{
                    minHeight: "120px",
                    fontSize: "38px",
                    animationDelay: `${(0.1 + i * 0.1).toFixed(2)}s`,
                  }}
                  onClick={() => handleSelectIndustryClick(i)}
                >
                  <span>{x.name}</span>
                  <span style={{ color: "#b93000" }}>{ARROW}</span>
                </button>
              ))}
            </div>
          </>
        ) : (
          /* =========================================================
             SUB-SCREENS (ch, ask, fu, out, story, lead)
             ========================================================= */
          <>
            {/* Breadcrumb & Progress */}
            <div
              className="abs mu"
              style={{
                left: "90px",
                top: "186px",
                width: "900px",
                textAlign: "center",
                fontSize: "24px",
                fontWeight: 700,
              }}
            >
              {crumb}
            </div>
            {renderProgress()}

            <div
              className="abs col"
              style={{
                left: "90px",
                top: "290px",
                width: "900px",
                gap: screen === "ch" ? "18px" : "22px",
              }}
            >
              {/* ----------------------------------------------------
                  SCREEN: CH (Pick a Challenge)
                  ---------------------------------------------------- */}
              {screen === "ch" && (
                <>
                  <h2
                    className="in"
                    style={{
                      margin: "0 0 6px",
                      fontSize: "56px",
                      fontWeight: 800,
                      letterSpacing: "-.04em",
                      lineHeight: 1.05,
                    }}
                  >
                    Pick a challenge
                  </h2>
                  {currentIndustry.ch.map((x, i) => (
                    <button
                      key={i}
                      className="card in"
                      style={{ animationDelay: `${(0.1 + i * 0.1).toFixed(2)}s` }}
                      onClick={() => handleSelectChallengeClick(i)}
                    >
                      <div
                        style={{
                          fontSize: "36px",
                          fontWeight: 800,
                          letterSpacing: "-.02em",
                          lineHeight: 1.15,
                        }}
                      >
                        {x.title}
                      </div>
                      <div
                        className="mu"
                        style={{
                          marginTop: "8px",
                          fontSize: "23px",
                          fontWeight: 500,
                          lineHeight: 1.35,
                        }}
                      >
                        Zeno will: {x.will}
                      </div>
                    </button>
                  ))}
                  <button
                    className="card in"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "22px 34px",
                      background: "#dcb8ff",
                      borderColor: "#dcb8ff",
                      color: "#000",
                      animationDelay: ".45s",
                    }}
                    onClick={() => {
                      recordInteraction();
                      setActiveStoryBrand(currentIndustry.stories[0]);
                      navigateTo({
                        screen: "story",
                        activeStoryBrand: currentIndustry.stories[0],
                      });
                    }}
                  >
                    <span style={{ fontSize: "30px", fontWeight: 800 }}>
                      See success stories
                    </span>
                    {ARROW}
                  </button>
                </>
              )}

              {/* ----------------------------------------------------
                  SCREEN: ASK / FU (Working & Ready)
                  ---------------------------------------------------- */}
              {(screen === "ask" || screen === "fu") && (
                <>
                  {/* Speech Question Bubble (shown while working) */}
                  {!isWorkDone && (
                    <div id="qwrap" style={{ display: "flex", justifyContent: "flex-end" }}>
                      <div
                        style={{
                          maxWidth: "800px",
                          padding: "28px 40px",
                          borderRadius: "44px 44px 10px 44px",
                          background: "#1c1d22",
                          color: "#fff",
                          fontSize: "36px",
                          fontWeight: 700,
                          lineHeight: 1.3,
                          letterSpacing: "-.015em",
                        }}
                      >
                        <span id="typed">
                          {liveTranscript || currentQuestionText.slice(0, typedCount)}
                        </span>
                        {typedCount < currentQuestionText.length && (
                          <span
                            id="caret"
                            style={{
                              display: "inline-block",
                              width: "4px",
                              height: "40px",
                              marginLeft: "4px",
                              verticalAlign: "-6px",
                              background: "#fff",
                              animation: "blink .8s steps(1) infinite",
                            }}
                          />
                        )}
                      </div>
                    </div>
                  )}

                  {/* ZENO IS WORKING Steps */}
                  {!isWorkDone && typedCount >= currentQuestionText.length && (
                    <div id="steps" className="col" style={{ gap: "20px" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          fontSize: "24px",
                          fontWeight: 800,
                          letterSpacing: ".12em",
                          color: "#b93000",
                        }}
                      >
                        <div
                          style={{
                            width: "14px",
                            height: "14px",
                            borderRadius: "50%",
                            background: "#0044ff",
                          }}
                        />
                        ZENO IS WORKING
                      </div>
                      {timing.steps.map((stepText, idx) => {
                        const stepTime = timing.tq + idx * timing.per;
                        if (timerTick < stepTime) return null;
                        const isStepComplete = timerTick >= stepTime + timing.per;
                        return (
                          <div
                            key={idx}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "20px",
                              fontSize: "32px",
                              fontWeight: 600,
                              lineHeight: 1.3,
                              color: isStepComplete ? "#1c1d22" : "#5c6070",
                            }}
                          >
                            {isStepComplete ? (
                              <div
                                style={{
                                  width: "40px",
                                  height: "40px",
                                  flex: "none",
                                  borderRadius: "50%",
                                  background: "#c2ff01",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                {CHECK}
                              </div>
                            ) : (
                              <div
                                style={{
                                  width: "32px",
                                  height: "32px",
                                  flex: "none",
                                  margin: "0 4px",
                                  borderRadius: "50%",
                                  border: "4px solid #e4e4e8",
                                  borderTopColor: "#0044ff",
                                  animation: "spin .8s linear infinite",
                                }}
                              />
                            )}
                            <div>{stepText}</div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* READY RESULT VIEW */}
                  {isWorkDone && (
                    <div id="res" className="col" style={{ gap: "22px" }}>
                      {screen === "ask" ? (
                        <>
                          <div className="eb">THE ANSWER</div>
                          <div
                            style={{
                              fontSize: "44px",
                              fontWeight: 800,
                              letterSpacing: "-.03em",
                              lineHeight: 1.15,
                            }}
                          >
                            {currentChallenge.head}
                          </div>
                          <div
                            style={{
                              fontSize: "25px",
                              fontWeight: 500,
                              lineHeight: 1.4,
                              color: "#3d4150",
                            }}
                          >
                            {currentChallenge.detail}
                          </div>
                          <div
                            className="mu"
                            style={{ marginTop: "4px", fontSize: "22px", fontWeight: 700 }}
                          >
                            {currentChallenge.ctitle}
                          </div>
                          {renderMetricBars(currentChallenge.bars)}
                        </>
                      ) : (
                        <>
                          <div
                            className="mu"
                            style={{ fontSize: "26px", fontWeight: 600, lineHeight: 1.35 }}
                          >
                            You asked:{" "}
                            <span style={{ color: "#1c1d22" }}>{currentFu?.q}</span>
                          </div>
                          {renderFollowupContent()}
                        </>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* ----------------------------------------------------
                  SCREEN: OUT (The Outcome)
                  ---------------------------------------------------- */}
              {screen === "out" && (
                <div className="col in" style={{ gap: "18px" }}>
                  <div className="eb">THE OUTCOME</div>
                  <div className="mu" style={{ fontSize: "26px", fontWeight: 700 }}>
                    Time to answer
                  </div>
                  <div
                    style={{
                      fontSize: "140px",
                      fontWeight: 800,
                      letterSpacing: "-.06em",
                      lineHeight: 0.9,
                      color: "#ff4502",
                    }}
                  >
                    {currentChallenge.time}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "16px",
                      fontSize: "30px",
                      fontWeight: 600,
                    }}
                  >
                    The usual way: {currentChallenge.usual}{" "}
                    <span className="pill">Illustrative</span>
                  </div>
                  <div
                    className="mu"
                    style={{
                      marginTop: "10px",
                      paddingTop: "24px",
                      borderTop: "2px solid #e4e4e8",
                      fontSize: "26px",
                      fontWeight: 700,
                    }}
                  >
                    If you act on it
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "18px",
                      flexWrap: "wrap",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "52px",
                        fontWeight: 800,
                        letterSpacing: "-.04em",
                        lineHeight: 1.1,
                      }}
                    >
                      {currentChallenge.impact}
                    </div>
                    <span className="pill">Projected</span>
                  </div>
                  <button
                    className="card"
                    style={{
                      marginTop: "14px",
                      background: "#f6f6f8",
                      borderColor: "#f6f6f8",
                    }}
                    onClick={() => {
                      recordInteraction();
                      setActiveStoryBrand(currentChallenge.story);
                      navigateTo({
                        screen: "story",
                        activeStoryBrand: currentChallenge.story,
                      });
                    }}
                  >
                    <div className="eb" style={{ fontSize: "20px" }}>
                      SUCCESS STORY · TAP TO READ
                    </div>
                    <div style={{ marginTop: "8px", fontSize: "32px", fontWeight: 800 }}>
                      {currentChallenge.story}
                    </div>
                    <div
                      style={{
                        marginTop: "4px",
                        fontSize: "26px",
                        fontWeight: 600,
                        lineHeight: 1.3,
                      }}
                    >
                      {D.stories[currentChallenge.story]?.line}
                    </div>
                  </button>
                </div>
              )}

              {/* ----------------------------------------------------
                  SCREEN: STORY (Success Stories)
                  ---------------------------------------------------- */}
              {screen === "story" && (
                <>
                  <div className="eb">SUCCESS STORIES</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
                    {currentIndustry.stories.map((brand, i) => (
                      <button
                        key={i}
                        className={`chip ${brand === (activeStoryBrand || currentChallenge.story) ? "on" : ""}`}
                        onClick={() => {
                          recordInteraction();
                          setActiveStoryBrand(brand);
                        }}
                      >
                        {brand}
                      </button>
                    ))}
                  </div>

                  {(() => {
                    const brandName = activeStoryBrand || currentChallenge.story;
                    const storyData = D.stories[brandName] || D.stories[currentChallenge.story];
                    return (
                      <div
                        className="in"
                        style={{
                          display: "flex",
                          gap: "44px",
                          alignItems: "center",
                          marginTop: "16px",
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: "48px",
                              fontWeight: 800,
                              letterSpacing: "-.04em",
                              lineHeight: 1.05,
                            }}
                          >
                            {brandName}
                          </div>
                          <div
                            style={{
                              marginTop: "14px",
                              fontSize: "32px",
                              fontWeight: 700,
                              lineHeight: 1.25,
                            }}
                          >
                            {storyData?.line}
                          </div>
                        </div>
                        <div style={{ flex: "none", textAlign: "center" }}>
                          <div
                            style={{
                              width: "300px",
                              height: "300px",
                              padding: "22px",
                              borderRadius: "32px",
                              border: "2px solid #e4e4e8",
                              background: "#fff",
                            }}
                          >
                            <svg
                              role="img"
                              aria-label="QR code to the full success story"
                              viewBox={`-1 -1 ${(storyData?.n || 37) + 2} ${(storyData?.n || 37) + 2}`}
                              width="252"
                              height="252"
                              shapeRendering="crispEdges"
                            >
                              <path d={storyData?.d} fill="#1c1d22" />
                            </svg>
                          </div>
                          <div
                            className="mu"
                            style={{ marginTop: "14px", fontSize: "24px", fontWeight: 700 }}
                          >
                            Scan to read the full story
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </>
              )}

              {/* ----------------------------------------------------
                  SCREEN: LEAD (Your Data, Your Demo)
                  ---------------------------------------------------- */}
              {screen === "lead" && (
                <div className="col in" style={{ gap: "28px" }}>
                  <div className="eb">YOUR DATA, YOUR DEMO</div>
                  <div
                    style={{
                      fontSize: "76px",
                      fontWeight: 800,
                      letterSpacing: "-.045em",
                      lineHeight: 1.02,
                    }}
                  >
                    See this on your own data
                  </div>
                  <div style={{ display: "flex", gap: "44px", alignItems: "center" }}>
                    <div className="col" style={{ flex: 1, gap: "22px" }}>
                      {[
                        "Scan the QR code",
                        "WhatsApp opens",
                        "Send the message with your details",
                      ].map((x, i) => (
                        <div
                          key={i}
                          style={{
                            display: "flex",
                            gap: "20px",
                            alignItems: "center",
                            fontSize: "32px",
                            fontWeight: 600,
                          }}
                        >
                          <div
                            className="num"
                            style={{ background: "#0044ff", color: "#fff" }}
                          >
                            {i + 1}
                          </div>
                          {x}
                        </div>
                      ))}
                    </div>
                    <div
                      style={{
                        width: "300px",
                        height: "300px",
                        flex: "none",
                        borderRadius: "32px",
                        border: "3px dashed #c4c6cf",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        textAlign: "center",
                        gap: "10px",
                      }}
                      className="mu"
                    >
                      <div
                        style={{
                          fontSize: "30px",
                          fontWeight: 800,
                          color: "#1c1d22",
                        }}
                      >
                        WhatsApp QR
                      </div>
                      <div style={{ fontSize: "24px", fontWeight: 600 }}>
                        +91 99887 76655
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Inactivity Warning Modal (#ov) */}
      <div
        id="ov"
        className="abs"
        style={{
          inset: 0,
          zIndex: 10,
          background: "rgba(255,255,255,.94)",
          display: warnTimeout ? "flex" : "none",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "24px",
          textAlign: "center",
          padding: "60px",
          animation: "ovIn .3s ease-out",
        }}
      >
        <div style={{ fontSize: "72px", fontWeight: 800, letterSpacing: "-.04em" }}>
          Still there?
        </div>
        <div className="mu" style={{ fontSize: "32px", fontWeight: 600 }}>
          Starting over in <span id="ovleft">{countdownSeconds}</span> seconds
        </div>
        <button
          className="cta p"
          style={{ maxWidth: "520px", justifyContent: "center" }}
          onClick={() => {
            recordInteraction();
            setWarnTimeout(false);
          }}
        >
          <span>Keep exploring</span>
          {ARROW}
        </button>
        <button
          className="nav"
          onClick={resetToHome}
          style={{ height: "72px", fontSize: "22px" }}
        >
          Start over now
        </button>
      </div>
    </div>
  );
}
