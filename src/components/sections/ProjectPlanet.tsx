"use client";
import { motion } from "framer-motion";
import { ArrowUpRight, GitBranch } from "lucide-react";
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
                <GitBranch size={12} /> github
              </motion.a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
