"use client";
import { motion } from "framer-motion";
import { PaperPlanet } from "@/components/ui/PaperPlanet";
import { ScrollIndicator } from "@/components/ui/ScrollIndicator";
import { profile, projects } from "@/lib/content";

const POSITIONS = [
  { top: "18%", left: "12%", size: 80 },
  { top: "30%", left: "78%", size: 64 },
  { top: "62%", left: "20%", size: 72 },
  { top: "70%", left: "70%", size: 90 },
  { top: "44%", left: "48%", size: 56 },
];

export function Landing() {
  return (
    <section
      id="landing"
      className="relative min-h-screen flex flex-col items-center justify-center px-6"
    >
      {projects.map((p, i) => (
        <motion.div
          key={p.slug}
          className="absolute"
          style={{ top: POSITIONS[i].top, left: POSITIONS[i].left }}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 0.55, scale: 1 }}
          transition={{ delay: 0.2 + i * 0.15, duration: 1.2, ease: "easeOut" }}
        >
          <PaperPlanet color={p.paperColor} size={POSITIONS[i].size} seed={i + 1} />
        </motion.div>
      ))}
      <motion.h1
        className="serif-italic text-text text-[clamp(72px,12vw,160px)] leading-none text-center relative z-10"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: [0.2, 0.8, 0.2, 1] }}
      >
        aurian<span className="text-thread">.</span>
      </motion.h1>
      <motion.p
        className="serif-italic text-text-muted text-lg md:text-xl mt-6 max-w-xl text-center relative z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 1 }}
      >
        {profile.tagline}
      </motion.p>
      <div className="absolute bottom-10 z-10">
        <ScrollIndicator />
      </div>
    </section>
  );
}
