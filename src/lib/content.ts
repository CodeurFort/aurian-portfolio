import { thelookQuery } from "./thelookQuery";

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

export type ProjectStatus = "ongoing" | "done";

export interface Project {
  slug: string;
  chapter: string;
  title: string;
  subtitle?: string; // e.g. "(Discipline RPG)"
  paperColor: PaperColor;
  pitch: string;
  role?: string;
  achievements: string[];
  stack: string[];
  liveUrl?: string;
  repoUrl?: string;
  pdfUrl?: string; // downloadable artefact (architecture doc, schema, etc.)
  visuals?: string[]; // image paths (relative to /public)
  status?: ProjectStatus;
  moons?: Moon[];
  sqlQuery?: string; // optional code snippet (used for thelook)
}

export interface SoftSkillBlock {
  theme: string;
  qualities: string[];
  context: string;
  level: number; // 0–100, displayed as a mastery bar
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

export interface Certification {
  slug: string;
  title: string;
  level?: string; // e.g. "Indépendant 1", "Mention Bien", "C1"
  score?: string; // e.g. "369 / 895", "14.32 / 20"
  date: string; // free-form: "04/07/2025", "2021", "à venir"
  issuer: string; // institution that delivered it
  pdfUrl?: string; // downloadable artefact
  logoUrl?: string; // institution logo (svg or png)
  pending?: boolean; // true = diplôme à venir
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
    subtitle: "(Discipline RPG)",
    paperColor: "paper-cream",
    role: "conception, dev, design solo",
    status: "ongoing",
    visuals: ["/visuals/levels-vision.png", "/visuals/levels-radar.png", "/visuals/levels-progression.png", "/visuals/levels-daily.png"],
    pitch:
      "La discipline se joue dans LEVELS : deviens le héros de ta propre histoire. Un vrai jeu par-dessus le quotidien : 5 objectifs par jour, XP, séries et pénalités, planification multi-horizons (semaine, mois, année, vie), 6 mentors IA aux personas travaillées et leurs programmes guidés, duels 1v1 à preuves photo jugées par un jury, base à bâtir avec son économie interne, assistant vocal. PWA vanilla synchronisée temps réel multi-appareils, bilingue FR/EN.",
    achievements: [
      "Boucle de jeu complète : XP, séries, pénalités, succès, prestige, économie de base-building (7 pièces, 3 monnaies étanches) : la discipline devient un RPG.",
      "6 mentors IA (personas expertes, anti-hallucination ancrée sur les données réelles du joueur) + 6 programmes guidés : 105 leçons écrites main.",
      "Multijoueur vérifié : duels et coop à preuves photo jugées par un jury anonyme ; l'Influence, score calculé côté serveur, sépare le déclaré du prouvé.",
      "Backend : 60+ Cloud Functions (quotas transactionnels, crons, push FCM, mails), sync Firestore temps réel avec verrous anti-conflit et anti-rollback.",
      "Assistant vocal (SpeechRecognition + TTS) : dicter ses objectifs, naviguer, interroger un manuel canonique anti-hallucination.",
      "Bilingue FR/EN : le français est la source, un pipeline maison génère le bundle anglais au build (mémoire de traduction, build refusé si un segment manque).",
    ],
    stack: ["HTML", "CSS", "JavaScript", "Firebase", "Firestore", "Cloud Functions", "Firebase Auth", "FCM", "OpenRouter", "PWA"],
    liveUrl: "https://lesommet.app",
  },
  {
    slug: "energizer",
    chapter: "ii",
    title: "Energizer",
    subtitle: "(SEO, GEO, AEO)",
    paperColor: "paper-mint",
    status: "ongoing",
    pitch:
      "Application web qui aide les entreprises à briller dans les moteurs traditionnels et génératifs. Energizer audite le site, définit un plan d'actions, et propose comme feature phare la création de blogs personnalisés : rédaction alimentée par les meilleurs mots-clés issus d'un scrapping dense et du scoring du diagnostic. Architecture multi-tenant, agent IA orchestré en cinq étapes (stratégie, veille, concurrence, critique, scoring), pipeline Blog Redactor v2 qui s'auto-révise tant que le score cible sur 100 (SEO, GEO, E-E-A-T, pertinence) n'est pas atteint.",
    role: "conception, architecture, dev solo",
    visuals: [
      "/visuals/energizer-saas-1.png",
      "/visuals/energizer-saas-2.png",
      "/visuals/energizer-saas-3.png",
      "/visuals/energizer-saas-4.png",
      "/visuals/energizer-pipeline.svg",
    ],
    achievements: [
      "Pipeline 5 étapes diagnostic + Blog Redactor avec auto-révision.",
      "Architecture multi-tenant (entreprise = contexte agent).",
      "Crawler maison BeautifulSoup, diagnostic 3 piliers SEO, GEO, E-E-A-T.",
    ],
    stack: ["Python", "FastAPI", "Next.js 16", "Tailwind v4", "Supabase", "OpenAI", "Claude", "Anthropic SDK", "OpenClaw", "DALL-E 3", "Vercel", "Railway"],
  },
  {
    slug: "mirakl",
    chapter: "iii",
    title: "Mirakl Prospector",
    paperColor: "paper-ochre",
    role: "lead dev, scoring engine, design",
    status: "done",
    visuals: ["/visuals/mirakl-scoring.svg", "/visuals/mirakl-pitch-2.jpg", "/visuals/mirakl-pitch-3.jpg", "/visuals/mirakl-pitch-1.jpg"],
    pitch:
      "Application BDR conçue pour le hackathon Mirakl x Eugenia School 2026 (finaliste). Elle identifie des sellers adaptés à une marketplace : depuis la base Mirakl (Supabase, alimentée chaque semaine par un scrapping automatisé) ou en ciblant des sellers selon des critères pondérés (catégorie, géo, prix, customer, saisonnalité, signaux marketplace). On peut aussi entrer un nom de seller : le scrapping se fait alors en direct, puis le matching avec une marketplace présente. Ensuite, l'app rédige une séquence d'outreach BDR personnalisable selon la stratégie commerciale et les événements, regénérable au prompt, enrichie par Better Contact (Apify en fallback) et envoyée via SMTP.",
    achievements: [
      "Scoring engine 6 critères (catégorie, géo, prix, customer, saisonnalité, signaux marketplace) en TypeScript pur, scoring continu pondéré sur 100, exécuté côté serveur ET côté client (re-scoring temps réel sur filtre).",
      "Pipeline d'enrichissement hybride : Better Contact API en priorité, fallback Apify Google Search + DNS/SMTP probe pour les sellers hors radar (354/409 hits sur le crawl Python).",
      "Génération d'emails GPT-4o avec 5 prompts distincts, envoi via nodemailer / Google Workspace SMTP, persistance Supabase (Postgres). Déployé sur Vercel.",
    ],
    stack: ["Next.js 16", "React 19", "TypeScript", "Zustand", "Tailwind v4", "Recharts", "OpenAI GPT-4o", "Supabase", "Vercel", "Apify", "Better Contact"],
    liveUrl: "https://mirakl-prospector.vercel.app",
    repoUrl: "https://github.com/CodeurFort/mirakl-prospector",
  },
  {
    slug: "music-agency",
    chapter: "iv",
    title: "Beyond",
    subtitle: "(Multi-Agent Music System)",
    paperColor: "paper-blush",
    role: "conception du système, design des agents",
    status: "done",
    pdfUrl: "/visuals/beyond-architecture.pdf",
    pitch:
      "Système multi-agent pour accompagner des artistes émergents. Cinq agents coordonnés (un chef d'orchestre, un cerveau A&R, des yeux data, une voix community, du terrain networking) qui transforment l'instinct artistique en stratégie exécutable, sans tuer la magie.",
    achievements: [
      "Architecture 5 rôles distincts orchestrés : Orchestrator pilote, A&R Strategist écrit le brief, Growth Analyst nourrit en data, Content & Community amplifie, Networker active le terrain.",
      "Système de phase (LANCEMENT / CROISSANCE / CONSOLIDATION) qui cadre les benchmarks et le ton à chaque étape : le bon message au bon stade de carrière.",
      "Logique anti-vanity-metrics : on lit les signaux faibles (« 423 auditeurs, 12% save rate = top 10% émergents ») plutôt que les volumes bruts. Quick Wins puis Long Game.",
    ],
    stack: ["Dust"],
    moons: [
      {
        name: "Orchestrator",
        pitch: "Le chef d'orchestre. Coordonne les 4 autres.",
        bullets: [
          "Définit les priorités et la séquence d'actions.",
          "Ne produit rien seul, fait produire les autres.",
        ],
        stack: ["Dust"],
      },
      {
        name: "A&R Strategist",
        pitch: "Le cerveau. Positionnement et brief stratégique.",
        bullets: [
          "Identifie l'angle différenciant, fixe la phase (lancement / croissance / consolidation).",
          "Produit le brief qui déclenche tout le reste.",
        ],
        stack: ["Dust"],
      },
      {
        name: "Growth Analyst",
        pitch: "Les yeux. Data, benchmarks, signaux faibles.",
        bullets: [
          "Transforme la data en décisions concrètes.",
          "Distingue le vrai impact des vanity metrics.",
        ],
        stack: ["Dust"],
      },
      {
        name: "Content & Community",
        pitch: "La voix. Contenu, communauté, superfans.",
        bullets: [
          "Transforme le brief A&R en posts, Reels, captions, calendrier.",
          "Amplificateur final des victoires de l'équipe.",
        ],
        stack: ["Dust"],
      },
      {
        name: "Networker",
        pitch: "Le terrain. Playlists, presse, bookers, syncs.",
        bullets: [
          "Messages humains personnalisés, jamais de templates.",
          "Quick Wins d'abord, Long Game ensuite.",
        ],
        stack: ["Dust"],
      },
    ],
  },
  {
    slug: "thelook",
    chapter: "v",
    title: "TheLook Analytics",
    paperColor: "paper-stone",
    role: "audit SQL avancé",
    status: "done",
    visuals: ["/visuals/thelook-pipeline.svg"],
    repoUrl: "https://github.com/CodeurFort/audit-_de_performance_e-commerce_-the_look-",
    pitch:
      "Audit Fashion Hoodies & Sweatshirts sur TheLook eCommerce (BigQuery public). 12 CTEs enchaînées, window functions LAG et ROW_NUMBER, KPIs business par mois : CA, marge, panier moyen, croissance, rotation stock, top canal, taux de rebond et de conversion, top région.",
    achievements: [
      "12 CTEs orchestrées en pipeline d'analyse mensuelle.",
      "Window functions : LAG pour la croissance mois sur mois, ROW_NUMBER pour isoler le canal et la région dominants.",
      "Ratio rotation stock (vendus / stock fin de mois) pour détecter rupture vs surstock.",
      "Taux de rebond et taux de conversion calculés en LEFT JOIN sessions / orders.",
      "Période paramétrable via DECLARE date_debut / date_fin.",
    ],
    stack: ["SQL", "BigQuery", "Looker Studio", "Tableau Desktop", "Pandas"],
    sqlQuery: thelookQuery,
  },
];

