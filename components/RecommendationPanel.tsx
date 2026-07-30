"use client";

import { Recommendation } from "@/lib/recommendationEngine";
import InfoNote from "./InfoNote";

const SEVERITY_COLOR: Record<string, string> = {
  mild: "text-vital border-vital/40",
  moderate: "text-signal border-signal/40",
  significant: "text-warn border-warn/40",
};

export default function RecommendationPanel({ rec }: { rec: Recommendation }) {
  const { exercise, reason, confidence } = rec;
  return (
    <div className="panel clip-corner p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display text-sm tracking-[0.15em] text-signal">RECOMMENDED PROTOCOL</h2>
        <span
          className={`text-[17px] font-mono uppercase tracking-normal border px-2 py-0.5 rounded-sm ${SEVERITY_COLOR[exercise.severity]}`}
        >
          {exercise.severity}
        </span>
      </div>

      <h3 className="font-display text-lg text-bone mb-1.5">{exercise.name}</h3>
      <p className="text-[17px] text-mist leading-relaxed mb-4">{exercise.description}</p>

      <div className="bg-void/50 border border-panelBorder rounded-sm p-3 mb-4">
        <div className="text-[17px] font-mono text-mist tracking-normal mb-1">MODEL RATIONALE</div>
        <p className="text-[17px] text-signal/90 font-body leading-relaxed">{reason}</p>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[17px] font-mono text-mist tracking-normal">CONFIDENCE</span>
          <span className="text-[17px] font-mono text-bone">{Math.round(confidence * 100)}%</span>
        </div>
        <div className="h-1 w-full bg-panelBorder/60 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-signalDim to-signal rounded-full transition-all duration-700"
            style={{ width: `${confidence * 100}%` }}
          />
        </div>
        <InfoNote>
          This is not a diagnostic score. It's a plain measure of how strongly the current readings match
          the specific rule that triggered this suggestion — for example, grip force staying below a set
          threshold for several readings in a row. It's shown so the reasoning stays visible instead of
          being a black box; it does not mean the system is 81% sure this is medically correct.
        </InfoNote>
      </div>
    </div>
  );
}