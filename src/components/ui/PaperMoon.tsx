"use client";
import { motion } from "framer-motion";

interface PaperMoonProps {
  label: string;
  detail: string;
  angle: number;
  radius: number;
  onClick?: () => void;
  active?: boolean;
}

export function PaperMoon({
  label,
  detail,
  angle,
  radius,
  onClick,
  active,
}: PaperMoonProps) {
  const x = Math.cos((angle * Math.PI) / 180) * radius;
  const y = Math.sin((angle * Math.PI) / 180) * radius;

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.1, x: x * 1.06, y: y * 1.06 }}
      style={{
        position: "absolute",
        left: `calc(50% + ${x}px)`,
        top: `calc(50% + ${y}px)`,
      }}
      className="-translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1 group"
      aria-label={`Lune ${label}`}
    >
      <span
        className="block w-12 h-12 rounded-full"
        style={{
          background: "var(--color-paper-cream)",
          boxShadow:
            "0 6px 12px rgba(0,0,0,0.5), 0 1px 2px rgba(0,0,0,0.3), inset -3px -3px 6px rgba(0,0,0,0.18)",
          outline: active ? "1px solid var(--color-thread)" : "none",
        }}
      />
      <span className="mono text-[10px] uppercase tracking-widest text-text-muted group-hover:text-text">
        {label}
      </span>
      <span className="serif-italic text-[11px] text-text-muted opacity-0 group-hover:opacity-100 transition max-w-[140px] text-center leading-tight">
        {detail}
      </span>
    </motion.button>
  );
}
