"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";

// Per-transition overlay played on goTo. Picks a variant based on tick.
// All variants are subtle (no bright central burst) and use mix-blend screen.
// Variants: "streaks" | "converge" | "wipe" | "shock" | "drift"

type Variant = "streaks" | "converge" | "wipe" | "shock" | "drift";

const VARIANTS: Variant[] = ["streaks", "converge", "wipe", "shock", "drift"];

export function pickVariant(tick: number): Variant {
  // Deterministic cycling so consecutive transitions differ.
  return VARIANTS[(tick - 1) % VARIANTS.length] ?? "streaks";
}

function StreaksOut() {
  const N = 56;
  const streaks = useMemo(
    () =>
      Array.from({ length: N }).map(() => {
        const angle = Math.random() * Math.PI * 2;
        const angleDeg = (angle * 180) / Math.PI;
        const distance = 600 + Math.random() * 320;
        const width = 1 + Math.random() * 2;
        const length = 70 + Math.random() * 100;
        const delay = Math.random() * 0.08;
        const isThread = Math.random() < 0.22;
        const color = isThread ? "164,245,200" : "236,230,214";
        return { angleDeg, distance, width, length, delay, color };
      }),
    []
  );
  return (
    <>
      {streaks.map((s, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            left: "50%",
            top: "50%",
            transform: `rotate(${s.angleDeg}deg)`,
            transformOrigin: "0 0",
          }}
        >
          <motion.div
            initial={{ x: 0, scaleX: 0.05, opacity: 0 }}
            animate={{
              x: s.distance,
              scaleX: [0.05, 1.2, 1.5],
              opacity: [0, 0.85, 0],
            }}
            transition={{
              duration: 0.55 + Math.random() * 0.18,
              delay: s.delay,
              ease: [0.4, 0, 0.6, 1],
            }}
            style={{
              width: s.length,
              height: s.width,
              marginTop: -s.width / 2,
              borderRadius: 999,
              background: `linear-gradient(90deg, transparent 0%, rgba(${s.color},0.85) 55%, rgba(${s.color},0.18) 90%, transparent 100%)`,
              transformOrigin: "0 50%",
            }}
          />
        </div>
      ))}
    </>
  );
}

function ConvergeIn() {
  // Streaks come from the edges and converge toward center.
  const N = 50;
  const streaks = useMemo(
    () =>
      Array.from({ length: N }).map(() => {
        const angle = Math.random() * Math.PI * 2;
        const angleDeg = (angle * 180) / Math.PI;
        const startDist = 700 + Math.random() * 360;
        const width = 1 + Math.random() * 1.6;
        const length = 70 + Math.random() * 90;
        const delay = Math.random() * 0.1;
        const isThread = Math.random() < 0.3;
        const color = isThread ? "164,245,200" : "236,230,214";
        return { angleDeg, startDist, width, length, delay, color };
      }),
    []
  );
  return (
    <>
      {streaks.map((s, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            left: "50%",
            top: "50%",
            transform: `rotate(${s.angleDeg}deg)`,
            transformOrigin: "0 0",
          }}
        >
          <motion.div
            initial={{ x: s.startDist, scaleX: 1.2, opacity: 0 }}
            animate={{
              x: 0,
              scaleX: [1.2, 1, 0.1],
              opacity: [0, 0.85, 0],
            }}
            transition={{
              duration: 0.6 + Math.random() * 0.15,
              delay: s.delay,
              ease: [0.4, 0, 0.2, 1],
            }}
            style={{
              width: s.length,
              height: s.width,
              marginTop: -s.width / 2,
              borderRadius: 999,
              background: `linear-gradient(90deg, transparent 0%, rgba(${s.color},0.18) 10%, rgba(${s.color},0.85) 45%, transparent 100%)`,
              transformOrigin: "0 50%",
            }}
          />
        </div>
      ))}
    </>
  );
}

