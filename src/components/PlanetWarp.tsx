"use client";

import { useEffect, useMemo } from "react";
import { motion } from "framer-motion";

// Cinematic boarding/transit transition played when the user clicks a planet,
// between the planet's compress/explode haptic and the PlanetPresenter modal.
// Aesthetic: Aerospace Editorial — refined navigation HUD × serif literary.
// Phases (~1400ms total): ALIGN → TRANSIT → ARRIVAL → RELEASE.

const DURATION = 1.4; // seconds

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

interface PlanetWarpProps {
  slug: string;
  onComplete: () => void;
}

export function PlanetWarp({ slug, onComplete }: PlanetWarpProps) {
  const palette = PALETTES[slug] ?? PALETTES.levels;
  const name = NAMES[slug] ?? slug;

  // Light tracers — 18 thin radial streaks, deterministic spacing for design
  // rhythm (not chaos). Each at a fixed angle with slight length variance.
  const streaks = useMemo(() => {
    const N = 18;
    return Array.from({ length: N }).map((_, i) => {
      const angle = (i / N) * Math.PI * 2;
      // Length and delay vary just enough to break perfect symmetry
      const length = 120 + ((i * 37) % 70);
      const delay = 0.22 + ((i * 0.013) % 0.18);
      return { angle, length, delay };
    });
  }, []);

  // Fire onComplete at the END of the sequence
  useEffect(() => {
    const t = window.setTimeout(onComplete, DURATION * 1000);
    return () => window.clearTimeout(t);
  }, [onComplete]);

  // 4 corner brackets (camera lock) positions
  const brackets = [
    { vertical: "top" as const, horizontal: "left" as const, rotate: 0 },
    { vertical: "top" as const, horizontal: "right" as const, rotate: 90 },
    { vertical: "bottom" as const, horizontal: "right" as const, rotate: 180 },
    { vertical: "bottom" as const, horizontal: "left" as const, rotate: 270 },
  ];

  return (
    <motion.div
      key="planet-warp"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="fixed inset-0 z-[60] pointer-events-none overflow-hidden select-none"
    >
      {/* ATMOSPHERIC VIGNETTE — radial darkening that breathes once */}
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.7, 0.95, 0.7, 0] }}
        transition={{ duration: DURATION, times: [0, 0.2, 0.55, 0.85, 1] }}
        style={{
          background: `radial-gradient(ellipse 70% 60% at center, transparent 0%, rgba(7,8,10,0.55) 55%, rgba(7,8,10,0.95) 100%)`,
        }}
      />

      {/* LETTERBOX TOP — slides in cinemascope bars */}
      <motion.div
        className="absolute top-0 left-0 right-0"
        initial={{ height: 0 }}
        animate={{ height: ["0vh", "13vh", "13vh", "0vh"] }}
        transition={{
          duration: DURATION,
          times: [0, 0.22, 0.78, 1],
          ease: [0.4, 0, 0.2, 1],
        }}
        style={{ background: "#050609", borderBottom: `1px solid rgba(${palette.rgb},0.18)` }}
      />
      {/* LETTERBOX BOTTOM */}
      <motion.div
        className="absolute bottom-0 left-0 right-0"
        initial={{ height: 0 }}
        animate={{ height: ["0vh", "13vh", "13vh", "0vh"] }}
        transition={{
          duration: DURATION,
          times: [0, 0.22, 0.78, 1],
          ease: [0.4, 0, 0.2, 1],
        }}
        style={{ background: "#050609", borderTop: `1px solid rgba(${palette.rgb},0.18)` }}
      />

      {/* HORIZON LINE — artificial horizon instrument, draws from center outward */}
      <motion.div
        className="absolute left-1/2 top-1/2"
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: [0, 1, 1, 0.6, 0], opacity: [0, 0.55, 0.35, 0.15, 0] }}
        transition={{ duration: DURATION, times: [0, 0.28, 0.6, 0.85, 1] }}
        style={{
          width: "92vw",
          height: 1,
          marginLeft: "-46vw",
          marginTop: -0.5,
          background: `linear-gradient(90deg, transparent 0%, rgba(${palette.rgb},0.18) 12%, rgba(${palette.rgb},0.7) 50%, rgba(${palette.rgb},0.18) 88%, transparent 100%)`,
          transformOrigin: "50% 50%",
        }}
      />

      {/* TINY HORIZON TICKS — small marks on the horizon, instrumental feel */}
      {[-0.3, -0.15, 0.15, 0.3].map((x, i) => (
        <motion.div
          key={`tick-${i}`}
          className="absolute left-1/2 top-1/2"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.6, 0.3, 0] }}
          transition={{ duration: DURATION, times: [0, 0.3, 0.75, 1] }}
          style={{
            width: 1,
            height: 8,
            marginTop: -4,
            marginLeft: `calc(${x * 100}vw - 0.5px)`,
            background: `rgba(${palette.rgb},0.7)`,
          }}
        />
      ))}

      {/* 4 CORNER BRACKETS — camera lock-on, expand outward at arrival */}
      {brackets.map((b, i) => (
        <motion.div
          key={`bracket-${i}`}
          className="absolute"
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{
            opacity: [0, 1, 1, 1, 0],
            scale: [0.7, 1, 1, 1.18, 1.35],
          }}
          transition={{
            duration: DURATION,
            times: [0, 0.18, 0.55, 0.85, 1],
            ease: [0.2, 0.6, 0.3, 1],
          }}
          style={{
            [b.vertical]: "19vh",
            [b.horizontal]: "8vw",
            width: 28,
            height: 28,
            transform: `rotate(${b.rotate}deg)`,
            transformOrigin: "50% 50%",
          }}
        >
          {/* L-shaped bracket : horizontal top + vertical left */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: 14,
              height: 1.4,
              background: `rgba(${palette.rgb},0.9)`,
              boxShadow: `0 0 6px rgba(${palette.rgb},0.4)`,
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: 1.4,
              height: 14,
              background: `rgba(${palette.rgb},0.9)`,
              boxShadow: `0 0 6px rgba(${palette.rgb},0.4)`,
            }}
          />
        </motion.div>
      ))}

      {/* HUD LABEL — "DESTINATION" small mono, wide tracking */}
      <motion.div
        className="absolute left-1/2 mono uppercase"
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: [0, 0.65, 0.4, 0], y: [4, 0, 0, -2] }}
        transition={{ duration: DURATION, times: [0, 0.22, 0.7, 1] }}
        style={{
          top: "calc(13vh + 18px)",
          transform: "translateX(-50%)",
          letterSpacing: "0.55em",
          fontSize: "8.5px",
          color: `rgba(${palette.rgb},0.7)`,
        }}
      >
        Destination
      </motion.div>

      {/* THREAD MARK — small mint accent above the name (portfolio signature) */}
      <motion.div
        className="absolute left-1/2 top-1/2"
        initial={{ opacity: 0, scaleX: 0 }}
        animate={{ opacity: [0, 0.7, 0.7, 0], scaleX: [0, 1, 1, 1.4] }}
        transition={{ duration: DURATION, times: [0, 0.25, 0.7, 1] }}
        style={{
          width: 64,
          height: 1,
          marginLeft: -32,
          marginTop: "-7vh",
          background: `linear-gradient(90deg, transparent 0%, rgba(${THREAD},0.85) 50%, transparent 100%)`,
          transformOrigin: "50% 50%",
        }}
      />

      {/* BIG SERIF NAME — italic, centered, breathes through the sequence */}
      <motion.div
        className="absolute left-1/2 top-1/2 serif-italic text-center"
        initial={{ opacity: 0, y: 18, letterSpacing: "0.12em" }}
        animate={{
          opacity: [0, 1, 1, 0.85, 0],
          y: [18, 0, 0, -6, -16],
          letterSpacing: ["0.12em", "0em", "-0.015em", "-0.03em", "-0.05em"],
        }}
        transition={{
          duration: DURATION,
          times: [0, 0.28, 0.55, 0.82, 1],
          ease: [0.22, 0.7, 0.3, 1],
        }}
        style={{
          transform: "translate(-50%, -50%)",
          fontSize: "clamp(56px, 8.5vw, 124px)",
          color: `rgba(${palette.rgb},0.95)`,
          textShadow: `0 0 80px rgba(${palette.rgb},0.18), 0 0 24px rgba(${palette.rgb},0.12)`,
          mixBlendMode: "screen" as const,
          whiteSpace: "nowrap",
        }}
      >
        {name}
      </motion.div>

      {/* RADIAL LIGHT STREAKS — TRANSIT phase, palette-matched, radiate outward */}
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
              initial={{ x: 18, opacity: 0, scaleX: 0.3 }}
              animate={{
                x: [18, 80, 200 + s.length, 400 + s.length],
                opacity: [0, 0.95, 0.55, 0],
                scaleX: [0.3, 1.0, 1.6, 2.2],
              }}
              transition={{
                duration: 0.78,
                delay: s.delay,
                times: [0, 0.25, 0.65, 1],
                ease: [0.3, 0.7, 0.3, 1],
              }}
              style={{
                width: s.length,
                height: 1.2,
                marginTop: -0.6,
                borderRadius: 999,
                background: `linear-gradient(90deg, transparent 0%, rgba(${palette.rgb},0.95) 55%, rgba(${palette.accentRgb},0.25) 90%, transparent 100%)`,
                transformOrigin: "0 50%",
                mixBlendMode: "screen" as const,
                filter: "blur(0.4px)",
              }}
            />
          </div>
        );
      })}

      {/* ARRIVAL PULSE — soft radial bloom at the moment of arrival */}
      <motion.div
        className="absolute left-1/2 top-1/2"
        initial={{ opacity: 0, scale: 0.15 }}
        animate={{
          opacity: [0, 0, 0.55, 0.95, 0],
          scale: [0.15, 0.5, 1.6, 2.6, 3.4],
        }}
        transition={{ duration: DURATION, times: [0, 0.5, 0.7, 0.85, 1] }}
        style={{
          width: 240,
          height: 240,
          marginLeft: -120,
          marginTop: -120,
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(${palette.rgb},0.75) 0%, rgba(${palette.rgb},0.18) 45%, transparent 75%)`,
          mixBlendMode: "screen" as const,
          filter: "blur(10px)",
        }}
      />

      {/* HUD BOTTOM — "TRANSIT" status */}
      <motion.div
        className="absolute left-1/2 mono uppercase"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.7, 0.5, 0] }}
        transition={{ duration: DURATION, times: [0, 0.28, 0.75, 1] }}
        style={{
          bottom: "calc(13vh + 16px)",
          transform: "translateX(-50%)",
          letterSpacing: "0.45em",
          fontSize: "9px",
          color: `rgba(${palette.rgb},0.65)`,
        }}
      >
        Transit
      </motion.div>
    </motion.div>
  );
}
