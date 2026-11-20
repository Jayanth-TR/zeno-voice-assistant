import React, { useState, useEffect } from "react";

export default function SuggestedQuestions({
  industry,
  activeChallenge = null,
  hasAskedPrimary: propHasAskedPrimary = undefined,
  onSelectQuestion,
  onSelectChallenge,
  onResetChallenge,
  onChangeIndustry,
  onOpenWhatsAppLead,
  disabled = false,
}) {
  if (!industry) return null;

  const challenges = industry.challenges || [];
  const rawQuestions = industry.questions || [];

  // Track whether the primary question for the currently selected challenge has been asked
  const [internalHasAskedPrimary, setInternalHasAskedPrimary] = useState(false);
  const isPrimaryAsked = propHasAskedPrimary !== undefined ? propHasAskedPrimary : internalHasAskedPrimary;

  // Reset when active challenge changes
  useEffect(() => {
    setInternalHasAskedPrimary(false);
  }, [activeChallenge?.id]);

  // If assistant starts answering/speaking while a challenge is active, ensure follow-ups reveal
  useEffect(() => {
    if (disabled && activeChallenge) {
      setInternalHasAskedPrimary(true);
    }
  }, [disabled, activeChallenge]);

  return (
    <div
      className="questions-callout-column animate-fade-in"
      aria-label={`Experience Center challenges for ${industry.name}`}
    >
      {/* Top Industry & Action Bar */}
      <div className="questions-top-bar">
        <div className="industry-pill-badge" title={industry.badge || industry.name}>
          <span className="industry-pill-icon">{industry.icon || "🏢"}</span>
          <span className="industry-pill-name">{industry.name}</span>
        </div>

        <div className="questions-top-actions">
          {onChangeIndustry && (
            <button
              type="button"
              className="change-industry-pill"
              onClick={onChangeIndustry}
              disabled={disabled}
              title="Select a different industry"
            >
              ← Change
            </button>
          )}
        </div>
      </div>

      {/* VIEW A: Active Challenge Pane */}
      {activeChallenge ? (
        <div className="active-challenge-experience-pane animate-fade-in">
          {/* Active Challenge Header Card */}
          <div className="active-challenge-header-card">
            <div className="active-challenge-meta-row">
              <span className="challenge-tag-badge">CHALLENGE</span>
              {onResetChallenge && (
                <button
                  type="button"
                  className="view-all-challenges-btn"
                  onClick={() => {
                    setInternalHasAskedPrimary(false);
                    onResetChallenge();
                  }}
                  disabled={disabled}
                  title="View all challenges for this industry"
                >
                  ← All Challenges
                </button>
              )}
            </div>
            <h3 className="active-challenge-heading">{activeChallenge.title}</h3>
          </div>

          {/* Primary Question to click */}
          {!isPrimaryAsked ? (
            <div className="primary-question-container animate-fade-in">
              <span className="section-prompt-label">Tap to ask Zeno:</span>
              <button
                type="button"
                className="question-bubble-card primary-ask-bubble"
                onClick={() => {
                  setInternalHasAskedPrimary(true);
                  onSelectQuestion(activeChallenge.question, activeChallenge.id);
                }}
                disabled={disabled}
                aria-label={`Ask Question: ${activeChallenge.question}`}
              >
                <svg
                  className="bubble-callout-tail-left"
                  width="18"
                  height="22"
                  viewBox="0 0 18 22"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M18 4 L2 11 L18 18 Z"
                    fill="#ffffff"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinejoin="round"
                  />
                  <path d="M17.5 5 L17.5 17" stroke="#ffffff" strokeWidth="3" />
                </svg>

                <div className="bubble-card-inner">
                  <div className="bubble-header-row">
                    <span className="bubble-q-tag">QUESTION</span>
                    <span className="bubble-click-hint" aria-hidden="true">Ask Zeno →</span>
                  </div>
                  <p className="bubble-q-text">"{activeChallenge.question}"</p>
                </div>
              </button>
            </div>
          ) : (
            <>
              {/* Question Asked Callout */}
              <div className="active-challenge-question-block animate-fade-in">
                <span className="active-q-label">Question:</span>
                <p className="active-challenge-q">"{activeChallenge.question}"</p>
              </div>

              {/* Follow-up Questions Header */}
              <div className="followup-questions-header animate-fade-in">
                <span className="followup-header-title">Suggested Follow-Up Questions:</span>
              </div>

              {/* Follow-up Bubbles Stack */}
              <div className="questions-bubbles-stack animate-fade-in">
                {(activeChallenge.follow_ups || []).map((followUp, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`question-bubble-card followup-bubble-card question-bubble-${idx + 1}`}
                    onClick={() => onSelectQuestion(followUp, activeChallenge.id)}
                    disabled={disabled}
                    aria-label={`Ask follow-up: ${followUp}`}
                  >
                    <svg
                      className="bubble-callout-tail-left"
                      width="18"
                      height="22"
                      viewBox="0 0 18 22"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      aria-hidden="true"
                    >
                      <path
                        d="M18 4 L2 11 L18 18 Z"
                        fill="#ffffff"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinejoin="round"
                      />
                      <path d="M17.5 5 L17.5 17" stroke="#ffffff" strokeWidth="3" />
                    </svg>

                    <div className="bubble-card-inner">
                      <div className="bubble-header-row">
                        <span className="bubble-q-tag">FOLLOW-UP {idx + 1}</span>
                        <span className="bubble-click-hint" aria-hidden="true">→</span>
                      </div>
                      <p className="bubble-q-text">"{followUp}"</p>
                    </div>
                  </button>
                ))}

                {/* Direct WhatsApp Lead CTA: Connect with Us */}
                {onOpenWhatsAppLead && (
                  <button
                    type="button"
                    className="connect-with-us-btn see-on-own-data-btn"
                    onClick={() =>
                      onOpenWhatsAppLead({
                        industry: industry.name,
                        challenge: activeChallenge?.title,
                      })
                    }
                    disabled={disabled}
                    title="Scan QR to connect with Netcore experts"
                  >
                    <span>Connect with Us →</span>
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      ) : (
        /* VIEW B: Main Industry Challenges View */
        <div className="industry-challenges-main-pane">
          <div className="challenges-section-lead">
            <h3 className="lead-heading">Select a Business Challenge</h3>
          </div>

          <div className="questions-bubbles-stack">
            {challenges.length > 0
              ? challenges.map((ch, idx) => (
                <button
                  key={ch.id || idx}
                  type="button"
                  className={`question-bubble-card challenge-bubble-card question-bubble-${idx + 1}`}
                  onClick={() => {
                    if (onSelectChallenge) {
                      onSelectChallenge(ch);
                    }
                  }}
                  disabled={disabled}
                  aria-label={`Select Challenge ${idx + 1}: ${ch.title}`}
                >
                  <svg
                    className="bubble-callout-tail-left"
                    width="18"
                    height="22"
                    viewBox="0 0 18 22"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <path
                      d="M18 4 L2 11 L18 18 Z"
                      fill="#ffffff"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinejoin="round"
                    />
                    <path d="M17.5 5 L17.5 17" stroke="#ffffff" strokeWidth="3" />
                  </svg>

                  <div className="bubble-card-inner">
                    <div className="bubble-header-row">
                      <span className="bubble-q-tag">CHALLENGE {idx + 1}</span>
                      <span className="bubble-click-hint" aria-hidden="true">→</span>
                    </div>
                    <p className="bubble-q-text">{ch.title}</p>
                  </div>
                </button>
              ))
              : rawQuestions.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`question-bubble-card question-bubble-${idx + 1}`}
                  onClick={() => onSelectQuestion(q)}
                  disabled={disabled}
                  aria-label={`Ask Question ${idx + 1}: ${q}`}
                >
                  <svg
                    className="bubble-callout-tail-left"
                    width="18"
                    height="22"
                    viewBox="0 0 18 22"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <path
                      d="M18 4 L2 11 L18 18 Z"
                      fill="#ffffff"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinejoin="round"
                    />
                    <path d="M17.5 5 L17.5 17" stroke="#ffffff" strokeWidth="3" />
                  </svg>

                  <div className="bubble-card-inner">
                    <div className="bubble-header-row">
                      <span className="bubble-q-tag">QUESTION {idx + 1}</span>
                      <span className="bubble-click-hint" aria-hidden="true">→</span>
                    </div>
                    <p className="bubble-q-text">{q}</p>
                  </div>
                </button>
              ))}

            {/* Direct WhatsApp Lead CTA: Connect with Us */}
            {onOpenWhatsAppLead && (
              <button
                type="button"
                className="connect-with-us-btn see-on-own-data-btn"
                onClick={() =>
                  onOpenWhatsAppLead({
                    industry: industry.name,
                  })
                }
                disabled={disabled}
                title="Scan QR to connect with Netcore experts"
              >
                <span>Connect with Us →</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
