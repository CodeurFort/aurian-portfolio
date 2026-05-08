"use client";

import { useRef, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Line, Sparkles } from "@react-three/drei";
import * as THREE from "three";
import { buildEnergizerShellMaterial } from "./EnergizerShader";
import { buildGlobeWireframe } from "./EnergizerGlobe";
import { playBlip, playWhoosh, startEruptionRumble } from "@/lib/sound";
import { usePerformanceTier } from "@/lib/usePerformanceTier";

// ---------------------------------------------------------------------------
// Static geometries — built once at module level, shared across instances.
// ---------------------------------------------------------------------------
const GLOBE_RADIUS = 1.2;
// 16 meridians × 8 parallels — clean continuous wireframe globe (longitude
// + latitude lines), like a sci-fi flight tracker / data scanner globe.
const WIREFRAME_GEOM = buildGlobeWireframe(GLOBE_RADIUS, 16, 8, 64);

const CORE_GEOM = new THREE.IcosahedronGeometry(0.18, 1);

// ShaderMaterial for the wireframe — built once, shared across instances.
const SHELL_MATERIAL = buildEnergizerShellMaterial(GLOBE_RADIUS);

// ---------------------------------------------------------------------------
// Random point on a sphere (uniform distribution).
// ---------------------------------------------------------------------------
function randomPointOnSphere(radius: number): THREE.Vector3 {
  // Spherical coordinates with uniform area distribution:
  //   u, v in [0,1) → theta in [0, 2π), phi in [0, π]
  //   x = r * sin(phi) * cos(theta)
  //   y = r * cos(phi)
  //   z = r * sin(phi) * sin(theta)
  const u = Math.random();
  const v = Math.random();
  const theta = 2 * Math.PI * u;
  const phi = Math.acos(2 * v - 1);
  const sinPhi = Math.sin(phi);
  return new THREE.Vector3(
    radius * sinPhi * Math.cos(theta),
    radius * Math.cos(phi),
    radius * sinPhi * Math.sin(theta),
  );
}

// ---------------------------------------------------------------------------
// Arc slot — allocated at module scope so the interface is visible to
// spawnArc (also module-level) and to the component.
// ---------------------------------------------------------------------------
interface ArcSlot {
  active: boolean;
  points: THREE.Vector3[];
  opacity: number;
  ttl: number;
}

// Arc constants — module-level so spawnArc can reference them without
// capturing component scope (avoids react-hooks/exhaustive-deps issues).
const ARC_POOL_SIZE = 3;
const ARC_DURATION = 0.25; // seconds

function spawnArc(slot: ArcSlot) {
  const r = 1.2;
  const a = randomPointOnSphere(r);
  const b = randomPointOnSphere(r);
  const mid = new THREE.Vector3().lerpVectors(a, b, 0.5);
  const m1 = new THREE.Vector3().lerpVectors(a, mid, 0.5);
  const m2 = new THREE.Vector3().lerpVectors(mid, b, 0.5);
  const jitter = (v: THREE.Vector3) =>
    v
      .clone()
      .add(
        new THREE.Vector3(
          (Math.random() - 0.5) * 0.18,
          (Math.random() - 0.5) * 0.18,
          (Math.random() - 0.5) * 0.18,
        ),
      );
  slot.points = [a, jitter(m1), jitter(mid), jitter(m2), b];
  slot.opacity = 1;
  slot.ttl = ARC_DURATION;
  slot.active = true;
}

// ---------------------------------------------------------------------------
// Electric arc — single drei <Line> rendered when its slot is active.
// ---------------------------------------------------------------------------
interface ElectricArcProps {
  active: boolean;
  points: THREE.Vector3[];
  opacity: number;
}

function ElectricArc({ active, points, opacity }: ElectricArcProps) {
  if (!active || points.length === 0) return null;
  return (
    <Line
      points={points.map((v) => [v.x, v.y, v.z]) as [number, number, number][]}
      color="#FFFFFF"
      lineWidth={1.4}
      transparent
      opacity={opacity}
    />
  );
}

// ---------------------------------------------------------------------------

interface EnergizerPlanetProps {
  posX: number;
  isFocused: boolean;
  onSelectPlanet: () => void;
}

/**
 * Energizer — globe filaire vecteur (méridiens + parallèles continus, gradient
 * cyan→violet, scoring scan band, cœur émissif, arcs électriques, sparkles).
 */
