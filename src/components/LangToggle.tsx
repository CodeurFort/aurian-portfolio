"use client";

import { motion } from "framer-motion";
import { useLang, type Lang } from "@/lib/i18n";

// Compact pill toggle FR / EN. Placed top-right above the StarLegend area on
// the main view, top-right on the landing/intro overlay too.
export function LangToggle({
  className = "",
  z = 50,
}: {
  className?: string;
  z?: number;
}) {
  const { lang, setLang } = useLang();
  const opts: { value: Lang; label: string }[] = [
    { value: "fr", label: "FR" },
    { value: "en", label: "EN" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`fixed top-3 right-3 md:top-6 md:right-6 select-none ${className}`}
      style={{
        zIndex: z,
        display: "flex",
        gap: 0,
        padding: 2,
        borderRadius: 999,
        background: "rgba(14,15,18,0.85)",
        border: "1px solid rgba(164,245,200,0.22)",
        boxShadow: "0 4px 14px rgba(0,0,0,0.45)",
        backdropFilter: "blur(6px)",
      }}
      role="group"
      aria-label="Langue / Language"
    >
      {opts.map((o) => {
        const active = lang === o.value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => setLang(o.value)}
            aria-pressed={active}
            className="mono uppercase transition-colors"
            style={{
              fontSize: 10,
              letterSpacing: "0.18em",
              padding: "5px 10px",
              borderRadius: 999,
              color: active ? "#07080A" : "rgba(236,230,214,0.7)",
              background: active ? "#A4F5C8" : "transparent",
              border: "none",
              cursor: "pointer",
              minWidth: 32,
              fontWeight: active ? 600 : 400,
            }}
          >
            {o.label}
          </button>
        );
      })}
    </motion.div>
  );
}
