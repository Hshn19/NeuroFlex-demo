"use client";

import { useEffect, useRef, useState } from "react";
import { Exercise, FingerKey } from "@/lib/exercises";
import Hand3D from "./Hand3D";

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

const ALL_FINGERS: FingerKey[] = ["thumb", "index", "middle", "ring", "pinky"];

function targetFingersFor(exercise: Exercise): FingerKey[] | undefined {
  if (exercise.targetFinger === "all") return ALL_FINGERS;
  if (exercise.targetFinger === "wrist") return undefined; // whole-hand tilt is already visible
  return [exercise.targetFinger];
}

export default function ExerciseDemo({ exercise }: { exercise: Exercise }) {
  const frames = exercise.repFrames;
  const [values, setValues] = useState(frames[0]);
  const [stepIndex, setStepIndex] = useState(0);
  const [progress, setProgress] = useState(0); // 0-1 through the current loop
  const rafRef = useRef<number>();
  const startRef = useRef<number>(0);

  // reset to this exercise's first pose immediately when the exercise
  // changes, instead of interpolating from whatever the previous exercise
  // last drew — avoids a visible snap/blend between unrelated movements
  useEffect(() => {
    setValues(frames[0]);
    setStepIndex(0);
    setProgress(0);
  }, [exercise, frames]);

  useEffect(() => {
    // guard: an exercise needs at least 2 keyframes to animate between
    if (!frames || frames.length < 2) return;

    const segmentMs = (exercise.durationSec * 1000) / (frames.length - 1);
    const totalMs = segmentMs * (frames.length - 1);
    if (!isFinite(segmentMs) || !isFinite(totalMs) || totalMs <= 0) return;

    startRef.current = performance.now();

    function tick(now: number) {
      const elapsed = (now - startRef.current) % totalMs;
      const segFloat = elapsed / segmentMs;
      const maxIdx = frames.length - 1;
      // clamp defensively — segFloat/idx should always be in range given the
      // guards above, but a stale rAF firing during a fast exercise swap
      // (recommendation flips as sensor readings cross a threshold) could
      // otherwise index past the array and crash on undefined.thumb
      const idx = Math.min(Math.max(Math.floor(segFloat), 0), maxIdx - 1);
      const a = frames[idx];
      const b = frames[Math.min(idx + 1, maxIdx)];
      if (!a || !b) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      const t = segFloat - idx;
      setValues({
        thumb: lerp(a.thumb, b.thumb, t),
        index: lerp(a.index, b.index, t),
        middle: lerp(a.middle, b.middle, t),
        ring: lerp(a.ring, b.ring, t),
        pinky: lerp(a.pinky, b.pinky, t),
        wrist: lerp(a.wrist, b.wrist, t),
      });
      setStepIndex(idx);
      setProgress(elapsed / totalMs);
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [exercise, frames]);

  const currentStep = exercise.instructions[stepIndex % exercise.instructions.length];
  const targetFingers = targetFingersFor(exercise);

  return (
    <div className="panel clip-corner p-5">
      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
        <h2 className="font-display text-sm tracking-[0.15em] text-pulse">MOVEMENT GUIDE</h2>
        <span className="text-[15px] font-body text-mist">Repeats every {exercise.durationSec} seconds · drag to turn the hand</span>
      </div>

      {/* large, plain-language "do this now" cue — the primary guidance element */}
      <div className="bg-pulse/10 border border-pulse/30 rounded-lg px-4 py-3 mb-3">
        <div className="text-[14px] font-body text-mist mb-0.5">Right now:</div>
        <div className="text-[19px] font-body text-bone leading-snug">{currentStep}</div>
      </div>

      <Hand3D values={values} height={300} accent="#B8863B" targetFingers={targetFingers} autoRotate={false} />

      {/* loop progress bar — shows where we are in the repeated movement */}
      <div className="h-1.5 w-full bg-panelBorder/60 rounded-full overflow-hidden mt-1 mb-4">
        <div
          className="h-full bg-pulse rounded-full"
          style={{ width: `${Math.round(progress * 100)}%`, transition: "width 80ms linear" }}
        />
      </div>

      <div className="space-y-2">
        {exercise.instructions.map((step, i) => (
          <div
            key={i}
            className={`flex gap-3 text-[16px] font-body leading-snug transition-colors ${
              i === stepIndex % exercise.instructions.length ? "text-bone font-medium" : "text-mist"
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