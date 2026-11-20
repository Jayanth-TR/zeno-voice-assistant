import React from "react";

export default function IndustrySelector({
  industries,
  selectedIndustry,
  onSelectIndustry,
  disabled = false,
}) {
  return (
    <section className="industry-selector-section" aria-labelledby="industry-heading">
      <div className="industry-header-block">
        <h2 id="industry-heading" className="industry-title">
          Which industry are you from?
        </h2>
        <p className="industry-subtitle">
          Choose your industry to explore relevant AI solutions and use cases.
        </p>
      </div>

      <div className="industry-grid" role="radiogroup" aria-label="Select your industry">
        {industries.map((ind) => {
          const isSelected =
            selectedIndustry?.id === ind.id ||
            selectedIndustry?.name === ind.name;

          return (
            <button
              key={ind.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              className={`industry-card ${isSelected ? "selected" : ""}`}
              onClick={() => onSelectIndustry(ind)}
              disabled={disabled}
            >
              <span className="industry-icon" aria-hidden="true">
                {ind.icon || "🏢"}
              </span>
              <span className="industry-name">{ind.name}</span>
              {isSelected && (
                <span className="industry-selected-badge" aria-hidden="true">
                  ✓
                </span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}

