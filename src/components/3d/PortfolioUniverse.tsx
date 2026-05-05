"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Stars, Html, Line } from "@react-three/drei";
import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import {
  projects,
  softSkills,
  profile,
  hobbies,
  stack,
  starProject,
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
// Star definitions per planet
// ---------------------------------------------------------------------------
const INFO_STARS = [
  { id: "cv", label: "parcours", icon: "▲" },
  { id: "stack", label: "stack", icon: "◆" },
  { id: "languages", label: "langues", icon: "✦" },
  { id: "hobbies", label: "orbites", icon: "○" },
  { id: "contact", label: "contact", icon: "@" },
];

const PLANET_INFO: Record<string, string[]> = {
  levels: ["cv", "stack"],
  energizer: ["stack", "languages"],
  mirakl: ["contact", "hobbies"],
  "music-agency": ["hobbies", "cv"],
  thelook: ["languages", "stack"],
};

interface StarDef {
  id: string;
  label: string;
  icon: string;
  type: "soft" | "info";
  data?: unknown;
}

function getStarsForPlanet(slug: string): StarDef[] {
  const softForPlanet = softSkills
    .filter((s) => s.linkedProjectSlugs.includes(slug))
    .slice(0, 2)
    .map((s) => ({
      id: `soft:${s.slug}`,
      label: s.label,
      icon: "✦",
      type: "soft" as const,
      data: s,
    }));

  const infoIds = PLANET_INFO[slug] ?? ["cv", "stack"];
  const infoStars = infoIds.map((iid) => {
    const def = INFO_STARS.find((s) => s.id === iid) ?? INFO_STARS[0];
    return {
      id: `info:${iid}`,
      label: def.label,
      icon: def.icon,
      type: "info" as const,
      data: iid,
    };
  });

  return [...softForPlanet, ...infoStars];
}

// ---------------------------------------------------------------------------
// Card components (HTML overlays inside drei <Html>)
// ---------------------------------------------------------------------------
function CloseBtn({ onClose }: { onClose: () => void }) {
  return (
    <button
      onClick={onClose}
      className="absolute top-2 right-2 w-5 h-5 flex items-center justify-center text-text-muted hover:text-text transition text-xs"
      aria-label="Fermer"
    >
      ×
    </button>
  );
}

function SoftSkillCard({ skillSlug, onClose }: { skillSlug: string; onClose: () => void }) {
  const skill = softSkills.find((s) => s.slug === skillSlug);
  if (!skill) return null;
  return (
    <div className="relative bg-[#07080A]/95 backdrop-blur border border-[#1F2521] rounded-md p-4 max-w-[240px] text-[#ECE6D6]">
      <CloseBtn onClose={onClose} />
      <p className="mono uppercase tracking-[0.25em] text-[9px] text-[#6B6660] mb-1">{skill.label}</p>
      <p className="font-[var(--font-serif)] italic text-sm leading-relaxed">&ldquo;{skill.quote}&rdquo;</p>
    </div>
  );
}

function CvCard({ onClose }: { onClose: () => void }) {
  return (
    <div className="relative bg-[#07080A]/95 backdrop-blur border border-[#1F2521] rounded-md p-4 max-w-[260px] text-[#ECE6D6]">
      <CloseBtn onClose={onClose} />
      <p className="mono uppercase tracking-[0.25em] text-[9px] text-[#6B6660] mb-2">parcours</p>
      <p className="text-xs mb-1">{profile.cvCurrent}</p>
      <p className="text-xs text-[#6B6660] mb-1">{profile.cvPrevious}</p>
      <p className="text-xs text-[#6B6660] mb-3">{profile.formation}</p>
      <a
        href={profile.cvPdf}
        target="_blank"
        rel="noreferrer"
        className="mono uppercase tracking-widest text-[9px] text-[#A4F5C8] hover:underline"
      >
        télécharger CV ↗
      </a>
    </div>
  );
}

function StackCard({ onClose }: { onClose: () => void }) {
  const categories = ["lang", "data", "cloud", "ai", "other"] as const;
  const catLabels: Record<string, string> = {
    lang: "langages",
    data: "data",
    cloud: "cloud",
    ai: "IA",
    other: "outils",
  };
  return (
    <div className="relative bg-[#07080A]/95 backdrop-blur border border-[#1F2521] rounded-md p-4 max-w-[280px] text-[#ECE6D6]">
      <CloseBtn onClose={onClose} />
      <p className="mono uppercase tracking-[0.25em] text-[9px] text-[#6B6660] mb-3">stack</p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        {categories.map((cat) => {
          const items = stack.filter((t) => t.category === cat);
          if (items.length === 0) return null;
          return (
            <div key={cat}>
              <p className="mono uppercase tracking-widest text-[8px] text-[#6B6660] mb-1">{catLabels[cat]}</p>
              <div className="flex flex-col gap-0.5">
                {items.map((t) => (
                  <span key={t.label} className="text-[11px] text-[#ECE6D6]/80">
                    {t.label}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LanguagesCard({ onClose }: { onClose: () => void }) {
  return (
    <div className="relative bg-[#07080A]/95 backdrop-blur border border-[#1F2521] rounded-md p-4 max-w-[220px] text-[#ECE6D6]">
      <CloseBtn onClose={onClose} />
      <p className="mono uppercase tracking-[0.25em] text-[9px] text-[#6B6660] mb-3">langues</p>
      <div className="flex flex-col gap-2">
        {profile.languages.map((lang) => (
          <div key={lang.label} className="flex justify-between items-baseline gap-4">
            <span className="text-sm">{lang.label}</span>
            <span className="mono text-[10px] text-[#6B6660]">{lang.level}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function HobbiesCard({ onClose }: { onClose: () => void }) {
  return (
    <div className="relative bg-[#07080A]/95 backdrop-blur border border-[#1F2521] rounded-md p-4 max-w-[220px] text-[#ECE6D6]">
      <CloseBtn onClose={onClose} />
      <p className="mono uppercase tracking-[0.25em] text-[9px] text-[#6B6660] mb-3">orbites</p>
      <div className="flex flex-col gap-1.5">
        {hobbies.map((h) => (
          <div key={h.label} className="text-sm">
            {h.label}
            {h.detail && <span className="text-[#6B6660] text-xs"> — {h.detail}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

function ContactCard({ onClose }: { onClose: () => void }) {
  return (
    <div className="relative bg-[#07080A]/95 backdrop-blur border border-[#1F2521] rounded-md p-4 max-w-[240px] text-[#ECE6D6]">
      <CloseBtn onClose={onClose} />
      <p className="mono uppercase tracking-[0.25em] text-[9px] text-[#6B6660] mb-3">contact</p>
      <div className="flex flex-col gap-2 text-sm">
        <a href={`mailto:${profile.email}`} className="hover:text-[#A4F5C8] transition truncate">
          {profile.email}
        </a>
        <a href={profile.linkedin} target="_blank" rel="noreferrer" className="hover:text-[#A4F5C8] transition truncate">
          {profile.linkedin}
        </a>
        <a href={profile.github} target="_blank" rel="noreferrer" className="hover:text-[#A4F5C8] transition truncate">
          {profile.github}
        </a>
        <span className="text-[#6B6660]">{profile.phone}</span>
      </div>
    </div>
  );
}

function ProjectDetailCard({ project, onClose }: { project: Project; onClose: () => void }) {
  return (
    <div className="relative bg-[#07080A]/95 backdrop-blur border border-[#1F2521] rounded-md p-4 max-w-[280px] text-[#ECE6D6]">
      <CloseBtn onClose={onClose} />
      <p className="mono uppercase tracking-[0.25em] text-[9px] text-[#6B6660] mb-1">
        chapitre {project.chapter}
      </p>
      <h3 className="font-[var(--font-serif)] italic text-xl leading-tight mb-1">{project.title}</h3>
      {project.role && (
        <p className="mono text-[10px] text-[#A4F5C8] uppercase tracking-widest mb-2">{project.role}</p>
      )}
      <p className="text-xs text-[#ECE6D6]/70 mb-3 leading-relaxed line-clamp-4">{project.pitch}</p>
      <ul className="mb-3 flex flex-col gap-1">
        {project.achievements.slice(0, 3).map((a) => (
          <li key={a} className="text-xs text-[#ECE6D6]/60 flex gap-1.5">
            <span className="text-[#A4F5C8] shrink-0">—</span>
            <span className="line-clamp-2">{a}</span>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-1">
        {project.stack.slice(0, 4).map((t) => (
          <TechPill key={t} label={t} />
        ))}
      </div>
      {(project.liveUrl || project.repoUrl) && (
        <div className="mt-3 flex gap-3">
          {project.liveUrl && (
            <a href={project.liveUrl} target="_blank" rel="noreferrer" className="mono text-[9px] uppercase tracking-widest text-[#A4F5C8] hover:underline">
              live ↗
            </a>
          )}
          {project.repoUrl && (
            <a href={project.repoUrl} target="_blank" rel="noreferrer" className="mono text-[9px] uppercase tracking-widest text-[#A4F5C8] hover:underline">
              repo ↗
            </a>
          )}
        </div>
      )}
    </div>
  );
}

function StarProjectCard({ onClose }: { onClose: () => void }) {
  return (
    <div className="relative bg-[#07080A]/95 backdrop-blur border border-[#A4F5C8]/20 rounded-md p-4 max-w-[280px] text-[#ECE6D6]">
      <CloseBtn onClose={onClose} />
      <p className="mono uppercase tracking-[0.25em] text-[9px] text-[#A4F5C8]/60 mb-1">étoile fixe</p>
      <h3 className="font-[var(--font-serif)] italic text-xl leading-tight mb-1 text-[#A4F5C8]">
        {starProject.title}
      </h3>
      <p className="text-xs text-[#ECE6D6]/70 mb-3 leading-relaxed">{starProject.pitch}</p>
      <ul className="mb-3 flex flex-col gap-1">
        {starProject.achievements.slice(0, 3).map((a) => (
          <li key={a} className="text-xs text-[#ECE6D6]/60 flex gap-1.5">
            <span className="text-[#A4F5C8] shrink-0">—</span>
            <span className="line-clamp-2">{a}</span>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-1">
        {starProject.stack.slice(0, 4).map((t) => (
          <TechPill key={t} label={t} />
        ))}
      </div>
      {starProject.repoUrl && (
        <a
          href={starProject.repoUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-block mono text-[9px] uppercase tracking-widest text-[#A4F5C8] hover:underline"
        >
          repo ↗
        </a>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inline card dispatcher (inside Html)
// ---------------------------------------------------------------------------
function StarCard({ starId, onClose }: { starId: string; onClose: () => void }) {
  if (starId === "openclaw") return <StarProjectCard onClose={onClose} />;

  const [type, value] = starId.split(":");
  if (type === "soft") return <SoftSkillCard skillSlug={value} onClose={onClose} />;
  if (type === "info") {
    if (value === "cv") return <CvCard onClose={onClose} />;
    if (value === "stack") return <StackCard onClose={onClose} />;
    if (value === "languages") return <LanguagesCard onClose={onClose} />;
    if (value === "hobbies") return <HobbiesCard onClose={onClose} />;
    if (value === "contact") return <ContactCard onClose={onClose} />;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Individual satellite star mesh
// ---------------------------------------------------------------------------
interface SatStarProps {
  position: [number, number, number];
  starId: string;
  label: string;
  icon: string;
  isOpen: boolean;
  onSelect: (id: string) => void;
  onClose: () => void;
}

function SatStar({ position, starId, label, icon, isOpen, onSelect, onClose }: SatStarProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    document.body.style.cursor = hovered ? "pointer" : "auto";
    return () => { document.body.style.cursor = "auto"; };
  }, [hovered]);

  useFrame((_, dt) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += dt * 0.5;
      const targetScale = hovered ? 1.3 : 1.0;
      meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
    }
  });

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
        onPointerOut={() => setHovered(false)}
        onClick={(e) => { e.stopPropagation(); onSelect(starId); }}
      >
        <sphereGeometry args={[0.18, 16, 16]} />
        <meshStandardMaterial
          color="#ECE6D6"
          emissive="#A4F5C8"
          emissiveIntensity={hovered ? 1.2 : 0.6}
          roughness={0.4}
          metalness={0.1}
        />
      </mesh>

      {/* Label below star */}
      <Html center distanceFactor={8} style={{ pointerEvents: "none" }}>
        <span
          style={{
            fontFamily: "var(--font-mono, monospace)",
            fontSize: "9px",
            textTransform: "uppercase",
            letterSpacing: "0.2em",
            color: hovered ? "#A4F5C8" : "#6B6660",
            whiteSpace: "nowrap",
            marginTop: "18px",
            display: "block",
            transition: "color 0.2s",
          }}
        >
          {icon} {label}
        </span>
      </Html>

      {/* Info card when open */}
      {isOpen && (
        <Html
          center
          distanceFactor={5}
          transform={false}
          style={{ pointerEvents: "auto" }}
          zIndexRange={[100, 200]}
        >
          <StarCard starId={starId} onClose={onClose} />
        </Html>
      )}
    </group>
  );
}

// ---------------------------------------------------------------------------
// Planet mesh
// ---------------------------------------------------------------------------
interface PlanetMeshProps {
  project: Project;
  posX: number;
  isFocused: boolean;
  openStar: string | null;
  openPlanet: boolean;
  onSelectStar: (id: string) => void;
  onSelectPlanet: () => void;
  onClosePanels: () => void;
}

function PlanetMesh({
  project,
  posX,
  isFocused,
  openStar,
  openPlanet,
  onSelectStar,
  onSelectPlanet,
  onClosePanels,
}: PlanetMeshProps) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const orbitRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  const stars = getStarsForPlanet(project.slug);
  const N = stars.length;
  const ORBIT_R = 2.5;

  useEffect(() => {
    document.body.style.cursor = hovered && isFocused ? "pointer" : "auto";
    return () => { document.body.style.cursor = "auto"; };
  }, [hovered, isFocused]);

  useFrame((_, dt) => {
    if (!groupRef.current || !meshRef.current) return;

    // Scale lerp
    const targetScale = isFocused ? 1.35 : 1.0;
    const cs = groupRef.current.scale.x;
    const ns = cs + (targetScale - cs) * 0.06;
    groupRef.current.scale.set(ns, ns, ns);

    // Planet self-rotation
    meshRef.current.rotation.y += dt * 0.15;

    // Orbit rotation when focused
    if (orbitRef.current) {
      if (isFocused) {
        orbitRef.current.rotation.y += dt * 0.3;
      }
    }
  });

  const color = PAPER_HEX[project.paperColor] ?? "#ECE6D6";

  return (
    <group ref={groupRef} position={[posX, 0, 0]}>
      {/* Main planet sphere */}
      <mesh
        ref={meshRef}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
        onPointerOut={() => setHovered(false)}
        onClick={(e) => {
          e.stopPropagation();
          if (isFocused) onSelectPlanet();
        }}
      >
        <sphereGeometry args={[1.2, 48, 48]} />
        <meshStandardMaterial
          color={color}
          roughness={0.85}
          metalness={0}
          emissive="#A4F5C8"
          emissiveIntensity={isFocused ? 0.08 : 0}
        />
      </mesh>

      {/* Planet label (always, fades in on focus) */}
      <Html center distanceFactor={10} position={[0, -1.8, 0]} style={{ pointerEvents: "none" }}>
        <div
          style={{
            textAlign: "center",
            opacity: isFocused ? 1 : 0.35,
            transition: "opacity 0.4s",
            pointerEvents: "none",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-mono, monospace)",
              fontSize: "9px",
              textTransform: "uppercase",
              letterSpacing: "0.3em",
              color: "#6B6660",
              marginBottom: "2px",
            }}
          >
            {project.chapter}
          </p>
          <p
            style={{
              fontFamily: "var(--font-serif, Georgia, serif)",
              fontStyle: "italic",
              fontSize: "13px",
              color: isFocused ? "#ECE6D6" : "#6B6660",
              whiteSpace: "nowrap",
            }}
          >
            {project.title}
          </p>
          {isFocused && (
            <p
              style={{
                fontFamily: "var(--font-mono, monospace)",
                fontSize: "8px",
                color: "#A4F5C8",
                marginTop: "4px",
                letterSpacing: "0.2em",
              }}
            >
              clic pour explorer
            </p>
          )}
        </div>
      </Html>

      {/* Project detail card when planet is clicked */}
      {isFocused && openPlanet && (
        <Html
          center
          distanceFactor={4}
          transform={false}
          style={{ pointerEvents: "auto" }}
          zIndexRange={[100, 200]}
          position={[0, 0.5, 0]}
        >
          <ProjectDetailCard project={project} onClose={onClosePanels} />
        </Html>
      )}

      {/* Satellite stars orbit group */}
      {isFocused && (
        <group ref={orbitRef}>
          {stars.map((star, i) => {
            const angle = (i / N) * Math.PI * 2;
            const sx = Math.cos(angle) * ORBIT_R;
            const sy = Math.sin(angle) * 0.3; // slight elevation variation
            const sz = Math.sin(angle) * ORBIT_R;
            return (
              <SatStar
                key={star.id}
                position={[sx, sy, sz]}
                starId={star.id}
                label={star.label}
                icon={star.icon}
                isOpen={openStar === star.id}
                onSelect={onSelectStar}
                onClose={onClosePanels}
              />
            );
          })}
        </group>
      )}
    </group>
  );
}

// ---------------------------------------------------------------------------
// OpenClaw fixed star
// ---------------------------------------------------------------------------
interface OpenClawStarProps {
  isOpen: boolean;
  onSelect: () => void;
  onClose: () => void;
}

function OpenClawStar({ isOpen, onSelect, onClose }: OpenClawStarProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    document.body.style.cursor = hovered ? "pointer" : "auto";
    return () => { document.body.style.cursor = "auto"; };
  }, [hovered]);

  useFrame((_, dt) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += dt * 0.2;
      meshRef.current.rotation.x += dt * 0.1;
    }
  });

  return (
    <group position={[3, 4.5, -3]}>
      <pointLight color="#A4F5C8" intensity={hovered ? 4 : 2} distance={8} decay={2} />
      <mesh
        ref={meshRef}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
        onPointerOut={() => setHovered(false)}
        onClick={(e) => { e.stopPropagation(); onSelect(); }}
      >
        <sphereGeometry args={[0.45, 24, 24]} />
        <meshStandardMaterial
          color="#A4F5C8"
          emissive="#A4F5C8"
          emissiveIntensity={hovered ? 1.4 : 0.9}
          roughness={0.2}
          metalness={0.1}
        />
      </mesh>

      <Html center distanceFactor={8} style={{ pointerEvents: "none" }}>
        <div
          style={{
            textAlign: "center",
            marginTop: "32px",
            opacity: hovered ? 1 : 0.7,
            transition: "opacity 0.2s",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-mono, monospace)",
              fontSize: "8px",
              textTransform: "uppercase",
              letterSpacing: "0.25em",
              color: "#A4F5C8",
              whiteSpace: "nowrap",
            }}
          >
            OpenClaw ✦
          </p>
        </div>
      </Html>

      {isOpen && (
        <Html
          center
          distanceFactor={5}
          transform={false}
          style={{ pointerEvents: "auto" }}
          zIndexRange={[100, 200]}
        >
          <StarProjectCard onClose={onClose} />
        </Html>
      )}
    </group>
  );
}

// ---------------------------------------------------------------------------
// Connecting thread line between planets
// ---------------------------------------------------------------------------
function PlanetConnector() {
  const N = projects.length;
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
  openStar: string | null;
  openPlanet: boolean;
  onSelectStar: (id: string) => void;
  onSelectPlanet: () => void;
  onClosePanels: () => void;
}

function Universe({
  index,
  openStar,
  openPlanet,
  onSelectStar,
  onSelectPlanet,
  onClosePanels,
}: UniverseProps) {
  const { camera } = useThree();
  const camTarget = useRef(new THREE.Vector3(0, 0, 6));
  const lookTarget = useRef(new THREE.Vector3(0, 0, 0));

  useFrame(() => {
    const tx = index * 6 - 12;
    camTarget.current.set(tx, 0, 6);
    lookTarget.current.set(tx, 0, 0);

    (camera as THREE.PerspectiveCamera).position.lerp(camTarget.current, 0.06);
    camera.lookAt(lookTarget.current);
  });

  const [openClawOpen, setOpenClawOpen] = useState(false);

  useEffect(() => {
    if (openStar === "openclaw") setOpenClawOpen(true);
    else setOpenClawOpen(false);
  }, [openStar]);

  return (
    <group>
      <PlanetConnector />

      {projects.map((p, i) => (
        <PlanetMesh
          key={p.slug}
          project={p}
          posX={i * 6 - 12}
          isFocused={i === index}
          openStar={openStar}
          openPlanet={openPlanet}
          onSelectStar={onSelectStar}
          onSelectPlanet={onSelectPlanet}
          onClosePanels={onClosePanels}
        />
      ))}

      <OpenClawStar
        isOpen={openClawOpen}
        onSelect={() => onSelectStar("openclaw")}
        onClose={onClosePanels}
      />
    </group>
  );
}

// ---------------------------------------------------------------------------
// Main exported component
// ---------------------------------------------------------------------------
export function PortfolioUniverse() {
  const [index, setIndex] = useState(0);
  const [openStar, setOpenStar] = useState<string | null>(null);
  const [openPlanet, setOpenPlanet] = useState(false);

  const closePanels = useCallback(() => {
    setOpenStar(null);
    setOpenPlanet(false);
  }, []);

  const next = useCallback(() => {
    setIndex((i) => Math.min(i + 1, projects.length - 1));
    closePanels();
  }, [closePanels]);

  const prev = useCallback(() => {
    setIndex((i) => Math.max(i - 1, 0));
    closePanels();
  }, [closePanels]);

  // Keyboard + wheel navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "Escape") closePanels();
    };

    let lock = false;
    const onWheel = (e: WheelEvent) => {
      if (lock) return;
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
  }, [next, prev, closePanels]);

  // Touch swipe support
  useEffect(() => {
    let touchStartX = 0;
    let touchStartY = 0;
    let swipeLock = false;

    const onTouchStart = (e: TouchEvent) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (swipeLock) return;
      const dx = e.changedTouches[0].clientX - touchStartX;
      const dy = e.changedTouches[0].clientY - touchStartY;
      if (Math.abs(dx) < 30 && Math.abs(dy) < 30) return;
      swipeLock = true;
      setTimeout(() => { swipeLock = false; }, 600);
      // Horizontal swipe takes priority; fall back to vertical
      const delta = Math.abs(dx) > Math.abs(dy) ? dx : dy;
      delta < 0 ? next() : prev();
    };

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [next, prev]);

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

        <Stars radius={50} depth={40} count={1500} factor={3} saturation={0} fade speed={0.5} />

        <Universe
          index={index}
          openStar={openStar}
          openPlanet={openPlanet}
          onSelectStar={setOpenStar}
          onSelectPlanet={() => setOpenPlanet(true)}
          onClosePanels={closePanels}
        />
      </Canvas>

      {/* Header overlay */}
      <header className="absolute top-6 left-6 z-10 pointer-events-none select-none">
        <p className="serif-italic text-text text-3xl">
          aurian<span className="text-thread">.</span>
        </p>
        <p className="mono uppercase tracking-[0.3em] text-[10px] text-text-muted mt-1">
          portfolio — univers
        </p>
      </header>

      {/* Navigation */}
      <nav className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex items-center gap-6 mono uppercase tracking-[0.3em] text-[11px] text-text-muted select-none">
        <button
          onClick={prev}
          className="hover:text-thread transition"
          aria-label="Planète précédente"
        >
          ← précédent
        </button>
        <span className="text-text">
          {String(index + 1).padStart(2, "0")} / 0{projects.length}
        </span>
        <button
          onClick={next}
          className="hover:text-thread transition"
          aria-label="Planète suivante"
        >
          suivant →
        </button>
      </nav>

      <p className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 mono uppercase tracking-[0.3em] text-[9px] text-text-subtle select-none pointer-events-none">
        ← → ou molette pour naviguer · clic étoile pour explorer
      </p>
    </div>
  );
}
