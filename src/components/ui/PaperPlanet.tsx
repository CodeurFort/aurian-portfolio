"use client";
import { motion } from "framer-motion";
import type { PaperColor } from "@/lib/content";

interface PaperPlanetProps {
  color: PaperColor;
  size?: number;
  rotate?: boolean;
  seed?: number;
  className?: string;
}

const colorVar: Record<PaperColor, string> = {
  "paper-cream": "var(--color-paper-cream)",
  "paper-mint": "var(--color-paper-mint)",
  "paper-ochre": "var(--color-paper-ochre)",
  "paper-blush": "var(--color-paper-blush)",
  "paper-stone": "var(--color-paper-stone)",
};

export function PaperPlanet({
  color,
  size = 220,
  rotate = true,
  seed = 1,
  className,
}: PaperPlanetProps) {
  const fill = colorVar[color];
  const craters = Array.from({ length: 5 }, (_, i) => {
    const a = (seed * 13 + i * 47) % 360;
    const r = 30 + ((seed * 7 + i * 11) % 50);
    const cx = 100 + Math.cos((a * Math.PI) / 180) * r;
    const cy = 100 + Math.sin((a * Math.PI) / 180) * r;
    const cr = 6 + ((seed + i) % 4) * 2;
    return { cx, cy, cr };
  });

  return (
    <motion.div
      className={className}
      style={{ width: size, height: size }}
      animate={rotate ? { rotate: 360 } : undefined}
      transition={
        rotate ? { duration: 120, ease: "linear", repeat: Infinity } : undefined
      }
    >
      <svg viewBox="0 0 200 200" width={size} height={size} aria-hidden>
        <defs>
          <filter
            id={`paperShadow-${seed}`}
            x="-30%"
            y="-30%"
            width="160%"
            height="160%"
          >
            <feDropShadow
              dx="0"
              dy="14"
              stdDeviation="10"
              floodColor="#000"
              floodOpacity="0.55"
            />
            <feDropShadow
              dx="0"
              dy="2"
              stdDeviation="2"
              floodColor="#000"
              floodOpacity="0.35"
            />
          </filter>
        </defs>
        <g filter={`url(#paperShadow-${seed})`}>
          <circle cx="100" cy="100" r="92" fill={fill} />
          <circle
            cx="100"
            cy="100"
            r="92"
            fill="none"
            stroke="rgba(0,0,0,0.18)"
            strokeWidth="1"
          />
          {craters.map((c, i) => (
            <circle
              key={i}
              cx={c.cx}
              cy={c.cy}
              r={c.cr}
              fill="rgba(0,0,0,0.10)"
            />
          ))}
          <ellipse
            cx="78"
            cy="70"
            rx="34"
            ry="22"
            fill="rgba(255,255,255,0.18)"
          />
        </g>
      </svg>
    </motion.div>
  );
}
