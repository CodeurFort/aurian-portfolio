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

export interface SoftSkillBlock {
  theme: string;
  qualities: string[];
  context: string;
}

export interface ProjectQuality {
  label: string;
  context: string;
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
  manifesto: string;
  email: string;
  linkedin: string;
  github: string;
  twitter?: string;
  cvPdf: string;
  cvCurrent: string;
  cvPrevious: string;
  formation: string;
  languages: { label: string; level: string }[];
}

const placeholder = (key: string) => `[À FOURNIR : ${key}]`;

export const projects: Project[] = [
  {
    slug: "levels",
    chapter: "i",
    title: "Levels",
    paperColor: "paper-cream",
    role: "conception, dev, design solo",
    pitch:
      "application web de suivi d'objectifs quotidiens. l'utilisateur définit ses objectifs du jour, valide au fil de la journée, suit sa régularité dans le temps et consulte ses tendances dans des récaps hebdomadaires. PWA single-file, synchronisation temps réel multi-appareils.",
    achievements: [
      "architecture single-file (HTML, CSS, JS dans un index.html) : zéro build, déploiement instantané",
      "synchronisation Firestore temps réel multi-appareils avec session unique anti-conflit",
      "système de dates custom : grace period 0h, 2h pour préserver la régularité de l'utilisateur",
      "PWA installable sur mobile, fonctionne offline grâce au service worker",
    ],
    stack: ["HTML", "CSS", "JavaScript", "TypeScript", "Firebase", "Firestore", "Firebase Auth", "PWA"],
    liveUrl: "https://levels-app-f50a9.web.app",
  },
  {
    slug: "energizer",
    chapter: "ii",
    title: "Energizer SEO GEO AEO",
    paperColor: "paper-mint",
    pitch:
      "agent IA en cinq étapes : stratégie, veille, concurrence, critique, scoring. il diagnostique la présence d'une marque sur les moteurs traditionnels et génératifs. multi-tenant : chaque entreprise est un contexte injecté dans l'agent, avec son propre crawler maison et sa pipeline Blog Redactor v2 qui s'auto-révise tant que le score cible sur 100 (SEO, GEO, E-E-A-T, pertinence) n'est pas atteint.",
    role: "conception, architecture, dev solo",
    achievements: [
      "pipeline 5 étapes diagnostic + Blog Redactor avec auto-révision",
      "architecture multi-tenant (entreprise = contexte agent)",
      "crawler maison BeautifulSoup, diagnostic 3 piliers SEO, GEO, E-E-A-T",
    ],
    stack: ["Python", "FastAPI", "Next.js 16", "Tailwind v4", "Supabase", "OpenAI", "Claude", "Anthropic SDK", "OpenClaw", "DALL-E 3", "Vercel", "Railway"],
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
    stack: ["Hubspot", "Make", "Power Automate", "Power BI"],
  },
  {
    slug: "music-agency",
    chapter: "iv",
    title: "Music Agency 5 Dust",
    paperColor: "paper-blush",
    pitch: placeholder("music.pitch"),
    achievements: [
      placeholder("music.achievement.1"),
      placeholder("music.achievement.2"),
      placeholder("music.achievement.3"),
    ],
    stack: ["Dust", "Zapier", "n8n", "Notion"],
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
      "window functions : RANK, LAG, NTILE pour cohortes",
      "dashboard Looker Studio avec 8 KPIs business",
      "recommandations stratégiques pitchées au sponsor",
    ],
    stack: ["SQL", "BigQuery", "Looker Studio", "Pandas"],
  },
];

