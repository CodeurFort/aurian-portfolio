export type PaperColor =
  | "paper-cream"
  | "paper-mint"
  | "paper-ochre"
  | "paper-blush"
  | "paper-stone";

export interface Moon {
  name: string;
  pitch: string;
  bullets: string[];
  stack: string[];
}

export interface Project {
  slug: string;
  chapter: string;
  title: string;
  paperColor: PaperColor;
  pitch: string;
  role?: string;
  achievements: string[];
  stack: string[];
  liveUrl?: string;
  repoUrl?: string;
  moons?: Moon[];
}

export interface SoftSkill {
  slug: "creativite" | "adaptabilite" | "travailleur" | "sociabilite";
  label: string;
  quote: string;
  linkedProjectSlugs: string[];
}

export interface Hobby {
  label: string;
  detail?: string;
}

export interface StackTool {
  label: string;
  category: "lang" | "data" | "cloud" | "ai" | "other";
}

export interface Profile {
  name: string;
  tagline: string;
  email: string;
  linkedin: string;
  github: string;
  twitter?: string;
  phone: string;
  cvPdf: string;
  cvCurrent: string;
  cvPrevious: string;
  formation: string;
  languages: { label: string; level: string }[];
}

const placeholder = (key: string) => `[À FOURNIR — ${key}]`;

export const projects: Project[] = [
  {
    slug: "levels",
    chapter: "i",
    title: "Levels",
    paperColor: "paper-cream",
    pitch: placeholder("levels.pitch"),
    role: placeholder("levels.role"),
    achievements: [
      placeholder("levels.achievement.1"),
      placeholder("levels.achievement.2"),
      placeholder("levels.achievement.3"),
    ],
    stack: ["[À FOURNIR — stack]"],
  },
  {
    slug: "energizer",
    chapter: "ii",
    title: "Energizer SEO / GEO / AEO",
    paperColor: "paper-mint",
    pitch:
      "Agent IA en cinq étapes — Stratégie, Veille, Concurrence, Critique, Scoring — qui diagnostique la présence d'une marque sur les moteurs traditionnels et génératifs.\n\nMulti-tenant : chaque entreprise est un contexte injecté dans l'agent, avec son propre crawler maison et sa pipeline Blog Redactor v2 qui s'auto-révise tant que le score /100 (SEO + GEO + E-E-A-T + Pertinence) n'est pas atteint.",
    role: "Conception, architecture, dev solo",
    achievements: [
      "Pipeline 5 étapes diagnostic + Blog Redactor avec auto-révision",
      "Architecture multi-tenant (entreprise = contexte agent)",
      "Crawler maison BeautifulSoup + diagnostic 3 piliers SEO/GEO/E-E-A-T",
    ],
    stack: ["FastAPI", "Next.js 16", "Supabase", "OpenAI GPT-4", "DALL-E 3", "Tailwind v4", "Vercel", "Railway"],
  },
  {
    slug: "mirakl",
    chapter: "iii",
    title: "Mirakl Prospector",
    paperColor: "paper-ochre",
    pitch: placeholder("mirakl.pitch"),
    role: placeholder("mirakl.role"),
    achievements: [
      placeholder("mirakl.achievement.1"),
      placeholder("mirakl.achievement.2"),
      placeholder("mirakl.achievement.3"),
    ],
    stack: ["[À FOURNIR — stack]"],
  },
  {
    slug: "music-agency",
    chapter: "iv",
    title: "Music Agency — 5 Dust",
    paperColor: "paper-blush",
    pitch: placeholder("music.pitch"),
    achievements: [
      placeholder("music.achievement.1"),
      placeholder("music.achievement.2"),
      placeholder("music.achievement.3"),
    ],
    stack: ["Dust", "[À FOURNIR — stack]"],
  },
  {
    slug: "thelook",
    chapter: "v",
    title: "TheLook Analytics",
    paperColor: "paper-stone",
    role: "audit SQL avancé",
    pitch:
      "audit complet d'une marketplace fictive (TheLook eCommerce). 11 CTEs imbriquées, window functions pour cohort analysis, KPIs business : LTV, retention, panier moyen, performance par catégorie.",
    achievements: [
      "11 CTEs orchestrées en pipeline d'analyse",
      "Window functions : RANK, LAG, NTILE pour cohortes",
      "Dashboard Looker Studio avec 8 KPIs business",
      "Recommandations stratégiques pitchées au sponsor",
    ],
    stack: ["SQL", "BigQuery", "Looker Studio", "Pandas"],
    liveUrl: undefined,
    repoUrl: undefined,
  },
];

