"use client";

import { useRef, useState, useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { buildBeyondCoreMaterial } from "./BeyondShader";
import { playBlip, playWhoosh, startEruptionRumble } from "@/lib/sound";
import { usePerformanceTier } from "@/lib/usePerformanceTier";

// ---------------------------------------------------------------------------
// Static shared assets (built once at module level)
// ---------------------------------------------------------------------------
const CORE_RADIUS = 0.65;
const CORE_GEOM = new THREE.SphereGeometry(CORE_RADIUS, 96, 96);
const CORE_MATERIAL = buildBeyondCoreMaterial();

const AGENT_GEOM = new THREE.SphereGeometry(0.18, 24, 24);

// Configuration des 5 agents — chacun a son orbite, son inclinaison et sa
// fréquence propre (les 5 voix harmoniques du système orchestral Beyond).
// Couleurs blush différenciées : du saumon chaud au rose poudré au crème.
interface AgentConfig {
  radius: number;
  inclination: THREE.Euler;
  speed: number;
  pulseFreq: number;
  phase: number;
  color: string;
}

const AGENT_CONFIGS: AgentConfig[] = [
  {
    radius: 1.25,
    inclination: new THREE.Euler(0, 0, 0),
    speed: 0.45,
    pulseFreq: 1.2,
    phase: 0,
    color: "#FFB8A0", // saumon chaud
  },
  {
    radius: 1.55,
    inclination: new THREE.Euler(Math.PI * 0.18, 0, 0),
    speed: 0.32,
    pulseFreq: 0.85,
    phase: Math.PI * 0.4,
    color: "#E8A8B0", // vieux rose
  },
  {
    radius: 1.85,
    inclination: new THREE.Euler(0, 0, Math.PI * 0.22),
    speed: 0.22,
    pulseFreq: 1.6,
    phase: Math.PI * 0.85,
    color: "#F5C8B5", // pêche poudré
  },
  {
    radius: 1.45,
    inclination: new THREE.Euler(Math.PI * 0.12, Math.PI * 0.2, 0),
    speed: 0.38,
    pulseFreq: 0.95,
    phase: Math.PI * 1.3,
    color: "#FFD0C0", // crème pêche
  },
  {
    radius: 2.0,
    inclination: new THREE.Euler(-Math.PI * 0.15, 0, Math.PI * 0.1),
    speed: 0.18,
    pulseFreq: 0.6,
    phase: Math.PI * 1.7,
    color: "#D89098", // rose-bordeaux doux
  },
];

// ---------------------------------------------------------------------------
// Beyond planet — système orchestral multi-agent : 1 noyau silencieux
// (chef d'orchestre) entouré de 5 satellites qui orbitent et pulsent à
// des fréquences différentes (les 5 voix). Fils subtils entre noyau et
// agents pour signifier la coordination. Palette blush.
// ---------------------------------------------------------------------------
interface BeyondPlanetProps {
  posX: number;
  isFocused: boolean;
  onSelectPlanet: () => void;
}

export function BeyondPlanet({
  posX,
  isFocused,
  onSelectPlanet,
}: BeyondPlanetProps) {
  const tier = usePerformanceTier();
  const isLow = tier === "low";

  const groupRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const initializedRef = useRef(false);
  const [hovered, setHovered] = useState(false);

  const clickPhaseRef = useRef<"idle" | "compress" | "explode">("idle");
  const clickTimerRef = useRef(0);

  // On instancie 5 refs pour les agents (positions + opacité animées en frame).
  const agentRefs = useMemo(
    () =>
      AGENT_CONFIGS.map(() => ({
        meshRef: { current: null as THREE.Mesh | null },
        matRef: { current: null as THREE.MeshStandardMaterial | null },
      })),
    [],
  );

  // Refs pour les lignes de coordination noyau ↔ agent — on update les
  // BufferAttribute positions directement en frame (pas de setState).
  const lineRefs = useMemo(
    () =>
      AGENT_CONFIGS.map(() => ({
        ref: { current: null as THREE.Line | null },
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

    // Noyau rocheux — rotation lente uniquement (pas de pulsation
    // émissive : c'est un astre solide, pas un soleil).
    if (coreRef.current) {
      coreRef.current.rotation.y += dt * 0.06;
      coreRef.current.rotation.x += dt * 0.02;
    }
    // Légère respiration de l'éclairage via uIntensity (subtil).
    CORE_MATERIAL.uniforms.uTime.value = t;
    CORE_MATERIAL.uniforms.uIntensity.value =
      hovered && isFocused ? 1.1 : isFocused ? 1.0 : 0.92;

    // 5 agents — chacun sur son orbite avec sa fréquence propre.
    AGENT_CONFIGS.forEach((cfg, i) => {
      const m = agentRefs[i].meshRef.current;
      const mat = agentRefs[i].matRef.current;
      if (!m) return;

      // Position orbitale : on calcule dans le plan local, puis on applique
      // l'inclinaison via une matrice de rotation.
      const a = cfg.phase + t * cfg.speed;
      const x = Math.cos(a) * cfg.radius;
      const z = Math.sin(a) * cfg.radius;
      const local = new THREE.Vector3(x, 0, z);
      const eul = cfg.inclination;
      local.applyEuler(eul);
      m.position.copy(local);

      // Pulse de l'agent — taille et émissivité.
      const pulse = 0.5 + 0.5 * Math.sin(t * cfg.pulseFreq + cfg.phase);
      const sc = 0.85 + pulse * 0.35;
      m.scale.setScalar(sc);
      if (mat) {
        mat.emissiveIntensity = 0.8 + pulse * 0.6;
      }

      // Met à jour la BufferGeometry de la ligne noyau ↔ agent in-place
      // (pas de setState — on touche directement l'attribut position).
      const line = lineRefs[i].ref.current;
      if (line) {
        const geom = line.geometry as THREE.BufferGeometry;
        const pos = geom.getAttribute("position") as THREE.BufferAttribute;
        pos.setXYZ(0, 0, 0, 0);
        pos.setXYZ(1, local.x, local.y, local.z);
        pos.needsUpdate = true;
      }
    });

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
        CORE_MATERIAL.uniforms.uIntensity.value = 1.4;
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
      {/* Halo blush — atmosphère collective autour du système */}
      <mesh scale={2.4}>
        <sphereGeometry args={[CORE_RADIUS, 32, 32]} />
        <meshBasicMaterial
          color="#E8A8B0"
          transparent
          opacity={0.06}
          side={THREE.BackSide}
          toneMapped={false}
          depthWrite={false}
        />
      </mesh>

      {/* Noyau rocheux cratéré — astre solide blush, pas un soleil
          (différenciation claire vs Mirakl gas giant et autres planètes
          émissives). Shader custom avec craters + terminator. */}
      <mesh
        ref={coreRef}
        geometry={CORE_GEOM}
        material={CORE_MATERIAL}
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

      {/* 5 agents satellites — chacun avec sa couleur blush et son rythme */}
      {AGENT_CONFIGS.map((cfg, i) => (
        <mesh
          key={`agent-${i}`}
          ref={(el) => {
            agentRefs[i].meshRef.current = el;
          }}
          geometry={AGENT_GEOM}
        >
          <meshStandardMaterial
            ref={(el) => {
              agentRefs[i].matRef.current = el;
            }}
            color={cfg.color}
            emissive={cfg.color}
            emissiveIntensity={1.0}
            roughness={0.35}
            metalness={0.1}
            toneMapped={false}
          />
        </mesh>
      ))}

      {/* Fils de coordination noyau ↔ agents — line natif Three avec
          BufferGeometry mise à jour en frame (pas de re-render React). */}
      {!isLow &&
        AGENT_CONFIGS.map((_, i) => (
          <CoordinationLine
            key={`link-${i}`}
            lineRef={lineRefs[i].ref}
          />
        ))}
    </group>
  );
}

// ---------------------------------------------------------------------------
// CoordinationLine — line native Three.js (pas drei <Line>) pour pouvoir
// updater la géométrie sans re-render React.
// ---------------------------------------------------------------------------
interface CoordinationLineProps {
  lineRef: React.MutableRefObject<THREE.Line | null>;
}

function CoordinationLine({ lineRef }: CoordinationLineProps) {
  // BufferGeometry à 2 sommets, créée une fois, mutable.
  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(6), 3),
    );
    return g;
  }, []);

  return (
    <line
      ref={(el) => {
        lineRef.current = el as unknown as THREE.Line;
      }}
      geometry={geom}
    >
      <lineBasicMaterial
        color="#E8A8B0"
        transparent
        opacity={0.22}
        toneMapped={false}
      />
    </line>
  );
}
