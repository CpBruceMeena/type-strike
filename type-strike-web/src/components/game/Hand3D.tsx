"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import { FINGER_COLORS, KEY_FINGER_MAP } from "@/lib/lessons";
import type { FingerName } from "@/lib/lessons";

// ── Finger configuration ─────────────────────────────────

interface FingerConfig {
  name: FingerName;
  side: "left" | "right";
  color: string;
  basePos: [number, number, number];
  baseRot: number;
  segments: [number, number, number];
  keys: string[];
}

const LEFT_FINGERS: FingerConfig[] = [
  {
    name: "left-pinky", side: "left", color: FINGER_COLORS["left-pinky"],
    basePos: [-0.65, 0, -0.3], baseRot: 0.35, segments: [0.35, 0.25, 0.2],
    keys: ["q", "a", "z", "1", "`"],
  },
  {
    name: "left-ring", side: "left", color: FINGER_COLORS["left-ring"],
    basePos: [-0.4, 0, -0.25], baseRot: 0.15, segments: [0.4, 0.28, 0.22],
    keys: ["w", "s", "x", "2"],
  },
  {
    name: "left-middle", side: "left", color: FINGER_COLORS["left-middle"],
    basePos: [-0.15, 0, -0.22], baseRot: 0, segments: [0.42, 0.3, 0.23],
    keys: ["e", "d", "c", "3"],
  },
  {
    name: "left-index", side: "left", color: FINGER_COLORS["left-index"],
    basePos: [0.15, 0, -0.2], baseRot: -0.15, segments: [0.4, 0.28, 0.22],
    keys: ["r", "f", "v", "4", "t", "g", "b", "5"],
  },
];

const RIGHT_FINGERS: FingerConfig[] = [
  {
    name: "right-index", side: "right", color: FINGER_COLORS["right-index"],
    basePos: [-0.15, 0, 0.2], baseRot: 0.15, segments: [0.4, 0.28, 0.22],
    keys: ["y", "h", "n", "6", "u", "j", "m", "7"],
  },
  {
    name: "right-middle", side: "right", color: FINGER_COLORS["right-middle"],
    basePos: [0.1, 0, 0.22], baseRot: 0, segments: [0.42, 0.3, 0.23],
    keys: ["i", "k", ",", "8"],
  },
  {
    name: "right-ring", side: "right", color: FINGER_COLORS["right-ring"],
    basePos: [0.35, 0, 0.25], baseRot: -0.15, segments: [0.4, 0.28, 0.22],
    keys: ["o", "l", ".", "9"],
  },
  {
    name: "right-pinky", side: "right", color: FINGER_COLORS["right-pinky"],
    basePos: [0.6, 0, 0.3], baseRot: -0.35, segments: [0.35, 0.23, 0.18],
    keys: ["p", ";", "/", "0", "-", "="],
  },
];

// ── Props ────────────────────────────────────────────────

interface Hand3DProps {
  focusKeys?: string[];
  className?: string;
}

// ── Finger Segment ───────────────────────────────────────

function FingerSegment({
  length,
  thickness,
  color,
  curlAngle,
  isFingertip,
  delay,
}: {
  length: number;
  thickness: number;
  color: string;
  curlAngle: number;
  isFingertip?: boolean;
  delay: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const startAngle = useRef(Math.random() * 0.3 + 0.1);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    const curl = startAngle.current + curlAngle * 0.5 * (1 + Math.sin(t * 2.5 + delay));
    groupRef.current.rotation.x = curl;
  });

  return (
    <group ref={groupRef}>
      <mesh position={[0, length / 2, 0]}>
        <boxGeometry args={[thickness, length, thickness]} />
        <meshStandardMaterial color={color} roughness={0.4} metalness={0.1} />
      </mesh>
      {isFingertip ? (
        <mesh position={[0, length, 0]}>
          <sphereGeometry args={[thickness * 0.8, 12, 12]} />
          <meshStandardMaterial color={color} roughness={0.3} metalness={0.05} />
        </mesh>
      ) : (
        <mesh position={[0, length, 0]}>
          <sphereGeometry args={[thickness * 0.5, 8, 8]} />
          <meshStandardMaterial color={color} roughness={0.5} metalness={0.1} />
        </mesh>
      )}
    </group>
  );
}

// ── Individual Finger ────────────────────────────────────

function Finger({
  config,
  isHighlighted,
  animDelay,
}: {
  config: FingerConfig;
  isHighlighted: boolean;
  animDelay: number;
}) {
  const [s1, s2, s3] = config.segments;
  const baseCurl = 0.15;
  const extraCurl = isHighlighted ? 0.4 : 0.0;

  return (
    <group position={config.basePos} rotation={[0, config.baseRot, 0]}>
      {/* Proximal segment */}
      <FingerSegment
        length={s1} thickness={0.12} color={config.color}
        curlAngle={baseCurl + extraCurl} delay={animDelay}
      />
      {/* Middle segment */}
      <group position={[0, s1, 0]}>
        <FingerSegment
          length={s2} thickness={0.1} color={config.color}
          curlAngle={baseCurl * 1.2 + extraCurl * 0.8} delay={animDelay + 0.15}
        />
        {/* Distal segment + fingertip */}
        <group position={[0, s2, 0]}>
          <FingerSegment
            length={s3} thickness={0.08} color={config.color}
            curlAngle={baseCurl * 1.5 + extraCurl * 0.6}
            isFingertip delay={animDelay + 0.3}
          />
        </group>
      </group>
      {/* Highlight glow */}
      {isHighlighted && (
        <mesh position={[0, s1 + s2 / 2, 0]}>
          <sphereGeometry args={[0.3, 16, 16]} />
          <meshBasicMaterial color={config.color} transparent opacity={0.12} />
        </mesh>
      )}
    </group>
  );
}

