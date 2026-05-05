"use client";
import { motion } from "framer-motion";
import { ArrowUp } from "lucide-react";
import { projects, profile, outroQuote } from "@/lib/content";
import { PaperPlanet } from "@/components/ui/PaperPlanet";

const POSITIONS = [
  { top: "20%", left: "16%", size: 90 },
  { top: "30%", left: "78%", size: 72 },
  { top: "62%", left: "22%", size: 80 },
  { top: "70%", left: "72%", size: 100 },
  { top: "44%", left: "50%", size: 64 },
];

export function Outro() {
  return (
    <section id="outro" className="relative min-h-screen flex flex-col items-center justify-center px-6 py-24">
      {projects.map((p, i) => (
        <motion.div
          key={p.slug}
          className="absolute"
          style={{ top: POSITIONS[i].top, left: POSITIONS[i].left }}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 0.85 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.15, duration: 1 }}
        >
          <PaperPlanet color={p.paperColor} size={POSITIONS[i].size} seed={i + 11} />
        </motion.div>
      ))}
      <motion.p
        className="serif-italic text-3xl md:text-5xl text-center max-w-3xl relative z-10 leading-snug"
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 1 }}
      >
        {outroQuote}
      </motion.p>
      <div className="flex gap-6 mt-12 relative z-10">
        <a
          href={`mailto:${profile.email}`}
          className="mono text-[12px] uppercase tracking-widest border-b border-thread text-thread hover:opacity-80"
        >
          écrivez-moi →
        </a>
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="mono text-[12px] uppercase tracking-widest text-text-muted hover:text-text inline-flex items-center gap-1"
        >
          <ArrowUp size={12} /> rejouer
        </button>
      </div>
    </section>
  );
}
