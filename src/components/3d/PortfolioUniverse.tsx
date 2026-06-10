"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Stars, Line, Sparkles, Html } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import * as THREE from "three";
import { type Project } from "@/lib/content";
import { useContent, useUi, useLang, tr } from "@/lib/i18n";
import { useIsTouch } from "@/lib/useIsTouch";
import { LangToggle } from "@/components/LangToggle";
import { SocialDock } from "@/components/SocialDock";
import { SoundToggle } from "@/components/SoundToggle";
import {
  initSound,
  playBlip,
  playTap,
  playWhoosh,
} from "@/lib/sound";
import { TechPill } from "@/components/ui/TechPill";
import { LevelsMiniApp } from "@/components/miniapps/LevelsMiniApp";
import { EnergizerMiniApp } from "@/components/miniapps/EnergizerMiniApp";
import { MiraklMiniApp } from "@/components/miniapps/MiraklMiniApp";
import { Chatbot } from "@/components/Chatbot";
import { ChatbotArrowTip } from "@/components/ChatbotArrowTip";
import { PlanetPresenter } from "@/components/PlanetPresenter";
import { PlanetTransition, pickVariant } from "@/components/PlanetTransition";
import { PlanetWarp } from "@/components/PlanetWarp";
import { PlanetAmbient } from "@/components/PlanetAmbient";
import { EnergizerPlanet } from "./planets/EnergizerPlanet";
import { LevelsPlanet } from "./planets/LevelsPlanet";
import { MiraklPlanet } from "./planets/MiraklPlanet";
import { BeyondPlanet } from "./planets/BeyondPlanet";
import { TheLookPlanet } from "./planets/TheLookPlanet";
import { buildIdentityStarMaterial } from "./planets/IdentityStarShader";

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
// Open card type discriminator
// ---------------------------------------------------------------------------
type OpenCard =
  | { type: "planet"; project: Project }
  | { type: "quality"; planetSlug: string }
  | { type: "stack"; planetSlug: string }
  | { type: "info"; infoId: string }
  | { type: "identity" };

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------
type UiText = ReturnType<typeof useUi>;

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

type StarShape = "cone" | "octa" | "spike" | "tetra" | "sphere" | "box" | "hex";

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

// ---------------------------------------------------------------------------
// Overlay card components (rendered OUTSIDE Canvas)
// ---------------------------------------------------------------------------

function OverlayCloseBtn({
  onClose,
  light = false,
}: {
  onClose: () => void;
  light?: boolean;
}) {
  const ui = useUi();
  const baseColor = light ? "rgba(20,22,28,0.6)" : undefined;
  const hoverColor = light ? "#8C6A1E" : undefined;
  return (
    <button
      onClick={onClose}
      aria-label={ui.closeAria}
      className={
        light
          ? "absolute top-3 right-3 sm:top-6 sm:right-6 transition mono uppercase tracking-[0.3em] text-[10px]"
          : "absolute top-3 right-3 sm:top-6 sm:right-6 text-text-muted hover:text-thread transition mono uppercase tracking-[0.3em] text-[10px]"
      }
      style={light ? { color: baseColor } : undefined}
      onMouseEnter={
        light
          ? (e) => {
              e.currentTarget.style.color = hoverColor as string;
            }
          : undefined
      }
      onMouseLeave={
        light
          ? (e) => {
              e.currentTarget.style.color = baseColor as string;
            }
          : undefined
      }
    >
      {ui.closeLabel}
    </button>
  );
}

// Glyphes des 5 agents Beyond — alignés sur ceux affichés sur la planète 3D
// (BeyondPlanet.tsx). Affichés dans la médaille à côté du titre de chaque
// moon dans l'onglet "Agents" du ProjectOverlayCard.
const BEYOND_AGENT_GLYPHS: Record<string, string> = {
  Orchestrator: "◆",
  "A&R Strategist": "♪",
  "Growth Analyst": "▲",
  "Content & Community": "◐",
  Networker: "⌬",
};

// ---------------------------------------------------------------------------
// Architectures inline gris perle / or (style "blueprint ingénieur avec grille")
// Recrée chaque schéma technique en composants React au lieu d'afficher
// les .svg sombres d'origine, pour cohérence DA avec le ProjectOverlayCard.
// ---------------------------------------------------------------------------
const BP_GOLD = "#8C6A1E";
const BP_TEXT = "#1B1E25";
const BP_DIM = "rgba(20,22,28,0.6)";
const BP_HAIR = "rgba(20,22,28,0.16)";

function BlueprintCanvas({
  children,
  compact = false,
}: {
  children: React.ReactNode;
  compact?: boolean;
}) {
  const cell = compact ? 18 : 26;
  return (
    <div
      style={{
        background: `
          linear-gradient(to right, rgba(20,22,28,0.05) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(20,22,28,0.05) 1px, transparent 1px),
          #F4F6F9
        `,
        backgroundSize: `${cell}px ${cell}px`,
        padding: compact ? "26px 22px" : "44px 40px",
        borderRadius: 4,
        border: `1px solid rgba(20,22,28,0.10)`,
        boxShadow:
          "inset 0 0 0 1px rgba(255,255,255,0.55), 0 1px 2px rgba(20,22,28,0.04)",
      }}
    >
      {children}
    </div>
  );
}

function BlueprintBox({
  id,
  title,
  sub,
  accent = false,
  compact = false,
}: {
  id?: string;
  title: string;
  sub?: string;
  accent?: boolean;
  compact?: boolean;
}) {
  return (
    <div
      style={{
        background: "#FFFFFF",
        border: `1px solid ${accent ? "rgba(140,106,30,0.55)" : BP_HAIR}`,
        borderRadius: 3,
        padding: compact ? "8px 12px" : "10px 14px",
        boxShadow:
          "0 1px 0 rgba(255,255,255,1) inset, 0 4px 12px rgba(20,22,28,0.06)",
        minWidth: compact ? 110 : 140,
      }}
    >
      {id && (
        <p
          className="mono uppercase tracking-widest"
          style={{
            fontSize: 9,
            color: BP_GOLD,
            marginBottom: 4,
            letterSpacing: "0.2em",
          }}
        >
          {id}
        </p>
      )}
      <p
        className="mono uppercase"
        style={{
          fontSize: compact ? 10 : 11,
          color: BP_TEXT,
          fontWeight: 600,
          letterSpacing: "0.08em",
        }}
      >
        {title}
      </p>
      {sub && (
        <p
          className="serif-italic"
          style={{
            fontSize: compact ? 10 : 11,
            color: BP_DIM,
            marginTop: 4,
            lineHeight: 1.35,
          }}
        >
          {sub}
        </p>
      )}
    </div>
  );
}

// Connecteur vertical or entre deux boxes (fin trait + flèche pointe basse).
function VBar({ height = 28 }: { height?: number }) {
  return (
    <div
      aria-hidden
      style={{
        width: 1,
        height,
        background: BP_GOLD,
        margin: "0 auto",
        position: "relative",
      }}
    >
      <span
        style={{
          position: "absolute",
          bottom: -3,
          left: "50%",
          transform: "translateX(-50%)",
          color: BP_GOLD,
          fontSize: 11,
          lineHeight: 1,
          fontFamily: "var(--font-mono), ui-monospace, monospace",
        }}
      >
        ▼
      </span>
    </div>
  );
}

function EnergizerArchitecture({ compact = false }: { compact?: boolean }) {
  // Archi réelle (cf ARCHITECTURE.md du repo Desktop/Energizer) :
  // 2 phases — ANALYSE (steps 1→5, 4 & 5 en parallèle) puis PRODUCTION
  // (Blog Redactor v2 : Briefing → Generate → Validation avec auto-révision).
  // Multi-tenant via table `companies` (FK company_domain sur runs/articles).
  const { lang } = useLang();
  return (
    <BlueprintCanvas compact={compact}>
      <div className="flex flex-col items-center gap-0">
        {/* PHASE 1 — ANALYSE */}
        <p
          className="mono uppercase tracking-[0.3em] mb-3"
          style={{ fontSize: 9, color: BP_GOLD }}
        >
          ▸ {tr(lang, "Phase 1 · Analyse (auto-execute)", "Phase 1 · Analysis (auto-execute)")}
        </p>
        <BlueprintBox
          id="Step 01"
          title={tr(lang, "Stratégie", "Strategy")}
          sub={tr(lang, "Personas · piliers · outils", "Personas · pillars · tools")}
          compact={compact}
        />
        <VBar />
        <BlueprintBox
          id="Step 02"
          title={tr(lang, "Veille", "Watch")}
          sub={tr(lang, "Tendances · questions · longtail", "Trends · questions · longtail")}
          compact={compact}
        />
        <VBar />
        <BlueprintBox
          id="Step 03"
          title={tr(lang, "Concurrence", "Competitors")}
          sub={tr(lang, "Snapshots · market gaps · deltas", "Snapshots · market gaps · deltas")}
          compact={compact}
        />
        <VBar />
        <div
          style={{
            background: "rgba(255,255,255,0.55)",
            border: `1px dashed ${BP_HAIR}`,
            borderRadius: 4,
            padding: compact ? 12 : 18,
          }}
        >
          <p
            className="mono uppercase tracking-widest text-center mb-3"
            style={{ fontSize: 9, color: BP_GOLD }}
          >
            ║ {tr(lang, "exécution parallèle", "parallel execution")}
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <BlueprintBox
              id="Step 04"
              title={tr(lang, "Critique", "Critique")}
              sub={tr(lang, "Audit site · roadmap", "Site audit · roadmap")}
              compact
            />
            <BlueprintBox
              id="Step 05"
              title="Scoring"
              sub={tr(lang, "Keywords pondérés", "Weighted keywords")}
              compact
            />
          </div>
        </div>
        <VBar height={32} />
        <BlueprintBox
          title={tr(lang, "Keywords sélectionnés", "Selected keywords")}
          sub={tr(lang, "→ envoi en rédaction", "→ sent to writing")}
          accent
          compact={compact}
        />
        {/* PHASE 2 — PRODUCTION */}
        <div
          style={{
            width: 1,
            height: 14,
            background: BP_HAIR,
            margin: "12px auto",
          }}
        />
        <p
          className="mono uppercase tracking-[0.3em] mb-3 mt-2"
          style={{ fontSize: 9, color: BP_GOLD }}
        >
          ▸ {tr(lang, "Phase 2 · Production (Blog Redactor v2)", "Phase 2 · Production (Blog Redactor v2)")}
        </p>
        <BlueprintBox
          id="Step 06"
          title={tr(lang, "Rédaction", "Writing")}
          sub={tr(lang, "GPT-4o · article + DALL-E 3 hero", "GPT-4o · article + DALL-E 3 hero")}
          compact={compact}
        />
        <VBar />
        <BlueprintBox
          id="Step 07"
          title={tr(lang, "Optimisation", "Optimization")}
          sub={tr(lang, "Audit E-E-A-T · enrichissement", "E-E-A-T audit · enrichment")}
          compact={compact}
        />
        {/* boucle auto-révision retour 07 → 06 */}
        <div
          style={{
            position: "relative",
            width: compact ? 260 : 320,
            height: compact ? 36 : 44,
            margin: "0 auto",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 0,
              width: 1,
              height: "100%",
              background: BP_GOLD,
            }}
          />
          <div
            style={{
              position: "absolute",
              top: "50%",
              right: 8,
              transform: "translateY(-50%)",
              fontFamily: "var(--font-mono), ui-monospace, monospace",
              fontSize: 9,
              letterSpacing: "0.2em",
              color: BP_GOLD,
              textTransform: "uppercase",
            }}
          >
            ↺ {tr(lang, "auto-révision", "auto-revision")}
          </div>
          <span
            style={{
              position: "absolute",
              bottom: -3,
              left: "50%",
              transform: "translateX(-50%)",
              color: BP_GOLD,
              fontSize: 11,
              fontFamily: "var(--font-mono), ui-monospace, monospace",
            }}
          >
            ▼
          </span>
        </div>
        <BlueprintBox
          id="Step 08"
          title={tr(lang, "Mise en page", "Layout")}
          sub={tr(lang, "HTML Webflow-ready", "HTML Webflow-ready")}
          compact={compact}
        />
      </div>
      <p
        className="mono uppercase tracking-[0.3em] text-center mt-6"
        style={{ fontSize: 9, color: BP_DIM }}
      >
        {tr(lang, "multi-tenant · companies (FK company_domain)", "multi-tenant · companies (FK company_domain)")}
      </p>
    </BlueprintCanvas>
  );
}

