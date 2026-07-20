import React from "react";

export default function RoadblocksPanel({ roadblocks, issuesById, onJumpTo, onClose }) {
  const entries = Object.entries(roadblocks);
  return (
    <div className="pending-overlay" onClick={onClose}>
      <div className="pending-panel" onClick={(e) => e.stopPropagation()}>
        <button className="detail-close" onClick={onClose}>
          ×
        </button>
        <h3>🚧 Roadblocks ({entries.length})</h3>
        <p className="pending-hint">Everything currently flagged as blocked — call these out first.</p>
        <div className="pending-list">
          {entries.length === 0 && <div className="notes-empty">Nothing flagged.</div>}
          {entries.map(([issueId, r]) => (
            <div key={issueId} className="pending-item roadblock-item">
              <button className="link-jump" onClick={() => onJumpTo(issueId)}>
                {issueId}
              </button>
              {issuesById[issueId] ? ` — ${issuesById[issueId].title}` : ""}
              <div className="note-text">{r.reason}</div>
              <div className="note-meta">
                <span>
                  {r.author} · {new Date(r.at).toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
