"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useLang, tr } from "@/lib/i18n";

// Cinematic boarding/transit transition played when the user clicks a planet,
// before the PlanetPresenter modal opens.
//
// Aesthetic: "Editorial Versus" — inspired by the Street Fighter VS screen
// (diagonal slash bands, big bold name, beat-style countdown) but redrawn
// with the portfolio's editorial language (serif-italic display, mint thread
// accent, palette-matched glow). A tiny ship streaks across the middle to
// reinforce the "boarding / warp" idea.
//
// Phases (~4.2s total — chaque beat dure une vraie seconde, et l'écran
// est animé en continu pour que l'utilisateur ne décroche jamais) :
//   0.00–0.45s  ALIGN     — bandes diagonales s'engagent
//   0.30–1.20s  REVEAL    — nom + chapitre stampent
//   0.40–3.10s  SHIP      — vaisseau traverse lentement, traînée pleine largeur
//   1.05–2.00s  BEAT "3"  — gros chiffre + status text "VERROUILLAGE" + ring
//   2.00–2.95s  BEAT "2"  — gros chiffre + status text "CALIBRATION"   + ring
//   2.95–3.90s  BEAT "1"  — gros chiffre + status text "EMBARQUEMENT"  + ring
//   3.90–4.20s  RELEASE   — flash blanc, bandes se retirent, modal s'ouvre
//
// Pendant TOUTE la séquence : grid scanline qui défile, étoiles parallax
// qui filent, et progress bar fine en bas qui se remplit 0→100% (donne au
// regard un point d'ancrage clair pour mesurer le temps qui passe).

const DURATION = 4.2; // seconds

type Palette = {
  rgb: string;       // primary planet color (rgb triplet for rgba())
  accentRgb: string; // softer companion
};

// One palette per planet — matches the planet's signature aesthetic so the
// warp visually emanates from the planet's identity.
const PALETTES: Record<string, Palette> = {
  levels:        { rgb: "216,220,228", accentRgb: "168,172,182" }, // silver
  energizer:     { rgb: "160,240,255", accentRgb: "120,200,236" }, // cyan
  mirakl:        { rgb: "232,194,140", accentRgb: "200,160,80" },  // gold
  "music-agency": { rgb: "232,200,180", accentRgb: "200,169,155" }, // blush
  thelook:       { rgb: "214,210,200", accentRgb: "172,168,158" }, // stone
};

// Mint thread accent — the portfolio's signature thread color, used as a
// subtle secondary so every transition still feels "this portfolio".
const THREAD = "164,196,176";

const NAMES: Record<string, string> = {
  levels: "Levels",
  energizer: "Energizer",
  mirakl: "Mirakl",
  "music-agency": "Beyond",
  thelook: "The Look",
};

// Stable chapter ordering — drives the "01 / 05" indicator.
const PROJECT_ORDER = ["levels", "energizer", "mirakl", "music-agency", "thelook"];

interface PlanetWarpProps {
  slug: string;
  onComplete: () => void;
}

