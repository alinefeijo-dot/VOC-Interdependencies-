# VOC Interdependencies Board

A live, multi-user kanban board for triaging Anchorage's Voice of the Client
(VOC) issues from Linear — the interactive follow-up to the static
[Whimsical VOC Feedback Wall](https://whimsical.com/FTWkcMUzWBn5Zrce651pmk).

- **Swimlanes:** product team (15 Triage-Team labels + "Unassigned")
- **Columns:** review stage (Not Reviewed by PDE Team → Reviewed by VOC →
  Reviewed by PDE Team → On Roadmap), plus a read-only "Closed / Other" tray
  for Done/Canceled/Duplicate/Triage issues
- **Drag-and-drop** cards between stages
- **Duplicate-team badges** on any issue tagged with more than one
  product-team label
- **Click-to-annotate** sticky notes per issue
- **Live shared state** — every move/note broadcasts to all connected
  browsers over WebSocket in real time
- **"Pending Linear Changes" panel** — a queue of every move made on the
  board, with a "Sync to Linear" button

## Why moves aren't written to Linear automatically

A browser tab can't safely hold Linear API credentials, so this app never
calls Linear directly from the client. Instead:

1. Dragging a card queues a change in `server/data/state.json` and broadcasts
   it to everyone watching (visible in the "Pending Linear Changes" panel).
2. Clicking **Sync to Linear** (or running `npm run sync:linear`) applies the
   queued changes to the real Linear issues via the Linear GraphQL API,
   using a `LINEAR_API_KEY` environment variable set on the server/host —
   never sent to or stored in the browser.
3. Applied changes move from "pending" to "recently applied"; anything that
   fails (bad key, issue since deleted, etc.) stays queued and shows the
   error.

Without `LINEAR_API_KEY` set, syncing still works end-to-end except the last
step — it reports exactly what *would* be written once the key is added.

## Running locally

```
npm install
npm run dev
```

This starts the API/WebSocket server (`:4000`) and the Vite dev server
(`:5173`, proxying `/api` and `/ws` to `:4000`). Open `http://localhost:5173`.

## Running as a single deployed service

```
npm install
npm start          # builds the client, then serves client+API from one process
```

The server serves the built client from `client/dist` and the API/WebSocket
from the same port — this is the process to deploy so "others can access it
live" from one URL. Board state persists to `server/data/state.json` on
whatever host runs the process (swap in a real database if you need
durability across redeploys).

To actually write queued moves back to Linear, set `LINEAR_API_KEY` (a
personal API key from Linear → Settings → API) in the server's environment
before starting it, or run standalone:

```
LINEAR_API_KEY=lin_api_xxx npm run sync:linear
```

## Refreshing the issue dataset

`server/data/voc-issues.json` is a point-in-time export of all VOC-team
Linear issues (identifier, title, url, status/stage, team label(s),
duplicate-team flag, revenue tier, priority). It was generated from Linear's
API and is not fetched live by the running server. To refresh it, re-export
the VOC team's issues from Linear and regenerate this file with the same
shape (see `git log` for the original extraction script).

## Project layout

```
server/           Express API + WebSocket server
  index.js        routes: /api/board, /api/move, /api/notes, /api/sync
  linear.js        Linear GraphQL client (state-update mutation)
  state.js         load/save server/data/state.json
  data/
    voc-issues.json  seed dataset (see above)
    state.json        runtime state — overrides, notes, pending queue (gitignored)
client/            Vite + React kanban UI
scripts/
  sync-to-linear.js  CLI: apply all pending moves to Linear
```
