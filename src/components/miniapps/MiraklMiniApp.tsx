"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLang, tr } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";

// Mini-app Mirakl Prospector — démo fidèle au vrai flux de l'app
// (cf. Desktop/Business Case/mirakl-prospector) :
//   1. SCORING   : un seller est scoré contre les marketplaces via 6 critères
//                  pondérés (Catégorie 25 %, Géo 18 %, Prix 15 %, Client 15 %,
//                  Saisonnalité 12 %, Signaux marketplace 15 %), chacun avec
//                  un score ET une raison — cf. achievement dans content.ts.
//   2. STRATÉGIE : le moteur recommande méthode / angle / saisonnalité
//                  (+ rôle à cibler) — l'utilisateur peut tout ajuster.
//   3. EMAILS    : séquence 3 temps (J0 / J+5 / J+12) dont le contenu est
//                  RÉÉCRIT selon la stratégie choisie — la feature phare.
// 100 % mock — pas de clé API, faux délais pour le rythme.

const PALETTE = {
  bg: "#0C0D11",
  surface: "#13151A",
  surfaceAlt: "rgba(255,255,255,0.025)",
  border: "rgba(255,255,255,0.08)",
  borderStrong: "rgba(255,255,255,0.18)",
  text: "#F5F5F4",
  textDim: "rgba(245,245,244,0.6)",
  textMuted: "rgba(245,245,244,0.4)",
  orange: "#FF7A45",
  teal: "#6DD3C6",
  gold: "#F0C56C",
  coral: "#E07A6B",
};

const scoreColor = (v: number) =>
  v >= 85 ? PALETTE.teal : v >= 70 ? PALETTE.gold : PALETTE.coral;

// ---------- TYPES ----------

type L = { fr: string; en: string };
const pick = (lang: Lang, l: L) => (lang === "fr" ? l.fr : l.en);

type CriterionKey =
  | "category"
  | "geography"
  | "price"
  | "customer"
  | "seasonality"
  | "signals";

type AngleKey =
  | "market_fit"
  | "roi"
  | "social_proof"
  | "competitive_gap"
  | "seasonal_window";

type MethodKey =
  | "email_sequence"
  | "linkedin_email"
  | "partner_intro"
  | "seasonal_push";

type SeasonKey =
  | "always_on"
  | "black_friday"
  | "holiday_gifting"
  | "back_to_school"
  | "summer_sale"
  | "fashion_drop";

interface Strategy {
  method: MethodKey;
  angle: AngleKey;
  season: SeasonKey;
}

interface Criterion {
  key: CriterionKey;
  score: number;
  reason: L;
}

interface SellerProfile {
  key: string;
  name: string;
  pitch: L;
  country: string;
  flag: string;
  topMarketplace: string;
  totalScore: number;
  roi: L;
  contactRole: string;
  recommended: Strategy;
  criteria: Criterion[];
}

// ---------- RÉFÉRENTIELS (identiques à la vraie app) ----------

const WEIGHTS: Record<CriterionKey, number> = {
  category: 25,
  geography: 18,
  price: 15,
  customer: 15,
  seasonality: 12,
  signals: 15,
};

const CRITERION_LABELS: Record<CriterionKey, L> = {
  category: { fr: "Catégorie", en: "Category" },
  geography: { fr: "Géographie", en: "Geography" },
  price: { fr: "Positionnement prix", en: "Price positioning" },
  customer: { fr: "Profil client", en: "Customer profile" },
  seasonality: { fr: "Saisonnalité", en: "Seasonality" },
  signals: { fr: "Signaux marketplace", en: "Marketplace signals" },
};

const METHOD_OPTIONS: Array<{ value: MethodKey; label: L }> = [
  { value: "email_sequence", label: { fr: "Séquence email", en: "Email sequence" } },
  { value: "linkedin_email", label: { fr: "LinkedIn + email", en: "LinkedIn + email" } },
  { value: "partner_intro", label: { fr: "Intro partenaire", en: "Partner intro" } },
  { value: "seasonal_push", label: { fr: "Push saisonnier", en: "Seasonal push" } },
];

