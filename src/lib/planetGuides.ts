import { useMemo } from "react";
import { useLang } from "./i18n";

// Présentateur galactique · registry per-planète, indépendant du Chatbot.
// Voix : 1ère personne, sobre, encourageante (même tonalité que botGreet).
// Pas d'em dash. Steps adaptables : étendre `GuideStep` si besoin.

export type GuideStep = { kind: "narrate"; text: string };

export interface PlanetGuide {
  bubbleTeaser: string;
  steps: GuideStep[];
}

export interface PresenterUiText {
  badge: string;
  buttonLabel: string;
  buttonAria: string;
  bubbleCta: string;
  bubbleDismissAria: string;
  prev: string;
  next: string;
  finish: string;
  closeAria: string;
  roleHint: string;
  panelTitle: (planetName: string) => string;
  stepCounter: (cur: number, total: number) => string;
}

const FR_UI: PresenterUiText = {
  badge: "Aurian · SuperBot",
  buttonLabel: "2.0",
  buttonAria: "Lancer la visite guidée de la planète",
  bubbleCta: "2.0",
  bubbleDismissAria: "Fermer la bulle",
  prev: "Précédent",
  next: "Suivant",
  finish: "Terminer",
  closeAria: "Fermer la visite",
  roleHint: "Visite guidée",
  panelTitle: (n) => `Visite · ${n}`,
  stepCounter: (c, t) => `${c} / ${t}`,
};

const EN_UI: PresenterUiText = {
  badge: "Aurian · SuperBot",
  buttonLabel: "2.0",
  buttonAria: "Start the guided tour of the planet",
  bubbleCta: "2.0",
  bubbleDismissAria: "Dismiss bubble",
  prev: "Previous",
  next: "Next",
  finish: "Finish",
  closeAria: "Close the tour",
  roleHint: "Guided tour",
  panelTitle: (n) => `Tour · ${n}`,
  stepCounter: (c, t) => `${c} / ${t}`,
};

const PLANET_TITLES: Record<string, string> = {
  levels: "Levels",
  energizer: "Energizer",
  mirakl: "Mirakl",
  "music-agency": "Music Agency",
  thelook: "TheLook",
};

const FR: Record<string, PlanetGuide> = {
  levels: {
    bubbleTeaser:
      "Bienvenue sur Levels. Veux-tu que je te raconte cette planète ?",
    steps: [
      {
        kind: "narrate",
        text: "Levels, c'est l'idée que la discipline se joue chaque jour. Cinq objectifs par jour, de l'XP, des séries, et une planification sur tous les horizons : la semaine, le mois, l'année, la vie.",
      },
      {
        kind: "narrate",
        text: "Autour du quotidien, un vrai jeu : 6 mentors IA et leurs programmes guidés, des duels à preuves photo jugées par un jury, une base à bâtir avec son économie interne, un assistant vocal.",
      },
      {
        kind: "narrate",
        text: "Architecture assumée : client vanilla zéro build, 60+ Cloud Functions derrière, sync Firestore temps réel. Bilingue : le bundle anglais est généré au build depuis la source française.",
      },
    ],
  },
  energizer: {
    bubbleTeaser: "Energizer t'attend. Je te fais le tour ?",
    steps: [
      {
        kind: "narrate",
        text: "Energizer aide les entreprises à briller dans les moteurs traditionnels et génératifs. SEO, GEO, AEO. Audit, plan d'actions, rédaction.",
      },
      {
        kind: "narrate",
        text: "La feature phare : la génération de blogs personnalisés à partir des meilleurs mots-clés issus du scrapping et du scoring du diagnostic.",
      },
      {
        kind: "narrate",
        text: "Pipeline IA en cinq étapes orchestrées : stratégie, veille, concurrence, critique, scoring. L'agent s'auto-révise tant que la cible n'est pas atteinte.",
      },
      {
        kind: "narrate",
        text: "Clique sur la planète pour ouvrir son dossier : pitch, réalisations, stack et lien vers le live.",
      },
    ],
  },
  mirakl: {
    bubbleTeaser:
      "Mirakl. Mon expérience marketplace. Je te montre l'essentiel ?",
    steps: [
      {
        kind: "narrate",
        text: "Mirakl, c'est mon passage côté marketplace : data, opérations, accompagnement vendeurs. Une planète plus turbulente, plus opérationnelle.",
      },
      {
        kind: "narrate",
        text: "Clique sur la planète pour ouvrir son dossier : pitch, réalisations marketplace et stack utilisée au quotidien.",
      },
    ],
  },
  "music-agency": {
    bubbleTeaser:
      "Une exoplanète : la musique. Petit détour ?",
    steps: [
      {
        kind: "narrate",
        text: "Music Agency, c'est l'autre face. Pas un projet tech : un espace artistique, des prods, des collaborations.",
      },
      {
        kind: "narrate",
        text: "Je l'ai gardée comme exoplanète parce que c'est un fil parallèle au reste. Important pour comprendre qui je suis hors code.",
      },
      {
        kind: "narrate",
        text: "Clique sur la planète pour ouvrir son dossier : prods, collaborations et univers musical.",
      },
    ],
  },
  thelook: {
    bubbleTeaser:
      "TheLook : audit SQL e-commerce. Je te résume la mécanique ?",
    steps: [
      {
        kind: "narrate",
        text: "TheLook, c'est un audit complet d'un e-commerce sur BigQuery. Une seule requête : douze CTEs chaînées qui répondent aux questions business clés.",
      },
      {
        kind: "narrate",
        text: "Acquisition, rétention, panier moyen, top produits, cohortes, fenêtres glissantes : tout sort d'un seul SELECT final, lisible et reproductible.",
      },
      {
        kind: "narrate",
        text: "La planète stratifiée représente les douze couches du pipeline. Clique pour voir la requête entière, la stack et les indicateurs.",
      },
    ],
  },
};

