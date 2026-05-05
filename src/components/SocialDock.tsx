"use client";

import { motion } from "framer-motion";
import { useContent } from "@/lib/i18n";

// Permanent LinkedIn + GitHub dock. Fixed bottom-right, mirrors LangToggle
// styling (pill, mint hairline, blurred bg). Always visible across the app.
export function SocialDock({ z = 50 }: { z?: number }) {
  const { profile } = useContent();
  const links = [
    {
      key: "linkedin",
      href: profile.linkedin,
      label: "LinkedIn",
      // Inline simple-icons LinkedIn glyph
      svg: (
        <path
          d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.37V9h3.4v1.56h.05c.47-.9 1.62-1.85 3.34-1.85 3.57 0 4.23 2.35 4.23 5.4v6.34zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z"
          fill="currentColor"
        />
      ),
    },
    {
      key: "github",
      href: profile.github,
      label: "GitHub",
      svg: (
        <path
          d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.55v-2.13c-3.2.69-3.87-1.36-3.87-1.36-.52-1.32-1.27-1.67-1.27-1.67-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.74 2.68 1.24 3.34.95.1-.74.4-1.24.72-1.53-2.55-.29-5.24-1.28-5.24-5.7 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.46.11-3.05 0 0 .96-.31 3.16 1.18a10.97 10.97 0 0 1 5.76 0c2.2-1.49 3.16-1.18 3.16-1.18.62 1.59.23 2.76.11 3.05.74.81 1.18 1.84 1.18 3.1 0 4.43-2.69 5.41-5.26 5.69.41.36.77 1.05.77 2.12v3.14c0 .31.21.66.8.55C20.22 21.39 23.5 17.08 23.5 12 23.5 5.65 18.35.5 12 .5z"
          fill="currentColor"
        />
      ),
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="fixed bottom-3 right-3 md:bottom-6 md:right-6 select-none"
      style={{
        zIndex: z,
        display: "flex",
        gap: 4,
        padding: 4,
        borderRadius: 999,
        background: "rgba(14,15,18,0.85)",
        border: "1px solid rgba(164,245,200,0.22)",
        boxShadow: "0 4px 14px rgba(0,0,0,0.45)",
        backdropFilter: "blur(6px)",
      }}
      role="group"
      aria-label="Réseaux / Socials"
    >
      {links.map((l) => (
        <a
          key={l.key}
          href={l.href}
          target="_blank"
          rel="noreferrer"
          aria-label={l.label}
          className="grid place-items-center transition-colors"
          style={{
            width: 30,
            height: 30,
            borderRadius: 999,
            color: "rgba(236,230,214,0.78)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.color = "#A4F5C8";
            (e.currentTarget as HTMLAnchorElement).style.background = "rgba(164,245,200,0.08)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.color = "rgba(236,230,214,0.78)";
            (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden>
            {l.svg}
          </svg>
        </a>
      ))}
    </motion.div>
  );
}