const ANGLE_OPTIONS: Array<{ value: AngleKey; label: L }> = [
  { value: "market_fit", label: { fr: "Market fit", en: "Market fit" } },
  { value: "roi", label: { fr: "ROI", en: "ROI" } },
  { value: "social_proof", label: { fr: "Preuve sociale", en: "Social proof" } },
  { value: "competitive_gap", label: { fr: "Gap concurrentiel", en: "Competitive gap" } },
  { value: "seasonal_window", label: { fr: "Fenêtre saisonnière", en: "Seasonal window" } },
];

const SEASON_OPTIONS: Array<{ value: SeasonKey; label: L }> = [
  { value: "always_on", label: { fr: "Always on", en: "Always on" } },
  { value: "black_friday", label: { fr: "Black Friday", en: "Black Friday" } },
  { value: "holiday_gifting", label: { fr: "Cadeaux de fin d'année", en: "Holiday gifting" } },
  { value: "back_to_school", label: { fr: "Rentrée", en: "Back to school" } },
  { value: "summer_sale", label: { fr: "Soldes d'été", en: "Summer sale" } },
  { value: "fashion_drop", label: { fr: "Fashion drop", en: "Fashion drop" } },
];

// ---------- SELLERS MOCKÉS ----------

const SELLERS: SellerProfile[] = [
  {
    key: "como",
    name: "Atelier Como",
    pitch: {
      fr: "Maroquinerie premium DTC · Milan",
      en: "Premium DTC leather goods · Milan",
    },
    country: "IT",
    flag: "🇮🇹",
    topMarketplace: "Galeries Lafayette",
    totalScore: 91,
    roi: {
      fr: "≈ +62 k€ GMV sur 6 mois (catalogue premium, panier moyen 180 €)",
      en: "≈ +€62k GMV over 6 months (premium catalog, €180 AOV)",
    },
    contactRole: "Head of Marketplace",
    recommended: {
      method: "partner_intro",
      angle: "market_fit",
      season: "holiday_gifting",
    },
    criteria: [
      {
        key: "category",
        score: 96,
        reason: {
          fr: "Accessoires cuir = catégorie prioritaire de l'opérateur",
          en: "Leather accessories = operator's priority category",
        },
      },
      {
        key: "geography",
        score: 88,
        reason: {
          fr: "Italie dans les pays préférés, livraison UE déjà en place",
          en: "Italy in preferred countries, EU shipping already live",
        },
      },
      {
        key: "price",
        score: 94,
        reason: {
          fr: "Premium 120-300 € aligné sur le positionnement vitrine",
          en: "Premium €120-300 aligned with the storefront positioning",
        },
      },
      {
        key: "customer",
        score: 90,
        reason: {
          fr: "Clientèle urbaine CSP+ : recouvrement fort avec l'audience",
          en: "Affluent urban customers: strong audience overlap",
        },
      },
      {
        key: "seasonality",
        score: 92,
        reason: {
          fr: "Pic cadeaux Q4 très marqué — fenêtre idéale",
          en: "Strong Q4 gifting peak — ideal window",
        },
      },
      {
        key: "signals",
        score: 84,
        reason: {
          fr: "Domaine enrichissable + présence Amazon détectée : maturité e-commerce prouvée",
          en: "Enrichable domain + Amazon presence detected: proven e-commerce maturity",
        },
      },
    ],
  },
  {
    key: "nordic",
    name: "Nordic Trail",
    pitch: {
      fr: "Vêtements outdoor techniques · Stockholm",
      en: "Technical outdoor apparel · Stockholm",
    },
    country: "SE",
    flag: "🇸🇪",
    topMarketplace: "Zalando",
    totalScore: 84,
    roi: {
      fr: "≈ +95 k€ GMV sur 6 mois (catalogue large, forte rotation été)",
      en: "≈ +€95k GMV over 6 months (deep catalog, high summer velocity)",
    },
    contactRole: "E-commerce Director",
    recommended: {
      method: "linkedin_email",
      angle: "roi",
      season: "summer_sale",
    },
    criteria: [
      {
        key: "category",
        score: 82,
        reason: {
          fr: "Sport/outdoor accepté, pas prioritaire — match partiel mots-clés",
          en: "Sport/outdoor accepted, not priority — partial keyword match",
        },
      },
      {
        key: "geography",
        score: 95,
        reason: {
          fr: "Suède + hub logistique DE : zone préférée de la marketplace",
          en: "Sweden + DE logistics hub: marketplace's preferred zone",
        },
      },
      {
        key: "price",
        score: 78,
        reason: {
          fr: "Mid-range 60-140 € : accepté, légèrement au-dessus du cœur",
          en: "Mid-range €60-140: accepted, slightly above the core",
        },
      },
      {
        key: "customer",
        score: 76,
        reason: {
          fr: "Cible sportive 25-45 ans, recouvrement correct",
          en: "Active 25-45 target, decent overlap",
        },
      },
      {
        key: "seasonality",
        score: 88,
        reason: {
          fr: "Bi-saisonnier été/hiver, sell-through élevé en soldes",
          en: "Summer/winter bi-seasonal, high sell-through in sales",
        },
      },
      {
        key: "signals",
        score: 85,
        reason: {
          fr: "Déjà actif sur Amazon DE (600+ produits) : opérations marketplace rodées",
          en: "Already live on Amazon DE (600+ products): proven marketplace operations",
        },
      },
    ],
  },
  {
    key: "minimoi",
    name: "Mini & Moi",
    pitch: {
      fr: "Mode enfant éco-conçue · Nantes",
      en: "Eco-designed kidswear · Nantes",
    },
    country: "FR",
    flag: "🇫🇷",
    topMarketplace: "La Redoute",
    totalScore: 76,
    roi: {
      fr: "≈ +28 k€ GMV sur 6 mois (panier 45 €, volume rentrée)",
      en: "≈ +€28k GMV over 6 months (€45 AOV, back-to-school volume)",
    },
    contactRole: "Founder/CEO",
    recommended: {
      method: "email_sequence",
      angle: "competitive_gap",
      season: "back_to_school",
    },
    criteria: [
      {
        key: "category",
        score: 84,
        reason: {
          fr: "Mode enfant = catégorie en développement actif chez l'opérateur",
          en: "Kidswear = actively growing category for the operator",
        },
      },
      {
        key: "geography",
        score: 88,
        reason: {
          fr: "France : marché domestique de la marketplace",
          en: "France: the marketplace's home market",
        },
      },
      {
        key: "price",
        score: 70,
        reason: {
          fr: "Entrée-milieu de gamme 25-60 € : accepté, marge serrée",
          en: "Entry-mid range €25-60: accepted, tight margin",
        },
      },
      {
        key: "customer",
        score: 80,
        reason: {
          fr: "Familles sensibles à l'éco-conception : segment porteur",
          en: "Eco-minded families: growing segment",
        },
      },
      {
        key: "seasonality",
        score: 86,
        reason: {
          fr: "Pic rentrée scolaire net + réassort Noël",
          en: "Clear back-to-school peak + Christmas restock",
        },
      },
      {
        key: "signals",
        score: 42,
        reason: {
          fr: "Peu de signaux externes : pas de présence Amazon, enrichissement requis",
          en: "Few external signals: no Amazon presence, enrichment required",
        },
      },
    ],
  },
];

