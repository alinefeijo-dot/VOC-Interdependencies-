import React, { useState } from "react";
import { STAGES } from "../constants.js";

const stageLabel = (key) => STAGES.find((s) => s.key === key)?.label || key;

export default function PendingPanel({ pending, appliedLog, onSync, onClose }) {
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState(null);

  async function handleSync() {
    setSyncing(true);
    setResult(null);
    try {
      const res = await onSync();
      setResult(res);
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="pending-overlay" onClick={onClose}>
      <div className="pending-panel" onClick={(e) => e.stopPropagation()}>
        <button className="detail-close" onClick={onClose}>
          ×
        </button>
        <h3>Pending Linear Changes ({pending.length})</h3>
        <p className="pending-hint">
          Moves made on this board are queued here first. Nothing changes in Linear until you sync.
        </p>

        <div className="pending-list">
          {pending.length === 0 && <div className="notes-empty">Nothing queued.</div>}
          {pending.map((c) => (
            <div key={c.id} className="pending-item">
              <b>{c.issueId}</b> {stageLabel(c.from)} → {stageLabel(c.to)}
              <div className="note-meta">
                <span>
                  {c.author} · {new Date(c.at).toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>

        <button className="sync-button" onClick={handleSync} disabled={syncing || pending.length === 0}>
          {syncing ? "Syncing..." : "Sync to Linear"}
        </button>

        {result && (
          <div className="sync-result">
            {!result.hasKey && (
              <p className="sync-warning">
                LINEAR_API_KEY isn't configured on the server, so nothing was written to Linear.
                Below is what would be applied once it is.
              </p>
            )}
            {result.results.map((r) => (
              <div key={r.id} className={r.applied ? "sync-ok" : "sync-fail"}>
                {r.applied ? "✓" : "✗"} {r.issueId}: {stageLabel(r.from)} → {stageLabel(r.to)}
                {!r.applied && r.reason ? ` (${r.reason})` : ""}
              </div>
            ))}
          </div>
        )}

        {appliedLog?.length > 0 && (
          <>
            <h4>Recently applied</h4>
            <div className="pending-list">
              {appliedLog
                .slice()
                .reverse()
                .map((c, idx) => (
                  <div key={idx} className="pending-item applied">
                    <b>{c.issueId}</b> {stageLabel(c.from)} → {stageLabel(c.to)}
                    <div className="note-meta">
                      <span>{new Date(c.appliedAt).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
