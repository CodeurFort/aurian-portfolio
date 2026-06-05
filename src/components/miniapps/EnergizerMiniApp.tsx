"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLang, tr } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";

// Mini-app Energizer — démo visuelle des 3 features signature.
// Audit 360 / Veille (+ concurrence) / Article rédigé. Données 100% mockées
// (préchargées) avec un faux délai de "génération" pour donner la sensation
// du pipeline IA tout en restant instantané. Palette dark voltage mint.
//
// L'utilisateur ne saisit rien : il choisit l'un des 3 profils d'entreprise
// préparés (boulangerie locale, DNVB skincare, conseil B2B). Tous les mocks
// (audit, veille, article) suivent le profil sélectionné pour rester cohérents.

const PALETTE = {
  bg: "#0A0A0B",
  surface: "#111114",
  surfaceAlt: "rgba(255,255,255,0.025)",
  border: "rgba(255,255,255,0.08)",
  borderStrong: "rgba(255,255,255,0.18)",
  text: "#F5F5F4",
  textDim: "rgba(245,245,244,0.6)",
  textMuted: "rgba(245,245,244,0.4)",
  mint: "#7DE6B5",
  gold: "#F0C56C",
  coral: "#E07A6B",
  blue: "#7DB6E6",
};

type EnergizerTab = "audit" | "veille" | "article";
type CompanyKey = "lorenza" | "hexa" | "volta";

// ---------- COMPANIES + MOCK DATASETS ----------

type AuditMock = {
  domain: string;
  global: number;
  pillars: { key: string; score: number; color: string }[];
  actions: {
    tag: string;
    tagColor: string;
    title: string;
    desc: string;
    effort: string;
    impact: string;
    eta: string;
  }[];
};

type VeilleMock = {
  trends: { title: string; why: string; vol: string; tone: string }[];
  competitors: { name: string; moves: string; kw: string[] }[];
};

type ArticleMock = {
  keyword: string;
  h1: string;
  words: number;
  readingMin: number;
  scores: { label: string; val: number; max: number; color: string }[];
  preview: { h: string; p: string }[];
};

type CompanyMock = {
  label: string;
  sector: string;
  audit: AuditMock;
  veille: VeilleMock;
  article: ArticleMock;
};