// ---------- GÉNÉRATION DES EMAILS (pilotée par la stratégie) ----------

interface DraftEmail {
  timing: L;
  subject: string;
  body: string;
}

// Accroche du mail 1 selon l'angle — c'est ici que la stratégie réécrit le texte.
const ANGLE_HOOKS: Record<AngleKey, (s: SellerProfile, lang: Lang) => string> = {
  market_fit: (s, lang) =>
    tr(
      lang,
      `nos données montrent un alignement fort entre ${s.name} et ${s.topMarketplace} : catégorie, géographie et positionnement prix convergent (fit ${s.totalScore}/100).`,
      `our data shows a strong alignment between ${s.name} and ${s.topMarketplace}: category, geography and price positioning all converge (${s.totalScore}/100 fit).`,
    ),
  roi: (s, lang) =>
    tr(
      lang,
      `en projetant votre catalogue sur ${s.topMarketplace}, nous estimons ${pick(lang, s.roi)} — sans coût d'acquisition supplémentaire.`,
      `projecting your catalog onto ${s.topMarketplace}, we estimate ${pick(lang, s.roi)} — with no extra acquisition cost.`,
    ),
  social_proof: (s, lang) =>
    tr(
      lang,
      `des marques au profil très proche de ${s.name} réalisent déjà 15-25 % de leur GMV via ${s.topMarketplace} — les signaux de traction sont comparables.`,
      `brands with a profile very close to ${s.name} already drive 15-25% of their GMV through ${s.topMarketplace} — traction signals are comparable.`,
    ),
  competitive_gap: (s, lang) =>
    tr(
      lang,
      `vos concurrents directs sont déjà visibles sur ${s.topMarketplace} — chaque mois d'absence est de la part de marché laissée sur la table.`,
      `your direct competitors are already visible on ${s.topMarketplace} — every month of absence is market share left on the table.`,
    ),
  seasonal_window: (s, lang) =>
    tr(
      lang,
      `la prochaine fenêtre commerciale sur ${s.topMarketplace} s'ouvre dans quelques semaines : onboarder maintenant, c'est être en ligne au pic de demande.`,
      `the next commercial window on ${s.topMarketplace} opens in a few weeks: onboarding now means being live at peak demand.`,
    ),
};

