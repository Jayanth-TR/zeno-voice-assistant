import React, { useState, useEffect } from "react";

const COUNTRY_CODES = [
  { code: "+91", label: "+91 (India)" },
  { code: "+1", label: "+1 (USA/Canada)" },
  { code: "+44", label: "+44 (UK)" },
  { code: "+65", label: "+65 (Singapore)" },
  { code: "+971", label: "+971 (UAE)" },
  { code: "+61", label: "+61 (Australia)" },
  { code: "+49", label: "+49 (Germany)" },
  { code: "+33", label: "+33 (France)" },
  { code: "+81", label: "+81 (Japan)" },
  { code: "+60", label: "+60 (Malaysia)" },
  { code: "+62", label: "+62 (Indonesia)" },
  { code: "+63", label: "+63 (Philippines)" },
  { code: "+27", label: "+27 (South Africa)" },
  { code: "+234", label: "+234 (Nigeria)" },
  { code: "+254", label: "+254 (Kenya)" },
];

export default function SmeConnectionModal({
  isOpen,
  onClose,
  selectedIndustry,
  activeChallenge = null,
  industries = [],
  apiBaseUrl = "",
}) {
  const [smes, setSmes] = useState([]);
  const [loadingSmes, setLoadingSmes] = useState(false);

  // Form State
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [industryName, setIndustryName] = useState(selectedIndustry?.name || "E-commerce & D2C");
  const [selectedSmeId, setSelectedSmeId] = useState("");
  const [connectionPreference, setConnectionPreference] = useState("request_a_callback");
  const [preferredDateTime, setPreferredDateTime] = useState("");
  const [businessRequirement, setBusinessRequirement] = useState(
    activeChallenge ? `${activeChallenge.title}: ${activeChallenge.question}` : ""
  );
  const [consent, setConsent] = useState(false);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [submissionResult, setSubmissionResult] = useState(null);

  // Prepopulate industry and requirement when props change
  useEffect(() => {
    if (selectedIndustry?.name) {
      setIndustryName(selectedIndustry.name);
    }
  }, [selectedIndustry]);

  useEffect(() => {
    if (activeChallenge) {
      setBusinessRequirement(`${activeChallenge.title}: ${activeChallenge.question}`);
    }
  }, [activeChallenge]);

  // Fetch available SMEs when modal opens or industry changes
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setLoadingSmes(true);

    const query = industryName ? `?industry=${encodeURIComponent(industryName)}` : "";
    fetch(`${apiBaseUrl}/api/smes${query}`)
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        const fetched = data.smes || [];
        setSmes(fetched);
        if (fetched.length > 0) {
          setSelectedSmeId((prev) => prev || fetched[0].id);
        }
      })
      .catch((err) => {
        console.warn("[Zeno] Failed to fetch SMEs:", err);
      })
      .finally(() => {
        if (isMounted) setLoadingSmes(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, industryName, apiBaseUrl]);

  if (!isOpen) return null;

  const validateForm = () => {
    const errors = {};
    if (!fullName.trim() || fullName.trim().length < 2) {
      errors.fullName = "Please enter your full name (at least 2 characters).";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      errors.email = "Please enter a valid email address.";
    }

    const cleanDigits = phoneNumber.replace(/[^\d]/g, "");
    if (!phoneNumber.trim() || cleanDigits.length < 7 || cleanDigits.length > 15) {
      errors.phoneNumber = "Please enter a valid phone number (7-15 digits).";
    }

    if (!selectedSmeId) {
      errors.selectedSmeId = "Please select an expert to connect with.";
    }

    if (!consent) {
      errors.consent = "You must agree to share your contact details to proceed.";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setFormErrors({});

    const payload = {
      full_name: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone: `${countryCode} ${phoneNumber.trim()}`,
      industry: industryName,
      sme_id: selectedSmeId,
      connection_preference: connectionPreference,
      preferred_date_time: preferredDateTime.trim() || null,
      business_requirement: businessRequirement.trim() || null,
      consent: consent,
    };

    try {
      const res = await fetch(`${apiBaseUrl}/api/sme-connection`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Failed to submit request.");
      }

      setSubmissionResult(data);
    } catch (err) {
      setFormErrors({ submit: err.message || "An unexpected error occurred. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setSubmissionResult(null);
    setFormErrors({});
    onClose();
  };

  const currentSelectedSme = smes.find((s) => s.id === selectedSmeId);

  return (
    <div className="sme-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="sme-modal-title">
      <div className="sme-modal-card animate-scale-up">
        {/* Modal Close Button */}
        <button
          type="button"
          className="sme-modal-close-btn"
          onClick={handleResetAndClose}
          aria-label="Close modal"
        >
          ✕
        </button>

        {submissionResult ? (
          /* Confirmation Screen */
          <div className="sme-confirmation-block">
            <div className="confirmation-icon-wrap">
              <span className="confirmation-badge-icon">✓</span>
            </div>

            <h3 className="confirmation-title">
              {submissionResult.notification_status === "failed"
                ? "Connection Request Received"
                : "Thank you! Your connection request has been submitted successfully."}
            </h3>

            <p className="confirmation-message">
              {submissionResult.notification_status === "failed"
                ? "Our team has recorded your enquiry and will follow up with you shortly."
                : "Our expert will get in touch with you shortly."}
            </p>

            {submissionResult.request_id && (
              <div className="reference-pill-box">
                <span className="ref-label">Reference ID:</span>
                <span className="ref-id-value">{submissionResult.request_id}</span>
              </div>
            )}

            {submissionResult.expert_name && (
              <p className="confirmation-expert-info">
                Selected Expert: <strong>{submissionResult.expert_name}</strong>
              </p>
            )}

            {submissionResult.whatsapp_link && (
              <div className="whatsapp-action-wrapper" style={{ margin: "14px 0" }}>
                <a
                  href={submissionResult.whatsapp_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="whatsapp-direct-send-btn"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    background: "#25D366",
                    color: "#ffffff",
                    padding: "10px 20px",
                    borderRadius: "24px",
                    fontWeight: "700",
                    fontSize: "13.5px",
                    textDecoration: "none",
                    boxShadow: "0 4px 14px rgba(37, 211, 102, 0.35)",
                    transition: "all 0.2s ease",
                  }}
                >
                  <span style={{ fontSize: "16px" }}>💬</span>
                  <span>Open & Send on WhatsApp ({submissionResult.sme_whatsapp || "+91 9342160653"})</span>
                </a>
              </div>
            )}

            <button
              type="button"
              className="confirmation-done-btn"
              onClick={handleResetAndClose}
            >
              Done & Return to Zeno
            </button>
          </div>
        ) : (
          /* Input Form Screen */
          <form className="sme-form-content" onSubmit={handleSubmit}>
            <div className="sme-modal-header">
              <div className="sme-badge-tag">Netcore SME Network</div>
              <h2 id="sme-modal-title" className="sme-modal-heading">
                Connect with a SME
              </h2>
              <p className="sme-modal-subtext">
                Interested in exploring this further? Share your details and our SME will get in touch with you.
              </p>
            </div>

            {formErrors.submit && (
              <div className="sme-form-error-banner" role="alert">
                ⚠️ {formErrors.submit}
              </div>
            )}

            <div className="sme-fields-grid">
              {/* Full Name */}
              <div className="sme-field-group">
                <label htmlFor="sme-fullName">
                  Full Name <span className="required-star">*</span>
                </label>
                <input
                  id="sme-fullName"
                  type="text"
                  placeholder="e.g. John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className={formErrors.fullName ? "input-error" : ""}
                  disabled={isSubmitting}
                />
                {formErrors.fullName && (
                  <span className="field-error-text">{formErrors.fullName}</span>
                )}
              </div>

              {/* Email Address */}
              <div className="sme-field-group">
                <label htmlFor="sme-email">
                  Email Address <span className="required-star">*</span>
                </label>
                <input
                  id="sme-email"
                  type="email"
                  placeholder="e.g. john.doe@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={formErrors.email ? "input-error" : ""}
                  disabled={isSubmitting}
                />
                {formErrors.email && (
                  <span className="field-error-text">{formErrors.email}</span>
                )}
              </div>

              {/* Mobile Number with Country Code */}
              <div className="sme-field-group full-width">
                <label htmlFor="sme-phone">
                  Mobile Number <span className="required-star">*</span>
                </label>
                <div className="phone-input-row">
                  <select
                    className="country-code-select"
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    disabled={isSubmitting}
                  >
                    {COUNTRY_CODES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                  <input
                    id="sme-phone"
                    type="tel"
                    placeholder="9876543210"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className={`phone-text-input ${formErrors.phoneNumber ? "input-error" : ""}`}
                    disabled={isSubmitting}
                  />
                </div>
                {formErrors.phoneNumber && (
                  <span className="field-error-text">{formErrors.phoneNumber}</span>
                )}
              </div>

              {/* Industry Dropdown */}
              <div className="sme-field-group">
                <label htmlFor="sme-industry">Industry</label>
                <select
                  id="sme-industry"
                  value={industryName}
                  onChange={(e) => setIndustryName(e.target.value)}
                  disabled={isSubmitting}
                >
                  {industries.map((ind) => (
                    <option key={ind.id} value={ind.name}>
                      {ind.name}
                    </option>
                  ))}
                  {!industries.some((i) => i.name === industryName) && (
                    <option value={industryName}>{industryName}</option>
                  )}
                </select>
              </div>

              {/* SME Dropdown */}
              <div className="sme-field-group">
                <label htmlFor="sme-select">
                  Select an SME <span className="required-star">*</span>
                </label>
                <select
                  id="sme-select"
                  value={selectedSmeId}
                  onChange={(e) => setSelectedSmeId(e.target.value)}
                  disabled={isSubmitting || loadingSmes}
                  className={formErrors.selectedSmeId ? "input-error" : ""}
                >
                  {smes.map((sme) => {
                    const isIndustryMatch =
                      sme.supported_industries?.includes("All") ||
                      sme.supported_industries?.includes(industryName);
                    return (
                      <option key={sme.id} value={sme.id}>
                        {sme.name} – {sme.designation} {isIndustryMatch ? "★ (Recommended)" : ""}
                      </option>
                    );
                  })}
                </select>
                {formErrors.selectedSmeId && (
                  <span className="field-error-text">{formErrors.selectedSmeId}</span>
                )}
              </div>

              {/* SME Expertise Details Callout */}
              {currentSelectedSme && (
                <div className="sme-expertise-callout full-width">
                  <div className="callout-header">
                    <span className="expert-avatar-icon">👨‍💼</span>
                    <div>
                      <div className="callout-name">{currentSelectedSme.name}</div>
                      <div className="callout-designation">{currentSelectedSme.designation}</div>
                    </div>
                  </div>
                  <div className="callout-desc">
                    <strong>Expertise:</strong> {currentSelectedSme.expertise}
                  </div>
                </div>
              )}

              {/* Connection Preference */}
              <div className="sme-field-group full-width">
                <label>Connection Preference</label>
                <div className="preference-radio-group">
                  <label className={`pref-card ${connectionPreference === "request_a_callback" ? "active" : ""}`}>
                    <input
                      type="radio"
                      name="connectionPreference"
                      value="request_a_callback"
                      checked={connectionPreference === "request_a_callback"}
                      onChange={(e) => setConnectionPreference(e.target.value)}
                      disabled={isSubmitting}
                    />
                    <span className="pref-icon">📞</span>
                    <span className="pref-title">Request a callback</span>
                  </label>

                  <label className={`pref-card ${connectionPreference === "request_a_meeting" ? "active" : ""}`}>
                    <input
                      type="radio"
                      name="connectionPreference"
                      value="request_a_meeting"
                      checked={connectionPreference === "request_a_meeting"}
                      onChange={(e) => setConnectionPreference(e.target.value)}
                      disabled={isSubmitting}
                    />
                    <span className="pref-icon">📅</span>
                    <span className="pref-title">Request a meeting or call</span>
                  </label>

                  <label className={`pref-card ${connectionPreference === "contact_by_email" ? "active" : ""}`}>
                    <input
                      type="radio"
                      name="connectionPreference"
                      value="contact_by_email"
                      checked={connectionPreference === "contact_by_email"}
                      onChange={(e) => setConnectionPreference(e.target.value)}
                      disabled={isSubmitting}
                    />
                    <span className="pref-icon">✉️</span>
                    <span className="pref-title">Contact me by email</span>
                  </label>
                </div>
              </div>

              {/* Preferred Date / Time */}
              <div className="sme-field-group">
                <label htmlFor="sme-preferredTime">Preferred Date & Time (Optional)</label>
                <input
                  id="sme-preferredTime"
                  type="text"
                  placeholder="e.g. Today 4 PM or Tomorrow morning"
                  value={preferredDateTime}
                  onChange={(e) => setPreferredDateTime(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              {/* Business Challenge / Requirement */}
              <div className="sme-field-group full-width">
                <label htmlFor="sme-requirement">Business Question / Requirement (Optional)</label>
                <input
                  id="sme-requirement"
                  type="text"
                  placeholder="e.g. Discuss abandoned cart recovery strategies"
                  value={businessRequirement}
                  onChange={(e) => setBusinessRequirement(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              {/* Consent Checkbox */}
              <div className="sme-field-group full-width consent-group">
                <label className="consent-checkbox-label">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    disabled={isSubmitting}
                  />
                  <span>
                    I agree to share my contact details with the selected expert so they can contact me regarding my enquiry. <span className="required-star">*</span>
                  </span>
                </label>
                {formErrors.consent && (
                  <span className="field-error-text">{formErrors.consent}</span>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="sme-modal-actions">
              <button
                type="button"
                className="sme-cancel-btn"
                onClick={handleResetAndClose}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="sme-submit-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="btn-spinner" aria-hidden="true" />
                    Submitting...
                  </>
                ) : (
                  "Request a Connection"
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
