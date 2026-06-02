"use client";

import { useRef, useState, useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { buildMiraklShellMaterial } from "./MiraklShader";
import { playBlip, playWhoosh, startEruptionRumble } from "@/lib/sound";
import { usePerformanceTier } from "@/lib/usePerformanceTier";

// ---------------------------------------------------------------------------
// Static shared assets (built once at module level)
// ---------------------------------------------------------------------------
const PLANET_RADIUS = 1.15;
const PLANET_GEOM = new THREE.SphereGeometry(PLANET_RADIUS, 96, 96);
const SHELL_MATERIAL = buildMiraklShellMaterial(PLANET_RADIUS);

// Arceau type Saturne — anneau plat, large, fin, légèrement incliné.
// On utilise une RingGeometry pour avoir une vraie surface (pas un trait).
const RING_INNER = 1.55;
const RING_OUTER = 2.25;
const RING_GEOM = new THREE.RingGeometry(RING_INNER, RING_OUTER, 128);

// Petits cailloux orbitant dans le plan de l'arceau (poussière).
const DUST_COUNT = 14;
const DUST_GEOM = new THREE.SphereGeometry(0.025, 8, 8);

// ---------------------------------------------------------------------------
// Mirakl planet — gaz géante violet/magenta/ocre style Jupiter, bandes
// nuageuses tourbillonnantes, grande tache anti-cyclonique, + 1 arceau
// Saturne-like avec poussière orbitale. Halo violet rosé.
// ---------------------------------------------------------------------------
interface MiraklPlanetProps {
  posX: number;
  isFocused: boolean;
  onSelectPlanet: () => void;
}

export function MiraklPlanet({
  posX,
  isFocused,
  onSelectPlanet,
}: MiraklPlanetProps) {
  const tier = usePerformanceTier();
  const isLow = tier === "low";

  const groupRef = useRef<THREE.Group>(null);
  const planetRef = useRef<THREE.Mesh>(null);
  const ringGroupRef = useRef<THREE.Group>(null);
  const initializedRef = useRef(false);
  const [hovered, setHovered] = useState(false);

  const clickPhaseRef = useRef<"idle" | "compress" | "explode">("idle");
  const clickTimerRef = useRef(0);

  // Phases initiales fixes pour les cailloux de poussière de l'arceau.
  const dustParams = useMemo(
    () =>
      Array.from({ length: DUST_COUNT }, (_, i) => ({
        radius: RING_INNER + Math.random() * (RING_OUTER - RING_INNER),
        phase: (i / DUST_COUNT) * Math.PI * 2 + Math.random() * 0.4,
        speed: 0.18 + Math.random() * 0.12,
      })),
    [],
  );

  useEffect(() => {
    document.body.style.cursor = hovered && isFocused ? "pointer" : "auto";
    if (hovered && isFocused) playBlip();
    return () => {
      document.body.style.cursor = "auto";
    };
  }, [hovered, isFocused]);

  useFrame((state, dt) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;

    // Scale lerp on focus — skip during click animation (parity siblings).
    if (clickPhaseRef.current === "idle") {
      const target = isFocused ? 1.35 : 1.0;
      if (!initializedRef.current) {
        groupRef.current.scale.setScalar(target);
        initializedRef.current = true;
      } else {
        const cs = groupRef.current.scale.x;
        const ns = cs + (target - cs) * 0.06;
        groupRef.current.scale.set(ns, ns, ns);
      }
    }

    // Rotation lente de la gaz géante autour de Y (axe planétaire).
    if (planetRef.current) {
      planetRef.current.rotation.y += dt * 0.05;
    }

    // Shader uniforms : temps + intensité boost au focus / hover.
    // Intensité plafonnée à 1.0 — la sortie est clampée dans le shader pour
    // ne pas alimenter le bloom (qui causait un shimmer sur les voisins).
    SHELL_MATERIAL.uniforms.uTime.value = t;
    SHELL_MATERIAL.uniforms.uIntensity.value =
      hovered && isFocused ? 1.0 : isFocused ? 0.92 : 0.82;

    // L'arceau tourne très lentement avec ses cailloux (le group entier).
    if (ringGroupRef.current) {
      ringGroupRef.current.rotation.z += dt * 0.06;
    }

    // Click animation : compress (200ms) → explode (300ms) → onSelectPlanet.
    if (clickPhaseRef.current !== "idle") {
      clickTimerRef.current += dt;
      if (clickPhaseRef.current === "compress") {
        const p = Math.min(1, clickTimerRef.current / 0.2);
        if (groupRef.current) {
          const cs = (isFocused ? 1.35 : 1.0) * (1.0 - 0.08 * p);
          groupRef.current.scale.setScalar(cs);
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
        SHELL_MATERIAL.uniforms.uIntensity.value = 1.2;
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
      {/* Halo extérieur vert sage / sable — atmosphère gazeuse, palette analogue */}
      <mesh scale={1.22}>
        <sphereGeometry args={[PLANET_RADIUS, 32, 32]} />
        <meshBasicMaterial
          color="#BFD0BC"
          transparent
          opacity={0.1}
          side={THREE.BackSide}
          toneMapped={false}
          depthWrite={false}
        />
      </mesh>
      <mesh scale={1.08}>
        <sphereGeometry args={[PLANET_RADIUS, 32, 32]} />
        <meshBasicMaterial
          color="#C9B583"
          transparent
          opacity={0.07}
          side={THREE.BackSide}
          toneMapped={false}
          depthWrite={false}
        />
      </mesh>

      {/* Gaz géante : sphère shadée avec bandes tourbillonnantes */}
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

      {/* Arceau Saturne-like : un seul anneau plat, incliné, ocre crème.
          depthWrite=false pour éviter le z-fight avec la planète et la
          poussière. */}
      <group ref={ringGroupRef} rotation={[Math.PI * 0.42, 0, Math.PI * 0.08]}>
        <mesh geometry={RING_GEOM} renderOrder={1}>
          <meshBasicMaterial
            color="#D8C896"
            transparent
            opacity={0.55}
            side={THREE.DoubleSide}
            toneMapped={false}
            depthWrite={false}
          />
        </mesh>

        {/* Poussière orbitale dans le plan de l'arceau */}
        {!isLow &&
          dustParams.map((d, i) => (
            <DustMote key={i} radius={d.radius} phase={d.phase} speed={d.speed} />
          ))}
      </group>
    </group>
  );
}

// ---------------------------------------------------------------------------
// DustMote — petit grain de poussière qui circule sur l'arceau.
// ---------------------------------------------------------------------------
interface DustMoteProps {
  radius: number;
  phase: number;
  speed: number;
}

function DustMote({ radius, phase, speed }: DustMoteProps) {
  const ref = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.MeshBasicMaterial>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const a = phase + t * speed;
    if (ref.current) {
      ref.current.position.x = Math.cos(a) * radius;
      ref.current.position.y = Math.sin(a) * radius;
      ref.current.position.z = 0;
    }
    if (matRef.current) {
      const blink = 0.5 + 0.5 * Math.sin(t * 1.5 + phase * 2);
      matRef.current.opacity = 0.4 + blink * 0.4;
    }
  });

  return (
    <mesh ref={ref} geometry={DUST_GEOM}>
      <meshBasicMaterial
        ref={matRef}
        color="#DDD3A8"
        transparent
        opacity={0.7}
        toneMapped={false}
      />
    </mesh>
  );
}