const SEASON_LINES: Record<SeasonKey, L | null> = {
  always_on: null,
  black_friday: {
    fr: "Le Black Friday concentre une part majeure du trafic annuel : votre catalogue promo y serait directement exposé.",
    en: "Black Friday concentrates a major share of yearly traffic: your promo catalog would be directly exposed.",
  },
  holiday_gifting: {
    fr: "La saison des cadeaux de fin d'année est le moment où votre catégorie surperforme le plus sur la plateforme.",
    en: "The holiday gifting season is when your category over-performs the most on the platform.",
  },
  back_to_school: {
    fr: "La rentrée est le pic naturel de votre catégorie : c'est la fenêtre que nous recommandons pour le lancement.",
    en: "Back-to-school is your category's natural peak: it's the launch window we recommend.",
  },
  summer_sale: {
    fr: "Les soldes d'été maximisent le sell-through des catalogues profonds comme le vôtre.",
    en: "Summer sales maximize sell-through for deep catalogs like yours.",
  },
  fashion_drop: {
    fr: "Le rythme de drops de la plateforme colle à vos lancements capsules.",
    en: "The platform's drop cadence fits your capsule launches.",
  },
};

const METHOD_CTA: Record<MethodKey, L> = {
  email_sequence: {
    fr: "Seriez-vous disponible 20 minutes cette semaine pour en parler ?",
    en: "Would you have 20 minutes this week to discuss it?",
  },
  linkedin_email: {
    fr: "Je vous ai également envoyé une invitation LinkedIn pour échanger plus directement.",
    en: "I've also sent you a LinkedIn invite for a more direct chat.",
  },
  partner_intro: {
    fr: "Notre équipe partenaire peut faire l'introduction directement auprès de l'opérateur — je peux l'activer dès votre retour.",
    en: "Our partner team can make a direct introduction to the operator — I can trigger it as soon as you reply.",
  },
  seasonal_push: {
    fr: "Le calendrier est serré pour être en ligne avant le pic : je vous propose un créneau dès cette semaine.",
    en: "The timeline is tight to be live before the peak: I suggest a slot as early as this week.",
  },
};

