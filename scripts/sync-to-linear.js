#!/usr/bin/env node
// Applies every queued board move to the real Linear issues.
// Usage: LINEAR_API_KEY=lin_api_xxx node scripts/sync-to-linear.js
import { loadState, saveState } from "../server/state.js";
import { updateIssueState } from "../server/linear.js";

async function main() {
  if (!process.env.LINEAR_API_KEY) {
    console.error("LINEAR_API_KEY is not set. Aborting — nothing was changed in Linear.");
    process.exit(1);
  }

  const state = loadState();
  if (state.pending.length === 0) {
    console.log("No pending changes to sync.");
    return;
  }

  console.log(`Syncing ${state.pending.length} pending change(s) to Linear...`);
  const stillPending = [];
  for (const change of state.pending) {
    try {
      await updateIssueState(change.issueId, change.to);
      state.appliedLog.push({ ...change, appliedAt: new Date().toISOString() });
      console.log(`  ✓ ${change.issueId}: ${change.from} -> ${change.to}`);
    } catch (err) {
      console.error(`  ✗ ${change.issueId}: ${err.message}`);
      stillPending.push(change);
    }
  }
  state.pending = stillPending;
  saveState(state);
  console.log(`Done. ${stillPending.length} change(s) remain pending (failed or skipped).`);
}

main();
