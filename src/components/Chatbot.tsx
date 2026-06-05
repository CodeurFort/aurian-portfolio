"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useUi } from "@/lib/i18n";

// The bot IS Aurian (a bot version of him). Visitors address questions TO him.
// Philosophy: the bot REDIRECTS, never data-dumps. It points to the UI element
// where the answer lives (a star in the legend, a planet, a button) so the
// user has to explore. Tone: 1ère personne, sobre, encourageant.
// Strict rule: no em dashes ("—"). No free chat (predefined menu only).
// Bilingual: all visible strings come from useUi() (FR/EN switch).

// Palette claire du panel chat (gris perle métallisé) — même esprit que le
// panel 2.0 du PlanetPresenter pour cohérence visuelle. On garde le mint
// comme accent décoratif (dot bot, glyphe "?" des pills) mais on sort le
// mint des TEXTES qui deviendraient illisibles sur fond clair.
const PANEL_BG_TOP = "#F4F6F9";
const PANEL_BG_BOT = "#DDE1E7";
const PANEL_TEXT = "#1B1E25";
const PANEL_TEXT_DIM = "rgba(20,22,28,0.55)";
const PANEL_BORDER = "rgba(20,22,28,0.12)";
const PANEL_DIVIDER = "rgba(20,22,28,0.08)";
const MINT = "#A4F5C8"; // accent décoratif (dots, glyphe ?)
const MINT_DEEP = "#1F7A53"; // mint foncé pour les TEXTES sur fond clair

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

function buildLabels(ui: ReturnType<typeof useUi>): Record<Topic, string> {
  return {
    root: ui.bMenu,
    identity: ui.bIdentity,
    projects: ui.bProjects,
    project: ui.bProject,
    stack: ui.bStack,
    qualities: ui.bQualities,
    contact: ui.bContact,
    hobbies: ui.bHobbies,
    formation: ui.bFormation,
    cv: ui.bCv,
    languages: ui.bLanguages,
    joke: ui.bJoke,
    bot: ui.bBot,
  };
}

function reply(topic: Topic, ui: ReturnType<typeof useUi>): Reply {
  switch (topic) {
    case "identity":
      return { text: ui.botIdentity, next: "identity" };
    case "projects":
      return { text: ui.botProjects, next: "projects" };
    case "project":
      return { text: ui.botProject, next: "project" };
    case "stack":
      return { text: ui.botStack, next: "stack" };
    case "qualities":
      return { text: ui.botQualities, next: "qualities" };
    case "contact":
      return { text: ui.botContact, next: "contact" };
    case "hobbies":
      return { text: ui.botHobbies, next: "hobbies" };
    case "formation":
      return { text: ui.botFormation, next: "formation" };
    case "cv":
      return { text: ui.botCv, next: "cv" };
    case "languages":
      return { text: ui.botLanguages, next: "languages" };
    case "joke":
      return { text: ui.botJoke, next: "joke" };
    case "bot":
      return { text: ui.botBot, next: "bot" };
    case "root":
    default:
      return { text: ui.botRoot, next: "root" };
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
        className="serif-italic leading-snug"
        style={{ fontSize: 14, color: PANEL_TEXT }}
      >
        {typed}
        <span
          className="inline-block align-middle ml-0.5"
          style={{
            width: 6,
            height: 12,
            background: PANEL_TEXT,
            opacity: typed.length < text.length ? 0.85 : 0,
            transform: "translateY(1px)",
          }}
        />
      </p>
    </div>
  );
}

