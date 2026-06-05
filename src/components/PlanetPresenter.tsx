"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { usePlanetGuide } from "@/lib/planetGuides";

// Présentateur galactique : composant indépendant du Chatbot.
// 3 surfaces : bouton flottant permanent (bottom-right), bulle teaser proactive
// à l'arrivée sur planète (réapparaît à chaque navigation vers une planète,
// SAUF juste après avoir fermé/terminé la visite : il faut alors quitter la
// planète et y revenir pour la voir à nouveau), panel narratif step-by-step.
// Palette or/sable pour se distinguer du chatbot vert mint.

interface PlanetPresenterProps {
  slug: string;
}

const ACCENT = "#E8C77A"; // or chaud, distinct du #A4F5C8 mint du Chatbot
const ACCENT_SOFT = "#D8B88E";

// Palette claire du panel lecture (gris perle métallisé) — contraste fort
// pour la lisibilité tout en gardant l'esprit de l'app via la petite touche
// or conservée sur le badge/dot narration.
const PANEL_BG_TOP = "#F4F6F9";
const PANEL_BG_BOT = "#DDE1E7";
const PANEL_TEXT = "#1B1E25";
const PANEL_TEXT_DIM = "rgba(20,22,28,0.55)";
const PANEL_TEXT_FAINT = "rgba(20,22,28,0.28)";
const PANEL_BORDER = "rgba(20,22,28,0.12)";
const PANEL_DIVIDER = "rgba(20,22,28,0.08)";

// Icône bot, miroir de celle du Chatbot normal mais en palette or : même
// silhouette (antenne, tête, deux yeux, bouche) pour signaler que c'est
// la même famille, couleur or pour distinguer le SuperBot du bot mint.
function BotIcon({ size = 22 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      aria-hidden
      style={{ display: "block" }}
    >
      <line
        x1="18"
        y1="4"
        x2="18"
        y2="9"
        stroke={`${ACCENT}B3`}
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
      <circle cx="13" cy="18" r="1.8" fill={ACCENT} />
      <circle cx="23" cy="18" r="1.8" fill={ACCENT} />
      <line
        x1="14"
        y1="24"
        x2="22"
        y2="24"
        stroke={ACCENT_SOFT}
        strokeWidth="1"
        strokeLinecap="round"
      />
    </svg>
  );
}

// Typewriter pour la narration du panel : pattern miroir de BotMessage
// (point coloré + texte serif italique + curseur clignotant).
function NarrationText({ text }: { text: string }) {
  const [typed, setTyped] = useState("");
  useEffect(() => {
    setTyped("");
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setTyped(text.slice(0, i));
      if (i >= text.length) window.clearInterval(id);
    }, 14);
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
          background: ACCENT,
          boxShadow: `0 0 8px ${ACCENT}AA`,
        }}
      />
      <p
        className="serif-italic leading-relaxed"
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

