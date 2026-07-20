import React, { useState } from "react";
import { STAGES, LINK_TYPE_LABELS } from "../constants.js";

export default function IssueDetail({
  issue,
  notes,
  links,
  roadblock,
  author,
  issuesById,
  onAddNote,
  onDeleteNote,
  onToggleRoadblock,
  onAddLink,
  onDeleteLink,
  onJumpTo,
  onClose,
}) {
  const [text, setText] = useState("");
  const [roadblockReason, setRoadblockReason] = useState(roadblock?.reason || "");
  const [linkTarget, setLinkTarget] = useState("");
  const [linkType, setLinkType] = useState("blocks");
  const [linkLabel, setLinkLabel] = useState("");
  const [linkError, setLinkError] = useState("");

  if (!issue) return null;

  const stageLabel = STAGES.find((s) => s.key === issue.stage)?.label || issue.stage;
  const issueLinks = links.filter((l) => l.fromId === issue.id || l.toId === issue.id);

  function handleLinkSubmit(e) {
    e.preventDefault();
    setLinkError("");
    const targetId = linkTarget.trim().toUpperCase();
    if (!targetId) return;
    if (targetId === issue.id) {
      setLinkError("Can't link an issue to itself.");
      return;
    }
    if (!issuesById[targetId]) {
      setLinkError(`${targetId} isn't a known issue.`);
      return;
    }
    onAddLink(issue.id, targetId, linkType, linkLabel, author);
    setLinkTarget("");
    setLinkLabel("");
  }

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

        <h4>🚧 Roadblock</h4>
        {roadblock ? (
          <div className="roadblock-box">
            <div className="note-text">{roadblock.reason || "(no reason given)"}</div>
            <div className="note-meta">
              <span>
                {roadblock.author} · {new Date(roadblock.at).toLocaleString()}
              </span>
              <button className="note-delete" onClick={() => onToggleRoadblock(issue.id, null)}>
                clear
              </button>
            </div>
          </div>
        ) : (
          <form
            className="note-form"
            onSubmit={(e) => {
              e.preventDefault();
              onToggleRoadblock(issue.id, roadblockReason || "Flagged during workshop");
            }}
          >
            <textarea
              value={roadblockReason}
              onChange={(e) => setRoadblockReason(e.target.value)}
              placeholder="What's blocking this?"
              rows={2}
            />
            <button type="submit" className="roadblock-flag-button">
              Flag as roadblock
            </button>
          </form>
        )}

        <h4>Interdependencies</h4>
        <div className="notes-list">
          {issueLinks.length === 0 && <div className="notes-empty">No links yet.</div>}
          {issueLinks.map((l) => {
            const otherId = l.fromId === issue.id ? l.toId : l.fromId;
            const other = issuesById[otherId];
            const directionLabel =
              l.fromId === issue.id
                ? `${issue.id} ${LINK_TYPE_LABELS[l.type]} ${otherId}`
                : `${otherId} ${LINK_TYPE_LABELS[l.type]} ${issue.id}`;
            return (
              <div key={l.id} className="note">
                <div className="note-text">
                  <button className="link-jump" onClick={() => onJumpTo(otherId)}>
                    {directionLabel}
                  </button>
                  {other ? ` — ${other.title}` : ""}
                  {l.label && <div className="link-label">"{l.label}"</div>}
                </div>
                <div className="note-meta">
                  <span>
                    {l.author} · {new Date(l.at).toLocaleString()}
                  </span>
                  <button className="note-delete" onClick={() => onDeleteLink(l.id)}>
                    remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        <form className="note-form link-form" onSubmit={handleLinkSubmit}>
          <div className="link-form-row">
            <select value={linkType} onChange={(e) => setLinkType(e.target.value)}>
              <option value="blocks">blocks</option>
              <option value="related">relates to</option>
            </select>
            <input
              placeholder="VOC-###"
              value={linkTarget}
              onChange={(e) => setLinkTarget(e.target.value)}
            />
          </div>
          <input
            placeholder="optional note (why they're linked)"
            value={linkLabel}
            onChange={(e) => setLinkLabel(e.target.value)}
          />
          {linkError && <div className="link-error">{linkError}</div>}
          <button type="submit">Add link</button>
        </form>

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
