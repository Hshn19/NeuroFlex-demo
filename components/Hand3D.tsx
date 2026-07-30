"use client";

import { useMemo, useRef, MutableRefObject } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, ContactShadows } from "@react-three/drei";
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
  width: number;
};

const FINGERS: FingerSpec[] = [
  { key: "thumb", x: -0.92, z: 0.35, fan: 0.9, l1: 0.4, l2: 0.3, width: 0.19 },
  { key: "index", x: -0.5, z: -0.05, fan: 0.12, l1: 0.6, l2: 0.4, width: 0.16 },
  { key: "middle", x: -0.14, z: -0.12, fan: 0, l1: 0.68, l2: 0.44, width: 0.16 },
  { key: "ring", x: 0.22, z: -0.08, fan: -0.1, l1: 0.61, l2: 0.4, width: 0.15 },
  { key: "pinky", x: 0.56, z: 0.0, fan: -0.22, l1: 0.46, l2: 0.3, width: 0.13 },
];

// --- procedural textures (canvas-generated at runtime, no external image files) ---

function useFabricTexture() {
  return useMemo(() => {
    if (typeof document === "undefined") return null;
    const c = document.createElement("canvas");
    c.width = 128;
    c.height = 128;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#26141A";
    ctx.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 900; i++) {
      const x = Math.random() * 128;
      const y = Math.random() * 128;
      const shade = Math.random() > 0.5 ? "rgba(0,0,0,0.18)" : "rgba(255,255,255,0.05)";
      ctx.fillStyle = shade;
      ctx.fillRect(x, y, 1.4, 1.4);
    }
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2, 6);
    return tex;
  }, []);
}

function useSensorStripTexture() {
  return useMemo(() => {
    if (typeof document === "undefined") return null;
    const c = document.createElement("canvas");
    c.width = 64;
    c.height = 256;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#D9C9A3";
    ctx.fillRect(0, 0, 64, 256);
    // ladder-style strain gauge rungs
    ctx.strokeStyle = "rgba(60,45,25,0.55)";
    ctx.lineWidth = 3;
    for (let y = 6; y < 256; y += 9) {
      ctx.beginPath();
      ctx.moveTo(6, y);
      ctx.lineTo(58, y);
      ctx.stroke();
    }
    // side rails
    ctx.fillStyle = "rgba(60,45,25,0.5)";
    ctx.fillRect(0, 0, 4, 256);
    ctx.fillRect(60, 0, 4, 256);
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }, []);
}

function accentFor(v: number) {
  if (v > 0.7) return new THREE.Color("#39FF9E");
  if (v > 0.35) return new THREE.Color("#00E5FF");
  return new THREE.Color("#FF3D6E");
}

function FingerSegment({
  length,
  width,
  fabricMap,
  stripMap,
  accent,
}: {
  length: number;
  width: number;
  fabricMap: THREE.Texture | null;
  stripMap: THREE.Texture | null;
  accent: THREE.Color;
}) {
  const depth = width * 0.62;
  return (
    <group>
      {/* fabric glove segment */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[width, length, depth]} />
        <meshStandardMaterial map={fabricMap ?? undefined} color={fabricMap ? "#ffffff" : "#2A171C"} roughness={0.95} metalness={0.02} />
      </mesh>
      {/* rounded black piping along the edges */}
      <mesh position={[width / 2 - 0.008, 0, 0]}>
        <boxGeometry args={[0.012, length, depth + 0.01]} />
        <meshStandardMaterial color="#0C0A0B" roughness={0.9} />
      </mesh>
      <mesh position={[-width / 2 + 0.008, 0, 0]}>
        <boxGeometry args={[0.012, length, depth + 0.01]} />
        <meshStandardMaterial color="#0C0A0B" roughness={0.9} />
      </mesh>
      {/* tan sensor strip on the dorsal (top) face */}
      <mesh position={[0, 0, depth / 2 + 0.004]}>
        <boxGeometry args={[width * 0.42, length * 0.94, 0.016]} />
        <meshStandardMaterial
          map={stripMap ?? undefined}
          color={stripMap ? "#ffffff" : "#D9C9A3"}
          roughness={0.55}
          emissive={accent}
          emissiveIntensity={0.18}
        />
      </mesh>
    </group>
  );
}

