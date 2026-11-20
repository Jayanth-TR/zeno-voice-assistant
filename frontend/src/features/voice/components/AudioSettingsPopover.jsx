import React from "react";

export default function AudioSettingsPopover({
  isOpen,
  onClose,
  selectedSinkId,
  onAudioSinkChange,
  audioOutputDevices,
  isTestingAudio,
  onTestAudio,
}) {
  if (!isOpen) return null;

  return (
    <div className="audio-settings-popover" role="dialog" aria-label="Audio Output Settings">
      <div className="audio-popover-header">
        <span className="audio-popover-title">🎧 Audio Output Settings</span>
        <button
          type="button"
          className="audio-popover-close"
          onClick={onClose}
        >
          ✕
        </button>
      </div>
      <div className="audio-popover-body">
        <label className="audio-label" htmlFor="audio-sink-select">
          Playback Device:
        </label>
        <select
          id="audio-sink-select"
          className="audio-sink-select"
          value={selectedSinkId}
          onChange={(e) => onAudioSinkChange(e.target.value)}
        >
          <option value="default">Default System Audio</option>
          {audioOutputDevices.map((device, idx) => (
            <option key={device.deviceId || idx} value={device.deviceId}>
              {device.label || `Audio Output Device ${idx + 1}`}
            </option>
          ))}
        </select>

        <button
          type="button"
          className={`audio-test-btn ${isTestingAudio ? "testing" : ""}`}
          onClick={onTestAudio}
        >
          {isTestingAudio ? "🔊 Playing Test Chime..." : "▶ Test Audio Output"}
        </button>

        <div className="audio-popover-hint">
          <strong>💡 Using Earphones on an HDMI Screen?</strong>
          <p>
            Windows automatically redirects audio to your HDMI display when connected.
            To hear through earphones: click the <strong>Speaker icon in your Windows Taskbar</strong> (bottom-right of your screen) and select your <strong>Headphones/Earphones</strong> device.
          </p>
        </div>
      </div>
    </div>
  );
}
