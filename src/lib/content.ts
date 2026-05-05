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
  label: string; // legacy fallback (e.g. dominant theme)
  qualities: [string, string]; // 2 qualités associées par planète
  phrase: string; // phrase courte qui associe les deux
  context: string; // contexte plus long
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
    role: "lead dev, scoring engine, design",
    pitch:
      "outil BDR conçu pour le hackathon Mirakl x Eugenia School 2026. il qualifie les marques e-commerce contre 7 profils de marketplaces, enrichit les contacts décisionnaires (LinkedIn + email) et génère des séquences d'outreach personnalisées par GPT-4o. de la prospection brute au mail envoyé en un seul flux.",
    achievements: [
      "scoring engine 6 critères (catégorie, géo, prix, customer, saisonnalité, signaux marketplace) en TypeScript pur, scoring continu pondéré sur 100, exécuté côté serveur ET côté client (re-scoring temps réel sur filtre)",
      "pipeline d'enrichissement hybride : Better Contact API en priorité, fallback Apify Google Search + DNS/SMTP probe pour les sellers hors radar (354/409 hits sur le crawl Python)",
      "génération d'emails GPT-4o avec 5 prompts distincts, envoi via nodemailer/Google Workspace SMTP, persistance Supabase (Postgres). déployé sur Vercel.",
    ],
    stack: ["Next.js 16", "React 19", "TypeScript", "Zustand", "Tailwind v4", "Recharts", "OpenAI GPT-4o", "Supabase", "Vercel", "Apify", "Better Contact"],
    liveUrl: "https://mirakl-prospector.vercel.app",
    repoUrl: "https://github.com/CodeurFort/mirakl-prospector",
  },
  {
    slug: "music-agency",
    chapter: "iv",
    title: "BEYOND",
    paperColor: "paper-blush",
    role: "conception du système, design des agents",
    pitch:
      "système multi-agent pour accompagner des artistes émergents. cinq agents coordonnés — un chef d'orchestre, un cerveau (A&R), des yeux (data), une voix (community), du terrain (networking) — qui transforment l'instinct artistique en stratégie exécutable, sans tuer la magie.",
    achievements: [
      "architecture 5 rôles distincts orchestrés : Orchestrator pilote, A&R Strategist écrit le brief, Growth Analyst nourrit en data, Content & Community amplifie, Networker active le terrain",
      "système de phase (LANCEMENT / CROISSANCE / CONSOLIDATION) qui cadre les benchmarks et le ton à chaque étape — le bon message au bon stade de carrière",
      "logique anti-vanity-metrics : on lit les signaux faibles (« 423 auditeurs, 12% save rate = top 10% émergents ») plutôt que les volumes bruts. Quick Wins puis Long Game.",
    ],
    stack: ["Dust", "Zapier", "n8n", "Notion"],
    moons: [
      {
        name: "Orchestrator",
        pitch: "le chef d'orchestre — coordonne les 4 autres",
        bullets: [
          "définit les priorités et la séquence d'actions",
          "ne produit rien seul, fait produire les autres",
        ],
        stack: ["Dust"],
      },
      {
        name: "A&R Strategist",
        pitch: "le cerveau — positionnement et brief stratégique",
        bullets: [
          "identifie l'angle différenciant, fixe la phase (lancement / croissance / consolidation)",
          "produit le brief qui déclenche tout le reste",
        ],
        stack: ["Dust", "Notion"],
      },
      {
        name: "Growth Analyst",
        pitch: "les yeux — data, benchmarks, signaux faibles",
        bullets: [
          "transforme la data en décisions concrètes",
          "distingue le vrai impact des vanity metrics",
        ],
        stack: ["Dust", "n8n"],
      },
      {
        name: "Content & Community",
        pitch: "la voix — contenu, communauté, superfans",
        bullets: [
          "transforme le brief A&R en posts, Reels, captions, calendrier",
          "amplificateur final des victoires de l'équipe",
        ],
        stack: ["Dust", "Zapier"],
      },
      {
        name: "Networker",
        pitch: "le terrain — playlists, presse, bookers, syncs",
        bullets: [
          "messages humains personnalisés, jamais de templates",
          "Quick Wins d'abord, Long Game ensuite",
        ],
        stack: ["Dust", "Notion"],
      },
    ],
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
    label: "Autonomie × Pragmatisme",
    qualities: ["Autonomie", "Pragmatisme"],
    phrase:
      "Trancher seul, livrer simple. L'autonomie sans pragmatisme tourne en rond ; le pragmatisme sans autonomie attend les ordres.",
    context:
      "Levels est un single-file HTML : zéro build, déploiement instantané, parce qu'il fallait avancer vite et seul. Décider quoi couper avant que ça ralentisse.",
  },
  energizer: {
    label: "Esprit analytique × Force de proposition",
    qualities: ["Esprit analytique", "Force de proposition"],
    phrase:
      "Décomposer le flou, défendre un angle. Analyser sans proposer reste académique ; proposer sans analyser reste opinion.",
    context:
      "Diagnostiquer la visibilité d'une marque sur des moteurs génératifs n'existait pas comme produit. J'ai dû découper le problème en pipeline scoré, puis pitcher l'angle.",
  },
  mirakl: {
    label: "Sens stratégique × Travail en équipe",
    qualities: ["Sens stratégique", "Travail en équipe"],
    phrase:
      "Lire le terrain, construire à plusieurs. La stratégie seule reste un PDF ; l'équipe sans cap construit beaucoup, livre peu.",
    context:
      "Hackathon Mirakl x Eugenia, 48h, équipe pluridisciplinaire. Identifier le bon angle BDR puis répartir les pièces du moteur de scoring entre dev, sales, design.",
  },
  "music-agency": {
    label: "Adaptabilité × Curiosité métier",
    qualities: ["Adaptabilité", "Curiosité métier"],
    phrase:
      "Apprendre la langue avant de proposer l'outil. L'adaptabilité sans curiosité reste polie ; la curiosité sans adaptabilité reste touriste.",
    context:
      "Industrie musicale, codes culturels spécifiques. Avant d'automatiser quoi que ce soit, écouter comment un label parle de ses artistes.",
  },
  thelook: {
    label: "Rigueur × Communication",
    qualities: ["Rigueur", "Communication"],
    phrase:
      "Vérifier deux fois, restituer clair. Un chiffre faux et toute la reco s'effondre ; une reco illisible et personne ne l'active.",
    context:
      "11 CTEs imbriquées, window functions, vérification croisée des KPIs. Puis transformer l'analyse en récit que le sponsor peut décider la semaine d'après.",
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
  { label: "Musique", detail: "composition, FL Studio" },
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
