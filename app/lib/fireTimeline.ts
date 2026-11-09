import type { Story } from "./news";

// The fire feed only shows each call's current units, so its history has to be built by
// comparing polls. It's kept in this browser so the log survives a page reload.
const STORAGE_KEY = "opento.fireTimeline";
const KEEP_FINISHED_MS = 24 * 60 * 60_000;

export type FireUpdate = { at: number; alarm: number; added: string[]; removed: string[] };
type Entry = { units: string[]; alarm: number; updates: FireUpdate[] };

function loadEntries(): Record<string, Entry> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function saveEntries(entries: Record<string, Entry>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // Storage can be full or blocked. The log just won't survive a reload.
  }
}

export function recordFireUpdates(stories: Story[]) {
  const now = Date.now();
  const entries = loadEntries();

  for (const story of stories) {
    if (!story.fire) continue;
    const { units, alarm } = story.fire;
    let entry = entries[story.id];

    if (!entry) {
      entry = { units, alarm, updates: [{ at: now, alarm, added: units, removed: [] }] };
      entries[story.id] = entry;
    } else {
      const previous = entry.units;
      const added = units.filter((unit) => !previous.includes(unit));
      const removed = previous.filter((unit) => !units.includes(unit));
      if (added.length > 0 || removed.length > 0 || alarm !== entry.alarm) {
        entry.updates.push({ at: now, alarm, added, removed });
        entry.units = units;
        entry.alarm = alarm;
      }
    }
    story.fire.updates = entry.updates;
  }

  const current = new Set(stories.map((story) => story.id));
  for (const [id, entry] of Object.entries(entries)) {
    if (!current.has(id) && now - entry.updates[entry.updates.length - 1].at > KEEP_FINISHED_MS) delete entries[id];
  }
  saveEntries(entries);
}