function MiraklArchitecture({ compact = false }: { compact?: boolean }) {
  // Archi réelle vérifiée :
  // - src/lib/scoring.ts (continuousListScore + 6 scorers + priorityFromScore)
  // - deliverable/ARCHITECTURE.md (ordre du pipeline)
  // - deliverable/SCORING.md (pondérations exactes)
  //
  // Ordre canonique : SOURCING (batch ou temps réel) → SCOPE GATE (GPT-4o)
  // → SCORING (6 critères sur 100, persisté top_match) → ENRICHMENT
  // (uniquement sur sellers matchés) → STRATÉGIE (competitors + ROI)
  // → EMAILS hyper-personnalisés.
  //
  // Sources de chaque critère : Seller (Supabase) vs MarketplaceProfile (JSON).
  const { lang } = useLang();
  const criteria = [
    {
      id: "C1",
      title: tr(lang, "Catégorie", "Category"),
      weight: "× 28%",
      detail: tr(lang, "focus + position dans la liste + overlap tokens", "focus + position in list + token overlap"),
    },
    {
      id: "C2",
      title: tr(lang, "Géographie", "Geography"),
      weight: "× 22%",
      detail: tr(lang, "target + accepted countries", "target + accepted countries"),
    },
    {
      id: "C3",
      title: tr(lang, "Prix", "Price"),
      weight: "× 16%",
      detail: tr(lang, "distance sur tiers [budget→mid→premium→luxury]", "distance over tiers [budget→mid→premium→luxury]"),
    },
    {
      id: "C4",
      title: "Customer",
      weight: "× 14%",
      detail: tr(lang, "positionnement (women/men/unisex/family)", "positioning (women/men/unisex/family)"),
    },
    {
      id: "C5",
      title: tr(lang, "Saisonnalité", "Seasonality"),
      weight: "× 10%",
      detail: "always_on · fashion_drop · holiday_gifting…",
    },
    {
      id: "C6",
      title: tr(lang, "Signaux MP", "MP signals"),
      weight: "× 10%",
      detail: tr(lang, "Amazon SKU (log) + domain + enrich + email", "Amazon SKU (log) + domain + enrich + email"),
    },
  ];
  const priorities = [
    { tag: "HOT", range: "≥ 88" },
    { tag: "HIGH", range: "≥ 72" },
    { tag: "MEDIUM", range: "≥ 55" },
    { tag: "LOW", range: "< 55" },
  ];
  return (
    <BlueprintCanvas compact={compact}>
      {/* ====================================================== */}
      {/* ÉTAGE 1 — Sourcing : batch OU temps réel                */}
      {/* ====================================================== */}
      <p
        className="mono uppercase tracking-[0.3em] mb-3"
        style={{ fontSize: 9, color: BP_GOLD }}
      >
        ▸ {tr(lang, "Étage 1 · Sourcing", "Stage 1 · Sourcing")}
      </p>
      <div
        style={{
          background: "rgba(255,255,255,0.55)",
          border: `1px dashed ${BP_HAIR}`,
          borderRadius: 4,
          padding: compact ? 12 : 18,
        }}
      >
        <p
          className="mono uppercase tracking-widest text-center mb-3"
          style={{ fontSize: 9, color: BP_GOLD }}
        >
          ║ {tr(lang, "deux modes d'entrée", "two entry modes")}
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <BlueprintBox
            id={tr(lang, "A · Batch", "A · Batch")}
            title={tr(lang, "Python local", "Local Python")}
            sub={tr(lang, "scraper/main.py · marketplaces → 409 sellers Supabase", "scraper/main.py · marketplaces → 409 sellers in Supabase")}
            compact
          />
          <BlueprintBox
            id={tr(lang, "B · Temps réel", "B · Real-time")}
            title="POST /api/scrape-seller"
            sub={tr(lang, "un seller cible → on l'associe à une plateforme retail", "a target seller → match to a retail platform")}
            compact
          />
        </div>
      </div>
      <VBar />

      {/* ====================================================== */}
      {/* ÉTAGE 2 — Gate scope GPT-4o                             */}
      {/* ====================================================== */}
      <p
        className="mono uppercase tracking-[0.3em] mb-3"
        style={{ fontSize: 9, color: BP_GOLD }}
      >
        ▸ {tr(lang, "Étage 2 · Pre-scoring gate", "Stage 2 · Pre-scoring gate")}
      </p>
      <BlueprintBox
        id="GPT-4o · classify"
        title={tr(lang, "Scope brand check", "Scope brand check")}
        sub={tr(lang, "fashion · beauty · accessories · sports · kids · luxury · home · footwear  ✗ hors scope → red banner, no DB write", "fashion · beauty · accessories · sports · kids · luxury · home · footwear  ✗ out of scope → red banner, no DB write")}
        compact={compact}
      />
      <VBar />

      {/* ====================================================== */}
      {/* ÉTAGE 3 — Scoring engine (DÉTAIL)                       */}
      {/* ====================================================== */}
      <p
        className="mono uppercase tracking-[0.3em] mb-3"
        style={{ fontSize: 9, color: BP_GOLD }}
      >
        ▸ {tr(lang, "Étage 3 · Scoring (scoring.ts · computeCriteria)", "Stage 3 · Scoring (scoring.ts · computeCriteria)")}
      </p>
      <div
        style={{
          background: "#FFFFFF",
          border: `1px solid ${BP_HAIR}`,
          borderRadius: 4,
          padding: compact ? 14 : 20,
          boxShadow: "0 6px 14px rgba(20,22,28,0.06)",
        }}
      >
        {/* Note méthode — formulation continue */}
        <p
          className="serif-italic mb-3"
          style={{
            fontSize: 11,
            color: BP_DIM,
            textAlign: "center",
            lineHeight: 1.45,
          }}
        >
          {tr(
            lang,
            "continuousListScore() — chaque critère ∈ [0–100] : préféré 78–98 (bonus position), accepté 60–70, overlap tokens 35–65, défaut 22, manquant 38. Le prix utilise une distance sur tiers ordonnés ; les signaux MP une courbe log sur les SKU Amazon (pic ~500, pénalité au-delà sur marketplaces premium).",
            "continuousListScore() — each criterion ∈ [0–100]: preferred 78–98 (position bonus), accepted 60–70, token overlap 35–65, default 22, missing 38. Price uses a distance over ordered tiers; MP signals a log curve over Amazon SKUs (peak ~500, penalty beyond on premium marketplaces).",
          )}
        </p>

        <div className="grid grid-cols-12 gap-5 items-center">
          {/* Colonne gauche : critères pondérés */}
          <div className="col-span-12 md:col-span-7 space-y-2">
            {criteria.map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-3"
                style={{
                  background: "rgba(140,106,30,0.04)",
                  border: `1px solid ${BP_HAIR}`,
                  borderRadius: 3,
                  padding: "7px 12px",
                }}
              >
                <span
                  className="mono"
                  style={{
                    fontSize: 9,
                    color: BP_GOLD,
                    width: 24,
                    letterSpacing: "0.15em",
                  }}
                >
                  {c.id}
                </span>
                <span
                  className="mono uppercase"
                  style={{
                    fontSize: 11,
                    color: BP_TEXT,
                    fontWeight: 600,
                    minWidth: 96,
                    letterSpacing: "0.06em",
                  }}
                >
                  {c.title}
                </span>
                <span
                  className="serif-italic"
                  style={{
                    fontSize: 10,
                    color: BP_DIM,
                    flex: 1,
                    lineHeight: 1.35,
                  }}
                >
                  {c.detail}
                </span>
                <span
                  className="mono"
                  style={{
                    fontSize: 10,
                    color: BP_GOLD,
                    letterSpacing: "0.1em",
                  }}
                >
                  {c.weight}
                </span>
                <span
                  style={{
                    width: 14,
                    height: 1,
                    background: BP_GOLD,
                  }}
                />
                <span
                  style={{
                    color: BP_GOLD,
                    fontSize: 11,
                    fontFamily: "var(--font-mono), ui-monospace, monospace",
                  }}
                >
                  ▶
                </span>
              </div>
            ))}
          </div>
          {/* Colonne droite : formule + score + buckets */}
          <div className="col-span-12 md:col-span-5 flex flex-col items-center gap-3">
            <p
              className="mono uppercase tracking-[0.3em] text-center"
              style={{ fontSize: 9, color: BP_GOLD, lineHeight: 1.4 }}
            >
              {tr(lang, "total = Σ (score × poids) / 100", "total = Σ (score × weight) / 100")}
              <br />
              {tr(lang, "vs 7 marketplaces · top match persisté", "vs 7 marketplaces · top match persisted")}
            </p>
            <div
              style={{
                background: "#FFFFFF",
                border: `2px solid ${BP_GOLD}`,
                borderRadius: 4,
                padding: compact ? "14px 22px" : "20px 30px",
                boxShadow: "0 14px 30px rgba(140,106,30,0.18)",
                textAlign: "center",
                minWidth: compact ? 150 : 180,
              }}
            >
              <p
                className="mono uppercase tracking-widest"
                style={{ fontSize: 10, color: BP_DIM, marginBottom: 4 }}
              >
                Score
              </p>
              <p
                className="serif-display"
                style={{
                  fontSize: compact ? 30 : 42,
                  color: BP_TEXT,
                  lineHeight: 1,
                }}
              >
                / 100
              </p>
            </div>
            {/* Buckets de priorité */}
            <div className="w-full mt-1 flex flex-col gap-1.5">
              {priorities.map((p) => (
                <div
                  key={p.tag}
                  className="flex items-center justify-between"
                  style={{
                    background: "rgba(140,106,30,0.05)",
                    border: `1px solid ${BP_HAIR}`,
                    borderRadius: 2,
                    padding: "4px 10px",
                  }}
                >
                  <span
                    className="mono uppercase tracking-widest"
                    style={{ fontSize: 9, color: BP_GOLD }}
                  >
                    {p.tag}
                  </span>
                  <span
                    className="mono"
                    style={{ fontSize: 10, color: BP_TEXT }}
                  >
                    {p.range}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <VBar />

      {/* ====================================================== */}
      {/* ÉTAGE 4 — Enrichment (sur sellers matchés uniquement)   */}
      {/* ====================================================== */}
      <p
        className="mono uppercase tracking-[0.3em] mb-3"
        style={{ fontSize: 9, color: BP_GOLD }}
      >
        ▸ {tr(lang, "Étage 4 · Enrichment (HOT/HIGH only)", "Stage 4 · Enrichment (HOT/HIGH only)")}
      </p>
      <div className="flex flex-wrap gap-3 justify-center">
        <BlueprintBox
          id="POST /api/enrich-contact"
          title={tr(lang, "Décideur LinkedIn", "LinkedIn decision-maker")}
          sub={tr(lang, "role suggéré par scoring · rolesToScrape", "role suggested by scoring · rolesToScrape")}
          compact
        />
        <BlueprintBox
          id="Better Contact"
          title={tr(lang, "Validation email", "Email validation")}
          sub="bcSubmit → bcPoll 48s · contact_email + confidence"
          compact
        />
        <BlueprintBox
          id="Fallback"
          title="Pattern + MX/SMTP"
          sub={tr(lang, "probe DNS si BC échoue", "DNS probe if BC fails")}
          compact
        />
      </div>
      <VBar />

      {/* ====================================================== */}
      {/* ÉTAGE 5 — Stratégie hyper-personnalisée                 */}
      {/* ====================================================== */}
      <p
        className="mono uppercase tracking-[0.3em] mb-3"
        style={{ fontSize: 9, color: BP_GOLD }}
      >
        ▸ {tr(lang, "Étage 5 · Stratégie (la grande plus-value)", "Stage 5 · Strategy (the key value-add)")}
      </p>
      <div
        style={{
          background: "#FFFFFF",
          border: `1px solid ${BP_HAIR}`,
          borderRadius: 4,
          padding: compact ? 12 : 16,
          boxShadow: "0 6px 14px rgba(20,22,28,0.06)",
        }}
      >
        <p
          className="serif-italic mb-3"
          style={{
            fontSize: 11,
            color: BP_DIM,
            textAlign: "center",
            lineHeight: 1.45,
          }}
        >
          {tr(
            lang,
            "POST /api/emails/generate — recommendStrategy() pioche dans le score : seasonality > 75 → seasonal_window, price > 80 → market_fit, Amazon presence → competitive_gap, sinon roi. Method : partner_intro (HOT) · linkedin_email (domain connu) · email_sequence (défaut).",
            "POST /api/emails/generate — recommendStrategy() picks from the score: seasonality > 75 → seasonal_window, price > 80 → market_fit, Amazon presence → competitive_gap, otherwise roi. Method: partner_intro (HOT) · linkedin_email (known domain) · email_sequence (default).",
          )}
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <BlueprintBox
            id="analyzeCompetitors"
            title={tr(lang, "3–5 concurrents", "3–5 competitors")}
            sub={tr(lang, "GPT-4o · presence MP", "GPT-4o · MP presence")}
            compact
          />
          <BlueprintBox
            id="calculateROI"
            title={tr(lang, "Time + revenu", "Time + revenue")}
            sub={tr(lang, "cost differential vs canal direct", "cost differential vs direct channel")}
            compact
          />
          <BlueprintBox
            id="recommendStrategy"
            title="method · angle · season"
            sub={tr(lang, "depuis breakdown scoring", "from scoring breakdown")}
            compact
          />
        </div>
      </div>
      <VBar />

      {/* ====================================================== */}
      {/* ÉTAGE 6 — Emails hyper-perso + envoi                    */}
      {/* ====================================================== */}
      <p
        className="mono uppercase tracking-[0.3em] mb-3"
        style={{ fontSize: 9, color: BP_GOLD }}
      >
        ▸ {tr(lang, "Étage 6 · Outreach", "Stage 6 · Outreach")}
      </p>
      <div className="flex flex-wrap gap-3 justify-center">
        <BlueprintBox
          id="buildEmailSequence"
          title={tr(lang, "3 mails ciselés", "3 crafted emails")}
          sub={tr(lang, "J0 · J+5 · J+12 · subject + body sur marketplace top", "D0 · D+5 · D+12 · subject + body on top marketplace")}
          compact
        />
        <BlueprintBox
          id="POST /api/emails/send"
          title={tr(lang, "Envoi", "Send")}
          sub="nodemailer · Google Workspace SMTP"
          compact
        />
        <BlueprintBox
          id="Pipeline"
          title="ready → in_seq → sent → replied"
          sub={tr(lang, "suivi des réponses", "reply tracking")}
          compact
        />
      </div>

      <p
        className="mono uppercase tracking-[0.3em] text-center mt-6"
        style={{ fontSize: 9, color: BP_DIM }}
      >
        Supabase = sellers + match_score + match_rationale + contact_email
      </p>
    </BlueprintCanvas>
  );
}

function TheLookArchitecture({ compact = false }: { compact?: boolean }) {
  // 12 CTEs réelles organisées en 5 lignes thématiques.
  // Catégorie : Fashion Hoodies & Sweatshirts · période = 2025-01-01 → today.
  // Source : src/lib/thelookQuery.ts
  const { lang } = useLang();
  const phases: {
    label: string;
    ctes: { id: string; name: string; note?: string }[];
  }[] = [
    {
      label: tr(lang, "Commercial · KPIs", "Commercial · KPIs"),
      ctes: [
        { id: "CTE 01", name: "commandes_periode" },
        { id: "CTE 02", name: "ventes_completes" },
        { id: "CTE 03", name: "kpis_commerciaux" },
        { id: "CTE 04", name: "croissance_mensuelle", note: "LAG" },
      ],
    },
    {
      label: tr(lang, "Stock · Rotation", "Stock · Rotation"),
      ctes: [
        { id: "CTE 05", name: "articles_vendus" },
        { id: "CTE 06", name: "stock_fin_mois" },
      ],
    },
    {
      label: tr(lang, "Acquisition · Canal", "Acquisition · Channel"),
      ctes: [
        { id: "CTE 07", name: "canaux_acquisition" },
        { id: "CTE 08", name: "top_canal_par_mois", note: "ROW_NUMBER" },
      ],
    },
    {
      label: tr(lang, "Comportement · Conversion", "Behavior · Conversion"),
      ctes: [
        { id: "CTE 09", name: "sessions" },
        { id: "CTE 10", name: "conversion_rebond" },
      ],
    },
    {
      label: tr(lang, "Géographie · Marché", "Geography · Market"),
      ctes: [
        { id: "CTE 11", name: "geo" },
        { id: "CTE 12", name: "top_geo_par_mois", note: "ROW_NUMBER" },
      ],
    },
  ];

  return (
    <BlueprintCanvas compact={compact}>
      {/* Bandeau context dataset */}
      <div
        className="flex flex-wrap items-center justify-center gap-2 mb-5"
        style={{ fontSize: 9 }}
      >
        <span
          className="mono uppercase tracking-widest"
          style={{ color: BP_DIM }}
        >
          {tr(lang, "dataset", "dataset")}
        </span>
        <span
          className="mono"
          style={{
            color: BP_TEXT,
            background: "rgba(140,106,30,0.08)",
            border: `1px solid ${BP_HAIR}`,
            padding: "2px 8px",
            borderRadius: 2,
          }}
        >
          bigquery-public-data.thelook_ecommerce
        </span>
        <span
          className="mono uppercase tracking-widest"
          style={{ color: BP_DIM }}
        >
          · {tr(lang, "catégorie", "category")}
        </span>
        <span
          className="mono"
          style={{ color: BP_TEXT, fontWeight: 600 }}
        >
          Fashion Hoodies &amp; Sweatshirts
        </span>
      </div>

      {/* 5 phases en colonnes empilées */}
      <div className="flex flex-col gap-4">
        {phases.map((phase) => (
          <div key={phase.label}>
            <p
              className="mono uppercase tracking-[0.3em] mb-2"
              style={{ fontSize: 9, color: BP_GOLD }}
            >
              ▸ {phase.label}
            </p>
            <div className="flex flex-wrap items-stretch gap-2">
              {phase.ctes.map((c, idx) => (
                <div key={c.id} className="flex items-stretch gap-2">
                  <div
                    style={{
                      background: "#FFFFFF",
                      border: `1px solid ${BP_HAIR}`,
                      borderRadius: 3,
                      padding: "8px 12px",
                      boxShadow: "0 4px 10px rgba(20,22,28,0.05)",
                      minWidth: 168,
                    }}
                  >
                    <p
                      className="mono uppercase tracking-widest"
                      style={{ fontSize: 9, color: BP_GOLD, marginBottom: 3 }}
                    >
                      {c.id}
                    </p>
                    <p
                      className="mono"
                      style={{
                        fontSize: 11,
                        color: BP_TEXT,
                        fontWeight: 600,
                        letterSpacing: "0.02em",
                      }}
                    >
                      {c.name}
                    </p>
                    {c.note && (
                      <p
                        className="mono uppercase tracking-widest mt-2 inline-block"
                        style={{
                          fontSize: 8,
                          color: BP_GOLD,
                          border: `1px solid ${BP_GOLD}`,
                          padding: "1px 6px",
                          borderRadius: 2,
                        }}
                      >
                        {c.note}
                      </p>
                    )}
                  </div>
                  {idx < phase.ctes.length - 1 && (
                    <span
                      className="mono self-center"
                      style={{ fontSize: 14, color: BP_GOLD }}
                    >
                      →
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Convergence vers le SELECT final */}
      <div className="flex flex-col items-center mt-6">
        <p
          className="mono uppercase tracking-[0.3em] mb-2"
          style={{ fontSize: 9, color: BP_DIM }}
        >
          ║ {tr(lang, "LEFT JOIN sur mois", "LEFT JOIN on month")}
        </p>
        <div
          style={{
            background: "#FFFFFF",
            border: `1px solid ${BP_GOLD}`,
            borderRadius: 3,
            padding: "12px 18px",
            boxShadow: "0 6px 14px rgba(140,106,30,0.10)",
            textAlign: "center",
          }}
        >
          <p
            className="mono uppercase tracking-widest"
            style={{ fontSize: 9, color: BP_GOLD, marginBottom: 4 }}
          >
            {tr(lang, "SELECT final", "Final SELECT")}
          </p>
          <p
            className="mono"
            style={{
              fontSize: 12,
              color: BP_TEXT,
              fontWeight: 700,
              letterSpacing: "0.02em",
            }}
          >
            {tr(lang, "tableau analytique mensuel · 23 colonnes", "monthly analytics table · 23 columns")}
          </p>
          <p
            className="mono mt-1"
            style={{ fontSize: 10, color: BP_DIM }}
          >
            ORDER BY {tr(lang, "mois", "month")} ASC
          </p>
        </div>
      </div>

      {/* Stack pills */}
      <div className="flex flex-wrap items-center gap-2 justify-center mt-6">
        {["BigQuery", "CTE × 12", "LAG", "ROW_NUMBER", "LEFT JOIN", "NULLIF"].map(
          (s) => (
            <span
              key={s}
              className="mono uppercase tracking-widest"
              style={{
                fontSize: 9,
                color: BP_TEXT,
                background: "#FFFFFF",
                border: `1px solid ${BP_HAIR}`,
                padding: "3px 8px",
                borderRadius: 2,
              }}
            >
              {s}
            </span>
          ),
        )}
      </div>
    </BlueprintCanvas>
  );
}

// Dispatcher : sélectionne l'architecture inline selon le slug du projet.
function ProjectArchitecture({
  slug,
  compact = false,
}: {
  slug: string;
  compact?: boolean;
}) {
  switch (slug) {
    case "energizer":
      return <EnergizerArchitecture compact={compact} />;
    case "mirakl":
      return <MiraklArchitecture compact={compact} />;
    case "thelook":
      return <TheLookArchitecture compact={compact} />;
    default:
      return null;
  }
}

// Lightbox plein écran pour zoomer photos ou architectures. Esc + clic
// backdrop pour fermer. Bloque le scroll body pendant l'overlay.
function ZoomOverlay({
  children,
  onClose,
  label,
}: {
  children: React.ReactNode;
  onClose: () => void;
  label?: string;
}) {
  const { lang } = useLang();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);
  return (
    <motion.div
      key="zoom"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(8,10,16,0.9)",
        backdropFilter: "blur(8px)",
        zIndex: 80,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "min(7vh, 56px)",
        cursor: "zoom-out",
      }}
    >
      {label && (
        <p
          className="mono uppercase tracking-[0.3em]"
          style={{
            position: "absolute",
            top: 26,
            left: 28,
            fontSize: 10,
            color: "rgba(245,245,244,0.55)",
          }}
        >
          {label}
        </p>
      )}
      <button
        type="button"
        onClick={onClose}
        className="mono uppercase tracking-widest"
        style={{
          position: "absolute",
          top: 22,
          right: 24,
          fontSize: 10,
          color: "rgba(245,245,244,0.8)",
          background: "transparent",
          border: "1px solid rgba(245,245,244,0.32)",
          padding: "6px 14px",
          borderRadius: 999,
          cursor: "pointer",
        }}
      >
        ✕ {tr(lang, "Fermer", "Close")} · Esc
      </button>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: "min(1100px, 92vw)",
          maxHeight: "86vh",
          overflow: "auto",
          cursor: "default",
        }}
      >
        {children}
      </div>
    </motion.div>
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
  const { lang } = useLang();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const lines = code.split("\n");
  const cteCount = (code.match(/^\w+ AS \(/gm) || []).length;
  const lineCount = lines.length;

  // Palette gris perle (alignée sur le ProjectOverlayCard parent). Le bloc
  // de code reste sur fond sombre pour la lisibilité de la coloration
  // syntaxique — c'est un "écran" embarqué dans la carte light, même logique
  // que les mini-apps Levels / Energizer / Mirakl.
  const GOLD = "#8C6A1E";
  const TEXT = "#1B1E25";
  const TEXT_DIM = "rgba(20,22,28,0.6)";
  const DIVIDER = "rgba(20,22,28,0.10)";

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
    <div className="mb-10">
      <div className="flex items-baseline justify-between mb-3 flex-wrap gap-3">
        <div>
          <p
            className="mono uppercase tracking-[0.3em] text-[10px]"
            style={{ color: TEXT_DIM }}
          >
            {tr(lang, "Requête SQL · audit complet", "SQL query · full audit")}
          </p>
          <p
            className="serif-italic text-sm mt-1"
            style={{ color: TEXT_DIM }}
          >
            {cteCount} CTEs · {lineCount} {tr(lang, "lignes", "lines")} · BigQuery
          </p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="mono uppercase tracking-widest text-[11px] transition"
            style={{
              color: TEXT,
              background: open ? "#EFE2C2" : "#F5EAD0",
              border: `1px solid ${GOLD}`,
              padding: "6px 12px",
              borderRadius: 999,
              lineHeight: 1,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#E9D9AE";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = open ? "#EFE2C2" : "#F5EAD0";
            }}
          >
            {open
              ? tr(lang, "Masquer la requête", "Hide query")
              : tr(lang, "Voir la requête", "Show query")} →
          </button>
          {open && (
            <button
              type="button"
              onClick={onCopy}
              className="mono uppercase tracking-widest text-[11px] transition"
              style={{
                color: copied ? GOLD : TEXT_DIM,
                borderBottom: `1px solid ${copied ? GOLD : DIVIDER}`,
                background: "transparent",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = GOLD;
                e.currentTarget.style.borderBottomColor = GOLD;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = copied ? GOLD : TEXT_DIM;
                e.currentTarget.style.borderBottomColor = copied
                  ? GOLD
                  : DIVIDER;
              }}
            >
              {copied ? tr(lang, "Copié", "Copied") : tr(lang, "Copier", "Copy")} ◇
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
              className="rounded-md overflow-hidden"
              style={{
                background:
                  "linear-gradient(180deg, #0E1014 0%, #0A0B0E 100%)",
                border: `1px solid ${DIVIDER}`,
                boxShadow:
                  "0 12px 32px rgba(8,10,16,0.18), inset 0 0 0 1px rgba(255,255,255,0.04)",
              }}
            >
              {/* Mini topbar embarquée, façon écran code dans la carte */}
              <div
                className="flex items-center justify-between px-4 py-2"
                style={{
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <span
                  className="mono uppercase text-[9px] tracking-[0.3em]"
                  style={{ color: "rgba(245,245,244,0.45)" }}
                >
                  query.sql · readonly
                </span>
                <span
                  className="mono uppercase text-[9px] tracking-[0.3em]"
                  style={{ color: "#A4F5C8" }}
                >
                  BigQuery
                </span>
              </div>
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
                    color: "rgba(236,230,214,0.88)",
                  }}
                  dangerouslySetInnerHTML={{ __html: html }}
                />
              </div>
            </div>
            {/* Fallback "voir en grand" reste sur le texte principal :
                bouton trash-style en bas, hors écran code, en cohérence
                avec les boutons de navigation de la carte. */}
            <p
              className="mono uppercase tracking-[0.3em] text-[10px] mt-3"
              style={{ color: TEXT_DIM }}
            >
              {cteCount} CTEs · ↳ scroll horizontal disponible
            </p>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Trait de fin pour boucler la section comme les autres tabs (moons,
          visuals…). Aligné gris perle. */}
      <div
        aria-hidden
        style={{
          marginTop: 18,
          height: 1,
          background: DIVIDER,
          width: "100%",
        }}
      />
      <span className="sr-only" style={{ color: TEXT }}>
        SQL viewer
      </span>
    </div>
  );
}

type ProjectTabKey = "overview" | "stack" | "demo" | "visuals" | "moons" | "sql";

function ProjectOverlayCard({ project, onClose }: { project: Project; onClose: () => void }) {
  const ui = useUi();
  const { lang } = useLang();
  const basePath = process.env.NEXT_PUBLIC_USE_BASE_PATH === "true" ? "/aurian-portfolio" : "";
  // Palette spatiale gris perle (alignée sur les bots) + or restreint
  // aux accents lisibles (chapitre, point final, onglet actif, liens).
  const GOLD = "#8C6A1E";
  const TEXT = "#1B1E25";
  const TEXT_DIM = "rgba(20,22,28,0.6)";
  const DIVIDER = "rgba(20,22,28,0.10)";

  // Progressive disclosure : tabs pour densifier sans colonnes désynchronisées.
  // Visuals (mosaïque polaroïds + schémas archi) & PDF s'ouvrent inline.
  const [activeTab, setActiveTab] = useState<ProjectTabKey>("overview");
  const [pdfOpen, setPdfOpen] = useState(false);
  // Lightbox : zoom photo (par src) ou zoom architecture (par slug).
  const [zoom, setZoom] = useState<
    | { kind: "photo"; src: string; index: number }
    | { kind: "archi" }
    | null
  >(null);

  const hasVisuals = !!project.visuals && project.visuals.length > 0;
  const hasMoons = !!project.moons && project.moons.length > 0;
  const hasSql = !!project.sqlQuery;
  // Mini-apps interactives — pour l'instant uniquement Levels. On l'ajoute
  // en tête (après Overview) pour la mettre en avant comme démo signature.
  const hasDemo =
    project.slug === "levels" ||
    project.slug === "energizer" ||
    project.slug === "mirakl";

  const tabs: Array<{ key: ProjectTabKey; label: string }> = [
    { key: "overview", label: ui.accomplishments },
    ...(hasDemo ? [{ key: "demo" as ProjectTabKey, label: "Demo" }] : []),
    { key: "stack", label: ui.stackLabel },
    ...(hasVisuals ? [{ key: "visuals" as ProjectTabKey, label: ui.visualsLabel }] : []),
    ...(hasMoons ? [{ key: "moons" as ProjectTabKey, label: ui.moonsLabel }] : []),
    ...(hasSql ? [{ key: "sql" as ProjectTabKey, label: "SQL" }] : []),
  ];

  // Label "retour" minimal sans toucher au i18n.
  const backLabel = ui.closeLabel.includes("Close") ? "← Back" : "← Retour";

  return (
    <>
      <AnimatePresence>
        {zoom && (
          <ZoomOverlay
            onClose={() => setZoom(null)}
            label={
              zoom.kind === "photo"
                ? `${project.title} · ${ui.visualsLabel} ${zoom.index + 1}`
                : `${project.title} · Architecture`
            }
          >
            {zoom.kind === "photo" ? (
              <div
                style={{
                  background: "#FFFFFF",
                  padding: 14,
                  borderRadius: 4,
                  boxShadow: "0 30px 80px rgba(0,0,0,0.5)",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`${basePath}${zoom.src}`}
                  alt={`${project.title} ${ui.visualsLabel} ${zoom.index + 1}`}
                  className="block"
                  style={{
                    maxWidth: "min(1000px, 88vw)",
                    maxHeight: "80vh",
                    objectFit: "contain",
                  }}
                />
              </div>
            ) : (
              <div style={{ minWidth: "min(900px, 88vw)" }}>
                <ProjectArchitecture slug={project.slug} compact={false} />
              </div>
            )}
          </ZoomOverlay>
        )}
      </AnimatePresence>
      <OverlayCloseBtn onClose={onClose} light />
      <header className="mb-8 sm:mb-10">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <span
            aria-hidden
            className="mono"
            style={{
              fontSize: 11,
              color: GOLD,
              letterSpacing: "0.2em",
            }}
          >
            ✦
          </span>
          <p
            className="mono uppercase tracking-[0.3em] text-[11px]"
            style={{ color: GOLD }}
          >
            {getChapterLabel(project.slug, ui)}.
          </p>
          {project.status && (
            <span
              className="mono uppercase tracking-widest text-[9px] px-2 py-1 rounded-full"
              style={{
                color:
                  project.status === "ongoing" ? "#1F6B3D" : TEXT_DIM,
                border:
                  project.status === "ongoing"
                    ? "1px solid rgba(31,107,61,0.45)"
                    : "1px solid rgba(20,22,28,0.18)",
                background:
                  project.status === "ongoing"
                    ? "rgba(31,107,61,0.08)"
                    : "rgba(20,22,28,0.04)",
              }}
            >
              {project.status === "ongoing" ? ui.statusOngoing : ui.statusDone}
            </span>
          )}
        </div>
        <h2
          className="serif-display leading-none mb-2"
          style={{ fontSize: "clamp(34px, 7vw, 96px)", color: TEXT }}
        >
          {project.title}
          {project.subtitle && (
            <span
              className="serif-italic ml-3"
              style={{
                fontSize: "0.42em",
                letterSpacing: "0.01em",
                color: TEXT_DIM,
              }}
            >
              {project.subtitle}
            </span>
          )}
          <span style={{ color: GOLD }}>.</span>
        </h2>
        {project.role && (
          <p
            className="mono uppercase tracking-widest text-[11px] mt-3"
            style={{ color: TEXT_DIM }}
          >
            {project.role}
          </p>
        )}
      </header>
      {/* Sépare le pitch du header — trait fin charbon + astérisque or mono */}
      <div
        aria-hidden
        className="flex items-center gap-3 mb-7 sm:mb-9"
      >
        <span
          style={{
            display: "inline-block",
            width: 28,
            height: 1,
            background: DIVIDER,
          }}
        />
        <span
          className="mono"
          style={{ fontSize: 10, color: GOLD, letterSpacing: "0.2em" }}
        >
          ✦
        </span>
        <span
          style={{
            display: "inline-block",
            flex: 1,
            height: 1,
            background: DIVIDER,
            maxWidth: 220,
          }}
        />
      </div>
      <p
        className="mono uppercase tracking-[0.3em] text-[10px] mb-3"
        style={{ color: TEXT_DIM }}
      >
        {ui.inFewWords}
      </p>
      <p
        className="serif-italic text-lg sm:text-2xl leading-snug mb-8 sm:mb-10 max-w-2xl"
        style={{ color: TEXT }}
      >
        {project.pitch}
      </p>
      <AnimatePresence mode="wait">
        {pdfOpen && project.pdfUrl ? (
          <motion.div
            key="pdf"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <button
              type="button"
              onClick={() => setPdfOpen(false)}
              className="mono uppercase tracking-widest text-[11px] mb-5 transition"
              style={{
                color: TEXT,
                borderBottom: `1px solid ${DIVIDER}`,
                paddingBottom: 2,
                background: "transparent",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = GOLD;
                e.currentTarget.style.borderBottomColor = GOLD;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = TEXT;
                e.currentTarget.style.borderBottomColor = DIVIDER;
              }}
            >
              {backLabel}
            </button>
            <div
              className="rounded-md overflow-hidden"
              style={{
                border: `1px solid ${DIVIDER}`,
                background: "#FFFFFF",
                boxShadow: "0 8px 24px rgba(20,22,28,0.06)",
              }}
            >
              <iframe
                src={`${basePath}${project.pdfUrl}#view=FitH`}
                title={`${project.title} — PDF`}
                className="w-full block"
                style={{ height: "min(70vh, 720px)", border: 0 }}
              />
            </div>
            <div className="mt-4">
              <a
                href={`${basePath}${project.pdfUrl}`}
                target="_blank"
                rel="noreferrer"
                className="mono uppercase tracking-widest text-[11px] transition"
                style={{
                  color: TEXT_DIM,
                  borderBottom: `1px solid ${DIVIDER}`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = GOLD;
                  e.currentTarget.style.borderBottomColor = GOLD;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = TEXT_DIM;
                  e.currentTarget.style.borderBottomColor = DIVIDER;
                }}
              >
                PDF ↗
              </a>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="tabs"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            {/* Barre d'onglets — pill or actif + halo discret */}
            <div
              className="flex flex-wrap gap-2 mb-6 sm:mb-8 pb-4"
              style={{ borderBottom: `1px solid ${DIVIDER}` }}
            >
              {tabs.map((t) => {
                const active = activeTab === t.key;
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setActiveTab(t.key)}
                    className="mono uppercase tracking-widest text-[10px] px-3 py-1.5 rounded-full transition-colors"
                    style={{
                      color: active ? GOLD : TEXT_DIM,
                      border: active
                        ? `1px solid ${GOLD}`
                        : `1px solid ${DIVIDER}`,
                      background: active
                        ? "rgba(232,199,122,0.12)"
                        : "transparent",
                      boxShadow: active
                        ? "0 0 14px rgba(232,199,122,0.28)"
                        : "none",
                    }}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="mb-8 sm:mb-10"
              >
                {activeTab === "overview" && (
                  <ul className="space-y-3 max-w-2xl">
                    {project.achievements.map((a, i) => (
                      <li
                        key={i}
                        className="flex gap-3 text-base leading-snug"
                        style={{ color: TEXT }}
                      >
                        <span
                          aria-hidden
                          className="shrink-0 mono"
                          style={{
                            color: GOLD,
                            fontSize: 14,
                            lineHeight: "1",
                            marginTop: 6,
                            width: 10,
                            textAlign: "center",
                          }}
                        >
                          ·
                        </span>
                        <span>{a}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {activeTab === "demo" && project.slug === "levels" && (
                  <LevelsMiniApp />
                )}

                {activeTab === "demo" && project.slug === "energizer" && (
                  <EnergizerMiniApp />
                )}

                {activeTab === "demo" && project.slug === "mirakl" && (
                  <MiraklMiniApp />
                )}

                {activeTab === "stack" && (
                  <div className="flex flex-wrap gap-2">
                    {project.stack.map((s) => (
                      <TechPill key={s} label={s} light />
                    ))}
                  </div>
                )}

                {activeTab === "visuals" && project.visuals && (() => {
                  // Photos : tout sauf .svg (qui était l'ancien schéma sombre).
                  // L'architecture n'est plus tirée du .svg : elle est
                  // recréée inline en composant gris perle / or via
                  // ProjectArchitecture, dispatché par slug. Le .svg
                  // d'origine est ignoré côté rendu.
                  const photos = project.visuals!.filter(
                    (v) => !v.toLowerCase().endsWith(".svg"),
                  );
                  const hasArchi =
                    project.slug === "energizer" ||
                    project.slug === "mirakl" ||
                    project.slug === "thelook";
                  const ROTATIONS = [-2, 1.5, -1, 2, 0, -1.5, 1];
                  return (
                    <div className="space-y-12">
                      {photos.length > 0 && (
                        <div>
                          <p
                            className="mono uppercase tracking-[0.3em] text-[10px] mb-5"
                            style={{ color: TEXT_DIM }}
                          >
                            ✦ Photos · {photos.length}
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 px-2 py-2">
                            {photos.map((src, i) => (
                              <button
                                type="button"
                                key={src}
                                onClick={() =>
                                  setZoom({ kind: "photo", src, index: i })
                                }
                                aria-label={`Zoom photo ${i + 1}`}
                                style={{
                                  background: "#FFFFFF",
                                  border: `1px solid ${DIVIDER}`,
                                  borderRadius: 4,
                                  padding: "10px 10px 30px 10px",
                                  boxShadow:
                                    "0 14px 30px rgba(20,22,28,0.10), 0 2px 4px rgba(20,22,28,0.06)",
                                  transform: `rotate(${ROTATIONS[i % ROTATIONS.length]}deg)`,
                                  transition: "transform 0.35s ease",
                                  cursor: "zoom-in",
                                  textAlign: "left",
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.transform =
                                    "rotate(0deg) scale(1.02)";
                                  e.currentTarget.style.zIndex = "5";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.transform = `rotate(${ROTATIONS[i % ROTATIONS.length]}deg)`;
                                  e.currentTarget.style.zIndex = "1";
                                }}
                              >
                                <div
                                  style={{
                                    aspectRatio: "4 / 3",
                                    background: "#F4F6F9",
                                    overflow: "hidden",
                                    borderRadius: 2,
                                  }}
                                >
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={`${basePath}${src}`}
                                    alt={`${project.title} ${ui.visualsLabel} ${i + 1}`}
                                    className="w-full h-full"
                                    style={{ objectFit: "contain" }}
                                    loading="lazy"
                                  />
                                </div>
                                <div className="flex items-center justify-between mt-3">
                                  <span
                                    className="mono uppercase tracking-widest"
                                    style={{ fontSize: 9, color: GOLD }}
                                  >
                                    ⤢ zoom
                                  </span>
                                  <span
                                    className="mono uppercase tracking-widest"
                                    style={{ fontSize: 9, color: TEXT_DIM }}
                                  >
                                    {String(i + 1).padStart(2, "0")} /{" "}
                                    {String(photos.length).padStart(2, "0")}
                                  </span>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      {hasArchi && (
                        <div>
                          <div className="flex items-baseline justify-between mb-4 gap-3 flex-wrap">
                            <p
                              className="mono uppercase tracking-[0.3em] text-[10px]"
                              style={{ color: GOLD }}
                            >
                              § Architecture
                            </p>
                            <button
                              type="button"
                              onClick={() => setZoom({ kind: "archi" })}
                              className="mono uppercase tracking-widest transition"
                              style={{
                                fontSize: 10,
                                color: TEXT,
                                background: "#F5EAD0",
                                border: `1px solid ${GOLD}`,
                                padding: "5px 11px",
                                borderRadius: 999,
                                cursor: "zoom-in",
                                lineHeight: 1,
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = "#E9D9AE";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = "#F5EAD0";
                              }}
                            >
                              ⤢ {tr(lang, "Voir en grand", "Zoom in")}
                            </button>
                          </div>
                          <div
                            onClick={() => setZoom({ kind: "archi" })}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                setZoom({ kind: "archi" });
                              }
                            }}
                            style={{ cursor: "zoom-in" }}
                          >
                            <ProjectArchitecture
                              slug={project.slug}
                              compact
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {activeTab === "moons" && project.moons && (
                  <div className="grid md:grid-cols-2 gap-5">
                    {project.moons.map((m) => {
                      const glyph =
                        project.slug === "music-agency"
                          ? BEYOND_AGENT_GLYPHS[m.name]
                          : undefined;
                      return (
                      <div
                        key={m.name}
                        className="rounded-md p-4 transition-colors"
                        style={{ border: `1px solid ${DIVIDER}` }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = `${GOLD}88`;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = DIVIDER;
                        }}
                      >
                        <div className="flex items-center gap-3 mb-1">
                          {glyph && (
                            <span
                              aria-hidden
                              className="mono shrink-0 inline-flex items-center justify-center"
                              style={{
                                width: 28,
                                height: 28,
                                borderRadius: 999,
                                background: "rgba(140,106,30,0.08)",
                                border: "1px solid rgba(140,106,30,0.32)",
                                color: GOLD,
                                fontSize: 14,
                                lineHeight: 1,
                              }}
                            >
                              {glyph}
                            </span>
                          )}
                          <p
                            className="serif-display"
                            style={{ fontSize: "20px", color: TEXT }}
                          >
                            {m.name}
                          </p>
                        </div>
                        <p
                          className="serif-italic text-sm mb-3 leading-snug"
                          style={{ color: TEXT_DIM }}
                        >
                          {m.pitch}
                        </p>
                        <ul className="space-y-1.5">
                          {m.bullets.map((b, i) => (
                            <li
                              key={i}
                              className="flex gap-2 text-sm leading-snug"
                              style={{ color: TEXT }}
                            >
                              <span
                                aria-hidden
                                className="shrink-0 mono"
                                style={{
                                  color: GOLD,
                                  fontSize: 13,
                                  lineHeight: "1",
                                  marginTop: 4,
                                  width: 8,
                                  textAlign: "center",
                                }}
                              >
                                ·
                              </span>
                              <span>{b}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      );
                    })}
                  </div>
                )}

                {activeTab === "sql" && project.sqlQuery && (
                  <SqlViewer code={project.sqlQuery} />
                )}
              </motion.div>
            </AnimatePresence>

            {(project.liveUrl || project.repoUrl || project.pdfUrl) && (
              <div
                className="flex flex-wrap gap-6 pt-6"
                style={{ borderTop: `1px solid ${DIVIDER}` }}
              >
                {project.liveUrl && (
                  <a
                    href={project.liveUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mono uppercase tracking-widest text-[11px] hover:opacity-80"
                    style={{
                      color: GOLD,
                      borderBottom: `1px solid ${GOLD}`,
                    }}
                  >
                    {ui.seeLive}
                  </a>
                )}
                {project.repoUrl && (
                  <a
                    href={project.repoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mono uppercase tracking-widest text-[11px] transition"
                    style={{
                      color: TEXT_DIM,
                      borderBottom: `1px solid ${DIVIDER}`,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = GOLD;
                      e.currentTarget.style.borderBottomColor = GOLD;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = TEXT_DIM;
                      e.currentTarget.style.borderBottomColor = DIVIDER;
                    }}
                  >
                    {ui.seeGithub}
                  </a>
                )}
                {project.pdfUrl && (
                  <button
                    type="button"
                    onClick={() => setPdfOpen(true)}
                    className="mono uppercase tracking-widest text-[11px] transition"
                    style={{
                      color: TEXT_DIM,
                      borderBottom: `1px solid ${DIVIDER}`,
                      background: "transparent",
                      padding: 0,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = GOLD;
                      e.currentTarget.style.borderBottomColor = GOLD;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = TEXT_DIM;
                      e.currentTarget.style.borderBottomColor = DIVIDER;
                    }}
                  >
                    PDF →
                  </button>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
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
          {/* Soft skills — cross-cutting families (primary) */}
          <div>
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

          {/* Paires de qualités par planète (secondaire) */}
          <div className="pt-8 border-t border-hairline">
            <p className="serif-italic text-text-muted text-lg max-w-xl mb-6">
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
  // Carte projet (clic planète) : panel light gris perle, accent or foncé.
  // Autres types (quality / stack / info / identity) : style sombre d'origine.
  const isPlanetCard = openCard?.type === "planet";
  return (
    <AnimatePresence>
      {openCard && (
        <motion.div
          key="overlay-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-50 grid place-items-center backdrop-blur-md p-3 sm:p-6"
          style={{
            backgroundColor: isPlanetCard
              ? "rgba(15,17,22,0.55)"
              : "rgba(7,8,10,0.80)",
          }}
        >
          <motion.article
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-3xl overflow-y-auto rounded-lg p-5 sm:p-10 md:p-16 shadow-2xl"
            style={{
              maxHeight: "92vh",
              // Fond gris perle spatial — aligné sur les bots (Chatbot,
              // PlanetPresenter). L'or reste l'accent lisible (titres, liens,
              // pills d'onglet) mais le fond n'est plus chaud champagne.
              background: isPlanetCard
                ? "linear-gradient(180deg, #F4F6F9 0%, #DDE1E7 100%)"
                : "rgba(7,8,10,0.97)",
              border: isPlanetCard
                ? "1px solid rgba(20,22,28,0.12)"
                : "1px solid #1F2521",
              boxShadow: isPlanetCard
                ? "0 24px 60px rgba(8,10,16,0.45), inset 0 1px 0 rgba(255,255,255,0.65), inset 0 -1px 0 rgba(20,22,28,0.06)"
                : undefined,
              color: isPlanetCard ? "#1B1E25" : undefined,
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
// IdentityStar — calm polar star (Aurian), pinned to camera.x top-center
// ---------------------------------------------------------------------------
interface IdentityStarProps {
  onSelect: () => void;
}

// Phases fixes des 8 flammes orbitales — réparties uniformément en angle
// avec un léger jitter de rayon pour un effet organique.
const FLAME_PHASES: { angle: number; rOff: number; sp: number }[] = Array.from(
  { length: 8 },
  (_, i) => ({
    angle: (i / 8) * Math.PI * 2,
    rOff: (i % 3) * 0.08,
    sp: 0.6 + (i % 4) * 0.18,
  }),
);
const FLAME_GEOM = new THREE.SphereGeometry(0.08, 10, 10);

// Surface stellaire avec granulation plasma — partagée (instance unique).
const IDENTITY_STAR_MATERIAL = buildIdentityStarMaterial();
const IDENTITY_STAR_SURFACE_GEOM = new THREE.SphereGeometry(0.9, 96, 96);

// Prominences (arcs de plasma) — 6 boucles partant et revenant à la
// surface, signature d'un soleil actif. Chacune a son angle/rayon/vitesse.
const PROMINENCE_PHASES: {
  angle: number;
  tilt: number;
  speed: number;
  scale: number;
}[] = Array.from({ length: 6 }, (_, i) => ({
  angle: (i / 6) * Math.PI * 2 + (i % 2) * 0.4,
  tilt: ((i * 37) % 180) * (Math.PI / 180),
  speed: 0.4 + (i % 3) * 0.18,
  scale: 0.95 + (i % 4) * 0.1,
}));
const PROMINENCE_GEOM = new THREE.TorusGeometry(0.42, 0.018, 8, 64, Math.PI);

function IdentityStar({ onSelect }: IdentityStarProps) {
  const { camera } = useThree();
  const groupRef = useRef<THREE.Group>(null);
  const innerRef = useRef<THREE.Mesh>(null);
  const spikesRef = useRef<THREE.Group>(null);
  const haloRef = useRef<THREE.Mesh>(null);
  const haloMatRef = useRef<THREE.MeshBasicMaterial>(null);
  // Couches corona supplémentaires pour la profondeur atmosphérique.
  const corona2Ref = useRef<THREE.Mesh>(null);
  const corona2MatRef = useRef<THREE.MeshBasicMaterial>(null);
  const corona3Ref = useRef<THREE.Mesh>(null);
  const corona3MatRef = useRef<THREE.MeshBasicMaterial>(null);
  const flamesRef = useRef<THREE.Group>(null);
  const prominencesRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    document.body.style.cursor = hovered ? "pointer" : "auto";
    return () => {
      document.body.style.cursor = "auto";
    };
  }, [hovered]);

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;

    if (groupRef.current) {
      const camX = (camera as THREE.PerspectiveCamera).position.x;
      groupRef.current.position.x +=
        (camX - groupRef.current.position.x) * 0.08;
    }
    // Rotation très lente de la surface — la granulation est animée par le
    // shader (cellules qui dérivent), donc ici juste un drift discret pour
    // ne pas figer la sphère.
    if (innerRef.current) {
      innerRef.current.rotation.y += dt * 0.04;
      innerRef.current.rotation.x += dt * 0.012;
    }
    if (spikesRef.current) {
      spikesRef.current.rotation.z += dt * 0.05;
    }

    // Surface stellaire — uniforms du shader. Intensité plafonnée à 1.0
    // pour ne jamais alimenter le bloom en shimmer (sortie shader clampée).
    const slowU = 0.5 + 0.5 * Math.sin(t * 1.0);
    IDENTITY_STAR_MATERIAL.uniforms.uTime.value = t;
    IDENTITY_STAR_MATERIAL.uniforms.uIntensity.value =
      (hovered ? 1.0 : 0.95) + slowU * 0.04;

    // Corona 1 — scale animé, opacité quasi-stable (variation très douce
    // pour ne pas faire clignoter le bloom).
    if (haloRef.current && haloMatRef.current) {
      const breathe = 0.5 + 0.5 * Math.sin(t * 1.0);
      const sc = 1.32 + breathe * 0.08;
      haloRef.current.scale.setScalar(sc);
      haloMatRef.current.opacity = 0.34 + breathe * 0.04;
    }
    // Corona 2 (médiane) — scale doux, opacité presque fixe.
    if (corona2Ref.current && corona2MatRef.current) {
      const breathe2 = 0.5 + 0.5 * Math.sin(t * 0.8 + 1.2);
      const sc = 1.65 + breathe2 * 0.10;
      corona2Ref.current.scale.setScalar(sc);
      corona2MatRef.current.opacity = 0.20 + breathe2 * 0.03;
    }
    // Corona 3 (lointaine) — quasi-statique en opacité, juste un drift
    // de scale très lent.
    if (corona3Ref.current && corona3MatRef.current) {
      const breathe3 = 0.5 + 0.5 * Math.sin(t * 0.55 + 2.4);
      const sc = 2.1 + breathe3 * 0.12;
      corona3Ref.current.scale.setScalar(sc);
      corona3MatRef.current.opacity = 0.09 + breathe3 * 0.02;
    }

    // Flammes orbitales — mouvement circulaire conservé, mais opacité
    // lissée (plus de flick rapide qui déclenche le shimmer bloom).
    if (flamesRef.current) {
      flamesRef.current.rotation.z += dt * 0.25;
      flamesRef.current.children.forEach((child, i) => {
        const p = FLAME_PHASES[i];
        if (!p) return;
        const r = 1.15 + p.rOff + Math.sin(t * p.sp + p.angle * 2) * 0.12;
        child.position.x = Math.cos(p.angle) * r;
        child.position.y = Math.sin(p.angle) * r;
        const mesh = child as THREE.Mesh;
        const mat = mesh.material as THREE.MeshBasicMaterial;
        if (mat) {
          // Variation lente et faible amplitude.
          const slow = 0.5 + 0.5 * Math.sin(t * (0.8 + p.sp * 0.3) + p.angle);
          mat.opacity = 0.55 + slow * 0.20;
        }
      });
    }

    // Prominences (arcs de plasma) — scale qui respire doucement,
    // opacité quasi-stable pour ne pas clignoter avec le bloom.
    if (prominencesRef.current) {
      prominencesRef.current.children.forEach((child, i) => {
        const p = PROMINENCE_PHASES[i];
        if (!p) return;
        const arc = child as THREE.Mesh;
        const breath = 0.5 + 0.5 * Math.sin(t * (p.speed * 0.6) + p.angle * 1.5);
        const sc = p.scale * (0.92 + breath * 0.18);
        arc.scale.setScalar(sc);
        const mat = arc.material as THREE.MeshBasicMaterial;
        if (mat) {
          mat.opacity = 0.40 + breath * 0.10;
        }
      });
    }
  });

  return (
    <group ref={groupRef} position={[-12, 5, -2]}>
      <pointLight
        color="#FF7A2E"
        intensity={hovered ? 4.5 : 2.8}
        distance={12}
        decay={2}
      />

      {/* Corona 3 — halo lointain très diffus, donne l'ampleur du soleil */}
      <mesh ref={corona3Ref} scale={2.1}>
        <sphereGeometry args={[0.9, 32, 32]} />
        <meshBasicMaterial
          ref={corona3MatRef}
          color="#FF7A2E"
          transparent
          opacity={0.08}
          side={THREE.BackSide}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {/* Corona 2 — couche médiane, transition entre proche et lointain */}
      <mesh ref={corona2Ref} scale={1.65}>
        <sphereGeometry args={[0.9, 32, 32]} />
        <meshBasicMaterial
          ref={corona2MatRef}
          color="#FF8A3A"
          transparent
          opacity={0.18}
          side={THREE.BackSide}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {/* Corona 1 — proche surface, respire avec le heartbeat principal */}
      <mesh ref={haloRef} scale={1.32}>
        <sphereGeometry args={[0.9, 32, 32]} />
        <meshBasicMaterial
          ref={haloMatRef}
          color="#FFB070"
          transparent
          opacity={0.32}
          side={THREE.BackSide}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {/* Surface stellaire — shader granulation plasma (cellules de
          convection Voronoi + flicker + limb glow). Réaliste type
          photosphère solaire, palette inchangée. */}
      <mesh
        ref={innerRef}
        geometry={IDENTITY_STAR_SURFACE_GEOM}
        material={IDENTITY_STAR_MATERIAL}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
      />

      {/* Hitbox invisible élargie — sur mobile, la sphère 0.9 est trop
          petite pour un doigt. On étend la zone tactile jusqu'à la corona
          médiane (~1.6) avec un mesh transparent (visible: false →
          aucun coût render, juste le raycaster en profite). */}
      <mesh
        visible={false}
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
        <sphereGeometry args={[1.6, 16, 16]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* Prominences (arcs de plasma) — boucles éjectées de la surface,
          signature des éruptions solaires. Chacune avec son tilt 3D propre
          pour éviter l'aspect plat. */}
      <group ref={prominencesRef}>
        {PROMINENCE_PHASES.map((p, i) => (
          <mesh
            key={`prom-${i}`}
            geometry={PROMINENCE_GEOM}
            position={[
              Math.cos(p.angle) * 0.92,
              Math.sin(p.angle) * 0.92,
              0,
            ]}
            rotation={[p.tilt, p.angle, p.angle + Math.PI / 2]}
          >
            <meshBasicMaterial
              color={i % 2 === 0 ? "#FFB070" : "#FF8A3A"}
              transparent
              opacity={0.4}
              toneMapped={false}
              depthWrite={false}
            />
          </mesh>
        ))}
      </group>

      {/* Flammes orbitales — petits points de plasma qui circulent */}
      <group ref={flamesRef}>
        {FLAME_PHASES.map((_, i) => (
          <mesh key={i} geometry={FLAME_GEOM}>
            <meshBasicMaterial
              color={i % 2 === 0 ? "#FFB070" : "#FF7A2E"}
              transparent
              opacity={0.7}
              toneMapped={false}
              depthWrite={false}
            />
          </mesh>
        ))}
      </group>

      {/* Star spikes — 4 rayons fins tapered (cylindres effilés) au lieu
          de boxes carrées : les pointes deviennent plus organiques
          (lens-flare-like) et raccord avec le look solaire réaliste. */}
      <group ref={spikesRef}>
        {[0, Math.PI / 4, Math.PI / 2, (3 * Math.PI) / 4].map((rot, i) => (
          <mesh key={i} rotation={[0, 0, rot]}>
            <cylinderGeometry args={[0.002, 0.05, 2.4, 8, 1, false]} />
            <meshBasicMaterial
              color="#FFE6CC"
              transparent
              opacity={0.7}
              toneMapped={false}
              depthWrite={false}
            />
          </mesh>
        ))}
      </group>

    </group>
  );
}

// ---------------------------------------------------------------------------
// ResponsiveCamera — ajuste le FOV selon l'aspect ratio du viewport.
// Sur portrait étroit (téléphone), un FOV fixe de 55 rend les planètes
// trop grosses car la dimension dominante devient la hauteur. On élargit
// progressivement le FOV pour reculer la perception et rendre les
// planètes proportionnées.
// ---------------------------------------------------------------------------
function ResponsiveCamera() {
  const { camera, size } = useThree();
  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    const aspect = size.width / Math.max(1, size.height);
    let fov: number;
    if (aspect < 0.6) fov = 78;           // portrait étroit (téléphones standards)
    else if (aspect < 0.85) fov = 68;     // portrait large / petite tablette
    else if (aspect < 1.2) fov = 60;      // ~square / landscape mobile
    else fov = 55;                         // desktop / tablette landscape
    if (Math.abs(cam.fov - fov) > 0.1) {
      cam.fov = fov;
      cam.updateProjectionMatrix();
    }
  }, [camera, size.width, size.height]);
  return null;
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

  useFrame(() => {
    const tx = index * 6 - 12;
    camTarget.current.set(tx, 0, 6);
    lookTarget.current.set(tx, 0, 0);
    const distance = Math.abs(
      (camera as THREE.PerspectiveCamera).position.x - tx
    );
    const lerpFactor = distance > 12 ? 0.18 : 0.06;
    (camera as THREE.PerspectiveCamera).position.lerp(camTarget.current, lerpFactor);
    camera.lookAt(lookTarget.current);
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
        if (p.slug === "levels") {
          return (
            <LevelsPlanet
              key={p.slug}
              posX={i * 6 - 12}
              isFocused={i === index}
              onSelectPlanet={() => onSelectPlanet(p)}
            />
          );
        }
        if (p.slug === "mirakl") {
          return (
            <MiraklPlanet
              key={p.slug}
              posX={i * 6 - 12}
              isFocused={i === index}
              onSelectPlanet={() => onSelectPlanet(p)}
            />
          );
        }
        if (p.slug === "music-agency") {
          return (
            <BeyondPlanet
              key={p.slug}
              posX={i * 6 - 12}
              isFocused={i === index}
              onSelectPlanet={() => onSelectPlanet(p)}
            />
          );
        }
        if (p.slug === "thelook") {
          return (
            <TheLookPlanet
              key={p.slug}
              posX={i * 6 - 12}
              isFocused={i === index}
              onSelectPlanet={() => onSelectPlanet(p)}
            />
          );
        }
        return null;
      })}

      <IdentityStar onSelect={() => onSelectStar("identity")} />
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
// Intro overlay — glitch terminal + warp dimensionnel
// ---------------------------------------------------------------------------
// Phases timeline (exit sequence ~1.7s total) :
//   intro    — typewriter calme, scanlines + tracking band en fond, micro-
//              chromatic pulses sur le titre (vie ambiante).
//   preWarp  — 0 → 350ms : glitch monte. RGB split brutal sur le titre,
//              scanlines plus denses, flash noir 1× pour casser le rythme.
//   warp     — 350 → 1050ms : hyperspace. 96 streaks radiales accélèrent
//              depuis le centre, le contenu dissout en chromatic stretch,
//              radial blur via box-shadow + scale.
//   rip      — 1050 → 1700ms : les deux moitiés se déchirent (existant
//              conservé mais amplifié — shockwave thread-mint + flash plus
//              violent).
// ---------------------------------------------------------------------------

// Scanlines drifting top→bottom — fond CSS, animé par background-position.
function Scanlines({ intensity = 1 }: { intensity?: number }) {
  return (
    <motion.div
      aria-hidden
      className="absolute inset-0 pointer-events-none"
      initial={{ opacity: 0, backgroundPositionY: 0 }}
      animate={{
        opacity: 0.18 * intensity,
        backgroundPositionY: [0, 200],
      }}
      transition={{
        opacity: { duration: 0.4, ease: "easeOut" },
        backgroundPositionY: {
          duration: 6 / Math.max(0.5, intensity),
          repeat: Infinity,
          ease: "linear",
        },
      }}
      style={{
        backgroundImage:
          "repeating-linear-gradient(0deg, rgba(236,230,214,0.10) 0px, rgba(236,230,214,0.10) 1px, transparent 1px, transparent 3px)",
        mixBlendMode: "screen" as const,
      }}
    />
  );
}

// VHS tracking band — bande horizontale qui scanne tout l'écran ~3-4s.
function TrackingBand() {
  return (
    <motion.div
      aria-hidden
      className="absolute pointer-events-none"
      initial={{ top: "-12%", opacity: 0 }}
      animate={{
        top: ["-12%", "112%"],
        opacity: [0, 0.7, 0.7, 0],
      }}
      transition={{
        duration: 0.7,
        times: [0, 0.1, 0.9, 1],
        repeat: Infinity,
        repeatDelay: 3.6,
        ease: "easeIn",
      }}
      style={{
        left: 0,
        right: 0,
        height: 22,
        background:
          "linear-gradient(180deg, transparent 0%, rgba(236,230,214,0.18) 25%, rgba(164,245,200,0.22) 50%, rgba(236,230,214,0.18) 75%, transparent 100%)",
        mixBlendMode: "screen" as const,
        filter: "blur(0.6px)",
      }}
    />
  );
}

// Hyperspace radial streaks — 96 lignes accélèrent depuis le centre vers
// l'extérieur. Activé pendant la phase warp. Couleurs tirées de la palette
// portfolio (crème + thread mint + bleu froid).
function HyperspaceStreaks() {
  const streaks = useMemo(() => {
    const N = 96;
    return Array.from({ length: N }).map((_, i) => {
      const angle = (i / N) * Math.PI * 2 + ((i * 0.137) % 0.08);
      const len = 220 + ((i * 53) % 280);
      const delay = ((i * 0.011) % 0.18);
      const hue = i % 8;
      const tint =
        hue < 5
          ? "236,230,214" // crème
          : hue === 5
            ? "164,245,200" // mint thread
            : "186,210,230"; // bleu froid
      return { angle, len, delay, tint };
    });
  }, []);
  return (
    <div className="fixed inset-0 z-[62] pointer-events-none overflow-hidden">
      {streaks.map((s, i) => {
        const deg = (s.angle * 180) / Math.PI;
        return (
          <div
            key={i}
            className="absolute left-1/2 top-1/2"
            style={{
              transform: `rotate(${deg}deg)`,
              transformOrigin: "0 0",
            }}
          >
            <motion.div
              initial={{ x: 18, opacity: 0, scaleX: 0.2 }}
              animate={{
                x: [18, 80, 540 + s.len],
                opacity: [0, 1, 0],
                scaleX: [0.2, 1.0, 3.6],
              }}
              transition={{
                duration: 0.75,
                delay: s.delay,
                times: [0, 0.25, 1],
                ease: [0.32, 0.55, 0.2, 1],
              }}
              style={{
                width: s.len,
                height: 1.4,
                marginTop: -0.7,
                borderRadius: 999,
                background: `linear-gradient(90deg, transparent 0%, rgba(${s.tint},0.95) 60%, rgba(${s.tint},0.15) 100%)`,
                transformOrigin: "0 50%",
                mixBlendMode: "screen" as const,
                filter: "blur(0.35px)",
              }}
            />
          </div>
        );
      })}
      {/* Vignette radiale qui assombrit les bords pendant le warp pour donner
          l'effet "tunnel". */}
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.85, 0.6] }}
        transition={{ duration: 0.7, times: [0, 0.4, 1] }}
        style={{
          background:
            "radial-gradient(ellipse 50% 50% at center, transparent 0%, rgba(7,8,10,0.7) 70%, rgba(7,8,10,0.95) 100%)",
        }}
      />
    </div>
  );
}

type IntroPhase = "intro" | "preWarp" | "warp" | "rip";

function IntroOverlay({ onDismiss }: { onDismiss: () => void }) {
  const ui = useUi();
  const INTRO = "Aurian";
  const TITLE = ui.worldTitle;
  const intro = useTypewriter(INTRO, { min: 150, max: 280, startDelay: 800 });
  const title = useTypewriter(TITLE, { min: 180, max: 340, startDelay: 2800 });
  const introDone = intro.length >= INTRO.length;
  const titleDone = title.length >= TITLE.length;

  const [phase, setPhase] = useState<IntroPhase>("intro");
  const isExiting = phase !== "intro";

  const triggerExit = useCallback(() => {
    setPhase((prev) => {
      if (prev !== "intro") return prev;
      // preWarp 0→350 ; warp 350→1050 ; rip 1050→1700 ; dismiss à 1700.
      window.setTimeout(() => setPhase("warp"), 350);
      window.setTimeout(() => setPhase("rip"), 1050);
      window.setTimeout(onDismiss, 1700);
      return "preWarp";
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

  // Chromatic text-shadow par phase — RGB split qui s'amplifie à l'exit.
  const titleChromatic =
    phase === "intro"
      ? "0 0 60px rgba(236,230,214,0.08)"
      : phase === "preWarp"
        ? "-3px 0 rgba(255,90,90,0.85), 3px 0 rgba(90,220,255,0.85), 0 0 32px rgba(236,230,214,0.45)"
        : phase === "warp"
          ? "-8px 0 rgba(255,90,90,0.95), 8px 0 rgba(90,220,255,0.95), 0 0 48px rgba(236,230,214,0.6)"
          : "-14px 0 rgba(255,90,90,1), 14px 0 rgba(90,220,255,1), 0 0 80px rgba(236,230,214,0.8)";

  // Opacité globale du contenu intro — dissout pendant warp/rip.
  const innerOpacity =
    phase === "intro" || phase === "preWarp"
      ? 1
      : phase === "warp"
        ? 0.35
        : 0;
  const innerScale =
    phase === "warp" ? 1.04 : phase === "rip" ? 1.12 : 1;

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

      {/* Scanlines drifting — vie ambiante, s'amplifie au preWarp. */}
      <Scanlines intensity={phase === "preWarp" ? 2.8 : phase === "warp" ? 3.5 : 1} />

      {/* Tracking band VHS — passe toutes les ~4s. */}
      {phase === "intro" && <TrackingBand />}

      {/* Wrapper qui dissout / scale pendant warp + rip. */}
      <motion.div
        className="relative flex flex-col items-center"
        animate={{ opacity: innerOpacity, scale: innerScale }}
        transition={{ duration: phase === "rip" ? 0.4 : 0.55, ease: [0.4, 0, 0.6, 1] }}
      >
      {/* "Aurian." — letter opacity reveals (no width shift) + curseur
          clignotant en bout de ligne pendant la frappe (terminal-classic,
          square-wave, pas de glow néon pour rester dans le ton serif). */}
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
        {/* Curseur toujours rendu pour stabiliser le line-box : on ne joue
            que l'opacité (blink tant que le titre n'est pas démarré, fade-out
            sinon). Sans ça, le démontage du curseur faisait redresser la ligne
            au moment où "Univers" commençait à s'écrire. */}
        <motion.span
          aria-hidden
          initial={{ opacity: 0 }}
          animate={{ opacity: title.length === 0 ? [1, 1, 0, 0] : 0 }}
          transition={
            title.length === 0
              ? {
                  duration: 0.9,
                  repeat: Infinity,
                  ease: "linear",
                  times: [0, 0.5, 0.5, 1],
                }
              : { duration: 0.18, ease: "linear" }
          }
          style={{
            display: "inline-block",
            width: "0.06em",
            height: "0.95em",
            background: "rgba(236,230,214,0.7)",
            marginLeft: "0.18em",
            verticalAlign: "baseline",
            transform: "translateY(0.08em)",
          }}
        />
      </p>

      {/* "Univers." — chromatic RGB split qui s'amplifie par phase.
          Pendant intro : pulse subtil. Au preWarp : RGB split brutal
          (-3/+3 px). Au warp : stretch (-8/+8). Au rip : (-14/+14).
          Curseur disparaît à l'amorce de l'exit pour laisser la place. */}
      <motion.h1
        className="serif-display text-center relative"
        animate={{ textShadow: titleChromatic }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        style={{
          fontSize: "clamp(64px, 12vw, 160px)",
          color: "rgba(236,230,214,0.95)",
          letterSpacing: "-0.025em",
        }}
      >
        {TITLE.split("").map((c, i) => (
          <span key={i} style={{ opacity: i < title.length ? 1 : 0, transition: "opacity 0.18s linear" }}>
            {c}
          </span>
        ))}
        <span style={{ opacity: titleDone ? 1 : 0, transition: "opacity 0.18s linear" }}>.</span>
        {/* Même technique que ci-dessus : curseur toujours rendu, on ne change
            que l'opacité. Le blink démarre dès la première lettre tapée. */}
        <motion.span
          aria-hidden
          initial={{ opacity: 0 }}
          animate={{
            opacity:
              title.length > 0 && phase === "intro" ? [1, 1, 0, 0] : 0,
          }}
          transition={
            title.length > 0 && phase === "intro"
              ? {
                  duration: 0.9,
                  repeat: Infinity,
                  ease: "linear",
                  times: [0, 0.5, 0.5, 1],
                }
              : { duration: 0.18, ease: "linear" }
          }
          style={{
            display: "inline-block",
            width: "0.05em",
            height: "0.85em",
            background: "rgba(236,230,214,0.85)",
            marginLeft: "0.08em",
            verticalAlign: "baseline",
            transform: "translateY(0.02em)",
          }}
        />
      </motion.h1>

      {/* Hint slot */}
      <div className="mt-16 relative" style={{ height: 14, display: "flex", alignItems: "center" }}>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: titleDone && phase === "intro" ? [0, 1, 0.45, 1] : 0 }}
          transition={
            titleDone && phase === "intro"
              ? { duration: 1.6, repeat: Infinity, ease: "easeInOut", delay: 1.4 }
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
      </motion.div>
    </>
  );

  const halfClass =
    "fixed inset-0 z-[60] flex flex-col items-center justify-center select-none overflow-hidden";

  return (
    <>
      {/* Top half — initial opacity: 1 pour couvrir instantanément le
          portfolio à la première frame (pas de flash de l'univers
          derrière qui casserait l'effet de surprise au chargement).
          Le slide vertical ne se déclenche qu'à la phase "rip" — preWarp
          et warp gardent les moitiés en place pour montrer le glitch et
          l'hyperspace AVANT la déchirure. */}
      <motion.div
        key="intro-top"
        initial={{ opacity: 1, y: 0, rotate: 0 }}
        animate={{
          opacity: 1,
          y: phase === "rip" ? "-115vh" : 0,
          rotate: phase === "rip" ? -2.2 : 0,
        }}
        exit={{ opacity: 0 }}
        transition={
          phase === "rip"
            ? { duration: 0.6, ease: [0.7, 0, 0.3, 1] }
            : { duration: 0 }
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

      {/* Bottom half — idem, opacité 1 dès le mount */}
      <motion.div
        key="intro-bottom"
        initial={{ opacity: 1, y: 0, rotate: 0 }}
        animate={{
          opacity: 1,
          y: phase === "rip" ? "115vh" : 0,
          rotate: phase === "rip" ? 2.2 : 0,
        }}
        exit={{ opacity: 0 }}
        transition={
          phase === "rip"
            ? { duration: 0.6, ease: [0.7, 0, 0.3, 1] }
            : { duration: 0 }
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

      {/* preWarp : brève frame noire qui claque (signal lost effect). */}
      {phase === "preWarp" && (
        <motion.div
          key="prewarp-blackflash"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.95, 0, 0.7, 0] }}
          transition={{ duration: 0.35, times: [0, 0.18, 0.42, 0.58, 1], ease: "linear" }}
          className="fixed inset-0 z-[63] pointer-events-none"
          style={{ background: "#04050A" }}
        />
      )}

      {/* warp / rip : hyperspace radial — 96 streaks accélèrent depuis
          le centre. C'est LE moment "on rentre dans un autre univers". */}
      {(phase === "warp" || phase === "rip") && <HyperspaceStreaks />}

      {/* Tear flash au moment de la déchirure — barre blanc-mint qui
          explose en hauteur + chromatic shockwave + flash global blanc. */}
      {phase === "rip" && (
        <>
          <motion.div
            key="tear-flash"
            initial={{ opacity: 0, scaleY: 0.4 }}
            animate={{ opacity: [0, 1, 0.6, 0], scaleY: [0.4, 1, 2.2, 3] }}
            transition={{ duration: 0.6, ease: "easeOut", times: [0, 0.12, 0.45, 1] }}
            className="fixed left-0 right-0 z-[64] pointer-events-none"
            style={{
              top: "calc(50% - 2px)",
              height: 4,
              background: "rgba(236,230,214,1)",
              boxShadow:
                "0 0 40px 6px rgba(164,245,200,0.9), 0 0 100px 14px rgba(236,230,214,0.6), 0 0 200px 24px rgba(90,220,255,0.35)",
              transformOrigin: "center",
            }}
          />
          {/* Chromatic shockwave — barre RGB qui s'étend horizontalement. */}
          <motion.div
            key="rip-chroma"
            initial={{ opacity: 0, scaleX: 0.3 }}
            animate={{ opacity: [0, 0.85, 0], scaleX: [0.3, 1.2, 1.8] }}
            transition={{ duration: 0.55, ease: "easeOut", delay: 0.05, times: [0, 0.35, 1] }}
            className="fixed left-0 right-0 z-[64] pointer-events-none"
            style={{
              top: "calc(50% - 8px)",
              height: 16,
              background:
                "linear-gradient(90deg, transparent 0%, rgba(255,90,90,0.35) 30%, rgba(255,255,255,0) 50%, rgba(90,220,255,0.35) 70%, transparent 100%)",
              filter: "blur(2px)",
              transformOrigin: "center",
            }}
          />
          {/* Flash global blanc bref qui transitionne vers l'univers. */}
          <motion.div
            key="rip-globalflash"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0, 0.55, 0] }}
            transition={{ duration: 0.6, times: [0, 0.5, 0.62, 1], ease: "easeOut" }}
            className="fixed inset-0 z-[63] pointer-events-none"
            style={{ background: "rgba(236,230,214,1)" }}
          />
        </>
      )}
    </>
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

function StarLegend({ onSelect }: { onSelect: (id: string) => void }) {
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
        </ul>
      </div>
    </motion.aside>
  );
}

// ---------------------------------------------------------------------------
// OnboardingTour — guided 2-step tutorial shown after every intro dismissal.
//   Step 1 : spotlight on right navigation arrow (explains arrow keys + clicks)
//   Step 2 : spotlight on centred planet (explains click-to-open)
// Spotlight = full-screen radial-gradient mask with transparent hole. Tooltip
// sits at the bottom-centre. Skip via button or Escape.
// ---------------------------------------------------------------------------
interface OnboardingTourProps {
  onDone: () => void;
}

function OnboardingTour({ onDone }: OnboardingTourProps) {
  const { lang } = useLang();
  const isTouch = useIsTouch();
  const [step, setStep] = useState(0);
  const [dims, setDims] = useState({ w: 1280, h: 800 });

  useEffect(() => {
    const update = () =>
      setDims({ w: window.innerWidth, h: window.innerHeight });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onDone();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onDone]);

  const steps = useMemo(
    () => [
      {
        title: tr(
          lang,
          "Navigue d'une planète à l'autre",
          "Move between planets",
        ),
        desc: isTouch
          ? tr(
              lang,
              "Touche les flèches latérales ou glisse l'écran pour passer d'un monde à l'autre.",
              "Tap the side arrows or swipe to move between worlds.",
            )
          : tr(
              lang,
              "Clique sur les flèches latérales, ou utilise les touches ← → du clavier pour changer de monde.",
              "Click the side arrows, or use the ← → keys to move between worlds.",
            ),
        cx: dims.w - 70,
        cy: dims.h / 2,
        radius: 78,
      },
      {
        title: tr(
          lang,
          "Ouvre le dossier d'un projet",
          "Open a project dossier",
        ),
        desc: isTouch
          ? tr(
              lang,
              "Quand une planète est au centre, touche-la pour embarquer dans son univers et découvrir le projet.",
              "When a planet is centred, tap it to board and discover the project.",
            )
          : tr(
              lang,
              "Quand une planète est au centre, clique dessus pour embarquer dans son univers et découvrir le projet.",
              "When a planet is centred, click it to board and discover the project.",
            ),
        cx: dims.w / 2,
        cy: dims.h / 2,
        radius: 180,
      },
    ],
    [lang, dims, isTouch],
  );

  const current = steps[step];
  const isLast = step === steps.length - 1;

  const advance = () => {
    if (isLast) onDone();
    else setStep((s) => s + 1);
  };

  return (
    <motion.div
      className="fixed inset-0 z-[45]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.55, ease: "easeOut" }}
    >
      {/* Dark mask with a transparent radial hole over the spotlight target.
          Pointer-events: none so the highlighted element stays interactive. */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{
          background: `radial-gradient(circle at ${current.cx}px ${current.cy}px, rgba(7,8,10,0) ${current.radius - 12}px, rgba(7,8,10,0.78) ${current.radius + 110}px)`,
        }}
        transition={{ duration: 0.55, ease: "easeInOut" }}
      />

      {/* Pulsing ring around the spotlight to draw the eye. */}
      <motion.div
        className="absolute pointer-events-none"
        animate={{
          left: current.cx - current.radius,
          top: current.cy - current.radius,
          width: current.radius * 2,
          height: current.radius * 2,
        }}
        transition={{ duration: 0.55, ease: "easeInOut" }}
      >
        <motion.div
          className="absolute inset-0 rounded-full"
          animate={{ scale: [1, 1.08, 1], opacity: [0.65, 0.2, 0.65] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          style={{
            border: "1.5px solid rgba(164,245,200,0.6)",
            boxShadow:
              "0 0 24px rgba(164,245,200,0.32), inset 0 0 18px rgba(164,245,200,0.18)",
          }}
        />
      </motion.div>

      {/* Tooltip card — fixed bottom-centre so it doesn't fight the spotlight. */}
      <motion.div
        className="absolute left-1/2 -translate-x-1/2 pointer-events-auto px-4"
        style={{ bottom: "11vh", maxWidth: 480, width: "100%" }}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut", delay: 0.12 }}
        key={`tooltip-${step}`}
      >
        <div
          className="px-6 py-5 rounded-2xl"
          style={{
            background:
              "linear-gradient(160deg, rgba(20,22,27,0.96) 0%, rgba(7,8,10,0.97) 100%)",
            border: "1px solid rgba(164,245,200,0.22)",
            boxShadow:
              "0 14px 40px rgba(0,0,0,0.6), 0 0 24px rgba(164,245,200,0.10)",
            backdropFilter: "blur(6px)",
          }}
        >
          <div
            className="mono uppercase mb-2"
            style={{
              letterSpacing: "0.35em",
              fontSize: "9px",
              color: "rgba(164,245,200,0.7)",
            }}
          >
            {tr(lang, "Étape", "Step")} {step + 1} / {steps.length}
          </div>
          <h3
            className="serif-display text-text mb-2"
            style={{ fontSize: "22px", lineHeight: 1.18 }}
          >
            {current.title}
          </h3>
          <p
            className="text-text-muted leading-relaxed mb-5"
            style={{ fontSize: "14px" }}
          >
            {current.desc}
          </p>
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onDone}
              className="mono uppercase tracking-widest text-text-muted hover:text-text transition-colors"
              style={{ fontSize: "10px", letterSpacing: "0.3em" }}
            >
              {tr(lang, "Passer", "Skip")}
            </button>
            <button
              type="button"
              onClick={advance}
              className="mono uppercase tracking-widest transition-colors"
              style={{
                fontSize: "10px",
                letterSpacing: "0.3em",
                color: "rgba(164,245,200,0.95)",
                border: "1px solid rgba(164,245,200,0.4)",
                padding: "8px 16px",
                borderRadius: 999,
                background: "rgba(164,245,200,0.05)",
              }}
            >
              {isLast
                ? tr(lang, "C'est parti", "Let's go")
                : tr(lang, "Suivant", "Next")}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
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
  const [legendFx, setLegendFx] = useState<{
    kind: FxKind;
    shape: StarShape;
    color: string;
    next: OpenCard;
  } | null>(null);
  const [warpTick, setWarpTick] = useState(0);
  // Boarding warp: planet click → cinematic transit → modal opens at the end.
  const [warpTarget, setWarpTarget] = useState<Project | null>(null);
  // Onboarding tour: replayed on every visit, ~1s after the intro is
  // dismissed so the universe has time to settle before the spotlight fades in.
  const [showTour, setShowTour] = useState(false);

  useEffect(() => {
    if (!introDismissed) return;
    if (typeof window === "undefined") return;
    const t = window.setTimeout(() => setShowTour(true), 1100);
    return () => window.clearTimeout(t);
  }, [introDismissed]);

  const dismissTour = useCallback(() => {
    setShowTour(false);
  }, []);

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
    // Kick off the cinematic boarding sequence; modal opens on completion.
    setWarpTarget(project);
  }, []);

  const handleWarpComplete = useCallback(() => {
    setWarpTarget((current) => {
      if (current) setOpenCard({ type: "planet", project: current });
      return null;
    });
  }, []);

  const goTo = useCallback(
    (newIndex: number) => {
      playWhoosh();
      setIndex(newIndex);
      closeCard();
      // Trigger hyperspace warp overlay
      setWarpTick((t) => t + 1);
    },
    [closeCard]
  );

  const next = useCallback(() => {
    goTo((index + 1) % projects.length);
  }, [goTo, index]);

  const prev = useCallback(() => {
    goTo((index - 1 + projects.length) % projects.length);
  }, [goTo, index]);

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
        <ResponsiveCamera />
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

        <EffectComposer multisampling={4}>
          <Bloom
            intensity={1.2}
            luminanceThreshold={0.55}
            luminanceSmoothing={0.7}
          />
        </EffectComposer>
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

      {/* Boarding warp overlay — cinematic transit played when a planet is
          clicked, before the PlanetPresenter modal opens. */}
      <AnimatePresence>
        {warpTarget && (
          <PlanetWarp
            key={`warp-${warpTarget.slug}`}
            slug={warpTarget.slug}
            onComplete={handleWarpComplete}
          />
        )}
      </AnimatePresence>

      {/* Star legend (top right, pokemon-badge style) — clickable for global details */}
      {introDismissed && <StarLegend onSelect={handleLegendSelect} />}

      {/* Chatbot guide (top-center, opens dropdown panel) — masqué pendant
          le warp d'entrée dans une planète (sinon arrière-plan / messages
          visibles à travers la cinématique). */}
      {introDismissed && !warpTarget && <Chatbot />}

      {/* Pop up "astuce flèches" depuis le bot normal, une fois par session */}
      {introDismissed && !warpTarget && <ChatbotArrowTip />}

      {/* Présentateur galactique (bottom-right, indépendant du Chatbot) :
          bulle teaser à l'arrivée + bouton "Visite guidée" + panel narratif */}
      {introDismissed && !warpTarget && (
        <PlanetPresenter slug={projects[index].slug} />
      )}

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

      {/* (Chapter caption supprimée — le nom de la planète est porté par
          la transition PlanetWarp, plus de doublon à l'arrivée.) */}

      {/* Onboarding tour — first visit only, dismissed via Skip / Next / Esc. */}
      <AnimatePresence>
        {showTour && introDismissed && !openCard && !warpTarget && (
          <OnboardingTour key="onboarding-tour" onDone={dismissTour} />
        )}
      </AnimatePresence>

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
