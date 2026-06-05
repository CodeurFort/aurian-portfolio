import * as si from "simple-icons";

// Mapping label de stack → slug simple-icons. Quand la marque n'est pas dispo
// dans simple-icons (OpenAI, Tableau, Apify, Dust, Recharts, Zustand…), on
// retombe sur un monogramme stylisé pour garder la cohérence visuelle.
const SLUG_MAP: Record<string, string> = {
  HTML: "siHtml5",
  CSS: "siCss",
  JavaScript: "siJavascript",
  TypeScript: "siTypescript",
  Firebase: "siFirebase",
  Firestore: "siFirebase",
  "Firebase Auth": "siFirebase",
  PWA: "siPwa",
  Python: "siPython",
  FastAPI: "siFastapi",
  "Next.js 16": "siNextdotjs",
  "Next.js": "siNextdotjs",
  "Tailwind v4": "siTailwindcss",
  Tailwind: "siTailwindcss",
  Supabase: "siSupabase",
  Claude: "siClaude",
  "Anthropic SDK": "siAnthropic",
  Anthropic: "siAnthropic",
  Vercel: "siVercel",
  Railway: "siRailway",
  "React 19": "siReact",
  React: "siReact",
  BigQuery: "siGooglebigquery",
  "Looker Studio": "siLooker",
  Pandas: "siPandas",
  SQL: "siSqlite", // pas de "SQL" générique → on prend SQLite comme repère
};

type IconEntry = { path: string; title: string };

function getIcon(label: string): IconEntry | null {
  const slug = SLUG_MAP[label];
  if (!slug) return null;
  const entry = (si as unknown as Record<string, IconEntry>)[slug];
  return entry ?? null;
}

// Petit monogramme — 2-3 lettres en mono, encadrées par un rectangle fin.
// Utilisé pour Tableau, OpenAI, Apify, Dust, Zustand, Recharts, etc.
function Monogram({ label }: { label: string }) {
  // Garde-fou : compose un short qui marche pour les labels usuels.
  const short = (() => {
    if (label.includes(" ")) {
      // "OpenAI GPT-4o" → "GPT", "DALL-E 3" → "DLE"
      const parts = label.split(/[\s-]/).filter(Boolean);
      if (parts[0].length >= 3) return parts[0].slice(0, 3).toUpperCase();
      return parts
        .slice(0, 3)
        .map((p) => p[0])
        .join("")
        .toUpperCase();
    }
    return label.slice(0, 3).toUpperCase();
  })();
  return (
    <span
      aria-hidden
      className="mono inline-flex items-center justify-center"
      style={{
        width: 14,
        height: 14,
        fontSize: 7,
        lineHeight: 1,
        letterSpacing: "0.04em",
        border: "1px solid currentColor",
        borderRadius: 2,
        color: "currentColor",
      }}
    >
      {short}
    </span>
  );
}

export function TechIcon({
  label,
  size = 14,
}: {
  label: string;
  size?: number;
}) {
  const icon = getIcon(label);
  if (!icon) return <Monogram label={label} />;
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
      style={{ flexShrink: 0, display: "block" }}
    >
      <title>{icon.title}</title>
      <path d={icon.path} />
    </svg>
  );
}
