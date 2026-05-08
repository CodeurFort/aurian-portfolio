"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Stars, Line, Sparkles, MeshDistortMaterial, Text, Html } from "@react-three/drei";
import { useEffect, useRef, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import * as THREE from "three";
import { type Project } from "@/lib/content";
import { useContent, useUi, useLang } from "@/lib/i18n";
import { LangToggle } from "@/components/LangToggle";
import { SocialDock } from "@/components/SocialDock";
import { SoundToggle } from "@/components/SoundToggle";
import {
  initSound,
  playBlip,
  playTap,
  playWhoosh,
  startEruptionRumble,
  stopEruptionRumble,
} from "@/lib/sound";
import { TechPill } from "@/components/ui/TechPill";
import { Chatbot } from "@/components/Chatbot";
import { PlanetTransition, pickVariant } from "@/components/PlanetTransition";
import { PlanetAmbient } from "@/components/PlanetAmbient";
import { EnergizerPlanet } from "./planets/EnergizerPlanet";

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
type UiText = ReturnType<typeof useUi>;

function getInfoStars(ui: UiText) {
  return [
    { id: "cv", label: ui.starParcours, icon: "▲" },
    { id: "stack", label: ui.starStack, icon: "◆" },
    { id: "qualites", label: ui.starQualites, icon: "✦" },
    { id: "languages", label: ui.starLangues, icon: "✧" },
    { id: "hobbies", label: ui.starOrbites, icon: "○" },
    { id: "certs", label: ui.starCerts, icon: "⬡" },
    { id: "contact", label: ui.starContact, icon: "@" },
  ];
}

function getChapterLabel(slug: string, ui: UiText): string {
  const map: Record<string, string> = {
    levels: ui.chapter1,
    energizer: ui.chapter2,
    mirakl: ui.chapter3,
    "music-agency": ui.chapterExo,
    thelook: ui.chapter5,
  };
  return map[slug] ?? "";
}

const PLANET_NUMERAL: Record<string, string> = {
  levels: "I",
  energizer: "II",
  mirakl: "III",
  "music-agency": "?",
  thelook: "V",
};

const PLANET_INFO: Record<string, string[]> = {
  levels: ["cv", "stack", "qualites"],
  energizer: ["stack", "qualites", "languages"],
  mirakl: ["cv", "qualites", "contact"],
  "music-agency": ["hobbies", "qualites", "cv"],
  thelook: ["stack", "qualites", "languages"],
};

type StarShape = "cone" | "octa" | "spike" | "tetra" | "sphere" | "box" | "hex";

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
  certs: "hex",
  contact: "box",
};

// Distinct color per star category — pokemon-badge style
const STAR_COLORS: Record<string, string> = {
  cv: "#E89B5B", // orange — parcours
  stack: "#5B9DE8", // bleu — stack
  qualites: "#B985E5", // violet — qualités
  languages: "#E5A1B9", // rose — langues
  hobbies: "#8BD4A4", // vert — orbites
  certs: "#A4F5C8", // menthe — certifications
  contact: "#E8D26A", // jaune — contact
};

function getCategoryLabels(ui: UiText): Record<string, string> {
  return {
    cv: ui.infoCv,
    stack: ui.infoStack,
    qualites: ui.infoQualites,
    languages: ui.infoLangues,
    hobbies: ui.infoOrbites,
    certs: ui.infoCerts,
    contact: ui.infoContact,
  };
}

