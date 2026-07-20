import React from "react";

export default function Toolbar({
  search,
  onSearch,
  author,
  onAuthorChange,
  pendingCount,
  onOpenPending,
  connected,
}) {
  return (
    <div className="toolbar">
      <h1>VOC Interdependencies Board</h1>
      <input
        className="search-input"
        placeholder="Search VOC-### or title..."
        value={search}
        onChange={(e) => onSearch(e.target.value)}
      />
      <div className="toolbar-spacer" />
      <span className={`conn-dot ${connected ? "conn-live" : "conn-down"}`} />
      <span className="conn-label">{connected ? "live" : "reconnecting…"}</span>
      <input
        className="author-input"
        value={author}
        onChange={(e) => onAuthorChange(e.target.value)}
        title="Your name, attached to moves and notes"
      />
      <button className="pending-button" onClick={onOpenPending}>
        Pending Linear Changes{pendingCount > 0 ? ` (${pendingCount})` : ""}
      </button>
    </div>
  );
}
