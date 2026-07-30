"use client";

import { LineChart, Line, ResponsiveContainer, YAxis, Tooltip } from "recharts";
import { SensorReading } from "@/lib/sensorSimulator";
import InfoNote from "./InfoNote";

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
        <span className="text-[15px] text-mist font-mono">{label}</span>
        <span className={`text-[15px] font-mono ${low ? "text-warn" : "text-signal"}`}>
          {pct.toString().padStart(3, "0")}%
        </span>
      </div>
      <div className="h-2 w-full bg-panelBorder/60 rounded-full overflow-hidden">
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
        <h2 className="font-display text-sm tracking-[0.15em] text-signal">LIVE TELEMETRY</h2>
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-vital animate-flicker" />
          <span className="text-[15px] font-mono text-vital">STREAMING</span>
        </div>
      </div>

      {CHANNELS.map((c) => (
        <Bar key={c.key} label={c.label} value={latest[c.key] as number} />
      ))}
      <InfoNote>
        Each bar shows how far that finger currently bends, as a percentage of its full range of motion.
        We show fingers separately, rather than one combined hand score, because in real recovery some
        fingers regain movement faster than others — a single number would hide that and could point to
        the wrong exercise.
      </InfoNote>

      <div className="flex items-center justify-between mt-4 mb-1">
        <span className="text-[15px] text-mist font-mono">WRIST ANGLE</span>
        <span className="text-[15px] font-mono text-signal">{(latest.wrist * 45).toFixed(1)}°</span>
      </div>
      <InfoNote>
        How far the wrist is tilted up or down from a relaxed, neutral position, in degrees. It's tracked
        separately from finger flex because wrist mobility and finger mobility often recover at different
        speeds after an injury or stroke — keeping them apart shows which one needs more attention.
      </InfoNote>

      <div className="mt-4 pt-4 border-t border-panelBorder">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[15px] text-mist font-mono">GRIP FORCE (N)</span>
          <span className="text-[15px] font-mono text-pulse">{latest.gripForceN.toFixed(1)} N</span>
        </div>
        <div className="h-16 -ml-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <YAxis hide domain={[0, 60]} />
              <Tooltip
                contentStyle={{ background: "#FFFFFF", border: "1px solid #DCD3BE", fontSize: 13 }}
                labelFormatter={() => ""}
              />
              <Line type="monotone" dataKey="grip" stroke="#B8863B" strokeWidth={2} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <InfoNote>
          Grip force is measured in newtons (N) — for reference, holding a full cup of water steady takes
          roughly 10 N. It's tracked because it's the closest single measurement to "can this hand manage
          a real, everyday task," and it's also what triggers the grip-strengthening exercise when it's low.
        </InfoNote>
      </div>
    </div>
  );
}