const COMPANIES_FR: Record<CompanyKey, CompanyMock> = {
  lorenza: {
    label: "Atelier Lorenza",
    sector: "Boulangerie artisanale · Lyon",
    audit: {
      domain: "atelier-lorenza.fr",
      global: 64,
      pillars: [
        { key: "SEO local", score: 58, color: PALETTE.gold },
        { key: "GEO-AEO", score: 62, color: PALETTE.gold },
        { key: "E-E-A-T", score: 72, color: PALETTE.mint },
      ],
      actions: [
        {
          tag: "Quick win",
          tagColor: PALETTE.mint,
          title: "Compléter la fiche Google Business",
          desc: "Horaires fériés, photos intérieures, attribut « commande sur place ».",
          effort: "Low",
          impact: "High",
          eta: "1 sem.",
        },
        {
          tag: "Quick win",
          tagColor: PALETTE.mint,
          title: "Schéma LocalBusiness + Bakery",
          desc: "Markup schema.org sur la home pour Maps + AI Overviews.",
          effort: "Low",
          impact: "Med",
          eta: "1-2 sem.",
        },
        {
          tag: "Mid-term",
          tagColor: PALETTE.gold,
          title: "Page « notre levain » signature",
          desc: "Story du fournil + photos process pour score E-E-A-T.",
          effort: "Med",
          impact: "High",
          eta: "1 mois",
        },
        {
          tag: "Strategic",
          tagColor: PALETTE.coral,
          title: "Blog recettes mensuel",
          desc: "Capter les requêtes longue traîne « recette pain levain maison ».",
          effort: "High",
          impact: "Med",
          eta: "3-6 mois",
        },
      ],
    },
    veille: {
      trends: [
        {
          title: "Pain au levain naturel",
          why: "Recherche « levain » : +18% sur 12 mois en zone Lyon.",
          vol: "+18%",
          tone: PALETTE.mint,
        },
        {
          title: "Click & collect boulangerie",
          why: "Adoption forte post-2024 chez les 25-40 ans urbains.",
          vol: "+11%",
          tone: PALETTE.mint,
        },
        {
          title: "Pain sans gluten artisanal",
          why: "Niche qui scale, peu d'offre locale qualifiée.",
          vol: "+22%",
          tone: PALETTE.gold,
        },
      ],
      competitors: [
        {
          name: "Maison Pozzoli",
          moves: "Refonte site · réservation gâteau en ligne · Reels coulisses.",
          kw: ["boulangerie Lyon 6", "pain au levain", "gâteau anniversaire"],
        },
        {
          name: "Le Pain Lyonnais",
          moves: "Schema FAQ déployé · top 3 sur « meilleure boulangerie Lyon ».",
          kw: ["meilleure boulangerie Lyon", "pain bio", "viennoiserie"],
        },
      ],
    },
    article: {
      keyword: "meilleure boulangerie au levain Lyon",
      h1: "Le levain naturel à Lyon : guide de l'amateur exigeant",
      words: 1980,
      readingMin: 8,
      scores: [
        { label: "SEO", val: 22, max: 30, color: PALETTE.gold },
        { label: "GEO-AEO", val: 26, max: 30, color: PALETTE.mint },
        { label: "E-E-A-T", val: 17, max: 20, color: PALETTE.gold },
        { label: "Pertinence", val: 18, max: 20, color: PALETTE.mint },
      ],
      preview: [
        {
          h: "Pourquoi le levain change tout",
          p: "Fermentation longue (24-48 h), digestibilité renforcée, conservation naturelle : trois critères qui séparent un vrai pain au levain d'un pain conventionnel parfumé à la poolish…",
        },
        {
          h: "Notre fournil, en chiffres",
          p: "Farine T80 d'un meunier de la Drôme, levain mère vivant depuis 7 ans, cuisson sole en four à bois 4h du matin. 320 pains/jour, zéro additif…",
        },
        {
          h: "Où nous trouver à Lyon",
          p: "12 rue Burdeau, Lyon 1er. Ouvert mardi-samedi 7h-19h30. Click & collect via le site. Livraison restaurateurs partenaires sur demande…",
        },
      ],
    },
  },
  hexa: {
    label: "Hexa Cosmétiques",
    sector: "DNVB skincare clean · DTC",
    audit: {
      domain: "hexa-cosmetics.com",
      global: 71,
      pillars: [
        { key: "SEO-Tech", score: 74, color: PALETTE.mint },
        { key: "GEO-AEO", score: 65, color: PALETTE.gold },
        { key: "E-E-A-T", score: 73, color: PALETTE.mint },
      ],
      actions: [
        {
          tag: "Quick win",
          tagColor: PALETTE.mint,
          title: "Schema Product + Review sur PDP",
          desc: "Étoiles + prix + dispo dans les SERP + AI Overviews.",
          effort: "Low",
          impact: "High",
          eta: "1-2 sem.",
        },
        {
          tag: "Quick win",
          tagColor: PALETTE.mint,
          title: "Compresser images PDP",
          desc: "LCP 3.8s → 1.9s. Gain conversion estimé +6%.",
          effort: "Low",
          impact: "High",
          eta: "1 sem.",
        },
        {
          tag: "Mid-term",
          tagColor: PALETTE.gold,
          title: "Hub « routine peau sensible »",
          desc: "5 articles cluster + quiz routine pour aspirer la demande info.",
          effort: "Med",
          impact: "High",
          eta: "2-3 mois",
        },
        {
          tag: "Strategic",
          tagColor: PALETTE.coral,
          title: "Pages ingrédients (niacinamide, AHA…)",
          desc: "20 pages pillar + schema chimique pour squat AI Overviews.",
          effort: "High",
          impact: "High",
          eta: "3-6 mois",
        },
      ],
    },
    veille: {
      trends: [
        {
          title: "Biotech & post-biotiques",
          why: "Nouveau pic d'intérêt depuis Q1 2026, marqueurs « microbiome ».",
          vol: "+27%",
          tone: PALETTE.mint,
        },
        {
          title: "Refill & recharges",
          why: "Demande forte sur dimension RSE des DNVB.",
          vol: "+14%",
          tone: PALETTE.mint,
        },
        {
          title: "Peau sensible / barrière cutanée",
          why: "Volume stable mais conversion x2 vs anti-âge.",
          vol: "+9%",
          tone: PALETTE.gold,
        },
      ],
      competitors: [
        {
          name: "Typology",
          moves: "Lance gamme post-biotique · refonte hub ingrédients SEO-first.",
          kw: ["soin peau sensible", "niacinamide sérum", "routine minimaliste"],
        },
        {
          name: "Respire",
          moves: "Pages quiz qualifiantes · partenariats créateurs micro-niche.",
          kw: ["déodorant naturel", "soin clean", "cosmétique vegan"],
        },
      ],
    },
    article: {
      keyword: "sérum vitamine C peau sensible",
      h1: "Vitamine C et peau sensible : le guide sans irritation",
      words: 2640,
      readingMin: 10,
      scores: [
        { label: "SEO", val: 26, max: 30, color: PALETTE.mint },
        { label: "GEO-AEO", val: 24, max: 30, color: PALETTE.mint },
        { label: "E-E-A-T", val: 18, max: 20, color: PALETTE.gold },
        { label: "Pertinence", val: 19, max: 20, color: PALETTE.mint },
      ],
      preview: [
        {
          h: "Pourquoi la vitamine C peut irriter",
          p: "L'acide L-ascorbique pur (pH 3.5) est extrêmement actif mais déstabilise la barrière cutanée des peaux réactives. Trois dérivés stables existent : ascorbyl glucoside, MAP, THDA…",
        },
        {
          h: "Notre formule Hexa C-Calm 8%",
          p: "Ascorbyl glucoside 8% + niacinamide 4% + bisabolol. pH 5.5, sans alcool, sans parfum. Testée sous contrôle dermatologique sur 32 peaux sensibles, 0% d'irritation à J28…",
        },
        {
          h: "Comment l'intégrer à ta routine",
          p: "Matin sur peau sèche, avant écran solaire. 3 gouttes suffisent. Démarre 1 jour sur 2 pendant 2 semaines pour habituer la peau, puis tous les jours…",
        },
      ],
    },
  },
  volta: {
    label: "Volta Conseil",
    sector: "Cabinet conseil RSE / décarbonation · B2B",
    audit: {
      domain: "volta-conseil.com",
      global: 58,
      pillars: [
        { key: "SEO-Tech", score: 61, color: PALETTE.gold },
        { key: "GEO-AEO", score: 49, color: PALETTE.coral },
        { key: "E-E-A-T", score: 66, color: PALETTE.gold },
      ],
      actions: [
        {
          tag: "Quick win",
          tagColor: PALETTE.mint,
          title: "Schema ProfessionalService + Person",
          desc: "Légitimité des associés visible dans Google + LLMs.",
          effort: "Low",
          impact: "High",
          eta: "1 sem.",
        },
        {
          tag: "Quick win",
          tagColor: PALETTE.mint,
          title: "Réécrire les H1 des pages expertise",
          desc: "Aligner sur les requêtes « bilan carbone Scope 3 secteur X ».",
          effort: "Low",
          impact: "Med",
          eta: "1-2 sem.",
        },
        {
          tag: "Mid-term",
          tagColor: PALETTE.gold,
          title: "5 études de cas chiffrées",
          desc: "Résultats clients quantifiés → preuve sociale + référence LLM.",
          effort: "Med",
          impact: "High",
          eta: "2-3 mois",
        },
        {
          tag: "Strategic",
          tagColor: PALETTE.coral,
          title: "Observatoire CSRD trimestriel",
          desc: "Format référence pour link earning + autorité sectorielle.",
          effort: "High",
          impact: "High",
          eta: "6-9 mois",
        },
      ],
    },
    veille: {
      trends: [
        {
          title: "Reporting CSRD obligatoire ETI",
          why: "Échéance 2027 → recherche d'accompagnement en hausse.",
          vol: "+34%",
          tone: PALETTE.mint,
        },
        {
          title: "Décarbonation Scope 3 industrie",
          why: "Pression donneurs d'ordre sur la chaîne fournisseurs.",
          vol: "+19%",
          tone: PALETTE.mint,
        },
        {
          title: "CEE pour le tertiaire",
          why: "Volume stable mais marge cabinet forte sur le segment.",
          vol: "+6%",
          tone: PALETTE.gold,
        },
      ],
      competitors: [
        {
          name: "Carbone 4",
          moves: "Publie un référentiel sectoriel · multiplie webinars dirigeants.",
          kw: ["bilan carbone Scope 3", "stratégie SBTi", "CSRD industrie"],
        },
        {
          name: "Greenflex",
          moves: "Refonte SEO pages secteur · campagne LinkedIn « net zero ».",
          kw: ["conseil RSE", "trajectoire net zero", "décarbonation entreprise"],
        },
      ],
    },
    article: {
      keyword: "décarbonation supply chain industrie",
      h1: "Décarboner sa supply chain industrielle : méthode en 5 étapes",
      words: 3120,
      readingMin: 12,
      scores: [
        { label: "SEO", val: 25, max: 30, color: PALETTE.mint },
        { label: "GEO-AEO", val: 27, max: 30, color: PALETTE.mint },
        { label: "E-E-A-T", val: 19, max: 20, color: PALETTE.mint },
        { label: "Pertinence", val: 18, max: 20, color: PALETTE.gold },
      ],
      preview: [
        {
          h: "Pourquoi Scope 3 = 70% de l'enjeu",
          p: "Pour un industriel manufacturier moyen, les émissions amont (matières, transport) représentent 65-80% du bilan. Réduire son Scope 1-2 sans toucher au Scope 3, c'est rater l'essentiel…",
        },
        {
          h: "Étape 1 — Cartographier les hotspots",
          p: "ACV simplifiée sur les 5 familles d'achats principales. L'objectif : identifier les 20% de références qui pèsent 80% du carbone, et concentrer l'effort dessus…",
        },
        {
          h: "Étape 2 — Négocier avec ses fournisseurs",
          p: "Cahier des charges avec critère carbone, plan de progrès partagé, prime à la performance. Trois leviers que nous déployons depuis 4 ans sur nos clients ETI…",
        },
      ],
    },
  },
};

