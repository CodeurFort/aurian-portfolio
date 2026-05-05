"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { projects, softSkills } from "@/lib/content";
import { PaperPlanet } from "@/components/ui/PaperPlanet";
import { EditorialTitle } from "@/components/ui/EditorialTitle";

// canonical positions per project slug, in viewBox coords (1000x600)
const PLANET_POS: Record<string, { x: number; y: number; size: number }> = {
  levels:         { x: 180, y: 180, size: 70 },
  energizer:      { x: 480, y: 110, size: 64 },
  mirakl:         { x: 820, y: 200, size: 60 },
  "music-agency": { x: 700, y: 460, size: 70 },
  openclaw:       { x: 240, y: 460, size: 90 },
};

function pathBetween(a: string, b: string) {
  const A = PLANET_POS[a], B = PLANET_POS[b];
  if (!A || !B) return "";
  const mx = (A.x + B.x) / 2;
  const my = (A.y + B.y) / 2 - 30;
  return `M${A.x},${A.y} Q${mx},${my} ${B.x},${B.y}`;
}

function chainPaths(slugs: string[]): string[] {
  const out: string[] = [];
  for (let i = 0; i < slugs.length - 1; i++) out.push(pathBetween(slugs[i], slugs[i + 1]));
  return out;
}

export function Threads() {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  return (
    <section id="threads" className="relative min-h-screen flex flex-col items-center justify-center px-6 py-24">
      <div className="text-center mb-12 max-w-2xl">
        <p className="mono uppercase tracking-[0.3em] text-[11px] text-text-muted mb-4">
          les fils
        </p>
        <EditorialTitle size="lg">
          <span className="text-text">soft skills, </span>
          <span className="text-thread">tendus</span>
          <span className="text-text"> entre les projets.</span>
        </EditorialTitle>
      </div>

      <div className="relative w-full max-w-5xl aspect-[4/5] md:aspect-[5/3]">
        <svg viewBox="0 0 1000 600" className="absolute inset-0 w-full h-full">
          {softSkills.map((s, i) => {
            const paths = chainPaths(s.linkedProjectSlugs);
            const active = activeIdx === null || activeIdx === i;
            return paths.map((d, j) => (
              <motion.path
                key={`${s.slug}-${j}`}
                d={d}
                fill="none"
                stroke="var(--color-thread)"
                strokeWidth={activeIdx === i ? 2 : 1.1}
                strokeDasharray="6 8"
                strokeLinecap="round"
                opacity={active ? 0.85 : 0.12}
                initial={{ pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 + i * 0.5 + j * 0.1, duration: 1.2, ease: "easeOut" }}
                style={{ filter: active ? "drop-shadow(0 0 6px var(--color-thread-glow))" : "none" }}
              />
            ));
          })}
          {projects.map((p) => {
            const pos = PLANET_POS[p.slug];
            return (
              <foreignObject
                key={p.slug}
                x={pos.x - pos.size / 2}
                y={pos.y - pos.size / 2}
                width={pos.size}
                height={pos.size}
              >
                <PaperPlanet color={p.paperColor} size={pos.size} rotate={false} seed={p.slug.length} />
              </foreignObject>
            );
          })}
        </svg>
      </div>

      <div className="mt-12 grid md:grid-cols-2 gap-6 max-w-3xl w-full">
        {softSkills.map((s, i) => (
          <motion.button
            key={s.slug}
            type="button"
            onMouseEnter={() => setActiveIdx(i)}
            onMouseLeave={() => setActiveIdx(null)}
            onFocus={() => setActiveIdx(i)}
            onBlur={() => setActiveIdx(null)}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.6 + i * 0.2 }}
            className="text-left border border-hairline rounded-md p-5 hover:border-thread/40 transition group"
          >
            <p className="mono uppercase tracking-[0.3em] text-[10px] text-thread group-hover:text-thread mb-2">
              fil 0{i + 1}
            </p>
            <p className="serif-italic text-2xl mb-1">{s.label.toLowerCase()}</p>
            <p className="text-text-muted serif-italic text-base">« {s.quote} »</p>
          </motion.button>
        ))}
      </div>
    </section>
  );
}
