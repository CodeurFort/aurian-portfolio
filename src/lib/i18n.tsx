"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  useCallback,
  type ReactNode,
} from "react";

export type Lang = "fr" | "en";

const STORAGE_KEY = "aurian-portfolio-lang";

interface LangCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  toggle: () => void;
  t: <T extends { fr: string; en: string }>(obj: T) => string;
}

const Ctx = createContext<LangCtx | null>(null);

function detectInitialLang(): Lang {
  if (typeof window === "undefined") return "fr";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "fr" || stored === "en") return stored;
  const nav = window.navigator?.language?.toLowerCase() ?? "";
  if (nav.startsWith("fr")) return "fr";
  return "en";
}

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("fr");

  // Hydrate from storage / browser on mount
  useEffect(() => {
    const initial = detectInitialLang();
    setLangState(initial);
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, l);
      window.document.documentElement.lang = l;
    }
  }, []);

  const toggle = useCallback(() => {
    setLang(lang === "fr" ? "en" : "fr");
  }, [lang, setLang]);

  const value = useMemo<LangCtx>(
    () => ({
      lang,
      setLang,
      toggle,
      t: (obj) => obj[lang],
    }),
    [lang, setLang, toggle]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLang(): LangCtx {
  const ctx = useContext(Ctx);
  if (!ctx) {
    // Fallback (should not happen if Provider mounted) — default to FR
    return {
      lang: "fr",
      setLang: () => {},
      toggle: () => {},
      t: (obj) => obj.fr,
    };
  }
  return ctx;
}

// Convenience helper for components: pass an inline object.
export function tr(lang: Lang, fr: string, en: string): string {
  return lang === "fr" ? fr : en;
}

// ---------------------------------------------------------------------------
// Localized content hook. Returns the FR or EN slice of static content.
// ---------------------------------------------------------------------------
import {
  projects,
  projectsEn,
  projectQualities,
  projectQualitiesEn,
  softSkillBlocks,
  softSkillBlocksEn,
  hobbies,
  hobbiesEn,
  stack,
  stackEn,
  profile,
  profileEn,
  certifications,
  certificationsEn,
} from "./content";

export function useContent() {
  const { lang } = useLang();
  return lang === "fr"
    ? { projects, projectQualities, softSkillBlocks, hobbies, stack, profile, certifications }
    : {
        projects: projectsEn,
        projectQualities: projectQualitiesEn,
        softSkillBlocks: softSkillBlocksEn,
        hobbies: hobbiesEn,
        stack: stackEn,
        profile: profileEn,
        certifications: certificationsEn,
      };
}

// ---------------------------------------------------------------------------
// UI text dictionary — all visible strings outside of `content.ts` live here.
// ---------------------------------------------------------------------------
const UI_TEXT = {
  fr: {
    // Header / global
    headerSubtitle: "Portfolio · Univers",
    enter: "entrer",
    worldTitle: "Univers",
    // Star legend (right side)
    legendTitle: "Étoiles",
    starParcours: "Parcours",
    starStack: "Stack",
    starQualites: "Qualités",
    starLangues: "Langues",
    starOrbites: "Orbites",
    starContact: "Contact",
    starCerts: "Certifications",
    // Chapter labels
    chapter1: "Chapitre I",
    chapter2: "Chapitre II",
    chapter3: "Chapitre III",
    chapterExo: "Exoplanète",
    chapter5: "Chapitre V",
    // Status
    statusOngoing: "En cours · Bêta",
    statusDone: "Terminé",
    // Project overlay
    accomplishments: "Accomplissements",
    stackLabel: "Stack",
    moonsLabel: "Agents en orbite",
    visualsLabel: "Aperçu",
    seeLive: "Voir live →",
    seeGithub: "Github →",
    closeLabel: "Fermer ✕",
    // Stack overlay
    stackContext: "Stack pertinente",
    stackSubtitle: "Les outils mobilisés sur cette planète.",
    // Quality overlay
    qualityContext: "Qualités tendues avec",
    // Info overlays
    infoCv: "Parcours",
    infoStack: "Stack",
    infoQualites: "Qualités",
    infoLangues: "Langues",
    infoOrbites: "Orbites",
    infoContact: "Contact",
    infoCerts: "Certifications & Diplômes",
    certsIntro: "Quelques jalons posés et vérifiables. Les pièces sont téléchargeables quand elles existent.",
    certsPending: "À venir",
    certsDownload: "Voir l'attestation ↗",
    cvCurrent: "Poste actuel",
    cvPath: "Parcours",
    cvFormation: "Formation",
    cvDownload: "Télécharger CV ↗",
    qualitiesIntro:
      "Cinq paires de qualités, une par planète. Deux qualités tenues ensemble, chacune corrigeant l'excès de l'autre.",
    softSkillsTitle: "Soft skills",
    softSkillsIntro:
      "Quatre familles transversales, présentes sur tous les projets — pas attachées à une planète.",
    // Stack categories
    catLang: "Langages",
    catData: "Data",
    catCloud: "Cloud",
    catAi: "IA",
    catOther: "Outils",
    // Identity
    identityChapter: "Volcanique",
    // Chatbot
    botBadge: "Aurian · Bot",
    botPrompt: "Qu'aimerais-tu savoir ?",
    botMenuLabel: "Choisis une question",
    botGreet: "Salut. Je suis Aurian, version bot. Pose-moi une question.",
    botRoot: "Que veux-tu savoir ? Je te dirai où regarder.",
    botIdentity:
      "Pour me découvrir vraiment, clique sur l'étoile volcanique (rouge, en bas de la légende en haut à droite). Tu y trouveras ma signature.",
    botProjects:
      "Cinq planètes orbitent autour de toi. Utilise les flèches gauche / droite (ou les touches du clavier) pour les visiter, et clique sur une planète pour ouvrir son dossier.",
    botProject:
      "Chaque planète a son ambiance et son dossier. Clique directement dessus dans le système, ou ouvre la fiche depuis la flèche en bas. Cinq destinations t'attendent.",
    botStack:
      "Ma stack vit dans la légende, en haut à droite. Clique sur Stack (l'octaèdre) pour voir mes outils rangés par catégorie.",
    botQualities:
      "Mes qualités sont incarnées par chaque planète, une paire par projet. Ouvre Qualités dans la légende, ou explore une planète pour voir la sienne.",
    botContact:
      "Clique sur Contact (le cube) dans la légende. Email, LinkedIn et GitHub y sont rangés.",
    botHobbies:
      "Loisirs (la sphère) dans la légende, en haut à droite. La liste s'y trouve.",
    botFormation:
      "Ma formation est dans Parcours (le triangle) dans la légende. Clique pour voir le détail.",
    botCv:
      "Mon parcours est dans Parcours (le triangle) en haut à droite. Présent, passé et CV à télécharger y sont posés.",
    botLanguages:
      "Langues (le tétraèdre) dans la légende, en haut à droite. Trois langues, niveaux indiqués.",
    botJoke:
      "Voici. Deux étoiles entrent dans un bar. L'une dit à l'autre : « Tu brilles trop, on nous regarde ». La blague est faible, l'univers aussi parfois.",
    botBot:
      "Je suis une version bot d'Aurian. Je ne réponds qu'en pointant. Le reste, c'est à toi de le trouver dans l'univers.",
    // Bot menu labels
    bMenu: "Menu",
    bIdentity: "Qui es-tu",
    bProjects: "Tes projets",
    bProject: "Explore une planète",
    bStack: "Ta stack",
    bQualities: "Tes qualités",
    bContact: "Comment te contacter",
    bHobbies: "Tes loisirs",
    bFormation: "Ta formation",
    bCv: "Ton parcours",
    bLanguages: "Tes langues",
    bJoke: "Une blague",
    bBot: "Qui es-tu, toi le bot",
    botOpenAria: "Ouvrir le guide",
    botCloseAria: "Fermer le guide",
    // Aria
    closeAria: "Fermer",
  },
  en: {
    headerSubtitle: "Portfolio · Universe",
    enter: "enter",
    worldTitle: "Universe",
    legendTitle: "Stars",
    starParcours: "Path",
    starStack: "Stack",
    starQualites: "Qualities",
    starLangues: "Languages",
    starOrbites: "Orbits",
    starContact: "Contact",
    starCerts: "Certifications",
    chapter1: "Chapter I",
    chapter2: "Chapter II",
    chapter3: "Chapter III",
    chapterExo: "Exoplanet",
    chapter5: "Chapter V",
    statusOngoing: "In progress · Beta",
    statusDone: "Completed",
    accomplishments: "Achievements",
    stackLabel: "Stack",
    moonsLabel: "Agents in orbit",
    visualsLabel: "Preview",
    seeLive: "Live demo →",
    seeGithub: "Github →",
    closeLabel: "Close ✕",
    stackContext: "Relevant stack",
    stackSubtitle: "The tools used on this planet.",
    qualityContext: "Qualities held with",
    infoCv: "Path",
    infoStack: "Stack",
    infoQualites: "Qualities",
    infoLangues: "Languages",
    infoOrbites: "Orbits",
    infoContact: "Contact",
    infoCerts: "Certifications & Degrees",
    certsIntro: "A few milestones, all verifiable. Documents are downloadable when available.",
    certsPending: "Upcoming",
    certsDownload: "View certificate ↗",
    cvCurrent: "Current role",
    cvPath: "Background",
    cvFormation: "Education",
    cvDownload: "Download CV ↗",
    qualitiesIntro:
      "Five pairs of qualities, one per planet. Two qualities held together, each correcting the other's excess.",
    softSkillsTitle: "Soft skills",
    softSkillsIntro:
      "Four cross-cutting families that show up on every project — not tied to a single planet.",
    catLang: "Languages",
    catData: "Data",
    catCloud: "Cloud",
    catAi: "AI",
    catOther: "Tools",
    identityChapter: "Volcanic",
    botBadge: "Aurian · Bot",
    botPrompt: "What would you like to know?",
    botMenuLabel: "Pick a question",
    botGreet: "Hi. I am Aurian, bot version. Ask me anything.",
    botRoot: "What do you want to know? I will tell you where to look.",
    botIdentity:
      "To really get to know me, click the volcanic star (red, at the bottom of the legend top-right). My signature is there.",
    botProjects:
      "Five planets orbit around you. Use the left / right arrows (or the keyboard) to visit them, and click a planet to open its file.",
    botProject:
      "Every planet has its own atmosphere and file. Click it directly in the system, or open the card from the arrow at the bottom. Five destinations await.",
    botStack:
      "My stack lives in the legend, top-right. Click Stack (the octahedron) to see my tools by category.",
    botQualities:
      "My qualities are embodied by each planet, one pair per project. Open Qualities in the legend, or explore a planet to see its own.",
    botContact:
      "Click Contact (the cube) in the legend. Email, LinkedIn and GitHub are stored there.",
    botHobbies:
      "Hobbies (the sphere) in the legend, top-right. The list is there.",
    botFormation:
      "My education is in Path (the triangle) in the legend. Click to see the details.",
    botCv:
      "My path is in Path (the triangle), top-right. Present, past and CV to download are all there.",
    botLanguages:
      "Languages (the tetrahedron) in the legend, top-right. Three languages, levels indicated.",
    botJoke:
      "Here. Two stars walk into a bar. One says to the other: \"You shine too much, people are watching us.\" Weak joke, the universe is too sometimes.",
    botBot:
      "I am a bot version of Aurian. I only point. The rest is for you to find in the universe.",
    bMenu: "Menu",
    bIdentity: "Who are you",
    bProjects: "Your projects",
    bProject: "Explore a planet",
    bStack: "Your stack",
    bQualities: "Your qualities",
    bContact: "How to reach you",
    bHobbies: "Your hobbies",
    bFormation: "Your education",
    bCv: "Your path",
    bLanguages: "Your languages",
    bJoke: "A joke",
    bBot: "Who are you, bot",
    botOpenAria: "Open the guide",
    botCloseAria: "Close the guide",
    closeAria: "Close",
  },
} as const;

export type UiKey = keyof (typeof UI_TEXT)["fr"];

export function useUi() {
  const { lang } = useLang();
  return UI_TEXT[lang];
}