function ConnectorClip({ accent }: { accent: THREE.Color }) {
  return (
    <group>
      <mesh>
        <boxGeometry args={[0.15, 0.09, 0.09]} />
        <meshStandardMaterial color="#EDEDED" roughness={0.5} metalness={0.1} />
      </mesh>
      <mesh position={[0, 0, 0.046]}>
        <boxGeometry args={[0.05, 0.05, 0.01]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={1.2} />
      </mesh>
    </group>
  );
}

function Finger({
  spec,
  flex,
  fabricMap,
  stripMap,
  wireAnchor,
}: {
  spec: FingerSpec;
  flex: number;
  fabricMap: THREE.Texture | null;
  stripMap: THREE.Texture | null;
  wireAnchor: (p: THREE.Vector3) => void;
}) {
  const accent = accentFor(flex);
  const angle1 = flex * 0.95;
  const angle2 = flex * 1.25;
  const clipRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (clipRef.current) {
      const p = new THREE.Vector3();
      clipRef.current.getWorldPosition(p);
      wireAnchor(p);
    }
  });

  return (
    <group position={[spec.x, 0.05, spec.z]} rotation={[0, 0, spec.fan]}>
      <group rotation={[angle1, 0, 0]}>
        <group position={[0, spec.l1 / 2, 0]}>
          <FingerSegment length={spec.l1} width={spec.width} fabricMap={fabricMap} stripMap={stripMap} accent={accent} />
        </group>

        {/* connector clip sits at the first knuckle, like the reference glove */}
        <group ref={clipRef} position={[0, spec.l1 * 0.32, spec.width * 0.4]} rotation={[Math.PI / 2, 0, 0]}>
          <ConnectorClip accent={accent} />
        </group>

        <mesh position={[0, spec.l1, 0]}>
          <sphereGeometry args={[spec.width * 0.42, 10, 10]} />
          <meshStandardMaterial color="#1B0F13" roughness={0.9} />
        </mesh>

        <group position={[0, spec.l1, 0]} rotation={[angle2, 0, 0]}>
          <group position={[0, spec.l2 / 2, 0]}>
            <FingerSegment length={spec.l2} width={spec.width * 0.86} fabricMap={fabricMap} stripMap={stripMap} accent={accent} />
          </group>
          <mesh position={[0, spec.l2, 0]}>
            <sphereGeometry args={[spec.width * 0.32, 8, 8]} />
            <meshStandardMaterial color="#1B0F13" roughness={0.9} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

function WireBundle({ anchors }: { anchors: MutableRefObject<THREE.Vector3[]> }) {
  const groupRef = useRef<THREE.Group>(null);
  const bundlePoint = new THREE.Vector3(0, -1.05, 0.22);
  const exitPoint = new THREE.Vector3(0, -1.9, 0.15);
  const frameCount = useRef(0);

  useFrame(() => {
    if (!groupRef.current) return;
    // Rebuild every 3rd frame only — wires are cosmetic and don't need 60fps
    // precision, and this keeps geometry/material churn (and disposal cost) low.
    frameCount.current += 1;
    if (frameCount.current % 3 !== 0) return;

    // dispose previous frame's geometries/materials before clearing to avoid
    // leaking GPU memory over a long-running demo session
    groupRef.current.children.forEach((child) => {
      const mesh = child as THREE.Mesh;
      mesh.geometry?.dispose();
      const mat = mesh.material as THREE.Material | THREE.Material[];
      if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
      else mat?.dispose();
    });
    groupRef.current.clear();

    anchors.current.forEach((p) => {
      const local = p.clone();
      const curve = new THREE.CatmullRomCurve3([
        local,
        local.clone().lerp(bundlePoint, 0.45).add(new THREE.Vector3(0, -0.1, 0.05)),
        bundlePoint.clone(),
      ]);
      const geom = new THREE.TubeGeometry(curve, 16, 0.014, 6, false);
      const mat = new THREE.MeshStandardMaterial({ color: "#C21F2E", roughness: 0.6 });
      const mesh = new THREE.Mesh(geom, mat);
      groupRef.current!.add(mesh);
    });
    // black cable sleeve continuing off the wrist
    const sleeveCurve = new THREE.CatmullRomCurve3([bundlePoint, exitPoint]);
    const sleeveGeom = new THREE.TubeGeometry(sleeveCurve, 8, 0.05, 8, false);
    const sleeveMat = new THREE.MeshStandardMaterial({ color: "#141414", roughness: 0.7 });
    groupRef.current!.add(new THREE.Mesh(sleeveGeom, sleeveMat));
  });

  return <group ref={groupRef} />;
}

function GloveBody({ fabricMap }: { fabricMap: THREE.Texture | null }) {
  return (
    <group>
      {/* palm */}
      <mesh position={[0, -0.55, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.15, 1.15, 0.32]} />
        <meshStandardMaterial map={fabricMap ?? undefined} color={fabricMap ? "#ffffff" : "#2A171C"} roughness={0.95} />
      </mesh>
      {/* black edge trim */}
      <mesh position={[0, -0.98, 0]}>
        <boxGeometry args={[2.2, 0.1, 0.36]} />
        <meshStandardMaterial color="#0C0A0B" roughness={0.9} />
      </mesh>
      {/* wrist cuff */}
      <mesh position={[0, -1.55, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.46, 0.46, 0.7, 16]} />
        <meshStandardMaterial map={fabricMap ?? undefined} color={fabricMap ? "#ffffff" : "#241318"} roughness={0.95} />
      </mesh>
      <mesh position={[0, -1.88, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.47, 0.47, 0.1, 16]} />
        <meshStandardMaterial color="#0C0A0B" roughness={0.9} />
      </mesh>
    </group>
  );
}

function HandRig({ values }: { values: HandValues }) {
  const group = useRef<THREE.Group>(null);
  const fabricMap = useFabricTexture();
  const stripMap = useSensorStripTexture();
  const anchors = useRef<THREE.Vector3[]>(FINGERS.map(() => new THREE.Vector3()));

  useFrame(() => {
    if (!group.current) return;
    const target = values.wrist * 0.35;
    group.current.rotation.z = THREE.MathUtils.lerp(group.current.rotation.z, target, 0.12);
  });

  return (
    <group ref={group}>
      <GloveBody fabricMap={fabricMap} />
      {FINGERS.map((f, i) => (
        <Finger
          key={f.key}
          spec={f}
          flex={values[f.key]}
          fabricMap={fabricMap}
          stripMap={stripMap}
          wireAnchor={(p) => (anchors.current[i] = p)}
        />
      ))}
      <WireBundle anchors={anchors} />
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
      <Canvas camera={{ position: [0, 0.4, 3.6], fov: 40 }} dpr={[1, 1.75]} shadows>
        <color attach="background" args={["#00000000"]} />
        <ambientLight intensity={0.55} />
        <directionalLight position={[3, 4, 3]} intensity={1.4} color="#FFF6E8" castShadow />
        <pointLight position={[-3, 1, 2]} intensity={12} color={accent} />
        <group position={[0, 0.3, 0]} scale={1.05}>
          <HandRig values={values} />
        </group>
        <ContactShadows position={[0, -2.0, 0]} opacity={0.5} scale={6} blur={2.2} far={2} color="#000000" />
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