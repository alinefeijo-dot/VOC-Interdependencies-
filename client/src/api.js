const BASE = "/api";

async function json(res) {
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || res.statusText);
  return res.json();
}

export const api = {
  getBoard: () => fetch(`${BASE}/board`).then(json),
  moveIssue: (issueId, axis, toValue, author) =>
    fetch(`${BASE}/move`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ issueId, axis, toValue, author }),
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
  addLink: (fromId, toId, type, label, author) =>
    fetch(`${BASE}/links`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fromId, toId, type, label, author }),
    }).then(json),
  deleteLink: (linkId) => fetch(`${BASE}/links/${linkId}`, { method: "DELETE" }).then(json),
  setRoadblock: (issueId, reason, author) =>
    fetch(`${BASE}/roadblocks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ issueId, reason, author }),
    }).then(json),
  clearRoadblock: (issueId) =>
    fetch(`${BASE}/roadblocks/${issueId}`, { method: "DELETE" }).then(json),
};
