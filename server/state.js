import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STATE_PATH = path.join(__dirname, "data", "state.json");

function defaultState() {
  return {
    overrides: {},
    timelineOverrides: {},
    notes: {},
    pending: [],
    appliedLog: [],
    links: [],
    roadblocks: {},
  };
}

export function loadState() {
  if (!fs.existsSync(STATE_PATH)) return defaultState();
  try {
    return { ...defaultState(), ...JSON.parse(fs.readFileSync(STATE_PATH, "utf8")) };
  } catch {
    return defaultState();
  }
}

export function saveState(state) {
  fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
}
