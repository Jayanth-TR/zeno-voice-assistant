export function getUniqueInternalSources(sources) {
  if (!Array.isArray(sources)) return [];
  const seen = new Set();
  const unique = [];
  for (const item of sources) {
    if (!item) continue;
    const docName = (item.source || "Unknown source").trim();
    const page =
      item.page !== null && item.page !== undefined ? String(item.page).trim() : "";
    const approval = (item.approval_status || "").trim();
    const key = `${docName}__p_${page}__status_${approval}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push({
        source: docName,
        page: item.page !== null && item.page !== undefined ? item.page : null,
        approval_status: approval || null,
      });
    }
  }
  return unique;
}

export function getUniqueWebSources(sources) {
  if (!Array.isArray(sources)) return [];
  const seen = new Set();
  const unique = [];
  for (const item of sources) {
    if (!item || !item.url) continue;
    const url = item.url.trim();
    if (!url) continue;
    const normalizedUrl = url.toLowerCase().replace(/\/+$/, "");
    if (!seen.has(normalizedUrl)) {
      seen.add(normalizedUrl);
      unique.push({
        title: item.title?.trim() || url,
        url: url,
      });
    }
  }
  return unique;
}

export function formatApprovalStatus(status) {
  if (!status) return "";
  const map = {
    client_approved: "Client Approved",
    requires_validation: "Requires Validation",
    user_uploaded: "User Uploaded",
    public_source_unapproved: "Unapproved Public Source",
    source_reference: "Source Reference",
  };
  return map[status] || status.replace(/_/g, " ");
}

export function getPillClass(status) {
  if (!status) return "source-pill default";
  const s = status.toLowerCase();
  if (s.includes("approved")) return "source-pill approved";
  if (s.includes("validation")) return "source-pill validation";
  if (s.includes("uploaded")) return "source-pill uploaded";
  return "source-pill default";
}
