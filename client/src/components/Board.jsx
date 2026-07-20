import React, { useMemo, useState } from "react";
import { STAGES, TEAMS } from "../constants.js";
import IssueCard from "./IssueCard.jsx";

export default function Board({ issues, notes, search, onMove, onOpen }) {
  const [dragOverCell, setDragOverCell] = useState(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return issues;
    return issues.filter(
      (i) => i.id.toLowerCase().includes(q) || i.title.toLowerCase().includes(q)
    );
  }, [issues, search]);

  const byCell = useMemo(() => {
    const map = {};
    for (const team of TEAMS) map[team] = { closed: [] };
    for (const stage of STAGES) for (const team of TEAMS) map[team][stage.key] = [];

    for (const issue of filtered) {
      for (const team of issue.teams) {
        const bucket = map[team] || (map[team] = { closed: [] });
        if (issue.stage === "closed") {
          bucket.closed.push(issue);
        } else {
          if (!bucket[issue.stage]) bucket[issue.stage] = [];
          bucket[issue.stage].push(issue);
        }
      }
    }
    return map;
  }, [filtered]);

  function handleDragStart(e, issue) {
    e.dataTransfer.setData("text/plain", issue.id);
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDrop(e, stageKey, team) {
    e.preventDefault();
    setDragOverCell(null);
    const issueId = e.dataTransfer.getData("text/plain");
    if (issueId) onMove(issueId, stageKey);
  }

  return (
    <div className="board">
      <div className="board-header-row">
        <div className="team-label-col" />
        {STAGES.map((s) => (
          <div key={s.key} className="stage-header">
            {s.label}
          </div>
        ))}
        <div className="closed-header">Closed / Other</div>
      </div>

      {TEAMS.map((team) => {
        const row = byCell[team] || { closed: [] };
        const rowCount =
          STAGES.reduce((n, s) => n + (row[s.key]?.length || 0), 0) + row.closed.length;
        if (search.trim() && rowCount === 0) return null;

        return (
          <div key={team} className="board-row">
            <div className="team-label-col">
              <span>{team}</span>
              <span className="team-count">{rowCount}</span>
            </div>
            {STAGES.map((s) => {
              const cellId = `${team}::${s.key}`;
              return (
                <div
                  key={s.key}
                  className={`stage-cell${dragOverCell === cellId ? " drag-over" : ""}`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (dragOverCell !== cellId) setDragOverCell(cellId);
                  }}
                  onDragLeave={() => setDragOverCell((c) => (c === cellId ? null : c))}
                  onDrop={(e) => handleDrop(e, s.key, team)}
                >
                  {(row[s.key] || []).map((issue) => (
                    <IssueCard
                      key={issue.id}
                      issue={issue}
                      notesCount={notes[issue.id]?.length || 0}
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
