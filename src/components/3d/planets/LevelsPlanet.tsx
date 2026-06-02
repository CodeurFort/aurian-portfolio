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
// Levels logo bracket — BoxGeometries with per-vertex brightness gradient,
// reproducing the CSS .landingLogo mark (90% → 45% opacity from corner to end).
// Built once at module scope (geometries are shared across instances).
// ---------------------------------------------------------------------------
const BRACKET_BAR_LENGTH = 0.48;
const BRACKET_BAR_THICK = 0.055;
const BRACKET_BAR_DEPTH = 0.012;
// CSS values: rgba(255,255,255,.9)  →  rgba(255,255,255,.45)
const BRACKET_BRIGHT = 0.95;
const BRACKET_DIM = 0.45;

function buildGradientBar(axis: "x" | "y") {
  const w = axis === "x" ? BRACKET_BAR_LENGTH : BRACKET_BAR_THICK;
  const h = axis === "x" ? BRACKET_BAR_THICK : BRACKET_BAR_LENGTH;
  const geom = new THREE.BoxGeometry(w, h, BRACKET_BAR_DEPTH);
  const pos = geom.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const half = BRACKET_BAR_LENGTH / 2;
  for (let i = 0; i < pos.count; i++) {
    let t: number;
    if (axis === "x") {
      // corner at -X, far end at +X
      t = (pos.getX(i) + half) / (2 * half);
    } else {
      // corner at +Y, far end at -Y
      t = (half - pos.getY(i)) / (2 * half);
    }
    const b = BRACKET_BRIGHT + (BRACKET_DIM - BRACKET_BRIGHT) * Math.max(0, Math.min(1, t));
    colors[i * 3 + 0] = b;
    colors[i * 3 + 1] = b;
    colors[i * 3 + 2] = b;
  }
  geom.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  return geom;
}

const BRACKET_H_GEOM = buildGradientBar("x");
const BRACKET_V_GEOM = buildGradientBar("y");
// Tiny disc geom for the corner ignition spark
const BRACKET_CORNER_GEOM = new THREE.CircleGeometry(0.07, 24);

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
  const bracketRef = useRef<THREE.Group>(null);
  const bracketBarsMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const bracketCornerMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const bracketHaloMatRef = useRef<THREE.MeshBasicMaterial>(null);
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

    // Levels logo bracket: surface marker that tracks camera (billboarded)
    if (bracketRef.current && groupRef.current) {
      const planetWorldPos = new THREE.Vector3();
      groupRef.current.getWorldPosition(planetWorldPos);
      const toCamera = new THREE.Vector3()
        .subVectors(state.camera.position, planetWorldPos)
        .normalize();
      // Position just above the surface, toward the camera. Local coords are in
      // groupRef space (uniform scale), so a radius offset places the bracket
      // exactly on the visual surface at any focus scale.
      bracketRef.current.position
        .copy(toCamera)
        .multiplyScalar(PLANET_RADIUS * 1.01);
      // Orient to face the camera (lookAt uses world-space target)
      bracketRef.current.lookAt(state.camera.position);
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

    // Bracket pulse: gentle breathing + boost when planet's scan band fires.
    // Bars opacity follows the same 0→1 phase as the planet pulse, attenuated.
    if (
      bracketBarsMatRef.current &&
      bracketCornerMatRef.current &&
      bracketHaloMatRef.current
    ) {
      const breathing = 0.5 + 0.5 * Math.sin(t * 1.2);
      // Boost during the planet pulse window (phase in [0,1])
      const pulseBoost = phase <= 1.0 ? Math.sin(phase * Math.PI) : 0;
      const focusBoost = hovered && isFocused ? 0.18 : isFocused ? 0.08 : 0;
      bracketBarsMatRef.current.opacity =
        0.85 + 0.08 * breathing + 0.25 * pulseBoost + focusBoost;
      bracketCornerMatRef.current.opacity =
        0.7 + 0.15 * breathing + 0.35 * pulseBoost + focusBoost;
      bracketHaloMatRef.current.opacity =
        0.18 + 0.07 * breathing + 0.25 * pulseBoost + focusBoost * 0.5;
    }

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
      {/* Halo extérieur gris froid — atmosphère lunaire */}
      <mesh scale={1.18}>
        <sphereGeometry args={[PLANET_RADIUS, 32, 32]} />
        <meshBasicMaterial
          color="#9DA3AE"
          transparent
          opacity={0.07}
          side={THREE.BackSide}
          toneMapped={false}
        />
      </mesh>
      <mesh scale={1.08}>
        <sphereGeometry args={[PLANET_RADIUS, 32, 32]} />
        <meshBasicMaterial
          color="#C8CCD3"
          transparent
          opacity={0.12}
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

      {/* Logo Levels — bracket "L" : reprise fidèle du mark CSS du landing
          (.landingLogo ::before + ::after) en version 3D émissive.
          Gradient blanc→gris par vertex colors (90% → 45% de luminosité du
          coin vers l'extrémité), additive blending pour effet "scellé en
          incandescence" sur la surface noire. Le coin porte une petite
          étincelle (disc) et un halo doux pour ancrer le logo. */}
      <group ref={bracketRef}>
        {/* corner offset so the L's visual bbox is centered on origin.
            Corner sits at local (0, 0) of this inner group ; bars extend
            +X (right) and -Y (down). */}
        <group position={[-BRACKET_BAR_LENGTH / 2, BRACKET_BAR_LENGTH / 2, 0]}>
          {/* halo doux derrière l'angle pour ancrer le logo */}
          <mesh position={[BRACKET_BAR_LENGTH / 2, -BRACKET_BAR_LENGTH / 2, -0.004]}>
            <circleGeometry args={[BRACKET_BAR_LENGTH * 0.72, 32]} />
            <meshBasicMaterial
              ref={bracketHaloMatRef}
              color="#C8CCD3"
              transparent
              opacity={0.22}
              toneMapped={false}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
          {/* barre horizontale (haut) — corner at -X local, far end at +X */}
          <mesh
            geometry={BRACKET_H_GEOM}
            position={[BRACKET_BAR_LENGTH / 2, -BRACKET_BAR_THICK / 2, 0]}
          >
            <meshBasicMaterial
              ref={bracketBarsMatRef}
              color="#EEF2F7"
              vertexColors
              transparent
              opacity={0.92}
              toneMapped={false}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
          {/* barre verticale (gauche) — corner at +Y local, far end at -Y */}
          <mesh
            geometry={BRACKET_V_GEOM}
            position={[BRACKET_BAR_THICK / 2, -BRACKET_BAR_LENGTH / 2, 0]}
          >
            <meshBasicMaterial
              color="#EEF2F7"
              vertexColors
              transparent
              opacity={0.92}
              toneMapped={false}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
          {/* étincelle au coin (intersection des deux barres) */}
          <mesh
            geometry={BRACKET_CORNER_GEOM}
            position={[BRACKET_BAR_THICK / 2, -BRACKET_BAR_THICK / 2, 0.002]}
          >
            <meshBasicMaterial
              ref={bracketCornerMatRef}
              color="#FFFFFF"
              transparent
              opacity={0.85}
              toneMapped={false}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        </group>
      </group>

      {/* Particules grises argentées qui flottent autour (poussière) —
          density et vitesse boostées pour qu'elles soient présentes
          immédiatement à l'arrivée sur la planète. */}
      {!isLow && (
        <Sparkles
          count={48}
          scale={[3.0, 3.0, 3.0]}
          size={2.4}
          speed={0.9}
          opacity={0.85}
          color="#D8DCE2"
          noise={1.2}
        />
      )}
    </group>
  );
}
