import React, { useState } from "react";
import { STAGES } from "../constants.js";

export default function IssueDetail({ issue, notes, author, onAddNote, onDeleteNote, onClose }) {
  const [text, setText] = useState("");
  if (!issue) return null;

  const stageLabel = STAGES.find((s) => s.key === issue.stage)?.label || issue.stage;

  return (
    <div className="detail-overlay" onClick={onClose}>
      <div className="detail-panel" onClick={(e) => e.stopPropagation()}>
        <button className="detail-close" onClick={onClose}>
          ×
        </button>
        <a href={issue.url} target="_blank" rel="noreferrer" className="detail-id">
          {issue.id} ↗
        </a>
        <h3>{issue.title}</h3>
        <div className="detail-meta">
          <span>Teams: {issue.teams.join(", ")}</span>
          <span>Stage: {stageLabel}</span>
          <span>Priority: {issue.priority}</span>
          {issue.duplicateTeam && <span className="badge badge-dup">multi-team</span>}
        </div>

        <h4>Sticky notes</h4>
        <div className="notes-list">
          {(notes || []).length === 0 && <div className="notes-empty">No notes yet.</div>}
          {(notes || []).map((n) => (
            <div key={n.id} className="note">
              <div className="note-text">{n.text}</div>
              <div className="note-meta">
                <span>
                  {n.author} · {new Date(n.createdAt).toLocaleString()}
                </span>
                <button className="note-delete" onClick={() => onDeleteNote(issue.id, n.id)}>
                  remove
                </button>
              </div>
            </div>
          ))}
        </div>

        <form
          className="note-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (!text.trim()) return;
            onAddNote(issue.id, text, author);
            setText("");
          }}
        >
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`Add a note as ${author}...`}
            rows={2}
          />
          <button type="submit">Add note</button>
        </form>
      </div>
    </div>
  );
}
