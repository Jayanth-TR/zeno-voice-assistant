import React from "react";
import {
  getUniqueInternalSources,
  getUniqueWebSources,
  formatApprovalStatus,
  getPillClass,
} from "../../../utils/sourceUtils";

export default function SourcesSection({ sources, messageId }) {
  if (!sources) return null;

  const internalSources = getUniqueInternalSources(sources.internal);
  const webSources = getUniqueWebSources(sources.web);

  const hasInternal = internalSources.length > 0;
  const hasWeb = webSources.length > 0;

  if (!hasInternal && !hasWeb) {
    return null;
  }

  return (
    <div className="sources-container">
      {hasInternal && (
        <div className="sources-group">
          <div className="sources-header internal">
            <span className="sources-header-icon">📄</span>
            <span>Internal Documents</span>
          </div>
          <ul className="sources-list">
            {internalSources.map((item, idx) => (
              <li
                key={`${messageId}-internal-${idx}-${item.source}-${item.page ?? "all"}`}
                className="source-item"
              >
                <span className="source-name">{item.source}</span>
                {item.page !== null && item.page !== undefined && (
                  <span className="source-page">Page {item.page}</span>
                )}
                {item.approval_status && (
                  <span className={getPillClass(item.approval_status)}>
                    {formatApprovalStatus(item.approval_status)}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {hasWeb && (
        <div className="sources-group">
          <div className="sources-header web">
            <span className="sources-header-icon">🌐</span>
            <span>Web Sources</span>
          </div>
          <ul className="sources-list">
            {webSources.map((item, idx) => (
              <li
                key={`${messageId}-web-${idx}-${item.url}`}
                className="source-item"
              >
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="source-link"
                >
                  <span className="source-link-title">{item.title}</span>
                  <span className="source-link-icon" aria-hidden="true">↗</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
