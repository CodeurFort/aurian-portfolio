"use client";

import { useRef, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
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
    </group>
  );
}
