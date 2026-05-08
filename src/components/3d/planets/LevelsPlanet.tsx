"use client";

import { useRef, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Sparkles } from "@react-three/drei";
import * as THREE from "three";
import { buildLevelsShellMaterial } from "./LevelsShader";
import { playBlip, playWhoosh, startEruptionRumble } from "@/lib/sound";
import { usePerformanceTier } from "@/lib/usePerformanceTier";

// ---------------------------------------------------------------------------
// Static shared assets
// ---------------------------------------------------------------------------
const PLANET_RADIUS = 1.2;
const PLANET_GEOM = new THREE.SphereGeometry(PLANET_RADIUS, 96, 96);
const SHELL_MATERIAL = buildLevelsShellMaterial();

// ---------------------------------------------------------------------------
// Levels planet — sphère noire avec veines incandescentes (bordeaux→or),
// halo fresnel, scan band ascendant. Pas d'arceau, pas de pyramide.
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
      planetRef.current.rotation.y += dt * 0.04;
    }

    // Update shader uniforms
    const t = state.clock.elapsedTime;
    SHELL_MATERIAL.uniforms.uTime.value = t;
    SHELL_MATERIAL.uniforms.uVeinIntensity.value =
      hovered && isFocused ? 2.4 : isFocused ? 1.9 : 1.4;

    // Level-up scan: every 4.5s, an active phase of 1.6s where pulse goes 0→1
    const pulsePeriod = 4.5;
    const pulseDuration = 1.6;
    const phase = (t % pulsePeriod) / pulseDuration;
    SHELL_MATERIAL.uniforms.uPulse.value = phase <= 1.0 ? phase : -1.0;
    SHELL_MATERIAL.uniforms.uPulseWidth.value =
      hovered && isFocused ? 0.14 : 0.10;

    // Click animation: compress (200ms) → explode (300ms) → onSelectPlanet
    if (clickPhaseRef.current !== "idle") {
      clickTimerRef.current += dt;
      if (clickPhaseRef.current === "compress") {
        const p = Math.min(1, clickTimerRef.current / 0.2);
        if (groupRef.current) {
          const cs = (isFocused ? 1.35 : 1.0) * (1.0 - 0.08 * p);
          groupRef.current.scale.setScalar(cs);
        }
        if (planetRef.current) {
          planetRef.current.rotation.y += dt * 0.04 * 4;
        }
        if (clickTimerRef.current >= 0.2) {
          clickPhaseRef.current = "explode";
          clickTimerRef.current = 0;
        }
      } else if (clickPhaseRef.current === "explode") {
        const p = Math.min(1, clickTimerRef.current / 0.3);
        if (groupRef.current) {
          const explodeScale = (isFocused ? 1.35 : 1.0) * (0.92 + 0.43 * p);
          groupRef.current.scale.setScalar(explodeScale);
        }
        SHELL_MATERIAL.uniforms.uVeinIntensity.value = 3.5;
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
      {/* Halo extérieur orange — atmosphère ardente */}
      <mesh scale={1.18}>
        <sphereGeometry args={[PLANET_RADIUS, 32, 32]} />
        <meshBasicMaterial
          color="#FF6A1A"
          transparent
          opacity={0.08}
          side={THREE.BackSide}
          toneMapped={false}
        />
      </mesh>
      <mesh scale={1.08}>
        <sphereGeometry args={[PLANET_RADIUS, 32, 32]} />
        <meshBasicMaterial
          color="#FF8C2A"
          transparent
          opacity={0.14}
          side={THREE.BackSide}
          toneMapped={false}
        />
      </mesh>

      {/* Planète noire avec veines incandescentes */}
      <mesh
        ref={planetRef}
        geometry={PLANET_GEOM}
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

      {/* Particules dorées qui flottent autour (braises) */}
      {!isLow && (
        <Sparkles
          count={32}
          scale={[3.0, 3.0, 3.0]}
          size={2.2}
          speed={0.5}
          opacity={0.8}
          color="#FFB870"
          noise={1.2}
        />
      )}
    </group>
  );
}
