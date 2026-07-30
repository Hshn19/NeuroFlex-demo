"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, ContactShadows, Line } from "@react-three/drei";
import * as THREE from "three";

export type HandValues = {
  thumb: number;
  index: number;
  middle: number;
  ring: number;
  pinky: number;
  wrist: number;
};

type FingerKey = keyof Omit<HandValues, "wrist">;

type FingerSpec = {
  key: FingerKey;
  x: number;
  z: number;
  fan: number; // resting splay, radians
  l1: number;
  l2: number;
  radius: number;
};

// Proportions kept from the original working hand rig — this silhouette
// (five tapering fingers fanned above a rectangular palm) reads correctly
// as a hand. Not redesigning positions/lengths again, only the material
// and adding the palm/wrist housing + sensor wires requested.
const FINGERS: FingerSpec[] = [
  { key: "thumb", x: -0.92, z: 0.35, fan: 0.9, l1: 0.42, l2: 0.34, radius: 0.075 },
  { key: "index", x: -0.5, z: -0.05, fan: 0.12, l1: 0.62, l2: 0.42, radius: 0.065 },
  { key: "middle", x: -0.14, z: -0.12, fan: 0, l1: 0.7, l2: 0.46, radius: 0.065 },
  { key: "ring", x: 0.22, z: -0.08, fan: -0.1, l1: 0.63, l2: 0.42, radius: 0.062 },
  { key: "pinky", x: 0.56, z: 0.0, fan: -0.22, l1: 0.48, l2: 0.32, radius: 0.055 },
];

const DEVICE = "#14181D"; // near-black housing — palm + wrist
const STRIPE_A = "#F7EFE2"; // cream band
const STRIPE_B = "#E8879C"; // soft pink band
const WIRE_COLOR = "#D93A46";
const WIRE_HIGHLIGHT = "#F2B33D";

// --- forward kinematics, done as plain trig instead of reading the THREE
// scene graph — this mirrors exactly the rotation chain the JSX below
// applies, so the wire endpoints track the real animated fingertip
// position on every render without needing refs/useFrame plumbing.
function rotX([x, y, z]: [number, number, number], a: number): [number, number, number] {
  const c = Math.cos(a), s = Math.sin(a);
  return [x, y * c - z * s, y * s + z * c];
}
function rotZ([x, y, z]: [number, number, number], a: number): [number, number, number] {
  const c = Math.cos(a), s = Math.sin(a);
  return [x * c - y * s, x * s + y * c, z];
}
function fingertipLocal(spec: FingerSpec, flex: number): [number, number, number] {
  const angle1 = flex * 0.95;
  const angle2 = flex * 1.25;
  const seg1 = rotX([0, spec.l1, 0], angle1);
  const seg2 = rotX([0, spec.l2, 0], angle1 + angle2); // same-axis rotations compose additively
  const tipInFanFrame: [number, number, number] = [seg1[0] + seg2[0], seg1[1] + seg2[1], seg1[2] + seg2[2]];
  const tipRotated = rotZ(tipInFanFrame, spec.fan);
  return [spec.x + tipRotated[0], 0.05 + tipRotated[1], spec.z + tipRotated[2]];
}

// alternating-band "sensor sleeve" look — a safer, lower-risk approximation
// of a diagonal candy-cane stripe (which would need a custom canvas texture
// I can't visually verify here); can revisit for a true diagonal stripe
// once this baseline is confirmed to render correctly.
function FingerBone({ length, radius, startsWith }: { length: number; radius: number; startsWith: 0 | 1 }) {
  const bands = 4;
  const bandLen = length / bands;
  const colors = [STRIPE_A, STRIPE_B];
  return (
    <group>
      {Array.from({ length: bands }).map((_, i) => {
        const y = -length / 2 + bandLen * i + bandLen / 2;
        return (
          <mesh key={i} position={[0, y, 0]}>
            <cylinderGeometry args={[radius, radius, bandLen * 1.02, 14]} />
            <meshStandardMaterial color={colors[(i + startsWith) % 2]} roughness={0.5} />
          </mesh>
        );
      })}
      <mesh position={[0, -length / 2, 0]}>
        <sphereGeometry args={[radius, 10, 10]} />
        <meshStandardMaterial color={colors[startsWith % 2]} roughness={0.5} />
      </mesh>
      <mesh position={[0, length / 2, 0]}>
        <sphereGeometry args={[radius, 10, 10]} />
        <meshStandardMaterial color={colors[(bands - 1 + startsWith) % 2]} roughness={0.5} />
      </mesh>
    </group>
  );
}

