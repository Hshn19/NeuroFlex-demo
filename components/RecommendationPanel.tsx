"use client";

import { Recommendation } from "@/lib/recommendationEngine";

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
        <h2 className="font-display text-xs tracking-[0.25em] text-signal">RECOMMENDED PROTOCOL</h2>
        <span
          className={`text-[10px] font-mono uppercase tracking-widest border px-2 py-0.5 rounded-sm ${SEVERITY_COLOR[exercise.severity]}`}
        >
          {exercise.severity}
        </span>
      </div>

      <h3 className="font-display text-lg text-bone mb-1.5">{exercise.name}</h3>
      <p className="text-[13px] text-mist leading-relaxed mb-4">{exercise.description}</p>

      <div className="bg-void/50 border border-panelBorder rounded-sm p-3 mb-4">
        <div className="text-[10px] font-mono text-mist tracking-widest mb-1">MODEL RATIONALE</div>
        <p className="text-[12px] text-signal/90 font-mono leading-relaxed">{reason}</p>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-mono text-mist tracking-widest">CONFIDENCE</span>
          <span className="text-[10px] font-mono text-bone">{Math.round(confidence * 100)}%</span>
        </div>
        <div className="h-1 w-full bg-panelBorder/60 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-signalDim to-signal rounded-full transition-all duration-700"
            style={{ width: `${confidence * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
