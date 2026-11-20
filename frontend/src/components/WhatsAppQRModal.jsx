import React, { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";

export default function WhatsAppQRModal({
  isOpen,
  onClose,
  industryName = "Banking & Fintech",
}) {
  const [appUrl, setAppUrl] = useState("");
  const [configNumber, setConfigNumber] = useState("+919342160653");

  // Fetch backend config (app_url with LAN IP + official WhatsApp number)
  useEffect(() => {
    fetch("/api/leads/config")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          if (data.app_url) setAppUrl(data.app_url);
          if (data.whatsapp_business_number) setConfigNumber(data.whatsapp_business_number);
        }
      })
      .catch(() => {});
  }, []);

  if (!isOpen) return null;

  // Determine base URL:
  // 1. If currently accessed from non-localhost (e.g. mobile or LAN), use current origin
  // 2. Otherwise use detected LAN IP app_url from backend
  // 3. Fallback to current origin
  let effectiveBaseUrl = window.location.origin;
  const isLocalhost =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";

  if (isLocalhost && appUrl) {
    effectiveBaseUrl = appUrl;
  }

  // Mobile form URL with selected industry parameter
  const encodedIndustry = encodeURIComponent(industryName || "Banking & Fintech");
  const mobileFormUrl = `${effectiveBaseUrl}/demo-request?industry=${encodedIndustry}`;

  return (
    <div className="wa-qr-modal-backdrop animate-fade-in" role="dialog" aria-modal="true">
      <div className="wa-qr-modal-container wa-qr-modal-compact animate-scale-up">
        {/* Modal Header */}
        <div className="wa-qr-modal-header">
          <div>
            <h2 className="wa-qr-title">See This on Your Own Data</h2>
            <p className="wa-qr-subtitle">
              Scan with your phone camera to request a personalized demo
            </p>
          </div>

          <button
            type="button"
            className="wa-qr-close-btn"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Modal Body - Clean & Centered (How it works section removed) */}
        <div className="wa-qr-body-centered">
          <div className="wa-qr-card">
            <div className="wa-qr-svg-wrapper">
              <QRCodeSVG
                value={mobileFormUrl}
                size={230}
                level="M"
                includeMargin={true}
                bgColor="#ffffff"
                fgColor="#0f172a"
              />
            </div>

            <div className="wa-qr-scan-badge">
              <span>📱 Scan with your phone camera</span>
            </div>
          </div>

          <div className="wa-direct-actions">
            <a
              href={mobileFormUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="wa-open-chat-btn"
            >
              <span>Open Form in Browser →</span>
            </a>
          </div>

          <div className="wa-kiosk-note">
            <span>Official WhatsApp Business: <strong>{configNumber}</strong></span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="wa-qr-modal-footer">
          <div className="footer-policy-note">
            <span>🛡️ Our client solutions team coordinates demo schedules directly with you.</span>
          </div>

          <button type="button" className="footer-return-btn" onClick={onClose}>
            Back to Assistant
          </button>
        </div>
      </div>
    </div>
  );
}
