"use client";

import { useState } from "react";

// A tap-to-reveal explanation, not a hover tooltip — hover tooltips are
// unreliable on touchscreens and easy to miss for anyone not used to them.
// Used under each metric group to explain, in plain language, what the
// number means and why NeuroFlex tracks it.
export default function InfoNote({ label = "What does this mean?", children }: { label?: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-2">
      <button
        onClick={() => setOpen((o) => !o)}
        className="text-[14px] font-body text-signalDim underline decoration-dotted underline-offset-2 hover:text-signal transition-colors"
      >
        {open ? "Hide explanation" : label}
      </button>
      {open && <p className="mt-1.5 text-[14px] font-body text-mist leading-relaxed max-w-prose">{children}</p>}
    </div>
  );
}