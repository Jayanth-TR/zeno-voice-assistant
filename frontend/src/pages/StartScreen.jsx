import React from "react";
import HologramHeader from "../components/layout/HologramHeader";
import ZenoCharacter from "../components/ZenoCharacter";
import IndustryModal from "../components/IndustryModal";

export default function StartScreen({
  connection,
  onReconnect,
  onToggleFullscreen,
  characterState,
  onCharacterEnded,
  startPromptMessage,
  micError,
  onDismissMicError,
  onStartConversationClick,
  isIndustryModalOpen,
  onCloseIndustryModal,
  industries,
  selectedIndustry,
  onSelectIndustry,
}) {
  return (
    <main className="hologram-stage-root start-screen-mode">
      {/* Top Header Bar with Brand Title */}
      <HologramHeader
        connection={connection}
        onReconnect={onReconnect}
        onToggleFullscreen={onToggleFullscreen}
        variant="start"
      />

      {/* Hero Character Section: ONLY the avatar in the center */}
      <section className="hologram-hero-area home-hero-area">
        <div className="character-stage-wrapper">
          <ZenoCharacter
            state={characterState}
            size="hero"
            onEnded={onCharacterEnded}
          />
        </div>
      </section>

      {/* Bottom Bar: Start Conversation Button */}
      <footer className="start-screen-footer">
        {startPromptMessage && (
          <div className="prompt-toast animate-slide-up" role="alert">
            <span className="toast-icon">💡</span>
            <span>{startPromptMessage}</span>
          </div>
        )}

        {micError && (
          <div className="mic-alert-banner" role="alert">
            <span>⚠️ {micError}</span>
            <button
              type="button"
              className="alert-dismiss-btn"
              onClick={onDismissMicError}
            >
              ✕
            </button>
          </div>
        )}

        <div className="start-actions-bar">
          <button
            type="button"
            className="hero-start-btn"
            onClick={onStartConversationClick}
            disabled={connection !== "Connected"}
            aria-label="Start Conversation with Zeno"
          >
            <span>Start</span>
          </button>
        </div>
      </footer>

      <IndustryModal
        isOpen={isIndustryModalOpen}
        onClose={onCloseIndustryModal}
        industries={industries}
        selectedIndustry={selectedIndustry}
        onSelectIndustry={onSelectIndustry}
      />
    </main>
  );
}