function Finger({ spec, flex }: { spec: FingerSpec; flex: number }) {
  const angle1 = flex * 0.95;
  const angle2 = flex * 1.25;

  return (
    <group position={[spec.x, 0.05, spec.z]} rotation={[0, 0, spec.fan]}>
      <group rotation={[angle1, 0, 0]}>
        <group position={[0, spec.l1 / 2, 0]}>
          <FingerBone length={spec.l1} radius={spec.radius} startsWith={0} />
        </group>
        <mesh position={[0, spec.l1, 0]}>
          <sphereGeometry args={[spec.radius * 0.9, 12, 12]} />
          <meshStandardMaterial color={STRIPE_B} roughness={0.5} />
        </mesh>

        <group position={[0, spec.l1, 0]} rotation={[angle2, 0, 0]}>
          <group position={[0, spec.l2 / 2, 0]}>
            <FingerBone length={spec.l2} radius={spec.radius * 0.85} startsWith={1} />
          </group>
          <mesh position={[0, spec.l2, 0]}>
            <sphereGeometry args={[spec.radius * 0.75, 10, 10]} />
            <meshStandardMaterial color={STRIPE_A} roughness={0.5} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

function Palm() {
  return (
    <group>
      <mesh position={[0, -0.55, 0]}>
        <boxGeometry args={[2.1, 1.1, 0.34]} />
        <meshStandardMaterial color={DEVICE} roughness={0.5} metalness={0.15} />
      </mesh>
      {/* rounded wrist/base housing — kept narrow and well below the finger
          attachment points (y = 0.05) so it can't swallow the fingers */}
      <mesh position={[0, -1.15, 0]} scale={[1, 0.85, 1]}>
        <sphereGeometry args={[0.52, 20, 20]} />
        <meshStandardMaterial color={DEVICE} roughness={0.5} metalness={0.15} />
      </mesh>
      <mesh position={[0, -1.65, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <capsuleGeometry args={[0.4, 0.6, 6, 12]} />
        <meshStandardMaterial color={DEVICE} roughness={0.5} metalness={0.15} />
      </mesh>
    </group>
  );
}

const WIRE_ANCHOR: [number, number, number] = [-0.05, 0.1, 0.22];

function Wires({ values, targetFingers }: { values: HandValues; targetFingers?: FingerKey[] }) {
  const hasFocus = !!targetFingers && targetFingers.length > 0 && targetFingers.length < 5;
  return (
    <>
      {FINGERS.map((spec) => {
        const tip = fingertipLocal(spec, values[spec.key]);
        const isTarget = !!targetFingers && targetFingers.includes(spec.key);
        const dimmed = hasFocus && !isTarget;
        return (
          <Line
            key={spec.key}
            points={[tip, WIRE_ANCHOR]}
            color={isTarget ? WIRE_HIGHLIGHT : WIRE_COLOR}
            lineWidth={isTarget ? 2.6 : dimmed ? 1 : 1.6}
            transparent
            opacity={dimmed ? 0.35 : 0.9}
          />
        );
      })}
    </>
  );
}

function HandRig({ values, targetFingers }: { values: HandValues; targetFingers?: FingerKey[] }) {
  const group = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!group.current) return;
    const target = values.wrist * 0.35;
    group.current.rotation.z = THREE.MathUtils.lerp(group.current.rotation.z, target, 0.12);
  });

  return (
    <group ref={group}>
      <Palm />
      {FINGERS.map((f) => (
        <Finger key={f.key} spec={f} flex={values[f.key]} />
      ))}
      <Wires values={values} targetFingers={targetFingers} />
    </group>
  );
}

export default function Hand3D({
  values,
  height = 320,
  interactive = true,
  autoRotate = true,
  accent = "#1F4E6B",
  targetFingers,
}: {
  values: HandValues;
  height?: number;
  interactive?: boolean;
  autoRotate?: boolean;
  accent?: string;
  /** Fingers the current exercise is targeting — their wire lights up gold
   *  and thickens, the rest dim, so it's visually obvious what to move. */
  targetFingers?: FingerKey[];
}) {
  return (
    <div style={{ height }} className="w-full">
      <Canvas
        camera={{ position: [0, 0.4, 3.6], fov: 40 }}
        dpr={[1, 1.75]}
        gl={{ alpha: true, antialias: true }}
        onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
      >
        <ambientLight intensity={0.7} />
        <pointLight position={[3, 3, 3]} intensity={22} color={"#FFF6E8"} />
        <pointLight position={[-3, -2, 2]} intensity={12} color={accent} />
        <spotLight position={[0, 4, 2]} angle={0.45} intensity={18} color={"#FFFFFF"} />
        <group position={[0, 0.3, 0]} scale={1.05}>
          <HandRig values={values} targetFingers={targetFingers} />
        </group>
        <ContactShadows position={[0, -1.85, 0]} opacity={0.28} scale={6} blur={2.6} far={2} color="#1B2A41" />
        <OrbitControls
          enabled={interactive}
          autoRotate={autoRotate}
          autoRotateSpeed={1.1}
          enableZoom={interactive}
          enablePan={false}
          minPolarAngle={Math.PI / 3}
          maxPolarAngle={Math.PI / 1.7}
        />
      </Canvas>
    </div>
  );
}