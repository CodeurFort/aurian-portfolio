"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLang } from "@/lib/i18n";
import { useIsTouch } from "@/lib/useIsTouch";

// Pop up indépendante du panel Chatbot : émane visuellement du bouton bot
// (top-left), rappelle à l'utilisateur les commandes de navigation entre
// planètes. Réapparaît à chaque dismiss de l'intro (donc au refresh et au
// retour depuis la landing). Auto-hide à 8 s ou à la première touche flèche
// / Escape. Palette mint cohérente avec le Chatbot.
//
// Coordination : émet "arrowtip:start" / "arrowtip:end" sur window pour que
// le SuperBot (PlanetPresenter) puisse différer sa propre bulle et éviter
// que les deux popups se chevauchent au premier arrivage sur les planètes.
// Un flag global `__arrowTipActive` permet aussi à un consumer monté plus
// tard que l'évènement de connaître l'état courant.

const ACCENT = "#A4F5C8";
const ACCENT_SOFT = "#8FE0B5";

declare global {
  interface Window {
    __arrowTipActive?: boolean;
  }
}

interface TipText {
  badge: string;
  title: string;
  body: string;
  closeAria: string;
}

const FR_TEXT_DESK: TipText = {
  badge: "Aurian · Bot",
  title: "Astuce navigation",
  body: "Tu peux utiliser les flèches du clavier ou les boutons latéraux pour passer d'une planète à l'autre.",
  closeAria: "Fermer l'astuce",
};

const FR_TEXT_TOUCH: TipText = {
  badge: "Aurian · Bot",
  title: "Astuce navigation",
  body: "Touche les boutons latéraux ou glisse l'écran pour passer d'une planète à l'autre.",
  closeAria: "Fermer l'astuce",
};

const EN_TEXT_DESK: TipText = {
  badge: "Aurian · Bot",
  title: "Navigation tip",
  body: "Use the keyboard arrows or the side buttons to move between planets.",
  closeAria: "Dismiss tip",
};

const EN_TEXT_TOUCH: TipText = {
  badge: "Aurian · Bot",
  title: "Navigation tip",
  body: "Tap the side buttons or swipe to move between planets.",
  closeAria: "Dismiss tip",
};

export function ChatbotArrowTip() {
  const { lang } = useLang();
  const isTouch = useIsTouch();
  const t =
    lang === "fr"
      ? isTouch
        ? FR_TEXT_TOUCH
        : FR_TEXT_DESK
      : isTouch
        ? EN_TEXT_TOUCH
        : EN_TEXT_DESK;

  const [visible, setVisible] = useState(false);
  const showTimerRef = useRef<number | null>(null);
  const hideTimerRef = useRef<number | null>(null);

  // Le composant n'est monté qu'après le dismiss de l'intro (cf.
  // PortfolioUniverse). Chaque montage relance donc l'apparition : refresh
  // et "retour à la landing" puis re-dismiss déclenchent à nouveau l'astuce.
  // On marque l'astuce comme active dès le mount (avant même qu'elle
  // s'affiche après les 1.5 s) pour que le SuperBot diffère sa bulle.
  useEffect(() => {
    window.__arrowTipActive = true;
    window.dispatchEvent(new Event("arrowtip:start"));

    const endTip = () => {
      window.__arrowTipActive = false;
      window.dispatchEvent(new Event("arrowtip:end"));
    };

    showTimerRef.current = window.setTimeout(() => {
      setVisible(true);
      hideTimerRef.current = window.setTimeout(() => {
        setVisible(false);
        endTip();
      }, 8000);
    }, 1500);

    return () => {
      if (showTimerRef.current) window.clearTimeout(showTimerRef.current);
      if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
      // Sécurité : si l'astuce est démontée avant la fin, on libère la
      // coordination pour ne pas laisser le SuperBot bloqué.
      if (window.__arrowTipActive) endTip();
    };
  }, []);

  // Auto-dismiss à la première interaction utilisateur (le message a été lu
  // ou l'utilisateur a déjà commencé à explorer). On notifie aussi la fin
  // pour que le SuperBot puisse reprendre la main.
  useEffect(() => {
    if (!visible) return;
    const dismiss = () => {
      setVisible(false);
      if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
      window.__arrowTipActive = false;
      window.dispatchEvent(new Event("arrowtip:end"));
    };
    const onKey = (e: KeyboardEvent) => {
      if (
        e.key === "ArrowLeft" ||
        e.key === "ArrowRight" ||
        e.key === "Escape"
      ) {
        dismiss();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
    };
  }, [visible]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="arrow-tip"
          role="status"
          initial={{ opacity: 0, y: -8, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -6, scale: 0.97 }}
          transition={{ duration: 0.34, ease: [0.2, 0.8, 0.2, 1] }}
          className="fixed z-[42] top-[58px] left-3 md:top-[88px] md:left-6"
          style={{
            width: "min(300px, calc(100vw - 28px))",
            padding: "12px 14px 12px 14px",
            borderRadius: 14,
            background:
              "linear-gradient(180deg, rgba(14,15,18,0.94) 0%, rgba(7,8,10,0.97) 100%)",
            border: `1px solid ${ACCENT}33`,
            boxShadow: `0 18px 40px rgba(0,0,0,0.55), 0 0 22px ${ACCENT}1f`,
            backdropFilter: "blur(8px)",
          }}
        >
          {/* Petite flèche pointant vers le bouton Chatbot (top-left) */}
          <span
            aria-hidden
            className="absolute"
            style={{
              top: -6,
              left: 18,
              width: 12,
              height: 12,
              background:
                "linear-gradient(315deg, transparent 50%, rgba(14,15,18,0.94) 50%)",
              borderTop: `1px solid ${ACCENT}33`,
              borderLeft: `1px solid ${ACCENT}33`,
              transform: "rotate(45deg)",
            }}
          />

          <button
            type="button"
            onClick={() => {
              setVisible(false);
              if (hideTimerRef.current)
                window.clearTimeout(hideTimerRef.current);
              window.__arrowTipActive = false;
              window.dispatchEvent(new Event("arrowtip:end"));
            }}
            aria-label={t.closeAria}
            className="absolute top-1.5 right-2"
            style={{
              fontSize: 14,
              lineHeight: 1,
              color: "rgba(236,230,214,0.55)",
              opacity: 0.75,
              background: "transparent",
              border: "none",
              cursor: "pointer",
            }}
          >
            ×
          </button>

          <p
            className="mono uppercase tracking-[0.3em] mb-1.5"
            style={{ fontSize: 8, color: ACCENT_SOFT }}
          >
            {t.badge}
          </p>

          <p
            className="serif-italic text-text mb-1.5"
            style={{ fontSize: 13, fontWeight: 500 }}
          >
            {t.title}
          </p>

          <div className="flex gap-2 items-start">
            <span
              aria-hidden
              className="shrink-0 mt-1.5"
              style={{
                width: 6,
                height: 6,
                borderRadius: 999,
                background: ACCENT,
                boxShadow: `0 0 8px ${ACCENT}AA`,
              }}
            />
            <p
              className="serif-italic text-text leading-snug"
              style={{ fontSize: 13 }}
            >
              {t.body}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
