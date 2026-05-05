"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import { QuadraticBezierCurve3, Vector3, Group, Mesh } from "three";
import * as THREE from "three";
import type { Project, SoftSkill } from "@/lib/content";

// ── Colour mapping ──────────────────────────────────────────────────────────
const paperHex: Record<string, string> = {
  "paper-cream": "#ECE6D6",
  "paper-mint":  "#A8C4B0",
  "paper-ochre": "#B89968",
  "paper-blush": "#C8A99B",
  "paper-stone": "#8E8B83",
};

// ── Planet positions (viewBox 1000×600) ────────────────────────────────────
const PLANET_POS: Record<string, { x: number; y: number; size: number }> = {
  levels:         { x: 180, y: 180, size: 70 },
  energizer:      { x: 480, y: 110, size: 64 },
  mirakl:         { x: 820, y: 200, size: 60 },
  "music-agency": { x: 700, y: 460, size: 70 },
  openclaw:       { x: 240, y: 460, size: 90 },
};

// ── 2D → 3D coord mapping ───────────────────────────────────────────────────
function to3D(slug: string): [number, number, number] {
  const pos = PLANET_POS[slug];
  if (!pos) return [0, 0, 0];
  const wx = (pos.x - 500) / 110;
  const wy = (300 - pos.y) / 110;
  const wz = (slug.charCodeAt(0) % 5) * 0.2 - 0.4;
  return [wx, wy, wz];
}

// ── Radius mapping ─────────────────────────────────────────────────────────
function toRadius(slug: string): number {
  const pos = PLANET_POS[slug];
  if (!pos) return 0.4;
  // viewBox size ~60-90 → world radius ~0.28-0.42
  return (pos.size / 110) * 0.55;
}

// ── Build bezier curve points between two slugs ────────────────────────────
function buildCurvePoints(slugA: string, slugB: string): [number, number, number][] {
  const a = new Vector3(...to3D(slugA));
  const b = new Vector3(...to3D(slugB));
  const mid = a.clone().add(b).multiplyScalar(0.5);
  mid.y += 1.2;
  mid.z += 0.6;
  const curve = new QuadraticBezierCurve3(a, mid, b);
  const pts = curve.getPoints(32);
  return pts.map((p) => [p.x, p.y, p.z] as [number, number, number]);
}

// ── Thread lines for one soft-skill ───────────────────────────────────────
function ThreadChain({
  linkedProjectSlugs,
  active,
}: {
  linkedProjectSlugs: string[];
  active: boolean;
}) {
  const segments: Array<{ key: string; pts: [number, number, number][] }> = [];
  for (let i = 0; i < linkedProjectSlugs.length - 1; i++) {
    const a = linkedProjectSlugs[i];
    const b = linkedProjectSlugs[i + 1];
    if (PLANET_POS[a] && PLANET_POS[b]) {
      segments.push({ key: `${a}-${b}`, pts: buildCurvePoints(a, b) });
    }
  }

  return (
    <>
      {segments.map(({ key, pts }) => (
        <Line
          key={key}
          points={pts}
          color="#A4F5C8"
          lineWidth={active ? 2.5 : 1.2}
          transparent
          opacity={active ? 0.9 : 0.18}
        />
      ))}
    </>
  );
}

// ── Single planet mesh with hover + click ─────────────────────────────────
function Planet({
  project,
  isSelected,
  onSelect,
}: {
  project: Project;
  isSelected: boolean;
  onSelect: (slug: string | null) => void;
}) {
  const meshRef = useRef<Mesh>(null);
  const pos = to3D(project.slug);
  const radius = toRadius(project.slug);
  const color = paperHex[project.paperColor] ?? "#ECE6D6";
  const targetScale = isSelected ? 1.18 : 1;

  useFrame(() => {
    if (!meshRef.current) return;
    meshRef.current.scale.lerp(
      new THREE.Vector3(targetScale, targetScale, targetScale),
      0.12
    );
  });

  return (
    <mesh
      ref={meshRef}
      position={pos}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        document.body.style.cursor = "default";
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(isSelected ? null : project.slug);
      }}
    >
      <sphereGeometry args={[radius, 32, 32]} />
      <meshStandardMaterial
        color={color}
        roughness={0.9}
        metalness={0}
        emissive="#A4F5C8"
        emissiveIntensity={isSelected ? 0.18 : 0}
      />
    </mesh>
  );
}

// ── Rotating group containing planets + threads ────────────────────────────
function SceneContent({
  projects,
  softSkills,
  activeIdx,
  selectedSlug,
  onSelectPlanet,
}: {
  projects: Project[];
  softSkills: SoftSkill[];
  activeIdx: number | null;
  selectedSlug: string | null;
  onSelectPlanet: (slug: string | null) => void;
}) {
  const groupRef = useRef<Group>(null!);
  const paused = activeIdx !== null || selectedSlug !== null;

  useFrame((_, dt) => {
    if (!groupRef.current) return;
    if (!paused) {
      groupRef.current.rotation.y += dt * 0.08;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Planets */}
      {projects.map((p) => (
        <Planet
          key={p.slug}
          project={p}
          isSelected={selectedSlug === p.slug}
          onSelect={onSelectPlanet}
        />
      ))}

      {/* Thread chains */}
      {softSkills.map((s, i) => {
        const active = activeIdx === null || activeIdx === i;
        return (
          <ThreadChain
            key={s.slug}
            linkedProjectSlugs={s.linkedProjectSlugs}
            active={active}
          />
        );
      })}
    </group>
  );
}

// ── Exported scene component ───────────────────────────────────────────────
export interface ThreadsSceneProps {
  softSkills: SoftSkill[];
  projects: Project[];
  activeIdx: number | null;
  selectedSlug: string | null;
  onSelectPlanet: (slug: string | null) => void;
}

export function ThreadsScene({
  softSkills,
  projects,
  activeIdx,
  selectedSlug,
  onSelectPlanet,
}: ThreadsSceneProps) {
  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: [0, 1.2, 6], fov: 45 }}
      aria-hidden
      className="absolute inset-0 w-full h-full"
    >
      {/* Lighting — editorial planetarium */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 8, 5]} intensity={1.1} color="#f5efdf" />
      <directionalLight position={[-4, -2, -5]} intensity={0.25} color="#a8c4b0" />

      <SceneContent
        projects={projects}
        softSkills={softSkills}
        activeIdx={activeIdx}
        selectedSlug={selectedSlug}
        onSelectPlanet={onSelectPlanet}
      />
    </Canvas>
  );
}
