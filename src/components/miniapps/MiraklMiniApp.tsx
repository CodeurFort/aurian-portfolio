"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLang, tr } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";

// Mini-app Mirakl — démo visuelle d'un moteur de matching sellers ↔ marketplaces.
// L'utilisateur choisit une marketplace parmi 5 ; on lui sort les 3 meilleurs
// matchs (vendeurs mockés) avec un score global + 3 critères qui varient
// par marketplace, et on génère à la demande un email BDR personnalisé pour
// chaque cas. 100% mock — pas de clé API, simulation d'un faux délai.

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

type MarketplaceKey =
  | "cdiscount"
  | "manomano"
  | "decathlon"
  | "maisons"
  | "galeries";

type Criteria = { cat: number; logi: number; marge: number };

type Vendor = {
  name: string;
  pitch: string;
  score: number;
  criteria: Criteria;
  why: string;
  email: { subject: string; body: string };
};

type Marketplace = {
  label: string;
  vertical: string;
  audience: string;
  bdr: string;
  matches: [Vendor, Vendor, Vendor];
};

const scoreColor = (v: number) =>
  v >= 85 ? PALETTE.teal : v >= 70 ? PALETTE.gold : PALETTE.coral;

// ---------- MOCK DATASETS ----------
// 5 marketplaces, top-3 vendeurs par marketplace. Les mêmes vendeurs peuvent
// apparaître ailleurs avec des scores différents — c'est l'effet recherché :
// un même catalogue se positionne différemment selon le contexte.