// ── Hand (all fingers for one side) ──────────────────────

function Hand({
  fingers,
  highlightedSet,
  side,
}: {
  fingers: FingerConfig[];
  highlightedSet: Set<FingerName>;
  side: "left" | "right";
}) {
  return (
    <group position={side === "left" ? [-0.6, 0, 0] : [0.6, 0, 0]}>
      {/* Palm — warm amber to match the fiery theme */}
      <mesh position={[0, -0.1, 0]}>
        <boxGeometry args={[0.8, 0.3, 0.5]} />
        <meshStandardMaterial color="#d4853a" roughness={0.6} metalness={0.05} />
      </mesh>
      {/* Wrist */}
      <mesh position={[0, -0.4, 0]}>
        <boxGeometry args={[0.56, 0.2, 0.4]} />
        <meshStandardMaterial color="#c0732e" roughness={0.7} metalness={0.02} />
      </mesh>
      {/* Fingers */}
      {fingers.map((finger, i) => (
        <Finger
          key={finger.name} config={finger}
          isHighlighted={highlightedSet.has(finger.name)} animDelay={i * 0.25}
        />
      ))}
    </group>
  );
}

// ── Scene ────────────────────────────────────────────────

function HandScene({ highlightedSet }: { highlightedSet: Set<FingerName> }) {
  const hasLeft = LEFT_FINGERS.some((f) => highlightedSet.has(f.name));
  const hasRight = RIGHT_FINGERS.some((f) => highlightedSet.has(f.name));
  const showBoth = !hasLeft && !hasRight;

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 10, 5]} intensity={1} />
      <directionalLight position={[-3, 5, -3]} intensity={0.3} />
      <pointLight position={[0, 3, 2]} intensity={0.4} color="#f97316" />
      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.6, 0]}>
        <planeGeometry args={[6, 4]} />
        <meshStandardMaterial color="#111111" transparent opacity={0.3} />
      </mesh>
      {/* Left hand */}
      {(showBoth || hasLeft) && (
        <Hand fingers={LEFT_FINGERS} highlightedSet={highlightedSet} side="left" />
      )}
      {/* Right hand */}
      {(showBoth || hasRight) && (
        <Hand fingers={RIGHT_FINGERS} highlightedSet={highlightedSet} side="right" />
      )}
      {/* Particle ring */}
      {highlightedSet.size > 0 && <ParticleRing color="#f97316" count={30} />}
    </>
  );
}

// ── Particle Ring ─────────────────────────────────────────

function ParticleRing({ color, count }: { color: string; count: number }) {
  const meshRef = useRef<THREE.Points>(null);
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const radius = 1.2 + Math.random() * 0.3;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = 0.5 + Math.random() * 0.5;
      positions[i * 3 + 2] = Math.sin(angle) * radius;
    }
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return geo;
  }, [count]);

  useFrame((state) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.y += 0.003;
    meshRef.current.position.y = 0.2 + Math.sin(state.clock.elapsedTime * 0.3) * 0.05;
  });

  return (
    <points ref={meshRef} geometry={geometry}>
      <pointsMaterial
        size={0.04} color={color} transparent opacity={0.4} sizeAttenuation
      />
    </points>
  );
}

// ── Main Export ──────────────────────────────────────────

export default function Hand3D({
  focusKeys = [],
  className = "",
}: Hand3DProps) {
  const highlightedSet = useMemo(() => {
    const set = new Set<FingerName>();
    for (const key of focusKeys) {
      const finger = KEY_FINGER_MAP[key.toLowerCase()];
      if (finger) set.add(finger);
    }
    return set;
  }, [focusKeys]);

  const hasLeft = LEFT_FINGERS.some((f) => highlightedSet.has(f.name));
  const hasRight = RIGHT_FINGERS.some((f) => highlightedSet.has(f.name));

  let label = "Both hands";
  if (hasLeft && !hasRight) label = "Left hand";
  if (!hasLeft && hasRight) label = "Right hand";
  if (highlightedSet.size === 0) label = "Full hand view";

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="w-full h-[350px] rounded-[22px] border border-neutral-800/60 bg-neutral-950/60 overflow-hidden shadow-[0_0_40px_rgba(249,115,22,0.04)]">
        <Canvas dpr={[1, 1.5]}>
          <PerspectiveCamera makeDefault position={[0, 1.5, 3.2]} fov={32} />
          <OrbitControls
            enablePan={false} enableZoom={false}
            minPolarAngle={0.8} maxPolarAngle={1.3}
            autoRotate autoRotateSpeed={0.8}
          />
          <HandScene highlightedSet={highlightedSet} />
        </Canvas>
      </div>
      {/* Label */}
      <div className="mt-1.5 flex items-center gap-3 text-[9px] tracking-[1px] text-neutral-600 font-bold uppercase">
        <span>{label}</span>
        {highlightedSet.size > 0 && (
          <>
            <span>·</span>
            <span style={{ color: "#f97316" }}>
              {highlightedSet.size} finger{highlightedSet.size > 1 ? "s" : ""} active
            </span>
          </>
        )}
      </div>
    </div>
  );
}
