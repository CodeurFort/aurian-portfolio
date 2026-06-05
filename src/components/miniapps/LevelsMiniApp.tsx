"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLang, tr } from "@/lib/i18n";

// Mini-app Levels — démo visuelle isolée, embarquée dans la carte projet.
// Palette/typographie alignées sur l'app Levels (sombre + accents vert/or).
// 5 tâches éditables, XP qui monte à chaque validation, achievement modal
// quand les 5 sont atteintes.

const PALETTE = {
  bg: "#080808",
  surface: "rgba(255,255,255,0.028)",
  surfaceHover: "rgba(255,255,255,0.055)",
  border: "rgba(255,255,255,0.10)",
  borderStrong: "rgba(255,255,255,0.18)",
  text: "rgba(255,255,255,0.92)",
  textDim: "rgba(255,255,255,0.55)",
  green: "#22C55E",
  gold: "#FFC832",
};

const XP_PER_TASK = 20;
const TOTAL_XP_FOR_LEVEL = 100; // 5 × 20

const DEFAULT_TASKS_FR = [
  "Faire 30 min de sport",
  "Lire 10 pages",
  "Méditer 10 min",
  "Boire 2L d'eau",
  "Coucher avant 23h",
];
const DEFAULT_TASKS_EN = [
  "30 min workout",
  "Read 10 pages",
  "Meditate 10 min",
  "Drink 2L water",
  "Sleep before 11pm",
];

type Task = { id: number; label: string; done: boolean };

const blankTasks = (): Task[] =>
  Array.from({ length: 5 }, (_, i) => ({ id: i, label: "", done: false }));

