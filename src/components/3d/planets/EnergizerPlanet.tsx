"use client";

import { useRef, useState, useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Line, Sparkles } from "@react-three/drei";
import * as THREE from "three";
import { buildEnergizerShellMaterial } from "./EnergizerShader";

// ---------------------------------------------------------------------------
// Static geometries — built once at module level, shared across instances.
// ---------------------------------------------------------------------------
const _icoBase = new THREE.IcosahedronGeometry(1.2, 2);
const WIREFRAME_GEOM = new THREE.EdgesGeometry(_icoBase);
_icoBase.dispose();

const CORE_GEOM = new THREE.IcosahedronGeometry(0.18, 1);

// ShaderMaterial for the wireframe — built once, shared across instances.
const SHELL_MATERIAL = buildEnergizerShellMaterial();

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
// Pipeline ring — single dashed orbit ring, tilted and rotating independently.
// ---------------------------------------------------------------------------
interface PipelineRingProps {
  inclination: number; // radians, tilt around X axis
  speed: number;       // rad/s rotation around Y axis
  radius: number;
}

function PipelineRing({ inclination, speed, radius }: PipelineRingProps) {
  const ringRef = useRef<THREE.Group>(null);

  const points = useMemo(() => {
    const pts: [number, number, number][] = [];
    const SEG = 64;
    for (let i = 0; i <= SEG; i++) {
      const a = (i / SEG) * Math.PI * 2;
      pts.push([Math.cos(a) * radius, 0, Math.sin(a) * radius]);
    }
    return pts;
  }, [radius]);

  useFrame((_, dt) => {
    if (ringRef.current) {
      ringRef.current.rotation.y += dt * speed;
    }
  });

  return (
    <group ref={ringRef} rotation={[inclination, 0, 0]}>
      <Line
        points={points}
        color="#7FE3FF"
        lineWidth={1}
        transparent
        opacity={0.7}
        dashed
        dashSize={0.04}
        gapSize={0.06}
      />
    </group>
  );
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
 * Energizer — réacteur vecteur sci-fi.
 * Étape 1 : icosaèdre wireframe + cœur émissif. Sans shader, sans anneaux, sans arcs.
 */
export function EnergizerPlanet({
  posX,
  isFocused,
  onSelectPlanet,
}: EnergizerPlanetProps) {
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

  useEffect(() => {
    document.body.style.cursor = hovered && isFocused ? "pointer" : "auto";
    return () => {
      document.body.style.cursor = "auto";
    };
  }, [hovered, isFocused]);

  useFrame((state, dt) => {
    if (!groupRef.current) return;

    // Scale lerp on focus (parity with PlanetMesh)
    const targetScale = isFocused ? 1.35 : 1.0;
    if (!initializedRef.current) {
      groupRef.current.scale.setScalar(targetScale);
      initializedRef.current = true;
    } else {
      const cs = groupRef.current.scale.x;
      const ns = cs + (targetScale - cs) * 0.06;
      groupRef.current.scale.set(ns, ns, ns);
    }

    // Outer rotation (Y axis)
    if (wireframeRef.current) {
      wireframeRef.current.rotation.y += dt * 0.05;
    }

    // Core counter-rotation + heartbeat pulse
    if (coreRef.current) {
      coreRef.current.rotation.y -= dt * 0.08;
      coreRef.current.rotation.x += dt * 0.04;
      const t = state.clock.elapsedTime;
      const beat = 1.0 + Math.sin(t * 2 * Math.PI * 1.2) * 0.04;
      coreRef.current.scale.setScalar(beat);
    }

    // Scoring pulse: every 3s, an active phase of 1.2s during which uPulse goes 0→1.
    const pulsePeriod = 3.0;
    const pulseDuration = 1.2;
    const elapsed = state.clock.elapsedTime;
    const phase = (elapsed % pulsePeriod) / pulseDuration;
    SHELL_MATERIAL.uniforms.uPulse.value = phase <= 1.0 ? phase : -1.0;

    // Electric arcs lifecycle
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
      nextArcCheckRef.current = 0.4 + Math.random() * 0.8;
      const freeSlot = arcsRef.current.find((s) => !s.active);
      if (freeSlot) {
        spawnArc(freeSlot);
        needsTick = true;
      }
    }
    if (needsTick) setArcsTick((x) => x + 1);
  });

  return (
    <group ref={groupRef} position={[posX, 0, 0]}>
      {/* Outer wireframe icosahedron */}
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
          if (isFocused) onSelectPlanet();
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
      <Sparkles
        count={12}
        scale={[2.6, 2.6, 2.6]}
        size={2.5}
        speed={0.4}
        opacity={0.9}
        color="#A0F0FF"
        noise={1.2}
      />

      {/* 5 pipeline rings (one per audit step) */}
      {[0, 1, 2, 3, 4].map((i) => {
        const inclination = (i * Math.PI) / 5; // 0°, 36°, 72°, 108°, 144°
        const speeds = [0.12, 0.28, 0.18, 0.36, 0.22];
        return (
          <PipelineRing
            key={i}
            inclination={inclination}
            speed={speeds[i]}
            radius={1.32}
          />
        );
      })}

      {/* Electric arcs (show-off) */}
      {arcsRef.current.map((slot, i) => (
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
