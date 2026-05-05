"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  projects,
  profile,
  hobbies,
  stack,
  projectQualities,
} from "@/lib/content";

// Tone: guide d'observatoire, sobre, poétique. Univers (pas observatoire).
// Strict rule: no em dashes ("—"). Use periods, commas, parentheses.

interface Msg {
  id: string;
  from: "bot" | "user";
  text: string;
}

const SUGGESTIONS = [
  "qui es-tu",
  "tes projets",
  "ta stack",
  "tes qualités",
  "comment te contacter",
  "tes loisirs",
];

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function answer(query: string): string {
  const q = normalize(query);
  if (!q) return "posez votre question. l'univers écoute.";

  // Identity
  if (
    /\b(qui (es|est|t es)|presente|toi|ton nom|aurian|hello|salut|bonjour)\b/.test(
      q
    )
  ) {
    return `${profile.tagline} ${profile.manifesto}`;
  }

  // Specific planets
  for (const p of projects) {
    const slug = normalize(p.slug);
    const title = normalize(p.title);
    if (q.includes(slug) || q.includes(title)) {
      return `« ${p.title} ». ${p.pitch}`;
    }
  }

  // Projects overview
  if (
    /\b(projet|planete|univers|portfolio|que fais|qu est ce que tu fais)\b/.test(
      q
    )
  ) {
    const list = projects
      .map((p) => `« ${p.title} » : ${p.pitch.split(".")[0]}.`)
      .join(" ");
    return `cinq lumières dans l'univers. ${list}`;
  }

  // Stack
  if (/\b(stack|techno|outil|langage|tool|tech)\b/.test(q)) {
    const byCat: Record<string, string[]> = {};
    stack.forEach((s) => {
      (byCat[s.category] ??= []).push(s.label);
    });
    const cats: Record<string, string> = {
      lang: "langages",
      data: "data",
      cloud: "cloud",
      ai: "ia",
      other: "automatisation",
    };
    return Object.entries(byCat)
      .map(([k, v]) => `${cats[k] ?? k} : ${v.join(", ")}.`)
      .join(" ");
  }

  // Qualities
  if (/\b(qualite|soft skill|force|atout|caractere)\b/.test(q)) {
    const lines = Object.values(projectQualities)
      .map((q) => `${q.qualities[0]} × ${q.qualities[1]}, ${q.phrase.toLowerCase()}`)
      .join(" ");
    return `cinq paires, une par planète. ${lines}`;
  }

  // Contact
  if (
    /\b(contact|email|mail|linkedin|github|joindre|ecrire|message)\b/.test(q)
  ) {
    return `email : ${profile.email}. linkedin : ${profile.linkedin}. github : ${profile.github}.`;
  }

  // Hobbies
  if (/\b(loisir|hobby|passion|musique|theatre|echec|jujitsu|poesie)\b/.test(q)) {
    return (
      "à côté du code : " +
      hobbies
        .map((h) => (h.detail ? `${h.label} (${h.detail})` : h.label))
        .join(", ") +
      "."
    );
  }

  // Formation
  if (/\b(formation|diplome|ecole|etude|msc|licence|bac)\b/.test(q)) {
    return profile.formation;
  }

  // CV / experience
  if (
    /\b(cv|experience|stage|alternance|job|poste|emploi|parcours|travail)\b/.test(
      q
    )
  ) {
    return `actuellement : ${profile.cvCurrent} précédemment : ${profile.cvPrevious}`;
  }

  // Languages
  if (/\b(langue|francais|anglais|espagnol|english)\b/.test(q)) {
    return profile.languages.map((l) => `${l.label} (${l.level})`).join(", ") + ".";
  }

  // Easter eggs
  if (/\b(qui es tu toi|t es qui|c est qui|le bot)\b/.test(q)) {
    return "un fragment d'éditorial qui rêve d'être agent. en attendant, je guide.";
  }
  if (/\b(blague|drole|rire|fun)\b/.test(q)) {
    return "deux étoiles entrent dans un bar. l'une dit à l'autre : « tu brilles trop, on nous regarde ». la blague est faible, l'univers aussi parfois.";
  }

  // Fallback
  return "je ne sais pas répondre à cela. essayez : tes projets, ta stack, tes qualités, comment te contacter, tes loisirs.";
}

function useTypewriterText(text: string, speed = 14) {
  const [out, setOut] = useState("");
  useEffect(() => {
    setOut("");
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setOut(text.slice(0, i));
      if (i >= text.length) window.clearInterval(id);
    }, speed);
    return () => window.clearInterval(id);
  }, [text, speed]);
  return out;
}