const COMPANIES_EN: Record<CompanyKey, CompanyMock> = {
  lorenza: {
    label: "Atelier Lorenza",
    sector: "Artisan bakery · Lyon",
    audit: {
      domain: "atelier-lorenza.fr",
      global: 64,
      pillars: [
        { key: "Local SEO", score: 58, color: PALETTE.gold },
        { key: "GEO-AEO", score: 62, color: PALETTE.gold },
        { key: "E-E-A-T", score: 72, color: PALETTE.mint },
      ],
      actions: [
        {
          tag: "Quick win",
          tagColor: PALETTE.mint,
          title: "Complete Google Business profile",
          desc: "Holiday hours, indoor photos, « in-store ordering » attribute.",
          effort: "Low",
          impact: "High",
          eta: "1 wk",
        },
        {
          tag: "Quick win",
          tagColor: PALETTE.mint,
          title: "LocalBusiness + Bakery schema",
          desc: "schema.org markup on homepage for Maps + AI Overviews.",
          effort: "Low",
          impact: "Med",
          eta: "1-2 wk",
        },
        {
          tag: "Mid-term",
          tagColor: PALETTE.gold,
          title: "Signature « our sourdough » page",
          desc: "Bakery story + process photos for E-E-A-T score.",
          effort: "Med",
          impact: "High",
          eta: "1 mo",
        },
        {
          tag: "Strategic",
          tagColor: PALETTE.coral,
          title: "Monthly recipe blog",
          desc: "Capture long-tail queries « homemade sourdough bread recipe ».",
          effort: "High",
          impact: "Med",
          eta: "3-6 mo",
        },
      ],
    },
    veille: {
      trends: [
        {
          title: "Natural sourdough bread",
          why: "« Sourdough » searches: +18% over 12 months in Lyon area.",
          vol: "+18%",
          tone: PALETTE.mint,
        },
        {
          title: "Click & collect bakery",
          why: "Strong adoption post-2024 among urban 25-40 y/o.",
          vol: "+11%",
          tone: PALETTE.mint,
        },
        {
          title: "Artisan gluten-free bread",
          why: "Scaling niche, little qualified local supply.",
          vol: "+22%",
          tone: PALETTE.gold,
        },
      ],
      competitors: [
        {
          name: "Maison Pozzoli",
          moves: "Site redesign · online cake booking · behind-the-scenes Reels.",
          kw: ["bakery Lyon 6", "sourdough bread", "birthday cake"],
        },
        {
          name: "Le Pain Lyonnais",
          moves: "FAQ schema deployed · top 3 for « best bakery Lyon ».",
          kw: ["best bakery Lyon", "organic bread", "viennoiserie"],
        },
      ],
    },
    article: {
      keyword: "best sourdough bakery Lyon",
      h1: "Natural sourdough in Lyon: the demanding amateur's guide",
      words: 1980,
      readingMin: 8,
      scores: [
        { label: "SEO", val: 22, max: 30, color: PALETTE.gold },
        { label: "GEO-AEO", val: 26, max: 30, color: PALETTE.mint },
        { label: "E-E-A-T", val: 17, max: 20, color: PALETTE.gold },
        { label: "Relevance", val: 18, max: 20, color: PALETTE.mint },
      ],
      preview: [
        {
          h: "Why sourdough changes everything",
          p: "Long fermentation (24-48 h), enhanced digestibility, natural preservation: three criteria that separate real sourdough bread from a conventional poolish-flavored loaf…",
        },
        {
          h: "Our bakery, in numbers",
          p: "T80 flour from a Drôme miller, mother sourdough alive for 7 years, hearth wood-fired oven at 4am. 320 loaves/day, zero additives…",
        },
        {
          h: "Find us in Lyon",
          p: "12 rue Burdeau, Lyon 1st. Open Tue-Sat 7am-7:30pm. Click & collect via the website. Delivery to partner restaurants on request…",
        },
      ],
    },
  },
  hexa: {
    label: "Hexa Cosmétiques",
    sector: "Clean skincare DNVB · DTC",
    audit: {
      domain: "hexa-cosmetics.com",
      global: 71,
      pillars: [
        { key: "SEO-Tech", score: 74, color: PALETTE.mint },
        { key: "GEO-AEO", score: 65, color: PALETTE.gold },
        { key: "E-E-A-T", score: 73, color: PALETTE.mint },
      ],
      actions: [
        {
          tag: "Quick win",
          tagColor: PALETTE.mint,
          title: "Product + Review schema on PDP",
          desc: "Stars + price + stock in SERPs + AI Overviews.",
          effort: "Low",
          impact: "High",
          eta: "1-2 wk",
        },
        {
          tag: "Quick win",
          tagColor: PALETTE.mint,
          title: "Compress PDP images",
          desc: "LCP 3.8s → 1.9s. Estimated conversion gain +6%.",
          effort: "Low",
          impact: "High",
          eta: "1 wk",
        },
        {
          tag: "Mid-term",
          tagColor: PALETTE.gold,
          title: "« Sensitive skin routine » hub",
          desc: "5 cluster articles + routine quiz to capture info demand.",
          effort: "Med",
          impact: "High",
          eta: "2-3 mo",
        },
        {
          tag: "Strategic",
          tagColor: PALETTE.coral,
          title: "Ingredient pages (niacinamide, AHA…)",
          desc: "20 pillar pages + chemical schema to squat AI Overviews.",
          effort: "High",
          impact: "High",
          eta: "3-6 mo",
        },
      ],
    },
    veille: {
      trends: [
        {
          title: "Biotech & postbiotics",
          why: "New interest spike since Q1 2026, « microbiome » markers.",
          vol: "+27%",
          tone: PALETTE.mint,
        },
        {
          title: "Refill & reloads",
          why: "Strong demand on DNVB ESG dimension.",
          vol: "+14%",
          tone: PALETTE.mint,
        },
        {
          title: "Sensitive skin / skin barrier",
          why: "Stable volume but 2x conversion vs anti-aging.",
          vol: "+9%",
          tone: PALETTE.gold,
        },
      ],
      competitors: [
        {
          name: "Typology",
          moves: "Launches postbiotic line · SEO-first ingredient hub redesign.",
          kw: ["sensitive skin care", "niacinamide serum", "minimalist routine"],
        },
        {
          name: "Respire",
          moves: "Qualifying quiz pages · micro-niche creator partnerships.",
          kw: ["natural deodorant", "clean skincare", "vegan cosmetics"],
        },
      ],
    },
    article: {
      keyword: "vitamin C serum sensitive skin",
      h1: "Vitamin C and sensitive skin: the no-irritation guide",
      words: 2640,
      readingMin: 10,
      scores: [
        { label: "SEO", val: 26, max: 30, color: PALETTE.mint },
        { label: "GEO-AEO", val: 24, max: 30, color: PALETTE.mint },
        { label: "E-E-A-T", val: 18, max: 20, color: PALETTE.gold },
        { label: "Relevance", val: 19, max: 20, color: PALETTE.mint },
      ],
      preview: [
        {
          h: "Why vitamin C can irritate",
          p: "Pure L-ascorbic acid (pH 3.5) is extremely active but destabilizes the skin barrier of reactive skin. Three stable derivatives exist: ascorbyl glucoside, MAP, THDA…",
        },
        {
          h: "Our Hexa C-Calm 8% formula",
          p: "Ascorbyl glucoside 8% + niacinamide 4% + bisabolol. pH 5.5, alcohol-free, fragrance-free. Dermatologically tested on 32 sensitive skins, 0% irritation at D28…",
        },
        {
          h: "How to add it to your routine",
          p: "Morning on dry skin, before sunscreen. 3 drops are enough. Start every other day for 2 weeks to acclimate the skin, then daily…",
        },
      ],
    },
  },
  volta: {
    label: "Volta Conseil",
    sector: "ESG / decarbonization consulting · B2B",
    audit: {
      domain: "volta-conseil.com",
      global: 58,
      pillars: [
        { key: "SEO-Tech", score: 61, color: PALETTE.gold },
        { key: "GEO-AEO", score: 49, color: PALETTE.coral },
        { key: "E-E-A-T", score: 66, color: PALETTE.gold },
      ],
      actions: [
        {
          tag: "Quick win",
          tagColor: PALETTE.mint,
          title: "ProfessionalService + Person schema",
          desc: "Partner legitimacy visible in Google + LLMs.",
          effort: "Low",
          impact: "High",
          eta: "1 wk",
        },
        {
          tag: "Quick win",
          tagColor: PALETTE.mint,
          title: "Rewrite expertise page H1s",
          desc: "Align with queries « Scope 3 carbon footprint sector X ».",
          effort: "Low",
          impact: "Med",
          eta: "1-2 wk",
        },
        {
          tag: "Mid-term",
          tagColor: PALETTE.gold,
          title: "5 quantified case studies",
          desc: "Quantified client results → social proof + LLM reference.",
          effort: "Med",
          impact: "High",
          eta: "2-3 mo",
        },
        {
          tag: "Strategic",
          tagColor: PALETTE.coral,
          title: "Quarterly CSRD observatory",
          desc: "Reference format for link earning + sector authority.",
          effort: "High",
          impact: "High",
          eta: "6-9 mo",
        },
      ],
    },
    veille: {
      trends: [
        {
          title: "Mandatory CSRD reporting for mid-caps",
          why: "2027 deadline → rising demand for advisory.",
          vol: "+34%",
          tone: PALETTE.mint,
        },
        {
          title: "Scope 3 industrial decarbonization",
          why: "Buyer pressure on the supplier chain.",
          vol: "+19%",
          tone: PALETTE.mint,
        },
        {
          title: "Energy savings certificates for tertiary",
          why: "Stable volume but strong consulting margin.",
          vol: "+6%",
          tone: PALETTE.gold,
        },
      ],
      competitors: [
        {
          name: "Carbone 4",
          moves: "Publishes sector benchmark · multiplies exec webinars.",
          kw: ["Scope 3 carbon footprint", "SBTi strategy", "industrial CSRD"],
        },
        {
          name: "Greenflex",
          moves: "Sector page SEO redesign · « net zero » LinkedIn campaign.",
          kw: ["ESG consulting", "net zero trajectory", "corporate decarbonization"],
        },
      ],
    },
    article: {
      keyword: "industrial supply chain decarbonization",
      h1: "Decarbonizing your industrial supply chain: a 5-step method",
      words: 3120,
      readingMin: 12,
      scores: [
        { label: "SEO", val: 25, max: 30, color: PALETTE.mint },
        { label: "GEO-AEO", val: 27, max: 30, color: PALETTE.mint },
        { label: "E-E-A-T", val: 19, max: 20, color: PALETTE.mint },
        { label: "Relevance", val: 18, max: 20, color: PALETTE.gold },
      ],
      preview: [
        {
          h: "Why Scope 3 = 70% of the challenge",
          p: "For an average manufacturer, upstream emissions (materials, transport) represent 65-80% of the footprint. Reducing Scope 1-2 without touching Scope 3 misses the point…",
        },
        {
          h: "Step 1 — Map the hotspots",
          p: "Simplified LCA on the top 5 purchasing families. The goal: identify the 20% of SKUs that weigh 80% of the carbon, and focus effort there…",
        },
        {
          h: "Step 2 — Negotiate with suppliers",
          p: "Carbon-criterion specifications, shared progress plan, performance bonus. Three levers we've been deploying for 4 years on our mid-cap clients…",
        },
      ],
    },
  },
};