function Wipe() {
  // Diagonal mint sweep across the screen.
  return (
    <>
      <motion.div
        className="absolute"
        initial={{ x: "-120vw", opacity: 0 }}
        animate={{ x: "120vw", opacity: [0, 0.55, 0.55, 0] }}
        transition={{
          duration: 0.7,
          times: [0, 0.2, 0.8, 1],
          ease: [0.4, 0, 0.2, 1],
        }}
        style={{
          left: 0,
          top: "-30vh",
          height: "160vh",
          width: 220,
          background:
            "linear-gradient(90deg, transparent 0%, rgba(164,245,200,0.05) 30%, rgba(236,230,214,0.45) 50%, rgba(164,245,200,0.05) 70%, transparent 100%)",
          filter: "blur(2px)",
          transform: "rotate(14deg)",
          transformOrigin: "50% 50%",
        }}
      />
      <motion.div
        className="absolute"
        initial={{ x: "-100vw", opacity: 0 }}
        animate={{ x: "120vw", opacity: [0, 0.35, 0.35, 0] }}
        transition={{
          duration: 0.65,
          delay: 0.08,
          times: [0, 0.2, 0.8, 1],
          ease: [0.4, 0, 0.2, 1],
        }}
        style={{
          left: 0,
          top: "-30vh",
          height: "160vh",
          width: 80,
          background:
            "linear-gradient(90deg, transparent 0%, rgba(164,245,200,0.85) 50%, transparent 100%)",
          filter: "blur(1px)",
          transform: "rotate(14deg)",
          transformOrigin: "50% 50%",
        }}
      />
    </>
  );
}

function Shock() {
  // Three concentric thin rings expanding from center.
  const rings = [
    { delay: 0, color: "236,230,214", thickness: 1.2 },
    { delay: 0.12, color: "164,245,200", thickness: 1 },
    { delay: 0.24, color: "236,230,214", thickness: 0.8 },
  ];
  return (
    <>
      {rings.map((r, i) => (
        <motion.div
          key={i}
          className="absolute"
          initial={{ scale: 0.05, opacity: 0 }}
          animate={{ scale: [0.05, 1.6], opacity: [0, 0.55, 0] }}
          transition={{
            duration: 0.7,
            delay: r.delay,
            ease: [0.2, 0.6, 0.4, 1],
          }}
          style={{
            left: "50%",
            top: "50%",
            width: "min(100vw, 100vh)",
            height: "min(100vw, 100vh)",
            marginLeft: "calc(min(100vw, 100vh) * -0.5)",
            marginTop: "calc(min(100vw, 100vh) * -0.5)",
            borderRadius: "50%",
            border: `${r.thickness}px solid rgba(${r.color},0.85)`,
            boxShadow: `0 0 12px rgba(${r.color},0.35)`,
          }}
        />
      ))}
    </>
  );
}

function Drift() {
  // Soft horizontal drift of light particles, no center origin.
  const N = 70;
  const particles = useMemo(
    () =>
      Array.from({ length: N }).map(() => {
        const top = Math.random() * 100;
        const startLeft = Math.random() * 30 - 30;
        const drift = 80 + Math.random() * 60;
        const size = 1 + Math.random() * 2;
        const delay = Math.random() * 0.15;
        const dur = 0.55 + Math.random() * 0.25;
        const isThread = Math.random() < 0.25;
        const color = isThread ? "164,245,200" : "236,230,214";
        return { top, startLeft, drift, size, delay, dur, color };
      }),
    []
  );
  return (
    <>
      {particles.map((p, i) => (
        <motion.div
          key={i}
          className="absolute"
          initial={{ left: `${p.startLeft}vw`, opacity: 0 }}
          animate={{
            left: `${p.startLeft + p.drift}vw`,
            opacity: [0, 0.85, 0],
          }}
          transition={{
            duration: p.dur,
            delay: p.delay,
            ease: "easeOut",
          }}
          style={{
            top: `${p.top}vh`,
            width: p.size * 14,
            height: p.size,
            borderRadius: 999,
            background: `linear-gradient(90deg, transparent 0%, rgba(${p.color},0.85) 60%, transparent 100%)`,
            boxShadow: `0 0 4px rgba(${p.color},0.4)`,
          }}
        />
      ))}
    </>
  );
}

export function PlanetTransition({
  variant,
  tickKey,
}: {
  variant: Variant;
  tickKey: number;
}) {
  return (
    <motion.div
      key={`pt-${tickKey}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 1, 0.9, 0] }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, times: [0, 0.18, 0.6, 1], ease: "easeOut" }}
      className="fixed inset-0 z-[18] pointer-events-none overflow-hidden"
      style={{ mixBlendMode: "screen" }}
    >
      {variant === "streaks" && <StreaksOut />}
      {variant === "converge" && <ConvergeIn />}
      {variant === "wipe" && <Wipe />}
      {variant === "shock" && <Shock />}
      {variant === "drift" && <Drift />}
    </motion.div>
  );
}
