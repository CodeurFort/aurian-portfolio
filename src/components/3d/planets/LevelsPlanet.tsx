"use client";

import { useRef, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Sparkles } from "@react-three/drei";
import * as THREE from "three";
import { buildLevelsPyramid } from "./LevelsPyramid";
import { playBlip, playWhoosh, startEruptionRumble } from "@/lib/sound";
import { usePerformanceTier } from "@/lib/usePerformanceTier";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const PLANET_RADIUS = 1.2;

// Petite pyramide posée sur le pôle nord (Le Sommet observe)
const SUMMIT_BASE_HALF = 0.22;
const SUMMIT_BASE_Y = 0.0;       // base posée sur la surface (à y = R)
const SUMMIT_APEX_Y = 0.55;      // apex à y = R + 0.55
const SUMMIT_STRATES = [0.12, 0.26, 0.4]; // strates internes
const SUMMIT_GEOM = buildLevelsPyramid(
  SUMMIT_BASE_HALF,
  SUMMIT_BASE_Y,
  SUMMIT_APEX_Y,
  SUMMIT_STRATES,
);

const APEX_EYE_GEOM = new THREE.SphereGeometry(0.045, 16, 12);

// 3 anneaux de niveaux qui ceinturent la planète (orbites de XP)
const LEVEL_RINGS = [
  { inner: 1.55, outer: 1.62, tilt: 0.0 },
  { inner: 1.78, outer: 1.83, tilt: 0.35 },
  { inner: 2.05, outer: 2.09, tilt: -0.25 },
];

// ---------------------------------------------------------------------------
// Levels planet — sphère bordeaux solide, pyramide-Sommet posée au pôle nord,
// 3 anneaux orbitaux (niveaux), œil doré observateur, particules ascendantes.
// ---------------------------------------------------------------------------
interface LevelsPlanetProps {
  posX: number;
  isFocused: boolean;
  onSelectPlanet: () => void;
}

