"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  projects,
  profile,
  hobbies,
  stack,
  projectQualities,
} from "@/lib/content";

// The bot IS Aurian (a bot version of him). Visitors address questions TO him.
// Bot answers in first person ("je", "mes", "moi"), sobre & poétique.
// Strict rule: no em dashes ("—"). Use periods, commas, parentheses.
// No free chat: every step shows a fresh menu of predefined questions.

interface Msg {
  id: string;
  from: "bot" | "user";
  text: string;
}

type Topic =
  | "root"
  | "identity"
  | "projects"
  | "project"
  | "stack"
  | "qualities"
  | "contact"
  | "hobbies"
  | "formation"
  | "cv"
  | "languages"
  | "joke"
  | "bot";

interface Reply {
  text: string;
  next: Topic;
}

const ROOT_LABEL: Record<Topic, string> = {
  root: "Menu",
  identity: "Qui es-tu",
  projects: "Tes projets",
  project: "Explore une planète",
  stack: "Ta stack",
  qualities: "Tes qualités",
  contact: "Comment te contacter",
  hobbies: "Tes loisirs",
  formation: "Ta formation",
  cv: "Ton parcours",
  languages: "Tes langues",
  joke: "Une blague",
  bot: "Qui es-tu, toi le bot",
};

// Suggestion menus per topic — always 4-5 fresh choices that lead elsewhere.
const MENUS: Record<Topic, Topic[]> = {
  root: ["identity", "projects", "stack", "qualities", "contact"],
  identity: ["projects", "cv", "qualities", "hobbies", "contact"],
  projects: ["project", "stack", "qualities", "contact", "identity"],
  project: ["projects", "stack", "qualities", "cv", "contact"],
  stack: ["projects", "qualities", "cv", "formation", "contact"],
  qualities: ["projects", "hobbies", "contact", "identity", "joke"],
  contact: ["projects", "cv", "stack", "hobbies", "identity"],
  hobbies: ["qualities", "projects", "languages", "contact", "joke"],
  formation: ["cv", "stack", "projects", "languages", "contact"],
  cv: ["projects", "stack", "formation", "languages", "contact"],
  languages: ["formation", "cv", "hobbies", "contact", "identity"],
  joke: ["projects", "hobbies", "qualities", "bot", "contact"],
  bot: ["projects", "qualities", "joke", "contact", "identity"],
};

