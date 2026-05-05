"use client";
import { motion } from "framer-motion";
import { PaperPlanet } from "@/components/ui/PaperPlanet";
import type { Project } from "@/lib/content";

const POSITIONS = [
  { top: "18%", left: "12%", size: 80 },
  { top: "30%", left: "78%", size: 64 },
  { top: "62%", left: "20%", size: 72 },
  { top: "70%", left: "70%", size: 90 },
  { top: "44%", left: "48%", size: 56 },
];

export function LandingPlanets({ projects }: { projects: Project[] }) {
  return (
    <>
      {projects.map((p, i) => (
        <motion.div
          key={p.slug}
          className={`absolute ${i >= 3 ? "hidden sm:block" : ""}`}
          style={{ top: POSITIONS[i].top, left: POSITIONS[i].left }}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 0.55, scale: 1 }}
          transition={{ delay: 0.2 + i * 0.15, duration: 1.2, ease: "easeOut" }}
        >
          <PaperPlanet color={p.paperColor} size={POSITIONS[i].size} seed={i + 1} />
        </motion.div>
      ))}
    </>
  );
}