const MARKETPLACES_FR: Record<MarketplaceKey, Marketplace> = {
  cdiscount: {
    label: "Cdiscount Pro",
    vertical: "Généraliste B2C",
    audience: "Mass-market FR · 23M visiteurs/mois",
    bdr: "Camille Roux",
    matches: [
      {
        name: "KitchenWise",
        pitch: "Petit électroménager design accessible",
        score: 91,
        criteria: { cat: 94, logi: 92, marge: 86 },
        why: "Catalogue prêt à scaler · prix sweet-spot 39-89€ · flux EDI déjà OK.",
        email: {
          subject:
            "KitchenWise × Cdiscount : 18M de foyers attendent vos blenders",
          body: `Bonjour Sébastien,

Je suis Camille Roux, BDR partenariats Cdiscount Pro. J'ai analysé votre catalogue KitchenWise et il coche les trois cases qui font qu'on vend bien chez nous : ticket moyen 49€, ratio fiche produit / images excellent, et une logistique déjà industrialisée.

Concrètement, sur votre catégorie petit électro, on tourne à 18M de sessions/mois avec un panier moyen de 62€. Vos 4 best-sellers (blender, hachoir, friteuse à air) sont sur des requêtes où Cdiscount capte 31% du trafic FR — donc forte visibilité dès l'onboarding.

Je peux vous bloquer 20 min cette semaine pour vous montrer un projection volumétrique sur vos 12 prochains mois sur la plateforme. Mardi 14h ou jeudi 10h ?

Camille Roux
Business Developer · Cdiscount Pro`,
        },
      },
      {
        name: "ToolMaster",
        pitch: "Outillage électroportatif semi-pro",
        score: 84,
        criteria: { cat: 88, logi: 82, marge: 81 },
        why: "Volume FR colossal sur outillage · risque retours élevé à arbitrer.",
        email: {
          subject:
            "ToolMaster : 2.1M de recherches outillage sur Cdiscount en T1",
          body: `Bonjour Mathieu,

Camille Roux côté Cdiscount Pro. Votre positionnement « semi-pro à prix grand public » est exactement ce que cherchent les bricoleurs avancés qui composent 38% de notre audience outillage.

Sur le dernier trimestre, 2.1M de requêtes sur les catégories perceuses / visseuses / meuleuses, avec un taux de conversion 22% au-dessus de la moyenne marketplace. Vos références ToolMaster T-Series rentreraient direct dans le top 15.

On peut aborder ensemble la question des retours (point bloquant historique sur la catégorie) avec notre offre logistique mutualisée. 20 min pour vous projeter ?

Camille Roux
Business Developer · Cdiscount Pro`,
        },
      },
      {
        name: "Eco-Forge",
        pitch: "Quincaillerie écoresponsable",
        score: 72,
        criteria: { cat: 79, logi: 68, marge: 71 },
        why: "Belle marque mais positionnement vert moins rentable sur du mass-market.",
        email: {
          subject: "Eco-Forge : votre quincaillerie durable, notre audience RSE",
          body: `Bonjour Léa,

Camille Roux, Cdiscount Pro. Le segment éco-responsable explose chez nous : +47% YoY sur les requêtes intégrant « durable », « réparable » ou « français ». Eco-Forge a une crédibilité forte sur ces critères.

Je suis honnête : votre positionnement premium va vous demander un travail de contenu produit plus poussé que la moyenne pour convertir. En contrepartie, on observe sur ces marques une fidélisation client x2.4 vs la moyenne.

J'ai un cas comparable à vous partager (vendeur arrivé en septembre, déjà rentable). Un café visio 25 min ?

Camille Roux
Business Developer · Cdiscount Pro`,
        },
      },
    ],
  },

  manomano: {
    label: "ManoMano",
    vertical: "Bricolage · jardin · DIY",
    audience: "Bricoleurs · jardiniers FR/EU · 7M actifs",
    bdr: "Yanis Belkacem",
    matches: [
      {
        name: "ToolMaster",
        pitch: "Outillage électroportatif semi-pro",
        score: 96,
        criteria: { cat: 98, logi: 94, marge: 95 },
        why: "Match parfait : audience pro/avancée + catalogue cœur de cible.",
        email: {
          subject: "ToolMaster : ManoMano = vos 6 best-sellers en top 10",
          body: `Bonjour Mathieu,

Yanis Belkacem, BDR ManoMano. Je vais aller droit au but : sur les 6 références ToolMaster que j'ai analysées, 5 figureraient dans le top 10 de leur sous-catégorie chez nous au premier mois.

Notre audience est à 64% pro / bricoleurs avancés, c'est exactement le profil qui achète du semi-pro. Notre panier moyen outillage = 138€, contre 47€ en moyenne marketplace généraliste — donc vous y gagnez en marge, pas seulement en volume.

Notre offre logistique « ManoFulfillment » couvre le J+2 sur 92% du territoire. Je vous propose un kick-off d'onboarding accéléré : 30 jours, livré.

Quand pouvons-nous caler 20 min ?

Yanis Belkacem
BDR Sellers · ManoMano`,
        },
      },
      {
        name: "Eco-Forge",
        pitch: "Quincaillerie écoresponsable",
        score: 89,
        criteria: { cat: 91, logi: 84, marge: 92 },
        why: "Tendance « bricolage durable » en pic · marge premium tenue.",
        email: {
          subject: "Eco-Forge × ManoMano : le bricolage durable cherche son champion",
          body: `Bonjour Léa,

Yanis Belkacem côté ManoMano. Je suis le segment « éco-responsable bricolage » depuis 18 mois et je peux vous le dire : Eco-Forge serait le 2ᵉ acteur structuré sur la catégorie chez nous, derrière un seul concurrent que vous battez sur la profondeur de gamme.

Recherches « visserie inox française » : +63% YoY. Recherches « quincaillerie réparable » : +44%. Et le panier moyen de cette niche est de 78€ vs 41€ en non-engagé.

J'ai préparé un mini-business plan : top 20 refs à prioriser + prévisions trimestrielles. 25 min cette semaine pour vous le présenter ?

Yanis Belkacem
BDR Sellers · ManoMano`,
        },
      },
      {
        name: "Maison Lupin",
        pitch: "Luminaires artisanaux",
        score: 73,
        criteria: { cat: 76, logi: 71, marge: 72 },
        why: "Marque belle mais luminaires hors-coeur jardinage / outillage.",
        email: {
          subject: "Maison Lupin : niche « lighting outdoor » en croissance",
          body: `Bonjour Camille,

Yanis Belkacem, ManoMano. Maison Lupin n'est pas un match évident à première vue — vos luminaires d'intérieur ne sont pas notre cœur. Mais votre ligne outdoor (appliques façade, suspensions terrasse) tape une catégorie où on a 1.4M de recherches/an mal couvertes.

Si vous êtes prêts à scinder votre catalogue et à ne lister chez nous que la sous-collection extérieure, je pense qu'on peut faire quelque chose d'intéressant sans cannibaliser vos autres canaux.

J'aimerais vous présenter le projet de niche. 20 min suffisent.

Yanis Belkacem
BDR Sellers · ManoMano`,
        },
      },
    ],
  },

  decathlon: {
    label: "Decathlon Marketplace",
    vertical: "Sport · outdoor",
    audience: "Sportifs amateurs + experts · 14M visiteurs FR/mois",
    bdr: "Théo Vasseur",
    matches: [
      {
        name: "Strider Outdoor",
        pitch: "Équipement bivouac · trek montagne",
        score: 94,
        criteria: { cat: 96, logi: 89, marge: 93 },
        why: "Audience trek/bivouac sous-servie · marge préservée sur technique.",
        email: {
          subject: "Strider × Decathlon : le trek technique cherche sa marque-référence",
          body: `Bonjour Sarah,

Théo Vasseur, Sellers Decathlon Marketplace. Decathlon est connu pour son entrée de gamme — mais sur le trek technique (tente 4 saisons, sac à dos 60L+, réchauds MSR-like), notre audience d'experts cherche des marques que nos MDD ne couvrent pas.

Strider Outdoor entrerait sur 12 sous-catégories où on a actuellement zéro vendeur premium structuré. Pour vous : visibilité massive auprès d'une audience qualifiée. Pour nous : montée en gamme de l'offre.

Notre programme « Marketplace Verified » garantit votre placement éditorial. Je vous propose un onboarding accompagné. 30 min cette semaine ?

Théo Vasseur
Senior BDR · Decathlon Marketplace`,
        },
      },
      {
        name: "ToolMaster",
        pitch: "Outillage électroportatif semi-pro",
        score: 67,
        criteria: { cat: 62, logi: 78, marge: 60 },
        why: "Catégorie marginale sur Decathlon · à n'envisager que sur outillage vélo.",
        email: {
          subject: "ToolMaster : pivot possible sur l'outillage vélo Decathlon ?",
          body: `Bonjour Mathieu,

Théo Vasseur, Decathlon Marketplace. Je ne vais pas vous vendre du rêve : votre catalogue généraliste outillage n'est pas alignée avec notre audience. Score de matching faible (67/100), je suis transparent.

Cela dit, votre sous-gamme « outillage vélo » (clés couple, démonte-pneus, dérive-chaîne) pourrait fonctionner sur notre segment cycle qui pèse 1.2Md€ annuels. C'est niche, mais c'est défendable.

Si vous voulez tester un scope réduit (15-20 refs), je peux vous monter un pilote 90 jours. 20 min pour cadrer ?

Théo Vasseur
Senior BDR · Decathlon Marketplace`,
        },
      },
      {
        name: "Arôme & Plant",
        pitch: "Cosmétique bio premium",
        score: 71,
        criteria: { cat: 68, logi: 82, marge: 64 },
        why: "Opportunité sur « après-sport » et soins runners à étudier.",
        email: {
          subject: "Arôme & Plant : la beauté du sportif, une catégorie à inventer",
          body: `Bonjour Inès,

Théo Vasseur, Decathlon Marketplace. À première vue Arôme & Plant n'a rien à faire chez Decathlon. À la réflexion, vos produits « régénération musculaire » et soin corps après-effort tapent une catégorie qu'on n'a encore jamais structurée.

3.4M de nos visiteurs cherchent « huile massage récup » chaque année. Aucun de nos vendeurs ne traite ce besoin avec un positionnement premium et bio. Vous, oui.

Je peux vous proposer un test sur 8 références. 25 min pour vous présenter la mécanique ?

Théo Vasseur
Senior BDR · Decathlon Marketplace`,
        },
      },
    ],
  },

  maisons: {
    label: "Maisons du Monde",
    vertical: "Décoration · lifestyle",
    audience: "30-50 ans CSP+ · décoration habitat · 9M visiteurs FR/mois",
    bdr: "Élise Dauphin",
    matches: [
      {
        name: "Solea Living",
        pitch: "Déco méditerranéenne artisanale",
        score: 93,
        criteria: { cat: 95, logi: 88, marge: 94 },
        why: "ADN parfaitement aligné · positionnement complémentaire à la MDD.",
        email: {
          subject:
            "Solea Living × Maisons du Monde : la Méditerranée nous manquait",
          body: `Bonjour Élena,

Élise Dauphin, partenariats Maisons du Monde. Notre étude saisonnière S/S 2026 fait remonter l'esthétique méditerranéenne comme tendance #1, et notre MDD ne couvre que la partie « bord de mer scandinavo-européen ». Il nous manque le sud authentique : céramique terracotta, fibres végétales travaillées main, étoffes naturelles…

Solea Living incarne ce manque. Vos collections coussins kilim et lampes en terre cuite seraient mises en avant dans notre lookbook printemps. Notre audience CSP+ paie le ticket moyen 119€ — votre positionnement tient.

Je vous propose un point pour explorer une co-création de capsule exclusive. 30 min ?

Élise Dauphin
Senior Buyer · Maisons du Monde`,
        },
      },
      {
        name: "Maison Lupin",
        pitch: "Luminaires artisanaux",
        score: 88,
        criteria: { cat: 92, logi: 81, marge: 90 },
        why: "Pièces fortes pour merchandising · faible cannibalisation MDD.",
        email: {
          subject:
            "Maison Lupin : vos luminaires, notre lookbook automne",
          body: `Bonjour Camille,

Élise Dauphin, Maisons du Monde. Vos suspensions « Lune » et « Halo » sont visuellement assez fortes pour porter une page univers entière dans notre catalogue automne. C'est rare. On a regardé en mood board, l'équipe création est unanime.

Sur le merchandising, nos pièces signature MDD sont à 89-149€ — vous êtes positionnés 30% au-dessus, ce qui valorise votre statut artisan sans nous cannibaliser. Tout le monde y gagne.

Je peux vous présenter notre offre vendeur premium + le projet de mise en avant. 25 min cette semaine ?

Élise Dauphin
Senior Buyer · Maisons du Monde`,
        },
      },
      {
        name: "Velour Atelier",
        pitch: "Prêt-à-porter féminin haut de gamme",
        score: 64,
        criteria: { cat: 58, logi: 72, marge: 63 },
        why: "Hors catégorie principale · à explorer uniquement via accessoires maison.",
        email: {
          subject:
            "Velour Atelier : votre savoir-faire textile sur nos linges de maison ?",
          body: `Bonjour Adrienne,

Élise Dauphin, Maisons du Monde. Velour Atelier n'a aucune raison d'être listé chez nous sur du prêt-à-porter — ce n'est pas notre métier et l'audience ne suit pas. Score honnête : 64/100.

Mais vos étoffes (le savoir-faire qui fait votre prêt-à-porter) appliquées à du linge de maison (housses de coussin, plaids, runners de table) seraient un excellent fit. C'est un canal nouveau pour vous, à moindre risque.

Si l'idée vous parle, je vous propose un atelier de scoping 45 min avec mon équipe achats textile. Dispo ?

Élise Dauphin
Senior Buyer · Maisons du Monde`,
        },
      },
    ],
  },

  galeries: {
    label: "Galeries Lafayette",
    vertical: "Premium fashion · beauté",
    audience: "Urbain CSP++ · 6M visiteurs FR · forte audience tourisme",
    bdr: "Anaïs Mercier",
    matches: [
      {
        name: "Velour Atelier",
        pitch: "Prêt-à-porter féminin haut de gamme",
        score: 92,
        criteria: { cat: 95, logi: 88, marge: 93 },
        why: "Storytelling marque + qualité matière · cible idéale flagship Haussmann.",
        email: {
          subject:
            "Velour Atelier : votre place est dans nos vitrines du 2ᵉ étage",
          body: `Bonjour Adrienne,

Anaïs Mercier, Buying Office Galeries Lafayette. J'ai découvert Velour Atelier via votre dernière collaboration éditoriale. La qualité de vos coupes et votre sourcing matières (Loro Piana, filatures italiennes premium) cochent toutes nos cases d'éligibilité « Marque Découverte ».

Notre programme « Sélection Créateurs » retient 12 marques émergentes par saison pour un placement physique flagship Haussmann + e-commerce premium. Vous seriez ma proposition de cette session.

C'est un partenariat exigeant — DA, packshot, supply réguliers — mais l'exposition est sans équivalent en France. 30 min pour vous présenter le programme ?

Anaïs Mercier
Senior Buyer · Galeries Lafayette`,
        },
      },
      {
        name: "Arôme & Plant",
        pitch: "Cosmétique bio premium",
        score: 87,
        criteria: { cat: 89, logi: 85, marge: 86 },
        why: "Catégorie clean beauty en pic · ticket moyen à valoriser.",
        email: {
          subject:
            "Arôme & Plant × Galeries Lafayette : clean beauty premium recherchée",
          body: `Bonjour Inès,

Anaïs Mercier, Galeries Lafayette. Notre département beauté pilote depuis 18 mois une stratégie « clean beauty premium » — nous cherchons des marques < 5M€ CA, françaises, et avec une vraie histoire d'ingrédients. Vous cochez les trois.

Notre clientèle beauté a un panier moyen de 138€ avec une récurrence d'achat de 4.2 visites/an. La marge marketplace s'ajuste à la hauteur du positionnement premium — votre P&L tient.

On vise un test 6 mois sur 8 SKU clés (sérum, huile démaquillante, masque) avec corner physique. 25 min cette semaine ?

Anaïs Mercier
Senior Buyer · Galeries Lafayette`,
        },
      },
      {
        name: "Maison Lupin",
        pitch: "Luminaires artisanaux",
        score: 79,
        criteria: { cat: 82, logi: 76, marge: 78 },
        why: "Match esthétique fort · catégorie maison plus secondaire chez nous.",
        email: {
          subject:
            "Maison Lupin : une niche éditoriale « Art de Vivre » nous attend",
          body: `Bonjour Camille,

Anaïs Mercier, Galeries Lafayette. La maison n'est pas notre cœur historique mais notre section « Art de Vivre » se renforce — et vos luminaires ont la singularité visuelle qui fonctionne sur notre clientèle.

Score 79/100 : ce n'est pas un onboarding évident, il faudra adapter votre catalogue à notre univers et travailler les contenus avec notre studio. Mais le payoff potentiel (placement Haussmann + e-commerce + visibilité presse) est réel.

Je vous propose un café de découverte 45 min, sans engagement, pour mesurer l'appétit mutuel.

Anaïs Mercier
Senior Buyer · Galeries Lafayette`,
        },
      },
    ],
  },
};

