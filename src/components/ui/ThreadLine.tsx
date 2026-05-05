"use client";
import { motion } from "framer-motion";

interface ThreadLineProps {
  d: string;
  width?: number;
  height?: number;
  active?: boolean;
  className?: string;
}

export function ThreadLine({
  d,
  width = 800,
  height = 200,
  active = true,
  className,
}: ThreadLineProps) {
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height={height}
      className={className}
      preserveAspectRatio="none"
      aria-hidden
    >
      <motion.path
        d={d}
        fill="none"
        stroke="var(--color-thread)"
        strokeWidth={1.25}
        strokeDasharray="6 8"
        strokeLinecap="round"
        opacity={active ? 0.85 : 0.18}
        initial={{ strokeDashoffset: 0 }}
        animate={{ strokeDashoffset: -200 }}
        transition={{ duration: 5, ease: "linear", repeat: Infinity }}
        style={{
          filter: active
            ? "drop-shadow(0 0 6px var(--color-thread-glow))"
            : "none",
        }}
      />
    </svg>
  );
}
