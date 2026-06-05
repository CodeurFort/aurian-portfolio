"use client";

import { useState } from "react";
import { TechIcon } from "./TechIcon";

interface TechPillProps {
  label: string;
  // Variante claire pour les surfaces gris perle (carte projet light).
  light?: boolean;
}
export function TechPill({ label, light = false }: TechPillProps) {
  const [hover, setHover] = useState(false);

  if (light) {
    const color = hover ? "#8C6A1E" : "#1B1E25";
    return (
      <span
        className="mono inline-flex items-center gap-2 px-2.5 py-1 text-[11px] uppercase tracking-widest rounded-full transition-colors"
        style={{
          color,
          border: `1px solid ${
            hover ? "rgba(140,106,30,0.55)" : "rgba(20,22,28,0.18)"
          }`,
          background: "rgba(255,255,255,0.45)",
        }}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        <TechIcon label={label} />
        {label}
      </span>
    );
  }

  // Variante sombre (StackOverlayCard, etc.) — charbon clair par défaut, or au
  // hover pour matcher la même logique.
  const color = hover ? "#E0B760" : "#8E8B83";
  return (
    <span
      className="mono inline-flex items-center gap-2 px-2.5 py-1 text-[11px] uppercase tracking-widest rounded-full transition-colors"
      style={{
        color,
        border: `1px solid ${
          hover ? "rgba(224,183,96,0.55)" : "rgba(255,255,255,0.10)"
        }`,
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <TechIcon label={label} />
      {label}
    </span>
  );
}
