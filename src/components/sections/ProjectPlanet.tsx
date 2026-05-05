"use client";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

function GithubMark({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.36-3.88-1.36-.52-1.32-1.27-1.67-1.27-1.67-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.74 2.68 1.24 3.34.95.1-.74.4-1.24.72-1.53-2.55-.29-5.24-1.27-5.24-5.66 0-1.25.45-2.27 1.18-3.07-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.15 1.17a10.95 10.95 0 0 1 5.74 0c2.19-1.48 3.15-1.17 3.15-1.17.62 1.58.23 2.75.11 3.04.74.8 1.18 1.82 1.18 3.07 0 4.4-2.7 5.36-5.27 5.65.41.36.78 1.06.78 2.14v3.18c0 .31.21.67.8.55A11.5 11.5 0 0 0 12 .5z"/>
    </svg>
  );
}
import type { Project } from "@/lib/content";
import { PaperPlanet } from "@/components/ui/PaperPlanet";
import { EditorialTitle } from "@/components/ui/EditorialTitle";
import { TechPill } from "@/components/ui/TechPill";
import { ThreadLine } from "@/components/ui/ThreadLine";

interface ProjectPlanetProps {
  project: Project;
  index: number;
  enlarged?: boolean;
  children?: React.ReactNode;
}

export function ProjectPlanet({ project, index, enlarged, children }: ProjectPlanetProps) {
  const reverse = index % 2 === 1;
  const planetSize = enlarged ? 320 : 240;

  return (
    <section
      id={`project-${project.slug}`}
      className="relative min-h-screen flex items-center px-6 py-24"
    >
      <div className="absolute top-0 left-0 right-0 -translate-y-1/2 pointer-events-none">
        <ThreadLine d="M0,100 C200,40 600,160 800,100" height={120} />
      </div>

      <div
        className={`relative max-w-6xl mx-auto w-full grid md:grid-cols-2 gap-12 items-center ${
          reverse ? "md:[&>*:first-child]:order-2" : ""
        }`}
      >
        <div className="flex justify-center relative">
          <PaperPlanet color={project.paperColor} size={planetSize} seed={index + 7} />
          {children}
        </div>

        <div className="space-y-6 max-w-lg">
          <p className="mono uppercase tracking-[0.3em] text-[11px] text-text-muted">
            chapitre {project.chapter}.
          </p>
          <EditorialTitle size="lg">{project.title}</EditorialTitle>
          {project.role && (
            <p className="mono text-[11px] uppercase tracking-widest text-text-muted">
              {project.role}
            </p>
          )}
          <div className="space-y-3 text-text-muted leading-relaxed whitespace-pre-line">
            {project.pitch}
          </div>
          <div>
            <p className="mono uppercase tracking-[0.3em] text-[10px] text-text-muted mb-2">stack</p>
            <div className="flex flex-wrap gap-2">
              {project.stack.map((t) => (
                <TechPill key={t} label={t} />
              ))}
            </div>
          </div>
          <div>
            <p className="mono uppercase tracking-[0.3em] text-[10px] text-text-muted mb-2">
              achievements
            </p>
            <ul className="space-y-1.5 text-text">
              {project.achievements.map((a, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-thread mt-1.5">·</span>
                  <span className="leading-snug">{a}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex gap-4 pt-2">
            {project.liveUrl && (
              <motion.a
                href={project.liveUrl}
                target="_blank"
                rel="noreferrer"
                whileHover={{ x: 2 }}
                className="mono text-[11px] uppercase tracking-widest inline-flex items-center gap-1 border-b border-hairline hover:border-thread hover:text-thread"
              >
                voir live <ArrowUpRight size={12} />
              </motion.a>
            )}
            {project.repoUrl && (
              <motion.a
                href={project.repoUrl}
                target="_blank"
                rel="noreferrer"
                whileHover={{ x: 2 }}
                className="mono text-[11px] uppercase tracking-widest inline-flex items-center gap-1 border-b border-hairline hover:border-thread hover:text-thread"
              >
                <GithubMark size={12} /> github
              </motion.a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