function buildSequence(
  s: SellerProfile,
  strat: Strategy,
  lang: Lang,
): DraftEmail[] {
  const hook = ANGLE_HOOKS[strat.angle](s, lang);
  const seasonLine = SEASON_LINES[strat.season];
  const cta = pick(lang, METHOD_CTA[strat.method]);
  const angleLabel = pick(
    lang,
    ANGLE_OPTIONS.find((a) => a.value === strat.angle)!.label,
  );
  const greet = tr(lang, "Bonjour,", "Hi,");
  const sign = tr(
    lang,
    "Bien à vous,\nL'équipe Marketplace",
    "Best regards,\nThe Marketplace team",
  );

  return [
    {
      timing: { fr: "J0 — Premier contact", en: "D0 — First touch" },
      subject: tr(
        lang,
        `${s.name} × ${s.topMarketplace} : ${angleLabel.toLowerCase()}`,
        `${s.name} × ${s.topMarketplace}: ${angleLabel.toLowerCase()}`,
      ),
      body: [
        greet,
        "",
        tr(lang, `En un mot : ${hook}`, `In short: ${hook}`),
        ...(seasonLine ? ["", pick(lang, seasonLine)] : []),
        "",
        cta,
        "",
        sign,
      ].join("\n"),
    },
    {
      timing: { fr: "J+5 — Relance ROI", en: "D+5 — ROI follow-up" },
      subject: tr(
        lang,
        `${s.name} : le chiffrage derrière le score ${s.totalScore}/100`,
        `${s.name}: the numbers behind the ${s.totalScore}/100 score`,
      ),
      body: [
        greet,
        "",
        tr(
          lang,
          `Pour donner de la matière à mon précédent message : ${pick(lang, s.roi)}. Le score de ${s.totalScore}/100 repose sur 6 critères pondérés — les deux plus forts pour vous : ${pick(lang, CRITERION_LABELS[topTwo(s)[0]])} et ${pick(lang, CRITERION_LABELS[topTwo(s)[1]])}.`,
          `To back up my previous note: ${pick(lang, s.roi)}. The ${s.totalScore}/100 score is built on 6 weighted criteria — your two strongest: ${pick(lang, CRITERION_LABELS[topTwo(s)[0]])} and ${pick(lang, CRITERION_LABELS[topTwo(s)[1]])}.`,
        ),
        "",
        tr(
          lang,
          "Je peux partager le détail du scoring en 15 minutes.",
          "I can walk you through the full scoring in 15 minutes.",
        ),
        "",
        sign,
      ].join("\n"),
    },
    {
      timing: { fr: "J+12 — Closing", en: "D+12 — Closing" },
      subject: tr(
        lang,
        `${s.name} : bon timing pour avancer ?`,
        `${s.name}: right timing to move forward?`,
      ),
      body: [
        greet,
        "",
        tr(
          lang,
          `Dernier message de ma part : si le timing est bon, nous pouvons cadrer un pilote sur ${s.topMarketplace} (onboarding accompagné, catalogue test, revue à 60 jours).`,
          `Last note from me: if the timing works, we can scope a pilot on ${s.topMarketplace} (guided onboarding, test catalog, 60-day review).`,
        ),
        ...(seasonLine ? ["", pick(lang, seasonLine)] : []),
        "",
        sign,
      ].join("\n"),
    },
  ];
}

function topTwo(s: SellerProfile): [CriterionKey, CriterionKey] {
  const sorted = [...s.criteria].sort((a, b) => b.score - a.score);
  return [sorted[0].key, sorted[1].key];
}

function priorityBadge(score: number, lang: Lang): { label: string; color: string } {
  if (score >= 88) return { label: tr(lang, "P1 · Chaud", "P1 · Hot"), color: PALETTE.teal };
  if (score >= 75) return { label: tr(lang, "P2 · Tiède", "P2 · Warm"), color: PALETTE.gold };
  return { label: tr(lang, "P3 · À nourrir", "P3 · Nurture"), color: PALETTE.coral };
}

// ---------- UI ----------

function SectionTitle({ index, children }: { index: string; children: React.ReactNode }) {
  return (
    <p
      className="mono uppercase text-[10px] tracking-[0.3em] mb-3"
      style={{ color: PALETTE.textDim }}
    >
      <span style={{ color: PALETTE.orange }}>§ {index}</span> · {children}
    </p>
  );
}

