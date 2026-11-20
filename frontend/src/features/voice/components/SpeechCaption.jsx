import React from "react";

export default function SpeechCaption({
  isRecording,
  liveAudioLevel,
  vadStatus,
  liveTranscript,
}) {
  return (
    <div className="speech-caption-area">
      {isRecording && (
        <div className="live-caption-dock animate-fade-in">
          <div className="waveform-inline" aria-hidden="true">
            {[0.5, 0.8, 1.2, 1.0, 1.3, 0.9, 0.7, 0.4].map((mult, idx) => {
              const scaledHeight = Math.max(
                4,
                Math.min(24, Math.round((liveAudioLevel / 100) * 24 * mult))
              );
              return (
                <span
                  key={idx}
                  className={`wave-bar ${vadStatus === "speaking" ? "active" : ""}`}
                  style={{ height: `${scaledHeight}px` }}
                />
              );
            })}
          </div>
          <span className="caption-text">
            {liveTranscript ? `"${liveTranscript}"` : "Listening to your voice..."}
          </span>
        </div>
      )}
    </div>
  );
}
