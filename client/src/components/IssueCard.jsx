import React from "react";
import { REVENUE_TIER_LABELS } from "../constants.js";

export default function IssueCard({
  issue,
  notesCount,
  linkCount,
  roadblock,
  stateClass,
  onOpen,
  onDragStart,
}) {
  const tier = REVENUE_TIER_LABELS[issue.revenueTier];
  return (
    <div
      className={`issue-card${roadblock ? " is-roadblock" : ""}${stateClass ? ` ${stateClass}` : ""}`}
      data-issue-id={issue.id}
      draggable
      onDragStart={(e) => onDragStart(e, issue)}
      onClick={() => onOpen(issue)}
      title={issue.title}
    >
      <div className="issue-card-top">
        <a
          href={issue.url}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="issue-id"
        >
          {issue.id}
        </a>
        {roadblock && (
          <span className="badge badge-roadblock" title={roadblock.reason || "Flagged as a roadblock"}>
            🚧
          </span>
        )}
        {issue.duplicateTeam && (
          <span className="badge badge-dup" title="Tagged with more than one product team">
            dup
          </span>
        )}
        {tier && <span className="badge badge-tier">{tier}</span>}
        {linkCount > 0 && (
          <span className="badge badge-links" title={`${linkCount} interdependency link(s)`}>
            🔗 {linkCount}
          </span>
        )}
        {notesCount > 0 && (
          <span className="badge badge-notes" title={`${notesCount} note(s)`}>
            📝 {notesCount}
          </span>
        )}
      </div>
      <div className="issue-title">{issue.title}</div>
    </div>
  );
}