export function LevelsPlanet({
  posX,
  isFocused,
  onSelectPlanet,
}: LevelsPlanetProps) {
  const tier = usePerformanceTier();
  const isLow = tier === "low";

  const groupRef = useRef<THREE.Group>(null);
  const planetRef = useRef<THREE.Mesh>(null);
  const summitGroupRef = useRef<THREE.Group>(null);
  const eyeRef = useRef<THREE.Mesh>(null);
  const ringsRef = useRef<THREE.Group>(null);
  const initializedRef = useRef(false);
  const [hovered, setHovered] = useState(false);

  const clickPhaseRef = useRef<"idle" | "compress" | "explode">("idle");
  const clickTimerRef = useRef(0);

  useEffect(() => {
    document.body.style.cursor = hovered && isFocused ? "pointer" : "auto";
    if (hovered && isFocused) playBlip();
    return () => {
      document.body.style.cursor = "auto";
    };
  }, [hovered, isFocused]);

  useFrame((state, dt) => {
    if (!groupRef.current) return;

    // Scale lerp on focus — skip during click animation
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

    // Slow planet rotation (Y axis)
    if (planetRef.current) {
      planetRef.current.rotation.y += dt * 0.05;
    }

    // Rings counter-rotate
    if (ringsRef.current) {
      ringsRef.current.rotation.y -= dt * 0.08;
    }

    // Apex eye: heartbeat + hover boost
    if (eyeRef.current && clickPhaseRef.current === "idle") {
      const t = state.clock.elapsedTime;
      const beat = 1.0 + Math.sin(t * 2 * Math.PI * 0.9) * 0.12;
      const hoverBoost = hovered && isFocused ? 1.3 : 1.0;
      eyeRef.current.scale.setScalar(beat * hoverBoost);
    }

    // Summit subtle bob (the pyramid "breathes")
    if (summitGroupRef.current && clickPhaseRef.current === "idle") {
      const t = state.clock.elapsedTime;
      const bob = 1.0 + Math.sin(t * 1.4) * 0.015;
      summitGroupRef.current.scale.setScalar(bob);
    }

    // Click animation: compress (200ms) → explode (300ms) → onSelectPlanet
    if (clickPhaseRef.current !== "idle") {
      clickTimerRef.current += dt;
      if (clickPhaseRef.current === "compress") {
        const p = Math.min(1, clickTimerRef.current / 0.2);
        if (eyeRef.current) {
          eyeRef.current.scale.setScalar(1.0 - 0.6 * p);
        }
        if (planetRef.current) {
          planetRef.current.rotation.y += dt * 0.05 * 4;
        }
        if (clickTimerRef.current >= 0.2) {
          clickPhaseRef.current = "explode";
          clickTimerRef.current = 0;
        }
      } else if (clickPhaseRef.current === "explode") {
        const p = Math.min(1, clickTimerRef.current / 0.3);
        if (groupRef.current) {
          const explodeScale = (isFocused ? 1.35 : 1.0) * (1.0 + 0.3 * p);
          groupRef.current.scale.setScalar(explodeScale);
        }
        if (clickTimerRef.current >= 0.3) {
          clickPhaseRef.current = "idle";
          clickTimerRef.current = 0;
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
      {/* Atmosphère bordeaux subtile */}
      <mesh scale={1.06}>
        <sphereGeometry args={[PLANET_RADIUS, 32, 32]} />
        <meshBasicMaterial
          color="#8A1A2E"
          transparent
          opacity={0.14}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Planète principale — sphère bordeaux profond, légèrement émissive */}
      <mesh
        ref={planetRef}
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
      >
        <sphereGeometry args={[PLANET_RADIUS, 64, 64]} />
        <meshStandardMaterial
          color="#3D0A18"
          roughness={0.7}
          metalness={0.15}
          emissive="#5C0A1E"
          emissiveIntensity={isFocused ? 0.6 : 0.35}
        />
      </mesh>

      {/* 3 anneaux de niveaux (strates orbitales) */}
      <group ref={ringsRef}>
        {LEVEL_RINGS.map((ring, i) => (
          <mesh
            key={i}
            rotation={[Math.PI / 2 + ring.tilt, 0, ring.tilt * 0.5]}
          >
            <ringGeometry args={[ring.inner, ring.outer, 64]} />
            <meshBasicMaterial
              color={i === 2 ? "#FFD24A" : i === 1 ? "#FF8C2A" : "#C24D2A"}
              opacity={isFocused ? 0.7 : 0.4}
              transparent
              side={THREE.DoubleSide}
              toneMapped={false}
            />
          </mesh>
        ))}
      </group>

      {/* Pyramide-Sommet posée sur le pôle nord */}
      <group
        ref={summitGroupRef}
        position={[0, PLANET_RADIUS, 0]}
      >
        {/* Pyramide dorée filaire (référence au Sommet) */}
        <lineSegments geometry={SUMMIT_GEOM}>
          <lineBasicMaterial
            color="#FFD24A"
            transparent
            opacity={0.95}
            toneMapped={false}
          />
        </lineSegments>

        {/* Œil doré au sommet — Le Sommet observe */}
        <mesh
          ref={eyeRef}
          geometry={APEX_EYE_GEOM}
          position={[0, SUMMIT_APEX_Y + 0.04, 0]}
        >
          <meshStandardMaterial
            color="#FFE7A0"
            emissive="#FFC04A"
            emissiveIntensity={4.0}
            toneMapped={false}
          />
        </mesh>

        {/* Halo doré autour de l'œil */}
        <mesh position={[0, SUMMIT_APEX_Y + 0.04, 0]} scale={2.2}>
          <sphereGeometry args={[0.045, 16, 12]} />
          <meshBasicMaterial
            color="#FFC04A"
            transparent
            opacity={0.18}
            toneMapped={false}
          />
        </mesh>
      </group>

      {/* Particules ascendantes (XP qui monte vers Le Sommet) */}
      {!isLow && (
        <Sparkles
          count={28}
          scale={[2.6, 3.4, 2.6]}
          size={2.4}
          speed={0.7}
          opacity={0.85}
          color="#FFD27A"
          noise={1.4}
        />
      )}
    </group>
  );
}
