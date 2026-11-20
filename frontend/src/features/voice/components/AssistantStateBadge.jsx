import React from "react";

export default function AssistantStateBadge({
  isEndingConversation,
  isGreetingActive,
  isRecording,
  loading,
  isPlayingAudio,
  activeThinkingSteps,
  activeThinkingStepIndex,
}) {
  return (
    <div className="assistant-state-row" aria-live="polite">
      {isEndingConversation ? (
        <div className="state-badge goodbye">
          <span>👋 Goodbye!</span>
        </div>
      ) : isGreetingActive ? (
        <div className="state-badge talking">
          <span className="pulsing-dot blue" />
          <span>Welcoming you...</span>
        </div>
      ) : isRecording ? (
        <div className="state-badge listening">
          <span className="pulsing-dot green" />
          <span>I'm listening...</span>
        </div>
      ) : loading ? (
        <div className="state-badge thinking">
          <span className="pulsing-dot purple" />
          <span>
            {activeThinkingSteps[activeThinkingStepIndex] || "Zeno is analyzing..."}
          </span>
        </div>
      ) : isPlayingAudio ? (
        <div className="state-badge talking">
          <span className="pulsing-dot blue" />
          <span>Speaking...</span>
        </div>
      ) : (
        <div className="state-badge ready">
          <span className="pulsing-dot orange" />
          <span>I'm listening... Ask a question or tap mic</span>
        </div>
      )}
    </div>
  );
}
