"use client";

import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";
import { SessionSnapshot } from "@/lib/sessionHistory";
import InfoNote from "./InfoNote";

const FINGER_LINES: { key: keyof SessionSnapshot; label: string; color: string }[] = [
  { key: "avgThumb", label: "Thumb", color: "#1F4E6B" },
  { key: "avgIndex", label: "Index", color: "#C1483E" },
  { key: "avgMiddle", label: "Middle", color: "#3F8A5C" },
  { key: "avgRing", label: "Ring", color: "#B8863B" },
  { key: "avgPinky", label: "Pinky", color: "#1B2A41" },
];

function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function StatDelta({ label, first, last, unit = "%", higherIsBetter = true }: { label: string; first: number; last: number; unit?: string; higherIsBetter?: boolean }) {
  const delta = last - first;
  const improved = higherIsBetter ? delta > 0 : delta < 0;
  const sign = delta > 0 ? "+" : "";
  return (
    <div className="flex flex-col">
      <span className="text-[17px] font-mono text-mist tracking-normal">{label}</span>
      <span className={`text-lg font-display ${improved ? "text-vital" : "text-warn"}`}>
        {sign}
        {unit === "%" ? (delta * 100).toFixed(1) : delta.toFixed(1)}
        {unit}
      </span>
    </div>
  );
}

export default function HistoryPanel({ history, onLogSession, onClear }: { history: SessionSnapshot[]; onLogSession: () => void; onClear: () => void }) {
  const chartData = history.map((s) => ({
    date: fmtDate(s.dateISO),
    avgThumb: Number((s.avgThumb * 100).toFixed(1)),
    avgIndex: Number((s.avgIndex * 100).toFixed(1)),
    avgMiddle: Number((s.avgMiddle * 100).toFixed(1)),
    avgRing: Number((s.avgRing * 100).toFixed(1)),
    avgPinky: Number((s.avgPinky * 100).toFixed(1)),
    grip: Number(s.avgGripForceN.toFixed(1)),
    mirrorDiff: Number(s.avgMirrorDiffPct.toFixed(1)),
  }));

  const first = history[0];
  const last = history[history.length - 1];

  return (
    <div className="panel clip-corner p-5">
      <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
        <h2 className="font-display text-sm tracking-[0.15em] text-signal">SESSION HISTORY — TREND OVER TIME</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={onLogSession}
            className="text-[17px] font-mono tracking-normal text-vital border border-vital/40 px-2 py-1 rounded-sm hover:bg-vital/10 transition-colors"
          >
            + LOG TODAY&apos;S SESSION
          </button>
          <button
            onClick={onClear}
            className="text-[17px] font-mono tracking-normal text-mist border border-panelBorder px-2 py-1 rounded-sm hover:text-warn hover:border-warn/40 transition-colors"
          >
            CLEAR
          </button>
        </div>
      </div>
      <p className="text-[17px] font-mono text-mist/70 mb-4">
        {history.length} session{history.length === 1 ? "" : "s"} logged in this browser · stored locally, not on a server
      </p>

      {history.length === 0 ? (
        <div className="text-[16px] text-mist py-8 text-center">No sessions logged yet. Click &quot;LOG TODAY&apos;S SESSION&quot; to save the current live averages.</div>
      ) : (
        <>
          {/* summary deltas, first session vs most recent */}
          {history.length > 1 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-2 pb-5 border-b border-panelBorder">
              <StatDelta label="INDEX FLEX Δ" first={first.avgIndex} last={last.avgIndex} />
              <StatDelta label="THUMB FLEX Δ" first={first.avgThumb} last={last.avgThumb} />
              <StatDelta label="GRIP FORCE Δ" first={first.avgGripForceN} last={last.avgGripForceN} unit=" N" />
              <StatDelta label="MIRROR SYNC Δ" first={first.avgMirrorDiffPct / 100} last={last.avgMirrorDiffPct / 100} higherIsBetter={false} />
            </div>
          )}
          {history.length > 1 && (
            <InfoNote label="What are these Δ (change) numbers?">
              Each Δ compares your very first logged session to your most recent one — not session-to-session
              noise, but the overall direction of travel. It's meant to show a trend, not to replace a
              clinician's formal assessment. This data is stored only in this browser's local storage: it has
              no login, isn't backed up, and clearing browser data will erase it — it is a demo stand-in for a
              proper clinical record system, not one itself.
            </InfoNote>
          )}

          <div className="mb-2 mt-5 text-[17px] font-mono text-mist">PER-FINGER FLEX RANGE (%)</div>
          <div className="h-56 -ml-2 mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid stroke="#DCD3BE" strokeDasharray="2 4" />
                <XAxis dataKey="date" tick={{ fill: "#7A7361", fontSize: 12 }} axisLine={{ stroke: "#DCD3BE" }} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: "#7A7361", fontSize: 12 }} axisLine={{ stroke: "#DCD3BE" }} tickLine={false} />
                <Tooltip contentStyle={{ background: "#FFFFFF", border: "1px solid #DCD3BE", fontSize: 13 }} />
                <Legend wrapperStyle={{ fontSize: 12, fontFamily: "monospace" }} />
                {FINGER_LINES.map((f) => (
                  <Line key={f.key} type="monotone" dataKey={f.key} name={f.label} stroke={f.color} strokeWidth={2} dot={{ r: 2 }} isAnimationActive={false} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="mb-2 text-[17px] font-mono text-mist tracking-normal">GRIP FORCE (N)</div>
              <div className="h-32 -ml-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid stroke="#DCD3BE" strokeDasharray="2 4" />
                    <XAxis dataKey="date" tick={{ fill: "#7A7361", fontSize: 12 }} axisLine={{ stroke: "#DCD3BE" }} tickLine={false} />
                    <YAxis tick={{ fill: "#7A7361", fontSize: 12 }} axisLine={{ stroke: "#DCD3BE" }} tickLine={false} />
                    <Tooltip contentStyle={{ background: "#FFFFFF", border: "1px solid #DCD3BE", fontSize: 13 }} />
                    <Line type="monotone" dataKey="grip" name="Grip (N)" stroke="#B8863B" strokeWidth={2} dot={{ r: 2 }} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div>
              <div className="mb-2 text-[17px] font-mono text-mist tracking-normal">MIRRORING DELTA (LOWER = BETTER SYNC)</div>
              <div className="h-32 -ml-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid stroke="#DCD3BE" strokeDasharray="2 4" />
                    <XAxis dataKey="date" tick={{ fill: "#7A7361", fontSize: 12 }} axisLine={{ stroke: "#DCD3BE" }} tickLine={false} />
                    <YAxis tick={{ fill: "#7A7361", fontSize: 12 }} axisLine={{ stroke: "#DCD3BE" }} tickLine={false} />
                    <Tooltip contentStyle={{ background: "#FFFFFF", border: "1px solid #DCD3BE", fontSize: 13 }} />
                    <Line type="monotone" dataKey="mirrorDiff" name="Δ %" stroke="#C1483E" strokeWidth={2} dot={{ r: 2 }} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}