function pickCompanies(lang: Lang): Record<CompanyKey, CompanyMock> {
  return lang === "en" ? COMPANIES_EN : COMPANIES_FR;
}

// ---------- UI PRIMITIVES ----------

function ScoreRing({ value, max = 100, color }: { value: number; max?: number; color: string }) {
  const pct = (value / max) * 100;
  return (
    <div className="flex items-center gap-2">
      <span
        className="font-semibold"
        style={{ color, fontSize: 22, lineHeight: 1 }}
      >
        {value}
        <span style={{ color: PALETTE.textMuted, fontSize: 12 }}>/{max}</span>
      </span>
      <div
        className="rounded-full overflow-hidden"
        style={{
          width: 70,
          height: 5,
          background: "rgba(255,255,255,0.06)",
        }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }}
          style={{
            height: "100%",
            background: color,
            boxShadow: `0 0 10px ${color}`,
          }}
        />
      </div>
    </div>
  );
}

function PillarBar({ k, v, color }: { k: string; v: number; color: string }) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1">
        <span
          className="mono uppercase text-[10px] tracking-widest"
          style={{ color: PALETTE.textDim }}
        >
          {k}
        </span>
        <span style={{ color, fontSize: 13, fontWeight: 600 }}>{v}</span>
      </div>
      <div
        className="rounded-full overflow-hidden"
        style={{ height: 4, background: "rgba(255,255,255,0.06)" }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${v}%` }}
          transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
          style={{
            height: "100%",
            background: color,
            boxShadow: `0 0 8px ${color}`,
          }}
        />
      </div>
    </div>
  );
}

function RunButton({
  label,
  onClick,
  running,
  done,
}: {
  label: string;
  onClick: () => void;
  running: boolean;
  done: boolean;
}) {
  const { lang } = useLang();
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={running}
      className="mono uppercase text-[10px] tracking-widest px-3 py-1.5 rounded-md transition-colors"
      style={{
        color: done ? PALETTE.mint : PALETTE.bg,
        background: done ? "transparent" : PALETTE.mint,
        border: `1px solid ${PALETTE.mint}`,
        cursor: running ? "wait" : "pointer",
        opacity: running ? 0.65 : 1,
        fontWeight: 600,
      }}
    >
      {running ? tr(lang, "Analyse en cours…", "Analyzing…") : done ? tr(lang, "Relancer", "Re-run") : label}
    </button>
  );
}

// Domain pill — remplace l'input libre, affiche le domaine de l'entreprise
// active en lecture seule. Aligné visuellement avec l'ancien champ texte.
function TargetPill({ domain }: { domain: string }) {
  const { lang } = useLang();
  return (
    <div
      className="flex-1 flex items-center gap-2 text-[13px] px-3 py-1.5 rounded-md"
      style={{
        color: PALETTE.text,
        border: `1px solid ${PALETTE.border}`,
        background: PALETTE.surfaceAlt,
      }}
    >
      <span style={{ color: PALETTE.mint, fontSize: 11 }}>▸</span>
      <span className="mono" style={{ color: PALETTE.textDim }}>
        {tr(lang, "cible :", "target:")}
      </span>
      <span style={{ color: PALETTE.text }}>{domain}</span>
    </div>
  );
}

// ---------- TAB CONTENTS ----------

function AuditPanel({ company }: { company: CompanyKey }) {
  const { lang } = useLang();
  const [running, setRunning] = useState(false);
  const [hasData, setHasData] = useState(false);
  const data = pickCompanies(lang)[company].audit;

  const run = () => {
    setRunning(true);
    setHasData(false);
    setTimeout(() => {
      setRunning(false);
      setHasData(true);
    }, 850);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <TargetPill domain={data.domain} />
        <RunButton
          label={tr(lang, "Lancer l'audit", "Run audit")}
          onClick={run}
          running={running}
          done={hasData}
        />
      </div>

      <AnimatePresence mode="wait">
        {hasData && (
          <motion.div
            key="audit-data"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            <div
              className="rounded-xl p-4 flex items-center justify-between gap-4"
              style={{
                background: PALETTE.surface,
                border: `1px solid ${PALETTE.border}`,
              }}
            >
              <div>
                <p
                  className="mono uppercase text-[10px] tracking-[0.3em]"
                  style={{ color: PALETTE.textDim }}
                >
                  Global health
                </p>
                <p
                  className="font-bold mt-1"
                  style={{
                    color: PALETTE.text,
                    fontSize: 30,
                    lineHeight: 1,
                  }}
                >
                  <span style={{ color: PALETTE.mint }}>{data.global}</span>
                  <span style={{ color: PALETTE.textMuted, fontSize: 16 }}>/100</span>
                </p>
              </div>
              <div className="flex-1 grid grid-cols-3 gap-3">
                {data.pillars.map((p) => (
                  <PillarBar key={p.key} k={p.key} v={p.score} color={p.color} />
                ))}
              </div>
            </div>

            <div>
              <p
                className="mono uppercase text-[10px] tracking-[0.3em] mb-2"
                style={{ color: PALETTE.textDim }}
              >
                {tr(lang, "Plan d'action prioritaire", "Priority action plan")}
              </p>
              <ul className="space-y-2">
                {data.actions.map((a, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.25, delay: 0.05 * i }}
                    className="rounded-lg px-3 py-2.5 flex items-start gap-3"
                    style={{
                      background: PALETTE.surfaceAlt,
                      borderLeft: `2px solid ${a.tagColor}`,
                    }}
                  >
                    <span
                      className="mono uppercase text-[9px] tracking-widest px-2 py-0.5 rounded-full shrink-0"
                      style={{
                        color: a.tagColor,
                        border: `1px solid ${a.tagColor}55`,
                      }}
                    >
                      {a.tag}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p
                        className="font-semibold text-[13px]"
                        style={{ color: PALETTE.text }}
                      >
                        {a.title}
                      </p>
                      <p
                        className="text-[12px] mt-0.5"
                        style={{ color: PALETTE.textDim }}
                      >
                        {a.desc}
                      </p>
                    </div>
                    <div
                      className="mono text-[10px] uppercase tracking-widest shrink-0 text-right"
                      style={{ color: PALETTE.textMuted }}
                    >
                      <div>{a.effort} · {a.impact}</div>
                      <div>{a.eta}</div>
                    </div>
                  </motion.li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function VeillePanel({ company }: { company: CompanyKey }) {
  const { lang } = useLang();
  const [running, setRunning] = useState(false);
  const [hasData, setHasData] = useState(false);
  const data = pickCompanies(lang)[company].veille;

  const run = () => {
    setRunning(true);
    setHasData(false);
    setTimeout(() => {
      setRunning(false);
      setHasData(true);
    }, 800);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <p
          className="mono uppercase text-[10px] tracking-[0.3em]"
          style={{ color: PALETTE.textDim }}
        >
          {tr(lang, "Tendances · Concurrence", "Trends · Competitors")}
        </p>
        <RunButton
          label={tr(lang, "Lancer la veille", "Run watch")}
          onClick={run}
          running={running}
          done={hasData}
        />
      </div>

      <AnimatePresence mode="wait">
        {hasData && (
          <motion.div
            key="veille-data"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            <div className="grid sm:grid-cols-3 gap-3">
              {data.trends.map((t, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: 0.05 * i }}
                  className="rounded-xl p-3"
                  style={{
                    background: PALETTE.surface,
                    border: `1px solid ${PALETTE.border}`,
                  }}
                >
                  <p
                    className="font-semibold text-[13px] mb-1"
                    style={{ color: PALETTE.text }}
                  >
                    {t.title}
                  </p>
                  <p
                    className="text-[12px] mb-2"
                    style={{ color: PALETTE.textDim }}
                  >
                    {t.why}
                  </p>
                  <span
                    className="mono text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full inline-block"
                    style={{
                      color: t.tone,
                      border: `1px solid ${t.tone}55`,
                    }}
                  >
                    Vol. {t.vol} YoY
                  </span>
                </motion.div>
              ))}
            </div>

            <div>
              <p
                className="mono uppercase text-[10px] tracking-[0.3em] mb-2"
                style={{ color: PALETTE.textDim }}
              >
                {tr(lang, "Mouvements concurrence", "Competitor moves")}
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                {data.competitors.map((c, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: 0.15 + 0.05 * i }}
                    className="rounded-xl p-3"
                    style={{
                      background: PALETTE.surfaceAlt,
                      border: `1px solid ${PALETTE.border}`,
                    }}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <p
                        className="font-semibold text-[13px]"
                        style={{ color: PALETTE.text }}
                      >
                        {c.name}
                      </p>
                      <span
                        className="mono text-[9px] uppercase tracking-widest"
                        style={{ color: PALETTE.coral }}
                      >
                        {tr(lang, "actif", "active")}
                      </span>
                    </div>
                    <p
                      className="text-[12px] mb-2"
                      style={{ color: PALETTE.textDim }}
                    >
                      {c.moves}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {c.kw.map((k) => (
                        <span
                          key={k}
                          className="mono text-[10px] px-1.5 py-0.5 rounded-md"
                          style={{
                            color: PALETTE.textDim,
                            border: `1px solid ${PALETTE.border}`,
                            background: "rgba(255,255,255,0.025)",
                          }}
                        >
                          {k}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ArticlePanel({ company }: { company: CompanyKey }) {
  const { lang } = useLang();
  const [running, setRunning] = useState(false);
  const [hasData, setHasData] = useState(false);
  const data = pickCompanies(lang)[company].article;

  const run = () => {
    setRunning(true);
    setHasData(false);
    setTimeout(() => {
      setRunning(false);
      setHasData(true);
    }, 950);
  };

  const total = data.scores.reduce((a, s) => a + s.val, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div
          className="flex-1 flex items-center gap-2 text-[13px] px-3 py-1.5 rounded-md"
          style={{
            color: PALETTE.text,
            border: `1px solid ${PALETTE.border}`,
            background: PALETTE.surfaceAlt,
          }}
        >
          <span style={{ color: PALETTE.mint, fontSize: 11 }}>▸</span>
          <span className="mono" style={{ color: PALETTE.textDim }}>
            {tr(lang, "mot-clé :", "keyword:")}
          </span>
          <span style={{ color: PALETTE.text }}>{data.keyword}</span>
        </div>
        <RunButton
          label={tr(lang, "Générer l'article", "Generate article")}
          onClick={run}
          running={running}
          done={hasData}
        />
      </div>

      <AnimatePresence mode="wait">
        {hasData && (
          <motion.div
            key="article-data"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            {/* Score dashboard */}
            <div
              className="rounded-xl p-4"
              style={{
                background: PALETTE.surface,
                border: `1px solid ${PALETTE.border}`,
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <p
                  className="mono uppercase text-[10px] tracking-[0.3em]"
                  style={{ color: PALETTE.textDim }}
                >
                  {tr(lang, "Score global", "Global score")}
                </p>
                <span
                  className="font-bold"
                  style={{ color: PALETTE.mint, fontSize: 18 }}
                >
                  {total}
                  <span style={{ color: PALETTE.textMuted, fontSize: 12 }}>/100</span>
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {data.scores.map((s) => (
                  <div key={s.label}>
                    <p
                      className="mono uppercase text-[9px] tracking-widest mb-1"
                      style={{ color: PALETTE.textDim }}
                    >
                      {s.label}
                    </p>
                    <ScoreRing value={s.val} max={s.max} color={s.color} />
                  </div>
                ))}
              </div>
            </div>

            {/* Article preview */}
            <div
              className="rounded-xl overflow-hidden"
              style={{
                background: PALETTE.surface,
                border: `1px solid ${PALETTE.border}`,
              }}
            >
              <div
                className="flex items-center justify-between px-4 py-2"
                style={{ borderBottom: `1px solid ${PALETTE.border}` }}
              >
                <span
                  className="mono uppercase text-[10px] tracking-widest"
                  style={{ color: PALETTE.textDim }}
                >
                  {tr(
                    lang,
                    `Aperçu · ${data.words.toLocaleString("fr-FR")} mots · ${data.readingMin} min`,
                    `Preview · ${data.words.toLocaleString("en-US")} words · ${data.readingMin} min`,
                  )}
                </span>
                <span
                  className="mono uppercase text-[10px] tracking-widest"
                  style={{ color: PALETTE.mint }}
                >
                  {tr(lang, "prêt à publier ✓", "ready to publish ✓")}
                </span>
              </div>
              <div
                className="px-4 py-3 max-h-56 overflow-y-auto"
                style={{ color: PALETTE.text }}
              >
                <h1
                  style={{
                    fontFamily: "Georgia, ui-serif, serif",
                    fontSize: 18,
                    lineHeight: 1.25,
                    fontWeight: 700,
                    marginBottom: 8,
                  }}
                >
                  {data.h1}
                </h1>
                {data.preview.map((s, i) => (
                  <div key={i} style={{ marginBottom: 10 }}>
                    <h2
                      style={{
                        fontFamily: "Georgia, ui-serif, serif",
                        fontSize: 14,
                        fontWeight: 700,
                        marginBottom: 4,
                        color: PALETTE.mint,
                      }}
                    >
                      {s.h}
                    </h2>
                    <p
                      style={{
                        fontFamily: "Georgia, ui-serif, serif",
                        fontSize: 12.5,
                        lineHeight: 1.55,
                        color: PALETTE.textDim,
                      }}
                    >
                      {s.p}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------- ROOT ----------

export function EnergizerMiniApp() {
  const { lang } = useLang();
  const [tab, setTab] = useState<EnergizerTab>("audit");
  const [company, setCompany] = useState<CompanyKey>("lorenza");

  const tabs: Array<{ key: EnergizerTab; label: string }> = [
    { key: "audit", label: tr(lang, "Audit 360", "Audit 360") },
    { key: "veille", label: tr(lang, "Veille", "Watch") },
    { key: "article", label: tr(lang, "Article", "Article") },
  ];

  const companyKeys: CompanyKey[] = ["lorenza", "hexa", "volta"];
  const currentCompany = pickCompanies(lang)[company];

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: PALETTE.bg,
        border: `1px solid ${PALETTE.border}`,
        boxShadow:
          "0 18px 50px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.04)",
        fontFamily:
          "var(--font-mono, 'Inter'), ui-sans-serif, system-ui",
        color: PALETTE.text,
      }}
    >
      {/* Topbar */}
      <div
        className="flex items-center justify-between px-5 py-3"
        style={{ borderBottom: `1px solid ${PALETTE.border}` }}
      >
        <div className="flex items-center gap-2">
          <span
            aria-hidden
            style={{
              width: 8,
              height: 8,
              borderRadius: 999,
              background: PALETTE.mint,
              boxShadow: `0 0 10px ${PALETTE.mint}`,
            }}
          />
          <span
            className="mono uppercase text-[10px] tracking-[0.3em]"
            style={{ color: PALETTE.textDim }}
          >
            Energizer
          </span>
          <span style={{ color: PALETTE.mint, fontSize: 10 }}>·</span>
          <span
            className="mono uppercase text-[10px] tracking-[0.3em]"
            style={{ color: PALETTE.textDim }}
          >
            {tr(lang, "démo", "demo")}
          </span>
        </div>
        <div className="flex gap-1">
          {tabs.map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className="mono uppercase text-[10px] tracking-widest px-2.5 py-1 rounded-md transition-colors"
                style={{
                  color: active ? PALETTE.mint : PALETTE.textDim,
                  background: active
                    ? "rgba(125,230,181,0.10)"
                    : "transparent",
                  border: `1px solid ${active ? `${PALETTE.mint}55` : "transparent"}`,
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Company selector — 3 profils mockés, l'user choisit, aucun input libre */}
      <div
        className="px-5 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
        style={{ borderBottom: `1px solid ${PALETTE.border}` }}
      >
        <div className="flex items-center gap-2">
          <span
            className="mono uppercase text-[10px] tracking-[0.3em]"
            style={{ color: PALETTE.textDim }}
          >
            {tr(lang, "Profil démo", "Demo profile")}
          </span>
          <span style={{ color: PALETTE.textMuted, fontSize: 11 }}>
            · {currentCompany.sector}
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {companyKeys.map((k) => {
            const active = k === company;
            return (
              <button
                key={k}
                type="button"
                onClick={() => setCompany(k)}
                className="mono uppercase text-[10px] tracking-widest px-2.5 py-1 rounded-md transition-colors"
                style={{
                  color: active ? PALETTE.gold : PALETTE.textDim,
                  background: active
                    ? "rgba(240,197,108,0.10)"
                    : "transparent",
                  border: `1px solid ${
                    active ? `${PALETTE.gold}55` : PALETTE.border
                  }`,
                }}
              >
                {pickCompanies(lang)[k].label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-5 py-4">
        <AnimatePresence mode="wait">
          <motion.div
            // Remount on tab OR company change → reset hasData / running des panels.
            key={`${tab}-${company}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22 }}
          >
            {tab === "audit" && <AuditPanel company={company} />}
            {tab === "veille" && <VeillePanel company={company} />}
            {tab === "article" && <ArticlePanel company={company} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
