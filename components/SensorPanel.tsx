"use client";

import { LineChart, Line, ResponsiveContainer, YAxis, Tooltip } from "recharts";
import { SensorReading } from "@/lib/sensorSimulator";

const CHANNELS: { key: keyof SensorReading; label: string }[] = [
  { key: "thumb", label: "THUMB FLEX" },
  { key: "index", label: "INDEX FLEX" },
  { key: "middle", label: "MIDDLE FLEX" },
  { key: "ring", label: "RING FLEX" },
  { key: "pinky", label: "PINKY FLEX" },
];

function Bar({ label, value }: { label: string; value: number }) {
  const pct = Math.round(value * 100);
  const low = value < 0.35;
  return (
    <div className="mb-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] tracking-widest text-mist font-mono">{label}</span>
        <span
          className={`text-[11px] font-mono ${low ? "text-warn" : "text-signal"}`}
        >
          {pct.toString().padStart(3, "0")}%
        </span>
      </div>
      <div className="h-1.5 w-full bg-panelBorder/60 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${
            low ? "bg-warn shadow-glow" : "bg-signal shadow-glow"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function SensorPanel({ history }: { history: SensorReading[] }) {
  const latest = history[history.length - 1];
  const chartData = history.map((r, i) => ({ i, grip: Number(r.gripForceN.toFixed(1)) }));

  return (
    <div className="panel clip-corner p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-xs tracking-[0.25em] text-signal">LIVE TELEMETRY</h2>
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-vital animate-flicker" />
          <span className="text-[10px] font-mono text-vital tracking-widest">STREAMING</span>
        </div>
      </div>

      {CHANNELS.map((c) => (
        <Bar key={c.key} label={c.label} value={latest[c.key] as number} />
      ))}

      <div className="flex items-center justify-between mt-4 mb-1">
        <span className="text-[11px] tracking-widest text-mist font-mono">WRIST ANGLE</span>
        <span className="text-[11px] font-mono text-signal">{(latest.wrist * 45).toFixed(1)}°</span>
      </div>

      <div className="mt-4 pt-4 border-t border-panelBorder">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] tracking-widest text-mist font-mono">GRIP FORCE (N)</span>
          <span className="text-[11px] font-mono text-pulse">{latest.gripForceN.toFixed(1)} N</span>
        </div>
        <div className="h-16 -ml-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <YAxis hide domain={[0, 60]} />
              <Tooltip
                contentStyle={{ background: "#0D1420", border: "1px solid #1B2A3D", fontSize: 11 }}
                labelFormatter={() => ""}
              />
              <Line type="monotone" dataKey="grip" stroke="#B026FF" strokeWidth={2} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