/** OpenClaw — fixed star in the 3D universe, not a planet. */
export const starProject = {
  slug: "openclaw",
  title: "OpenClaw",
  pitch: placeholder("openclaw.pitch"),
  stack: ["Claude", "Anthropic SDK", "Node", "[À FOURNIR — stack]"],
  achievements: [
    placeholder("openclaw.achievement.1"),
    placeholder("openclaw.achievement.2"),
    placeholder("openclaw.achievement.3"),
  ],
  repoUrl: placeholder("openclaw.cpp.repo"),
};

export const softSkills: SoftSkill[] = [
  {
    slug: "creativite",
    label: "Créativité",
    quote: "quand le code rencontre l'intuition",
    linkedProjectSlugs: ["levels", "music-agency", "thelook"],
  },
  {
    slug: "adaptabilite",
    label: "Adaptabilité",
    quote: "d'un univers à l'autre, sans perdre le fil",
    linkedProjectSlugs: ["mirakl", "energizer", "thelook"],
  },
  {
    slug: "travailleur",
    label: "Travailleur",
    quote: "la rigueur comme matière première",
    linkedProjectSlugs: ["energizer", "levels"],
  },
  {
    slug: "sociabilite",
    label: "Sociabilité",
    quote: "comprendre l'humain avant l'outil",
    linkedProjectSlugs: ["music-agency", "mirakl"],
  },
];

export const hobbies: Hobby[] = [
  { label: "Musique", detail: "guitare, composition" },
  { label: "Théâtre" },
  { label: "Échecs", detail: "élo 1600" },
  { label: "Jujitsu brésilien" },
  { label: "Poésie" },
  { label: "Séries" },
  { label: "Mindset" },
];

export const stack: StackTool[] = [
  { label: "Python", category: "lang" },
  { label: "SQL", category: "lang" },
  { label: "JavaScript", category: "lang" },
  { label: "TypeScript", category: "lang" },
  { label: "Power BI", category: "data" },
  { label: "Tableau", category: "data" },
  { label: "Airtable", category: "data" },
  { label: "Supabase", category: "cloud" },
  { label: "Firebase", category: "cloud" },
  { label: "Vercel", category: "cloud" },
  { label: "Railway", category: "cloud" },
  { label: "Dust", category: "ai" },
  { label: "OpenAI", category: "ai" },
  { label: "Claude", category: "ai" },
  { label: "Anthropic SDK", category: "ai" },
  { label: "Notion", category: "other" },
  { label: "Slack", category: "other" },
];

export const profile: Profile = {
  name: "Aurian",
  tagline: "une nuit éditoriale, cinq planètes de papier, des fils de menthe.",
  email: placeholder("contact.email"),
  linkedin: placeholder("contact.linkedin"),
  github: placeholder("contact.github"),
  twitter: undefined,
  phone: "06 13 53 45 69",
  cvPdf: "/cv-aurian.pdf",
  cvCurrent: "VSOLUTION — automation, dev web, agents IA (avril 2026 → présent)",
  cvPrevious: placeholder("cv.previousRole"),
  formation: placeholder("cv.formation"),
  languages: [
    { label: "Français", level: "natif" },
    { label: "English", level: "C1 (TOEFL)" },
    { label: "Español", level: "B1" },
  ],
};

export const outroQuote = placeholder("outro.quote");
