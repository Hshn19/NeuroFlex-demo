"use client";

import { SensorReading } from "@/lib/sensorSimulator";
import { SessionSnapshot } from "@/lib/sessionHistory";
import { Recommendation } from "@/lib/recommendationEngine";
import { AreaChart, Area, ResponsiveContainer, XAxis, Tooltip } from "recharts";
import InfoNote from "./InfoNote";
import ExerciseDemo from "./ExerciseDemo";

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function plainRange(v: number) {
  if (v > 0.7) return { label: "Moving well", color: "text-vital" };
  if (v > 0.35) return { label: "Making progress", color: "text-signal" };
  return { label: "Needs focus today", color: "text-warn" };
}

const FINGER_LABELS: { key: "thumb" | "index" | "middle" | "ring" | "pinky"; label: string }[] = [
  { key: "thumb", label: "Thumb" },
  { key: "index", label: "Index" },
  { key: "middle", label: "Middle" },
  { key: "ring", label: "Ring" },
  { key: "pinky", label: "Pinky" },
];

export default function PatientSummary({
  latest,
  history,
  rec,
}: {
  latest: SensorReading;
  history: SessionSnapshot[];
  rec: Recommendation;
}) {
  const first = history[0];
  const last = history[history.length - 1] ?? first;
  const sessionsLogged = history.length;

  const indexGainPct = first ? Math.round((last.avgIndex - first.avgIndex) * 100) : 0;
  const gripGain = first ? Math.round(last.avgGripForceN - first.avgGripForceN) : 0;

  const chartData = history.map((s) => ({
    date: fmtDate(s.dateISO),
    overall: Number((((s.avgThumb + s.avgIndex + s.avgMiddle + s.avgRing + s.avgPinky) / 5) * 100).toFixed(0)),
  }));

  return (
    <div className="space-y-5">
      <div className="panel clip-corner p-6">
        <div className="text-[15px] font-mono text-signalDim mb-2">TODAY&apos;S SESSION</div>
        <h2 className="font-display text-2xl text-bone mb-4">
          {sessionsLogged > 1 && indexGainPct > 0
            ? "You're getting stronger 💪"
            : "Let's see how your hand is doing"}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
          {FINGER_LABELS.map((f) => {
            const v = latest[f.key];
            const status = plainRange(v);
            return (
              <div key={f.key} className="flex flex-col items-center gap-2">
                <div className="relative h-20 w-9 bg-panelBorder/40 rounded-full overflow-hidden">
                  <div
                    className="absolute bottom-0 w-full bg-signal shadow-glow rounded-full transition-all duration-700"
                    style={{ height: `${Math.round(v * 100)}%` }}
                  />
                </div>
                <span className="text-[15px] font-mono text-mist">{f.label}</span>
                <span className={`text-[16px] font-body text-center ${status.color}`}>{status.label}</span>
              </div>
            );
          })}
        </div>
        <InfoNote>
          Each bar shows how far that finger can currently bend, compared to a full, healthy range of motion.
          A taller bar means more movement right now. We show each finger on its own because some fingers
          often recover faster than others — this helps show exactly where to focus.
        </InfoNote>
      </div>

      {/* today's guided exercise — the movement demonstration patients actually need */}
      <div>
        <div className="mb-2 px-1">
          <div className="text-[15px] font-mono text-signalDim mb-1">TODAY&apos;S EXERCISE</div>
          <h3 className="font-display text-xl text-bone">{rec.exercise.name}</h3>
        </div>
        <ExerciseDemo exercise={rec.exercise} />
      </div>

      {sessionsLogged > 1 && (
        <div className="panel clip-corner p-6">
          <div className="text-[15px] font-mono text-signalDim mb-2">YOUR PROGRESS</div>
          <div className="flex flex-wrap gap-8 mb-4">
            <div>
              <div className="text-3xl font-display text-vital">{sessionsLogged}</div>
              <div className="text-[15px] font-mono text-mist">sessions logged</div>
            </div>
            <div>
              <div className={`text-3xl font-display ${indexGainPct >= 0 ? "text-vital" : "text-warn"}`}>
                {indexGainPct >= 0 ? "+" : ""}
                {indexGainPct}%
              </div>
              <div className="text-[15px] font-mono text-mist">index finger movement since you started</div>
            </div>
            <div>
              <div className={`text-3xl font-display ${gripGain >= 0 ? "text-vital" : "text-warn"}`}>
                {gripGain >= 0 ? "+" : ""}
                {gripGain} N
              </div>
              <div className="text-[15px] font-mono text-mist">grip strength since you started</div>
            </div>
          </div>

          <div className="h-28 -ml-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="patientProgress" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3F8A5C" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#3F8A5C" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fill: "#7A7361", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "#FFFFFF", border: "1px solid #DCD3BE", fontSize: 13 }} formatter={(v: number) => [`${v}%`, "Overall mobility"]} />
                <Area type="monotone" dataKey="overall" stroke="#3F8A5C" strokeWidth={2} fill="url(#patientProgress)" isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 text-[15px] text-mist leading-relaxed">
            This line shows your overall hand movement, combining all five fingers, across every session
            you&apos;ve logged. Going up means more movement than before.
          </p>
          <InfoNote>
            &quot;Since you started&quot; compares your very first logged session to today. It's a simple
            trend, not a medical measurement — your therapist's own assessment is what actually guides your
            treatment plan.
          </InfoNote>
        </div>
      )}
    </div>
  );
}