function getStarsForPlanet(slug: string, ui: UiText): StarDef[] {
  const infoIds = PLANET_INFO[slug] ?? ["cv", "stack", "qualites"];
  const stars = getInfoStars(ui);
  return infoIds.map((iid) => {
    const def = stars.find((s) => s.id === iid) ?? stars[0];
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
  const ui = useUi();
  return (
    <button
      onClick={onClose}
      aria-label={ui.closeAria}
      className="absolute top-3 right-3 sm:top-6 sm:right-6 text-text-muted hover:text-thread transition mono uppercase tracking-[0.3em] text-[10px]"
    >
      {ui.closeLabel}
    </button>
  );
}

// Minimal SQL syntax highlighter (regex-based, lightweight, no extra deps).
// Token classes are styled via inline color values to avoid Tailwind purge issues.
function highlightSql(code: string): { html: string } {
  const escapeHtml = (s: string) =>
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

  // Process token-by-token to avoid double-highlighting nested matches.
  const tokens: Array<{ kind: string; text: string }> = [];
  const src = code;
  let i = 0;
  const KEYWORDS = new Set([
    "SELECT","FROM","WHERE","WITH","AS","INNER","LEFT","RIGHT","FULL","JOIN","ON",
    "GROUP","BY","ORDER","ASC","DESC","HAVING","LIMIT","DISTINCT","CASE","WHEN","THEN",
    "ELSE","END","AND","OR","NOT","NULL","IS","BETWEEN","IN","DECLARE","DEFAULT","DATE",
    "OVER","PARTITION","ROWS","RANGE","UNBOUNDED","PRECEDING","FOLLOWING","CURRENT","ROW",
  ]);
  const FUNCS = new Set([
    "COUNT","SUM","AVG","MIN","MAX","ROUND","COUNTIF","NULLIF","COALESCE","CAST","SAFE_CAST",
    "FORMAT_DATE","TIMESTAMP_DIFF","DATE_DIFF","DATE","CURRENT_DATE","LAG","LEAD","ROW_NUMBER","RANK","NTILE",
  ]);

  while (i < src.length) {
    const ch = src[i];
    // Line comment
    if (ch === "-" && src[i + 1] === "-") {
      let j = i;
      while (j < src.length && src[j] !== "\n") j++;
      tokens.push({ kind: "comment", text: src.slice(i, j) });
      i = j;
      continue;
    }
    // String literal (single quotes)
    if (ch === "'") {
      let j = i + 1;
      while (j < src.length && src[j] !== "'") j++;
      tokens.push({ kind: "string", text: src.slice(i, j + 1) });
      i = j + 1;
      continue;
    }
    // Backtick identifier (BigQuery table refs)
    if (ch === "`") {
      let j = i + 1;
      while (j < src.length && src[j] !== "`") j++;
      tokens.push({ kind: "ident", text: src.slice(i, j + 1) });
      i = j + 1;
      continue;
    }
    // Number
    if (/[0-9]/.test(ch)) {
      let j = i;
      while (j < src.length && /[0-9.]/.test(src[j])) j++;
      tokens.push({ kind: "number", text: src.slice(i, j) });
      i = j;
      continue;
    }
    // Word (keyword / function / identifier)
    if (/[A-Za-z_]/.test(ch)) {
      let j = i;
      while (j < src.length && /[A-Za-z0-9_]/.test(src[j])) j++;
      const word = src.slice(i, j);
      const upper = word.toUpperCase();
      let kind = "word";
      if (KEYWORDS.has(upper)) kind = "kw";
      else if (FUNCS.has(upper)) kind = "fn";
      tokens.push({ kind, text: word });
      i = j;
      continue;
    }
    // Default: punctuation / whitespace
    let j = i;
    while (
      j < src.length &&
      !/[A-Za-z_0-9'`-]/.test(src[j]) &&
      !(src[j] === "-" && src[j + 1] === "-")
    ) {
      j++;
    }
    if (j === i) j = i + 1;
    tokens.push({ kind: "punct", text: src.slice(i, j) });
    i = j;
  }

  const COLOR: Record<string, string> = {
    comment: "#6B6660",
    string: "#C8A99B",
    ident: "#A8C4B0",
    number: "#E0B760",
    kw: "#A4F5C8",
    fn: "#ECE6D6",
    word: "rgba(236,230,214,0.85)",
    punct: "rgba(236,230,214,0.55)",
  };

  const html = tokens
    .map((t) => {
      const escaped = escapeHtml(t.text);
      const color = COLOR[t.kind] ?? "rgba(236,230,214,0.85)";
      const style = t.kind === "kw" ? "font-weight:600" : "";
      return `<span style="color:${color};${style}">${escaped}</span>`;
    })
    .join("");

  return { html };
}

function SqlViewer({ code }: { code: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const lines = code.split("\n");
  const cteCount = (code.match(/^\w+ AS \(/gm) || []).length;
  const lineCount = lines.length;

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // ignore
    }
  };

  const { html } = highlightSql(code);

  return (
    <div className="mb-10 pt-6 border-t border-hairline">
      <div className="flex items-baseline justify-between mb-3 flex-wrap gap-3">
        <div>
          <p className="mono uppercase tracking-[0.3em] text-[10px] text-text-muted">
            Requête SQL · audit complet
          </p>
          <p className="serif-italic text-text-muted text-sm mt-1">
            {cteCount} CTEs · {lineCount} lignes · BigQuery
          </p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="mono uppercase tracking-widest text-[11px] text-thread border-b border-thread hover:opacity-80 transition"
          >
            {open ? "Masquer" : "Voir la requête"} →
          </button>
          {open && (
            <button
              type="button"
              onClick={onCopy}
              className="mono uppercase tracking-widest text-[11px] text-text-muted hover:text-thread border-b border-hairline hover:border-thread transition"
            >
              {copied ? "Copié" : "Copier"} ◇
            </button>
          )}
        </div>
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="sql-body"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.32, ease: [0.2, 0.8, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div
              className="rounded-md overflow-hidden border border-hairline"
              style={{
                background:
                  "linear-gradient(180deg, rgba(10,12,15,0.95) 0%, rgba(7,8,10,0.98) 100%)",
                boxShadow: "inset 0 0 0 1px rgba(164,245,200,0.06)",
              }}
            >
              <div
                className="overflow-auto"
                style={{
                  maxHeight: "min(540px, 70vh)",
                  fontFamily: "var(--font-mono), ui-monospace, monospace",
                  fontSize: 12,
                  lineHeight: 1.55,
                  padding: "16px 18px",
                }}
              >
                <pre
                  style={{
                    margin: 0,
                    whiteSpace: "pre",
                    color: "rgba(236,230,214,0.85)",
                  }}
                  dangerouslySetInnerHTML={{ __html: html }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ProjectOverlayCard({ project, onClose }: { project: Project; onClose: () => void }) {
  const ui = useUi();
  const basePath = process.env.NEXT_PUBLIC_USE_BASE_PATH === "true" ? "/aurian-portfolio" : "";
  return (
    <>
      <OverlayCloseBtn onClose={onClose} />
      <header className="mb-8 sm:mb-10">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <p className="mono uppercase tracking-[0.3em] text-[11px] text-thread">
            {getChapterLabel(project.slug, ui)}.
          </p>
          {project.status && (
            <span
              className="mono uppercase tracking-widest text-[9px] px-2 py-1 rounded-full"
              style={{
                color: project.status === "ongoing" ? "#A4F5C8" : "rgba(236,230,214,0.7)",
                border: project.status === "ongoing"
                  ? "1px solid rgba(164,245,200,0.4)"
                  : "1px solid rgba(236,230,214,0.25)",
                background: project.status === "ongoing"
                  ? "rgba(164,245,200,0.08)"
                  : "rgba(236,230,214,0.04)",
              }}
            >
              {project.status === "ongoing" ? ui.statusOngoing : ui.statusDone}
            </span>
          )}
        </div>
        <h2
          className="serif-display text-text leading-none mb-2"
          style={{ fontSize: "clamp(34px, 7vw, 96px)" }}
        >
          {project.title}
          {project.subtitle && (
            <span
              className="serif-italic text-text-muted ml-3"
              style={{ fontSize: "0.42em", letterSpacing: "0.01em" }}
            >
              {project.subtitle}
            </span>
          )}
          <span className="text-thread">.</span>
        </h2>
        {project.role && (
          <p className="mono uppercase tracking-widest text-[11px] text-text-muted mt-3">
            {project.role}
          </p>
        )}
      </header>
      <p className="serif-italic text-lg sm:text-2xl leading-snug text-text mb-8 sm:mb-10 max-w-2xl">
        {project.pitch}
      </p>
      <div className="grid md:grid-cols-2 gap-8 md:gap-12 mb-8 sm:mb-10">
        <div>
          <p className="mono uppercase tracking-[0.3em] text-[10px] text-text-muted mb-4">{ui.stackLabel}</p>
          <div className="flex flex-wrap gap-2">
            {project.stack.map((s) => (
              <TechPill key={s} label={s} />
            ))}
          </div>
        </div>
        <div>
          <p className="mono uppercase tracking-[0.3em] text-[10px] text-text-muted mb-4">
            {ui.accomplishments}
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
      {project.moons && project.moons.length > 0 && (
        <div className="mb-10 pt-6 border-t border-hairline">
          <p className="mono uppercase tracking-[0.3em] text-[10px] text-text-muted mb-5">
            {ui.moonsLabel}
          </p>
          <div className="grid md:grid-cols-2 gap-5">
            {project.moons.map((m) => (
              <div
                key={m.name}
                className="border border-hairline rounded-md p-4 hover:border-thread/40 transition-colors"
              >
                <p className="serif-display text-text mb-1" style={{ fontSize: "20px" }}>
                  {m.name}
                </p>
                <p className="serif-italic text-text-muted text-sm mb-3 leading-snug">
                  {m.pitch}
                </p>
                <ul className="space-y-1.5">
                  {m.bullets.map((b, i) => (
                    <li key={i} className="flex gap-2 text-sm text-text leading-snug">
                      <span className="text-thread mt-1.5 text-[8px] shrink-0">●</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
      {project.visuals && project.visuals.length > 0 && (
        <div className="mb-10 pt-6 border-t border-hairline">
          <p className="mono uppercase tracking-[0.3em] text-[10px] text-text-muted mb-5">
            {ui.visualsLabel}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {project.visuals.map((src, i) => (
              <a
                key={i}
                href={`${basePath}${src}`}
                target="_blank"
                rel="noreferrer"
                className="block border border-hairline rounded-md overflow-hidden hover:border-thread/40 transition-colors bg-black/20"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`${basePath}${src}`}
                  alt={`${project.title} ${ui.visualsLabel} ${i + 1}`}
                  className="w-full h-auto block"
                  loading="lazy"
                />
              </a>
            ))}
          </div>
        </div>
      )}
      {project.sqlQuery && <SqlViewer code={project.sqlQuery} />}
      {(project.liveUrl || project.repoUrl || project.pdfUrl) && (
        <div className="flex flex-wrap gap-6 pt-6 border-t border-hairline">
          {project.liveUrl && (
            <a
              href={project.liveUrl}
              target="_blank"
              rel="noreferrer"
              className="mono uppercase tracking-widest text-[11px] text-thread border-b border-thread hover:opacity-80"
            >
              {ui.seeLive}
            </a>
          )}
          {project.repoUrl && (
            <a
              href={project.repoUrl}
              target="_blank"
              rel="noreferrer"
              className="mono uppercase tracking-widest text-[11px] text-text-muted hover:text-thread border-b border-hairline hover:border-thread transition"
            >
              {ui.seeGithub}
            </a>
          )}
          {project.pdfUrl && (
            <a
              href={`${basePath}${project.pdfUrl}`}
              target="_blank"
              rel="noreferrer"
              className="mono uppercase tracking-widest text-[11px] text-text-muted hover:text-thread border-b border-hairline hover:border-thread transition"
            >
              PDF ↗
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
  const ui = useUi();
  const { projects, projectQualities } = useContent();
  const project = projects.find((p) => p.slug === planetSlug);
  const quality = projectQualities[planetSlug];
  if (!project || !quality) return null;
  const [a, b] = quality.qualities;
  return (
    <>
      <OverlayCloseBtn onClose={onClose} />
      <header className="mb-10 text-center">
        <p className="mono uppercase tracking-[0.3em] text-[11px] text-thread mb-6">
          {ui.qualityContext} « {project.title} »
        </p>
        <h2
          className="serif-display text-text leading-none flex flex-wrap items-baseline justify-center gap-x-4 gap-y-2"
          style={{ fontSize: "clamp(40px, 7vw, 96px)" }}
        >
          <span>{a}</span>
          <span className="text-thread serif-italic" style={{ fontSize: "0.7em" }}>×</span>
          <span>{b}<span className="text-thread">.</span></span>
        </h2>
      </header>
      <p className="serif-italic text-xl md:text-2xl leading-snug text-text text-center max-w-2xl mx-auto mb-6">
        {quality.phrase}
      </p>
      <p className="text-base md:text-lg leading-relaxed text-text-muted text-center max-w-2xl mx-auto">
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
  const ui = useUi();
  const { projects } = useContent();
  const project = projects.find((p) => p.slug === planetSlug);
  if (!project) return null;
  return (
    <>
      <OverlayCloseBtn onClose={onClose} />
      <header className="mb-8 sm:mb-10">
        <p className="mono uppercase tracking-[0.3em] text-[11px] text-thread mb-4">
          {ui.stackContext} · « {project.title} »
        </p>
        <h2
          className="serif-display text-text leading-none"
          style={{ fontSize: "clamp(34px, 7vw, 96px)" }}
        >
          {ui.stackLabel}<span className="text-thread">.</span>
        </h2>
      </header>
      <p className="serif-italic text-text-muted text-lg mb-8 max-w-xl">
        {ui.stackSubtitle}
      </p>
      <div className="flex flex-wrap gap-2">
        {project.stack.map((s) => (
          <TechPill key={s} label={s} />
        ))}
      </div>
    </>
  );
}

// Compact mastery bar used to ventilate dense blocks in the legend overlays.
// Animates from 0 → value once on mount, mint accent on a faint mint track.
function MasteryBar({ value, delay = 0 }: { value: number; delay?: number }) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className="flex items-center gap-3 mb-4">
      <div
        className="flex-1 h-[4px] rounded-full overflow-hidden"
        style={{ background: "rgba(164,245,200,0.10)" }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${clamped}%` }}
          transition={{ duration: 0.9, ease: [0.2, 0.8, 0.2, 1], delay }}
          className="h-full"
          style={{
            background: "linear-gradient(90deg, rgba(164,245,200,0.55), #A4F5C8)",
          }}
        />
      </div>
      <span className="mono text-[10px] text-text-muted tracking-widest tabular-nums">
        {clamped}%
      </span>
    </div>
  );
}

function InfoOverlayCard({ infoId, onClose }: { infoId: string; onClose: () => void }) {
  const ui = useUi();
  const { projects, projectQualities, profile, hobbies, stack, stackCategoryLevels, certifications, softSkillBlocks } = useContent();
  const basePath = process.env.NEXT_PUBLIC_USE_BASE_PATH === "true" ? "/aurian-portfolio" : "";
  const titles: Record<string, string> = {
    cv: ui.infoCv,
    stack: ui.infoStack,
    qualites: ui.infoQualites,
    languages: ui.infoLangues,
    hobbies: ui.infoOrbites,
    contact: ui.infoContact,
    certs: ui.infoCerts,
  };

  const categories = ["lang", "data", "cloud", "ai", "other"] as const;
  const catLabels: Record<string, string> = {
    lang: ui.catLang, data: ui.catData, cloud: ui.catCloud, ai: ui.catAi, other: ui.catOther,
  };

  return (
    <>
      <OverlayCloseBtn onClose={onClose} />
      <header className="mb-8 sm:mb-12">
        <h2
          className="serif-display text-text leading-none"
          style={{ fontSize: "clamp(32px, 6vw, 80px)" }}
        >
          {titles[infoId] ?? infoId}
        </h2>
      </header>

      {infoId === "cv" && (
        <div className="space-y-6">
          <div>
            <p className="mono uppercase tracking-[0.3em] text-[10px] text-text-muted mb-3">{ui.cvCurrent}</p>
            <p className="text-lg text-text leading-relaxed">{profile.cvCurrent}</p>
          </div>
          <div>
            <p className="mono uppercase tracking-[0.3em] text-[10px] text-text-muted mb-3">{ui.cvPath}</p>
            <p className="text-base text-text-muted leading-relaxed">{profile.cvPrevious}</p>
          </div>
          <div>
            <p className="mono uppercase tracking-[0.3em] text-[10px] text-text-muted mb-3">{ui.cvFormation}</p>
            <p className="text-base text-text-muted leading-relaxed">{profile.formation}</p>
          </div>
          <div className="pt-6 border-t border-hairline">
            <a
              href={`${process.env.NEXT_PUBLIC_USE_BASE_PATH === "true" ? "/aurian-portfolio" : ""}${profile.cvPdf}`}
              target="_blank"
              rel="noreferrer"
              className="mono uppercase tracking-widest text-[11px] text-thread border-b border-thread hover:opacity-80"
            >
              {ui.cvDownload}
            </a>
          </div>
        </div>
      )}

      {infoId === "stack" && (
        <div className="grid md:grid-cols-2 gap-10">
          {categories.map((cat, i) => {
            const items = stack.filter((t) => t.category === cat);
            if (items.length === 0) return null;
            const level = stackCategoryLevels[cat];
            return (
              <div key={cat}>
                <p className="mono uppercase tracking-[0.3em] text-[10px] text-text-muted mb-3">
                  {catLabels[cat]}
                </p>
                <MasteryBar value={level} delay={i * 0.08} />
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

      {infoId === "qualites" && (
        <div className="space-y-10">
          <p className="serif-italic text-text-muted text-lg max-w-xl">
            {ui.qualitiesIntro}
          </p>
          <div className="space-y-8">
            {projects.map((p) => {
              const q = projectQualities[p.slug];
              if (!q) return null;
              const [qa, qb] = q.qualities;
              return (
                <div
                  key={p.slug}
                  className="pb-7 border-b border-hairline last:border-0"
                >
                  <p className="mono uppercase tracking-[0.3em] text-[10px] text-text-muted mb-2">
                    {getChapterLabel(p.slug, ui) || p.title} · {p.title}
                  </p>
                  <p
                    className="serif-display text-text mb-3 flex flex-wrap items-baseline gap-x-3"
                    style={{ fontSize: "26px" }}
                  >
                    <span>{qa}</span>
                    <span className="text-thread serif-italic" style={{ fontSize: "0.75em" }}>×</span>
                    <span>{qb}<span className="text-thread">.</span></span>
                  </p>
                  <p className="serif-italic text-text text-base leading-snug">
                    {q.phrase}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Soft skills — cross-cutting families */}
          <div className="pt-8 border-t border-hairline">
            <p className="mono uppercase tracking-[0.3em] text-[11px] text-thread mb-2">
              {ui.softSkillsTitle}
            </p>
            <p className="serif-italic text-text-muted text-base max-w-xl mb-6">
              {ui.softSkillsIntro}
            </p>
            <div className="space-y-6">
              {softSkillBlocks.map((b, i) => (
                <div key={b.theme} className="pb-5 border-b border-hairline last:border-0">
                  <p
                    className="serif-display text-text mb-3"
                    style={{ fontSize: "20px" }}
                  >
                    {b.theme}<span className="text-thread">.</span>
                  </p>
                  <MasteryBar value={b.level} delay={i * 0.08} />
                  <div className="flex flex-wrap gap-2 mb-3">
                    {b.qualities.map((q) => (
                      <span
                        key={q}
                        className="mono uppercase tracking-widest text-[10px] px-2.5 py-1 rounded-full"
                        style={{
                          color: "rgba(164,245,200,0.92)",
                          border: "1px solid rgba(164,245,200,0.35)",
                          background: "rgba(164,245,200,0.06)",
                        }}
                      >
                        {q}
                      </span>
                    ))}
                  </div>
                  <p className="serif-italic text-text-muted text-sm leading-snug">
                    {b.context}
                  </p>
                </div>
              ))}
            </div>
          </div>
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

      {infoId === "certs" && (
        <div className="space-y-6">
          <p className="serif-italic text-text-muted text-lg max-w-xl mb-4">
            {ui.certsIntro}
          </p>
          {certifications.map((c) => (
            <div
              key={c.slug}
              className="border-b border-hairline pb-5 last:border-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
            >
              {c.logoUrl && (
                <div
                  className="flex-shrink-0 flex items-center justify-center rounded"
                  style={{
                    width: 56,
                    height: 56,
                    background: "rgba(236,230,214,0.96)",
                    padding: 8,
                  }}
                >
                  <img
                    src={`${basePath}${c.logoUrl}`}
                    alt={`${c.issuer} logo`}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-1">
                  <span
                    className="serif-display text-text"
                    style={{ fontSize: "22px" }}
                  >
                    {c.title}
                  </span>
                  {c.level && (
                    <span className="mono uppercase tracking-widest text-[10px] text-thread">
                      {c.level}
                    </span>
                  )}
                  {c.pending && (
                    <span
                      className="mono uppercase tracking-widest text-[9px] px-2 py-0.5 rounded-full"
                      style={{
                        color: "rgba(236,230,214,0.7)",
                        border: "1px solid rgba(236,230,214,0.25)",
                        background: "rgba(236,230,214,0.04)",
                      }}
                    >
                      {ui.certsPending}
                    </span>
                  )}
                </div>
                <p className="text-sm text-text-muted leading-snug">
                  {c.issuer} · {c.date}
                  {c.score && <span className="text-text"> · {c.score}</span>}
                </p>
              </div>
              {c.pdfUrl && (
                <a
                  href={`${basePath}${c.pdfUrl}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mono uppercase tracking-widest text-[11px] text-thread border-b border-thread hover:opacity-80 self-start sm:self-auto whitespace-nowrap"
                >
                  {ui.certsDownload}
                </a>
              )}
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
  const ui = useUi();
  const { profile } = useContent();
  return (
    <>
      <OverlayCloseBtn onClose={onClose} />
      <header className="mb-8 sm:mb-10 text-center">
        <p className="mono uppercase tracking-[0.3em] text-[11px] text-thread mb-4 sm:mb-6">
          {ui.identityChapter}
        </p>
        <h2
          className="serif-display text-text leading-none"
          style={{ fontSize: "clamp(44px, 11vw, 168px)" }}
        >
          {profile.name}<span className="text-thread">.</span>
        </h2>
        <p className="serif-italic text-text-muted text-base sm:text-xl mt-4 sm:mt-6 max-w-md mx-auto">
          {profile.tagline}
        </p>
      </header>
      <p className="serif-italic text-lg sm:text-xl md:text-2xl leading-snug text-text mb-8 sm:mb-12 max-w-2xl mx-auto text-center">
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
          className="fixed inset-0 z-50 grid place-items-center bg-paper-deep/80 backdrop-blur-md p-3 sm:p-6"
          style={{ backgroundColor: "rgba(7,8,10,0.80)" }}
        >
          <motion.article
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-3xl overflow-y-auto bg-paper-deep/95 border border-hairline rounded-lg p-5 sm:p-10 md:p-16 shadow-2xl"
            style={{
              maxHeight: "92vh",
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
        case "hex":
          r.y += dt * 0.06;
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
      case "hex":
        return <cylinderGeometry args={[0.10, 0.10, 0.08, 6]} />; // hex prism for certs
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
  const { lang } = useLang();
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
          {lang === "fr"
            ? "« Bonus track. Juste parce que j\u2019aime cette planète. »"
            : "\u201CBonus track. Just because I love this planet.\u201D"}
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
  const initializedRef = useRef(false);
  const [hovered, setHovered] = useState(false);

  const ui = useUi();
  const variant = PLANET_VARIANTS[project.slug] ?? PLANET_VARIANTS.levels;
  const stars = getStarsForPlanet(project.slug, ui);
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

    // Scale lerp (focus) — snap to target on first frame to avoid intro zoom
    const targetScale = isFocused ? 1.35 : 1.0;
    if (!initializedRef.current) {
      groupRef.current.scale.setScalar(targetScale);
      initializedRef.current = true;
    } else {
      const cs = groupRef.current.scale.x;
      const ns = cs + (targetScale - cs) * 0.06;
      groupRef.current.scale.set(ns, ns, ns);
    }

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
          {PLANET_NUMERAL[project.slug] ?? project.chapter.toUpperCase()}
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
  eruption?: boolean;
}

function IdentityStar({ cameraX, onSelect, eruption = false }: IdentityStarProps) {
  const { lang } = useLang();
  const groupRef = useRef<THREE.Group>(null);
  const innerRef = useRef<THREE.Mesh>(null);
  const innerMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const spikesRef = useRef<THREE.Group>(null);
  const haloMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const flame1Ref = useRef<THREE.Mesh>(null);
  const flame2Ref = useRef<THREE.Mesh>(null);
  const flame3Ref = useRef<THREE.Mesh>(null);
  const flame4Ref = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    document.body.style.cursor = hovered ? "pointer" : "auto";
    return () => {
      document.body.style.cursor = "auto";
    };
  }, [hovered]);

  useFrame((state, dt) => {
    if (groupRef.current) {
      // Track camera.x horizontally, stay pinned at top
      groupRef.current.position.x +=
        (cameraX - groupRef.current.position.x) * 0.08;
    }
    if (innerRef.current) {
      innerRef.current.rotation.y += dt * (eruption ? 0.5 : 0.2);
      innerRef.current.rotation.x += dt * (eruption ? 0.15 : 0.05);
    }
    if (spikesRef.current) {
      spikesRef.current.rotation.z += dt * (eruption ? 0.18 : 0.05);
    }
    // Eruption: animate halo, light, core pulses
    if (eruption) {
      const t = state.clock.elapsedTime;
      const pulse = 0.5 + 0.5 * Math.sin(t * 4);
      if (haloMatRef.current) {
        haloMatRef.current.opacity = 0.28 + 0.22 * pulse;
      }
      if (lightRef.current) {
        lightRef.current.intensity = (hovered ? 4.5 : 3.2) + pulse * 1.6;
      }
      if (innerMatRef.current) {
        innerMatRef.current.emissiveIntensity =
          (hovered ? 2.4 : 1.8) + pulse * 0.9;
      }
      // Lava flame tongues — rise up then loop
      const flames = [flame1Ref, flame2Ref, flame3Ref, flame4Ref];
      flames.forEach((ref, i) => {
        if (!ref.current) return;
        const phase = (t * 1.8 + i * 0.6) % 1.6;
        const climb = phase / 1.6;
        ref.current.position.y = 0.5 + climb * 1.6;
        const fade = climb < 0.2 ? climb / 0.2 : 1 - (climb - 0.2) / 0.8;
        const mat = ref.current.material as THREE.MeshBasicMaterial;
        mat.opacity = Math.max(0, fade) * 0.85;
        const sc = 0.6 + climb * 0.4;
        ref.current.scale.set(sc * (1 - climb * 0.3), sc, sc * (1 - climb * 0.3));
      });
    }
  });

  // Eruption palette: lava-orange, deep red, gold flecks
  const coreColor = eruption ? "#FFE0A0" : "#F5D6D0";
  const emissiveColor = eruption ? "#FF5828" : "#E55B5B";
  const haloColor = eruption ? "#FF6A2A" : "#E55B5B";
  const labelColor = eruption ? "#FF8A2A" : "#E55B5B";
  const sparkleColor = eruption ? "#FFB84A" : "#E55B5B";

  const spikeMat = (
    <meshStandardMaterial
      color={eruption ? "#FFC07A" : "#F5D6D0"}
      emissive={emissiveColor}
      emissiveIntensity={eruption ? 2.6 : 1.5}
      toneMapped={false}
    />
  );

  return (
    <group ref={groupRef} position={[cameraX, 5, -2]}>
      <pointLight
        ref={lightRef}
        color={emissiveColor}
        intensity={eruption ? 3.5 : hovered ? 3.5 : 2}
        distance={eruption ? 14 : 10}
        decay={2}
      />

      {/* Outer atmosphere halo */}
      <mesh scale={eruption ? 1.7 : 1.4}>
        <sphereGeometry args={[0.9, 32, 32]} />
        <meshBasicMaterial
          ref={haloMatRef}
          color={haloColor}
          transparent
          opacity={eruption ? 0.4 : 0.22}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Sparkles */}
      <Sparkles
        count={eruption ? 80 : 40}
        scale={eruption ? 4 : 3}
        size={eruption ? 9 : 6}
        speed={eruption ? 0.7 : 0.3}
        color={sparkleColor}
      />

      {/* Eruption: rising flame tongues (lava droplets stretched into tear-drops) */}
      {eruption && (
        <>
          <mesh ref={flame1Ref} position={[0, 0.5, 0]}>
            <sphereGeometry args={[0.18, 12, 12]} />
            <meshBasicMaterial color="#FF6A2A" transparent opacity={0} toneMapped={false} />
          </mesh>
          <mesh ref={flame2Ref} position={[0.4, 0.5, 0]}>
            <sphereGeometry args={[0.14, 12, 12]} />
            <meshBasicMaterial color="#FFB44A" transparent opacity={0} toneMapped={false} />
          </mesh>
          <mesh ref={flame3Ref} position={[-0.4, 0.5, 0]}>
            <sphereGeometry args={[0.14, 12, 12]} />
            <meshBasicMaterial color="#FF5828" transparent opacity={0} toneMapped={false} />
          </mesh>
          <mesh ref={flame4Ref} position={[0.15, 0.5, 0.3]}>
            <sphereGeometry args={[0.12, 12, 12]} />
            <meshBasicMaterial color="#FFE08A" transparent opacity={0} toneMapped={false} />
          </mesh>
        </>
      )}

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
          ref={innerMatRef}
          color={coreColor}
          emissive={emissiveColor}
          emissiveIntensity={eruption ? 2.2 : hovered ? 1.8 : 1.3}
          toneMapped={false}
          roughness={eruption ? 0.45 : 0.3}
          metalness={0}
        />
      </mesh>

      {/* Star spikes — 4 elongated boxes at 0/45/90/135 degrees */}
      <group ref={spikesRef}>
        {[0, Math.PI / 4, Math.PI / 2, (3 * Math.PI) / 4].map((rot, i) => (
          <mesh key={i} rotation={[0, 0, rot]}>
            <boxGeometry args={[eruption ? 0.07 : 0.05, eruption ? 2.6 : 2.2, eruption ? 0.07 : 0.05]} />
            {spikeMat}
          </mesh>
        ))}
      </group>

      {/* Label */}
      <Text
        position={[0, -1.45, 0]}
        fontSize={0.32}
        color={labelColor}
        anchorX="center"
        anchorY="top"
        letterSpacing={0.05}
      >
        {lang === "fr" ? "Moi" : "Me"}
      </Text>
    </group>
  );
}

// ---------------------------------------------------------------------------
// Connecting thread line between planets
// ---------------------------------------------------------------------------
function PlanetConnector() {
  const { projects } = useContent();
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
  const { projects } = useContent();
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

      {projects.map((p, i) => {
        if (p.slug === "energizer") {
          return (
            <EnergizerPlanet
              key={p.slug}
              posX={i * 6 - 12}
              isFocused={i === index}
              onSelectPlanet={() => onSelectPlanet(p)}
            />
          );
        }
        return (
          <PlanetMesh
            key={p.slug}
            project={p}
            posX={i * 6 - 12}
            isFocused={i === index}
            onSelectStar={onSelectStar}
            onSelectPlanet={() => onSelectPlanet(p)}
          />
        );
      })}

      <IdentityStar
        cameraX={cameraX}
        onSelect={() => onSelectStar("identity")}
        eruption={index === 3}
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
  const ui = useUi();
  const INTRO = "Aurian";
  const TITLE = ui.worldTitle;
  const intro = useTypewriter(INTRO, { min: 150, max: 280, startDelay: 800 });
  const title = useTypewriter(TITLE, { min: 180, max: 340, startDelay: 2800 });
  const introDone = intro.length >= INTRO.length;
  const titleDone = title.length >= TITLE.length;

  const [isExiting, setIsExiting] = useState(false);
  const triggerExit = useCallback(() => {
    setIsExiting((prev) => {
      if (prev) return prev;
      window.setTimeout(onDismiss, 900);
      return true;
    });
  }, [onDismiss]);

  // Auto-dismiss after a long beat; user can skip with any input after a short delay.
  useEffect(() => {
    const auto = window.setTimeout(triggerExit, 13000);
    const onAny = () => triggerExit();
    const t = window.setTimeout(() => {
      window.addEventListener("keydown", onAny);
      window.addEventListener("click", onAny);
      window.addEventListener("touchstart", onAny);
    }, 1800);
    return () => {
      window.clearTimeout(auto);
      window.clearTimeout(t);
      window.removeEventListener("keydown", onAny);
      window.removeEventListener("click", onAny);
      window.removeEventListener("touchstart", onAny);
    };
  }, [triggerExit]);

  // Jagged tear polygons — the two clip paths share the same zigzag seam at y≈50%
  const TEAR_TOP =
    "polygon(0 0, 100% 0, 100% 50%, 95% 51.6%, 90% 49.2%, 85% 51%, 80% 50.4%, 75% 49.4%, 70% 51.2%, 65% 49%, 60% 50.6%, 55% 49.4%, 50% 51.5%, 45% 49.5%, 40% 51%, 35% 48.8%, 30% 50.6%, 25% 51.1%, 20% 49.4%, 15% 51.4%, 10% 49.6%, 5% 51%, 0 50%)";
  const TEAR_BOTTOM =
    "polygon(0 50%, 5% 51%, 10% 49.6%, 15% 51.4%, 20% 49.4%, 25% 51.1%, 30% 50.6%, 35% 48.8%, 40% 51%, 45% 49.5%, 50% 51.5%, 55% 49.4%, 60% 50.6%, 65% 49%, 70% 51.2%, 75% 49.4%, 80% 50.4%, 85% 51%, 90% 49.2%, 95% 51.6%, 100% 50%, 100% 100%, 0 100%)";

  const BG =
    "radial-gradient(ellipse at center, #0B0D11 0%, #07080A 55%, #050609 100%)";

  const renderInner = (
    <>
      {/* Subtle drifting starfield — pure CSS */}
      <motion.div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ duration: 2.4, ease: "easeOut" }}
        style={{
          backgroundImage:
            "radial-gradient(1px 1px at 14% 22%, rgba(236,230,214,0.55), transparent 50%), \
             radial-gradient(1px 1px at 78% 18%, rgba(236,230,214,0.4), transparent 50%), \
             radial-gradient(1px 1px at 32% 71%, rgba(236,230,214,0.5), transparent 50%), \
             radial-gradient(1px 1px at 64% 84%, rgba(236,230,214,0.35), transparent 50%), \
             radial-gradient(1px 1px at 88% 62%, rgba(236,230,214,0.45), transparent 50%), \
             radial-gradient(1px 1px at 46% 38%, rgba(236,230,214,0.3), transparent 50%), \
             radial-gradient(1px 1px at 8% 58%, rgba(236,230,214,0.4), transparent 50%)",
        }}
      />

      {/* "Aurian." — letter opacity reveals (no width shift) */}
      <p
        className="serif-italic mb-8 relative"
        style={{
          fontSize: "clamp(15px, 1.5vw, 18px)",
          color: "rgba(236,230,214,0.55)",
          letterSpacing: "0.04em",
        }}
      >
        {INTRO.split("").map((c, i) => (
          <span key={i} style={{ opacity: i < intro.length ? 1 : 0, transition: "opacity 0.18s linear" }}>
            {c}
          </span>
        ))}
        <span style={{ opacity: introDone ? 1 : 0, transition: "opacity 0.18s linear" }}>.</span>
      </p>

      {/* "Univers." */}
      <h1
        className="serif-display text-center relative"
        style={{
          fontSize: "clamp(64px, 12vw, 160px)",
          color: "rgba(236,230,214,0.95)",
          letterSpacing: "-0.025em",
          textShadow: "0 0 60px rgba(236,230,214,0.06)",
        }}
      >
        {TITLE.split("").map((c, i) => (
          <span key={i} style={{ opacity: i < title.length ? 1 : 0, transition: "opacity 0.18s linear" }}>
            {c}
          </span>
        ))}
        <span style={{ opacity: titleDone ? 1 : 0, transition: "opacity 0.18s linear" }}>.</span>
      </h1>

      {/* Hint slot */}
      <div className="mt-16 relative" style={{ height: 14, display: "flex", alignItems: "center" }}>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: titleDone && !isExiting ? [0, 1, 0.45, 1] : 0 }}
          transition={
            titleDone && !isExiting
              ? { duration: 1.6, repeat: Infinity, ease: "easeInOut", delay: 0.3 }
              : { duration: 0.2 }
          }
          className="mono uppercase text-thread"
          style={{
            letterSpacing: "0.45em",
            fontSize: "9px",
          }}
        >
          {ui.enter}
        </motion.p>
      </div>
    </>
  );

  const halfClass =
    "fixed inset-0 z-[60] flex flex-col items-center justify-center select-none overflow-hidden";

  return (
    <>
      {/* Top half */}
      <motion.div
        key="intro-top"
        initial={{ opacity: 0, y: 0, rotate: 0 }}
        animate={{
          opacity: 1,
          y: isExiting ? "-110vh" : 0,
          rotate: isExiting ? -1.6 : 0,
        }}
        exit={{ opacity: 0 }}
        transition={
          isExiting
            ? { duration: 0.85, ease: [0.65, 0, 0.35, 1] }
            : { duration: 1.2, ease: "easeOut" }
        }
        className={halfClass}
        style={{
          background: BG,
          clipPath: TEAR_TOP,
          WebkitClipPath: TEAR_TOP,
          pointerEvents: isExiting ? "none" : "auto",
        }}
      >
        {renderInner}
      </motion.div>

      {/* Bottom half */}
      <motion.div
        key="intro-bottom"
        initial={{ opacity: 0, y: 0, rotate: 0 }}
        animate={{
          opacity: 1,
          y: isExiting ? "110vh" : 0,
          rotate: isExiting ? 1.6 : 0,
        }}
        exit={{ opacity: 0 }}
        transition={
          isExiting
            ? { duration: 0.85, ease: [0.65, 0, 0.35, 1] }
            : { duration: 1.2, ease: "easeOut" }
        }
        className={halfClass}
        style={{
          background: BG,
          clipPath: TEAR_BOTTOM,
          WebkitClipPath: TEAR_BOTTOM,
          pointerEvents: isExiting ? "none" : "auto",
        }}
      >
        {renderInner}
      </motion.div>

      {/* White-hot tear flash at the seam */}
      {isExiting && (
        <motion.div
          key="tear-flash"
          initial={{ opacity: 0, scaleY: 0.4 }}
          animate={{ opacity: [0, 1, 0], scaleY: [0.4, 1, 1.6] }}
          transition={{ duration: 0.55, ease: "easeOut", times: [0, 0.18, 1] }}
          className="fixed left-0 right-0 z-[61] pointer-events-none"
          style={{
            top: "calc(50% - 1px)",
            height: 2,
            background: "rgba(236,230,214,0.95)",
            boxShadow:
              "0 0 24px 4px rgba(164,245,200,0.7), 0 0 60px 8px rgba(236,230,214,0.45)",
            transformOrigin: "center",
          }}
        />
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Chapter caption (fades in on index change, auto-dismisses)
// ---------------------------------------------------------------------------
function ChapterCaption({ index, visible }: { index: number; visible: boolean }) {
  const ui = useUi();
  const { projects } = useContent();
  const project = projects[index];
  const chapterLabel = getChapterLabel(project.slug, ui) || project.title;
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
            {project.title}.
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
    case "hex":
      // hexagon — echoes PIX badge shape
      return (
        <svg width="18" height="18" viewBox="0 0 18 18">
          <polygon
            points="9,2 15,5.5 15,12.5 9,16 3,12.5 3,5.5"
            fill={fill}
            stroke={stroke}
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
        </svg>
      );
  }
}

// ---------------------------------------------------------------------------
// LegendFX — overlay animation when legend is clicked
//   • "converge"  : 5 icons fly from spread positions to center (parcours / stack)
//   • "expand"    : 1 icon at center bursts outward into 6 rays (others)
// ---------------------------------------------------------------------------
type FxKind = "converge" | "expand";

interface LegendFXProps {
  kind: FxKind;
  shape: StarShape;
  color: string;
  onComplete: () => void;
}

function LegendFX({ kind, shape, color, onComplete }: LegendFXProps) {
  useEffect(() => {
    const t = setTimeout(onComplete, 780);
    return () => clearTimeout(t);
  }, [onComplete]);

  // Origin offsets in viewport units (vw / vh) for converge: 5 corners-ish
  const convergeOrigins: { x: string; y: string }[] = [
    { x: "-38vw", y: "-30vh" },
    { x: "36vw", y: "-32vh" },
    { x: "-40vw", y: "26vh" },
    { x: "38vw", y: "28vh" },
    { x: "0vw", y: "-38vh" },
  ];

  // Expand directions for 6 rays
  const expandDirs: { x: string; y: string }[] = Array.from({ length: 6 }).map(
    (_, i) => {
      const angle = (i / 6) * Math.PI * 2;
      const r = 38; // vw/vh radius
      return {
        x: `${Math.cos(angle) * r}vw`,
        y: `${Math.sin(angle) * r}vh`,
      };
    }
  );

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-[55] pointer-events-none grid place-items-center"
    >
      {kind === "converge" &&
        convergeOrigins.map((o, i) => (
          <motion.div
            key={i}
            initial={{ x: o.x, y: o.y, scale: 0.75, opacity: 0 }}
            animate={{
              x: "0vw",
              y: "0vh",
              scale: [0.75, 1.2, 0.4],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 0.75,
              ease: [0.7, 0, 0.3, 1],
              times: [0, 0.78, 1],
              delay: i * 0.04,
            }}
            className="absolute"
            style={{ filter: `drop-shadow(0 0 12px ${color})` }}
          >
            <span style={{ display: "inline-block", transform: "scale(2.6)" }}>
              <ShapeIcon shape={shape} color={color} />
            </span>
          </motion.div>
        ))}

      {kind === "converge" && (
        // Final flash at the convergence point
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [0, 1.4, 0], opacity: [0, 1, 0] }}
          transition={{ duration: 0.45, delay: 0.45, ease: "easeOut" }}
          className="absolute"
          style={{
            width: 90,
            height: 90,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${color}55 0%, ${color}00 70%)`,
          }}
        />
      )}

      {kind === "expand" &&
        expandDirs.map((o, i) => (
          <motion.div
            key={i}
            initial={{ x: 0, y: 0, scale: 0.4, opacity: 0 }}
            animate={{
              x: o.x,
              y: o.y,
              scale: [0.4, 1.1, 0.9],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 0.7,
              ease: [0.2, 0.8, 0.3, 1],
              times: [0, 0.55, 1],
              delay: 0.05,
            }}
            className="absolute"
            style={{ filter: `drop-shadow(0 0 10px ${color})` }}
          >
            <span style={{ display: "inline-block", transform: "scale(2.2)" }}>
              <ShapeIcon shape={shape} color={color} />
            </span>
          </motion.div>
        ))}

      {kind === "expand" && (
        // Initial pulse at origin
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [0, 1.2, 0], opacity: [0, 0.9, 0] }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="absolute"
          style={{
            width: 70,
            height: 70,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${color}66 0%, ${color}00 70%)`,
          }}
        />
      )}
    </motion.div>
  );
}

function StarLegend({ onSelect, eruption = false }: { onSelect: (id: string) => void; eruption?: boolean }) {
  const ui = useUi();
  const categoryLabels = getCategoryLabels(ui);
  const order: { id: string; shape: StarShape }[] = [
    { id: "cv", shape: "cone" },
    { id: "stack", shape: "octa" },
    { id: "qualites", shape: "spike" },
    { id: "languages", shape: "tetra" },
    { id: "hobbies", shape: "sphere" },
    { id: "certs", shape: "hex" },
    { id: "contact", shape: "box" },
  ];
  return (
    <motion.aside
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.4, duration: 0.7 }}
      aria-label={ui.legendTitle}
      className="absolute top-14 right-3 md:top-20 md:right-6 z-10 select-none"
    >
      <div
        className="border rounded-md px-1.5 py-2 md:px-2 md:py-2.5"
        style={{
          borderColor: "#1F2521",
          backgroundColor: "rgba(7,8,10,0.72)",
          backdropFilter: "blur(6px)",
        }}
      >
        <p
          className="mono uppercase tracking-[0.3em] text-[9px] text-text-subtle mb-2 px-2 hidden sm:block"
        >
          {ui.legendTitle}
        </p>
        <ul className="flex flex-col">
          {order.map(({ id, shape }) => (
            <li key={id}>
              <button
                type="button"
                onClick={() => onSelect(`info:${id}`)}
                className="w-full flex items-center justify-center sm:justify-start gap-2.5 px-1.5 py-1 sm:px-2 sm:py-1.5 rounded transition group hover:bg-white/[0.04]"
                style={{ outline: "none" }}
                aria-label={categoryLabels[id]}
              >
                <span
                  className="shrink-0 grid place-items-center"
                  style={{ width: 18, height: 18 }}
                >
                  <ShapeIcon shape={shape} color={STAR_COLORS[id]} />
                </span>
                <span className="mono uppercase tracking-[0.18em] text-[10px] text-text-muted group-hover:text-text transition-colors hidden sm:inline">
                  {categoryLabels[id]}
                </span>
              </button>
            </li>
          ))}
          <li
            className="mt-1 pt-1 border-t"
            style={{ borderColor: "#1F2521" }}
          >
            <button
              type="button"
              onClick={() => onSelect("identity")}
              className="w-full flex items-center justify-center sm:justify-start gap-2.5 px-1.5 py-1 sm:px-2 sm:py-1.5 rounded transition group hover:bg-white/[0.04]"
              style={{ outline: "none" }}
              aria-label={ui.identityChapter}
            >
              <span
                className="shrink-0 grid place-items-center relative"
                style={{ width: 18, height: 18 }}
              >
                {eruption && (
                  <>
                    {/* Lava aura — pulsing radial halo */}
                    <motion.span
                      aria-hidden
                      className="absolute inset-0 rounded-full pointer-events-none"
                      style={{
                        background:
                          "radial-gradient(circle, rgba(255,88,40,0.55) 0%, rgba(229,91,91,0.25) 45%, rgba(229,91,91,0) 75%)",
                        filter: "blur(2px)",
                      }}
                      animate={{ opacity: [0.45, 1, 0.45], scale: [0.95, 1.25, 0.95] }}
                      transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                    />
                    {/* Fire spark 1 — rising tongue of flame */}
                    <motion.span
                      aria-hidden
                      className="absolute pointer-events-none"
                      style={{
                        left: "50%",
                        top: -2,
                        width: 2,
                        height: 6,
                        marginLeft: -1,
                        borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%",
                        background:
                          "linear-gradient(180deg, #FFE08A 0%, #FF8A2A 55%, #E55B5B 100%)",
                        boxShadow: "0 0 6px rgba(255,138,42,0.85)",
                      }}
                      animate={{ y: [0, -6, -10], opacity: [0, 1, 0], scaleY: [0.6, 1, 0.4] }}
                      transition={{ duration: 1.1, repeat: Infinity, ease: "easeOut" }}
                    />
                    {/* Fire spark 2 — offset, slower */}
                    <motion.span
                      aria-hidden
                      className="absolute pointer-events-none"
                      style={{
                        left: "30%",
                        top: 0,
                        width: 1.5,
                        height: 5,
                        borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%",
                        background:
                          "linear-gradient(180deg, #FFE08A 0%, #FF8A2A 60%, #E55B5B 100%)",
                        boxShadow: "0 0 5px rgba(255,138,42,0.8)",
                      }}
                      animate={{ y: [0, -5, -8], opacity: [0, 1, 0], scaleY: [0.5, 1, 0.3] }}
                      transition={{ duration: 1.4, repeat: Infinity, ease: "easeOut", delay: 0.4 }}
                    />
                    {/* Fire spark 3 — right side */}
                    <motion.span
                      aria-hidden
                      className="absolute pointer-events-none"
                      style={{
                        left: "68%",
                        top: 1,
                        width: 1.5,
                        height: 4,
                        borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%",
                        background:
                          "linear-gradient(180deg, #FFE08A 0%, #FF8A2A 60%, #E55B5B 100%)",
                        boxShadow: "0 0 5px rgba(255,138,42,0.8)",
                      }}
                      animate={{ y: [0, -4, -7], opacity: [0, 1, 0], scaleY: [0.5, 1, 0.3] }}
                      transition={{ duration: 1.2, repeat: Infinity, ease: "easeOut", delay: 0.7 }}
                    />
                  </>
                )}
                <svg width="18" height="18" viewBox="0 0 18 18" style={{ position: "relative" }}>
                  <defs>
                    <radialGradient id="moi-erupt" cx="50%" cy="55%" r="55%">
                      <stop offset="0%" stopColor="#FFE08A" stopOpacity="0.95" />
                      <stop offset="45%" stopColor="#FF5828" stopOpacity="0.9" />
                      <stop offset="100%" stopColor="#B22222" stopOpacity="0.85" />
                    </radialGradient>
                  </defs>
                  <polygon
                    points="9,1 11,7 17,9 11,11 9,17 7,11 1,9 7,7"
                    fill={eruption ? "url(#moi-erupt)" : "#E55B5B33"}
                    stroke={eruption ? "#FF5828" : "#E55B5B"}
                    strokeWidth={eruption ? 1.4 : 1.1}
                    strokeLinejoin="round"
                    style={
                      eruption
                        ? { filter: "drop-shadow(0 0 4px rgba(255,88,40,0.85))" }
                        : undefined
                    }
                  />
                </svg>
              </span>
              <span
                className="mono uppercase tracking-[0.18em] text-[10px] text-text-muted group-hover:text-text transition-colors hidden sm:inline"
                style={
                  eruption
                    ? {
                        color: "#FF8A2A",
                        textShadow: "0 0 6px rgba(255,88,40,0.55)",
                      }
                    : undefined
                }
              >
                {ui.identityChapter}
              </span>
            </button>
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
  const ui = useUi();
  const { lang } = useLang();
  const { projects } = useContent();
  const [index, setIndex] = useState(0);
  const [openCard, setOpenCard] = useState<OpenCard | null>(null);
  const [introDismissed, setIntroDismissed] = useState(false);
  const [captionVisible, setCaptionVisible] = useState(false);
  const [legendFx, setLegendFx] = useState<{
    kind: FxKind;
    shape: StarShape;
    color: string;
    next: OpenCard;
  } | null>(null);
  const [warpTick, setWarpTick] = useState(0);

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

  // Legend click → run FX, then open overlay
  const handleLegendSelect = useCallback((id: string) => {
    playBlip();
    if (id === "identity") {
      setLegendFx({
        kind: "expand",
        shape: "spike",
        color: "#E55B5B",
        next: { type: "identity" },
      });
      return;
    }
    const [type, value] = id.split(":");
    if (type !== "info") return;
    const isConverge = value === "cv" || value === "stack" || value === "qualites";
    setLegendFx({
      kind: isConverge ? "converge" : "expand",
      shape: STAR_SHAPES[value] ?? "octa",
      color: STAR_COLORS[value] ?? "#ECE6D6",
      next: { type: "info", infoId: value },
    });
  }, []);

  const handleSelectPlanet = useCallback((project: Project) => {
    playTap();
    setOpenCard({ type: "planet", project });
  }, []);

  const goTo = useCallback(
    (newIndex: number) => {
      playWhoosh();
      setIndex(newIndex);
      closeCard();
      // Trigger hyperspace warp overlay
      setWarpTick((t) => t + 1);
      // Show chapter caption AFTER the transition has finished (~800ms)
      // so the title never overlaps the streaks/wipe/shock visuals.
      setCaptionVisible(false);
      setTimeout(() => setCaptionVisible(true), 820);
      setTimeout(() => setCaptionVisible(false), 2400);
    },
    [closeCard]
  );

  const next = useCallback(() => {
    goTo((index + 1) % projects.length);
  }, [goTo, index]);

  const prev = useCallback(() => {
    goTo((index - 1 + projects.length) % projects.length);
  }, [goTo, index]);

  // Show initial caption on first load (after intro dismissed) —
  // longer hold + small startup delay so the canvas is mounted and visible.
  useEffect(() => {
    if (introDismissed) {
      const start = setTimeout(() => setCaptionVisible(true), 350);
      const end = setTimeout(() => setCaptionVisible(false), 3000);
      return () => {
        clearTimeout(start);
        clearTimeout(end);
      };
    }
  }, [introDismissed]);

  // Volcanic rumble while the eruption (planet 4) is active
  useEffect(() => {
    if (introDismissed && index === 3) {
      startEruptionRumble();
      return () => stopEruptionRumble();
    }
    stopEruptionRumble();
  }, [introDismissed, index]);

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
      <header className="absolute top-4 left-4 md:top-6 md:left-6 z-10 pointer-events-none select-none">
        <p className="serif-italic text-text text-xl md:text-3xl">
          Aurian<span className="text-thread">.</span>
        </p>
        <p className="mono uppercase tracking-[0.3em] text-[9px] md:text-[10px] text-text-muted mt-1 hidden sm:block">
          {ui.headerSubtitle}
        </p>
      </header>

      {/* Per-planet ambient layer (signature effect tied to the focused planet) */}
      {introDismissed && <PlanetAmbient slug={projects[index].slug} />}

      {/* Planet transition overlay (variant cycles per tick) */}
      <AnimatePresence>
        {warpTick > 0 && (
          <PlanetTransition
            tickKey={warpTick}
            variant={pickVariant(warpTick)}
          />
        )}
      </AnimatePresence>

      {/* Star legend (top right, pokemon-badge style) — clickable for global details */}
      {introDismissed && <StarLegend onSelect={handleLegendSelect} eruption={index === 3} />}

      {/* Chatbot guide (top-center, opens dropdown panel) */}
      {introDismissed && <Chatbot />}

      {/* Legend FX overlay (convergence / expansion) */}
      <AnimatePresence>
        {legendFx && (
          <LegendFX
            key="legend-fx"
            kind={legendFx.kind}
            shape={legendFx.shape}
            color={legendFx.color}
            onComplete={() => {
              setOpenCard(legendFx.next);
              setLegendFx(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* Big animated arrows */}
      {introDismissed && (
        <>
          <motion.button
            onClick={prev}
            aria-label={lang === "fr" ? "Planète précédente" : "Previous planet"}
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
            aria-label={lang === "fr" ? "Planète suivante" : "Next planet"}
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

      {/* Back to landing button (bottom-left) */}
      {introDismissed && (
        <motion.button
          type="button"
          onClick={() => setIntroDismissed(false)}
          aria-label={lang === "fr" ? "Retour à la landing" : "Back to landing"}
          className="fixed bottom-6 left-6 z-[40] flex items-center gap-2 group"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0, duration: 0.6, ease: "easeOut" }}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          style={{
            padding: "8px 14px",
            borderRadius: 999,
            background:
              "linear-gradient(160deg, rgba(20,22,27,0.9) 0%, rgba(7,8,10,0.95) 100%)",
            border: "1px solid rgba(164,245,200,0.22)",
            boxShadow:
              "0 4px 18px rgba(0,0,0,0.55), 0 0 14px rgba(164,245,200,0.10)",
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 16 16"
            aria-hidden
            style={{ display: "block" }}
          >
            <path
              d="M10 3 L4 8 L10 13"
              fill="none"
              stroke="#A4F5C8"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span
            className="mono uppercase tracking-[0.25em] text-[10px]"
            style={{ color: "rgba(236,230,214,0.78)" }}
          >
            {lang === "fr" ? "Retour" : "Back"}
          </span>
        </motion.button>
      )}

      {/* Intro overlay */}
      <AnimatePresence>
        {!introDismissed && (
          <IntroOverlay onDismiss={() => setIntroDismissed(true)} />
        )}
      </AnimatePresence>

      {/* Language toggle — hidden while an overlay is open (avoids collision with close button) */}
      {!openCard && <LangToggle z={70} />}

      {/* Sound toggle — sits left of LangToggle */}
      {!openCard && <SoundToggle z={70} />}

      {/* Social dock (LinkedIn + GitHub) — appears after landing, hidden during overlays */}
      {introDismissed && !openCard && <SocialDock z={70} />}
    </div>
  );
}
