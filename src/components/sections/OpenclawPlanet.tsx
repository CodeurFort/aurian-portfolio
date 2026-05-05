"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Project } from "@/lib/content";
import { ProjectPlanet } from "@/components/sections/ProjectPlanet";
import { PaperMoon } from "@/components/ui/PaperMoon";

interface Props {
  project: Project;
  index: number;
}

export function OpenclawPlanet({ project, index }: Props) {
  const [activeMoon, setActiveMoon] = useState<string | null>(null);
  const moons = project.moons ?? [];
  const angles = [-50, 90, -130];

  return (
    <div className="relative">
      <ProjectPlanet project={project} index={index} enlarged>
        <div
          className="absolute inset-0 scale-[0.65] sm:scale-100 origin-center"
          style={{ width: 320, height: 320 }}
        >
          {moons.map((m, i) => (
            <div key={m.name}>
              <PaperMoon
                label={m.name}
                detail={m.pitch}
                angle={angles[i]}
                radius={210}
                active={activeMoon === m.name}
                onClick={() => setActiveMoon(activeMoon === m.name ? null : m.name)}
              />
            </div>
          ))}
        </div>
      </ProjectPlanet>

      <AnimatePresence>
        {activeMoon && (
          <motion.div
            key={activeMoon}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className="max-w-3xl mx-auto px-6 -mt-12 mb-24"
          >
            {(() => {
              const m = moons.find((x) => x.name === activeMoon)!;
              return (
                <div className="border border-hairline rounded-lg p-6 bg-paper-deep/60 backdrop-blur">
                  <p className="mono uppercase tracking-[0.3em] text-[10px] text-thread mb-2">
                    lune — {m.name}
                  </p>
                  <p className="serif-italic text-xl mb-4">{m.pitch}</p>
                  <ul className="space-y-1 text-text-muted">
                    {m.bullets.map((b, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="text-thread mt-1.5">·</span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="flex flex-wrap gap-2 mt-4">
                    {m.stack.map((t) => (
                      <span
                        key={t}
                        className="mono text-[10px] uppercase tracking-widest text-text-muted border border-hairline px-2 py-0.5 rounded-full"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
