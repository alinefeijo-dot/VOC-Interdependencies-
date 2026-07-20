import React from "react";
import { LINK_TYPE_LABELS } from "../constants.js";

export default function LinksPanel({ links, issuesById, onJumpTo, onClose }) {
  return (
    <div className="pending-overlay" onClick={onClose}>
      <div className="pending-panel" onClick={(e) => e.stopPropagation()}>
        <button className="detail-close" onClick={onClose}>
          ×
        </button>
        <h3>🔗 Interdependencies ({links.length})</h3>
        <p className="pending-hint">
          Every declared link between issues, for narrating dependencies that are off-screen.
        </p>
        <div className="pending-list">
          {links.length === 0 && <div className="notes-empty">No links declared yet.</div>}
          {links.map((l) => (
            <div key={l.id} className="pending-item">
              <button className="link-jump" onClick={() => onJumpTo(l.fromId)}>
                {l.fromId}
              </button>{" "}
              {LINK_TYPE_LABELS[l.type]}{" "}
              <button className="link-jump" onClick={() => onJumpTo(l.toId)}>
                {l.toId}
              </button>
              {l.label && <div className="link-label">"{l.label}"</div>}
              <div className="note-meta">
                <span>
                  {l.author} · {new Date(l.at).toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
