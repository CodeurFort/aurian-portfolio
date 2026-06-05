"use client";

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Per-planet ambient overlay. Subtle, non-obscuring, signature per slug.
// All effects sit at z-[8] (above canvas, below header / arrows / chatbot).

const Z = 8;

function LevelsAmbient() {
  // Stained-glass modern dark: floating geometric glass shards with cool accents,
  // discreet "leaded" grid, periodic diagonal light sweep.
  const shards = useMemo(
    () => [
      { left: "8%", top: "14%", w: 240, h: 150, rotate: -8, color: "164,245,200", delay: 0 },
      { left: "62%", top: "8%", w: 180, h: 220, rotate: 6, color: "200,169,155", delay: 0.4 },
      { left: "30%", top: "58%", w: 280, h: 140, rotate: -4, color: "224,183,96", delay: 0.8 },
      { left: "74%", top: "48%", w: 200, h: 200, rotate: 10, color: "164,245,200", delay: 1.2 },
      { left: "12%", top: "72%", w: 160, h: 120, rotate: 14, color: "236,230,214", delay: 0.6 },
      { left: "46%", top: "28%", w: 130, h: 180, rotate: -12, color: "200,169,155", delay: 1.0 },
      { left: "82%", top: "76%", w: 150, h: 130, rotate: -6, color: "224,183,96", delay: 1.4 },
    ],
    []
  );

  return (
    <motion.div
      key="amb-levels"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.0 }}
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: Z }}
    >
      {/* deep base vignette tint */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 40%, rgba(15,22,30,0.35) 0%, transparent 70%)",
        }}
      />

      {/* leaded glass grid (very subtle, cathedral feel) */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(180,180,170,0.06) 1px, transparent 1px), \
             linear-gradient(90deg, rgba(180,180,170,0.06) 1px, transparent 1px)",
          backgroundSize: "140px 100px",
          maskImage:
            "radial-gradient(ellipse at center, rgba(0,0,0,0.7) 0%, transparent 80%)",
          WebkitMaskImage:
            "radial-gradient(ellipse at center, rgba(0,0,0,0.7) 0%, transparent 80%)",
        }}
      />

      {/* glass shards */}
      {shards.map((s, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{
            left: s.left,
            top: s.top,
            width: s.w,
            height: s.h,
            mixBlendMode: "screen",
          }}
          initial={{ rotate: s.rotate, y: 0, opacity: 0 }}
          animate={{
            rotate: [s.rotate, s.rotate + 1.5, s.rotate, s.rotate - 1.5, s.rotate],
            y: [0, -8, 0, 8, 0],
            opacity: 1,
          }}
          transition={{
            duration: 14 + i * 1.5,
            delay: s.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, rgba(${s.color},0.22) 0%, rgba(${s.color},0.07) 60%, transparent 100%)`,
              border: `1px solid rgba(${s.color},0.4)`,
              borderRadius: 2,
              boxShadow: `0 0 18px rgba(${s.color},0.18), inset 0 0 24px rgba(${s.color},0.10)`,
            }}
          />
          {/* edge highlight */}
          <div
            className="absolute"
            style={{
              left: 0,
              right: 0,
              top: 0,
              height: 1,
              background: `linear-gradient(90deg, transparent 0%, rgba(${s.color},0.85) 50%, transparent 100%)`,
            }}
          />
        </motion.div>
      ))}

      {/* diagonal light sweep (long, periodic) */}
      <motion.div
        aria-hidden
        className="absolute"
        style={{
          left: 0,
          top: "-20vh",
          width: 260,
          height: "140vh",
          transform: "rotate(18deg)",
          transformOrigin: "50% 50%",
          background:
            "linear-gradient(90deg, transparent 0%, rgba(236,230,214,0.08) 35%, rgba(164,245,200,0.22) 50%, rgba(236,230,214,0.08) 65%, transparent 100%)",
          filter: "blur(10px)",
          mixBlendMode: "screen",
        }}
        animate={{ x: ["-30vw", "120vw"] }}
        transition={{
          duration: 9,
          repeat: Infinity,
          ease: "easeInOut",
          repeatDelay: 5,
        }}
      />
    </motion.div>
  );
}

function EnergizerAmbient() {
  // Vertical green data streams
  const streams = useMemo(
    () =>
      Array.from({ length: 14 }).map((_, i) => ({
        left: `${(i / 14) * 100 + Math.random() * 4}%`,
        delay: Math.random() * 4,
        duration: 4 + Math.random() * 3,
        width: 1 + Math.random() * 1.2,
        height: 60 + Math.random() * 120,
      })),
    []
  );
  return (
    <motion.div
      key="amb-energizer"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.9 }}
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: Z, mixBlendMode: "screen" }}
    >
      {streams.map((s, i) => (
        <motion.div
          key={i}
          className="absolute"
          initial={{ y: "-20vh", opacity: 0 }}
          animate={{ y: "120vh", opacity: [0, 0.6, 0.6, 0] }}
          transition={{
            duration: s.duration,
            delay: s.delay,
            repeat: Infinity,
            ease: "linear",
            times: [0, 0.1, 0.9, 1],
          }}
          style={{
            left: s.left,
            top: 0,
            width: s.width,
            height: s.height,
            background:
              "linear-gradient(180deg, transparent 0%, rgba(164,245,200,0.6) 30%, rgba(164,245,200,0.9) 60%, transparent 100%)",
            boxShadow: "0 0 8px rgba(164,245,200,0.5)",
            borderRadius: 999,
          }}
        />
      ))}
    </motion.div>
  );
}

function MiraklAmbient() {
  // Orbiting gold particles around screen edges
  const particles = useMemo(
    () =>
      Array.from({ length: 12 }).map((_, i) => ({
        radius: 38 + i * 1.2,
        delay: (i * 1.4) % 6,
        duration: 18 + Math.random() * 6,
        size: 2 + Math.random() * 2,
        startAngle: (i / 12) * 360,
      })),
    []
  );
  return (
    <motion.div
      key="amb-mirakl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.9 }}
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: Z, mixBlendMode: "screen" }}
    >
      {particles.map((p, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{
            left: "50%",
            top: "50%",
            width: 0,
            height: 0,
          }}
          animate={{ rotate: 360 }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "linear",
          }}
          initial={{ rotate: p.startAngle }}
        >
          <span
            className="absolute"
            style={{
              left: `${p.radius}vmin`,
              top: 0,
              width: p.size,
              height: p.size,
              borderRadius: 999,
              background: "#E0B760",
              boxShadow: "0 0 8px rgba(224,183,96,0.7), 0 0 18px rgba(224,183,96,0.4)",
              transform: "translate(-50%, -50%)",
            }}
          />
        </motion.div>
      ))}
    </motion.div>
  );
}

function BeyondAmbient() {
  // Aurora-like soft drifting gradients (blush + thread tint)
  return (
    <motion.div
      key="amb-beyond"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.2 }}
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: Z, mixBlendMode: "screen" }}
    >
      <motion.div
        className="absolute inset-0"
        animate={{
          backgroundPosition: ["0% 30%", "100% 70%", "0% 30%"],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        style={{
          backgroundImage:
            "radial-gradient(ellipse 60% 30% at 30% 30%, rgba(200,169,155,0.28) 0%, transparent 60%), \
             radial-gradient(ellipse 70% 40% at 70% 60%, rgba(164,245,200,0.18) 0%, transparent 65%), \
             radial-gradient(ellipse 50% 25% at 55% 80%, rgba(200,169,155,0.18) 0%, transparent 70%)",
          backgroundSize: "200% 200%, 220% 200%, 180% 200%",
          filter: "blur(28px)",
        }}
      />
    </motion.div>
  );
}

function TheLookAmbient() {
  // Horizontal scan line that sweeps top→bottom
  return (
    <motion.div
      key="amb-thelook"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: Z, mixBlendMode: "screen" }}
    >
      {/* Subtle scanlines pattern */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(142,139,131,0.08) 0px, rgba(142,139,131,0.08) 1px, transparent 1px, transparent 4px)",
          opacity: 0.5,
        }}
      />
      {/* Sweeping scan */}
      <motion.div
        className="absolute left-0 right-0"
        animate={{ y: ["-5vh", "100vh"] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: "linear" }}
        style={{
          height: 90,
          background:
            "linear-gradient(180deg, transparent 0%, rgba(142,139,131,0.1) 35%, rgba(236,230,214,0.18) 50%, rgba(142,139,131,0.1) 65%, transparent 100%)",
        }}
      />
    </motion.div>
  );
}

// Voile métallique : blur 2.5px + voile gris perle léger (12% au centre)
// au-dessus de l'ambient et du canvas. Assez perceptible pour adoucir
// les arêtes vives (étoiles, wireframe) sans flouter le contenu utile.
function LightMetallicVeil() {
  return (
    <motion.div
      key="planet-light-veil"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      aria-hidden
      className="fixed inset-0 pointer-events-none"
      style={{
        zIndex: 9,
        background:
          "radial-gradient(ellipse 90% 80% at 50% 55%, rgba(226,229,235,0.12) 0%, rgba(226,229,235,0.05) 60%, transparent 100%)",
        backdropFilter: "blur(2.5px)",
        WebkitBackdropFilter: "blur(2.5px)",
      }}
    />
  );
}

export function PlanetAmbient({ slug }: { slug: string }) {
  let node: React.ReactNode = null;
  if (slug === "levels") node = <LevelsAmbient />;
  else if (slug === "energizer") node = <EnergizerAmbient />;
  else if (slug === "mirakl") node = <MiraklAmbient />;
  else if (slug === "music-agency") node = <BeyondAmbient />;
  else if (slug === "thelook") node = <TheLookAmbient />;

  if (!node) return null;

  return (
    <>
      <AnimatePresence mode="wait">{node}</AnimatePresence>
      <LightMetallicVeil />
    </>
  );
}