export function EnergizerPlanet({
  posX,
  isFocused,
  onSelectPlanet,
}: EnergizerPlanetProps) {
  const tier = usePerformanceTier();
  const isLow = tier === "low";

  const groupRef = useRef<THREE.Group>(null);
  const wireframeRef = useRef<THREE.LineSegments>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const initializedRef = useRef(false);
  const [hovered, setHovered] = useState(false);

  // Electric arc pool
  const arcsRef = useRef<ArcSlot[]>(
    Array.from({ length: ARC_POOL_SIZE }, () => ({
      active: false,
      points: [],
      opacity: 0,
      ttl: 0,
    }))
  );
  const nextArcCheckRef = useRef(0);
  const [arcsTick, setArcsTick] = useState(0);

  // Hover boost and click animation refs
  const arcSpawnMultiplierRef = useRef(1);
  const clickPhaseRef = useRef<"idle" | "compress" | "explode">("idle");
  const clickTimerRef = useRef(0);

  useEffect(() => {
    document.body.style.cursor = hovered && isFocused ? "pointer" : "auto";
    if (hovered && isFocused) {
      playBlip();
      arcSpawnMultiplierRef.current = 2;
    } else {
      arcSpawnMultiplierRef.current = 1;
    }
    return () => {
      document.body.style.cursor = "auto";
    };
  }, [hovered, isFocused]);

  useFrame((state, dt) => {
    if (!groupRef.current) return;

    // Scale lerp on focus (parity with PlanetMesh) — skip during click animation
    if (clickPhaseRef.current === "idle") {
      const targetScale = isFocused ? 1.35 : 1.0;
      if (!initializedRef.current) {
        groupRef.current.scale.setScalar(targetScale);
        initializedRef.current = true;
      } else {
        const cs = groupRef.current.scale.x;
        const ns = cs + (targetScale - cs) * 0.06;
        groupRef.current.scale.set(ns, ns, ns);
      }
    }

    // Outer rotation (Y axis)
    if (wireframeRef.current) {
      wireframeRef.current.rotation.y += dt * 0.05;
    }

    // Core counter-rotation + heartbeat pulse — skip during click animation
    if (coreRef.current) {
      coreRef.current.rotation.y -= dt * 0.08;
      coreRef.current.rotation.x += dt * 0.04;
      if (clickPhaseRef.current === "idle") {
        const t = state.clock.elapsedTime;
        const beat = 1.0 + Math.sin(t * 2 * Math.PI * 1.2) * 0.04;
        const heartHoverBoost = hovered && isFocused ? 1.05 : 1.0;
        coreRef.current.scale.setScalar(beat * heartHoverBoost);
      }
    }

    // Scoring pulse: every 3s, an active phase of 1.2s during which uPulse goes 0→1.
    const pulsePeriod = 3.0;
    const pulseDuration = 1.2;
    const elapsed = state.clock.elapsedTime;
    const phase = (elapsed % pulsePeriod) / pulseDuration;
    SHELL_MATERIAL.uniforms.uPulse.value = phase <= 1.0 ? phase : -1.0;
    SHELL_MATERIAL.uniforms.uPulseWidth.value = (hovered && isFocused) ? 0.16 : 0.12;

    // Electric arcs lifecycle (skipped on low-end devices)
    if (!isLow) {
      let needsTick = false;
      arcsRef.current.forEach((slot) => {
        if (slot.active) {
          slot.ttl -= dt;
          if (slot.ttl <= 0) {
            slot.active = false;
            slot.opacity = 0;
            needsTick = true;
          } else {
            slot.opacity = Math.max(0, slot.ttl / ARC_DURATION);
          }
        }
      });

      nextArcCheckRef.current -= dt;
      if (nextArcCheckRef.current <= 0) {
        nextArcCheckRef.current = (0.4 + Math.random() * 0.8) / arcSpawnMultiplierRef.current;
        const freeSlot = arcsRef.current.find((s) => !s.active);
        if (freeSlot) {
          spawnArc(freeSlot);
          needsTick = true;
        }
      }
      if (needsTick) setArcsTick((x) => x + 1);
    }

    // Click animation: compress (200ms) → explode (300ms) → onSelectPlanet
    if (clickPhaseRef.current !== "idle") {
      clickTimerRef.current += dt;
      if (clickPhaseRef.current === "compress") {
        const p = Math.min(1, clickTimerRef.current / 0.2);
        if (coreRef.current) {
          const compressScale = 1.0 - 0.6 * p; // 1.0 → 0.4
          coreRef.current.scale.setScalar(compressScale);
        }
        if (wireframeRef.current) {
          wireframeRef.current.rotation.y += dt * 0.05 * 2; // extra ×2 on top of base ×1
        }
        if (clickTimerRef.current >= 0.2) {
          clickPhaseRef.current = "explode";
          clickTimerRef.current = 0;
        }
      } else if (clickPhaseRef.current === "explode") {
        const p = Math.min(1, clickTimerRef.current / 0.3);
        if (groupRef.current) {
          const explodeScale = (isFocused ? 1.35 : 1.0) * (1.0 + 0.25 * p);
          groupRef.current.scale.setScalar(explodeScale);
        }
        SHELL_MATERIAL.uniforms.uOpacity.value = 0.9 + 0.1 * (1 - p); // brief boost
        if (clickTimerRef.current >= 0.3) {
          // reset visual state
          clickPhaseRef.current = "idle";
          clickTimerRef.current = 0;
          SHELL_MATERIAL.uniforms.uOpacity.value = 0.9;
          if (groupRef.current) {
            groupRef.current.scale.setScalar(isFocused ? 1.35 : 1.0);
          }
          onSelectPlanet();
        }
      }
    }
  });

  return (
    <group ref={groupRef} position={[posX, 0, 0]}>
      {/* Globe filaire (méridiens + parallèles continus) */}
      <lineSegments
        ref={wireframeRef}
        geometry={WIREFRAME_GEOM}
        material={SHELL_MATERIAL}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
        onClick={(e) => {
          e.stopPropagation();
          if (!isFocused) return;
          if (clickPhaseRef.current !== "idle") return;
          clickPhaseRef.current = "compress";
          clickTimerRef.current = 0;
          playWhoosh();
          startEruptionRumble();
        }}
      />

      {/* Emissive core */}
      <mesh ref={coreRef} geometry={CORE_GEOM}>
        <meshStandardMaterial
          color="#E6FBFF"
          emissive="#A0F0FF"
          emissiveIntensity={3}
          toneMapped={false}
        />
      </mesh>

      {/* Data flow particles around the wireframe */}
      {!isLow && (
        <Sparkles
          count={12}
          scale={[2.6, 2.6, 2.6]}
          size={2.5}
          speed={0.4}
          opacity={0.9}
          color="#A0F0FF"
          noise={1.2}
        />
      )}

      {/* Electric arcs (show-off) */}
      {!isLow && arcsRef.current.map((slot, i) => (
        <ElectricArc
          key={`arc-${i}-${arcsTick}`}
          active={slot.active}
          points={slot.points}
          opacity={slot.opacity}
        />
      ))}
    </group>
  );
}
