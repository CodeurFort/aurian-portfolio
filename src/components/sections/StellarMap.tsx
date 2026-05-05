"use client";
import { motion } from "framer-motion";
import { Mail, FileDown } from "lucide-react";
import { profile, hobbies, stack } from "@/lib/content";
import { EditorialTitle } from "@/components/ui/EditorialTitle";

function GithubMark({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.36-3.88-1.36-.52-1.32-1.27-1.67-1.27-1.67-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.74 2.68 1.24 3.34.95.1-.74.4-1.24.72-1.53-2.55-.29-5.24-1.27-5.24-5.66 0-1.25.45-2.27 1.18-3.07-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.15 1.17a10.95 10.95 0 0 1 5.74 0c2.19-1.48 3.15-1.17 3.15-1.17.62 1.58.23 2.75.11 3.04.74.8 1.18 1.82 1.18 3.07 0 4.4-2.7 5.36-5.27 5.65.41.36.78 1.06.78 2.14v3.18c0 .31.21.67.8.55A11.5 11.5 0 0 0 12 .5z"/>
    </svg>
  );
}

function LinkedinMark({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  );
}

const groupLabel: Record<string, string> = {
  lang: "langages",
  data: "data & bi",
  cloud: "cloud",
  ai: "ai / agents",
  other: "autres",
};

export function StellarMap() {
  const grouped = stack.reduce<Record<string, typeof stack>>((acc, t) => {
    (acc[t.category] ||= []).push(t);
    return acc;
  }, {});

  return (
    <section id="map" className="relative min-h-screen px-6 py-24">
      <div className="max-w-6xl mx-auto space-y-16">
        <header className="text-center max-w-2xl mx-auto">
          <p className="mono uppercase tracking-[0.3em] text-[11px] text-text-muted mb-4">
            carte stellaire
          </p>
          <EditorialTitle size="lg">le plan, déplié.</EditorialTitle>
        </header>

        {/* CV */}
        <div className="grid md:grid-cols-2 gap-12">
          <div>
            <p className="mono uppercase tracking-[0.3em] text-[10px] text-text-muted mb-4">
              parcours
            </p>
            <ul className="space-y-6 border-l border-hairline pl-6">
              <li>
                <p className="serif-italic text-xl">{profile.cvCurrent}</p>
              </li>
              <li>
                <p className="serif-italic text-xl">{profile.cvPrevious}</p>
              </li>
              <li>
                <p className="serif-italic text-xl">{profile.formation}</p>
              </li>
            </ul>
            <a
              href={profile.cvPdf}
              download
              className="mt-6 mono text-[11px] uppercase tracking-widest inline-flex items-center gap-2 border border-hairline rounded-full px-4 py-2 hover:border-thread hover:text-thread transition"
            >
              <FileDown size={12} /> télécharger cv (pdf)
            </a>
          </div>

          {/* Hobbies as orbital moons */}
          <div>
            <p className="mono uppercase tracking-[0.3em] text-[10px] text-text-muted mb-4">
              orbites
            </p>
            <ul className="flex flex-wrap gap-3">
              {hobbies.map((h, i) => (
                <motion.li
                  key={h.label}
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="border border-hairline rounded-full px-4 py-1.5 flex items-center gap-2"
                >
                  <span className="w-2 h-2 rounded-full bg-paper-cream" />
                  <span className="serif-italic text-base">{h.label.toLowerCase()}</span>
                  {h.detail && <span className="mono text-[10px] text-text-muted">— {h.detail}</span>}
                </motion.li>
              ))}
            </ul>
          </div>
        </div>

        {/* Stack HUD */}
        <div>
          <p className="mono uppercase tracking-[0.3em] text-[10px] text-text-muted mb-4 text-center">
            stack
          </p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 border border-hairline rounded-lg p-8">
            {Object.keys(groupLabel).map((cat) => (
              <div key={cat}>
                <p className="mono uppercase tracking-[0.3em] text-[10px] text-thread mb-3">
                  {groupLabel[cat]}
                </p>
                <ul className="space-y-1.5">
                  {(grouped[cat] ?? []).map((t) => (
                    <li key={t.label} className="text-sm text-text">
                      {t.label}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Contact */}
        <div className="text-center max-w-xl mx-auto space-y-6">
          <p className="mono uppercase tracking-[0.3em] text-[10px] text-text-muted">contact</p>
          <p className="serif-italic text-2xl">{profile.tagline}</p>
          <div className="flex justify-center gap-4 flex-wrap">
            <a
              href={`mailto:${profile.email}`}
              className="mono text-[11px] uppercase tracking-widest border border-hairline rounded-full px-4 py-2 inline-flex items-center gap-2 hover:border-thread hover:text-thread transition"
            >
              <Mail size={12} /> email
            </a>
            <a
              href={profile.linkedin}
              target="_blank"
              rel="noreferrer"
              className="mono text-[11px] uppercase tracking-widest border border-hairline rounded-full px-4 py-2 inline-flex items-center gap-2 hover:border-thread hover:text-thread transition"
            >
              <LinkedinMark size={12} /> linkedin
            </a>
            <a
              href={profile.github}
              target="_blank"
              rel="noreferrer"
              className="mono text-[11px] uppercase tracking-widest border border-hairline rounded-full px-4 py-2 inline-flex items-center gap-2 hover:border-thread hover:text-thread transition"
            >
              <GithubMark size={12} /> github
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
