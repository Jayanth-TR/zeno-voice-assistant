import React from "react";
import HologramHeader from "../components/layout/HologramHeader";
import ZenoCharacter, { ZENO_STATES } from "../components/ZenoCharacter";
import SpeechBubbles3D from "../components/SpeechBubbles3D";
import SuggestedQuestions from "../components/SuggestedQuestions";
import AssistantStateBadge from "../features/voice/components/AssistantStateBadge";
import SpeechCaption from "../features/voice/components/SpeechCaption";
import CentralControls from "../features/voice/components/CentralControls";
import ChatDrawer from "../features/chat/components/ChatDrawer";
import IndustryModal from "../components/IndustryModal";
import WhatsAppQRModal from "../components/WhatsAppQRModal";
import AdminLeadsDashboard from "../components/AdminLeadsDashboard";
import AudioSettingsPopover from "../features/voice/components/AudioSettingsPopover";

export default function ConversationScreen({
  connection,
  onReconnect,
  onToggleFullscreen,
  isChatOpen,
  setIsChatOpen,
  characterState,
  onCharacterEnded,
  spokenBubbles,
  activeBubbleIndex,
  streamingBubbleDelta,
  isPlayingAudio,
  loading,
  isGreetingActive,
  isGreetingTurn,
  isEndingConversation,
  isDismissalTurn,
  activeThinkingSteps,
  activeThinkingStepIndex,
  showSampleQuestions,
  selectedIndustry,
  activeChallenge,
  hasAskedPrimary,
  onSelectQuestion,
  onSelectChallenge,
  onResetChallenge,
  onOpenIndustryModal,
  onOpenWhatsAppLead,
  isRecording,
  liveAudioLevel,
  vadStatus,
  liveTranscript,
  onToggleMic,
  onEndConversation,
  micError,
  onRetryMic,
  onDismissMicError,
  messages,
  chatWindowRef,
  input,
  setInput,
  onSendMessage,
  onStopAndSubmit,
  onResetConversation,
  isIndustryModalOpen,
  onCloseIndustryModal,
  industries,
  onSelectIndustry,
  isWhatsAppQROpen,
  setIsWhatsAppQROpen,
  leadContext,
  isAdminLeadsOpen,
  setIsAdminLeadsOpen,
  // Audio settings modal props
  isAudioSettingsOpen,
  setIsAudioSettingsOpen,
  selectedSinkId,
  onAudioSinkChange,
  audioOutputDevices,
  isTestingAudio,
  onTestAudio,
}) {
  const isGoodbye =
    isEndingConversation ||
    characterState === ZENO_STATES.GOODBYE ||
    isDismissalTurn;
  const isAnswering = loading || isPlayingAudio || isGreetingActive || isGoodbye;
  const isShiftedLeft =
    showSampleQuestions && selectedIndustry && !isAnswering && !isGoodbye;

  return (
    <main
      className={`hologram-stage-root active-conversation-mode ${isPlayingAudio || isGreetingActive ? "is-speaking-active" : ""}`}
    >
      {/* Top Bar: Title & Connection */}
      <HologramHeader
        connection={connection}
        onReconnect={onReconnect}
        onToggleFullscreen={onToggleFullscreen}
        showChatToggle={true}
        isChatOpen={isChatOpen}
        onToggleChat={() => setIsChatOpen((prev) => !prev)}
        variant="active"
      />

      {/* Primary Character Stage: Moves left when side questions are visible, centers when answering */}
      <section
        className={`hologram-main-stage ${isShiftedLeft ? "layout-split" : "layout-centered"}`}
      >
        <div
          className={`stage-interactive-container ${isShiftedLeft ? "avatar-shifted" : "avatar-centered"} ${isPlayingAudio || isGreetingActive ? "avatar-speaking-down" : ""}`}
        >
          <div className="character-stage-wrapper">
            <ZenoCharacter
              state={characterState}
              size="hero"
              onEnded={onCharacterEnded}
            />
            <SpeechBubbles3D
              bubbles={isEndingConversation || isDismissalTurn ? [] : spokenBubbles}
              activeBubbleIndex={activeBubbleIndex}
              streamingText={
                isEndingConversation || isDismissalTurn ? "" : streamingBubbleDelta
              }
              isPlayingAudio={isPlayingAudio}
              isThinking={
                loading &&
                spokenBubbles.length === 0 &&
                !streamingBubbleDelta &&
                !isPlayingAudio &&
                characterState !== ZENO_STATES.TALKING
              }
              isGreeting={isGreetingActive || isGreetingTurn}
              thinkingSteps={activeThinkingSteps}
              currentThinkingStepIndex={activeThinkingStepIndex}
            />
          </div>

          {/* Industry Challenges & Follow-up Questions Displayed in the Right Center */}
          {isShiftedLeft && (
            <div className="side-sample-questions-wrap animate-fade-in-right">
              <SuggestedQuestions
                industry={selectedIndustry}
                activeChallenge={activeChallenge}
                hasAskedPrimary={hasAskedPrimary}
                onSelectQuestion={onSelectQuestion}
                onSelectChallenge={onSelectChallenge}
                onResetChallenge={onResetChallenge}
                onChangeIndustry={onOpenIndustryModal}
                onOpenWhatsAppLead={onOpenWhatsAppLead}
                disabled={isAnswering}
              />
            </div>
          )}
        </div>

        {/* Dynamic Assistant State Pill directly below the Character */}
        <AssistantStateBadge
          isEndingConversation={isEndingConversation}
          isGreetingActive={isGreetingActive}
          isRecording={isRecording}
          loading={loading}
          isPlayingAudio={isPlayingAudio}
          activeThinkingSteps={activeThinkingSteps}
          activeThinkingStepIndex={activeThinkingStepIndex}
        />

        {/* Live Speech / Spoken Sentence Caption below Status */}
        <SpeechCaption
          isRecording={isRecording}
          liveAudioLevel={liveAudioLevel}
          vadStatus={vadStatus}
          liveTranscript={liveTranscript}
        />

        {/* Central Controls: [ Microphone / End Conversation ] */}
        <CentralControls
          isRecording={isRecording}
          isPlayingAudio={isPlayingAudio}
          isGreetingActive={isGreetingActive}
          onToggleMic={onToggleMic}
          connection={connection}
          isEndingConversation={isEndingConversation}
          onEndConversation={onEndConversation}
        />

        {micError && (
          <div className="mic-alert-banner conversation-alert" role="alert">
            <span>⚠️ {micError}</span>
            <div className="alert-actions">
              <button
                type="button"
                className="retry-pill"
                onClick={onRetryMic}
              >
                Retry
              </button>
              <button
                type="button"
                className="dismiss-pill"
                onClick={onDismissMicError}
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Slide-over Chat Drawer (When [ Show Chat ] is Open) */}
      <ChatDrawer
        isChatOpen={isChatOpen}
        onCloseChat={() => setIsChatOpen(false)}
        messages={messages}
        chatWindowRef={chatWindowRef}
        isPlayingAudio={isPlayingAudio}
        loading={loading}
        activeThinkingSteps={activeThinkingSteps}
        activeThinkingStepIndex={activeThinkingStepIndex}
        input={input}
        setInput={setInput}
        isRecording={isRecording}
        liveTranscript={liveTranscript}
        connection={connection}
        isEndingConversation={isEndingConversation}
        onSendMessage={onSendMessage}
        onStopAndSubmit={onStopAndSubmit}
        onResetConversation={onResetConversation}
      />

      <IndustryModal
        isOpen={isIndustryModalOpen}
        onClose={onCloseIndustryModal}
        industries={industries}
        selectedIndustry={selectedIndustry}
        onSelectIndustry={onSelectIndustry}
      />

      {/* Dedicated WhatsApp QR Code Lead Capture Screen */}
      <WhatsAppQRModal
        isOpen={isWhatsAppQROpen}
        onClose={() => setIsWhatsAppQROpen(false)}
        industryName={leadContext?.industry}
      />

      {/* Admin Leads & Demo Requests Dashboard */}
      <AdminLeadsDashboard
        isOpen={isAdminLeadsOpen}
        onClose={() => setIsAdminLeadsOpen(false)}
      />

      {/* Audio Settings Popover */}
      <AudioSettingsPopover
        isOpen={isAudioSettingsOpen}
        onClose={() => setIsAudioSettingsOpen(false)}
        selectedSinkId={selectedSinkId}
        onAudioSinkChange={onAudioSinkChange}
        audioOutputDevices={audioOutputDevices}
        isTestingAudio={isTestingAudio}
        onTestAudio={onTestAudio}
      />
    </main>
  );
}