export function Chatbot() {
  const ui = useUi();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [menu, setMenu] = useState<Topic[]>(MENUS.root);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const labels = buildLabels(ui);

  // Greet on first open + reset messages when language changes (so greet matches lang)
  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([
        {
          id: "greet",
          from: "bot",
          text: ui.botGreet,
        },
      ]);
      setMenu(MENUS.root);
    }
  }, [open, messages.length, ui.botGreet]);

  // Reset chat history when language changes (keeps the conversation coherent in one lang)
  useEffect(() => {
    setMessages([]);
    setMenu(MENUS.root);
  }, [ui.botGreet]);

  // Réinitialise la conversation quand on ferme le bot : pas d'accumulation
  // d'historique d'une session à l'autre. Léger délai pour laisser l'exit
  // animation du panel se dérouler proprement avant de vider les messages.
  useEffect(() => {
    if (open) return;
    const t = window.setTimeout(() => {
      setMessages([]);
      setMenu(MENUS.root);
    }, 360);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open, menu]);

  const ask = (topic: Topic) => {
    const r = reply(topic, ui);
    const userMsg: Msg = {
      id: `u-${Date.now()}`,
      from: "user",
      text: labels[topic],
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
        aria-label={open ? ui.botCloseAria : ui.botOpenAria}
        className="fixed z-[41] grid place-items-center select-none top-3 left-[96px] w-9 h-9 md:top-9 md:left-[250px] md:w-11 md:h-11"
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0, duration: 0.6, ease: "easeOut" }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        style={{
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
            className="fixed z-[40] flex flex-col top-[60px] left-3 md:top-[88px] md:left-6"
            style={{
              width: "min(360px, calc(100vw - 24px))",
              height: "min(440px, calc(100vh - 80px))",
              borderRadius: 16,
              background: `linear-gradient(180deg, ${PANEL_BG_TOP} 0%, ${PANEL_BG_BOT} 100%)`,
              border: `1px solid ${PANEL_BORDER}`,
              boxShadow:
                "0 18px 48px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.7), inset 0 -1px 0 rgba(20,22,28,0.08)",
              backdropFilter: "blur(8px)",
              overflow: "hidden",
            }}
          >
            {/* Sheen overlay — léger reflet métallisé sur le panel */}
            <div
              aria-hidden
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "linear-gradient(135deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0) 35%), linear-gradient(315deg, rgba(20,22,28,0.06) 0%, rgba(20,22,28,0) 40%)",
                mixBlendMode: "soft-light",
              }}
            />

            <div
              className="px-5 pt-4 pb-3 relative"
              style={{ borderBottom: `1px solid ${PANEL_DIVIDER}` }}
            >
              <p
                className="mono uppercase tracking-[0.4em] text-[9px]"
                style={{ color: MINT_DEEP }}
              >
                {ui.botBadge}
              </p>
              <p
                className="serif-italic mt-1"
                style={{ fontSize: 18, color: PANEL_TEXT }}
              >
                {ui.botPrompt}
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
                          color: PANEL_TEXT_DIM,
                          padding: "6px 10px",
                          borderRadius: 10,
                          background: "rgba(20,22,28,0.05)",
                          border: `1px solid ${PANEL_BORDER}`,
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

            {/* Predefined menu (ALWAYS visible, no free input).
                Style harmonisé : header avec glyphe "?" en mint, pills
                arrondies avec point coloré en tête + label suffixé d'un
                "?", halo mint au hover, fond légèrement teinté. */}
            <div
              className="px-4 pt-3 pb-3.5 relative"
              style={{
                borderTop: `1px solid ${PANEL_DIVIDER}`,
                background:
                  "linear-gradient(180deg, rgba(164,245,200,0.10) 0%, rgba(164,245,200,0) 60%)",
              }}
            >
              {/* Header : glyphe "?" + label */}
              <div className="flex items-center gap-2 mb-2.5">
                <span
                  aria-hidden
                  className="grid place-items-center"
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: 999,
                    border: `1px solid ${MINT_DEEP}55`,
                    background: "rgba(164,245,200,0.14)",
                    boxShadow: "0 0 6px rgba(31,122,83,0.18)",
                  }}
                >
                  <span
                    className="mono"
                    style={{
                      fontSize: 9,
                      lineHeight: 1,
                      color: MINT_DEEP,
                      transform: "translateY(0.5px)",
                    }}
                  >
                    ?
                  </span>
                </span>
                <p
                  className="mono uppercase tracking-[0.32em]"
                  style={{
                    fontSize: 8.5,
                    color: PANEL_TEXT_DIM,
                  }}
                >
                  {ui.botMenuLabel}
                </p>
              </div>

              {/* Pills : point mint + label + "?" final */}
              <div className="flex flex-wrap gap-1.5">
                {menu.map((t) => (
                  <motion.button
                    key={t}
                    type="button"
                    onClick={() => ask(t)}
                    className="mono group flex items-center gap-1.5 transition-colors"
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.96 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    style={{
                      fontSize: 10.5,
                      letterSpacing: "0.06em",
                      padding: "6px 11px 6px 10px",
                      borderRadius: 999,
                      color: PANEL_TEXT,
                      border: `1px solid ${MINT_DEEP}44`,
                      background:
                        "linear-gradient(180deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.35) 100%)",
                      boxShadow:
                        "inset 0 1px 0 rgba(255,255,255,0.8), 0 1px 2px rgba(20,22,28,0.08)",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = `${MINT_DEEP}88`;
                      e.currentTarget.style.color = MINT_DEEP;
                      e.currentTarget.style.background =
                        "linear-gradient(180deg, rgba(164,245,200,0.35) 0%, rgba(164,245,200,0.15) 100%)";
                      e.currentTarget.style.boxShadow =
                        "inset 0 1px 0 rgba(255,255,255,0.9), 0 0 10px rgba(31,122,83,0.25)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = `${MINT_DEEP}44`;
                      e.currentTarget.style.color = PANEL_TEXT;
                      e.currentTarget.style.background =
                        "linear-gradient(180deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.35) 100%)";
                      e.currentTarget.style.boxShadow =
                        "inset 0 1px 0 rgba(255,255,255,0.8), 0 1px 2px rgba(20,22,28,0.08)";
                    }}
                  >
                    <span
                      aria-hidden
                      style={{
                        width: 5,
                        height: 5,
                        borderRadius: 999,
                        background: MINT_DEEP,
                        boxShadow: "0 0 6px rgba(31,122,83,0.4)",
                        flexShrink: 0,
                      }}
                    />
                    <span>
                      {labels[t]}
                      <span
                        aria-hidden
                        style={{
                          color: MINT_DEEP,
                          marginLeft: 3,
                          opacity: 0.9,
                        }}
                      >
                        ?
                      </span>
                    </span>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
