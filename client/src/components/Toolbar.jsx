import React from "react";
import { AXES } from "../constants.js";

export default function Toolbar({
  search,
  onSearch,
  author,
  onAuthorChange,
  axisKey,
  onAxisChange,
  pendingCount,
  onOpenPending,
  roadblockCount,
  onOpenRoadblocks,
  linkCount,
  onOpenLinks,
  connected,
}) {
  return (
    <div className="toolbar">
      <h1>VOC Interdependencies Board</h1>
      <div className="axis-toggle">
        {Object.values(AXES).map((a) => (
          <button
            key={a.key}
            className={`axis-button${axisKey === a.key ? " axis-active" : ""}`}
            onClick={() => onAxisChange(a.key)}
          >
            {a.label}
          </button>
        ))}
      </div>
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
      <button className="toolbar-button roadblock-toolbar-button" onClick={onOpenRoadblocks}>
        🚧 Roadblocks{roadblockCount > 0 ? ` (${roadblockCount})` : ""}
      </button>
      <button className="toolbar-button" onClick={onOpenLinks}>
        🔗 Interdependencies{linkCount > 0 ? ` (${linkCount})` : ""}
      </button>
      <button className="pending-button" onClick={onOpenPending}>
        Pending Linear Changes{pendingCount > 0 ? ` (${pendingCount})` : ""}
      </button>
    </div>
  );
}
