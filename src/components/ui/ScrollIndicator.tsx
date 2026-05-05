"use client";
import { motion } from "framer-motion";

export function ScrollIndicator() {
  return (
    <motion.div
      className="flex flex-col items-center gap-2 text-text-muted"
      animate={{ y: [0, 6, 0] }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
    >
      <span className="mono text-[10px] uppercase tracking-[0.3em]">
        scroll to explore
      </span>
      <span className="block w-px h-10 bg-hairline" />
    </motion.div>
  );
}