export function LevelsMiniApp() {
  const { lang } = useLang();
  const DEFAULT_TASKS = lang === "fr" ? DEFAULT_TASKS_FR : DEFAULT_TASKS_EN;
  const [tasks, setTasks] = useState<Task[]>(blankTasks);
  const [achievementShown, setAchievementShown] = useState(false);

  const doneCount = tasks.filter((t) => t.done).length;
  const xp = doneCount * XP_PER_TASK;
  const level = useMemo(() => 1 + Math.floor(xp / TOTAL_XP_FOR_LEVEL), [xp]);
  const xpProgress = xp % TOTAL_XP_FOR_LEVEL;
  const xpPct = (xpProgress / TOTAL_XP_FOR_LEVEL) * 100;

  const allDone = doneCount === tasks.length;

  // Pop l'achievement la première fois que tout est validé.
  useEffect(() => {
    if (allDone) setAchievementShown(true);
  }, [allDone]);

  const setLabel = (id: number, label: string) =>
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, label } : t)));

  const toggleDone = (id: number) =>
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id && t.label.trim().length > 0 ? { ...t, done: !t.done } : t
      )
    );

  const autoFill = () =>
    setTasks((prev) =>
      prev.map((t, i) => ({ ...t, label: t.label || DEFAULT_TASKS[i] }))
    );

  const reset = () => {
    setTasks(blankTasks());
    setAchievementShown(false);
  };

  return (
    <div
      className="relative rounded-xl overflow-hidden"
      style={{
        background: PALETTE.bg,
        border: `1px solid ${PALETTE.border}`,
        boxShadow:
          "0 18px 50px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.04)",
        fontFamily:
          "var(--font-mono, 'Space Grotesk'), ui-sans-serif, system-ui",
        color: PALETTE.text,
      }}
    >
      {/* Topbar — niveau + XP bar style pill */}
      <div
        className="flex items-center justify-between px-5 py-3"
        style={{ borderBottom: `1px solid ${PALETTE.border}` }}
      >
        <div className="flex items-center gap-2">
          <span
            className="mono uppercase text-[10px] tracking-[0.3em]"
            style={{ color: PALETTE.textDim }}
          >
            Levels
          </span>
          <span style={{ color: PALETTE.gold, fontSize: 10 }}>✦</span>
          <span
            className="mono uppercase text-[10px] tracking-[0.3em]"
            style={{ color: PALETTE.textDim }}
          >
            {tr(lang, "démo", "demo")}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span
              className="mono text-[10px] tracking-widest uppercase"
              style={{ color: PALETTE.textDim }}
            >
              {tr(lang, "Niveau", "Level")}
            </span>
            <motion.span
              key={level}
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.25 }}
              className="font-semibold"
              style={{ color: PALETTE.text, fontSize: 18 }}
            >
              {level}
            </motion.span>
          </div>
          <div
            className="rounded-full overflow-hidden relative"
            style={{
              width: 140,
              height: 7,
              background: "rgba(255,255,255,0.06)",
              border: `1px solid ${PALETTE.border}`,
            }}
          >
            <motion.div
              animate={{ width: `${xpPct}%` }}
              transition={{ duration: 0.45, ease: [0.2, 0.8, 0.2, 1] }}
              className="absolute inset-y-0 left-0"
              style={{
                background: `linear-gradient(90deg, ${PALETTE.green} 0%, rgba(34,197,94,0.6) 100%)`,
                boxShadow: `0 0 12px ${PALETTE.green}`,
              }}
            />
          </div>
          <span
            className="mono text-[11px]"
            style={{ color: PALETTE.textDim }}
          >
            {xpProgress}/{TOTAL_XP_FOR_LEVEL}
          </span>
        </div>
      </div>

      {/* En-tête objectif */}
      <div className="px-5 pt-5 pb-3 flex items-center justify-between">
        <div>
          <p
            className="mono uppercase text-[10px] tracking-[0.3em]"
            style={{ color: PALETTE.textDim }}
          >
            {tr(lang, "Objectif du jour", "Today's goal")}
          </p>
          <p
            className="font-semibold mt-1"
            style={{ color: PALETTE.text, fontSize: 16 }}
          >
            {tr(lang, `5 tâches · ${doneCount}/${tasks.length} validées`, `5 tasks · ${doneCount}/${tasks.length} done`)}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={autoFill}
            className="mono uppercase text-[10px] tracking-widest px-3 py-1.5 rounded-md transition-colors"
            style={{
              color: PALETTE.text,
              border: `1px solid ${PALETTE.borderStrong}`,
              background: "transparent",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = PALETTE.surfaceHover;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            {tr(lang, "Auto-remplir", "Auto-fill")}
          </button>
          <button
            type="button"
            onClick={reset}
            className="mono uppercase text-[10px] tracking-widest px-3 py-1.5 rounded-md transition-colors"
            style={{
              color: PALETTE.textDim,
              border: `1px solid ${PALETTE.border}`,
              background: "transparent",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = PALETTE.text;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = PALETTE.textDim;
            }}
          >
            Reset
          </button>
        </div>
      </div>

      {/* Liste des tâches */}
      <ul className="px-5 pb-5 space-y-2.5">
        {tasks.map((t) => {
          const canValidate = t.label.trim().length > 0;
          return (
            <motion.li
              key={t.id}
              layout
              className="rounded-xl flex items-center gap-3 px-3 py-2.5"
              style={{
                background: t.done
                  ? "rgba(34,197,94,0.06)"
                  : PALETTE.surface,
                border: `1px solid ${
                  t.done ? "rgba(34,197,94,0.35)" : PALETTE.border
                }`,
                transition: "background 0.2s, border-color 0.2s",
              }}
            >
              <button
                type="button"
                aria-label={t.done ? tr(lang, "Décocher", "Uncheck") : tr(lang, "Valider", "Validate")}
                onClick={() => toggleDone(t.id)}
                disabled={!canValidate}
                className="shrink-0 flex items-center justify-center rounded-md transition-colors"
                style={{
                  width: 22,
                  height: 22,
                  border: `1px solid ${
                    t.done ? PALETTE.green : PALETTE.borderStrong
                  }`,
                  background: t.done
                    ? PALETTE.green
                    : "rgba(255,255,255,0.04)",
                  cursor: canValidate ? "pointer" : "not-allowed",
                  opacity: canValidate || t.done ? 1 : 0.4,
                }}
              >
                <AnimatePresence>
                  {t.done && (
                    <motion.span
                      initial={{ scale: 0, rotate: -15 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0 }}
                      transition={{
                        duration: 0.25,
                        ease: [0.2, 0.8, 0.2, 1],
                      }}
                      style={{
                        color: "#0A0A0A",
                        fontSize: 13,
                        fontWeight: 700,
                        lineHeight: 1,
                      }}
                    >
                      ✓
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>

              <input
                type="text"
                value={t.label}
                onChange={(e) => setLabel(t.id, e.target.value)}
                placeholder={tr(lang, `Tâche ${t.id + 1}…`, `Task ${t.id + 1}…`)}
                disabled={t.done}
                className="flex-1 bg-transparent outline-none text-[14px]"
                style={{
                  color: t.done ? PALETTE.textDim : PALETTE.text,
                  textDecoration: t.done ? "line-through" : "none",
                  fontFamily: "inherit",
                }}
              />

              <span
                className="mono text-[10px] tracking-widest uppercase px-2 py-1 rounded-full shrink-0"
                style={{
                  color: t.done ? PALETTE.green : PALETTE.textDim,
                  border: `1px solid ${
                    t.done ? "rgba(34,197,94,0.45)" : PALETTE.border
                  }`,
                  background: "rgba(0,0,0,0.25)",
                }}
              >
                +{XP_PER_TASK} XP
              </span>
            </motion.li>
          );
        })}
      </ul>

      {/* Achievement modal — overlay interne au mini-app */}
      <AnimatePresence>
        {achievementShown && (
          <motion.div
            key="ach-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setAchievementShown(false)}
            className="absolute inset-0 grid place-items-center cursor-pointer"
            style={{
              background: "rgba(8,8,12,0.78)",
              backdropFilter: "blur(8px)",
            }}
          >
            <motion.div
              key="ach-card"
              initial={{ scale: 0.94, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 12 }}
              transition={{
                duration: 0.32,
                ease: [0.2, 0.8, 0.2, 1],
              }}
              onClick={(e) => e.stopPropagation()}
              className="rounded-2xl px-7 py-6 text-center"
              style={{
                maxWidth: 380,
                background:
                  "linear-gradient(180deg, rgba(37,30,10,0.96) 0%, rgba(23,18,6,0.94) 100%)",
                border: "1px solid rgba(255,200,50,0.4)",
                boxShadow:
                  "0 0 44px rgba(255,180,0,0.18), 0 24px 60px rgba(0,0,0,0.55)",
              }}
            >
              <p
                className="mono uppercase text-[10px] tracking-[0.3em] mb-3"
                style={{ color: PALETTE.gold }}
              >
                {tr(lang, "Achievement débloqué", "Achievement unlocked")}
              </p>
              <motion.div
                initial={{ scale: 0.4, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  duration: 0.45,
                  ease: [0.2, 1.4, 0.4, 1],
                  delay: 0.05,
                }}
                style={{ fontSize: 48, lineHeight: 1, marginBottom: 10 }}
              >
                🏁
              </motion.div>
              <h3
                className="font-bold mb-1"
                style={{
                  color: PALETTE.gold,
                  fontSize: 22,
                  letterSpacing: "-0.01em",
                }}
              >
                {tr(lang, "Premier objectif atteint", "First goal reached")}
              </h3>
              <p
                className="text-[13px] mb-4"
                style={{ color: PALETTE.textDim }}
              >
                {tr(lang, "Tu as validé tes 5 tâches du jour. Le commencement d'une série.", "You've completed your 5 tasks for the day. The start of a streak.")}
              </p>
              <div className="flex justify-center gap-2 mb-3">
                <span
                  className="mono uppercase text-[11px] tracking-widest px-3 py-1.5 rounded-full"
                  style={{
                    color: PALETTE.gold,
                    border: "1px solid rgba(255,200,50,0.45)",
                    background: "rgba(255,200,50,0.08)",
                  }}
                >
                  +50 XP bonus
                </span>
                <span
                  className="mono uppercase text-[11px] tracking-widest px-3 py-1.5 rounded-full"
                  style={{
                    color: PALETTE.green,
                    border: "1px solid rgba(34,197,94,0.45)",
                    background: "rgba(34,197,94,0.08)",
                  }}
                >
                  ×1.20 streak
                </span>
              </div>
              <p
                className="mono text-[10px] uppercase tracking-widest"
                style={{ color: "rgba(255,200,50,0.6)" }}
              >
                {tr(lang, "Clique pour fermer", "Click to close")}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
