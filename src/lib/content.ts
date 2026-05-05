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
  cvPdf: string;
  cvCurrent: string;
  cvPrevious: string;
  formation: string;
  languages: { code: string; level: string }[];
}

const placeholder = (key: string) => `[À FOURNIR — ${key}]`;

export const projects: Project[] = [
  {
    slug: "levels",
    chapter: "01",
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
    chapter: "02",
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
    chapter: "03",
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
    chapter: "04",
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
    slug: "openclaw",
    chapter: "05",
    title: "Openclaw",
    paperColor: "paper-stone",
    pitch: placeholder("openclaw.pitch"),
    achievements: [
      placeholder("openclaw.achievement.1"),
      placeholder("openclaw.achievement.2"),
      placeholder("openclaw.achievement.3"),
    ],
    stack: ["Claude", "Anthropic SDK", "Node", "[À FOURNIR — stack]"],
    repoUrl: placeholder("openclaw.cpp.repo"),
    moons: [
      {
        name: "Webdev",
        pitch: placeholder("openclaw.moon.webdev"),
        bullets: [placeholder("moon.webdev.case.1"), placeholder("moon.webdev.case.2")],
        stack: ["Next.js", "[À FOURNIR]"],
      },
      {
        name: "Vidéo",
        pitch: placeholder("openclaw.moon.video"),
        bullets: [placeholder("moon.video.case.1"), placeholder("moon.video.case.2")],
        stack: ["[À FOURNIR]"],
      },
      {
        name: "Assistance",
        pitch: placeholder("openclaw.moon.assist"),
        bullets: [placeholder("moon.assist.case.1"), placeholder("moon.assist.case.2")],
        stack: ["Dust", "[À FOURNIR]"],
      },
    ],
  },
];

export const softSkills: SoftSkill[] = [
  {
    slug: "creativite",
    label: "Créativité",
    quote: "quand le code rencontre l'intuition",
    linkedProjectSlugs: ["levels", "music-agency", "openclaw"],
  },
  {
    slug: "adaptabilite",
    label: "Adaptabilité",
    quote: "d'un univers à l'autre, sans perdre le fil",
    linkedProjectSlugs: ["mirakl", "energizer", "openclaw"],
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
    linkedProjectSlugs: ["music-agency", "openclaw"],
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
  cvPdf: "/cv-aurian.pdf",
  cvCurrent: "VSOLUTION — automation, dev web, agents IA (avril 2026 → présent)",
  cvPrevious: placeholder("cv.previousRole"),
  formation: placeholder("cv.formation"),
  languages: [
    { code: "FR", level: "natif" },
    { code: "EN", level: "C1 (TOEFL)" },
    { code: "ES", level: "B1" },
  ],
};

export const outroQuote = placeholder("outro.quote");
