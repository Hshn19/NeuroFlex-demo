export type FingerKey = "thumb" | "index" | "middle" | "ring" | "pinky";

export type Exercise = {
  id: string;
  name: string;
  targetFinger: FingerKey | "wrist" | "all";
  severity: "mild" | "moderate" | "significant";
  description: string;
  instructions: string[];
  durationSec: number;
  repFrames: { thumb: number; index: number; middle: number; ring: number; pinky: number; wrist: number }[];
};

// repFrames: sequence of joint-flex keyframes (0 = fully extended/open, 1 = fully flexed/closed)
// wrist: -1 (extend) to 1 (flex), 0 neutral. Interpolated + looped by the ExerciseDemo component.

export const EXERCISES: Exercise[] = [
  {
    id: "tendon-glide",
    name: "Tendon Glide Sequence",
    targetFinger: "all",
    severity: "mild",
    description:
      "Guides all five digits through the full glide pattern to maintain tendon mobility and reduce stiffness.",
    instructions: [
      "Start with fingers fully extended, hand relaxed and flat.",
      "Curl fingertips down to touch the upper palm — hook fist.",
      "Continue curling into a full fist, thumb resting outside.",
      "Hold each position for 3 seconds before releasing.",
      "Return to fully extended. Repeat 10 times, twice daily.",
    ],
    durationSec: 6,
    repFrames: [
      { thumb: 0, index: 0, middle: 0, ring: 0, pinky: 0, wrist: 0 },
      { thumb: 0.3, index: 0.5, middle: 0.5, ring: 0.5, pinky: 0.5, wrist: 0 },
      { thumb: 0.6, index: 1, middle: 1, ring: 1, pinky: 1, wrist: 0 },
      { thumb: 0.3, index: 0.5, middle: 0.5, ring: 0.5, pinky: 0.5, wrist: 0 },
      { thumb: 0, index: 0, middle: 0, ring: 0, pinky: 0, wrist: 0 },
    ],
  },
  {
    id: "index-isolation",
    name: "Index Finger Isolation Flex",
    targetFinger: "index",
    severity: "moderate",
    description:
      "Isolates index flexion against light resistance — targets weakness detected in the index flex channel.",
    instructions: [
      "Keep middle, ring and pinky fingers gently extended.",
      "Slowly curl the index finger toward the palm.",
      "Hold the flexed position for 4 seconds.",
      "Slowly extend back to the start position.",
      "Repeat 12 times. Stop if sharp pain occurs.",
    ],
    durationSec: 5,
    repFrames: [
      { thumb: 0, index: 0, middle: 0.1, ring: 0.1, pinky: 0.1, wrist: 0 },
      { thumb: 0, index: 0.5, middle: 0.1, ring: 0.1, pinky: 0.1, wrist: 0 },
      { thumb: 0, index: 1, middle: 0.1, ring: 0.1, pinky: 0.1, wrist: 0 },
      { thumb: 0, index: 0.5, middle: 0.1, ring: 0.1, pinky: 0.1, wrist: 0 },
      { thumb: 0, index: 0, middle: 0.1, ring: 0.1, pinky: 0.1, wrist: 0 },
    ],
  },
  {
    id: "thumb-opposition",
    name: "Thumb Opposition Circuit",
    targetFinger: "thumb",
    severity: "moderate",
    description:
      "Rebuilds thumb opposition strength and range — targets the low thumb-flex readings from the last session.",
    instructions: [
      "Start with the hand open, thumb extended out to the side.",
      "Sweep the thumb across the palm toward the base of the pinky.",
      "Hold contact for 3 seconds, feeling gentle resistance.",
      "Return the thumb to the starting position slowly.",
      "Repeat 10 times per hand, twice daily.",
    ],
    durationSec: 5,
    repFrames: [
      { thumb: 0, index: 0, middle: 0, ring: 0, pinky: 0, wrist: 0 },
      { thumb: 0.5, index: 0, middle: 0, ring: 0, pinky: 0, wrist: 0 },
      { thumb: 1, index: 0, middle: 0, ring: 0, pinky: 0.2, wrist: 0 },
      { thumb: 0.5, index: 0, middle: 0, ring: 0, pinky: 0, wrist: 0 },
      { thumb: 0, index: 0, middle: 0, ring: 0, pinky: 0, wrist: 0 },
    ],
  },
  {
    id: "wrist-flex-extend",
    name: "Wrist Flexion-Extension",
    targetFinger: "wrist",
    severity: "significant",
    description:
      "Restores wrist range of motion — recommended when wrist angle variance drops below the stable threshold.",
    instructions: [
      "Rest your forearm on a table, palm facing down, wrist off the edge.",
      "Slowly bend the wrist upward as far as comfortable.",
      "Hold for 5 seconds, then slowly lower past neutral.",
      "Hold the lowered position for 5 seconds.",
      "Repeat 8 times, keeping movement slow and controlled.",
    ],
    durationSec: 6,
    repFrames: [
      { thumb: 0.1, index: 0.1, middle: 0.1, ring: 0.1, pinky: 0.1, wrist: 0 },
      { thumb: 0.1, index: 0.1, middle: 0.1, ring: 0.1, pinky: 0.1, wrist: 1 },
      { thumb: 0.1, index: 0.1, middle: 0.1, ring: 0.1, pinky: 0.1, wrist: 0 },
      { thumb: 0.1, index: 0.1, middle: 0.1, ring: 0.1, pinky: 0.1, wrist: -1 },
      { thumb: 0.1, index: 0.1, middle: 0.1, ring: 0.1, pinky: 0.1, wrist: 0 },
    ],
  },
  {
    id: "grip-strengthening",
    name: "Progressive Grip Strengthening",
    targetFinger: "all",
    severity: "significant",
    description:
      "Builds functional grip strength — triggered when average grip force stays below the safe daily-function threshold.",
    instructions: [
      "Hold a soft therapy ball or rolled towel in the palm.",
      "Squeeze all fingers toward the palm with steady, even force.",
      "Hold the squeeze for 5 seconds without straining.",
      "Release slowly and fully open the hand.",
      "Repeat 10 times. Increase resistance only as tolerated.",
    ],
    durationSec: 6,
    repFrames: [
      { thumb: 0.1, index: 0.1, middle: 0.1, ring: 0.1, pinky: 0.1, wrist: 0 },
      { thumb: 0.9, index: 0.9, middle: 0.9, ring: 0.9, pinky: 0.9, wrist: 0.1 },
      { thumb: 0.9, index: 0.9, middle: 0.9, ring: 0.9, pinky: 0.9, wrist: 0.1 },
      { thumb: 0.3, index: 0.3, middle: 0.3, ring: 0.3, pinky: 0.3, wrist: 0 },
      { thumb: 0.1, index: 0.1, middle: 0.1, ring: 0.1, pinky: 0.1, wrist: 0 },
    ],
  },
];
