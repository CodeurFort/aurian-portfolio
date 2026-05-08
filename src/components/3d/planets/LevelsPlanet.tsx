"use client";

import { useRef, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Sparkles } from "@react-three/drei";
import * as THREE from "three";
import { buildLevelsPyramid } from "./LevelsPyramid";
import { buildLevelsShellMaterial } from "./LevelsShader";
import { playBlip, playWhoosh, startEruptionRumble } from "@/lib/sound";
import { usePerformanceTier } from "@/lib/usePerformanceTier";

// ---------------------------------------------------------------------------
// Pyramid geometry constants
// ---------------------------------------------------------------------------
const BASE_HALF = 0.95;
const Y_BASE_NEG = 0.95;            // base square at y = -BASE_NEG
const Y_APEX = 1.25;                // apex at y = +Y_APEX
const STRATES = [-0.5, -0.05, 0.4, 0.85, 1.05]; // visible level rings

// ---------------------------------------------------------------------------
// Static shared assets
// ---------------------------------------------------------------------------
const PYRAMID_GEOM = buildLevelsPyramid(BASE_HALF, Y_BASE_NEG, Y_APEX, STRATES);
const SHELL_MATERIAL = buildLevelsShellMaterial({ yBase: -Y_BASE_NEG, yApex: Y_APEX });
const APEX_EYE_GEOM = new THREE.SphereGeometry(0.08, 16, 12);

// ---------------------------------------------------------------------------
// Levels planet — pyramide cristalline filaire (gradient bordeaux→or, œil
// observateur au sommet, particules ascendantes).
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
  const wireframeRef = useRef<THREE.LineSegments>(null);
  const eyeRef = useRef<THREE.Mesh>(null);
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

    // Slow Y rotation (the pyramid contemplates)
    if (wireframeRef.current) {
      wireframeRef.current.rotation.y += dt * 0.04;
    }

    // Apex eye: heartbeat + slight bob
    if (eyeRef.current && clickPhaseRef.current === "idle") {
      const t = state.clock.elapsedTime;
      const beat = 1.0 + Math.sin(t * 2 * Math.PI * 0.9) * 0.08;
      const hoverBoost = hovered && isFocused ? 1.15 : 1.0;
      eyeRef.current.scale.setScalar(beat * hoverBoost);
    }

    // Level-up scan: every 4s, an active phase of 1.4s where pulse goes 0→1
    const pulsePeriod = 4.0;
    const pulseDuration = 1.4;
    const elapsed = state.clock.elapsedTime;
    const phase = (elapsed % pulsePeriod) / pulseDuration;
    SHELL_MATERIAL.uniforms.uPulse.value = phase <= 1.0 ? phase : -1.0;
    SHELL_MATERIAL.uniforms.uPulseWidth.value = (hovered && isFocused) ? 0.18 : 0.12;

    // Click animation: compress (200ms) → explode (300ms) → onSelectPlanet
    if (clickPhaseRef.current !== "idle") {
      clickTimerRef.current += dt;
      if (clickPhaseRef.current === "compress") {
        const p = Math.min(1, clickTimerRef.current / 0.2);
        if (eyeRef.current) {
          const compressScale = 1.0 - 0.6 * p;
          eyeRef.current.scale.setScalar(compressScale);
        }
        if (wireframeRef.current) {
          wireframeRef.current.rotation.y += dt * 0.04 * 3;
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
        SHELL_MATERIAL.uniforms.uOpacity.value = 0.95 + 0.05 * (1 - p);
        if (clickTimerRef.current >= 0.3) {
          clickPhaseRef.current = "idle";
          clickTimerRef.current = 0;
          SHELL_MATERIAL.uniforms.uOpacity.value = 0.95;
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
      {/* Pyramide filaire (méridiens d'arêtes + strates horizontales) */}
      <lineSegments
        ref={wireframeRef}
        geometry={PYRAMID_GEOM}
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

      {/* Œil doré au sommet — Le Sommet observe */}
      <mesh ref={eyeRef} geometry={APEX_EYE_GEOM} position={[0, Y_APEX, 0]}>
        <meshStandardMaterial
          color="#FFE7A0"
          emissive="#FFC04A"
          emissiveIntensity={3.5}
          toneMapped={false}
        />
      </mesh>

      {/* Particules ascendantes (XP qui monte) */}
      {!isLow && (
        <Sparkles
          count={20}
          scale={[2.4, 3.0, 2.4]}
          size={2.2}
          speed={0.6}
          opacity={0.85}
          color="#FFD27A"
          noise={1.6}
        />
      )}
    </group>
  );
}
