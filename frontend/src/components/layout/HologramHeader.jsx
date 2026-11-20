import React from "react";

export default function HologramHeader({
  connection,
  onReconnect,
  onToggleFullscreen,
  showChatToggle = false,
  isChatOpen = false,
  onToggleChat,
  variant = "start", // "start" or "active"
}) {
  return (
    <header className={`hologram-header ${variant === "active" ? "active-header" : "start-header"}`}>
      <div
        className={`status-pill ${connection !== "Connected" ? "clickable" : ""}`}
        onClick={() => {
          if (connection !== "Connected") {
            console.log("[Zeno] User triggered manual reconnection.");
            onReconnect?.(true);
          }
        }}
        title={
          connection === "Connected"
            ? "Status: Connected"
            : `Status: ${connection} (Click to Reconnect)`
        }
        aria-label={`Status: ${connection}`}
      >
        <span
          className={`status-dot ${connection === "Connected" ? "online" : connection === "Connecting..." ? "connecting" : ""}`}
        />
        {connection !== "Connected" && (
          <span className="status-reconnect-badge">
            {connection === "Connecting..." ? "Connecting..." : "Reconnect"}
          </span>
        )}
      </div>

      <div className="center-header-title">
        <span className="header-brand-name">ZENO</span>
        <span className="header-brand-sub">Netcore AI Ambassador</span>
      </div>

      <div className="header-right-actions">
        <button
          type="button"
          className="fullscreen-toggle-btn"
          onClick={onToggleFullscreen}
          title="Toggle Fullscreen for HoloBox"
          aria-label="Toggle Fullscreen"
        >
          ⛶
        </button>

        {showChatToggle && (
          <button
            type="button"
            className={`toggle-chat-pill icon-only-pill ${isChatOpen ? "active" : ""}`}
            onClick={onToggleChat}
            title={isChatOpen ? "Close chat transcript" : "Open chat transcript"}
            aria-label="Chat"
          >
            <span>💬</span>
          </button>
        )}
      </div>
    </header>
  );
}