function BotMessage({ text }: { text: string }) {
  const typed = useTypewriterText(text, 12);
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
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Greet on first open
  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([
        {
          id: "greet",
          from: "bot",
          text:
            "bienvenue dans l'univers. cinq lumières, un fil de menthe. posez votre question.",
        },
      ]);
    }
  }, [open, messages.length]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  const send = (text: string) => {
    const clean = text.trim();
    if (!clean) return;
    const userMsg: Msg = {
      id: `u-${Date.now()}`,
      from: "user",
      text: clean,
    };
    const reply = answer(clean);
    const botMsg: Msg = {
      id: `b-${Date.now()}`,
      from: "bot",
      text: reply,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    window.setTimeout(
      () => setMessages((prev) => [...prev, botMsg]),
      380 + Math.random() * 240
    );
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    send(input);
  };

  const showSuggestions = useMemo(
    () => messages.length <= 1,
    [messages.length]
  );

  return (
    <>
      {/* Header launcher (top-center, between Portfolio · Univers and StarLegend) */}
      <motion.button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Fermer le guide" : "Ouvrir le guide"}
        className="fixed top-6 left-1/2 z-[41] grid place-items-center select-none"
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0, duration: 0.6, ease: "easeOut" }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        style={{
          transform: "translateX(-50%)",
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
        {/* Tiny antenna pulse */}
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
          {/* antenna */}
          <line
            x1="18"
            y1="4"
            x2="18"
            y2="9"
            stroke="rgba(164,245,200,0.7)"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
          {/* head */}
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
          {/* eyes */}
          <circle cx="13" cy="18" r="1.8" fill="#A4F5C8" />
          <circle cx="23" cy="18" r="1.8" fill="#A4F5C8" />
          {/* mouth slit */}
          <line
            x1="14"
            y1="24"
            x2="22"
            y2="24"
            stroke="rgba(236,230,214,0.55)"
            strokeWidth="1"
            strokeLinecap="round"
          />
          {/* close glyph (overlays when open) */}
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
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.32, ease: [0.2, 0.8, 0.2, 1] }}
            className="fixed top-[72px] left-1/2 z-[40] flex flex-col"
            style={{
              transform: "translateX(-50%)",
              width: "min(340px, calc(100vw - 32px))",
              height: "min(420px, calc(100vh - 160px))",
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
            {/* starfield decoration */}
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

            {/* Header */}
            <div className="px-5 pt-4 pb-3 relative" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="mono uppercase tracking-[0.4em] text-[9px] text-thread">
                guide · univers
              </p>
              <p className="serif-italic text-text mt-1" style={{ fontSize: 18 }}>
                qu'aimeriez-vous savoir ?
              </p>
            </div>

            {/* Messages */}
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

                {showSuggestions && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => send(s)}
                        className="mono lowercase transition-colors hover:bg-thread/10 hover:text-thread"
                        style={{
                          fontSize: 10,
                          letterSpacing: "0.05em",
                          padding: "5px 9px",
                          borderRadius: 999,
                          color: "rgba(236,230,214,0.65)",
                          border: "1px solid rgba(164,245,200,0.18)",
                          background: "transparent",
                        }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Input */}
            <form
              onSubmit={onSubmit}
              className="relative px-4 py-3"
              style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
            >
              <div
                className="flex items-center gap-2"
                style={{
                  borderRadius: 999,
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  padding: "6px 12px",
                }}
              >
                <span
                  className="mono"
                  style={{ color: "#A4F5C8", fontSize: 11, opacity: 0.8 }}
                >
                  ›
                </span>
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="posez une question…"
                  className="flex-1 bg-transparent outline-none mono lowercase"
                  style={{
                    fontSize: 12,
                    color: "rgba(236,230,214,0.9)",
                    letterSpacing: "0.02em",
                  }}
                />
                <button
                  type="submit"
                  aria-label="Envoyer"
                  className="mono uppercase"
                  style={{
                    fontSize: 9,
                    letterSpacing: "0.3em",
                    color: "#A4F5C8",
                    padding: "4px 8px",
                    borderRadius: 999,
                    background: "rgba(164,245,200,0.08)",
                    border: "1px solid rgba(164,245,200,0.2)",
                    cursor: "pointer",
                  }}
                >
                  envoyer
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
