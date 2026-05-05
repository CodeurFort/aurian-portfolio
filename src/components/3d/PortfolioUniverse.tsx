"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Stars, Line, Sparkles, MeshDistortMaterial, Text, Html } from "@react-three/drei";
import { useEffect, useRef, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import * as THREE from "three";
import {
  projects,
  projectQualities,
  profile,
  hobbies,
  stack,
  type Project,
} from "@/lib/content";
import { TechPill } from "@/components/ui/TechPill";

// ---------------------------------------------------------------------------
// Color mapping
// ---------------------------------------------------------------------------
const PAPER_HEX: Record<string, string> = {
  "paper-cream": "#ECE6D6",
  "paper-mint": "#A8C4B0",
  "paper-ochre": "#B89968",
  "paper-blush": "#C8A99B",
  "paper-stone": "#8E8B83",
};

// ---------------------------------------------------------------------------
// Planet visual variant config
// ---------------------------------------------------------------------------
interface PlanetVariant {
  distort: number;
  speed: number;
  emissiveColor: string;
  emissiveIntensity: number;
  hasRing?: boolean;
  breathe?: boolean;
  angularDistort?: boolean;
  hasMoon?: boolean;
}

const PLANET_VARIANTS: Record<string, PlanetVariant> = {
  levels: {
    distort: 0.08,
    speed: 0.3,
    emissiveColor: "#A4F5C8",
    emissiveIntensity: 0.04,
  },
  energizer: {
    distort: 0.22,
    speed: 0.8,
    emissiveColor: "#A4F5C8",
    emissiveIntensity: 0.08,
  },
  mirakl: {
    distort: 0.12,
    speed: 0.4,
    emissiveColor: "#A4F5C8",
    emissiveIntensity: 0.05,
    hasRing: true,
  },
  "music-agency": {
    distort: 0.15,
    speed: 0.5,
    emissiveColor: "#E5A1B9",
    emissiveIntensity: 0.18,
    breathe: true,
    hasMoon: true,
  },
  thelook: {
    distort: 0.25,
    speed: 0.15,
    emissiveColor: "#A4F5C8",
    emissiveIntensity: 0.05,
    angularDistort: true,
  },
};

// ---------------------------------------------------------------------------
// Open card type discriminator
// ---------------------------------------------------------------------------
type OpenCard =
  | { type: "planet"; project: Project }
  | { type: "quality"; planetSlug: string }
  | { type: "stack"; planetSlug: string }
  | { type: "info"; infoId: string }
  | { type: "identity" };

// ---------------------------------------------------------------------------
// Star definitions per planet
// ---------------------------------------------------------------------------
const INFO_STARS = [
  { id: "cv", label: "Parcours", icon: "▲" },
  { id: "stack", label: "Stack", icon: "◆" },
  { id: "qualites", label: "Qualités", icon: "✦" },
  { id: "languages", label: "Langues", icon: "✧" },
  { id: "hobbies", label: "Orbites", icon: "○" },
  { id: "contact", label: "Contact", icon: "@" },
];

const CHAPTER_LABELS: Record<string, string> = {
  levels: "Chapitre I",
  energizer: "Chapitre II",
  mirakl: "Chapitre III",
  "music-agency": "Exoplanète",
  thelook: "Chapitre V",
};

const ROMAN: Record<string, string> = {
  i: "I", ii: "II", iii: "III", iv: "IV", v: "V",
};

const PLANET_INFO: Record<string, string[]> = {
  levels: ["cv", "stack", "qualites"],
  energizer: ["stack", "qualites", "languages"],
  mirakl: ["cv", "qualites", "contact"],
  "music-agency": ["hobbies", "qualites", "cv"],
  thelook: ["stack", "qualites", "languages"],
};

type StarShape = "cone" | "octa" | "spike" | "tetra" | "sphere" | "box";

interface StarDef {
  id: string;
  label: string;
  icon: string;
  shape: StarShape;
  color: string;
}

const STAR_SHAPES: Record<string, StarShape> = {
  cv: "cone",
  stack: "octa",
  qualites: "spike",
  languages: "tetra",
  hobbies: "sphere",
  contact: "box",
};

// Distinct color per star category — pokemon-badge style
const STAR_COLORS: Record<string, string> = {
  cv: "#E89B5B", // orange — parcours
  stack: "#5B9DE8", // bleu — stack
  qualites: "#B985E5", // violet — qualités
  languages: "#E5A1B9", // rose — langues
  hobbies: "#8BD4A4", // vert — orbites
  contact: "#E8D26A", // jaune — contact
};

const CATEGORY_LABELS: Record<string, string> = {
  cv: "Parcours",
  stack: "Stack",
  qualites: "Qualité contextuelle",
  languages: "Langues",
  hobbies: "Orbites",
  contact: "Contact",
};

function getStarsForPlanet(slug: string): StarDef[] {
  const infoIds = PLANET_INFO[slug] ?? ["cv", "stack", "qualites"];
  return infoIds.map((iid) => {
    const def = INFO_STARS.find((s) => s.id === iid) ?? INFO_STARS[0];
    let id: string;
    if (iid === "qualites") id = `quality:${slug}`;
    else if (iid === "stack") id = `stack:${slug}`;
    else id = `info:${iid}`;
    return {
      id,
      label: def.label,
      icon: def.icon,
      shape: STAR_SHAPES[iid] ?? "octa",
      color: STAR_COLORS[iid] ?? "#ECE6D6",
    };
  });
}

// ---------------------------------------------------------------------------
// Overlay card components (rendered OUTSIDE Canvas)
// ---------------------------------------------------------------------------

function OverlayCloseBtn({ onClose }: { onClose: () => void }) {
  return (
    <button
      onClick={onClose}
      aria-label="Fermer"
      className="absolute top-6 right-6 text-text-muted hover:text-thread transition mono uppercase tracking-[0.3em] text-[10px]"
    >
      Fermer ✕
    </button>
  );
}

function ProjectOverlayCard({ project, onClose }: { project: Project; onClose: () => void }) {
  return (
    <>
      <OverlayCloseBtn onClose={onClose} />
      <header className="mb-10">
        <p className="mono uppercase tracking-[0.3em] text-[11px] text-thread mb-4">
          {CHAPTER_LABELS[project.slug] ?? `Chapitre ${project.chapter}`}.
        </p>
        <h2
          className="serif-display text-text leading-none mb-4"
          style={{ fontSize: "clamp(48px, 7vw, 96px)" }}
        >
          {project.title}
        </h2>
        {project.role && (
          <p className="mono uppercase tracking-widest text-[11px] text-text-muted">
            {project.role}
          </p>
        )}
      </header>
      <p className="serif-italic text-2xl leading-snug text-text mb-10 max-w-2xl">
        {project.pitch}
      </p>
      <div className="grid md:grid-cols-2 gap-12 mb-10">
        <div>
          <p className="mono uppercase tracking-[0.3em] text-[10px] text-text-muted mb-4">Stack</p>
          <div className="flex flex-wrap gap-2">
            {project.stack.map((s) => (
              <TechPill key={s} label={s} />
            ))}
          </div>
        </div>
        <div>
          <p className="mono uppercase tracking-[0.3em] text-[10px] text-text-muted mb-4">
            Accomplissements
          </p>
          <ul className="space-y-3">
            {project.achievements.map((a, i) => (
              <li key={i} className="flex gap-3 text-base text-text leading-snug">
                <span className="text-thread mt-1.5 text-xs shrink-0">●</span>
                <span>{a}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      {(project.liveUrl || project.repoUrl) && (
        <div className="flex gap-6 pt-6 border-t border-hairline">
          {project.liveUrl && (
            <a
              href={project.liveUrl}
              target="_blank"
              rel="noreferrer"
              className="mono uppercase tracking-widest text-[11px] text-thread border-b border-thread hover:opacity-80"
            >
              Voir live →
            </a>
          )}
          {project.repoUrl && (
            <a
              href={project.repoUrl}
              target="_blank"
              rel="noreferrer"
              className="mono uppercase tracking-widest text-[11px] text-text-muted hover:text-thread border-b border-hairline hover:border-thread transition"
            >
              Github →
            </a>
          )}
        </div>
      )}
    </>
  );
}

function QualityOverlayCard({
  planetSlug,
  onClose,
}: {
  planetSlug: string;
  onClose: () => void;
}) {
  const project = projects.find((p) => p.slug === planetSlug);
  const quality = projectQualities[planetSlug];
  if (!project || !quality) return null;
  return (
    <>
      <OverlayCloseBtn onClose={onClose} />
      <header className="mb-10 text-center">
        <p className="mono uppercase tracking-[0.3em] text-[11px] text-thread mb-6">
          Qualité tendue avec « {project.title} »
        </p>
        <h2
          className="serif-display text-text leading-none"
          style={{ fontSize: "clamp(64px, 10vw, 144px)" }}
        >
          {quality.label}<span className="text-thread">.</span>
        </h2>
      </header>
      <p className="serif-italic text-2xl md:text-3xl leading-snug text-text-muted text-center max-w-2xl mx-auto">
        {quality.context}
      </p>
    </>
  );
}

function StackOverlayCard({
  planetSlug,
  onClose,
}: {
  planetSlug: string;
  onClose: () => void;
}) {
  const project = projects.find((p) => p.slug === planetSlug);
  if (!project) return null;
  return (
    <>
      <OverlayCloseBtn onClose={onClose} />
      <header className="mb-10">
        <p className="mono uppercase tracking-[0.3em] text-[11px] text-thread mb-4">
          Stack pertinente · « {project.title} »
        </p>
        <h2
          className="serif-display text-text leading-none"
          style={{ fontSize: "clamp(48px, 7vw, 96px)" }}
        >
          Stack<span className="text-thread">.</span>
        </h2>
      </header>
      <p className="serif-italic text-text-muted text-lg mb-8 max-w-xl">
        Les outils mobilisés sur cette planète. Réunissez les cinq, vous avez
        l'inventaire complet.
      </p>
      <div className="flex flex-wrap gap-2">
        {project.stack.map((s) => (
          <TechPill key={s} label={s} />
        ))}
      </div>
    </>
  );
}

function InfoOverlayCard({ infoId, onClose }: { infoId: string; onClose: () => void }) {
  const titles: Record<string, string> = {
    cv: "Parcours",
    stack: "Stack",
    qualites: "Qualités",
    languages: "Langues",
    hobbies: "Orbites",
    contact: "Contact",
  };

  const categories = ["lang", "data", "cloud", "ai", "other"] as const;
  const catLabels: Record<string, string> = {
    lang: "Langages", data: "Data", cloud: "Cloud", ai: "IA", other: "Outils",
  };

  return (
    <>
      <OverlayCloseBtn onClose={onClose} />
      <header className="mb-12">
        <h2
          className="serif-display text-text leading-none"
          style={{ fontSize: "clamp(40px, 6vw, 80px)" }}
        >
          {titles[infoId] ?? infoId}
        </h2>
      </header>

      {infoId === "cv" && (
        <div className="space-y-6">
          <div>
            <p className="mono uppercase tracking-[0.3em] text-[10px] text-text-muted mb-3">Poste actuel</p>
            <p className="text-lg text-text leading-relaxed">{profile.cvCurrent}</p>
          </div>
          <div>
            <p className="mono uppercase tracking-[0.3em] text-[10px] text-text-muted mb-3">Parcours</p>
            <p className="text-base text-text-muted leading-relaxed">{profile.cvPrevious}</p>
          </div>
          <div>
            <p className="mono uppercase tracking-[0.3em] text-[10px] text-text-muted mb-3">Formation</p>
            <p className="text-base text-text-muted leading-relaxed">{profile.formation}</p>
          </div>
          <div className="pt-6 border-t border-hairline">
            <a
              href={profile.cvPdf}
              target="_blank"
              rel="noreferrer"
              className="mono uppercase tracking-widest text-[11px] text-thread border-b border-thread hover:opacity-80"
            >
              Télécharger CV ↗
            </a>
          </div>
        </div>
      )}

      {infoId === "stack" && (
        <div className="grid md:grid-cols-2 gap-10">
          {categories.map((cat) => {
            const items = stack.filter((t) => t.category === cat);
            if (items.length === 0) return null;
            return (
              <div key={cat}>
                <p className="mono uppercase tracking-[0.3em] text-[10px] text-text-muted mb-4">
                  {catLabels[cat]}
                </p>
                <div className="flex flex-wrap gap-2">
                  {items.map((t) => (
                    <TechPill key={t.label} label={t.label} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {infoId === "languages" && (
        <div className="space-y-6">
          {profile.languages.map((lang) => (
            <div key={lang.label} className="flex justify-between items-baseline border-b border-hairline pb-4">
              <span className="text-xl text-text">{lang.label}</span>
              <span className="mono text-[11px] text-text-muted uppercase tracking-widest">{lang.level}</span>
            </div>
          ))}
        </div>
      )}

      {infoId === "hobbies" && (
        <div className="space-y-4">
          {hobbies.map((h) => (
            <div key={h.label} className="flex gap-3 items-baseline">
              <span className="text-thread text-xs">●</span>
              <span className="text-lg text-text">{h.label}</span>
              {h.detail && <span className="text-text-muted text-base">· {h.detail}</span>}
            </div>
          ))}
        </div>
      )}

      {infoId === "contact" && (
        <div className="space-y-6">
          <a href={`mailto:${profile.email}`} className="block text-xl text-text hover:text-thread transition">
            {profile.email}
          </a>
          <a href={profile.linkedin} target="_blank" rel="noreferrer" className="block text-xl text-text hover:text-thread transition">
            linkedin.com/in/aurian-bingangoye
          </a>
          <a href={profile.github} target="_blank" rel="noreferrer" className="block text-xl text-text hover:text-thread transition">
            github.com/CodeurFort
          </a>
        </div>
      )}
    </>
  );
}

function IdentityOverlayCard({ onClose }: { onClose: () => void }) {
  return (
    <>
      <OverlayCloseBtn onClose={onClose} />
      <header className="mb-10 text-center">
        <p className="mono uppercase tracking-[0.3em] text-[11px] text-thread mb-6">
          Volcanique
        </p>
        <h2
          className="serif-display text-text leading-none"
          style={{ fontSize: "clamp(72px, 11vw, 168px)" }}
        >
          {profile.name}<span className="text-thread">.</span>
        </h2>
        <p className="serif-italic text-text-muted text-xl mt-6 max-w-md mx-auto">
          {profile.tagline}
        </p>
      </header>
      <p className="serif-italic text-xl md:text-2xl leading-snug text-text mb-12 max-w-2xl mx-auto text-center">
        {profile.manifesto}
      </p>
      <div className="grid md:grid-cols-2 gap-8 pt-8 border-t border-hairline">
        <div>
          <p className="mono uppercase tracking-[0.3em] text-[10px] text-text-muted mb-3">Contact</p>
          <a
            href={`mailto:${profile.email}`}
            className="block text-base text-text hover:text-thread transition"
          >
            {profile.email}
          </a>
        </div>
        <div>
          <p className="mono uppercase tracking-[0.3em] text-[10px] text-text-muted mb-3">Liens</p>
          <a
            href={profile.linkedin}
            target="_blank"
            rel="noreferrer"
            className="block text-base text-text hover:text-thread transition mb-1"
          >
            linkedin.com/in/aurian-bingangoye
          </a>
          <a
            href={profile.github}
            target="_blank"
            rel="noreferrer"
            className="block text-base text-text hover:text-thread transition"
          >
            github.com/CodeurFort
          </a>
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Full-screen overlay
// ---------------------------------------------------------------------------
function CardOverlay({
  openCard,
  onClose,
}: {
  openCard: OpenCard | null;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {openCard && (
        <motion.div
          key="overlay-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-50 grid place-items-center bg-paper-deep/80 backdrop-blur-md p-6"
          style={{ backgroundColor: "rgba(7,8,10,0.80)" }}
        >
          <motion.article
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-3xl overflow-y-auto bg-paper-deep/95 border border-hairline rounded-lg p-12 md:p-16 shadow-2xl"
            style={{
              maxHeight: "85vh",
              backgroundColor: "rgba(7,8,10,0.97)",
              borderColor: "#1F2521",
            }}
          >
            {openCard.type === "planet" && (
              <ProjectOverlayCard project={openCard.project} onClose={onClose} />
            )}
            {openCard.type === "quality" && (
              <QualityOverlayCard planetSlug={openCard.planetSlug} onClose={onClose} />
            )}
            {openCard.type === "stack" && (
              <StackOverlayCard planetSlug={openCard.planetSlug} onClose={onClose} />
            )}
            {openCard.type === "info" && (
              <InfoOverlayCard infoId={openCard.infoId} onClose={onClose} />
            )}
            {openCard.type === "identity" && (
              <IdentityOverlayCard onClose={onClose} />
            )}
          </motion.article>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ---------------------------------------------------------------------------
// Individual satellite star mesh
// ---------------------------------------------------------------------------
interface SatStarProps {
  position: [number, number, number];
  starId: string;
  shape: StarShape;
  color: string;
  onSelect: (id: string) => void;
}

function SatStar({ position, starId, shape, color, onSelect }: SatStarProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    document.body.style.cursor = hovered ? "pointer" : "auto";
    return () => {
      document.body.style.cursor = "auto";
    };
  }, [hovered]);

  useFrame((_, dt) => {
    if (meshRef.current) {
      // Each shape spins on its own axis for character
      const r = meshRef.current.rotation;
      switch (shape) {
        case "cone":
          r.y += dt * 0.05;
          break;
        case "octa":
          r.y += dt * 0.08;
          r.x += dt * 0.02;
          break;
        case "spike":
          r.y += dt * 0.12;
          r.z += dt * 0.04;
          break;
        case "tetra":
          r.x += dt * 0.05;
          r.y += dt * 0.04;
          break;
        case "sphere":
          r.y += dt * 0.02;
          break;
        case "box":
          r.x += dt * 0.03;
          r.y += dt * 0.05;
          break;
      }

      const targetScale = hovered ? 1.4 : 1.0;
      meshRef.current.scale.lerp(
        new THREE.Vector3(targetScale, targetScale, targetScale),
        0.1
      );
    }
  });

  // Geometry per category — smaller and singular
  const geometry = (() => {
    switch (shape) {
      case "cone":
        return <coneGeometry args={[0.085, 0.18, 4]} />; // pyramid for cv
      case "octa":
        return <octahedronGeometry args={[0.11, 0]} />; // diamond for stack
      case "spike":
        return <icosahedronGeometry args={[0.10, 0]} />; // crystal for qualités
      case "tetra":
        return <tetrahedronGeometry args={[0.12, 0]} />; // sharp triangle for languages
      case "sphere":
        return <sphereGeometry args={[0.085, 12, 12]} />; // tiny moon for hobbies
      case "box":
        return <boxGeometry args={[0.14, 0.14, 0.14]} />; // cube for contact
    }
  })();

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(starId);
        }}
      >
        {geometry}
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={hovered ? 1.6 : 0.85}
          roughness={0.3}
          metalness={0.2}
          flatShading
        />
      </mesh>
    </group>
  );
}

// ---------------------------------------------------------------------------
// ExoMoon — visual signature for music-agency exoplanet
// ---------------------------------------------------------------------------
function ExoMoon() {
  const groupRef = useRef<THREE.Group>(null);
  const moonRef = useRef<THREE.Mesh>(null);

  useFrame((_, dt) => {
    if (groupRef.current) groupRef.current.rotation.y += dt * 0.45;
    if (moonRef.current) moonRef.current.rotation.y += dt * 0.6;
  });

  return (
    <group ref={groupRef} rotation={[0.4, 0, 0.2]}>
      <mesh ref={moonRef} position={[1.85, 0.2, 0]}>
        <sphereGeometry args={[0.18, 24, 24]} />
        <meshStandardMaterial
          color="#E5A1B9"
          emissive="#E5A1B9"
          emissiveIntensity={0.45}
          roughness={0.6}
          metalness={0.1}
        />
      </mesh>
      {/* Joke annotation that orbits with the moon */}
      <Html
        position={[1.85, 0.55, 0]}
        center
        zIndexRange={[15, 0]}
        style={{ pointerEvents: "none", userSelect: "none" }}
      >
        <span
          style={{
            fontFamily: "var(--font-serif), Georgia, serif",
            fontStyle: "italic",
            fontWeight: 400,
            fontSize: "11px",
            color: "#E5A1B9",
            whiteSpace: "nowrap",
            opacity: 0.85,
            textShadow: "0 0 12px rgba(229,161,185,0.35)",
          }}
        >
          « Bonus track. Juste parce que j&rsquo;aime cette planète. »
        </span>
      </Html>
    </group>
  );
}

// ---------------------------------------------------------------------------
// Planet mesh — variant-driven with MeshDistortMaterial + atmosphere
// ---------------------------------------------------------------------------
interface PlanetMeshProps {
  project: Project;
  posX: number;
  isFocused: boolean;
  onSelectStar: (id: string) => void;
  onSelectPlanet: () => void;
}

function PlanetMesh({
  project,
  posX,
  isFocused,
  onSelectStar,
  onSelectPlanet,
}: PlanetMeshProps) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const atmosphereRef = useRef<THREE.Mesh>(null);
  const orbitRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  const variant = PLANET_VARIANTS[project.slug] ?? PLANET_VARIANTS.levels;
  const stars = getStarsForPlanet(project.slug);
  const N = stars.length;
  const ORBIT_R = 2.5;
  const color = PAPER_HEX[project.paperColor] ?? "#ECE6D6";

  useEffect(() => {
    document.body.style.cursor = hovered && isFocused ? "pointer" : "auto";
    return () => {
      document.body.style.cursor = "auto";
    };
  }, [hovered, isFocused]);

  useFrame((state, dt) => {
    if (!groupRef.current || !meshRef.current) return;

    // Scale lerp (focus)
    const targetScale = isFocused ? 1.35 : 1.0;
    const cs = groupRef.current.scale.x;
    const ns = cs + (targetScale - cs) * 0.06;
    groupRef.current.scale.set(ns, ns, ns);

    // Planet self-rotation
    meshRef.current.rotation.y += dt * 0.15;

    // Breathing scale for music-agency
    if (variant.breathe && meshRef.current) {
      const breath = 1 + Math.sin(state.clock.elapsedTime * 0.5) * 0.04;
      meshRef.current.scale.setScalar(breath);
    }

    // Orbit rotation (slowed to 0.06)
    if (orbitRef.current && isFocused) {
      orbitRef.current.rotation.y += dt * 0.06;
    }
  });

  return (
    <group ref={groupRef} position={[posX, 0, 0]}>
      {/* Atmosphere shell */}
      <mesh ref={atmosphereRef} scale={1.08}>
        <sphereGeometry args={[1.2, 32, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.12}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Main planet sphere with MeshDistortMaterial */}
      <mesh
        ref={meshRef}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
        onClick={(e) => {
          e.stopPropagation();
          if (isFocused) onSelectPlanet();
        }}
      >
        <sphereGeometry args={[1.2, 96, 96]} />
        <MeshDistortMaterial
          color={color}
          roughness={0.85}
          metalness={0}
          distort={variant.distort}
          speed={variant.speed}
          emissive={variant.emissiveColor}
          emissiveIntensity={isFocused ? variant.emissiveIntensity * 2 : variant.emissiveIntensity}
        />
      </mesh>

      {/* Exoplanet moon for Music Agency */}
      {variant.hasMoon && <ExoMoon />}

      {/* Saturn ring for Mirakl */}
      {variant.hasRing && (
        <mesh rotation={[Math.PI / 2.2, 0, 0.2]}>
          <ringGeometry args={[1.5, 1.9, 64]} />
          <meshBasicMaterial
            color={PAPER_HEX["paper-cream"]}
            opacity={0.25}
            transparent
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* Roman numeral under planet, serif font via Html overlay */}
      <Html
        position={[0, -1.95, 0]}
        center
        zIndexRange={[20, 0]}
        style={{ pointerEvents: "none", userSelect: "none" }}
      >
        <span
          style={{
            fontFamily: "var(--font-serif), Georgia, serif",
            fontWeight: 500,
            fontStyle: "italic",
            fontSize: isFocused ? "44px" : "26px",
            letterSpacing: "0.04em",
            color: isFocused ? "#ECE6D6" : "#3A3D38",
            opacity: isFocused ? 1 : 0.55,
            transition: "all 0.4s ease",
            whiteSpace: "nowrap",
            textShadow: isFocused ? "0 0 24px rgba(164,245,200,0.15)" : "none",
          }}
        >
          {ROMAN[project.chapter] ?? project.chapter.toUpperCase()}
        </span>
      </Html>

      {/* Satellite stars orbit group */}
      {isFocused && (
        <group ref={orbitRef}>
          {stars.map((star, i) => {
            const angle = (i / N) * Math.PI * 2;
            const sx = Math.cos(angle) * ORBIT_R;
            const sy = Math.sin(angle) * 0.3;
            const sz = Math.sin(angle) * ORBIT_R;
            return (
              <SatStar
                key={star.id}
                position={[sx, sy, sz]}
                starId={star.id}
                shape={star.shape}
                color={star.color}
                onSelect={onSelectStar}
              />
            );
          })}
        </group>
      )}
    </group>
  );
}

// ---------------------------------------------------------------------------
// IdentityStar — dramatic polar star (Aurian), pinned to camera.x top-center
// ---------------------------------------------------------------------------
interface IdentityStarProps {
  cameraX: number;
  onSelect: () => void;
}

function IdentityStar({ cameraX, onSelect }: IdentityStarProps) {
  const groupRef = useRef<THREE.Group>(null);
  const innerRef = useRef<THREE.Mesh>(null);
  const spikesRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    document.body.style.cursor = hovered ? "pointer" : "auto";
    return () => {
      document.body.style.cursor = "auto";
    };
  }, [hovered]);

  useFrame((_, dt) => {
    if (groupRef.current) {
      // Track camera.x horizontally, stay pinned at top
      groupRef.current.position.x +=
        (cameraX - groupRef.current.position.x) * 0.08;
    }
    if (innerRef.current) {
      innerRef.current.rotation.y += dt * 0.2;
      innerRef.current.rotation.x += dt * 0.05;
    }
    if (spikesRef.current) {
      spikesRef.current.rotation.z += dt * 0.05;
    }
  });

  const spikeMat = (
    <meshStandardMaterial
      color="#F5D6D0"
      emissive="#E55B5B"
      emissiveIntensity={1.5}
      toneMapped={false}
    />
  );

  return (
    <group ref={groupRef} position={[cameraX, 5, -2]}>
      <pointLight color="#E55B5B" intensity={hovered ? 3.5 : 2} distance={10} decay={2} />

      {/* Outer atmosphere halo */}
      <mesh scale={1.4}>
        <sphereGeometry args={[0.9, 32, 32]} />
        <meshBasicMaterial color="#E55B5B" transparent opacity={0.22} side={THREE.BackSide} />
      </mesh>

      {/* Sparkles */}
      <Sparkles count={40} scale={3} size={6} speed={0.3} color="#E55B5B" />

      {/* Inner sphere */}
      <mesh
        ref={innerRef}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
      >
        <sphereGeometry args={[0.9, 32, 32]} />
        <meshStandardMaterial
          color="#F5D6D0"
          emissive="#E55B5B"
          emissiveIntensity={hovered ? 1.8 : 1.3}
          toneMapped={false}
          roughness={0.3}
          metalness={0}
        />
      </mesh>

      {/* Star spikes — 4 elongated boxes at 0/45/90/135 degrees */}
      <group ref={spikesRef}>
        {[0, Math.PI / 4, Math.PI / 2, (3 * Math.PI) / 4].map((rot, i) => (
          <mesh key={i} rotation={[0, 0, rot]}>
            <boxGeometry args={[0.05, 2.2, 0.05]} />
            {spikeMat}
          </mesh>
        ))}
      </group>

      {/* Label */}
      <Text
        position={[0, -1.45, 0]}
        fontSize={0.32}
        color="#E55B5B"
        anchorX="center"
        anchorY="top"
        letterSpacing={0.05}
      >
        Moi
      </Text>
    </group>
  );
}

// ---------------------------------------------------------------------------
// Connecting thread line between planets
// ---------------------------------------------------------------------------
function PlanetConnector() {
  const points = projects.map((_, i) => new THREE.Vector3(i * 6 - 12, 0, 0));
  return (
    <Line
      points={points}
      color="#A4F5C8"
      lineWidth={0.4}
      opacity={0.08}
      transparent
      dashed={false}
    />
  );
}

// ---------------------------------------------------------------------------
// Inner R3F Universe component
// ---------------------------------------------------------------------------
interface UniverseProps {
  index: number;
  onSelectStar: (id: string) => void;
  onSelectPlanet: (project: Project) => void;
}

function Universe({ index, onSelectStar, onSelectPlanet }: UniverseProps) {
  const { camera } = useThree();
  const camTarget = useRef(new THREE.Vector3(0, 0, 6));
  const lookTarget = useRef(new THREE.Vector3(0, 0, 0));
  const [cameraX, setCameraX] = useState(-12);

  useFrame(() => {
    const tx = index * 6 - 12;
    camTarget.current.set(tx, 0, 6);
    lookTarget.current.set(tx, 0, 0);

    // Adaptive lerp : fast for long-distance wraparound (5 -> 1 etc.),
    // smooth for adjacent-planet transitions.
    const distance = Math.abs(
      (camera as THREE.PerspectiveCamera).position.x - tx
    );
    const lerpFactor = distance > 12 ? 0.18 : 0.06;

    (camera as THREE.PerspectiveCamera).position.lerp(camTarget.current, lerpFactor);
    camera.lookAt(lookTarget.current);

    setCameraX((camera as THREE.PerspectiveCamera).position.x);
  });

  return (
    <group>
      <PlanetConnector />

      {projects.map((p, i) => (
        <PlanetMesh
          key={p.slug}
          project={p}
          posX={i * 6 - 12}
          isFocused={i === index}
          onSelectStar={onSelectStar}
          onSelectPlanet={() => onSelectPlanet(p)}
        />
      ))}

      <IdentityStar
        cameraX={cameraX}
        onSelect={() => onSelectStar("identity")}
      />
    </group>
  );
}

// ---------------------------------------------------------------------------
// Typewriter hook — Awkward-style, slow with irregular rhythm
// ---------------------------------------------------------------------------
function useTypewriter(
  text: string,
  options: { min?: number; max?: number; startDelay?: number; pauseChars?: string } = {}
) {
  const { min = 130, max = 240, startDelay = 0, pauseChars = " '" } = options;
  const [out, setOut] = useState("");
  useEffect(() => {
    setOut("");
    let i = 0;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const tick = () => {
      i += 1;
      setOut(text.slice(0, i));
      if (i < text.length) {
        const prev = text[i - 1];
        const variance = min + Math.random() * (max - min);
        // small extra pause after word breaks / apostrophes for hand-typed feel
        const pause = pauseChars.includes(prev) ? 220 : 0;
        timeout = setTimeout(tick, variance + pause);
      }
    };
    timeout = setTimeout(tick, startDelay);
    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [text, min, max, startDelay, pauseChars]);
  return out;
}

// ---------------------------------------------------------------------------
// Intro overlay
// ---------------------------------------------------------------------------
function IntroOverlay({ onDismiss }: { onDismiss: () => void }) {
  const intro = useTypewriter("Aurian", { min: 150, max: 280, startDelay: 500 });
  const title = useTypewriter("Univers", { min: 180, max: 340, startDelay: 2400 });
  const introDone = intro.length >= "Aurian".length;
  const titleDone = title.length >= "Univers".length;

  useEffect(() => {
    const onAny = () => onDismiss();
    window.addEventListener("keydown", onAny);
    window.addEventListener("click", onAny);
    window.addEventListener("wheel", onAny);
    window.addEventListener("touchstart", onAny);
    return () => {
      window.removeEventListener("keydown", onAny);
      window.removeEventListener("click", onAny);
      window.removeEventListener("wheel", onAny);
      window.removeEventListener("touchstart", onAny);
    };
  }, [onDismiss]);

  return (
    <motion.div
      key="intro"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center pointer-events-auto select-none"
      style={{ backgroundColor: "rgba(7,8,10,0.92)", backdropFilter: "blur(4px)" }}
    >
      <p className="serif-italic text-text-muted text-xl mb-10 min-h-[1.5em]">
        {intro}
        {introDone ? (
          <span className="text-thread">.</span>
        ) : (
          <motion.span
            className="inline-block ml-0.5 text-thread"
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 0.55, repeat: Infinity, ease: "linear" }}
          >
            ▍
          </motion.span>
        )}
      </p>

      <h1
        className="serif-display text-text text-center min-h-[1em]"
        style={{ fontSize: "clamp(64px, 12vw, 160px)" }}
      >
        {title}
        {titleDone ? (
          <span className="text-thread">.</span>
        ) : (
          <motion.span
            className="inline-block ml-2 text-thread"
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 0.55, repeat: Infinity, ease: "linear" }}
          >
            ▍
          </motion.span>
        )}
      </h1>

      <AnimatePresence>
        {titleDone && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0.45, 1] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            className="mono uppercase tracking-[0.4em] text-[10px] text-thread mt-12"
          >
            Appuyez sur une touche pour entrer
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Chapter caption (fades in on index change, auto-dismisses)
// ---------------------------------------------------------------------------
function ChapterCaption({ index, visible }: { index: number; visible: boolean }) {
  const project = projects[index];
  const chapterLabel = CHAPTER_LABELS[project.slug] ?? `Chapitre ${project.chapter}`;
  return (
    <AnimatePresence mode="wait">
      {visible && (
        <motion.div
          key={`caption-${index}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 flex flex-col items-center justify-center pointer-events-none z-20"
        >
          <p className="mono uppercase tracking-[0.4em] text-[11px] text-thread mb-3">
            {chapterLabel}
          </p>
          <p className="serif-display text-text" style={{ fontSize: "clamp(40px, 6vw, 80px)" }}>
            {project.title}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ---------------------------------------------------------------------------
// StarLegend — pokemon-badge style legend top-right
// ---------------------------------------------------------------------------
function ShapeIcon({ shape, color }: { shape: StarShape; color: string }) {
  const stroke = color;
  const fill = `${color}33`;
  switch (shape) {
    case "cone":
      // pyramid (triangle)
      return (
        <svg width="18" height="18" viewBox="0 0 18 18">
          <polygon points="9,2 16,15 2,15" fill={fill} stroke={stroke} strokeWidth="1.2" strokeLinejoin="round" />
        </svg>
      );
    case "octa":
      // diamond
      return (
        <svg width="18" height="18" viewBox="0 0 18 18">
          <polygon points="9,2 16,9 9,16 2,9" fill={fill} stroke={stroke} strokeWidth="1.2" strokeLinejoin="round" />
        </svg>
      );
    case "spike":
      // sparkle / 4-point star
      return (
        <svg width="18" height="18" viewBox="0 0 18 18">
          <polygon
            points="9,1 11,7 17,9 11,11 9,17 7,11 1,9 7,7"
            fill={fill}
            stroke={stroke}
            strokeWidth="1.1"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "tetra":
      // triangle pointing up (slimmer)
      return (
        <svg width="18" height="18" viewBox="0 0 18 18">
          <polygon points="9,3 15,15 3,15" fill={fill} stroke={stroke} strokeWidth="1.2" strokeLinejoin="round" />
        </svg>
      );
    case "sphere":
      return (
        <svg width="18" height="18" viewBox="0 0 18 18">
          <circle cx="9" cy="9" r="6" fill={fill} stroke={stroke} strokeWidth="1.2" />
        </svg>
      );
    case "box":
      return (
        <svg width="18" height="18" viewBox="0 0 18 18">
          <rect x="3" y="3" width="12" height="12" fill={fill} stroke={stroke} strokeWidth="1.2" strokeLinejoin="round" />
        </svg>
      );
  }
}

function StarLegend() {
  const order: { id: string; shape: StarShape }[] = [
    { id: "cv", shape: "cone" },
    { id: "stack", shape: "octa" },
    { id: "qualites", shape: "spike" },
    { id: "languages", shape: "tetra" },
    { id: "hobbies", shape: "sphere" },
    { id: "contact", shape: "box" },
  ];
  return (
    <motion.aside
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.4, duration: 0.7 }}
      aria-label="légende des étoiles"
      className="absolute top-6 right-6 z-10 select-none pointer-events-none"
      style={{
        backgroundColor: "rgba(7,8,10,0.72)",
        borderColor: "#1F2521",
        backdropFilter: "blur(6px)",
      }}
    >
      <div className="border rounded-md px-4 py-3.5" style={{ borderColor: "#1F2521" }}>
        <p className="mono uppercase tracking-[0.3em] text-[9px] text-text-subtle mb-3">
          Étoiles
        </p>
        <ul className="space-y-2">
          {order.map(({ id, shape }) => (
            <li key={id} className="flex items-center gap-2.5">
              <span className="shrink-0 grid place-items-center" style={{ width: 18, height: 18 }}>
                <ShapeIcon shape={shape} color={STAR_COLORS[id]} />
              </span>
              <span className="mono uppercase tracking-[0.18em] text-[10px] text-text-muted">
                {CATEGORY_LABELS[id]}
              </span>
            </li>
          ))}
          <li className="flex items-center gap-2.5 pt-2 mt-1 border-t" style={{ borderColor: "#1F2521" }}>
            <span className="shrink-0 grid place-items-center" style={{ width: 18, height: 18 }}>
              <svg width="18" height="18" viewBox="0 0 18 18">
                <polygon
                  points="9,1 11,7 17,9 11,11 9,17 7,11 1,9 7,7"
                  fill="#E55B5B33"
                  stroke="#E55B5B"
                  strokeWidth="1.1"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <span className="mono uppercase tracking-[0.18em] text-[10px] text-text-muted">
              Volcanique
            </span>
          </li>
        </ul>
      </div>
    </motion.aside>
  );
}

// ---------------------------------------------------------------------------
// Main exported component
// ---------------------------------------------------------------------------
export function PortfolioUniverse() {
  const [index, setIndex] = useState(0);
  const [openCard, setOpenCard] = useState<OpenCard | null>(null);
  const [introDismissed, setIntroDismissed] = useState(false);
  const [captionVisible, setCaptionVisible] = useState(false);

  const closeCard = useCallback(() => setOpenCard(null), []);

  const handleSelectStar = useCallback(
    (id: string) => {
      if (id === "identity") {
        setOpenCard({ type: "identity" });
        return;
      }
      const [type, value] = id.split(":");
      if (type === "info") setOpenCard({ type: "info", infoId: value });
      else if (type === "quality") setOpenCard({ type: "quality", planetSlug: value });
      else if (type === "stack") setOpenCard({ type: "stack", planetSlug: value });
    },
    []
  );

  const handleSelectPlanet = useCallback((project: Project) => {
    setOpenCard({ type: "planet", project });
  }, []);

  const goTo = useCallback(
    (newIndex: number) => {
      setIndex(newIndex);
      closeCard();
      // Show chapter caption, hide after 1.5s
      setCaptionVisible(true);
      setTimeout(() => setCaptionVisible(false), 1500);
    },
    [closeCard]
  );

  const next = useCallback(() => {
    goTo((index + 1) % projects.length);
  }, [goTo, index]);

  const prev = useCallback(() => {
    goTo((index - 1 + projects.length) % projects.length);
  }, [goTo, index]);

  // Show initial caption on first load (after intro dismissed)
  useEffect(() => {
    if (introDismissed) {
      setCaptionVisible(true);
      const t = setTimeout(() => setCaptionVisible(false), 1500);
      return () => clearTimeout(t);
    }
  }, [introDismissed]);

  // Keyboard + wheel navigation
  useEffect(() => {
    if (!introDismissed) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "Escape") closeCard();
    };

    let lock = false;
    const onWheel = (e: WheelEvent) => {
      if (lock || openCard) return;
      const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (Math.abs(d) < 25) return;
      lock = true;
      setTimeout(() => { lock = false; }, 600);
      d > 0 ? next() : prev();
    };

    window.addEventListener("keydown", onKey);
    window.addEventListener("wheel", onWheel, { passive: true });
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("wheel", onWheel);
    };
  }, [next, prev, closeCard, introDismissed, openCard]);

  // Touch swipe support
  useEffect(() => {
    if (!introDismissed) return;
    let touchStartX = 0;
    let touchStartY = 0;
    let swipeLock = false;

    const onTouchStart = (e: TouchEvent) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (swipeLock || openCard) return;
      const dx = e.changedTouches[0].clientX - touchStartX;
      const dy = e.changedTouches[0].clientY - touchStartY;
      if (Math.abs(dx) < 30 && Math.abs(dy) < 30) return;
      swipeLock = true;
      setTimeout(() => { swipeLock = false; }, 600);
      const delta = Math.abs(dx) > Math.abs(dy) ? dx : dy;
      delta < 0 ? next() : prev();
    };

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [next, prev, introDismissed, openCard]);

  return (
    <div className="fixed inset-0 w-full h-full">
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [-12, 0, 6], fov: 55 }}
        gl={{ antialias: true }}
      >
        <color attach="background" args={["#07080A"]} />
        <fog attach="fog" args={["#07080A", 12, 28]} />

        <ambientLight intensity={0.35} />
        <directionalLight position={[5, 6, 5]} intensity={1.0} color="#f5efdf" />
        <directionalLight position={[-4, -2, -5]} intensity={0.25} color="#a8c4b0" />

        <Stars radius={50} depth={40} count={1500} factor={3} saturation={0} fade speed={0.3} />

        {introDismissed && (
          <Universe
            index={index}
            onSelectStar={handleSelectStar}
            onSelectPlanet={handleSelectPlanet}
          />
        )}
      </Canvas>

      {/* Header overlay */}
      <header className="absolute top-6 left-6 z-10 pointer-events-none select-none">
        <p className="serif-italic text-text text-3xl">
          Aurian<span className="text-thread">.</span>
        </p>
        <p className="mono uppercase tracking-[0.3em] text-[10px] text-text-muted mt-1">
          Portfolio · Observatoire
        </p>
      </header>

      {/* Star legend (top right, pokemon-badge style) */}
      {introDismissed && <StarLegend />}

      {/* Big animated arrows */}
      {introDismissed && (
        <>
          <motion.button
            onClick={prev}
            aria-label="Planète précédente"
            className="absolute left-4 md:left-10 top-1/2 -translate-y-1/2 z-20 group"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            whileHover={{ scale: 1.18 }}
            whileTap={{ scale: 0.92 }}
          >
            <motion.svg
              width="56"
              height="56"
              viewBox="0 0 56 56"
              fill="none"
              animate={{ x: [0, -6, 0] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
              className="text-text-muted group-hover:text-thread transition-colors"
            >
              <circle cx="28" cy="28" r="27" stroke="currentColor" strokeWidth="0.8" opacity="0.4" />
              <path
                d="M34 16 L20 28 L34 40"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </motion.svg>
          </motion.button>

          <motion.button
            onClick={next}
            aria-label="Planète suivante"
            className="absolute right-4 md:right-10 top-1/2 -translate-y-1/2 z-20 group"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            whileHover={{ scale: 1.18 }}
            whileTap={{ scale: 0.92 }}
          >
            <motion.svg
              width="56"
              height="56"
              viewBox="0 0 56 56"
              fill="none"
              animate={{ x: [0, 6, 0] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
              className="text-text-muted group-hover:text-thread transition-colors"
            >
              <circle cx="28" cy="28" r="27" stroke="currentColor" strokeWidth="0.8" opacity="0.4" />
              <path
                d="M22 16 L36 28 L22 40"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </motion.svg>
          </motion.button>
        </>
      )}

      {/* Chapter caption */}
      {introDismissed && !openCard && (
        <ChapterCaption index={index} visible={captionVisible} />
      )}

      {/* Fullscreen card overlay */}
      <CardOverlay openCard={openCard} onClose={closeCard} />

      {/* Intro overlay */}
      <AnimatePresence>
        {!introDismissed && (
          <IntroOverlay onDismiss={() => setIntroDismissed(true)} />
        )}
      </AnimatePresence>
    </div>
  );
}
