"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useUi } from "@/lib/i18n";
import { initSound, isMuted, subscribeMute, toggleMuted } from "@/lib/sound";

// Compact mute pill — mirrors LangToggle styling. Sits left of LangToggle.
export function SoundToggle({ z = 70 }: { z?: number }) {
  const ui = useUi();
  const [muted, setMutedState] = useState(false);

  useEffect(() => {
    initSound();
    setMutedState(isMuted());
    return subscribeMute((m) => setMutedState(m));
  }, []);

  const label = muted ? ui.soundOff : ui.soundOn;

  return (
    <motion.button
      type="button"
      onClick={() => toggleMuted()}
      aria-label={label}
      aria-pressed={!muted}
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="fixed top-3 right-[88px] md:top-6 md:right-[112px] select-none grid place-items-center"
      style={{
        zIndex: z,
        width: 31,
        height: 31,
        borderRadius: 999,
        background: "rgba(14,15,18,0.85)",
        border: "1px solid rgba(164,245,200,0.22)",
        boxShadow: "0 4px 14px rgba(0,0,0,0.45)",
        backdropFilter: "blur(6px)",
        color: muted ? "rgba(236,230,214,0.55)" : "#A4F5C8",
        cursor: "pointer",
      }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden>
        {/* Speaker body */}
        <path
          d="M3 10v4h3.5L11 18V6L6.5 10H3z"
          fill="currentColor"
        />
        {muted ? (
          // Cross over speaker
          <g stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <line x1="15" y1="9" x2="21" y2="15" />
            <line x1="21" y1="9" x2="15" y2="15" />
          </g>
        ) : (
          // Sound waves
          <g stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round">
            <path d="M14 9c1.2 1 1.2 5 0 6" />
            <path d="M17 7c2.5 1.8 2.5 8.2 0 10" />
          </g>
        )}
      </svg>
    </motion.button>
  );
}
