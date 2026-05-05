"use client";

import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import type { Project } from "@/lib/content";
import { TechPill } from "@/components/ui/TechPill";

interface Props {
  project: Project;
  onClose: () => void;
}

export function ProjectDetailPanel({ project, onClose }: Props) {
  return (
    <motion.aside
      key={project.slug}
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
      className="absolute right-2 top-2 bottom-2 w-[min(380px,90vw)] z-10 overflow-y-auto bg-paper-deep/95 backdrop-blur-sm border border-hairline rounded-lg p-6 space-y-5 md:right-4 md:top-4 md:bottom-4"
      role="dialog"
      aria-label={`Détails ${project.title}`}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-4">
        <p className="mono uppercase tracking-[0.3em] text-[10px] text-text-muted">
          chapitre {project.chapter}.
        </p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer"
          className="text-text-muted hover:text-thread transition"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Title */}
      <h3 className="serif-italic text-text text-[clamp(22px,3.5vw,32px)] leading-[1.1]">
        {project.title}
      </h3>

      {/* Role */}
      {project.role && (
        <p className="mono text-[10px] uppercase tracking-widest text-text-muted">
          {project.role}
        </p>
      )}

      {/* Pitch */}
      <div className="text-sm text-text-muted leading-relaxed whitespace-pre-line">
        {project.pitch}
      </div>

      {/* Stack */}
      <div>
        <p className="mono uppercase tracking-[0.3em] text-[10px] text-text-muted mb-2">stack</p>
        <div className="flex flex-wrap gap-1.5">
          {project.stack.map((t) => (
            <TechPill key={t} label={t} />
          ))}
        </div>
      </div>

      {/* Achievements */}
      <div>
        <p className="mono uppercase tracking-[0.3em] text-[10px] text-text-muted mb-2">
          achievements
        </p>
        <ul className="space-y-1.5 text-sm text-text">
          {project.achievements.map((a, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-thread mt-1">·</span>
              <span className="leading-snug">{a}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Links */}
      {(project.liveUrl || project.repoUrl) && (
        <div className="flex gap-3 pt-2 flex-wrap">
          {project.liveUrl && (
            <a
              href={project.liveUrl}
              target="_blank"
              rel="noreferrer"
              className="mono text-[10px] uppercase tracking-widest inline-flex items-center gap-1 border-b border-hairline hover:border-thread hover:text-thread transition"
            >
              voir live <ArrowUpRight size={10} />
            </a>
          )}
          {project.repoUrl && (
            <a
              href={project.repoUrl}
              target="_blank"
              rel="noreferrer"
              className="mono text-[10px] uppercase tracking-widest inline-flex items-center gap-1 border-b border-hairline hover:border-thread hover:text-thread transition"
            >
              github <ArrowUpRight size={10} />
            </a>
          )}
        </div>
      )}
    </motion.aside>
  );
}