export const projectQualities: Record<string, ProjectQuality> = {
  levels: {
    label: "Autonomie × Pragmatisme",
    qualities: ["Autonomie", "Pragmatisme"],
    phrase: "Trancher seul, viser l'usage.",
    context:
      "Levels est devenu un jeu complet : mentors IA, multijoueur à preuves, économie interne, version anglaise générée au build. Le tout construit en solo sur une base volontairement minimale (client vanilla zéro build, 60+ Cloud Functions derrière) : choisir les bons compromis pour livrer un vrai produit, sans tomber dans l'over-engineering.",
  },
  energizer: {
    label: "Analyse × Initiative",
    qualities: ["Esprit analytique", "Force de proposition"],
    phrase: "Décomposer le flou, défendre un angle.",
    context:
      "Diagnostiquer une marque sur les moteurs génératifs n'existait pas. J'ai découpé le sujet en pipeline scoré, puis défendu l'approche.",
  },
  mirakl: {
    label: "Stratégie × Équipe",
    qualities: ["Sens stratégique", "Travail en équipe"],
    phrase: "Lire le marché, construire à plusieurs.",
    context:
      "Hackathon Mirakl x Eugenia, 5 jours, équipe pluridisciplinaire. Choisir le bon angle BDR puis répartir le moteur de scoring entre dev, sales et design.",
  },
  "music-agency": {
    label: "Adaptation × Curiosité",
    qualities: ["Adaptabilité", "Curiosité métier"],
    phrase: "Comprendre le métier avant de l'outiller.",
    context:
      "Industrie musicale, codes culturels propres. Écouter comment un label parle de ses artistes avant d'automatiser quoi que ce soit.",
  },
  thelook: {
    label: "Rigueur × Restitution",
    qualities: ["Rigueur", "Communication"],
    phrase: "Calcul juste, récit lisible.",
    context:
      "12 CTEs, window functions, vérification croisée. Puis transformer l'analyse en histoire que le sponsor peut activer.",
  },
};

