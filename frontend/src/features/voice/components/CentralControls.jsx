import React from "react";

export default function CentralControls({
  isRecording,
  isPlayingAudio,
  isGreetingActive,
  onToggleMic,
  connection,
  isEndingConversation,
  onEndConversation,
}) {
  const isSpeaking = isPlayingAudio || isGreetingActive;

  return (
    <div className="central-controls-row">
      <button
        type="button"
        className={`grand-mic-button ${isRecording
          ? "recording pulse-ring"
          : isSpeaking
            ? "speaking-interrupt"
            : "ready-mic"
          }`}
        onClick={onToggleMic}
        disabled={connection !== "Connected" || isEndingConversation}
        title={
          isRecording
            ? "Turn off microphone / submit"
            : isSpeaking
              ? "Interrupt speech"
              : "Click to speak"
        }
        aria-label="Microphone"
      >
        {isRecording ? "⏹" : isSpeaking ? "⏸" : "🎙️"}
      </button>

      <button
        type="button"
        className="end-convo-pill"
        onClick={onEndConversation}
        disabled={isEndingConversation}
        title="End conversation"
      >
        {isEndingConversation ? "Ending..." : "End Conversation"}
      </button>
    </div>
  );
}