export function PlanetWarp({ slug, onComplete }: PlanetWarpProps) {
  const { lang } = useLang();
  const palette = PALETTES[slug] ?? PALETTES.levels;
  const name = NAMES[slug] ?? slug;
  const idx = PROJECT_ORDER.indexOf(slug);
  const chapter = ((idx >= 0 ? idx : 0) + 1).toString().padStart(2, "0");
  const total = PROJECT_ORDER.length.toString().padStart(2, "0");

  // Light tracers — 14 thin radial streaks, deterministic spacing for design
  // rhythm (not chaos).
  const streaks = useMemo(() => {
    const N = 14;
    return Array.from({ length: N }).map((_, i) => {
      const angle = (i / N) * Math.PI * 2;
      const length = 130 + ((i * 41) % 70);
      const delay = 0.35 + ((i * 0.017) % 0.18);
      return { angle, length, delay };
    });
  }, []);

  // Fire onComplete at the END of the sequence
  useEffect(() => {
    const t = window.setTimeout(onComplete, DURATION * 1000);
    return () => window.clearTimeout(t);
  }, [onComplete]);

  return (
    <motion.div
      key="planet-warp"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-[60] pointer-events-none overflow-hidden select-none"
    >
      {/* ATMOSPHERIC VIGNETTE — radial darkening that breathes once */}
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.7, 0.95, 0.7, 0] }}
        transition={{ duration: DURATION, times: [0, 0.15, 0.55, 0.85, 1] }}
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at center, transparent 0%, rgba(7,8,10,0.55) 55%, rgba(7,8,10,0.95) 100%)",
        }}
      />

      {/* DIAGONAL BAND — TOP. Carries the planet name (serif italic). */}
      <motion.div
        className="absolute"
        initial={{ x: "-110vw", opacity: 0 }}
        animate={{
          x: ["-110vw", "0vw", "0vw", "110vw"],
          opacity: [0, 1, 1, 0],
        }}
        transition={{
          duration: DURATION,
          times: [0, 0.14, 0.88, 1],
          ease: [0.6, 0.02, 0.2, 1],
        }}
        style={{
          top: "32vh",
          left: 0,
          right: 0,
          height: "12vh",
          transform: "rotate(-10deg)",
          transformOrigin: "50% 50%",
          background:
            "linear-gradient(180deg, rgba(7,8,10,0) 0%, rgba(7,8,10,0.96) 18%, rgba(7,8,10,0.96) 82%, rgba(7,8,10,0) 100%)",
          borderTop: `1px solid rgba(${palette.rgb},0.45)`,
          borderBottom: `1px solid rgba(${palette.rgb},0.45)`,
          boxShadow: `0 0 32px rgba(${palette.rgb},0.18), inset 0 0 60px rgba(${palette.rgb},0.08)`,
        }}
      >
        <div
          className="serif-italic absolute inset-0 flex items-center justify-center"
          style={{
            fontSize: "clamp(48px, 9vw, 132px)",
            lineHeight: 1,
            color: `rgba(${palette.rgb},0.98)`,
            letterSpacing: "-0.01em",
            textShadow: `0 0 28px rgba(${palette.rgb},0.35), 0 0 80px rgba(${palette.rgb},0.18)`,
            mixBlendMode: "screen" as const,
            whiteSpace: "nowrap",
          }}
        >
          {name}
        </div>
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 1,
            background: `linear-gradient(90deg, transparent 0%, rgba(${palette.rgb},0.95) 50%, transparent 100%)`,
          }}
        />
      </motion.div>

      {/* DIAGONAL BAND — BOTTOM. "Chapitre 0X / 05". */}
      <motion.div
        className="absolute"
        initial={{ x: "110vw", opacity: 0 }}
        animate={{
          x: ["110vw", "0vw", "0vw", "-110vw"],
          opacity: [0, 1, 1, 0],
        }}
        transition={{
          duration: DURATION,
          times: [0, 0.14, 0.88, 1],
          ease: [0.6, 0.02, 0.2, 1],
        }}
        style={{
          top: "56vh",
          left: 0,
          right: 0,
          height: "7vh",
          transform: "rotate(-10deg)",
          transformOrigin: "50% 50%",
          background:
            "linear-gradient(180deg, rgba(7,8,10,0) 0%, rgba(7,8,10,0.92) 22%, rgba(7,8,10,0.92) 78%, rgba(7,8,10,0) 100%)",
          borderTop: `1px solid rgba(${palette.rgb},0.3)`,
          borderBottom: `1px solid rgba(${palette.rgb},0.3)`,
        }}
      >
        <div
          className="mono uppercase absolute inset-0 flex items-center justify-center gap-3"
          style={{
            fontSize: "clamp(11px, 1.3vw, 16px)",
            color: `rgba(${palette.rgb},0.85)`,
            letterSpacing: "0.5em",
          }}
        >
          <span>{tr(lang, "Chapitre", "Chapter")}</span>
          <span
            className="serif-italic"
            style={{
              fontSize: "clamp(20px, 2.6vw, 32px)",
              letterSpacing: "0em",
            }}
          >
            {chapter}
          </span>
          <span style={{ opacity: 0.5 }}>/ {total}</span>
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: "20%",
            right: "20%",
            height: 1,
            background: `linear-gradient(90deg, transparent 0%, rgba(${THREAD},0.9) 50%, transparent 100%)`,
          }}
        />
      </motion.div>

      {/* GIANT GHOST NUMERAL — backdrop typography */}
      <motion.div
        className="serif-italic absolute"
        initial={{ opacity: 0, scale: 1.15, x: 30 }}
        animate={{
          opacity: [0, 0.14, 0.1, 0],
          scale: [1.15, 1, 1, 0.96],
          x: [30, 0, 0, -20],
        }}
        transition={{ duration: DURATION, times: [0, 0.18, 0.86, 1] }}
        style={{
          right: "8vw",
          top: "8vh",
          fontSize: "clamp(180px, 30vw, 420px)",
          lineHeight: 0.85,
          color: `rgba(${palette.rgb},0.95)`,
          letterSpacing: "-0.04em",
          mixBlendMode: "screen" as const,
        }}
      >
        {chapter}
      </motion.div>

      {/* SHIP — chevron filant à pleine vitesse, avec longue traînée
          incandescente. Plus gros (68×20), plus lumineux, halo accentué.
          Position légèrement au-dessus du centre pour passer juste entre
          les deux bandes diagonales. */}
      <motion.div
        className="absolute"
        initial={{ left: "-18vw", opacity: 0 }}
        animate={{
          left: ["-18vw", "-12vw", "112vw", "118vw"],
          opacity: [0, 1, 1, 0],
        }}
        transition={{
          duration: DURATION,
          // ship visible window : 0.40 → 3.10s sur un timeline 4.2s — le
          // vaisseau traverse lentement pour rester un élément SUIVI par
          // l'œil pendant tout le décompte.
          times: [0, 0.095, 0.74, 0.78],
          ease: [0.5, 0.1, 0.5, 1],
        }}
        style={{
          top: "calc(50vh - 10px)",
          height: 20,
          width: 68,
        }}
      >
        {/* trainée principale — longue, brillante, palette-tinted */}
        <div
          style={{
            position: "absolute",
            right: 34,
            top: 8,
            height: 4,
            width: "85vw",
            background: `linear-gradient(90deg, transparent 0%, rgba(${palette.rgb},0.05) 25%, rgba(${palette.rgb},0.55) 75%, rgba(${palette.rgb},1) 100%)`,
            filter: "blur(0.5px)",
            mixBlendMode: "screen" as const,
          }}
        />
        {/* trainée secondaire — plus large + floutée pour le glow */}
        <div
          style={{
            position: "absolute",
            right: 34,
            top: 4,
            height: 12,
            width: "55vw",
            background: `linear-gradient(90deg, transparent 0%, rgba(${palette.accentRgb},0.15) 45%, rgba(${palette.accentRgb},0.65) 100%)`,
            filter: "blur(5px)",
            opacity: 0.85,
            mixBlendMode: "screen" as const,
          }}
        />
        {/* trainée fine intérieure — coeur blanc-chaud du jet */}
        <div
          style={{
            position: "absolute",
            right: 34,
            top: 9,
            height: 2,
            width: "35vw",
            background: `linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 60%, rgba(255,255,255,0.95) 100%)`,
            filter: "blur(0.3px)",
            mixBlendMode: "screen" as const,
          }}
        />
        {/* le vaisseau — chevron stylisé avec halo prononcé */}
        <svg
          viewBox="0 0 68 20"
          style={{
            position: "absolute",
            inset: 0,
            overflow: "visible",
            filter: `drop-shadow(0 0 6px rgba(${palette.rgb},0.95)) drop-shadow(0 0 18px rgba(${palette.rgb},0.6)) drop-shadow(0 0 32px rgba(${palette.accentRgb},0.4))`,
          }}
        >
          {/* corps principal — chevron pointu à droite, ailes en V */}
          <polygon
            points="68,10 14,1 28,10 14,19"
            fill={`rgba(${palette.rgb},1)`}
          />
          {/* éclat blanc à la pointe — coeur lumineux */}
          <polygon
            points="68,10 52,6 56,10 52,14"
            fill="rgba(255,255,255,1)"
          />
          {/* petite barre sous l'aile inférieure — détail mécanique */}
          <rect
            x="20"
            y="13"
            width="14"
            height="1.4"
            fill={`rgba(${palette.accentRgb},0.9)`}
          />
        </svg>
      </motion.div>

      {/* COUNTDOWN 3·2·1 — chaque chiffre tient ~0.95s à l'écran (une
          vraie seconde perçue), accompagné de :
            · un status caption mono qui change à chaque beat
            · un ring concentrique qui s'agrandit depuis le chiffre
            · un tick mint
          Position bas-droite pour ne pas écraser le nom dans la bande haut. */}
      {[
        { label: "3", status: tr(lang, "VERROUILLAGE", "LOCK ON"),     t0: 0.25, t1: 0.475 },
        { label: "2", status: tr(lang, "CALIBRATION",  "CALIBRATION"), t0: 0.50, t1: 0.725 },
        { label: "1", status: tr(lang, "EMBARQUEMENT", "BOARDING"),    t0: 0.75, t1: 0.93  },
      ].map(({ label, status, t0, t1 }, i) => (
        <div key={`beat-group-${i}`}>
          {/* Le gros chiffre serif-italique */}
          <motion.div
            className="serif-italic"
            initial={{ opacity: 0, scale: 0.45 }}
            animate={{
              opacity: [0, 0, 1, 1, 0, 0],
              // léger jitter pendant le hold → vivant, pas figé
              scale: [0.45, 0.45, 1.08, 1.0, 1.4, 1.4],
            }}
            transition={{
              duration: DURATION,
              times: [0, t0 - 0.005, t0 + 0.04, t1 - 0.03, t1 + 0.005, 1],
              ease: [0.2, 0.7, 0.3, 1],
            }}
            style={{
              position: "absolute",
              right: "10vw",
              top: "calc(50vh + 9vh)",
              transform: "translate(0, -50%)",
              fontSize: "clamp(140px, 20vw, 280px)",
              lineHeight: 0.85,
              color: `rgba(${palette.rgb},1)`,
              letterSpacing: "-0.04em",
              textShadow: `0 0 24px rgba(${palette.rgb},0.7), 0 0 64px rgba(${palette.rgb},0.42), 0 0 140px rgba(${palette.accentRgb},0.3)`,
              mixBlendMode: "screen" as const,
              pointerEvents: "none",
            }}
          >
            {label}
          </motion.div>

          {/* Status caption mono — sous le chiffre, lettre-espacé à mort,
              avec ligne de soulignement qui pousse en width au moment du
              beat. Donne quelque chose à LIRE pendant la seconde qui passe. */}
          <motion.div
            className="mono uppercase"
            initial={{ opacity: 0, y: 8 }}
            animate={{
              opacity: [0, 0, 0.95, 0.95, 0, 0],
              y: [8, 8, 0, 0, -6, -6],
            }}
            transition={{
              duration: DURATION,
              times: [0, t0 + 0.02, t0 + 0.07, t1 - 0.03, t1 + 0.01, 1],
              ease: "easeOut",
            }}
            style={{
              position: "absolute",
              right: "10vw",
              top: "calc(50vh + 22vh)",
              fontSize: "clamp(11px, 1.1vw, 14px)",
              color: `rgba(${palette.rgb},0.95)`,
              letterSpacing: "0.6em",
              textShadow: `0 0 12px rgba(${palette.rgb},0.5)`,
              pointerEvents: "none",
            }}
          >
            {status}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{
                scaleX: [0, 0, 1, 1, 0],
              }}
              transition={{
                duration: DURATION,
                times: [0, t0 + 0.04, t0 + 0.18, t1 - 0.02, t1 + 0.01],
                ease: [0.2, 0.7, 0.3, 1],
              }}
              style={{
                marginTop: 6,
                height: 1,
                width: "100%",
                background: `linear-gradient(90deg, transparent 0%, rgba(${THREAD},0.95) 50%, transparent 100%)`,
                transformOrigin: "left center",
              }}
            />
          </motion.div>

          {/* Ring concentrique qui s'agrandit depuis le chiffre — repère
              visuel pour le beat, donne du volume sans noise. */}
          <motion.div
            initial={{ opacity: 0, scale: 0.2 }}
            animate={{
              opacity: [0, 0, 0.55, 0, 0],
              scale: [0.2, 0.2, 1.0, 2.2, 2.2],
            }}
            transition={{
              duration: DURATION,
              times: [0, t0, t0 + 0.05, t0 + 0.35, 1],
              ease: "easeOut",
            }}
            style={{
              position: "absolute",
              right: "calc(10vw + clamp(70px, 10vw, 140px) - clamp(110px, 16vw, 200px))",
              top: "calc(50vh + 9vh - clamp(110px, 16vw, 200px))",
              width: "clamp(220px, 32vw, 400px)",
              height: "clamp(220px, 32vw, 400px)",
              borderRadius: "50%",
              border: `1px solid rgba(${palette.rgb},0.6)`,
              boxShadow: `0 0 28px rgba(${palette.rgb},0.18), inset 0 0 28px rgba(${palette.rgb},0.12)`,
              pointerEvents: "none",
            }}
          />
        </div>
      ))}

      {/* TICKS mint — trois petits points sous les status, marquent le
          rythme. Position fixe : ils s'allument séquentiellement. */}
      {[0.25, 0.50, 0.75].map((t, i) => (
        <motion.div
          key={`tick-${i}`}
          initial={{ opacity: 0.25, scale: 1 }}
          animate={{
            opacity: [0.25, 0.25, 1, 1, 0.5],
            scale: [1, 1, 1.6, 1.4, 1.2],
          }}
          transition={{
            duration: DURATION,
            times: [0, t - 0.005, t + 0.02, t + 0.18, 1],
          }}
          style={{
            position: "absolute",
            right: `calc(8vw + ${(2 - i) * 24}px)`,
            top: "calc(50vh + 26vh)",
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: `rgba(${THREAD},1)`,
            boxShadow: `0 0 10px rgba(${THREAD},0.85), 0 0 24px rgba(${THREAD},0.4)`,
            pointerEvents: "none",
          }}
        />
      ))}

      {/* PROGRESS BAR — ligne fine en bas, se remplit 0→100% sur toute la
          durée. Donne à l'œil un point d'ancrage clair pour mesurer le
          temps qui passe (anti-ennui). Style éditorial, mint thread. */}
      <div
        style={{
          position: "absolute",
          left: "8vw",
          right: "8vw",
          bottom: "5vh",
          height: 2,
          background: `rgba(${palette.rgb},0.08)`,
          overflow: "hidden",
          pointerEvents: "none",
        }}
      >
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: DURATION, ease: "linear" }}
          style={{
            height: "100%",
            width: "100%",
            background: `linear-gradient(90deg, rgba(${THREAD},0.95) 0%, rgba(${palette.rgb},1) 100%)`,
            boxShadow: `0 0 8px rgba(${palette.rgb},0.5)`,
            transformOrigin: "left center",
          }}
        />
      </div>
      {/* Label sous la progress bar — "TRANSIT" + petit compteur 00→100 */}
      <motion.div
        className="mono uppercase"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.8, 0.8, 0] }}
        transition={{ duration: DURATION, times: [0, 0.08, 0.92, 1] }}
        style={{
          position: "absolute",
          left: "8vw",
          bottom: "calc(5vh + 10px)",
          fontSize: 10,
          letterSpacing: "0.5em",
          color: `rgba(${palette.rgb},0.7)`,
          pointerEvents: "none",
        }}
      >
        Transit
      </motion.div>
      <motion.div
        className="mono"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.6, 0.6, 0] }}
        transition={{ duration: DURATION, times: [0, 0.08, 0.92, 1] }}
        style={{
          position: "absolute",
          right: "8vw",
          bottom: "calc(5vh + 10px)",
          fontSize: 10,
          letterSpacing: "0.3em",
          color: `rgba(${palette.rgb},0.65)`,
          pointerEvents: "none",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        <ProgressCounter durationMs={DURATION * 1000} />
      </motion.div>

      {/* SCANLINE grid — fond animé qui défile lentement, donne au plein
          écran une texture vivante (pas de noir vide). Très subtile. */}
      <motion.div
        initial={{ opacity: 0, backgroundPositionY: 0 }}
        animate={{
          opacity: [0, 0.18, 0.22, 0.18, 0],
          backgroundPositionY: [0, 80, 160, 240, 320],
        }}
        transition={{ duration: DURATION, times: [0, 0.15, 0.5, 0.85, 1] }}
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          backgroundImage: `repeating-linear-gradient(0deg, rgba(${palette.rgb},0.06) 0px, rgba(${palette.rgb},0.06) 1px, transparent 1px, transparent 4px)`,
          mixBlendMode: "screen" as const,
        }}
      />

      {/* RADIAL LIGHT STREAKS — palette-matched, radiate outward during the
          REVEAL phase. Adds depth + energy without dominating. */}
      {streaks.map((s, i) => {
        const angleDeg = (s.angle * 180) / Math.PI;
        return (
          <div
            key={`streak-${i}`}
            className="absolute left-1/2 top-1/2"
            style={{
              transform: `rotate(${angleDeg}deg)`,
              transformOrigin: "0 0",
            }}
          >
            <motion.div
              initial={{ x: 28, opacity: 0, scaleX: 0.3 }}
              animate={{
                x: [28, 90, 220 + s.length, 420 + s.length],
                opacity: [0, 0.7, 0.4, 0],
                scaleX: [0.3, 1.0, 1.6, 2.2],
              }}
              transition={{
                duration: 0.7,
                delay: s.delay,
                times: [0, 0.25, 0.65, 1],
                ease: [0.3, 0.7, 0.3, 1],
              }}
              style={{
                width: s.length,
                height: 1,
                marginTop: -0.5,
                borderRadius: 999,
                background: `linear-gradient(90deg, transparent 0%, rgba(${palette.rgb},0.85) 55%, rgba(${palette.accentRgb},0.2) 90%, transparent 100%)`,
                transformOrigin: "0 50%",
                mixBlendMode: "screen" as const,
                filter: "blur(0.4px)",
              }}
            />
          </div>
        );
      })}

      {/* ARRIVAL FLASH — pulse blanc-palette pile à la fin du "1", marque
          le départ (= ouverture imminente de la planète). */}
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0, 0, 0.38, 0.08, 0] }}
        transition={{
          duration: DURATION,
          times: [0, 0.92, 0.93, 0.955, 0.98, 1],
        }}
        style={{ background: `rgba(${palette.rgb},1)` }}
      />
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// ProgressCounter — affiche "00 → 100" en tabular-nums, synchronisé sur la
// durée totale via requestAnimationFrame. Sert d'indicateur quantifié (le
// regard a quelque chose à suivre pendant que les secondes passent).
// ---------------------------------------------------------------------------
function ProgressCounter({ durationMs }: { durationMs: number }) {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const k = Math.min(1, (now - t0) / durationMs);
      setPct(Math.round(k * 100));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [durationMs]);
  return <span>{String(pct).padStart(3, "0")} %</span>;
}