export const softSkillBlocks: SoftSkillBlock[] = [
  {
    theme: "Communication & synthèse",
    qualities: [
      "Capacités rédactionnelles",
      "Écoute active",
      "Aisance verbale",
      "Prise de parole",
      "Qualités relationnelles",
    ],
    context:
      "Écouter, synthétiser, transmettre. La matière brute devient un récit lisible pour le métier.",
    level: 88,
  },
  {
    theme: "Initiative & autonomie",
    qualities: [
      "Force de proposition",
      "Autonomie",
      "Confort en environnement incertain",
      "Rigueur",
    ],
    context:
      "Identifier les manques, proposer une direction, exécuter sans supervision permanente.",
    level: 82,
  },
  {
    theme: "Collaboration",
    qualities: [
      "Travail en équipe",
      "Adaptabilité",
      "Curiosité métier",
    ],
    context:
      "Construire avec d'autres. La qualité d'une livraison se joue autant dans l'échange que dans le code.",
    level: 86,
  },
  {
    theme: "Posture & sang-froid",
    qualities: [
      "Calme sous pression",
      "Recul",
      "Esprit d'équipe",
      "Sens de l'humain",
    ],
    context:
      "Garder son calme dans les moments tendus, rester clair sous contrainte, préserver une dynamique d'équipe saine.",
    level: 78,
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
  { label: "Tableau Desktop", category: "data" },
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

// Self-assessed mastery per stack category (0–100). Drives the digest bars
// rendered in the global Stack overlay (legend → Stack star).
export const stackCategoryLevels: Record<StackTool["category"], number> = {
  lang: 78,
  data: 86,
  cloud: 68,
  ai: 84,
  other: 74,
};

export const profile: Profile = {
  name: "Moi",
  tagline:
    "Automatisation, agents IA, data, stratégie digitale. Transformer une idée en workflow concret.",
  manifesto:
    "Étudiant en MSc AI Applied to Business. J'aime construire des outils qui mêlent IA, data et exécution opérationnelle : prototyper vite, mesurer, itérer. Ce portfolio est un univers, pas une grille. Navigue à ton rythme.",
  email: "aurianreal@gmail.com",
  linkedin: "https://www.linkedin.com/in/aurian-bingangoye",
  github: "https://github.com/CodeurFort",
  twitter: undefined,
  cvPdf: "/cv-aurian.pdf",
  cvCurrent:
    "VSOLUTION, ingénierie assistée par ordinateur : alternant Automatisation, Agents IA & Performance Digitale (2026, en cours). Création d'Energizer, développement du site web de VSolution, approfondissement d'OpenClaw, prototypage d'automatisations.",
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

export const certifications: Certification[] = [
  {
    slug: "pix",
    title: "PIX",
    level: "Indépendant 1",
    score: "369 / 895",
    date: "04/07/2025",
    issuer: "Université Paris 1 Panthéon-Sorbonne",
    pdfUrl: "/visuals/certifications/pix-2025.pdf",
    logoUrl: "/visuals/certifications/logos/pix.svg",
  },
  {
    slug: "licence-aes",
    title: "Licence AES",
    date: "2025",
    issuer: "Paris 1 Panthéon-Sorbonne",
    pending: true,
    logoUrl: "/visuals/certifications/logos/paris1.svg",
  },
  {
    slug: "bac",
    title: "Baccalauréat général",
    level: "Mention Bien",
    date: "2021",
    issuer: "Lycée français Blaise Pascal, Libreville",
    logoUrl: "/visuals/certifications/logos/blaise-pascal.png",
  },
  {
    slug: "toefl",
    title: "TOEFL",
    level: "C1",
    date: "—",
    issuer: "ETS",
    logoUrl: "/visuals/certifications/logos/toefl.svg",
  },
];

export const outroQuote = placeholder("outro.quote");

// ---------------------------------------------------------------------------
// English version of all content (parallel exports). The components select FR
// or EN at runtime via the useContent() hook in src/lib/i18n-content.ts.
// ---------------------------------------------------------------------------

export const projectsEn: Project[] = [
  {
    slug: "levels",
    chapter: "i",
    title: "Levels",
    subtitle: "(Discipline RPG)",
    paperColor: "paper-cream",
    role: "concept, dev, design (solo)",
    status: "ongoing",
    visuals: ["/visuals/levels-vision.png", "/visuals/levels-radar.png", "/visuals/levels-progression.png", "/visuals/levels-daily.png"],
    pitch:
      "Discipline plays out in LEVELS: become the hero of your own story. A full game layered over daily life: 5 goals a day, XP, streaks and penalties, multi-horizon planning (week, month, year, life), 6 AI mentors with crafted personas and their guided programs, 1v1 duels with photo proofs judged by a jury, a homestead to build with its own economy, a voice assistant. Vanilla PWA with real-time multi-device sync, fully bilingual FR/EN.",
    achievements: [
      "Complete game loop: XP, streaks, penalties, achievements, prestige, base-building economy (7 rooms, 3 sealed currencies): discipline becomes an RPG.",
      "6 AI mentors (expert personas, anti-hallucination grounded in the player's real data) + 6 guided programs: 105 hand-written lessons.",
      "Verified multiplayer: duels and co-op with photo proofs judged by an anonymous jury; Influence, a server-computed score, splits the declared from the proven.",
      "Backend: 60+ Cloud Functions (transactional quotas, crons, FCM push, emails), real-time Firestore sync with anti-conflict and anti-rollback locks.",
      "Voice assistant (SpeechRecognition + TTS): dictate goals, navigate, query a canonical anti-hallucination manual.",
      "Bilingual FR/EN: French is the source; a custom pipeline generates the English bundle at build time (translation memory, build refused when a segment is missing).",
    ],
    stack: ["HTML", "CSS", "JavaScript", "Firebase", "Firestore", "Cloud Functions", "Firebase Auth", "FCM", "OpenRouter", "PWA"],
    liveUrl: "https://lesommet.app",
  },
  {
    slug: "energizer",
    chapter: "ii",
    title: "Energizer",
    subtitle: "(SEO, GEO, AEO)",
    paperColor: "paper-mint",
    status: "ongoing",
    pitch:
      "Web app helping companies shine in both traditional and generative search engines. Energizer audits the site, builds an action plan, and offers as flagship feature personalized blog generation: copy fueled by the best keywords from a dense scrape and the diagnostic scoring. Multi-tenant architecture, AI agent orchestrated in five steps (strategy, watch, competition, critique, scoring), Blog Redactor v2 pipeline that self-revises until the target score (out of 100, on SEO, GEO, E-E-A-T and relevance) is reached.",
    role: "concept, architecture, dev (solo)",
    visuals: [
      "/visuals/energizer-saas-1.png",
      "/visuals/energizer-saas-2.png",
      "/visuals/energizer-saas-3.png",
      "/visuals/energizer-saas-4.png",
      "/visuals/energizer-pipeline.svg",
    ],
    achievements: [
      "5-step diagnostic pipeline + self-revising Blog Redactor.",
      "Multi-tenant architecture (company = agent context).",
      "Custom BeautifulSoup crawler, diagnostic on the 3 SEO/GEO/E-E-A-T pillars.",
    ],
    stack: ["Python", "FastAPI", "Next.js 16", "Tailwind v4", "Supabase", "OpenAI", "Claude", "Anthropic SDK", "OpenClaw", "DALL-E 3", "Vercel", "Railway"],
  },
  {
    slug: "mirakl",
    chapter: "iii",
    title: "Mirakl Prospector",
    paperColor: "paper-ochre",
    role: "lead dev, scoring engine, design",
    status: "done",
    visuals: ["/visuals/mirakl-scoring.svg", "/visuals/mirakl-pitch-2.jpg", "/visuals/mirakl-pitch-3.jpg", "/visuals/mirakl-pitch-1.jpg"],
    pitch:
      "BDR app built for the Mirakl x Eugenia School 2026 hackathon (finalist). It identifies sellers fit for a marketplace: from the Mirakl base (Supabase, fed weekly by an automated scrape) or by targeting sellers with weighted criteria (category, geo, price, customer, seasonality, marketplace signals). You can also enter a seller name: scraping is then done live, then matched with a relevant marketplace. Next, the app drafts a customizable BDR outreach sequence aligned with the commercial strategy and events, regeneratable by prompt, enriched via Better Contact (Apify fallback) and sent through SMTP.",
    achievements: [
      "Scoring engine on 6 criteria (category, geo, price, customer, seasonality, marketplace signals) in pure TypeScript, weighted continuous score on 100, run server-side AND client-side (real-time re-scoring on filter).",
      "Hybrid enrichment pipeline: Better Contact API first, Apify Google Search + DNS/SMTP probe fallback for off-radar sellers (354/409 hits on the Python crawl).",
      "GPT-4o email generation with 5 distinct prompts, sending via nodemailer / Google Workspace SMTP, Supabase (Postgres) persistence. Deployed on Vercel.",
    ],
    stack: ["Next.js 16", "React 19", "TypeScript", "Zustand", "Tailwind v4", "Recharts", "OpenAI GPT-4o", "Supabase", "Vercel", "Apify", "Better Contact"],
    liveUrl: "https://mirakl-prospector.vercel.app",
    repoUrl: "https://github.com/CodeurFort/mirakl-prospector",
  },
  {
    slug: "music-agency",
    chapter: "iv",
    title: "Beyond",
    subtitle: "(Multi-Agent Music System)",
    paperColor: "paper-blush",
    role: "system design, agent design",
    status: "done",
    pdfUrl: "/visuals/beyond-architecture.pdf",
    pitch:
      "Multi-agent system supporting emerging artists. Five coordinated agents (a conductor, an A&R brain, data eyes, a community voice, networking on the ground) that turn artistic instinct into executable strategy without killing the magic.",
    achievements: [
      "Architecture with 5 distinct orchestrated roles: Orchestrator drives, A&R Strategist writes the brief, Growth Analyst feeds data, Content & Community amplifies, Networker activates the field.",
      "Phase system (LAUNCH / GROWTH / CONSOLIDATION) framing benchmarks and tone at every step: the right message at the right career stage.",
      "Anti-vanity-metrics logic: read weak signals (\"423 listeners, 12% save rate = top 10% emerging\") instead of raw volumes. Quick Wins first, Long Game next.",
    ],
    stack: ["Dust"],
    moons: [
      {
        name: "Orchestrator",
        pitch: "The conductor. Coordinates the four others.",
        bullets: [
          "Sets priorities and the action sequence.",
          "Produces nothing alone, makes others produce.",
        ],
        stack: ["Dust"],
      },
      {
        name: "A&R Strategist",
        pitch: "The brain. Positioning and strategic brief.",
        bullets: [
          "Identifies the differentiating angle, sets the phase (launch / growth / consolidation).",
          "Produces the brief that triggers everything else.",
        ],
        stack: ["Dust"],
      },
      {
        name: "Growth Analyst",
        pitch: "The eyes. Data, benchmarks, weak signals.",
        bullets: [
          "Turns data into concrete decisions.",
          "Distinguishes real impact from vanity metrics.",
        ],
        stack: ["Dust"],
      },
      {
        name: "Content & Community",
        pitch: "The voice. Content, community, superfans.",
        bullets: [
          "Turns the A&R brief into posts, Reels, captions, calendar.",
          "Final amplifier of the team's wins.",
        ],
        stack: ["Dust"],
      },
      {
        name: "Networker",
        pitch: "The field. Playlists, press, bookers, syncs.",
        bullets: [
          "Personalized human messages, never templates.",
          "Quick Wins first, Long Game next.",
        ],
        stack: ["Dust"],
      },
    ],
  },
  {
    slug: "thelook",
    chapter: "v",
    title: "TheLook Analytics",
    paperColor: "paper-stone",
    role: "advanced SQL audit",
    status: "done",
    visuals: ["/visuals/thelook-pipeline.svg"],
    repoUrl: "https://github.com/CodeurFort/audit-_de_performance_e-commerce_-the_look-",
    pitch:
      "Fashion Hoodies & Sweatshirts audit on TheLook eCommerce (BigQuery public). 12 chained CTEs, LAG and ROW_NUMBER window functions, monthly business KPIs: revenue, margin, average basket, growth, stock rotation, top channel, bounce and conversion rates, top region.",
    achievements: [
      "12 CTEs orchestrated as a monthly analysis pipeline.",
      "Window functions: LAG for month-over-month growth, ROW_NUMBER to isolate the dominant channel and region.",
      "Stock rotation ratio (sold / end-of-month inventory) to detect stock-out vs overstock.",
      "Bounce and conversion rates computed via LEFT JOIN sessions / orders.",
      "Tunable period via DECLARE start_date / end_date.",
    ],
    stack: ["SQL", "BigQuery", "Looker Studio", "Tableau Desktop", "Pandas"],
    sqlQuery: thelookQuery,
  },
];

export const projectQualitiesEn: Record<string, ProjectQuality> = {
  levels: {
    label: "Autonomy × Pragmatism",
    qualities: ["Autonomy", "Pragmatism"],
    phrase: "Decide alone, aim for usage.",
    context:
      "Levels grew into a full game: AI mentors, proof-based multiplayer, an internal economy, an English version generated at build time. All built solo on a deliberately minimal base (zero-build vanilla client, 60+ Cloud Functions behind): picking the right trade-offs to ship a real product without over-engineering.",
  },
  energizer: {
    label: "Analysis × Initiative",
    qualities: ["Analytical mind", "Drive to propose"],
    phrase: "Break down the fog, defend an angle.",
    context:
      "Diagnosing a brand on generative engines did not exist. I sliced the topic into a scored pipeline, then defended the approach.",
  },
  mirakl: {
    label: "Strategy × Team",
    qualities: ["Strategic sense", "Teamwork"],
    phrase: "Read the market, build with others.",
    context:
      "Mirakl x Eugenia hackathon, 5 days, multidisciplinary team. Picking the right BDR angle then splitting the scoring engine across dev, sales and design.",
  },
  "music-agency": {
    label: "Adaptation × Curiosity",
    qualities: ["Adaptability", "Domain curiosity"],
    phrase: "Understand the craft before tooling it.",
    context:
      "Music industry, distinct cultural codes. Listening to how a label talks about its artists before automating anything.",
  },
  thelook: {
    label: "Rigor × Delivery",
    qualities: ["Rigor", "Communication"],
    phrase: "Right numbers, readable story.",
    context:
      "12 CTEs, window functions, cross-checking. Then turning the analysis into a story the sponsor can act on.",
  },
};

export const softSkillBlocksEn: SoftSkillBlock[] = [
  {
    theme: "Communication & synthesis",
    qualities: [
      "Writing skills",
      "Active listening",
      "Verbal fluency",
      "Public speaking",
      "Interpersonal skills",
    ],
    context:
      "Listen, synthesize, transmit. Raw material becomes a story the business can read.",
    level: 88,
  },
  {
    theme: "Initiative & autonomy",
    qualities: [
      "Drive to propose",
      "Autonomy",
      "Comfortable in uncertain environments",
      "Rigor",
    ],
    context:
      "Spotting gaps, proposing a direction, executing without permanent supervision.",
    level: 82,
  },
  {
    theme: "Collaboration",
    qualities: ["Teamwork", "Adaptability", "Domain curiosity"],
    context:
      "Building with others. Delivery quality is decided as much in the conversation as in the code.",
    level: 86,
  },
  {
    theme: "Composure & poise",
    qualities: [
      "Calm under pressure",
      "Perspective",
      "Team spirit",
      "Human sense",
    ],
    context:
      "Staying calm in tense moments, remaining clear under constraint, preserving a healthy team dynamic.",
    level: 78,
  },
];

export const hobbiesEn: Hobby[] = [
  { label: "Music", detail: "composition, FL Studio" },
  { label: "Theatre" },
  { label: "Chess", detail: "1600 elo" },
  { label: "Brazilian Jiu-Jitsu" },
  { label: "Poetry" },
  { label: "TV series" },
  { label: "Mindset" },
];

export const profileEn: Profile = {
  name: "Me",
  tagline:
    "Automation, AI agents, data, digital strategy. Turning an idea into a concrete workflow.",
  manifesto:
    "MSc student in AI Applied to Business. I love building tools that mix AI, data and operational execution: prototype fast, measure, iterate. This portfolio is a universe, not a grid. Wander at your own pace.",
  email: "aurianreal@gmail.com",
  linkedin: "https://www.linkedin.com/in/aurian-bingangoye",
  github: "https://github.com/CodeurFort",
  twitter: undefined,
  cvPdf: "/cv-aurian.pdf",
  cvCurrent:
    "VSOLUTION, computer-aided engineering: apprentice in Automation, AI Agents & Digital Performance (2026, ongoing). Built Energizer, built VSolution's website, deepened OpenClaw, prototyped automations.",
  cvPrevious:
    "Le Chalet Studio: right hand in Marketing & Data Analyst, summer 2024 (+22% clicks, +10% subscribers in 2 months). Odillon SARL: consultant since 2021, HR for a 5-person team, built Chronodil.",
  formation:
    "MSc AI Applied to Business, Eugenia School (2026, ongoing). Bachelor in Economic & Social Administration, Paris 1 Panthéon-Sorbonne (2025). Baccalaureate with honours (Math, Economics), Lycée français Blaise Pascal du Gabon (2021). Certifications: TOEFL, PIX.",
  languages: [
    { label: "Français", level: "native" },
    { label: "English", level: "C1 (TOEFL)" },
    { label: "Español", level: "B1" },
  ],
};

// stack labels stay identical (technologies don't translate). Categories are
// the same too — we translate the category labels in the UI layer.
export const stackEn: StackTool[] = stack;

export const certificationsEn: Certification[] = [
  {
    slug: "pix",
    title: "PIX",
    level: "Independent 1",
    score: "369 / 895",
    date: "04/07/2025",
    issuer: "Université Paris 1 Panthéon-Sorbonne",
    pdfUrl: "/visuals/certifications/pix-2025.pdf",
    logoUrl: "/visuals/certifications/logos/pix.svg",
  },
  {
    slug: "licence-aes",
    title: "Bachelor in Economic & Social Administration",
    date: "2025",
    issuer: "Paris 1 Panthéon-Sorbonne",
    pending: true,
    logoUrl: "/visuals/certifications/logos/paris1.svg",
  },
  {
    slug: "bac",
    title: "Baccalauréat général",
    level: "Honours (Mention Bien)",
    date: "2021",
    issuer: "Lycée français Blaise Pascal, Libreville",
    logoUrl: "/visuals/certifications/logos/blaise-pascal.png",
  },
  {
    slug: "toefl",
    title: "TOEFL",
    level: "C1",
    date: "—",
    issuer: "ETS",
    logoUrl: "/visuals/certifications/logos/toefl.svg",
  },
];

