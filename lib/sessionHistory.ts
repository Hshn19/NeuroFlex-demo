"use client";

import { SensorReading } from "./sensorSimulator";

// A SessionSnapshot is a single saved summary of one therapy session —
// NOT raw sensor data. Raw per-frame telemetry lives only in memory
// (see sensorSimulator.ts) and is intentionally not persisted; what
// gets saved here is the kind of summary a clinician actually reviews
// session-over-session (averages, grip force, mirroring quality).
export type SessionSnapshot = {
  id: string;
  dateISO: string; // when the session was logged
  avgThumb: number; // 0-1 normalized, averaged over the session
  avgIndex: number;
  avgMiddle: number;
  avgRing: number;
  avgPinky: number;
  avgGripForceN: number;
  avgMirrorDiffPct: number; // average healthy/mirrored delta, lower = better sync
  exerciseId: string; // which recommended exercise was active
};

const STORAGE_KEY = "neuroflex.sessionHistory.v1";
const MAX_SESSIONS = 60; // cap so localStorage doesn't grow unbounded

// NOTE ON HONESTY FOR THE DEMO/THESIS WRITE-UP:
// This is browser localStorage, scoped to one device/browser profile.
// It is a reasonable stand-in for "session-over-session trend data" in a
// front-end demo, but it is NOT a patient record system — it has no auth,
// no server, no encryption, and clearing browser data erases it. A real
// deployment needs a proper backend (the thesis's own future-work section
// gestures at this). Say that plainly if asked how history is stored.

function safeParse(json: string | null): SessionSnapshot[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function loadSessionHistory(): SessionSnapshot[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  return safeParse(raw).sort((a, b) => a.dateISO.localeCompare(b.dateISO));
}

export function saveSessionSnapshot(snapshot: SessionSnapshot) {
  if (typeof window === "undefined") return;
  const existing = loadSessionHistory();
  const next = [...existing, snapshot].slice(-MAX_SESSIONS);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function clearSessionHistory() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}

// Builds a snapshot from the live rolling window of sensor readings —
// call this when the user ends/logs a session.
export function summarizeReadings(history: SensorReading[], exerciseId: string): SessionSnapshot {
  const window = history.length ? history : [];
  const avg = (fn: (r: SensorReading) => number) =>
    window.length ? window.reduce((sum, r) => sum + fn(r), 0) / window.length : 0;

  const avgDiff =
    window.length === 0
      ? 0
      : window.reduce((sum, r) => {
          const d =
            (Math.abs(r.thumb - r.mirrored.thumb) +
              Math.abs(r.index - r.mirrored.index) +
              Math.abs(r.middle - r.mirrored.middle) +
              Math.abs(r.ring - r.mirrored.ring) +
              Math.abs(r.pinky - r.mirrored.pinky)) /
            5;
          return sum + d;
        }, 0) / window.length;

  return {
    id: `${Date.now()}`,
    dateISO: new Date().toISOString(),
    avgThumb: avg((r) => r.thumb),
    avgIndex: avg((r) => r.index),
    avgMiddle: avg((r) => r.middle),
    avgRing: avg((r) => r.ring),
    avgPinky: avg((r) => r.pinky),
    avgGripForceN: avg((r) => r.gripForceN),
    avgMirrorDiffPct: avgDiff * 100,
    exerciseId,
  };
}

// Seeds a handful of plausible past sessions the FIRST time this runs
// on a given browser, purely so the trend charts aren't empty on first
// load for a demo/presentation. Real usage would start empty.
export function seedDemoHistoryIfEmpty() {
  if (typeof window === "undefined") return;
  const existing = loadSessionHistory();
  if (existing.length > 0) return;

  const days = 8;
  const seeded: SessionSnapshot[] = [];
  for (let i = days; i >= 1; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    // gentle upward-trending mock recovery curve with noise
    const progress = (days - i) / days;
    const noise = () => (Math.random() - 0.5) * 0.06;
    seeded.push({
      id: `${date.getTime()}`,
      dateISO: date.toISOString(),
      avgThumb: Math.min(0.9, 0.45 + progress * 0.25 + noise()),
      avgIndex: Math.min(0.75, 0.2 + progress * 0.3 + noise()), // weakest channel, biggest gain
      avgMiddle: Math.min(0.92, 0.55 + progress * 0.18 + noise()),
      avgRing: Math.min(0.9, 0.5 + progress * 0.18 + noise()),
      avgPinky: Math.min(0.88, 0.45 + progress * 0.2 + noise()),
      avgGripForceN: Math.min(28, 10 + progress * 14 + (Math.random() - 0.5) * 2),
      avgMirrorDiffPct: Math.max(4, 22 - progress * 15 + (Math.random() - 0.5) * 3),
      exerciseId: "index-isolation",
    });
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
}