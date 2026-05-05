"use client";
import { motion } from "framer-motion";

export function PulseDivider() {
  return (
    <div className="relative w-full h-px overflow-visible" aria-hidden>
      <motion.span
        className="absolute left-0 top-0 h-px"
        style={{
          width: "100%",
          background:
            "linear-gradient(90deg, transparent 0%, var(--color-thread) 50%, transparent 100%)",
        }}
        initial={{ opacity: 0, scaleX: 0.2 }}
        whileInView={{ opacity: [0, 1, 0], scaleX: [0.2, 1, 1] }}
        viewport={{ once: false, amount: 0.8 }}
        transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
      />
    </div>
  );
}