const MARKETPLACES_EN: Record<MarketplaceKey, Marketplace> = {
  cdiscount: {
    label: "Cdiscount Pro",
    vertical: "B2C generalist",
    audience: "FR mass-market · 23M visitors/month",
    bdr: "Camille Roux",
    matches: [
      {
        name: "KitchenWise",
        pitch: "Accessible designer small appliances",
        score: 91,
        criteria: { cat: 94, logi: 92, marge: 86 },
        why: "Catalog ready to scale · €39–89 sweet-spot pricing · EDI feed already in place.",
        email: {
          subject:
            "KitchenWise × Cdiscount: 18M households are waiting for your blenders",
          body: `Hi Sébastien,

I'm Camille Roux, partnerships BDR at Cdiscount Pro. I've reviewed the KitchenWise catalog and it ticks the three boxes that drive sales on our platform: €49 average ticket, excellent product-sheet / imagery ratio, and an already industrialized logistics setup.

Specifically, in your small-appliance category we run 18M sessions/month with an average cart of €62. Your 4 best-sellers (blender, chopper, air fryer) sit on queries where Cdiscount captures 31% of FR traffic — strong visibility from onboarding day one.

I can hold 20 minutes this week to walk you through a 12-month volume projection on the platform. Tuesday 2pm or Thursday 10am?

Camille Roux
Business Developer · Cdiscount Pro`,
        },
      },
      {
        name: "ToolMaster",
        pitch: "Semi-pro power tools",
        score: 84,
        criteria: { cat: 88, logi: 82, marge: 81 },
        why: "Massive FR volume on tooling · returns risk to arbitrate.",
        email: {
          subject:
            "ToolMaster: 2.1M tooling searches on Cdiscount in Q1",
          body: `Hi Mathieu,

Camille Roux at Cdiscount Pro. Your "semi-pro at consumer prices" positioning is exactly what the advanced DIY crowd — 38% of our tooling audience — is hunting for.

Last quarter we logged 2.1M queries on drills / drivers / grinders, with a conversion rate 22% above the marketplace average. Your ToolMaster T-Series references would land straight into the top 15.

We can also tackle returns together (the historical pain point on the category) via our pooled logistics offer. 20 minutes to project?

Camille Roux
Business Developer · Cdiscount Pro`,
        },
      },
      {
        name: "Eco-Forge",
        pitch: "Eco-responsible hardware",
        score: 72,
        criteria: { cat: 79, logi: 68, marge: 71 },
        why: "Beautiful brand but green positioning less profitable on mass-market.",
        email: {
          subject: "Eco-Forge: your sustainable hardware, our CSR audience",
          body: `Hi Léa,

Camille Roux, Cdiscount Pro. The eco-responsible segment is exploding on our side: +47% YoY on queries including "sustainable", "repairable" or "French-made". Eco-Forge has strong credibility on those criteria.

Honest take: your premium positioning will demand more polished product content than average to convert. In return, we see ~2.4× higher customer retention on these brands vs. average.

I have a comparable case to share (a seller who joined in September and is already profitable). A 25-minute video call?

Camille Roux
Business Developer · Cdiscount Pro`,
        },
      },
    ],
  },

  manomano: {
    label: "ManoMano",
    vertical: "DIY · garden · home improvement",
    audience: "DIYers · gardeners FR/EU · 7M active",
    bdr: "Yanis Belkacem",
    matches: [
      {
        name: "ToolMaster",
        pitch: "Semi-pro power tools",
        score: 96,
        criteria: { cat: 98, logi: 94, marge: 95 },
        why: "Perfect match: pro / advanced audience + core-target catalog.",
        email: {
          subject: "ToolMaster: ManoMano = your 6 best-sellers in the top 10",
          body: `Hi Mathieu,

Yanis Belkacem, BDR at ManoMano. I'll cut to the chase: out of the 6 ToolMaster references I analyzed, 5 would land in the top 10 of their sub-category on day one.

Our audience is 64% pro / advanced DIYers — exactly the profile that buys semi-pro gear. Our average tooling cart is €138 vs. €47 on a generalist marketplace — so you gain in margin, not just in volume.

Our "ManoFulfillment" offer covers next-day-+1 on 92% of the territory. I'm proposing an accelerated onboarding kickoff: 30 days, delivered.

When can we lock 20 minutes?

Yanis Belkacem
Sellers BDR · ManoMano`,
        },
      },
      {
        name: "Eco-Forge",
        pitch: "Eco-responsible hardware",
        score: 89,
        criteria: { cat: 91, logi: 84, marge: 92 },
        why: "Sustainable DIY trend peaking · premium margin holding.",
        email: {
          subject: "Eco-Forge × ManoMano: sustainable DIY needs its champion",
          body: `Hi Léa,

Yanis Belkacem at ManoMano. I've been tracking the "eco-responsible DIY" segment for 18 months and I can tell you: Eco-Forge would be the 2nd structured player on the category on our side, behind a single competitor whom you outperform on range depth.

Searches for "French stainless screws": +63% YoY. Searches for "repairable hardware": +44%. And the average cart for this niche is €78 vs. €41 on non-engaged products.

I've prepared a mini business plan: top 20 SKUs to prioritize + quarterly forecasts. 25 minutes this week to walk through it?

Yanis Belkacem
Sellers BDR · ManoMano`,
        },
      },
      {
        name: "Maison Lupin",
        pitch: "Artisan lighting",
        score: 73,
        criteria: { cat: 76, logi: 71, marge: 72 },
        why: "Beautiful brand but lighting outside core gardening / tooling.",
        email: {
          subject: "Maison Lupin: growing 'outdoor lighting' niche",
          body: `Hi Camille,

Yanis Belkacem, ManoMano. Maison Lupin isn't an obvious match at first sight — your indoor lighting isn't our core. But your outdoor line (façade sconces, terrace pendants) hits a category where we have 1.4M poorly-served searches per year.

If you're willing to split your catalog and only list the outdoor sub-collection with us, I think we can build something interesting without cannibalizing your other channels.

I'd like to walk you through the niche project. 20 minutes will be enough.

Yanis Belkacem
Sellers BDR · ManoMano`,
        },
      },
    ],
  },

  decathlon: {
    label: "Decathlon Marketplace",
    vertical: "Sport · outdoor",
    audience: "Amateur + expert athletes · 14M FR visitors/month",
    bdr: "Théo Vasseur",
    matches: [
      {
        name: "Strider Outdoor",
        pitch: "Bivouac gear · mountain trekking",
        score: 94,
        criteria: { cat: 96, logi: 89, marge: 93 },
        why: "Underserved trek/bivouac audience · margin preserved on technical gear.",
        email: {
          subject: "Strider × Decathlon: technical trekking needs its reference brand",
          body: `Hi Sarah,

Théo Vasseur, Sellers at Decathlon Marketplace. Decathlon is known for entry-level gear — but on technical trekking (4-season tents, 60L+ packs, MSR-like stoves), our expert audience is looking for brands our private labels don't cover.

Strider Outdoor would enter 12 sub-categories where we currently have zero structured premium seller. For you: massive exposure to a qualified audience. For us: upmarket move on the offering.

Our "Marketplace Verified" program guarantees editorial placement. I'm proposing a guided onboarding. 30 minutes this week?

Théo Vasseur
Senior BDR · Decathlon Marketplace`,
        },
      },
      {
        name: "ToolMaster",
        pitch: "Semi-pro power tools",
        score: 67,
        criteria: { cat: 62, logi: 78, marge: 60 },
        why: "Marginal category on Decathlon · only worth it on bike tooling.",
        email: {
          subject: "ToolMaster: possible pivot on Decathlon bike tooling?",
          body: `Hi Mathieu,

Théo Vasseur, Decathlon Marketplace. I won't oversell: your general tooling catalog isn't aligned with our audience. Matching score is low (67/100), I'm being transparent.

That said, your "bike tooling" sub-range (torque wrenches, tire levers, chain breakers) could work on our cycling segment, which represents €1.2bn annually. It's niche, but defensible.

If you want to test a reduced scope (15–20 SKUs), I can set up a 90-day pilot. 20 minutes to frame it?

Théo Vasseur
Senior BDR · Decathlon Marketplace`,
        },
      },
      {
        name: "Arôme & Plant",
        pitch: "Premium organic cosmetics",
        score: 71,
        criteria: { cat: 68, logi: 82, marge: 64 },
        why: "Opportunity on 'after-sport' and runner skincare to explore.",
        email: {
          subject: "Arôme & Plant: athlete beauty, a category to invent",
          body: `Hi Inès,

Théo Vasseur, Decathlon Marketplace. At first glance Arôme & Plant has no business at Decathlon. On second thought, your "muscle recovery" and after-effort body care products hit a category we've never structured.

3.4M of our visitors search "recovery massage oil" each year. None of our sellers cover this need with a premium organic positioning. You do.

I can propose a test on 8 references. 25 minutes to walk through the mechanics?

Théo Vasseur
Senior BDR · Decathlon Marketplace`,
        },
      },
    ],
  },

  maisons: {
    label: "Maisons du Monde",
    vertical: "Decoration · lifestyle",
    audience: "30–50 y/o upper-middle class · home decor · 9M FR visitors/month",
    bdr: "Élise Dauphin",
    matches: [
      {
        name: "Solea Living",
        pitch: "Artisan Mediterranean decor",
        score: 93,
        criteria: { cat: 95, logi: 88, marge: 94 },
        why: "Perfectly aligned DNA · positioning complements the private label.",
        email: {
          subject:
            "Solea Living × Maisons du Monde: the Mediterranean was missing",
          body: `Hi Elena,

Élise Dauphin, partnerships at Maisons du Monde. Our S/S 2026 seasonal study flags Mediterranean aesthetics as the #1 trend, and our private label only covers the "Nordic-European seaside" angle. We're missing the authentic south: terracotta ceramics, hand-worked plant fibers, natural textiles…

Solea Living embodies that gap. Your kilim cushion collections and terracotta lamps would be highlighted in our spring lookbook. Our upper-middle audience pays a €119 average ticket — your positioning holds.

I'd like to schedule a touchpoint to explore a co-created exclusive capsule. 30 minutes?

Élise Dauphin
Senior Buyer · Maisons du Monde`,
        },
      },
      {
        name: "Maison Lupin",
        pitch: "Artisan lighting",
        score: 88,
        criteria: { cat: 92, logi: 81, marge: 90 },
        why: "Hero pieces for merchandising · low private-label cannibalization.",
        email: {
          subject:
            "Maison Lupin: your lighting, our autumn lookbook",
          body: `Hi Camille,

Élise Dauphin, Maisons du Monde. Your "Lune" and "Halo" pendants are visually strong enough to anchor a full universe page in our autumn catalog. That's rare. We looked at it on the mood board — the creative team is unanimous.

On merchandising, our private-label signature pieces sit at €89–149 — you're positioned 30% above, which reinforces your artisan status without cannibalizing us. Everyone wins.

I can introduce our premium seller offer + the editorial highlight project. 25 minutes this week?

Élise Dauphin
Senior Buyer · Maisons du Monde`,
        },
      },
      {
        name: "Velour Atelier",
        pitch: "High-end women's ready-to-wear",
        score: 64,
        criteria: { cat: 58, logi: 72, marge: 63 },
        why: "Outside main category · only worth exploring via home accessories.",
        email: {
          subject:
            "Velour Atelier: your textile know-how on our home linens?",
          body: `Hi Adrienne,

Élise Dauphin, Maisons du Monde. Velour Atelier has no reason to be listed on ready-to-wear on our marketplace — it isn't our business and the audience doesn't follow. Honest score: 64/100.

But your fabrics (the know-how behind your ready-to-wear) applied to home linens (cushion covers, throws, table runners) would be an excellent fit. It's a new channel for you with limited risk.

If the idea speaks to you, I'm proposing a 45-minute scoping workshop with my textile buying team. Available?

Élise Dauphin
Senior Buyer · Maisons du Monde`,
        },
      },
    ],
  },

  galeries: {
    label: "Galeries Lafayette",
    vertical: "Premium fashion · beauty",
    audience: "Urban upper-class · 6M FR visitors · strong tourism audience",
    bdr: "Anaïs Mercier",
    matches: [
      {
        name: "Velour Atelier",
        pitch: "High-end women's ready-to-wear",
        score: 92,
        criteria: { cat: 95, logi: 88, marge: 93 },
        why: "Brand storytelling + material quality · ideal target for the Haussmann flagship.",
        email: {
          subject:
            "Velour Atelier: your place is in our 2nd-floor windows",
          body: `Hi Adrienne,

Anaïs Mercier, Buying Office at Galeries Lafayette. I discovered Velour Atelier through your latest editorial collaboration. The quality of your cuts and your material sourcing (Loro Piana, premium Italian mills) check every box of our "Discovered Brand" eligibility.

Our "Designer Selection" program retains 12 emerging brands each season for a physical placement at the Haussmann flagship + premium e-commerce. You would be my proposal this round.

It's a demanding partnership — art direction, packshots, regular supply — but the exposure is unmatched in France. 30 minutes to walk through the program?

Anaïs Mercier
Senior Buyer · Galeries Lafayette`,
        },
      },
      {
        name: "Arôme & Plant",
        pitch: "Premium organic cosmetics",
        score: 87,
        criteria: { cat: 89, logi: 85, marge: 86 },
        why: "Clean beauty category peaking · average ticket to leverage.",
        email: {
          subject:
            "Arôme & Plant × Galeries Lafayette: premium clean beauty wanted",
          body: `Hi Inès,

Anaïs Mercier, Galeries Lafayette. Our beauty department has been piloting a "premium clean beauty" strategy for 18 months — we're looking for brands under €5M revenue, French, with a genuine ingredient story. You check all three.

Our beauty clientele has a €138 average cart with a 4.2 purchase frequency per year. The marketplace margin scales with premium positioning — your P&L holds.

We're targeting a 6-month test on 8 key SKUs (serum, cleansing oil, mask) with a physical corner. 25 minutes this week?

Anaïs Mercier
Senior Buyer · Galeries Lafayette`,
        },
      },
      {
        name: "Maison Lupin",
        pitch: "Artisan lighting",
        score: 79,
        criteria: { cat: 82, logi: 76, marge: 78 },
        why: "Strong aesthetic match · home category more secondary for us.",
        email: {
          subject:
            "Maison Lupin: an editorial 'Art de Vivre' niche awaits",
          body: `Hi Camille,

Anaïs Mercier, Galeries Lafayette. Home isn't our historical core but our "Art de Vivre" section is strengthening — and your lighting has the visual singularity that resonates with our clientele.

Score 79/100: this isn't an obvious onboarding, you'll need to adapt your catalog to our universe and develop content with our studio. But the potential payoff (Haussmann placement + e-commerce + press exposure) is real.

I'm proposing a 45-minute discovery coffee, no strings attached, to gauge mutual interest.

Anaïs Mercier
Senior Buyer · Galeries Lafayette`,
        },
      },
    ],
  },
};

