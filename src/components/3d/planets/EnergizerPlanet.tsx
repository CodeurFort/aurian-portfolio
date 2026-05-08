"use client";

import { useRef, useState, useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Line } from "@react-three/drei";
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
    </group>
  );
}
