"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import { projects, softSkills } from "@/lib/content";
import { EditorialTitle } from "@/components/ui/EditorialTitle";

const ThreadsScene = dynamic(
  () => import("@/components/3d/ThreadsScene").then((m) => m.ThreadsScene),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 grid place-items-center mono text-[10px] uppercase tracking-[0.3em] text-text-muted">
        chargement constellation…
      </div>
    ),
  }
);

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
        <ThreadsScene softSkills={softSkills} projects={projects} activeIdx={activeIdx} />
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
