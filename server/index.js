import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { WebSocketServer } from "ws";
import { loadState, saveState } from "./state.js";
import { updateIssueState, STAGE_STATE_IDS } from "./linear.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 4000;

const issues = JSON.parse(
  fs.readFileSync(path.join(__dirname, "data", "voc-issues.json"), "utf8")
);
let state = loadState();

const STAGE_KEYS = ["not_reviewed", "reviewed_voc", "reviewed_pde", "on_roadmap"];
const TIMELINE_KEYS = ["now", "next", "beyond", "unscheduled"];
const STAGE_TIMELINE_DEFAULT = {
  not_reviewed: "unscheduled",
  reviewed_voc: "beyond",
  reviewed_pde: "next",
  on_roadmap: "now",
  closed: "unscheduled",
};
const LINK_TYPES = ["blocks", "related"];

const app = express();
app.use(express.json());

const clientDist = path.join(__dirname, "..", "client", "dist");
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
}

function boardPayload() {
  return {
    issues: issues.map((iss) => {
      const stage = state.overrides[iss.id] ?? iss.stage;
      const timelineBucket =
        state.timelineOverrides[iss.id] ?? STAGE_TIMELINE_DEFAULT[stage] ?? "unscheduled";
      return { ...iss, stage, originalStage: iss.stage, timelineBucket };
    }),
    notes: state.notes,
    pending: state.pending,
    appliedLog: state.appliedLog.slice(-50),
    links: state.links,
    roadblocks: state.roadblocks,
  };
}

let wss;
function broadcast() {
  const payload = JSON.stringify({ type: "board", data: boardPayload() });
  wss?.clients.forEach((c) => {
    if (c.readyState === 1) c.send(payload);
  });
}

app.get("/api/board", (req, res) => {
  res.json(boardPayload());
});

app.post("/api/move", (req, res) => {
  const { issueId, axis, toValue, author } = req.body;
  const issue = issues.find((i) => i.id === issueId);
  if (!issue) return res.status(404).json({ error: "Unknown issue" });

  if (axis === "timeline") {
    if (!TIMELINE_KEYS.includes(toValue)) {
      return res.status(400).json({ error: "Invalid timeline bucket" });
    }
    const stage = state.overrides[issueId] ?? issue.stage;
    const fromValue = state.timelineOverrides[issueId] ?? STAGE_TIMELINE_DEFAULT[stage];
    if (fromValue === toValue) return res.json(boardPayload());
    state.timelineOverrides[issueId] = toValue;
    saveState(state);
    broadcast();
    return res.json(boardPayload());
  }

  // Default / explicit axis: "stage" — this is the axis that queues a Linear write-back.
  if (!STAGE_KEYS.includes(toValue)) {
    return res.status(400).json({ error: "Invalid target stage" });
  }
  const fromStage = state.overrides[issueId] ?? issue.stage;
  if (fromStage === toValue) return res.json(boardPayload());

  state.overrides[issueId] = toValue;
  state.pending.push({
    id: `${issueId}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    issueId,
    from: fromStage,
    to: toValue,
    author: author || "anonymous",
    at: new Date().toISOString(),
  });
  saveState(state);
  broadcast();
  res.json(boardPayload());
});

app.post("/api/links", (req, res) => {
  const { fromId, toId, type, label, author } = req.body;
  if (fromId === toId) return res.status(400).json({ error: "Cannot link an issue to itself" });
  if (!LINK_TYPES.includes(type)) return res.status(400).json({ error: "Invalid link type" });
  const from = issues.find((i) => i.id === fromId);
  const to = issues.find((i) => i.id === toId);
  if (!from || !to) return res.status(404).json({ error: "Unknown issue" });

  const link = {
    id: `link-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    fromId,
    toId,
    type,
    label: (label || "").trim(),
    author: author || "anonymous",
    at: new Date().toISOString(),
  };
  state.links.push(link);
  saveState(state);
  broadcast();
  res.json(boardPayload());
});

app.delete("/api/links/:linkId", (req, res) => {
  state.links = state.links.filter((l) => l.id !== req.params.linkId);
  saveState(state);
  broadcast();
  res.json(boardPayload());
});

app.post("/api/roadblocks", (req, res) => {
  const { issueId, reason, author } = req.body;
  const issue = issues.find((i) => i.id === issueId);
  if (!issue) return res.status(404).json({ error: "Unknown issue" });

  state.roadblocks[issueId] = {
    reason: (reason || "").trim(),
    author: author || "anonymous",
    at: new Date().toISOString(),
  };
  saveState(state);
  broadcast();
  res.json(boardPayload());
});

app.delete("/api/roadblocks/:issueId", (req, res) => {
  delete state.roadblocks[req.params.issueId];
  saveState(state);
  broadcast();
  res.json(boardPayload());
});

app.post("/api/notes", (req, res) => {
  const { issueId, text, author } = req.body;
  if (!text || !text.trim()) return res.status(400).json({ error: "Note text required" });
  const issue = issues.find((i) => i.id === issueId);
  if (!issue) return res.status(404).json({ error: "Unknown issue" });

  if (!state.notes[issueId]) state.notes[issueId] = [];
  state.notes[issueId].push({
    id: `${issueId}-note-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    text: text.trim(),
    author: author || "anonymous",
    createdAt: new Date().toISOString(),
  });
  saveState(state);
  broadcast();
  res.json(boardPayload());
});

app.delete("/api/notes/:issueId/:noteId", (req, res) => {
  const { issueId, noteId } = req.params;
  if (state.notes[issueId]) {
    state.notes[issueId] = state.notes[issueId].filter((n) => n.id !== noteId);
    saveState(state);
    broadcast();
  }
  res.json(boardPayload());
});

// Applies every queued pending change to the real Linear issues.
// Requires LINEAR_API_KEY; without it, reports what *would* sync.
app.post("/api/sync", async (req, res) => {
  const hasKey = !!process.env.LINEAR_API_KEY;
  const results = [];
  const stillPending = [];

  for (const change of state.pending) {
    if (!hasKey) {
      results.push({ ...change, applied: false, reason: "LINEAR_API_KEY not configured" });
      stillPending.push(change);
      continue;
    }
    try {
      await updateIssueState(change.issueId, change.to);
      results.push({ ...change, applied: true });
      state.appliedLog.push({ ...change, appliedAt: new Date().toISOString() });
    } catch (err) {
      results.push({ ...change, applied: false, reason: err.message });
      stillPending.push(change);
    }
  }

  state.pending = stillPending;
  saveState(state);
  broadcast();
  res.json({ hasKey, results, board: boardPayload() });
});

app.get("/api/stage-map", (req, res) => res.json(STAGE_STATE_IDS));

if (fs.existsSync(clientDist)) {
  app.get("*", (req, res) => {
    if (req.path.startsWith("/api")) return res.status(404).end();
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

const server = app.listen(PORT, () => {
  console.log(`VOC board server listening on :${PORT}`);
});

wss = new WebSocketServer({ server, path: "/ws" });
wss.on("connection", (ws) => {
  ws.send(JSON.stringify({ type: "board", data: boardPayload() }));
});
