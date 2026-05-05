"use client";

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Per-planet ambient overlay. Subtle, non-obscuring, signature per slug.
// All effects sit at z-[8] (above canvas, below header / arrows / chatbot).

const Z = 8;

function LevelsAmbient() {
  // Soft cream grid pulse
  return (
    <motion.div
      key="amb-levels"
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 0.18, 0.12, 0.18] }}
      exit={{ opacity: 0 }}
      transition={{ duration: 2.2, repeat: Infinity, repeatType: "mirror" }}
      className="fixed inset-0 pointer-events-none"
      style={{
        zIndex: Z,
        backgroundImage:
          "linear-gradient(rgba(236,230,214,0.18) 1px, transparent 1px), \
           linear-gradient(90deg, rgba(236,230,214,0.18) 1px, transparent 1px)",
        backgroundSize: "60px 60px, 60px 60px",
        maskImage:
          "radial-gradient(circle at center, rgba(0,0,0,0.5) 0%, transparent 65%)",
        WebkitMaskImage:
          "radial-gradient(circle at center, rgba(0,0,0,0.5) 0%, transparent 65%)",
      }}
    />
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

export function PlanetAmbient({ slug }: { slug: string }) {
  let node: React.ReactNode = null;
  if (slug === "levels") node = <LevelsAmbient />;
  else if (slug === "energizer") node = <EnergizerAmbient />;
  else if (slug === "mirakl") node = <MiraklAmbient />;
  else if (slug === "music-agency") node = <BeyondAmbient />;
  else if (slug === "thelook") node = <TheLookAmbient />;

  return <AnimatePresence mode="wait">{node}</AnimatePresence>;
}
