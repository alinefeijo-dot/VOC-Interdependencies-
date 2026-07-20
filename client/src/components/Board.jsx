import React, { useMemo, useState } from "react";
import { AXES, TEAMS } from "../constants.js";
import IssueCard from "./IssueCard.jsx";

export default function Board({
  issues,
  notes,
  links,
  roadblocks,
  search,
  axisKey,
  onMove,
  onOpen,
  spotlightId,
  spotlightRelatedIds,
}) {
  const [dragOverCell, setDragOverCell] = useState(null);
  const axis = AXES[axisKey];
  const columns = axis.columns;
  const field = axis.field;

  const linkCounts = useMemo(() => {
    const counts = {};
    for (const l of links) {
      counts[l.fromId] = (counts[l.fromId] || 0) + 1;
      counts[l.toId] = (counts[l.toId] || 0) + 1;
    }
    return counts;
  }, [links]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return issues;
    return issues.filter(
      (i) => i.id.toLowerCase().includes(q) || i.title.toLowerCase().includes(q)
    );
  }, [issues, search]);

  const byCell = useMemo(() => {
    const map = {};
    for (const team of TEAMS) {
      map[team] = { closed: [] };
      for (const col of columns) map[team][col.key] = [];
    }

    for (const issue of filtered) {
      for (const team of issue.teams) {
        const bucket = map[team] || (map[team] = { closed: [] });
        if (issue.stage === "closed") {
          bucket.closed.push(issue);
        } else {
          const key = issue[field];
          if (!bucket[key]) bucket[key] = [];
          bucket[key].push(issue);
        }
      }
    }
    return map;
  }, [filtered, columns, field]);

  function handleDragStart(e, issue) {
    e.dataTransfer.setData("text/plain", issue.id);
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDrop(e, colKey, team) {
    e.preventDefault();
    setDragOverCell(null);
    const issueId = e.dataTransfer.getData("text/plain");
    if (issueId) onMove(issueId, colKey);
  }

  const spotlightActive = !!spotlightId;

  function cardState(issue) {
    if (!spotlightActive) return "";
    if (issue.id === spotlightId) return "is-spotlight";
    if (spotlightRelatedIds.has(issue.id)) return "is-linked";
    return "is-dimmed";
  }

  return (
    <div className={`board${spotlightActive ? " spotlight-active" : ""}`}>
      <div className="board-header-row">
        <div className="team-label-col" />
        {columns.map((c) => (
          <div key={c.key} className="col-header">
            {c.label}
          </div>
        ))}
        <div className="closed-header">Closed / Other</div>
      </div>

      {TEAMS.map((team) => {
        const row = byCell[team] || { closed: [] };
        const rowCount = columns.reduce((n, c) => n + (row[c.key]?.length || 0), 0) + row.closed.length;
        if (search.trim() && rowCount === 0) return null;

        return (
          <div key={team} className="board-row">
            <div className="team-label-col">
              <span>{team}</span>
              <span className="team-count">{rowCount}</span>
            </div>
            {columns.map((c) => {
              const cellId = `${team}::${c.key}`;
              return (
                <div
                  key={c.key}
                  className={`col-cell${dragOverCell === cellId ? " drag-over" : ""}`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (dragOverCell !== cellId) setDragOverCell(cellId);
                  }}
                  onDragLeave={() => setDragOverCell((cur) => (cur === cellId ? null : cur))}
                  onDrop={(e) => handleDrop(e, c.key, team)}
                >
                  {(row[c.key] || []).map((issue) => (
                    <IssueCard
                      key={issue.id}
                      issue={issue}
                      notesCount={notes[issue.id]?.length || 0}
                      linkCount={linkCounts[issue.id] || 0}
                      roadblock={roadblocks[issue.id]}
                      stateClass={cardState(issue)}
                      onOpen={onOpen}
                      onDragStart={handleDragStart}
                    />
                  ))}
                </div>
              );
            })}
            <div className="closed-cell">
              {row.closed.length === 0 ? (
                <span className="closed-empty">—</span>
              ) : (
                row.closed.map((issue) => (
                  <IssueCard
                    key={issue.id}
                    issue={issue}
                    notesCount={notes[issue.id]?.length || 0}
                    linkCount={linkCounts[issue.id] || 0}
                    roadblock={roadblocks[issue.id]}
                    stateClass={cardState(issue)}
                    onOpen={onOpen}
                    onDragStart={handleDragStart}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