export const projectQualities: Record<string, ProjectQuality> = {
  levels: {
    label: "Autonomie",
    context:
      "Construit seul, du concept à la mise en ligne. Design, dev, déploiement, itérations. Personne pour valider à ma place : il fallait trancher.",
  },
  energizer: {
    label: "Esprit analytique",
    context:
      "Découper un problème flou (visibilité d'une marque sur tous les moteurs) en pipeline mesurable, scoré, auto-correcteur. Raisonner par couches.",
  },
  mirakl: {
    label: "Sens stratégique",
    context:
      "Identifier le bon angle d'attaque, prioriser les leads, restituer une recommandation que le sponsor peut activer la semaine d'après.",
  },
  "music-agency": {
    label: "Adaptabilité",
    context:
      "Industrie musicale, codes culturels spécifiques. Traduire l'instinct artistique d'un label en process et en outils sans tuer la magie.",
  },
  thelook: {
    label: "Rigueur",
    context:
      "11 CTEs imbriquées, window functions, vérification croisée des KPIs avant restitution. Un chiffre faux et toute la reco s'effondre.",
  },
};

export const softSkillBlocks: SoftSkillBlock[] = [
  {
    theme: "communication & synthèse",
    qualities: [
      "capacités rédactionnelles",
      "écoute active",
      "qualités relationnelles",
    ],
    context:
      "écouter, synthétiser, transmettre. la matière brute devient un récit lisible pour le métier.",
  },
  {
    theme: "initiative & autonomie",
    qualities: [
      "force de proposition",
      "autonomie",
      "rigueur",
    ],
    context:
      "identifier les manques, proposer une direction, exécuter sans supervision permanente.",
  },
  {
    theme: "collaboration",
    qualities: [
      "travail en équipe",
      "adaptabilité",
      "curiosité métier",
    ],
    context:
      "construire avec d'autres. les meilleures idées naissent rarement seul devant un écran.",
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
  { label: "TypeScript", category: "lang" },
  { label: "JavaScript", category: "lang" },
  { label: "Power BI", category: "data" },
  { label: "Looker Studio", category: "data" },
  { label: "Google Analytics", category: "data" },
  { label: "BigQuery", category: "data" },
  { label: "Dataiku", category: "data" },
  { label: "Hubspot", category: "data" },
  { label: "Supabase", category: "cloud" },
  { label: "Firebase", category: "cloud" },
  { label: "Vercel", category: "cloud" },
  { label: "Railway", category: "cloud" },
  { label: "Dust", category: "ai" },
  { label: "OpenAI", category: "ai" },
  { label: "Claude", category: "ai" },
  { label: "Anthropic SDK", category: "ai" },
  { label: "OpenClaw", category: "ai" },
  { label: "Make", category: "other" },
  { label: "n8n", category: "other" },
  { label: "Zapier", category: "other" },
  { label: "Power Automate", category: "other" },
  { label: "Notion", category: "other" },
];

export const profile: Profile = {
  name: "Moi",
  tagline:
    "automatisation, agents IA, data, stratégie digitale. transformer une idée en workflow concret.",
  manifesto:
    "étudiant en MSc AI Applied to Business. j'aime construire des outils qui mêlent IA, data et exécution opérationnelle : prototyper vite, mesurer, itérer. ce portfolio est un univers, pas une grille. naviguez à votre rythme.",
  email: "aurianreal@gmail.com",
  linkedin: "https://www.linkedin.com/in/aurian-bingangoye",
  github: "https://github.com/CodeurFort",
  twitter: undefined,
  cvPdf: "/cv-aurian.pdf",
  cvCurrent:
    "VSOLUTION : alternant Automatisation, Agents IA & Performance Digitale (2026, en cours). création d'Energizer, approfondissement d'OpenClaw, prototypage d'automatisations.",
  cvPrevious:
    "Le Chalet Studio : bras droit Marketing & Data Analyst, été 2024 (+22% de clics, +10% d'abonnés en 2 mois). Odillon SARL : consultant depuis 2021, RH d'une équipe de 5, création de Chronodil.",
  formation:
    "MSc AI Applied to Business, Eugenia School (2026, en cours). Licence AES, Paris 1 Panthéon-Sorbonne (2025). Bac mention bien (Math, SES), Lycée français Blaise Pascal du Gabon (2021). Certifications : TOEFL, PIX.",
  languages: [
    { label: "Français", level: "natif" },
    { label: "English", level: "C1 (TOEFL)" },
    { label: "Español", level: "B1" },
  ],
};

export const outroQuote = placeholder("outro.quote");
