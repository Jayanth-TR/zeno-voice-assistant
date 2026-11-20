import React from "react";
import SourcesSection from "./SourcesSection";
import { renderFormattedContent } from "../../../utils/textUtils";

export default function ChatDrawer({
  isChatOpen,
  onCloseChat,
  messages,
  chatWindowRef,
  isPlayingAudio,
  loading,
  activeThinkingSteps,
  activeThinkingStepIndex,
  input,
  setInput,
  isRecording,
  liveTranscript,
  connection,
  isEndingConversation,
  onSendMessage,
  onStopAndSubmit,
  onResetConversation,
}) {
  return (
    <aside className={`chat-drawer-panel ${isChatOpen ? "open" : ""}`}>
      <div className="drawer-header">
        <div className="drawer-title-group">
          <h3>Conversation Transcript</h3>
          <span className="drawer-count">{messages.length} messages</span>
        </div>
        <button
          type="button"
          className="drawer-close-btn"
          onClick={onCloseChat}
          aria-label="Close Chat"
        >
          ✕
        </button>
      </div>

      <div className="drawer-chat-window" ref={chatWindowRef}>
        {messages.map((message) => (
          <div
            key={message.id}
            className={`drawer-message ${message.role}`}
          >
            <div className="msg-author">
              {message.role === "user" ? "You" : "Zeno"}
            </div>
            <div className="msg-content">
              {renderFormattedContent(message.content)}
              {message.streaming ? " ▍" : ""}
            </div>
            {!message.streaming && message.sources && (
              <SourcesSection
                sources={message.sources}
                messageId={message.id}
              />
            )}
          </div>
        ))}

        {isPlayingAudio ? (
          <div className="drawer-stream-status speaking">
            🔊 Zeno is speaking...
          </div>
        ) : loading ? (
          <div className="drawer-stream-status">
            ⏳ {activeThinkingSteps[activeThinkingStepIndex] || "Zeno is analyzing..."}
          </div>
        ) : null}
      </div>

      <div className="drawer-input-area">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              if (isRecording) onStopAndSubmit();
              else onSendMessage();
            }
          }}
          placeholder="Type your question..."
          disabled={connection !== "Connected" || isEndingConversation}
        />
        <button
          type="button"
          className="drawer-send-btn"
          onClick={() => (isRecording ? onStopAndSubmit() : onSendMessage())}
          disabled={
            (!input.trim() && !liveTranscript.trim()) ||
            connection !== "Connected" ||
            isEndingConversation
          }
        >
          Send
        </button>
      </div>

      <div className="drawer-footer-actions">
        <button
          type="button"
          className="drawer-reset-btn"
          onClick={onResetConversation}
          disabled={isEndingConversation}
        >
          Reset History
        </button>
      </div>
    </aside>
  );
}
