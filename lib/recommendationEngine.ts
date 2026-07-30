import { EXERCISES, Exercise } from "./exercises";
import { SensorReading } from "./sensorSimulator";

export type Recommendation = {
  exercise: Exercise;
  reason: string;
  confidence: number; // 0-1, illustrative only
};

// Simple, transparent rule-based logic for demo purposes.
// A production version would use the personalized model trained on
// hospital treatment-plan data described in the product roadmap —
// this rule-based version exists so the demo has no external
// dependency and no cost, while showing the same interaction pattern.
export function recommend(history: SensorReading[]): Recommendation {
  if (history.length === 0) {
    return { exercise: EXERCISES[0], reason: "Awaiting first telemetry frame.", confidence: 0.2 };
  }

  const window = history.slice(-12);
  const avg = (key: keyof SensorReading) =>
    window.reduce((sum, r) => sum + (r[key] as number), 0) / window.length;

  const avgIndex = avg("index");
  const avgThumb = avg("thumb");
  const avgGrip = avg("gripForceN");
  const wristValues = window.map((r) => r.wrist);
  const wristRange = Math.max(...wristValues) - Math.min(...wristValues);

  if (avgGrip < 12) {
    return {
      exercise: EXERCISES.find((e) => e.id === "grip-strengthening")!,
      reason: `Average grip force ${avgGrip.toFixed(1)} N is below the 12 N functional-task threshold across the last ${window.length} frames.`,
      confidence: 0.86,
    };
  }
  if (avgIndex < 0.35) {
    return {
      exercise: EXERCISES.find((e) => e.id === "index-isolation")!,
      reason: `Index-channel flex averaging ${(avgIndex * 100).toFixed(0)}% of full range — below the 35% mobility target for this stage.`,
      confidence: 0.81,
    };
  }
  if (avgThumb < 0.4) {
    return {
      exercise: EXERCISES.find((e) => e.id === "thumb-opposition")!,
      reason: `Thumb-channel flex averaging ${(avgThumb * 100).toFixed(0)}% — opposition range below target.`,
      confidence: 0.74,
    };
  }
  if (wristRange < 0.5) {
    return {
      exercise: EXERCISES.find((e) => e.id === "wrist-flex-extend")!,
      reason: `Wrist angle variance (${wristRange.toFixed(2)}) is low — limited active range detected this session.`,
      confidence: 0.7,
    };
  }
  return {
    exercise: EXERCISES.find((e) => e.id === "tendon-glide")!,
    reason: "All channels within stable range — maintenance protocol recommended to preserve mobility.",
    confidence: 0.65,
  };
}
