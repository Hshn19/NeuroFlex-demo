"use client";

import Hand3D from "./Hand3D";
import { SensorReading, to8bit, toVoltage } from "@/lib/sensorSimulator";

const FINGER_KEYS = ["thumb", "index", "middle", "ring", "pinky"] as const;

export default function MirrorTherapyPanel({ latest }: { latest: SensorReading }) {
  const diffs = FINGER_KEYS.map((k) => Math.abs(latest[k] - latest.mirrored[k]));
  const avgDiff = diffs.reduce((a, b) => a + b, 0) / diffs.length;
  const locked = avgDiff < 0.12; // mirrors the thesis's "difference below threshold = successful mirroring"

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <div className="panel clip-corner p-5">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-display text-xs tracking-[0.25em] text-signal">SOURCE — HEALTHY HAND</h2>
          <span className="text-[10px] font-mono text-mist tracking-widest">FLEX SENSOR INPUT</span>
        </div>
        <Hand3D values={{ ...latest, wrist: latest.wrist }} height={260} accent="#00E5FF" />
      </div>

      <div className="panel clip-corner p-5">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-display text-xs tracking-[0.25em] text-pulse">MIRRORED — AFFECTED HAND</h2>
          <span className="text-[10px] font-mono text-mist tracking-widest">PNEUNET ACTUATOR OUTPUT</span>
        </div>
        <Hand3D
          values={{ ...latest.mirrored, wrist: latest.wrist }}
          height={260}
          accent="#B026FF"
        />
      </div>

      <div className="panel clip-corner p-5 lg:col-span-2">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-xs tracking-[0.25em] text-signal">FLEX SENSOR READING — BOTH HANDS</h2>
          <span
            className={`text-[10px] font-mono uppercase tracking-widest border px-2 py-0.5 rounded-sm ${
              locked ? "text-vital border-vital/40" : "text-warn border-warn/40"
            }`}
          >
            {locked ? "MIRRORING: LOCKED" : "MIRRORING: SYNCING"}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[11px] font-mono">
            <thead>
              <tr className="text-mist border-b border-panelBorder">
                <th className="text-left py-1.5 font-normal tracking-widest">FINGER</th>
                <th className="text-right py-1.5 font-normal tracking-widest">HEALTHY (8-bit)</th>
                <th className="text-right py-1.5 font-normal tracking-widest">HEALTHY (V)</th>
                <th className="text-right py-1.5 font-normal tracking-widest">MIRRORED (8-bit)</th>
                <th className="text-right py-1.5 font-normal tracking-widest">MIRRORED (V)</th>
                <th className="text-right py-1.5 font-normal tracking-widest">Δ</th>
              </tr>
            </thead>
            <tbody>
              {FINGER_KEYS.map((k) => {
                const d = Math.abs(latest[k] - latest.mirrored[k]);
                return (
                  <tr key={k} className="border-b border-panelBorder/50">
                    <td className="py-1.5 text-bone uppercase">{k}</td>
                    <td className="py-1.5 text-right text-signal">{to8bit(latest[k])}</td>
                    <td className="py-1.5 text-right text-mist">{toVoltage(latest[k])}</td>
                    <td className="py-1.5 text-right text-pulse">{to8bit(latest.mirrored[k])}</td>
                    <td className="py-1.5 text-right text-mist">{toVoltage(latest.mirrored[k])}</td>
                    <td className={`py-1.5 text-right ${d < 0.12 ? "text-vital" : "text-warn"}`}>{(d * 100).toFixed(0)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-[10px] font-mono text-mist/70 leading-relaxed">
          Values mapped from raw analog input (0–1023) to 8-bit scale (0–255), per the sensor processing
          method used in the reference hardware. Δ is the healthy/mirrored difference; the system reports
          successful mirroring once average Δ drops below the calibrated threshold.
        </p>
      </div>
    </div>
  );
}