function pickMarketplaces(lang: Lang): Record<MarketplaceKey, Marketplace> {
  return lang === "en" ? MARKETPLACES_EN : MARKETPLACES_FR;
}

// ---------- UI PRIMITIVES ----------

function CriteriaBar({ k, v }: { k: string; v: number }) {
  const color = scoreColor(v);
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1">
        <span
          className="mono uppercase text-[9px] tracking-widest"
          style={{ color: PALETTE.textDim }}
        >
          {k}
        </span>
        <span style={{ color, fontSize: 12, fontWeight: 600 }}>{v}</span>
      </div>
      <div
        className="rounded-full overflow-hidden"
        style={{ height: 3, background: "rgba(255,255,255,0.06)" }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${v}%` }}
          transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
          style={{
            height: "100%",
            background: color,
            boxShadow: `0 0 6px ${color}`,
          }}
        />
      </div>
    </div>
  );
}

function ScorePill({ value }: { value: number }) {
  const color = scoreColor(value);
  return (
    <div
      className="flex items-center gap-2 px-2.5 py-1 rounded-full"
      style={{
        border: `1px solid ${color}55`,
        background: `${color}11`,
      }}
    >
      <span
        className="mono uppercase text-[9px] tracking-widest"
        style={{ color: PALETTE.textDim }}
      >
        match
      </span>
      <span style={{ color, fontSize: 14, fontWeight: 700, lineHeight: 1 }}>
        {value}
      </span>
      <span style={{ color: PALETTE.textMuted, fontSize: 11 }}>/100</span>
    </div>
  );
}

// ---------- VENDOR CARD ----------

function VendorCard({
  vendor,
  rank,
  marketplace,
}: {
  vendor: Vendor;
  rank: number;
  marketplace: Marketplace;
}) {
  const { lang } = useLang();
  const [emailState, setEmailState] = useState<"idle" | "writing" | "done">(
    "idle"
  );

  const generate = () => {
    if (emailState === "done") {
      setEmailState("idle");
      return;
    }
    setEmailState("writing");
    setTimeout(() => setEmailState("done"), 900);
  };

  return (
    <motion.div
      layout
      className="rounded-xl overflow-hidden"
      style={{
        background: PALETTE.surface,
        border: `1px solid ${PALETTE.border}`,
      }}
    >
      <div className="p-4 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <span
              className="mono uppercase text-[10px] tracking-widest shrink-0 px-2 py-1 rounded-md"
              style={{
                color: PALETTE.orange,
                background: "rgba(255,122,69,0.10)",
                border: `1px solid ${PALETTE.orange}33`,
              }}
            >
              #{rank}
            </span>
            <div className="min-w-0">
              <p
                className="font-semibold text-[14px]"
                style={{ color: PALETTE.text }}
              >
                {vendor.name}
              </p>
              <p
                className="text-[12px] mt-0.5"
                style={{ color: PALETTE.textDim }}
              >
                {vendor.pitch}
              </p>
            </div>
          </div>
          <ScorePill value={vendor.score} />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <CriteriaBar k={tr(lang, "Catalogue", "Catalog")} v={vendor.criteria.cat} />
          <CriteriaBar k={tr(lang, "Logistique", "Logistics")} v={vendor.criteria.logi} />
          <CriteriaBar k={tr(lang, "Marge", "Margin")} v={vendor.criteria.marge} />
        </div>

        <p
          className="text-[12px]"
          style={{ color: PALETTE.textDim, fontStyle: "italic" }}
        >
          ↳ {vendor.why}
        </p>

        <button
          type="button"
          onClick={generate}
          disabled={emailState === "writing"}
          className="mono uppercase text-[10px] tracking-widest px-3 py-1.5 rounded-md transition-colors self-start"
          style={{
            color: emailState === "done" ? PALETTE.orange : PALETTE.bg,
            background:
              emailState === "done" ? "transparent" : PALETTE.orange,
            border: `1px solid ${PALETTE.orange}`,
            cursor: emailState === "writing" ? "wait" : "pointer",
            opacity: emailState === "writing" ? 0.65 : 1,
            fontWeight: 600,
          }}
        >
          {emailState === "writing"
            ? tr(lang, "Rédaction en cours…", "Drafting…")
            : emailState === "done"
              ? tr(lang, "Masquer l'email", "Hide email")
              : tr(lang, "Générer l'email BDR", "Generate BDR email")}
        </button>
      </div>

      <AnimatePresence initial={false}>
        {emailState === "done" && (
          <motion.div
            key="email"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
            style={{
              borderTop: `1px solid ${PALETTE.border}`,
              background: PALETTE.surfaceAlt,
            }}
          >
            <div className="px-4 py-3">
              <div
                className="flex items-center justify-between mb-2"
                style={{ color: PALETTE.textMuted }}
              >
                <span className="mono uppercase text-[9px] tracking-widest">
                  {tr(lang, "De", "From")} : {marketplace.bdr.toLowerCase().replace(" ", ".")}@
                  {marketplace.label.toLowerCase().replace(/[^a-z]/g, "")}.com
                </span>
                <span className="mono uppercase text-[9px] tracking-widest">
                  {tr(lang, "brouillon", "draft")} ✓
                </span>
              </div>
              <p
                className="font-semibold text-[13px] mb-2"
                style={{ color: PALETTE.text }}
              >
                {vendor.email.subject}
              </p>
              <pre
                className="text-[12.5px] whitespace-pre-wrap"
                style={{
                  color: PALETTE.textDim,
                  fontFamily: "Georgia, ui-serif, serif",
                  lineHeight: 1.55,
                }}
              >
                {vendor.email.body}
              </pre>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ---------- ROOT ----------

export function MiraklMiniApp() {
  const { lang } = useLang();
  const MARKETPLACES = pickMarketplaces(lang);
  const [marketplace, setMarketplace] = useState<MarketplaceKey>("manomano");
  const current = MARKETPLACES[marketplace];

  const keys: MarketplaceKey[] = [
    "cdiscount",
    "manomano",
    "decathlon",
    "maisons",
    "galeries",
  ];

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
        className="flex items-center justify-between px-5 py-3"
        style={{ borderBottom: `1px solid ${PALETTE.border}` }}
      >
        <div className="flex items-center gap-2">
          <span
            aria-hidden
            style={{
              width: 8,
              height: 8,
              borderRadius: 2,
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
          className="mono uppercase text-[10px] tracking-widest hidden sm:inline"
          style={{ color: PALETTE.textMuted }}
        >
          {tr(lang, "5 marketplaces · top 3 matchs · email BDR auto", "5 marketplaces · top 3 matches · auto BDR email")}
        </span>
      </div>

      {/* Marketplace selector */}
      <div
        className="px-5 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
        style={{ borderBottom: `1px solid ${PALETTE.border}` }}
      >
        <div className="flex flex-wrap gap-1.5">
          {keys.map((k) => {
            const active = k === marketplace;
            return (
              <button
                key={k}
                type="button"
                onClick={() => setMarketplace(k)}
                className="mono uppercase text-[10px] tracking-widest px-2.5 py-1 rounded-md transition-colors"
                style={{
                  color: active ? PALETTE.orange : PALETTE.textDim,
                  background: active
                    ? "rgba(255,122,69,0.10)"
                    : "transparent",
                  border: `1px solid ${
                    active ? `${PALETTE.orange}55` : PALETTE.border
                  }`,
                }}
              >
                {MARKETPLACES[k].label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Marketplace context */}
      <div className="px-5 pt-4 pb-2 flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p
            className="font-semibold text-[15px]"
            style={{ color: PALETTE.text }}
          >
            {current.label}
          </p>
          <p
            className="text-[12px] mt-0.5"
            style={{ color: PALETTE.textDim }}
          >
            {current.vertical} · {current.audience}
          </p>
        </div>
        <span
          className="mono uppercase text-[10px] tracking-widest"
          style={{ color: PALETTE.textMuted }}
        >
          {tr(lang, "BDR", "BDR")} : {current.bdr}
        </span>
      </div>

      {/* Top 3 matches */}
      <div className="px-5 pb-5 pt-3">
        <AnimatePresence mode="wait">
          <motion.div
            key={marketplace}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            className="space-y-3"
          >
            {current.matches.map((v, i) => (
              <VendorCard
                key={`${marketplace}-${v.name}`}
                vendor={v}
                rank={i + 1}
                marketplace={current}
              />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
