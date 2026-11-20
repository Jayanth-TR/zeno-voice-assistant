import React, { useState, useEffect } from "react";

// The three official industries
const INDUSTRIES = [
  "Banking & Fintech",
  "E-commerce & D2C",
  "Insurance",
];

export default function DemoRequestMobileForm() {
  const [industry, setIndustry] = useState("Banking & Fintech");
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("919342160653");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [waRedirectUrl, setWaRedirectUrl] = useState("");
  const [formError, setFormError] = useState("");

  // Ensure body and html can scroll on mobile when this form is mounted
  useEffect(() => {
    const origHtmlOverflow = document.documentElement.style.overflow;
    const origBodyOverflow = document.body.style.overflow;
    const origBodyPosition = document.body.style.position;
    const origBodyHeight = document.body.style.height;

    document.documentElement.style.overflow = "auto";
    document.documentElement.style.height = "auto";
    document.body.style.overflow = "auto";
    document.body.style.position = "static";
    document.body.style.height = "auto";

    return () => {
      document.documentElement.style.overflow = origHtmlOverflow;
      document.body.style.overflow = origBodyOverflow;
      document.body.style.position = origBodyPosition;
      document.body.style.height = origBodyHeight;
    };
  }, []);

  // Parse industry from URL parameters on load & match to one of the 3 industries
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlInd = params.get("industry") || "";
      const lower = urlInd.toLowerCase();

      if (lower.includes("ecom") || lower.includes("retail") || lower.includes("d2c")) {
        setIndustry("E-commerce & D2C");
      } else if (lower.includes("insur")) {
        setIndustry("Insurance");
      } else {
        setIndustry("Banking & Fintech");
      }
    } catch {
      // Fallback to default
    }

    // Fetch official WhatsApp Business number from backend config
    fetch("/api/leads/config")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.whatsapp_business_number) {
          const clean = data.whatsapp_business_number.replace(/[^\d]/g, "");
          if (clean) setWhatsappNumber(clean);
        }
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!name.trim()) {
      setFormError("Please enter your full name.");
      return;
    }
    if (!company.trim()) {
      setFormError("Please enter your company name.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setFormError("Please enter a valid work email.");
      return;
    }
    if (!contactNumber.trim() || contactNumber.replace(/[^\d]/g, "").length < 8) {
      setFormError("Please enter a valid contact number.");
      return;
    }

    setIsSubmitting(true);

    const formattedDate = preferredDate ? preferredDate : "Flexible / This Week";

    // Build the clean WhatsApp message template (Only the 3 industries, no challenge or success story)
    const message = `Hi! I experienced the Zeno demo at your event and would like to request a personalized demo.

Industry: ${industry}

Name: ${name.trim()}
Company: ${company.trim()}
Work Email: ${email.trim()}
Contact Number: ${contactNumber.trim()}
Preferred Demo Date: ${formattedDate}`;

    const encodedMsg = encodeURIComponent(message);
    const waUrl = `https://wa.me/${whatsappNumber}?text=${encodedMsg}`;
    setWaRedirectUrl(waUrl);

    // Save lead in backend DB immediately
    try {
      await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          company: company.trim(),
          email: email.trim(),
          contact_number: contactNumber.trim(),
          industry: industry,
          preferred_date: formattedDate,
        }),
      });
    } catch (err) {
      console.warn("Direct lead capture save failed, proceeding with WhatsApp redirect:", err);
    }

    setIsSubmitting(false);
    setSubmitted(true);

    // Open WhatsApp
    window.location.href = waUrl;
  };

  return (
    <div className="demo-mobile-page">
      <div className="demo-mobile-container">
        {/* Header / Brand */}
        <header className="demo-mobile-header">
          <div className="demo-brand-row">
            <span className="demo-brand-name">NETCORE</span>
            <span className="demo-brand-separator">•</span>
            <span className="demo-product-name">ZENO AI</span>
          </div>
          <h1 className="demo-mobile-title">Request a Personalized Demo</h1>
          <p className="demo-mobile-subtitle">
            See Zeno in action on your company's customer data
          </p>
        </header>

        {submitted ? (
          <div className="demo-success-card animate-fade-in">
            <div className="demo-success-icon">💬</div>
            <h2>Opening WhatsApp...</h2>
            <p>
              Your details are pre-filled. Please tap <strong>Send</strong> in WhatsApp
              to connect with our solutions team.
            </p>
            {waRedirectUrl && (
              <a
                href={waRedirectUrl}
                className="demo-open-wa-btn"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span>Tap here to Open WhatsApp →</span>
              </a>
            )}
            <button
              type="button"
              className="demo-reset-btn"
              onClick={() => setSubmitted(false)}
            >
              Edit Details
            </button>
          </div>
        ) : (
          <form className="demo-mobile-form" onSubmit={handleSubmit}>
            {formError && (
              <div className="demo-form-error" role="alert">
                <span>⚠️ {formError}</span>
              </div>
            )}

            {/* Industry Dropdown (Strictly the three industries) */}
            <div className="form-group">
              <label htmlFor="industry-select">Industry *</label>
              <select
                id="industry-select"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="form-input form-select"
                required
              >
                {INDUSTRIES.map((ind) => (
                  <option key={ind} value={ind}>
                    {ind}
                  </option>
                ))}
              </select>
            </div>

            {/* Name */}
            <div className="form-group">
              <label htmlFor="name-input">Full Name *</label>
              <input
                id="name-input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                className="form-input"
                required
              />
            </div>

            {/* Company */}
            <div className="form-group">
              <label htmlFor="company-input">Company Name *</label>
              <input
                id="company-input"
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g. HDFC Bank, Flipkart"
                className="form-input"
                required
              />
            </div>

            {/* Work Email */}
            <div className="form-group">
              <label htmlFor="email-input">Work Email *</label>
              <input
                id="email-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="form-input"
                required
              />
            </div>

            {/* Contact Number */}
            <div className="form-group">
              <label htmlFor="phone-input">Contact / WhatsApp Number *</label>
              <input
                id="phone-input"
                type="tel"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                placeholder="+91 98765 43210"
                className="form-input"
                required
              />
            </div>

            {/* Preferred Demo Date */}
            <div className="form-group">
              <label htmlFor="date-input">Preferred Demo Date</label>
              <input
                id="date-input"
                type="date"
                value={preferredDate}
                onChange={(e) => setPreferredDate(e.target.value)}
                className="form-input"
              />
            </div>

            {/* Prominent Continue to WhatsApp Button */}
            <button
              type="submit"
              className="demo-submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span>Submitting...</span>
              ) : (
                <>
                  <span>Continue to WhatsApp</span>
                  <span className="btn-arrow">→</span>
                </>
              )}
            </button>

            <p className="demo-form-note">
              WhatsApp will open with your details pre-filled. Simply tap <strong>Send</strong>.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