function CriterionRow({ c, lang }: { c: Criterion; lang: Lang }) {
  const color = scoreColor(c.score);
  return (
    <div className="py-2" style={{ borderBottom: `1px solid ${PALETTE.border}` }}>
      <div className="flex items-baseline justify-between gap-2 mb-1">
        <span className="flex items-baseline gap-2 min-w-0">
          <span
            className="mono uppercase text-[10px] tracking-widest"
            style={{ color: PALETTE.text }}
          >
            {pick(lang, CRITERION_LABELS[c.key])}
          </span>
          <span
            className="mono text-[9px] shrink-0"
            style={{ color: PALETTE.textMuted }}
          >
            ×{WEIGHTS[c.key]}%
          </span>
        </span>
        <span style={{ color, fontSize: 13, fontWeight: 600 }}>{c.score}</span>
      </div>
      <div
        className="rounded-full overflow-hidden mb-1"
        style={{ height: 3, background: "rgba(255,255,255,0.06)" }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${c.score}%` }}
          transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
          style={{ height: "100%", background: color }}
        />
      </div>
      <p className="text-[11.5px]" style={{ color: PALETTE.textDim }}>
        ↳ {pick(lang, c.reason)}
      </p>
    </div>
  );
}

function StrategySelect<T extends string>({
  label,
  value,
  options,
  recommended,
  onChange,
  lang,
}: {
  label: string;
  value: T;
  options: Array<{ value: T; label: L }>;
  recommended: T;
  onChange: (v: T) => void;
  lang: Lang;
}) {
  return (
    <label className="block min-w-0">
      <span
        className="mono uppercase text-[9px] tracking-widest block mb-1"
        style={{ color: PALETTE.textMuted }}
      >
        {label}
        {value === recommended && (
          <span style={{ color: PALETTE.teal }}> · reco</span>
        )}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="w-full rounded-md px-2 py-1.5 text-[12px] outline-none"
        style={{
          background: PALETTE.surfaceAlt,
          border: `1px solid ${PALETTE.borderStrong}`,
          color: PALETTE.text,
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} style={{ color: "#111" }}>
            {pick(lang, o.label)}
            {o.value === recommended
              ? tr(lang, " (reco moteur)", " (engine pick)")
              : ""}
          </option>
        ))}
      </select>
    </label>
  );
}

function EmailCard({
  email,
  index,
  seller,
  lang,
}: {
  email: DraftEmail;
  index: number;
  seller: SellerProfile;
  lang: Lang;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.12 * index }}
      className="rounded-lg overflow-hidden"
      style={{ background: PALETTE.surfaceAlt, border: `1px solid ${PALETTE.border}` }}
    >
      <div
        className="px-3 py-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1"
        style={{ borderBottom: `1px solid ${PALETTE.border}` }}
      >
        <span
          className="mono uppercase text-[9px] tracking-widest"
          style={{ color: PALETTE.orange }}
        >
          {pick(lang, email.timing)}
        </span>
        <span
          className="mono uppercase text-[9px] tracking-widest"
          style={{ color: PALETTE.textMuted }}
        >
          → {seller.contactRole} · {tr(lang, "brouillon", "draft")} ✓
        </span>
      </div>
      <div className="px-3 py-3">
        <p
          className="font-semibold text-[13px] mb-2 break-words"
          style={{ color: PALETTE.text }}
        >
          {email.subject}
        </p>
        <pre
          className="text-[12.5px] whitespace-pre-wrap break-words"
          style={{
            color: PALETTE.textDim,
            fontFamily: "Georgia, ui-serif, serif",
            lineHeight: 1.55,
          }}
        >
          {email.body}
        </pre>
      </div>
    </motion.div>
  );
}

// ---------- ROOT ----------

export function MiraklMiniApp() {
  const { lang } = useLang();
  const [sellerKey, setSellerKey] = useState<string>(SELLERS[0].key);
  const [scored, setScored] = useState(false);
  const [scoring, setScoring] = useState(false);
  const [strategy, setStrategy] = useState<Strategy>(SELLERS[0].recommended);
  const [emailState, setEmailState] = useState<"idle" | "writing" | "done">("idle");

  const seller = SELLERS.find((s) => s.key === sellerKey)!;
  const badge = priorityBadge(seller.totalScore, lang);

  const selectSeller = (key: string) => {
    const next = SELLERS.find((s) => s.key === key)!;
    setSellerKey(key);
    setScored(false);
    setScoring(false);
    setStrategy(next.recommended);
    setEmailState("idle");
  };

  const runScoring = () => {
    setScoring(true);
    setEmailState("idle");
    setTimeout(() => {
      setScoring(false);
      setScored(true);
    }, 900);
  };

  const patchStrategy = (patch: Partial<Strategy>) => {
    setStrategy((s) => ({ ...s, ...patch }));
    // La séquence dépend de la stratégie : on la régénère si déjà affichée.
    if (emailState === "done") {
      setEmailState("writing");
      setTimeout(() => setEmailState("done"), 500);
    }
  };

  const generateEmails = () => {
    if (emailState === "done") {
      setEmailState("idle");
      return;
    }
    setEmailState("writing");
    setTimeout(() => setEmailState("done"), 900);
  };

  const emails = buildSequence(seller, strategy, lang);

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: PALETTE.bg,
        border: `1px solid ${PALETTE.border}`,
        boxShadow:
          "0 18px 50px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.04)",
        fontFamily: "var(--font-mono, 'Inter'), ui-sans-serif, system-ui",
        color: PALETTE.text,
      }}
    >
      {/* Topbar */}
      <div
        className="flex flex-wrap items-center justify-between gap-y-2 px-5 py-3"
        style={{ borderBottom: `1px solid ${PALETTE.border}` }}
      >
        <div className="flex items-center gap-2">
          <span
            aria-hidden
            style={{
              width: 8,
              height: 8,
              borderRadius: 999,
              background: PALETTE.orange,
              boxShadow: `0 0 10px ${PALETTE.orange}`,
            }}
          />
          <span
            className="mono uppercase text-[10px] tracking-[0.3em]"
            style={{ color: PALETTE.textDim }}
          >
            Mirakl Prospector
          </span>
          <span style={{ color: PALETTE.orange, fontSize: 10 }}>·</span>
          <span
            className="mono uppercase text-[10px] tracking-[0.3em]"
            style={{ color: PALETTE.textDim }}
          >
            {tr(lang, "démo", "demo")}
          </span>
        </div>
        <span
          className="mono uppercase text-[9px] tracking-widest"
          style={{ color: PALETTE.textMuted }}
        >
          scoring → {tr(lang, "stratégie", "strategy")} → emails
        </span>
      </div>

      {/* Seller selector — 3 profils mockés, aucun input libre */}
      <div
        className="px-5 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
        style={{ borderBottom: `1px solid ${PALETTE.border}` }}
      >
        <span
          className="mono uppercase text-[10px] tracking-[0.3em]"
          style={{ color: PALETTE.textDim }}
        >
          {tr(lang, "Seller à prospecter", "Seller to prospect")}
        </span>
        <div className="flex flex-wrap gap-1.5">
          {SELLERS.map((s) => {
            const active = s.key === sellerKey;
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => selectSeller(s.key)}
                className="mono uppercase text-[10px] tracking-widest px-2.5 py-1 rounded-md transition-colors"
                style={{
                  color: active ? PALETTE.orange : PALETTE.textDim,
                  background: active ? "rgba(255,122,69,0.10)" : "transparent",
                  border: `1px solid ${active ? `${PALETTE.orange}55` : PALETTE.border}`,
                }}
              >
                {s.flag} {s.name}
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-5 py-4 space-y-5">
        {/* Cible + lancer le scoring */}
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="mono text-[11px] px-3 py-1.5 rounded-md"
            style={{
              background: PALETTE.surfaceAlt,
              border: `1px solid ${PALETTE.border}`,
              color: PALETTE.textDim,
            }}
          >
            {seller.name} · {pick(lang, seller.pitch)}
          </span>
          <button
            type="button"
            onClick={runScoring}
            disabled={scoring}
            className="mono uppercase text-[10px] tracking-widest px-3 py-1.5 rounded-md"
            style={{
              color: scored ? PALETTE.orange : PALETTE.bg,
              background: scored ? "transparent" : PALETTE.orange,
              border: `1px solid ${PALETTE.orange}`,
              cursor: scoring ? "wait" : "pointer",
              opacity: scoring ? 0.65 : 1,
              fontWeight: 600,
            }}
          >
            {scoring
              ? tr(lang, "Scoring en cours…", "Scoring…")
              : scored
                ? tr(lang, "Relancer le scoring", "Re-run scoring")
                : tr(lang, "Lancer le scoring", "Run scoring")}
          </button>
        </div>

        <AnimatePresence mode="wait">
          {scored && (
            <motion.div
              key={`scored-${seller.key}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* § 01 — Scoring : 6 critères pondérés */}
              <div>
                <SectionTitle index="01">
                  {tr(lang, "Scoring · 6 critères pondérés", "Scoring · 6 weighted criteria")}
                </SectionTitle>
                <div
                  className="rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3"
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
                      {tr(lang, "Meilleur match", "Top match")}
                    </p>
                    <p
                      className="font-bold mt-1"
                      style={{ color: PALETTE.text, fontSize: 18 }}
                    >
                      {seller.topMarketplace}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className="mono uppercase text-[9px] tracking-widest px-2 py-1 rounded-full"
                      style={{ color: badge.color, border: `1px solid ${badge.color}55` }}
                    >
                      {badge.label}
                    </span>
                    <p className="font-bold" style={{ fontSize: 30, lineHeight: 1 }}>
                      <span style={{ color: scoreColor(seller.totalScore) }}>
                        {seller.totalScore}
                      </span>
                      <span style={{ color: PALETTE.textMuted, fontSize: 16 }}>/100</span>
                    </p>
                  </div>
                </div>
                <div
                  className="rounded-xl px-4 py-1"
                  style={{
                    background: PALETTE.surface,
                    border: `1px solid ${PALETTE.border}`,
                  }}
                >
                  {seller.criteria.map((c) => (
                    <CriterionRow key={c.key} c={c} lang={lang} />
                  ))}
                </div>
              </div>

              {/* § 02 — Stratégie recommandée, éditable */}
              <div>
                <SectionTitle index="02">
                  {tr(
                    lang,
                    "Stratégie d'approche — recommandée par le moteur, ajustable",
                    "Outreach strategy — engine-recommended, adjustable",
                  )}
                </SectionTitle>
                <div
                  className="rounded-xl p-4 space-y-3"
                  style={{
                    background: PALETTE.surface,
                    border: `1px solid ${PALETTE.border}`,
                  }}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <StrategySelect
                      label={tr(lang, "Méthode", "Method")}
                      value={strategy.method}
                      options={METHOD_OPTIONS}
                      recommended={seller.recommended.method}
                      onChange={(method) => patchStrategy({ method })}
                      lang={lang}
                    />
                    <StrategySelect
                      label="Angle"
                      value={strategy.angle}
                      options={ANGLE_OPTIONS}
                      recommended={seller.recommended.angle}
                      onChange={(angle) => patchStrategy({ angle })}
                      lang={lang}
                    />
                    <StrategySelect
                      label={tr(lang, "Saisonnalité", "Seasonality")}
                      value={strategy.season}
                      options={SEASON_OPTIONS}
                      recommended={seller.recommended.season}
                      onChange={(season) => patchStrategy({ season })}
                      lang={lang}
                    />
                  </div>
                  <p className="text-[11.5px]" style={{ color: PALETTE.textMuted }}>
                    ↳{" "}
                    {tr(
                      lang,
                      `Contact à cibler : ${seller.contactRole}. Changez l'angle ou la saisonnalité — la séquence est réécrite en conséquence.`,
                      `Contact to target: ${seller.contactRole}. Change the angle or seasonality — the sequence is rewritten accordingly.`,
                    )}
                  </p>
                </div>
              </div>

              {/* § 03 — Séquence email personnalisée */}
              <div>
                <SectionTitle index="03">
                  {tr(
                    lang,
                    "Séquence hyper-personnalisée · 3 temps",
                    "Hyper-personalized sequence · 3 touches",
                  )}
                </SectionTitle>
                <button
                  type="button"
                  onClick={generateEmails}
                  disabled={emailState === "writing"}
                  className="mono uppercase text-[10px] tracking-widest px-3 py-1.5 rounded-md mb-3"
                  style={{
                    color: emailState === "done" ? PALETTE.orange : PALETTE.bg,
                    background: emailState === "done" ? "transparent" : PALETTE.orange,
                    border: `1px solid ${PALETTE.orange}`,
                    cursor: emailState === "writing" ? "wait" : "pointer",
                    opacity: emailState === "writing" ? 0.65 : 1,
                    fontWeight: 600,
                  }}
                >
                  {emailState === "writing"
                    ? tr(lang, "Rédaction en cours…", "Drafting…")
                    : emailState === "done"
                      ? tr(lang, "Masquer la séquence", "Hide sequence")
                      : tr(lang, "Générer la séquence (3 emails)", "Generate sequence (3 emails)")}
                </button>
                <AnimatePresence initial={false} mode="wait">
                  {emailState === "done" && (
                    <motion.div
                      key={`${strategy.method}-${strategy.angle}-${strategy.season}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-3"
                    >
                      {emails.map((e, i) => (
                        <EmailCard
                          key={`${pick(lang, e.timing)}-${i}`}
                          email={e}
                          index={i}
                          seller={seller}
                          lang={lang}
                        />
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
