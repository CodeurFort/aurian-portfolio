"use client";

import { useRef, useState, useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { buildTheLookMaterial } from "./TheLookShader";
import { playBlip, playWhoosh, startEruptionRumble } from "@/lib/sound";
import { usePerformanceTier } from "@/lib/usePerformanceTier";

// ---------------------------------------------------------------------------
// Static shared assets (built once at module level)
// ---------------------------------------------------------------------------
const PLANET_RADIUS = 1.1;
const PLANET_GEOM = new THREE.SphereGeometry(PLANET_RADIUS, 96, 96);
const PLANET_MATERIAL = buildTheLookMaterial(PLANET_RADIUS);

// Particules de "datapoints" qui orbitent en colonnes verticales — quelques
// petits points lumineux qui montent/descendent autour de la planète, lisible
// comme des paquets de données qui transitent dans le pipeline.
const DATAPOINT_COUNT = 10;
const DATAPOINT_GEOM = new THREE.SphereGeometry(0.022, 8, 8);

// ---------------------------------------------------------------------------
// TheLook planet — astre stratifié pierre/grès/ocre. 12 strates horizontales
// franches (référence directe aux 12 CTEs SQL), canaux de flux verticaux
// dans le shader, et 10 datapoints orbitant verticalement autour pour
// signifier "pipeline data en circulation". Pas d'arceau (Mirakl), pas de
// satellites (Beyond) : monolithe géologique seul.
// ---------------------------------------------------------------------------
interface TheLookPlanetProps {
  posX: number;
  isFocused: boolean;
  onSelectPlanet: () => void;
}

export function TheLookPlanet({
  posX,
  isFocused,
  onSelectPlanet,
}: TheLookPlanetProps) {
  const tier = usePerformanceTier();
  const isLow = tier === "low";

  const groupRef = useRef<THREE.Group>(null);
  const planetRef = useRef<THREE.Mesh>(null);
  const initializedRef = useRef(false);
  const [hovered, setHovered] = useState(false);

  const clickPhaseRef = useRef<"idle" | "compress" | "explode">("idle");
  const clickTimerRef = useRef(0);

  // Paramètres fixes pour les datapoints — chacun sur une orbite verticale
  // autour de la planète, à une longitude différente, à une vitesse propre.
  // Le mouvement est essentiellement vertical (haut→bas ou bas→haut), comme
  // un flux dans une colonne du pipeline.
  const datapointParams = useMemo(
    () =>
      Array.from({ length: DATAPOINT_COUNT }, (_, i) => {
        const lon = (i / DATAPOINT_COUNT) * Math.PI * 2;
        return {
          lon,
          radius: PLANET_RADIUS + 0.2 + Math.random() * 0.15,
          speed: 0.4 + Math.random() * 0.4,
          phase: Math.random() * Math.PI * 2,
          // Direction : alternance haut↘bas / bas↗haut.
          direction: i % 2 === 0 ? 1 : -1,
        };
      }),
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

    // Rotation très lente autour de Y — assez lente pour ne pas casser
    // la lecture des strates (qui sont la signature visuelle).
    if (planetRef.current) {
      planetRef.current.rotation.y += dt * 0.04;
    }

    // Shader uniforms.
    PLANET_MATERIAL.uniforms.uTime.value = t;
    PLANET_MATERIAL.uniforms.uIntensity.value =
      hovered && isFocused ? 1.0 : isFocused ? 0.92 : 0.82;

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
        PLANET_MATERIAL.uniforms.uIntensity.value = 1.2;
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
      {/* Halo extérieur chaud — atmosphère poussiéreuse autour de l'astre */}
      <mesh scale={1.28}>
        <sphereGeometry args={[PLANET_RADIUS, 32, 32]} />
        <meshBasicMaterial
          color="#D8B88E"
          transparent
          opacity={0.09}
          side={THREE.BackSide}
          toneMapped={false}
          depthWrite={false}
        />
      </mesh>

      {/* Planète stratifiée : sphère shadée avec 12 strates + flux vertical */}
      <mesh
        ref={planetRef}
        geometry={PLANET_GEOM}
        material={PLANET_MATERIAL}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
        onClick={(e) => {
          e.stopPropagation();
          if (!isFocused) return;
          playWhoosh();
          startEruptionRumble();
          onSelectPlanet();
        }}
      />

      {/* Datapoints orbitant verticalement — paquets de données dans le pipeline */}
      {!isLow &&
        datapointParams.map((d, i) => (
          <Datapoint
            key={i}
            lon={d.lon}
            radius={d.radius}
            speed={d.speed}
            phase={d.phase}
            direction={d.direction}
          />
        ))}
    </group>
  );
}

// ---------------------------------------------------------------------------
// Datapoint — petit paquet de données qui circule verticalement autour de
// la planète (pôle ↔ pôle), à longitude fixe pour évoquer une colonne de
// pipeline. Couleur cyan-sage pour matcher uColorFlow du shader.
// ---------------------------------------------------------------------------
interface DatapointProps {
  lon: number;
  radius: number;
  speed: number;
  phase: number;
  direction: number;
}

function Datapoint({ lon, radius, speed, phase, direction }: DatapointProps) {
  const ref = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.MeshBasicMaterial>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    // Position verticale en triangle wave : monte puis redescend
    // (simule un paquet qui parcourt la colonne du pipeline).
    const tri = (((t * speed * direction + phase) % 2.0) + 2.0) % 2.0;
    const yNorm = tri < 1.0 ? 1.0 - 2.0 * tri : -1.0 + 2.0 * (tri - 1.0);
    if (ref.current) {
      const y = yNorm * radius;
      // Le rayon horizontal diminue près des pôles (sphère).
      const horizR = Math.sqrt(Math.max(0, radius * radius - y * y));
      ref.current.position.x = Math.cos(lon) * horizR;
      ref.current.position.z = Math.sin(lon) * horizR;
      ref.current.position.y = y;
    }
    if (matRef.current) {
      // Pulse d'opacité pour un look "donnée vivante".
      const pulse = 0.5 + 0.5 * Math.sin(t * 2.5 + phase * 1.5);
      matRef.current.opacity = 0.5 + pulse * 0.4;
    }
  });

  return (
    <mesh ref={ref} geometry={DATAPOINT_GEOM}>
      <meshBasicMaterial
        ref={matRef}
        color="#9EC8B0"
        transparent
        opacity={0.8}
        toneMapped={false}
      />
    </mesh>
  );
}