function capitalize(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function reply(topic: Topic, planetSlug?: string): Reply {
  switch (topic) {
    case "identity":
      return {
        text: `Je suis Aurian, version bot. ${capitalize(profile.tagline)} ${capitalize(profile.manifesto)}`,
        next: "identity",
      };
    case "projects": {
      const list = projects
        .map((p) => `« ${p.title} » : ${capitalize(p.pitch.split(".")[0])}.`)
        .join(" ");
      return {
        text: `Voici mes cinq projets. ${list}`,
        next: "projects",
      };
    }
    case "project": {
      const slug = planetSlug ?? projects[0].slug;
      const p = projects.find((x) => x.slug === slug) ?? projects[0];
      return {
        text: `Pour « ${p.title} » : ${capitalize(p.pitch)}`,
        next: "project",
      };
    }
    case "stack": {
      const byCat: Record<string, string[]> = {};
      stack.forEach((s) => {
        (byCat[s.category] ??= []).push(s.label);
      });
      const cats: Record<string, string> = {
        lang: "Langages",
        data: "Data",
        cloud: "Cloud",
        ai: "IA",
        other: "Automatisation",
      };
      const txt = Object.entries(byCat)
        .map(([k, v]) => `${cats[k] ?? k} : ${v.join(", ")}.`)
        .join(" ");
      return { text: `Voici ma stack. ${txt}`, next: "stack" };
    }
    case "qualities": {
      const lines = Object.values(projectQualities)
        .map(
          (q) =>
            `${capitalize(q.qualities[0])} × ${q.qualities[1]}, ${capitalize(q.phrase)}`
        )
        .join(" ");
      return {
        text: `Cinq paires, une par projet. ${lines}`,
        next: "qualities",
      };
    }
    case "contact":
      return {
        text: `Tu peux me joindre par email à ${profile.email}, sur LinkedIn (${profile.linkedin}) ou GitHub (${profile.github}).`,
        next: "contact",
      };
    case "hobbies":
      return {
        text:
          "À côté du code, j'aime : " +
          hobbies
            .map((h) => (h.detail ? `${h.label} (${h.detail})` : h.label))
            .join(", ") +
          ".",
        next: "hobbies",
      };
    case "formation":
      return {
        text: `Ma formation : ${capitalize(profile.formation)}`,
        next: "formation",
      };
    case "cv":
      return {
        text: `Actuellement : ${capitalize(profile.cvCurrent)} Précédemment : ${capitalize(profile.cvPrevious)}`,
        next: "cv",
      };
    case "languages":
      return {
        text:
          "Je parle " +
          profile.languages.map((l) => `${l.label} (${l.level})`).join(", ") +
          ".",
        next: "languages",
      };
    case "joke":
      return {
        text:
          "Voici. Deux étoiles entrent dans un bar. L'une dit à l'autre : « Tu brilles trop, on nous regarde ». La blague est faible, l'univers aussi parfois.",
        next: "joke",
      };
    case "bot":
      return {
        text:
          "Je suis une version bot d'Aurian. Un fragment d'éditorial qui répond pour lui pendant qu'il code ailleurs.",
        next: "bot",
      };
    case "root":
    default:
      return {
        text: "Que veux-tu savoir ? Choisis une question.",
        next: "root",
      };
  }
}

function BotMessage({ text }: { text: string }) {
  const [typed, setTyped] = useState("");
  useEffect(() => {
    setTyped("");
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setTyped(text.slice(0, i));
      if (i >= text.length) window.clearInterval(id);
    }, 12);
    return () => window.clearInterval(id);
  }, [text]);
  return (
    <div className="flex gap-2 items-start">
      <span
        aria-hidden
        className="shrink-0 mt-1.5"
        style={{
          width: 6,
          height: 6,
          borderRadius: 999,
          background: "#A4F5C8",
          boxShadow: "0 0 8px #A4F5C8AA",
        }}
      />
      <p
        className="serif-italic text-text leading-snug"
        style={{ fontSize: 14 }}
      >
        {typed}
        <span
          className="inline-block align-middle ml-0.5"
          style={{
            width: 6,
            height: 12,
            background: "#A4F5C8",
            opacity: typed.length < text.length ? 0.85 : 0,
            transform: "translateY(1px)",
          }}
        />
      </p>
    </div>
  );
}

