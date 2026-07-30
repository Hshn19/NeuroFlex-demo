"use client";

import { useEffect, useRef, useState } from "react";
import { Exercise } from "@/lib/exercises";
import Hand3D from "./Hand3D";

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export default function ExerciseDemo({ exercise }: { exercise: Exercise }) {
  const frames = exercise.repFrames;
  const [values, setValues] = useState(frames[0]);
  const [stepIndex, setStepIndex] = useState(0);
  const rafRef = useRef<number>();
  const startRef = useRef<number>(0);

  useEffect(() => {
    const segmentMs = (exercise.durationSec * 1000) / (frames.length - 1);
    const totalMs = segmentMs * (frames.length - 1);
    startRef.current = performance.now();

    function tick(now: number) {
      const elapsed = (now - startRef.current) % totalMs;
      const segFloat = elapsed / segmentMs;
      const idx = Math.min(Math.floor(segFloat), frames.length - 2);
      const t = segFloat - idx;
      const a = frames[idx];
      const b = frames[idx + 1];
      setValues({
        thumb: lerp(a.thumb, b.thumb, t),
        index: lerp(a.index, b.index, t),
        middle: lerp(a.middle, b.middle, t),
        ring: lerp(a.ring, b.ring, t),
        pinky: lerp(a.pinky, b.pinky, t),
        wrist: lerp(a.wrist, b.wrist, t),
      });
      setStepIndex(idx);
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [exercise, frames]);

  return (
    <div className="panel clip-corner p-5">
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-display text-xs tracking-[0.25em] text-pulse">MOVEMENT REFERENCE — PNEUNET ACTUATOR MODEL</h2>
        <span className="text-[10px] font-mono text-mist tracking-widest">LOOP · {exercise.durationSec}s CYCLE · DRAG TO ORBIT</span>
      </div>

      <Hand3D values={values} height={300} accent="#B026FF" />

      <div className="mt-3 space-y-1.5">
        {exercise.instructions.map((step, i) => (
          <div
            key={i}
            className={`flex gap-2 text-[12px] font-body leading-snug transition-colors ${
              i === stepIndex % exercise.instructions.length ? "text-bone" : "text-mist"
            }`}
          >
            <span className="font-mono text-signalDim">{String(i + 1).padStart(2, "0")}</span>
            <span>{step}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

