const BASE = "/api";

async function json(res) {
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || res.statusText);
  return res.json();
}

export const api = {
  getBoard: () => fetch(`${BASE}/board`).then(json),
  moveIssue: (issueId, toStage, author) =>
    fetch(`${BASE}/move`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ issueId, toStage, author }),
    }).then(json),
  addNote: (issueId, text, author) =>
    fetch(`${BASE}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ issueId, text, author }),
    }).then(json),
  deleteNote: (issueId, noteId) =>
    fetch(`${BASE}/notes/${issueId}/${noteId}`, { method: "DELETE" }).then(json),
  sync: () => fetch(`${BASE}/sync`, { method: "POST" }).then(json),
};
