"use client";
import { motion } from "framer-motion";
import { PaperSilhouette } from "@/components/ui/PaperSilhouette";
import { profile, softSkills } from "@/lib/content";

const STAR_POSITIONS = [
  { top: "12%", left: "18%" },
  { top: "20%", left: "78%" },
  { top: "70%", left: "16%" },
  { top: "60%", left: "82%" },
];

export function Prelude() {
  return (
    <section
      id="prelude"
      className="relative min-h-screen flex items-center justify-center px-6 py-24"
    >
      <div className="relative max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-12">
        <div className="relative">
          <PaperSilhouette />
          {softSkills.map((s, i) => (
            <motion.span
              key={s.slug}
              className="absolute serif-italic text-thread text-sm md:text-base whitespace-nowrap"
              style={STAR_POSITIONS[i]}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 + i * 0.2, duration: 0.8 }}
            >
              ✦ {s.label.toLowerCase()}
            </motion.span>
          ))}
        </div>
        <div className="max-w-md space-y-6">
          <p className="mono uppercase tracking-[0.3em] text-[10px] text-text-muted">
            prélude
          </p>
          <p className="serif-italic text-2xl md:text-3xl leading-snug">
            Je construis des outils qui pensent — entre rigueur du code et intuition du papier.
          </p>
          <p className="text-text-muted leading-relaxed">
            Automation, agents IA, dev web. Avec un goût pour les transitions douces, les
            interfaces lisibles, et les détails qu&apos;on remarque au deuxième regard.
          </p>
          <div className="flex gap-4 mono text-[11px] text-text-muted">
            {profile.languages.map((l) => (
              <span key={l.code} className="flex flex-col">
                <span className="text-text">{l.code}</span>
                <span>{l.level}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
