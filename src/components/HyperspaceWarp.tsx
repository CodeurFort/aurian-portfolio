"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";

// Brief star-streak overlay played on each planet transition.
// Mounted by AnimatePresence with a key tied to a counter that ticks on goTo.
export function HyperspaceWarp() {
  const N = 70;
  const streaks = useMemo(
    () =>
      Array.from({ length: N }).map(() => {
        const angle = Math.random() * Math.PI * 2;
        const angleDeg = (angle * 180) / Math.PI;
        const distance = 700 + Math.random() * 360;
        const width = 1 + Math.random() * 2.4;
        const length = 80 + Math.random() * 110;
        const delay = Math.random() * 0.09;
        const isThread = Math.random() < 0.22;
        const color = isThread ? "164,245,200" : "236,230,214";
        return { angleDeg, distance, width, length, delay, color };
      }),
    []
  );

  return (
    <motion.div
      key="hyperspace-warp"
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 1, 0.85, 0] }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.7, times: [0, 0.18, 0.55, 1], ease: "easeOut" }}
      className="fixed inset-0 z-[18] pointer-events-none overflow-hidden"
      style={{
        mixBlendMode: "screen",
      }}
    >
      {/* Faint center burst */}
      <motion.div
        className="absolute"
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: [0.4, 1.4, 2.6], opacity: [0, 0.8, 0] }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        style={{
          left: "50%",
          top: "50%",
          width: 180,
          height: 180,
          marginLeft: -90,
          marginTop: -90,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(236,230,214,0.55) 0%, rgba(164,245,200,0.18) 35%, transparent 70%)",
          filter: "blur(2px)",
        }}
      />

      {/* Streaks */}
      {streaks.map((s, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            left: "50%",
            top: "50%",
            transform: `rotate(${s.angleDeg}deg)`,
            transformOrigin: "0 0",
            pointerEvents: "none",
          }}
        >
          <motion.div
            initial={{ x: 0, scaleX: 0.05, opacity: 0 }}
            animate={{
              x: s.distance,
              scaleX: [0.05, 1.4, 1.7],
              opacity: [0, 1, 0],
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
              background: `linear-gradient(90deg, transparent 0%, rgba(${s.color},0.95) 55%, rgba(${s.color},0.2) 90%, transparent 100%)`,
              transformOrigin: "0 50%",
              boxShadow: `0 0 6px rgba(${s.color},0.6)`,
            }}
          />
        </div>
      ))}
    </motion.div>
  );
}