export function PlanetPresenter({ slug }: PlanetPresenterProps) {
  const { guide, uiText, planetTitle } = usePlanetGuide(slug);

  const [bubbleVisible, setBubbleVisible] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  // Coordination avec ChatbotArrowTip : tant que l'astuce flèches du bot
  // normal est active, on retient la bulle SuperBot pour ne pas afficher
  // les deux popups en même temps. Initialisé depuis le flag global pour
  // gérer le cas où le tip est déjà actif au moment du mount.
  const [arrowTipActive, setArrowTipActive] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.__arrowTipActive === true;
  });

  const showTimerRef = useRef<number | null>(null);
  const hideTimerRef = useRef<number | null>(null);
  // Slug pour lequel la visite vient d'être fermée/terminée : tant qu'on
  // reste sur cette planète, la bulle ne réapparaît pas. Dès qu'on navigue
  // vers une autre planète, la suppression est levée (le ref est nettoyé).
  const suppressForSlugRef = useRef<string | null>(null);

  // Écoute des évènements émis par ChatbotArrowTip.
  useEffect(() => {
    const onStart = () => setArrowTipActive(true);
    const onEnd = () => setArrowTipActive(false);
    window.addEventListener("arrowtip:start", onStart);
    window.addEventListener("arrowtip:end", onEnd);
    return () => {
      window.removeEventListener("arrowtip:start", onStart);
      window.removeEventListener("arrowtip:end", onEnd);
    };
  }, []);

  // Trigger bulle à chaque arrivée sur une planète. Saute la planète dont
  // la visite vient d'être fermée tant qu'on n'a pas changé de slug.
  // Diffère aussi tant que l'astuce flèches du bot normal est visible :
  // l'effet sera relancé à la fin de l'astuce (arrowTipActive change).
  useEffect(() => {
    if (showTimerRef.current) window.clearTimeout(showTimerRef.current);
    if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    setBubbleVisible(false);

    if (!guide) return;
    if (panelOpen) return;
    if (arrowTipActive) return;

    // Si l'on est de retour sur une planète différente de celle dont la
    // visite a été fermée, on lève la suppression.
    if (
      suppressForSlugRef.current !== null &&
      suppressForSlugRef.current !== slug
    ) {
      suppressForSlugRef.current = null;
    }

    // Si l'on est encore sur la planète où la visite vient d'être fermée,
    // on n'affiche pas la bulle.
    if (suppressForSlugRef.current === slug) return;

    showTimerRef.current = window.setTimeout(() => {
      setBubbleVisible(true);
      hideTimerRef.current = window.setTimeout(() => {
        setBubbleVisible(false);
      }, 7000);
    }, 1200);

    return () => {
      if (showTimerRef.current) window.clearTimeout(showTimerRef.current);
      if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    };
  }, [slug, guide, panelOpen, arrowTipActive]);

  // Reset stepIndex quand la planète change (visite suivante repart au début).
  useEffect(() => {
    setStepIndex(0);
    setPanelOpen(false);
  }, [slug]);

  if (!guide) return null;

  const totalSteps = guide.steps.length;
  const currentStep = guide.steps[stepIndex];
  const isLast = stepIndex === totalSteps - 1;

  const openTour = () => {
    setBubbleVisible(false);
    if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    setStepIndex(0);
    setPanelOpen(true);
  };

  const closeTour = () => {
    setPanelOpen(false);
    setStepIndex(0);
    // Marque la planète courante : la bulle ne reviendra que si l'on
    // navigue vers une autre planète puis on revient.
    suppressForSlugRef.current = slug;
  };

  const next = () => {
    if (isLast) {
      closeTour();
    } else {
      setStepIndex((i) => i + 1);
    }
  };

  const prev = () => {
    setStepIndex((i) => Math.max(0, i - 1));
  };

  const dismissBubble = () => {
    setBubbleVisible(false);
    if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
  };

  return (
    <>
      {/* Hint persistant : label "Guided tour" + flèche pointant vers le
          bouton "2.0" pour rendre son rôle évident. Masqué pendant la
          visite (panel ouvert) pour ne pas encombrer. */}
      <AnimatePresence>
        {!panelOpen && (
          <motion.div
            key="role-hint"
            initial={{ opacity: 0, x: 6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 4 }}
            transition={{ delay: 1.4, duration: 0.6, ease: "easeOut" }}
            aria-hidden
            className="fixed z-[39] bottom-6 right-[116px] hidden md:flex items-center gap-2 pointer-events-none mono uppercase"
            style={{
              fontSize: 10,
              letterSpacing: "0.18em",
              color: ACCENT,
              opacity: 0.85,
              height: 38,
            }}
          >
            <span>{uiText.roleHint}</span>
            <motion.span
              aria-hidden
              style={{ fontSize: 14, color: ACCENT }}
              animate={{ x: [0, 3, 0] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            >
              →
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bouton flottant permanent : bottom-right */}
      <motion.button
        type="button"
        onClick={openTour}
        aria-label={uiText.buttonAria}
        className="fixed z-[40] bottom-6 right-6 flex items-center gap-2 select-none"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0, duration: 0.6, ease: "easeOut" }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.96 }}
        style={{
          padding: "9px 14px 9px 12px",
          borderRadius: 999,
          background:
            "linear-gradient(160deg, rgba(20,18,14,0.92) 0%, rgba(8,7,6,0.96) 100%)",
          border: `1px solid ${ACCENT}3a`,
          boxShadow: `0 4px 18px rgba(0,0,0,0.55), 0 0 14px ${ACCENT}26`,
          cursor: "pointer",
        }}
      >
        {/* Ping pulsant pour signaler la disponibilité */}
        <motion.span
          aria-hidden
          className="absolute pointer-events-none"
          style={{
            top: -3,
            right: -3,
            width: 6,
            height: 6,
            borderRadius: 999,
            background: ACCENT,
            boxShadow: `0 0 10px ${ACCENT}`,
          }}
          animate={{ opacity: [0.45, 1, 0.45], scale: [1, 1.25, 1] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        />
        <BotIcon size={20} />
        <span
          className="mono uppercase"
          style={{
            fontSize: 10,
            letterSpacing: "0.18em",
            color: "rgba(236,230,214,0.85)",
          }}
        >
          {uiText.buttonLabel}
        </span>
      </motion.button>

      {/* Bulle teaser proactive : au-dessus du bouton, slide-in depuis le bas */}
      <AnimatePresence>
        {bubbleVisible && !panelOpen && (
          <motion.div
            key={`bubble-${slug}`}
            initial={{ opacity: 0, y: 12, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.96 }}
            transition={{ duration: 0.32, ease: [0.2, 0.8, 0.2, 1] }}
            className="fixed z-[42]"
            style={{
              bottom: 72,
              right: 24,
              width: "min(280px, calc(100vw - 48px))",
              padding: "12px 14px 12px 14px",
              borderRadius: 14,
              background:
                "linear-gradient(180deg, rgba(20,18,14,0.95) 0%, rgba(10,8,6,0.97) 100%)",
              border: `1px solid ${ACCENT}33`,
              boxShadow: `0 18px 40px rgba(0,0,0,0.55), 0 0 22px ${ACCENT}1f`,
              backdropFilter: "blur(8px)",
            }}
          >
            <button
              type="button"
              onClick={dismissBubble}
              aria-label={uiText.bubbleDismissAria}
              className="absolute top-1.5 right-2 hover:opacity-100"
              style={{
                fontSize: 14,
                lineHeight: 1,
                color: "rgba(236,230,214,0.55)",
                opacity: 0.7,
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
              {uiText.badge}
            </p>
            <div className="flex gap-2 items-start mb-2">
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
                {guide.bubbleTeaser}
              </p>
            </div>
            <button
              type="button"
              onClick={openTour}
              className="mono uppercase transition-colors hover:bg-thread/10"
              style={{
                fontSize: 10,
                letterSpacing: "0.12em",
                padding: "5px 10px",
                borderRadius: 999,
                color: ACCENT,
                border: `1px solid ${ACCENT}50`,
                background: "transparent",
                cursor: "pointer",
              }}
            >
              {uiText.bubbleCta}
            </button>
            {/* Petite flèche pointant vers le bouton */}
            <span
              aria-hidden
              className="absolute"
              style={{
                bottom: -6,
                right: 28,
                width: 12,
                height: 12,
                background:
                  "linear-gradient(135deg, transparent 50%, rgba(10,8,6,0.97) 50%)",
                borderRight: `1px solid ${ACCENT}33`,
                borderBottom: `1px solid ${ACCENT}33`,
                transform: "rotate(45deg)",
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Panel de visite : slide-in depuis la droite, narration step-by-step */}
      <AnimatePresence>
        {panelOpen && currentStep && (
          <motion.div
            key={`panel-${slug}`}
            initial={{ opacity: 0, x: 24, scale: 0.97 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 16, scale: 0.97 }}
            transition={{ duration: 0.36, ease: [0.2, 0.8, 0.2, 1] }}
            className="fixed z-[43] flex flex-col"
            style={{
              bottom: 72,
              right: 24,
              width: "min(380px, calc(100vw - 48px))",
              maxHeight: "min(420px, calc(100vh - 120px))",
              borderRadius: 16,
              background: `linear-gradient(180deg, ${PANEL_BG_TOP} 0%, ${PANEL_BG_BOT} 100%)`,
              border: `1px solid ${PANEL_BORDER}`,
              boxShadow:
                "0 24px 60px rgba(8,10,16,0.55), 0 1px 0 rgba(255,255,255,0.75) inset, 0 -1px 0 rgba(20,22,28,0.06) inset",
              overflow: "hidden",
            }}
          >
            {/* Sheen métallique discret en haut-gauche pour signifier la
                surface "brushed metal" plutôt qu'une carte plate. */}
            <div
              aria-hidden
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "linear-gradient(135deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0) 28%), \
                   linear-gradient(315deg, rgba(20,22,28,0.05) 0%, transparent 35%)",
              }}
            />

            {/* Header */}
            <div
              className="px-5 pt-4 pb-3 relative flex items-baseline justify-between gap-2"
              style={{ borderBottom: `1px solid ${PANEL_DIVIDER}` }}
            >
              <div>
                <p
                  className="mono uppercase tracking-[0.4em] text-[9px]"
                  style={{ color: ACCENT_SOFT }}
                >
                  {uiText.badge}
                </p>
                <p
                  className="serif-italic mt-1"
                  style={{ fontSize: 16, color: PANEL_TEXT }}
                >
                  {uiText.panelTitle(planetTitle)}
                </p>
              </div>
              <button
                type="button"
                onClick={closeTour}
                aria-label={uiText.closeAria}
                style={{
                  fontSize: 18,
                  lineHeight: 1,
                  color: PANEL_TEXT_DIM,
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  padding: 4,
                }}
              >
                ×
              </button>
            </div>

            {/* Step counter + narration */}
            <div className="flex-1 overflow-y-auto px-5 py-4 relative">
              <p
                className="mono uppercase tracking-[0.3em] mb-3"
                style={{ fontSize: 9, color: PANEL_TEXT_DIM }}
              >
                {uiText.stepCounter(stepIndex + 1, totalSteps)}
              </p>
              <NarrationText
                key={`step-${stepIndex}`}
                text={currentStep.text}
              />
            </div>

            {/* Footer nav */}
            <div
              className="px-4 py-3 relative flex items-center justify-between gap-2"
              style={{ borderTop: `1px solid ${PANEL_DIVIDER}` }}
            >
              <button
                type="button"
                onClick={prev}
                disabled={stepIndex === 0}
                className="mono uppercase transition-colors"
                style={{
                  fontSize: 10,
                  letterSpacing: "0.12em",
                  padding: "5px 10px",
                  borderRadius: 999,
                  color: stepIndex === 0 ? PANEL_TEXT_FAINT : PANEL_TEXT,
                  border: `1px solid ${
                    stepIndex === 0
                      ? "rgba(20,22,28,0.08)"
                      : "rgba(20,22,28,0.22)"
                  }`,
                  background: "transparent",
                  cursor: stepIndex === 0 ? "default" : "pointer",
                }}
              >
                {uiText.prev}
              </button>

              {/* Indicateurs de progression */}
              <div className="flex gap-1">
                {guide.steps.map((_, i) => (
                  <span
                    key={i}
                    aria-hidden
                    style={{
                      width: i === stepIndex ? 14 : 6,
                      height: 4,
                      borderRadius: 999,
                      background:
                        i === stepIndex
                          ? PANEL_TEXT
                          : i < stepIndex
                            ? "rgba(20,22,28,0.45)"
                            : "rgba(20,22,28,0.18)",
                      transition: "all 0.3s ease",
                    }}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={next}
                className="mono uppercase transition-colors hover:opacity-90"
                style={{
                  fontSize: 10,
                  letterSpacing: "0.12em",
                  padding: "5px 12px",
                  borderRadius: 999,
                  color: PANEL_BG_TOP,
                  border: `1px solid ${PANEL_TEXT}`,
                  background: PANEL_TEXT,
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                {isLast ? uiText.finish : uiText.next}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