const EN: Record<string, PlanetGuide> = {
  levels: {
    bubbleTeaser: "Welcome to Levels. Want me to walk you through it?",
    steps: [
      {
        kind: "narrate",
        text: "Levels is the idea that discipline plays out daily. Five goals a day, XP, streaks, and planning across every horizon: week, month, year, life.",
      },
      {
        kind: "narrate",
        text: "Around the daily loop, a full game: 6 AI mentors and their guided programs, duels with photo proofs judged by a jury, a homestead to build with its own economy, a voice assistant.",
      },
      {
        kind: "narrate",
        text: "Deliberate architecture: zero-build vanilla client, 60+ Cloud Functions behind, real-time Firestore sync. Bilingual: the English bundle is generated at build time from the French source.",
      },
      {
        kind: "narrate",
        text: "Click the planet to open its full file: pitch, achievements, stack and the live app link.",
      },
    ],
  },
  energizer: {
    bubbleTeaser: "Energizer is waiting. Want the tour?",
    steps: [
      {
        kind: "narrate",
        text: "Energizer helps companies shine in both traditional and generative search engines. SEO, GEO, AEO. Audit, action plan, writing.",
      },
      {
        kind: "narrate",
        text: "Flagship feature: personalised blog generation, fed by the best keywords from scraping and the diagnosis scoring.",
      },
      {
        kind: "narrate",
        text: "Five-stage AI pipeline: strategy, watch, competition, critique, scoring. The agent self-revises until the target score is hit.",
      },
      {
        kind: "narrate",
        text: "Click the planet to open its file: pitch, achievements, stack and the live link.",
      },
    ],
  },
  mirakl: {
    bubbleTeaser: "Mirakl. My marketplace experience. Want the highlights?",
    steps: [
      {
        kind: "narrate",
        text: "Mirakl is my marketplace chapter: data, operations, seller support. A more turbulent, hands-on planet.",
      },
      {
        kind: "narrate",
        text: "Click the planet to open its file: pitch, marketplace achievements and the daily stack.",
      },
    ],
  },
  "music-agency": {
    bubbleTeaser: "An exoplanet: music. Quick detour?",
    steps: [
      {
        kind: "narrate",
        text: "Music Agency is the other side. Not a tech project: an artistic space, productions, collaborations.",
      },
      {
        kind: "narrate",
        text: "I kept it as an exoplanet because it runs parallel to the rest. Useful to understand who I am outside code.",
      },
      {
        kind: "narrate",
        text: "Click the planet to open its file: productions, collaborations and the music universe.",
      },
    ],
  },
  thelook: {
    bubbleTeaser: "TheLook: e-commerce SQL audit. Want a quick walkthrough?",
    steps: [
      {
        kind: "narrate",
        text: "TheLook is a full e-commerce audit on BigQuery. One single query: twelve chained CTEs answering the key business questions.",
      },
      {
        kind: "narrate",
        text: "Acquisition, retention, average basket, top products, cohorts, rolling windows: it all comes out of one final SELECT, readable and reproducible.",
      },
      {
        kind: "narrate",
        text: "The stratified planet mirrors the twelve layers of the pipeline. Click to see the full query, stack and indicators.",
      },
    ],
  },
};

export function getPlanetTitle(slug: string): string {
  return PLANET_TITLES[slug] ?? slug;
}

export function usePlanetGuide(slug: string): {
  guide: PlanetGuide | null;
  uiText: PresenterUiText;
  planetTitle: string;
} {
  const { lang } = useLang();
  return useMemo(
    () => ({
      guide: (lang === "fr" ? FR : EN)[slug] ?? null,
      uiText: lang === "fr" ? FR_UI : EN_UI,
      planetTitle: getPlanetTitle(slug),
    }),
    [lang, slug],
  );
}
