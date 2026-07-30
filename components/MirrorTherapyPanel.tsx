"use client";

import Hand3D from "./Hand3D";
import { SensorReading, to8bit, toVoltage } from "@/lib/sensorSimulator";
import InfoNote from "./InfoNote";

const FINGER_KEYS = ["thumb", "index", "middle", "ring", "pinky"] as const;

export default function MirrorTherapyPanel({ latest }: { latest: SensorReading }) {
  const diffs = FINGER_KEYS.map((k) => Math.abs(latest[k] - latest.mirrored[k]));
  const avgDiff = diffs.reduce((a, b) => a + b, 0) / diffs.length;
  const locked = avgDiff < 0.12; // mirrors the thesis's "difference below threshold = successful mirroring"

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <div className="panel clip-corner p-5">
        <div className="flex items-center justify-between mb-2 flex-wrap gap-1">
          <h2 className="font-display text-sm tracking-[0.15em] text-signal">SOURCE — HEALTHY HAND</h2>
          <span className="text-[14px] font-mono text-mist">Flex sensor input</span>
        </div>
        <Hand3D values={{ ...latest, wrist: latest.wrist }} height={260} accent="#1F4E6B" />
      </div>

      <div className="panel clip-corner p-5">
        <div className="flex items-center justify-between mb-2 flex-wrap gap-1">
          <h2 className="font-display text-sm tracking-[0.15em] text-pulse">MIRRORED — AFFECTED HAND</h2>
          <span className="text-[14px] font-mono text-mist">Glove actuator output</span>
        </div>
        <Hand3D
          values={{ ...latest.mirrored, wrist: latest.wrist }}
          height={260}
          accent="#B8863B"
        />
      </div>

      <div className="panel clip-corner p-5 lg:col-span-2">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h2 className="font-display text-sm tracking-[0.15em] text-signal">FLEX SENSOR READING — BOTH HANDS</h2>
          <span
            className={`text-[15px] font-mono uppercase border px-2 py-0.5 rounded-sm ${
              locked ? "text-vital border-vital/40" : "text-warn border-warn/40"
            }`}
          >
            {locked ? "Mirroring: locked" : "Mirroring: syncing"}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[15px] font-mono">
            <thead>
              <tr className="text-mist border-b border-panelBorder">
                <th className="text-left py-2 font-normal">FINGER</th>
                <th className="text-right py-2 font-normal">HEALTHY (8-bit)</th>
                <th className="text-right py-2 font-normal">HEALTHY (V)</th>
                <th className="text-right py-2 font-normal">MIRRORED (8-bit)</th>
                <th className="text-right py-2 font-normal">MIRRORED (V)</th>
                <th className="text-right py-2 font-normal">Δ</th>
              </tr>
            </thead>
            <tbody>
              {FINGER_KEYS.map((k) => {
                const d = Math.abs(latest[k] - latest.mirrored[k]);
                return (
                  <tr key={k} className="border-b border-panelBorder/50">
                    <td className="py-2 text-bone uppercase">{k}</td>
                    <td className="py-2 text-right text-signal">{to8bit(latest[k])}</td>
                    <td className="py-2 text-right text-mist">{toVoltage(latest[k])}</td>
                    <td className="py-2 text-right text-pulse">{to8bit(latest.mirrored[k])}</td>
                    <td className="py-2 text-right text-mist">{toVoltage(latest.mirrored[k])}</td>
                    <td className={`py-2 text-right ${d < 0.12 ? "text-vital" : "text-warn"}`}>{(d * 100).toFixed(0)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <InfoNote label="What is mirroring, and why does it matter?">
          The affected hand's glove is driven to copy the healthy hand's movement in real time. The Δ (delta)
          column is how far off the copy currently is for each finger — smaller is better. Once the average
          difference across all fingers drops below a calibrated threshold, the system reports
          &quot;Mirroring: locked,&quot; meaning the assistive hand is currently tracking the healthy hand
          closely and accurately. The 8-bit and voltage columns are the raw sensor values behind that
          percentage, included for clinicians who want to see the underlying reading rather than just the
          summary.
        </InfoNote>
      </div>
    </div>
  );
}