"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows } from "@react-three/drei";
import * as THREE from "three";

export type HandValues = {
  thumb: number;
  index: number;
  middle: number;
  ring: number;
  pinky: number;
  wrist: number;
};

type FingerSpec = {
  key: keyof Omit<HandValues, "wrist">;
  x: number;
  z: number;
  fan: number; // resting splay, radians
  l1: number;
  l2: number;
  radius: number;
  chambers: number; // PneuNet bellows segments
};

const FINGERS: FingerSpec[] = [
  { key: "thumb", x: -0.92, z: 0.35, fan: 0.9, l1: 0.42, l2: 0.34, radius: 0.075, chambers: 4 },
  { key: "index", x: -0.5, z: -0.05, fan: 0.12, l1: 0.62, l2: 0.42, radius: 0.065, chambers: 6 },
  { key: "middle", x: -0.14, z: -0.12, fan: 0, l1: 0.7, l2: 0.46, radius: 0.065, chambers: 6 },
  { key: "ring", x: 0.22, z: -0.08, fan: -0.1, l1: 0.63, l2: 0.42, radius: 0.062, chambers: 6 },
  { key: "pinky", x: 0.56, z: 0.0, fan: -0.22, l1: 0.48, l2: 0.32, radius: 0.055, chambers: 5 },
];

function flexColor(v: number) {
  // low flex (weak/restricted) -> warn red, mid -> signal cyan, high -> vital green
  if (v > 0.7) return new THREE.Color("#39FF9E");
  if (v > 0.35) return new THREE.Color("#00E5FF");
  return new THREE.Color("#FF3D6E");
}

function PneuNetSegment({ length, radius, chambers, color }: { length: number; radius: number; chambers: number; color: THREE.Color }) {
  const chamberGeoms = useMemo(() => {
    const arr = [];
    const step = length / chambers;
    for (let i = 0; i < chambers; i++) {
      arr.push(-length / 2 + step * i + step / 2);
    }
    return arr;
  }, [length, chambers]);

  return (
    <group>
      {/* core silicone tube */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <capsuleGeometry args={[radius * 0.72, length - radius * 1.2, 6, 10]} />
        <meshPhysicalMaterial
          color={"#0D1420"}
          emissive={color}
          emissiveIntensity={0.35}
          roughness={0.25}
          metalness={0.1}
          transmission={0.25}
          thickness={0.4}
          transparent
          opacity={0.92}
        />
      </mesh>
      {/* PneuNet bellows ribs */}
      {chamberGeoms.map((y, i) => (
        <mesh key={i} position={[0, y, radius * 0.55]}>
          <torusGeometry args={[radius * 0.9, radius * 0.22, 6, 12, Math.PI]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.7} roughness={0.4} />
        </mesh>
      ))}
    </group>
  );
}

function Finger({ spec, flex }: { spec: FingerSpec; flex: number }) {
  const color = flexColor(flex);
  const angle1 = flex * 0.95; // MCP joint curl (radians)
  const angle2 = flex * 1.25; // PIP joint curl, curls more than base joint

  return (
    <group position={[spec.x, 0.05, spec.z]} rotation={[0, 0, spec.fan]}>
      <group rotation={[angle1, 0, 0]}>
        <group position={[0, spec.l1 / 2, 0]}>
          <PneuNetSegment length={spec.l1} radius={spec.radius} chambers={spec.chambers} color={color} />
        </group>
        {/* joint node */}
        <mesh position={[0, spec.l1, 0]}>
          <sphereGeometry args={[spec.radius * 0.85, 12, 12]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1} />
        </mesh>

        <group position={[0, spec.l1, 0]} rotation={[angle2, 0, 0]}>
          <group position={[0, spec.l2 / 2, 0]}>
            <PneuNetSegment length={spec.l2} radius={spec.radius * 0.85} chambers={Math.max(3, spec.chambers - 2)} color={color} />
          </group>
          <mesh position={[0, spec.l2, 0]}>
            <sphereGeometry args={[spec.radius * 0.7, 10, 10]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.4} />
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
        <meshPhysicalMaterial
          color={"#0D1420"}
          emissive={"#00E5FF"}
          emissiveIntensity={0.12}
          roughness={0.3}
          metalness={0.2}
          transparent
          opacity={0.85}
        />
      </mesh>
      {/* palm circuitry lines */}
      {[-0.6, -0.2, 0.2, 0.6].map((x, i) => (
        <mesh key={i} position={[x, -0.55, 0.175]}>
          <boxGeometry args={[0.02, 0.9, 0.01]} />
          <meshStandardMaterial color={"#00E5FF"} emissive={"#00E5FF"} emissiveIntensity={2} />
        </mesh>
      ))}
      {/* forearm */}
      <mesh position={[0, -1.55, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <capsuleGeometry args={[0.45, 1.1, 6, 12]} />
        <meshPhysicalMaterial color={"#0D1420"} roughness={0.35} metalness={0.3} emissive={"#1B2A3D"} emissiveIntensity={0.4} />
      </mesh>
    </group>
  );
}

function HandRig({ values }: { values: HandValues }) {
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
    </group>
  );
}

export default function Hand3D({
  values,
  height = 320,
  interactive = true,
  autoRotate = true,
  accent = "#00E5FF",
}: {
  values: HandValues;
  height?: number;
  interactive?: boolean;
  autoRotate?: boolean;
  accent?: string;
}) {
  return (
    <div style={{ height }} className="w-full">
      <Canvas camera={{ position: [0, 0.4, 3.6], fov: 40 }} dpr={[1, 1.75]}>
        <color attach="background" args={["#00000000"]} />
        <ambientLight intensity={0.35} />
        <pointLight position={[3, 3, 3]} intensity={40} color={accent} />
        <pointLight position={[-3, -2, 2]} intensity={20} color={"#B026FF"} />
        <spotLight position={[0, 4, 2]} angle={0.4} intensity={30} color={"#E4F0FF"} />
        <group position={[0, 0.3, 0]} scale={1.05}>
          <HandRig values={values} />
        </group>
        <ContactShadows position={[0, -1.85, 0]} opacity={0.45} scale={6} blur={2.4} far={2} color="#00E5FF" />
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