export function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [menu, setMenu] = useState<Topic[]>(MENUS.root);
  const [planetIndex, setPlanetIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Greet on first open
  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([
        {
          id: "greet",
          from: "bot",
          text:
            "Salut. Je suis Aurian, version bot. Pose-moi une question.",
        },
      ]);
      setMenu(MENUS.root);
    }
  }, [open, messages.length]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open, menu]);

  const ask = (topic: Topic) => {
    // For "project", cycle through projects each click for variety.
    let slug: string | undefined;
    let userLabel = ROOT_LABEL[topic];
    if (topic === "project") {
      slug = projects[planetIndex % projects.length].slug;
      userLabel = `« ${projects[planetIndex % projects.length].title} »`;
      setPlanetIndex((i) => i + 1);
    }
    const r = reply(topic, slug);
    const userMsg: Msg = {
      id: `u-${Date.now()}`,
      from: "user",
      text: userLabel,
    };
    const botMsg: Msg = {
      id: `b-${Date.now()}`,
      from: "bot",
      text: r.text,
    };
    setMessages((prev) => [...prev, userMsg]);
    window.setTimeout(() => {
      setMessages((prev) => [...prev, botMsg]);
      setMenu(MENUS[r.next]);
    }, 360);
  };

  return (
    <>
      {/* Header launcher (top-right, to the LEFT of the StarLegend) */}
      <motion.button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Fermer le guide" : "Ouvrir le guide"}
        className="fixed z-[41] grid place-items-center select-none"
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0, duration: 0.6, ease: "easeOut" }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        style={{
          top: 24,
          right: 220,
          width: 44,
          height: 44,
          borderRadius: 12,
          background:
            "linear-gradient(160deg, rgba(20,22,27,0.9) 0%, rgba(7,8,10,0.95) 100%)",
          border: "1px solid rgba(164,245,200,0.22)",
          boxShadow:
            "0 4px 18px rgba(0,0,0,0.55), 0 0 14px rgba(164,245,200,0.12)",
        }}
      >
        <motion.span
          aria-hidden
          className="absolute pointer-events-none"
          style={{
            top: -7,
            left: "50%",
            transform: "translateX(-50%)",
            width: 4,
            height: 4,
            borderRadius: 999,
            background: "#A4F5C8",
            boxShadow: "0 0 8px #A4F5C8",
          }}
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        />
        <svg
          width="24"
          height="24"
          viewBox="0 0 36 36"
          aria-hidden
          style={{ display: "block" }}
        >
          <line
            x1="18"
            y1="4"
            x2="18"
            y2="9"
            stroke="rgba(164,245,200,0.7)"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
          <rect
            x="6"
            y="9"
            width="24"
            height="19"
            rx="5"
            fill="none"
            stroke="rgba(236,230,214,0.85)"
            strokeWidth="1.3"
          />
          <circle cx="13" cy="18" r="1.8" fill="#A4F5C8" />
          <circle cx="23" cy="18" r="1.8" fill="#A4F5C8" />
          <line
            x1="14"
            y1="24"
            x2="22"
            y2="24"
            stroke="rgba(236,230,214,0.55)"
            strokeWidth="1"
            strokeLinecap="round"
          />
          {open && (
            <g>
              <line
                x1="11"
                y1="11"
                x2="25"
                y2="25"
                stroke="#E55B5B"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
              <line
                x1="25"
                y1="11"
                x2="11"
                y2="25"
                stroke="#E55B5B"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </g>
          )}
        </svg>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            key="chatbot-panel"
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.32, ease: [0.2, 0.8, 0.2, 1] }}
            className="fixed z-[40] flex flex-col"
            style={{
              top: 76,
              right: 24,
              width: "min(360px, calc(100vw - 32px))",
              height: "min(440px, calc(100vh - 120px))",
              borderRadius: 16,
              background:
                "linear-gradient(180deg, rgba(14,15,18,0.92) 0%, rgba(7,8,10,0.95) 100%)",
              border: "1px solid rgba(164,245,200,0.18)",
              boxShadow:
                "0 18px 48px rgba(0,0,0,0.65), 0 0 28px rgba(164,245,200,0.08)",
              backdropFilter: "blur(8px)",
              overflow: "hidden",
            }}
          >
            <div
              aria-hidden
              className="absolute inset-0 pointer-events-none"
              style={{
                opacity: 0.35,
                backgroundImage:
                  "radial-gradient(1px 1px at 18% 14%, rgba(236,230,214,0.6), transparent 60%), \
                   radial-gradient(1px 1px at 82% 22%, rgba(236,230,214,0.45), transparent 60%), \
                   radial-gradient(1px 1px at 64% 78%, rgba(236,230,214,0.5), transparent 60%), \
                   radial-gradient(1px 1px at 24% 86%, rgba(236,230,214,0.4), transparent 60%)",
              }}
            />

            <div
              className="px-5 pt-4 pb-3 relative"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
            >
              <p className="mono uppercase tracking-[0.4em] text-[9px] text-thread">
                Aurian · Bot
              </p>
              <p className="serif-italic text-text mt-1" style={{ fontSize: 18 }}>
                Qu'aimerais-tu savoir ?
              </p>
            </div>

            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto px-5 py-4 relative"
              style={{ scrollBehavior: "smooth" }}
            >
              <div className="flex flex-col gap-4">
                {messages.map((m) =>
                  m.from === "bot" ? (
                    <BotMessage key={m.id} text={m.text} />
                  ) : (
                    <div key={m.id} className="flex justify-end">
                      <span
                        className="mono lowercase"
                        style={{
                          fontSize: 11,
                          letterSpacing: "0.05em",
                          color: "rgba(236,230,214,0.7)",
                          padding: "6px 10px",
                          borderRadius: 10,
                          background: "rgba(236,230,214,0.06)",
                          border: "1px solid rgba(236,230,214,0.08)",
                          maxWidth: "75%",
                        }}
                      >
                        {m.text}
                      </span>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Predefined menu (ALWAYS visible, no free input) */}
            <div
              className="px-4 py-3 relative"
              style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
            >
              <p
                className="mono uppercase tracking-[0.3em] text-[8px] mb-2"
                style={{ color: "rgba(236,230,214,0.45)" }}
              >
                Choisis une question
              </p>
              <div className="flex flex-wrap gap-1.5">
                {menu.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => ask(t)}
                    className="mono transition-colors hover:bg-thread/10 hover:text-thread"
                    style={{
                      fontSize: 10,
                      letterSpacing: "0.05em",
                      padding: "5px 9px",
                      borderRadius: 999,
                      color: "rgba(236,230,214,0.7)",
                      border: "1px solid rgba(164,245,200,0.18)",
                      background: "transparent",
                      cursor: "pointer",
                    }}
                  >
                    {ROOT_LABEL[t]}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
