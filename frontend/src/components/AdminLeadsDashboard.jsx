import React, { useState, useEffect, useCallback } from "react";

const LEAD_STATUSES = [
  "New",
  "Contacted",
  "Demo Scheduled",
  "Demo Completed",
  "Follow-up",
];

const STATUS_COLORS = {
  New: { bg: "#eff6ff", text: "#1d4ed8", border: "#bfdbfe" },
  Contacted: { bg: "#fef3c7", text: "#b45309", border: "#fde68a" },
  "Demo Scheduled": { bg: "#ecfdf5", text: "#047857", border: "#a7f3d0" },
  "Demo Completed": { bg: "#f0fdf4", text: "#15803d", border: "#bbf7d0" },
  "Follow-up": { bg: "#faf5ff", text: "#7e22ce", border: "#e9d5ff" },
};

export default function AdminLeadsDashboard({ isOpen, onClose }) {
  const [leads, setLeads] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("All");
  const [industryFilter, setIndustryFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const [simulating, setSimulating] = useState(false);
  const [activeLeadDetails, setActiveLeadDetails] = useState(null);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "All") params.append("status", statusFilter);
      if (industryFilter !== "All") params.append("industry", industryFilter);
      if (searchQuery.trim()) params.append("search", searchQuery.trim());

      const res = await fetch(`/api/leads?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLeads(data.leads || []);
      }

      const statsRes = await fetch("/api/leads/stats");
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
    } catch (err) {
      console.error("Failed to fetch leads:", err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, industryFilter, searchQuery]);

  useEffect(() => {
    if (isOpen) {
      fetchLeads();
    }
  }, [isOpen, fetchLeads]);

  const handleStatusChange = async (leadId, newStatus) => {
    setUpdatingId(leadId);
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setLeads((prev) =>
          prev.map((lead) =>
            lead.lead_id === leadId
              ? { ...lead, status: newStatus, updated_at: new Date().toISOString() }
              : lead
          )
        );
        // Refresh stats
        const statsRes = await fetch("/api/leads/stats");
        if (statsRes.ok) setStats(await statsRes.json());
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSimulateLead = async () => {
    setSimulating(true);
    try {
      const sampleIndustries = [
        "Retail & E-commerce",
        "Banking & Fintech",
        "Insurance",
        "Telecommunications",
        "Travel & Hospitality",
        "Healthcare",
      ];
      const randomInd = sampleIndustries[Math.floor(Math.random() * sampleIndustries.length)];

      const randomNames = ["Vikram Malhotra", "Ananya Sharma", "Rohit Deshmukh", "Pooja Hegde"];
      const chosenName = randomNames[Math.floor(Math.random() * randomNames.length)];
      const company = chosenName.split(" ")[0] + " Global Ventures";

      const res = await fetch("/api/leads/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: chosenName,
          company: company,
          email: `${chosenName.toLowerCase().replace(" ", ".")}@${chosenName.toLowerCase().split(" ")[0]}ventures.com`,
          contact_number: "+9198" + Math.floor(10000000 + Math.random() * 90000000),
          industry: randomInd,
          challenge: "Personalized Demo Request",
          preferred_date: "Next Tuesday 3:00 PM",
        }),
      });

      if (res.ok) {
        await fetchLeads();
      }
    } catch (err) {
      console.error("Failed to simulate lead:", err);
    } finally {
      setSimulating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="admin-dashboard-backdrop animate-fade-in" role="dialog" aria-modal="true">
      <div className="admin-dashboard-container animate-scale-up">
        {/* Top Header */}
        <div className="admin-header">
          <div className="admin-header-title-wrap">
            <div className="admin-title-row">
              <span className="admin-brand-tag">ZENO ENTERPRISE</span>
              <h2 className="admin-title">WhatsApp Lead Capture & Demo Requests</h2>
              <span className="admin-live-pulse-badge">
                <span className="admin-pulse-dot" />
                <span>Live Event Feed</span>
              </span>
            </div>
            <p className="admin-subtitle">
              Captured via event kiosk QR scans. Coordinate schedules and verify customer datasets directly.
            </p>
          </div>

          <div className="admin-header-actions">
            <button
              type="button"
              className="admin-simulate-btn"
              onClick={handleSimulateLead}
              disabled={simulating}
              title="Add a sample lead for testing"
            >
              {simulating ? "Generating..." : "⚡ Simulate Lead"}
            </button>

            <button
              type="button"
              className="admin-refresh-btn"
              onClick={fetchLeads}
              disabled={loading}
              title="Refresh lead list"
            >
              🔄 Refresh
            </button>

            <button
              type="button"
              className="admin-close-btn"
              onClick={onClose}
              aria-label="Close Admin Dashboard"
            >
              ✕
            </button>
          </div>
        </div>

        {/* KPI Metrics Summary Strip */}
        <div className="admin-kpi-strip">
          <div className="kpi-card total">
            <span className="kpi-label">TOTAL LEADS</span>
            <span className="kpi-value">{stats?.total_leads ?? leads.length}</span>
          </div>

          {LEAD_STATUSES.map((st) => {
            const count = stats?.by_status?.[st] ?? 0;
            const style = STATUS_COLORS[st] || {};
            return (
              <div
                key={st}
                className={`kpi-card status-${st.toLowerCase().replace(/\s+/g, "-")} ${statusFilter === st ? "active-filter" : ""}`}
                onClick={() => setStatusFilter(statusFilter === st ? "All" : st)}
                title={`Filter by ${st}`}
                style={{
                  borderLeft: `4px solid ${style.text || "#ff5722"}`,
                }}
              >
                <span className="kpi-label">{st.toUpperCase()}</span>
                <span className="kpi-value" style={{ color: style.text }}>
                  {count}
                </span>
              </div>
            );
          })}
        </div>

        {/* Filters & Search Toolbar */}
        <div className="admin-toolbar">
          <div className="admin-search-wrap">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              className="admin-search-input"
              placeholder="Search by name, company, email, WhatsApp, or challenge..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="clear-search-btn"
                onClick={() => setSearchQuery("")}
              >
                ✕
              </button>
            )}
          </div>

          <div className="admin-filter-group">
            <div className="filter-select-wrap">
              <label>Status:</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="admin-select"
              >
                <option value="All">All Statuses</option>
                {LEAD_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-select-wrap">
              <label>Industry:</label>
              <select
                value={industryFilter}
                onChange={(e) => setIndustryFilter(e.target.value)}
                className="admin-select"
              >
                <option value="All">All Industries</option>
                <option value="Retail & E-commerce">Retail & E-commerce</option>
                <option value="Banking & Fintech">Banking & Fintech</option>
                <option value="Insurance">Insurance</option>
                <option value="General Inquiry">General Inquiry</option>
              </select>
            </div>
          </div>
        </div>

        {/* Leads Table Content */}
        <div className="admin-table-container">
          {loading && leads.length === 0 ? (
            <div className="admin-table-loading">
              <span className="loading-spinner">⏳</span>
              <span>Loading captured leads...</span>
            </div>
          ) : leads.length === 0 ? (
            <div className="admin-table-empty">
              <span className="empty-icon">📭</span>
              <h3>No leads captured yet</h3>
              <p>
                Visitors who scan the event QR code and send their demo request via WhatsApp will appear here instantly.
              </p>
              <button
                type="button"
                className="empty-simulate-btn"
                onClick={handleSimulateLead}
                disabled={simulating}
              >
                ⚡ Click to Simulate Sample Lead
              </button>
            </div>
          ) : (
            <table className="admin-leads-table">
              <thead>
                <tr>
                  <th>STATUS</th>
                  <th>VISITOR & COMPANY</th>
                  <th>CONTACT & WHATSAPP</th>
                  <th>INDUSTRY</th>
                  <th>PREFERRED DEMO DATE</th>
                  <th>REQUEST DATE</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => {
                  const style = STATUS_COLORS[lead.status] || {
                    bg: "#f1f5f9",
                    text: "#334155",
                    border: "#cbd5e1",
                  };
                  const cleanPhone = (lead.whatsapp_number || lead.contact_number || "").replace(/[^\d]/g, "");
                  const waChatUrl = cleanPhone ? `https://wa.me/${cleanPhone}` : null;
                  const reqDateFormatted = lead.request_date
                    ? new Date(lead.request_date).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "Recently";

                  return (
                    <tr key={lead.lead_id || lead._id} className="admin-lead-row">
                      {/* Status Selector */}
                      <td className="cell-status">
                        <select
                          className="status-dropdown"
                          value={lead.status}
                          disabled={updatingId === lead.lead_id}
                          onChange={(e) => handleStatusChange(lead.lead_id, e.target.value)}
                          style={{
                            backgroundColor: style.bg,
                            color: style.text,
                            borderColor: style.border,
                          }}
                        >
                          {LEAD_STATUSES.map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Visitor & Company */}
                      <td className="cell-visitor">
                        <div className="visitor-name">{lead.name || "Event Visitor"}</div>
                        <div className="visitor-company">{lead.company || "Independent"}</div>
                      </td>

                      {/* Contact & WhatsApp */}
                      <td className="cell-contact">
                        <div className="visitor-email" title={lead.email}>
                          {lead.email || "Not Provided"}
                        </div>
                        <div className="visitor-phone-row">
                          <span className="phone-num">{lead.whatsapp_number || lead.contact_number}</span>
                          {waChatUrl && (
                            <a
                              href={waChatUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="wa-inline-chat-link"
                              title="Chat on WhatsApp"
                            >
                              💬 Chat
                            </a>
                          )}
                        </div>
                      </td>

                      {/* Industry & Business Challenge */}
                      <td className="cell-challenge">
                        <span className="industry-badge">{lead.industry}</span>
                        <div className="challenge-title-text" title={lead.challenge}>
                          {lead.challenge}
                        </div>
                      </td>

                      {/* Preferred Demo Date */}
                      <td className="cell-date">
                        <span className="date-chip">📅 {lead.preferred_date || "Flexible"}</span>
                      </td>

                      {/* Request Date */}
                      <td className="cell-req-time">
                        <span className="time-text">{reqDateFormatted}</span>
                      </td>

                      {/* Actions */}
                      <td className="cell-actions">
                        <button
                          type="button"
                          className="view-msg-btn"
                          onClick={() => setActiveLeadDetails(lead)}
                          title="View raw message"
                        >
                          Details 👁️
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Lead Details Modal / Drawer */}
        {activeLeadDetails && (
          <div className="lead-details-overlay" onClick={() => setActiveLeadDetails(null)}>
            <div className="lead-details-modal" onClick={(e) => e.stopPropagation()}>
              <div className="details-modal-header">
                <h3>Lead Submission Details</h3>
                <button
                  type="button"
                  className="details-close-btn"
                  onClick={() => setActiveLeadDetails(null)}
                >
                  ✕
                </button>
              </div>

              <div className="details-modal-body">
                <div className="details-meta-grid">
                  <div>
                    <label>Visitor:</label>
                    <strong>{activeLeadDetails.name}</strong>
                  </div>
                  <div>
                    <label>Company:</label>
                    <strong>{activeLeadDetails.company}</strong>
                  </div>
                  <div>
                    <label>Email:</label>
                    <span>{activeLeadDetails.email}</span>
                  </div>
                  <div>
                    <label>WhatsApp Number:</label>
                    <span>{activeLeadDetails.whatsapp_number}</span>
                  </div>
                  <div>
                    <label>Industry:</label>
                    <span>{activeLeadDetails.industry}</span>
                  </div>
                  <div>
                    <label>Challenge:</label>
                    <span>{activeLeadDetails.challenge}</span>
                  </div>
                  <div>
                    <label>Preferred Demo Date:</label>
                    <span>{activeLeadDetails.preferred_date}</span>
                  </div>
                  <div>
                    <label>Submission Date:</label>
                    <span>{activeLeadDetails.request_date}</span>
                  </div>
                </div>

                <div className="details-raw-msg-section">
                  <label>Full WhatsApp Incoming Message:</label>
                  <pre>{activeLeadDetails.raw_message || "No raw message recorded."}</pre>
                </div>
              </div>

              <div className="details-modal-footer">
                <a
                  href={`https://wa.me/${(activeLeadDetails.whatsapp_number || "").replace(/[^\d]/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="details-wa-chat-btn"
                >
                  💬 Open WhatsApp Conversation
                </a>
                <button
                  type="button"
                  className="details-done-btn"
                  onClick={() => setActiveLeadDetails(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="admin-footer">
          <span className="admin-footer-note">
            Storage Engine: <strong>{stats?.storage_mode || "MongoDB / SQLite"}</strong> • Meta WhatsApp Cloud API Ready
          </span>
          <button type="button" className="admin-return-btn" onClick={onClose}>
            Back to Zeno Stage
          </button>
        </div>
      </div>
    </div>
  );
}
