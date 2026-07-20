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

const app = express();
app.use(express.json());

const clientDist = path.join(__dirname, "..", "client", "dist");
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
}

function boardPayload() {
  return {
    issues: issues.map((iss) => ({
      ...iss,
      stage: state.overrides[iss.id] ?? iss.stage,
      originalStage: iss.stage,
    })),
    notes: state.notes,
    pending: state.pending,
    appliedLog: state.appliedLog.slice(-50),
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
  const { issueId, toStage, author } = req.body;
  const issue = issues.find((i) => i.id === issueId);
  if (!issue) return res.status(404).json({ error: "Unknown issue" });
  if (!["not_reviewed", "reviewed_voc", "reviewed_pde", "on_roadmap"].includes(toStage)) {
    return res.status(400).json({ error: "Invalid target stage" });
  }

  const fromStage = state.overrides[issueId] ?? issue.stage;
  if (fromStage === toStage) return res.json(boardPayload());

  state.overrides[issueId] = toStage;
  state.pending.push({
    id: `${issueId}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    issueId,
    from: fromStage,
    to: toStage,
    author: author || "anonymous",
    at: new Date().toISOString(),
  });
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
