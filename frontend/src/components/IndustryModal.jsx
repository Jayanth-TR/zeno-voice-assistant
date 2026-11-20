import React, { useEffect } from "react";

export default function IndustryModal({
  isOpen,
  onClose,
  industries = [],
  selectedIndustry = null,
  onSelectIndustry,
}) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="industry-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="industry-modal-title"
      onClick={onClose}
    >
      <div
        className="industry-modal-card experience-modal-card animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="industry-modal-close-btn"
          onClick={onClose}
          aria-label="Close Industry Selection"
        >
          ✕
        </button>

        <div className="industry-modal-header">
          <div className="industry-badge-tag">Netcore Industry Experience Center</div>
          <h2 id="industry-modal-title" className="industry-modal-heading">
            Select Your Industry
          </h2>
          <p className="industry-modal-subtext">
            Choose your sector to explore AI solutions, verified business benchmarks, and industry-specific marketing challenges.
          </p>
        </div>

        <div
          className="industry-modal-grid experience-industry-grid"
          role="radiogroup"
          aria-label="Select your industry"
        >
          {industries.map((ind) => {
            const isSelected =
              selectedIndustry?.id === ind.id ||
              selectedIndustry?.name === ind.name;

            const themeClass = `theme-${ind.id || "general"}`;

            return (
              <button
                key={ind.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                className={`industry-card-popup experience-industry-card ${themeClass} ${
                  isSelected ? "selected" : ""
                }`}
                onClick={() => {
                  onSelectIndustry(ind);
                }}
              >
                <div className="industry-card-top-row">
                  <span className="industry-card-icon" aria-hidden="true">
                    {ind.icon || "🏢"}
                  </span>
                  {isSelected && (
                    <span className="industry-popup-selected-tick" aria-hidden="true">
                      ✓ Active
                    </span>
                  )}
                </div>

                <div className="industry-card-body">
                  <h3 className="industry-card-title">{ind.name}</h3>
                  {ind.badge && (
                    <div className="industry-card-badge-pill">{ind.badge}</div>
                  )}
                  {ind.description && (
                    <p className="industry-card-desc">{ind.description}</p>
                  )}

                  {/* 3 Predefined Challenges Preview */}
                  {Array.isArray(ind.challenges) && ind.challenges.length > 0 && (
                    <div className="industry-card-challenges-preview">
                      <span className="challenges-preview-label">Key Challenges:</span>
                      <ul className="challenges-preview-list">
                        {ind.challenges.map((c) => (
                          <li key={c.id} className="challenge-preview-item">
                            <span className="bullet">•</span>
                            <span className="text">{c.title}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="industry-card-footer">
                  <span className="enter-center-btn">
                    <span>Enter Experience Center</span>
                    <span className="arrow">→</span>
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
