import { API_BASE_URL } from "../constants/audioConstants";

/**
 * Centralized API Service for Zeno Voice Assistant
 * All backend API interactions are cleanly structured here.
 */

export const apiService = {
  /**
   * Fetch industry question & challenge configuration
   */
  async fetchIndustries() {
    try {
      const res = await fetch(`${API_BASE_URL}/api/industries`);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      return data.industries || [];
    } catch (err) {
      console.warn("[apiService] Failed to fetch industries, using fallback:", err);
      return [];
    }
  },

  /**
   * Fetch lead statistics (count by status)
   */
  async fetchLeadStats() {
    try {
      const res = await fetch(`${API_BASE_URL}/api/leads/stats`);
      if (!res.ok) return null;
      return await res.json();
    } catch (err) {
      console.warn("[apiService] Failed to fetch lead stats:", err);
      return null;
    }
  },

  /**
   * Synthesize speech via backend TTS API (returns base64 audio string)
   */
  async synthesizeSpeech(text, voice = "alloy") {
    try {
      const res = await fetch(`${API_BASE_URL}/api/tts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voice }),
      });
      if (!res.ok) throw new Error(`TTS failed with status ${res.status}`);
      const data = await res.json();
      return data.audio || null;
    } catch (err) {
      console.warn("[apiService] TTS synthesis error:", err);
      return null;
    }
  },

  /**
   * Fetch WhatsApp & Lead configuration
   */
  async fetchLeadConfig() {
    try {
      const res = await fetch(`${API_BASE_URL}/api/leads/config`);
      if (!res.ok) return null;
      return await res.json();
    } catch (err) {
      console.warn("[apiService] Failed to fetch lead config:", err);
      return null;
    }
  },

  /**
   * Fetch leads list for admin dashboard
   */
  async fetchLeads(params = {}) {
    const searchParams = new URLSearchParams(params);
    const res = await fetch(`${API_BASE_URL}/api/leads?${searchParams.toString()}`);
    if (!res.ok) throw new Error(`Failed to fetch leads: ${res.status}`);
    return await res.json();
  },

  /**
   * Update lead status
   */
  async updateLeadStatus(leadId, status) {
    const res = await fetch(`${API_BASE_URL}/api/leads/${leadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error(`Failed to update lead: ${res.status}`);
    return await res.json();
  },

  /**
   * Simulate a test lead
   */
  async simulateLead() {
    const res = await fetch(`${API_BASE_URL}/api/leads/simulate`, {
      method: "POST",
    });
    if (!res.ok) throw new Error(`Failed to simulate lead: ${res.status}`);
    return await res.json();
  },

  /**
   * Submit lead from mobile form
   */
  async submitLead(leadData) {
    const res = await fetch(`${API_BASE_URL}/api/leads`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(leadData),
    });
    if (!res.ok) throw new Error(`Failed to submit lead: ${res.status}`);
    return await res.json();
  },
};

export default apiService;
