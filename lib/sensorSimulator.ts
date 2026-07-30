"use client";

import { useEffect, useRef, useState } from "react";

export type SensorReading = {
  t: number; // ms timestamp
  // healthy hand — source of the mirror therapy signal (flex sensors, per thesis Ch.3/4)
  thumb: number; // 0-1 normalized flex
  index: number;
  middle: number;
  ring: number;
  pinky: number;
  wrist: number; // -1 to 1
  gripForceN: number; // Newtons, simulated
  // affected hand — PneuNet soft-actuator glove output, tracks the healthy hand
  // with small lag + noise, same as the real closed-loop system described in the FYP
  mirrored: { thumb: number; index: number; middle: number; ring: number; pinky: number };
};

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

// 0-1 normalized -> 8-bit value (0-255) and sensor voltage (0-5V), matching the
// analog-to-digital mapping described in the FYP thesis (raw 0-1023 -> mapped 0-255).
export function to8bit(v: number) {
  return Math.round(clamp(v, 0, 1) * 255);
}
export function toVoltage(v: number) {
  return Number((clamp(v, 0, 1) * 3.9 + 1.2).toFixed(2)); // approximates thesis Table 4-2 range (~1.8–3.2V)
}

function nextValue(prev: number, target: number, noise: number, pull = 0.18) {
  const drift = (target - prev) * pull;
  const jitter = (Math.random() - 0.5) * noise;
  return clamp(prev + drift + jitter, 0, 1);
}

export function useSensorStream(intervalMs = 900) {
  const [readings, setReadings] = useState<SensorReading[]>(() => [seed()]);
  const stateRef = useRef(readings[0]);

  useEffect(() => {
    const id = setInterval(() => {
      setReadings((prev) => {
        const last = stateRef.current;
        const healthy = {
          thumb: nextValue(last.thumb, 0.62, 0.05),
          index: nextValue(last.index, 0.28, 0.06), // weak channel — low target, more noise
          middle: nextValue(last.middle, 0.7, 0.04),
          ring: nextValue(last.ring, 0.66, 0.04),
          pinky: nextValue(last.pinky, 0.6, 0.05),
        };
        // mirrored (affected hand, actuator-driven) tracks healthy hand with lag + small offset
        const lag = 0.35;
        const mirrored = {
          thumb: clamp(last.mirrored.thumb + (healthy.thumb - last.mirrored.thumb) * lag + (Math.random() - 0.5) * 0.03, 0, 1),
          index: clamp(last.mirrored.index + (healthy.index - last.mirrored.index) * lag + (Math.random() - 0.5) * 0.03, 0, 1),
          middle: clamp(last.mirrored.middle + (healthy.middle - last.mirrored.middle) * lag + (Math.random() - 0.5) * 0.03, 0, 1),
          ring: clamp(last.mirrored.ring + (healthy.ring - last.mirrored.ring) * lag + (Math.random() - 0.5) * 0.03, 0, 1),
          pinky: clamp(last.mirrored.pinky + (healthy.pinky - last.mirrored.pinky) * lag + (Math.random() - 0.5) * 0.03, 0, 1),
        };
        const next: SensorReading = {
          t: Date.now(),
          ...healthy,
          wrist: clamp(nextValue((last.wrist + 1) / 2, 0.45, 0.05) * 2 - 1, -1, 1),
          gripForceN: clamp(last.gripForceN + (18 - last.gripForceN) * 0.15 + (Math.random() - 0.5) * 3, 0, 60),
          mirrored,
        };
        stateRef.current = next;
        const trimmed = [...prev, next].slice(-40);
        return trimmed;
      });
    }, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return readings;
}

function seed(): SensorReading {
  return {
    t: Date.now(),
    thumb: 0.55,
    index: 0.3,
    middle: 0.65,
    ring: 0.6,
    pinky: 0.55,
    wrist: 0.1,
    gripForceN: 16,
    mirrored: { thumb: 0.3, index: 0.15, middle: 0.35, ring: 0.32, pinky: 0.3 },
  };
}

