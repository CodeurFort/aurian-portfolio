# Portfolio Aurian Constellation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a scroll-driven, paper-cutout cosmic portfolio for Aurian (5 project planets connected by mint soft-skill threads), deployed to GitHub Pages, in one day.

**Architecture:** Next.js 16 App Router with `output: 'export'` (fully static). React 19 components with Framer Motion for scroll-driven animations. Tailwind v4 inline `@theme` palette. All visuals as inline SVG (no bitmaps for planets). Data layer in `src/lib/content.ts`. Single-page assembled in `src/app/page.tsx` from 10 section components. Deploy via GitHub Actions to GitHub Pages.

**Tech Stack:** Next.js 16 · React 19 · TypeScript 5 strict · Tailwind v4 · Framer Motion · `next/font/google` (Instrument Serif / Inter Tight / IBM Plex Mono) · Lucide React · GitHub Pages + Actions

**Project root:** `/Users/aurian/Desktop/aurian-portfolio/`

**Spec reference:** `docs/superpowers/specs/2026-05-05-portfolio-constellation-design.md`

---

## Conventions & Verification Strategy

This is a visual frontend project. Strict per-component TDD is wasteful here. Verification cascade per task:

1. **Data / utils tasks** → unit test (Vitest) + assert
2. **UI component tasks** → `npm run build` succeeds, no TS errors, dev server loads section without console errors
3. **Section tasks** → manual visual check via `npm run dev` at `http://localhost:3000`
4. **Final tasks** → Playwright smoke test + Lighthouse audit

**Frequent commits:** one commit per task minimum. Use Conventional Commits (`feat:`, `chore:`, `style:`, `fix:`, `docs:`).

**Placeholder convention:** when content is missing, render the literal text `[À FOURNIR — <key>]` so missing inputs are visible at a glance. Never `TODO` in code.

---

## Phase 0 — Project Setup

### Task 1: Initialize Next.js 16 project

**Files:**
- Create: `/Users/aurian/Desktop/aurian-portfolio/package.json`
- Create: `/Users/aurian/Desktop/aurian-portfolio/tsconfig.json`
- Create: `/Users/aurian/Desktop/aurian-portfolio/next.config.mjs`
- Create: `/Users/aurian/Desktop/aurian-portfolio/.gitignore`

- [ ] **Step 1: Bootstrap project via `create-next-app`**

```bash
cd /Users/aurian/Desktop
npx create-next-app@latest aurian-portfolio \
  --typescript --tailwind --eslint --app \
  --src-dir --import-alias "@/*" --use-npm --no-turbopack
cd aurian-portfolio
```

When prompted, accept defaults. This produces Next.js 16, React 19, Tailwind v4, ESLint.

- [ ] **Step 2: Install runtime dependencies**

```bash
npm install framer-motion lucide-react
npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom jsdom @playwright/test
```

- [ ] **Step 3: Replace `next.config.mjs` with GitHub Pages export config**

```js
// next.config.mjs
const repoName = 'aurian-portfolio';
const isProd = process.env.NODE_ENV === 'production';
const useBasePath = process.env.NEXT_PUBLIC_USE_BASE_PATH === 'true';

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  basePath: isProd && useBasePath ? `/${repoName}` : '',
  assetPrefix: isProd && useBasePath ? `/${repoName}/` : '',
  reactStrictMode: true,
};

export default nextConfig;
```

When deploying to `<user>.github.io/aurian-portfolio` set `NEXT_PUBLIC_USE_BASE_PATH=true` in CI. With a custom domain (CNAME), keep it unset — empty basePath.

- [ ] **Step 4: Verify build succeeds**

```bash
npm run build
```

Expected: `✓ Generating static pages` then `Route (app) ... ƒ Static`. The `out/` directory exists.

- [ ] **Step 5: Commit**

```bash
git init
git add -A
git commit -m "chore: bootstrap next.js 16 portfolio with static export"
```

---

### Task 2: Install fonts and palette

**Files:**
- Modify: `/Users/aurian/Desktop/aurian-portfolio/src/app/layout.tsx`
- Modify: `/Users/aurian/Desktop/aurian-portfolio/src/app/globals.css`
- Create: `/Users/aurian/Desktop/aurian-portfolio/public/grain.svg`

- [ ] **Step 1: Configure fonts in `layout.tsx`**

Replace the file with:

```tsx
import type { Metadata } from "next";
import { Instrument_Serif, Inter_Tight, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const serif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

const sans = Inter_Tight({
  subsets: ["latin"],
  weight: ["200", "400", "500", "700"],
  variable: "--font-sans",
  display: "swap",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "aurian. — portfolio",
  description: "Une nuit éditoriale. Cinq planètes de papier. Des fils de menthe.",
  metadataBase: new URL("https://aurian.dev"),
  openGraph: {
    title: "aurian. — portfolio",
    description: "Une nuit éditoriale. Cinq planètes de papier. Des fils de menthe.",
    images: ["/og-image.png"],
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${serif.variable} ${sans.variable} ${mono.variable}`}>
      <body className="bg-paper-bg text-text antialiased">{children}</body>
    </html>
  );
}
```

- [ ] **Step 2: Replace `globals.css` with palette + grain + base styles**

```css
@import "tailwindcss";

@theme inline {
  --color-paper-bg: #0E0F12;
  --color-paper-deep: #07080A;
  --color-paper-cream: #ECE6D6;
  --color-paper-blush: #C8A99B;
  --color-paper-stone: #8E8B83;
  --color-paper-ochre: #B89968;
  --color-paper-mint: #A8C4B0;
  --color-paper-ink: #1A1B1F;
  --color-thread: #A4F5C8;
  --color-thread-glow: #A4F5C840;
  --color-text: #ECE6D6;
  --color-text-muted: #6B6660;
  --color-text-subtle: #3A3D38;
  --color-hairline: #1F2521;

  --font-family-serif: var(--font-serif), Georgia, serif;
  --font-family-sans: var(--font-sans), system-ui, sans-serif;
  --font-family-mono: var(--font-mono), ui-monospace, monospace;
}

html, body { height: 100%; }
body {
  font-family: var(--font-sans);
  background:
    radial-gradient(ellipse at top, #14161B 0%, #0E0F12 45%, #07080A 100%) fixed;
  overflow-x: hidden;
}

.grain::after {
  content: "";
  position: fixed;
  inset: 0;
  pointer-events: none;
  background-image: url("/grain.svg");
  opacity: 0.10;
  mix-blend-mode: overlay;
  z-index: 100;
}

.serif-italic { font-family: var(--font-serif); font-style: italic; }
.mono { font-family: var(--font-mono); }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

- [ ] **Step 3: Create grain texture SVG**

```xml
<!-- public/grain.svg -->
<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240">
  <filter id="n">
    <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/>
    <feColorMatrix values="0 0 0 0 0.92  0 0 0 0 0.90  0 0 0 0 0.84  0 0 0 0.6 0"/>
  </filter>
  <rect width="100%" height="100%" filter="url(#n)"/>
</svg>
```

- [ ] **Step 4: Add `grain` class to `<body>`**

In `layout.tsx` change `<body className="bg-paper-bg text-text antialiased">` to `<body className="grain bg-paper-bg text-text antialiased">`.

- [ ] **Step 5: Verify build & dev render**

```bash
npm run build && npm run dev
```

Open `http://localhost:3000`. Expected: dark page, fonts loaded (check devtools Network → fonts), grain overlay subtly visible. Stop the server.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: install fonts and paper palette tokens"
```

---

### Task 3: Vitest setup for data-layer tests

**Files:**
- Create: `/Users/aurian/Desktop/aurian-portfolio/vitest.config.ts`
- Create: `/Users/aurian/Desktop/aurian-portfolio/src/test/setup.ts`
- Modify: `/Users/aurian/Desktop/aurian-portfolio/package.json` (scripts)

- [ ] **Step 1: Create `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    globals: true,
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
```

- [ ] **Step 2: Create `src/test/setup.ts`**

```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 3: Add scripts to `package.json`**

In the `"scripts"` block add:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: Sanity test — write `src/test/sanity.test.ts`**

```ts
import { describe, it, expect } from "vitest";

describe("sanity", () => {
  it("runs", () => {
    expect(1 + 1).toBe(2);
  });
});
```

Run `npm test`. Expected: `1 passed`.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: add vitest with jsdom for component and data tests"
```

---

### Task 4: GitHub Pages deploy workflow

**Files:**
- Create: `/Users/aurian/Desktop/aurian-portfolio/.github/workflows/deploy.yml`
- Create: `/Users/aurian/Desktop/aurian-portfolio/public/.nojekyll`
- Create: `/Users/aurian/Desktop/aurian-portfolio/README.md`

- [ ] **Step 1: Add `.nojekyll`** — empty file at `public/.nojekyll` so Jekyll on Pages doesn't strip `_next/` assets.

```bash
touch public/.nojekyll
```

- [ ] **Step 2: Create deploy workflow**

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - name: Build
        env:
          NEXT_PUBLIC_USE_BASE_PATH: "true"
        run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: out

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 3: Write minimal README**

```markdown
# aurian-portfolio

Personal portfolio. Next.js 16 static export → GitHub Pages.

## Dev

\`\`\`bash
npm install
npm run dev
\`\`\`

## Build

\`\`\`bash
npm run build   # output in ./out
\`\`\`

## Deploy

Push to `main`. The `deploy.yml` workflow builds and publishes to GitHub Pages.

For a custom domain (e.g. `aurian.dev`), drop a `CNAME` file in `public/` and unset `NEXT_PUBLIC_USE_BASE_PATH` in the workflow.

## Inputs still needed

See `docs/superpowers/specs/2026-05-05-portfolio-constellation-design.md` § 10.
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "ci: github pages deploy workflow"
```

---

## Phase 1 — Data Layer & UI Primitives

### Task 5: Content data layer

**Files:**
- Create: `/Users/aurian/Desktop/aurian-portfolio/src/lib/content.ts`
- Create: `/Users/aurian/Desktop/aurian-portfolio/src/lib/content.test.ts`

This is the single source of truth for projects, soft skills, hobbies, stack, contact. UI components read from here.

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/content.test.ts
import { describe, it, expect } from "vitest";
import { projects, softSkills, hobbies, stack, profile, outroQuote } from "./content";

describe("content", () => {
  it("exposes 5 projects in narrative order", () => {
    expect(projects).toHaveLength(5);
    expect(projects.map((p) => p.slug)).toEqual([
      "levels",
      "energizer",
      "mirakl",
      "music-agency",
      "openclaw",
    ]);
  });

  it("each project has a non-empty title and paper color token", () => {
    for (const p of projects) {
      expect(p.title.length).toBeGreaterThan(0);
      expect(p.paperColor).toMatch(/^paper-(cream|mint|ochre|blush|stone)$/);
    }
  });

  it("openclaw has 3 moons", () => {
    const oc = projects.find((p) => p.slug === "openclaw");
    expect(oc?.moons).toHaveLength(3);
    expect(oc?.moons?.map((m) => m.name)).toEqual(["Webdev", "Vidéo", "Assistance"]);
  });

  it("exposes 4 soft skills with project links", () => {
    expect(softSkills).toHaveLength(4);
    for (const s of softSkills) {
      expect(s.linkedProjectSlugs.length).toBeGreaterThan(0);
      for (const slug of s.linkedProjectSlugs) {
        expect(projects.some((p) => p.slug === slug)).toBe(true);
      }
    }
  });

  it("exposes hobbies, stack, profile, outroQuote", () => {
    expect(hobbies.length).toBeGreaterThanOrEqual(7);
    expect(stack.length).toBeGreaterThanOrEqual(10);
    expect(profile.email.length).toBeGreaterThan(0);
    expect(outroQuote.length).toBeGreaterThan(0);
  });
});
```

Run: `npm test`. Expected: FAIL with `Cannot find module './content'`.

- [ ] **Step 2: Implement `content.ts`**

```ts
// src/lib/content.ts

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
  chapter: string; // "01", "02", ...
  title: string;
  paperColor: PaperColor;
  pitch: string;          // 2 short paragraphs joined with "\n\n"
  role?: string;
  achievements: string[]; // bullet points (3 max)
  stack: string[];        // pill labels
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
  cvCurrent: string;     // "VSOLUTION (avril 2026 → présent)"
  cvPrevious: string;    // "[À FOURNIR — poste précédent]"
  formation: string;     // "[À FOURNIR — école / formation]"
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
    achievements: [placeholder("levels.achievement.1"), placeholder("levels.achievement.2"), placeholder("levels.achievement.3")],
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
    achievements: [placeholder("mirakl.achievement.1"), placeholder("mirakl.achievement.2"), placeholder("mirakl.achievement.3")],
    stack: ["[À FOURNIR — stack]"],
  },
  {
    slug: "music-agency",
    chapter: "04",
    title: "Music Agency — 5 Dust",
    paperColor: "paper-blush",
    pitch: placeholder("music.pitch"),
    achievements: [placeholder("music.achievement.1"), placeholder("music.achievement.2"), placeholder("music.achievement.3")],
    stack: ["Dust", "[À FOURNIR — stack]"],
  },
  {
    slug: "openclaw",
    chapter: "05",
    title: "Openclaw",
    paperColor: "paper-stone",
    pitch: placeholder("openclaw.pitch"),
    achievements: [placeholder("openclaw.achievement.1"), placeholder("openclaw.achievement.2"), placeholder("openclaw.achievement.3")],
    stack: ["Claude", "Anthropic SDK", "Node", "[À FOURNIR — stack]"],
    repoUrl: placeholder("openclaw.cpp.repo"),
    moons: [
      { name: "Webdev", pitch: placeholder("openclaw.moon.webdev"), bullets: [placeholder("moon.webdev.case.1"), placeholder("moon.webdev.case.2")], stack: ["Next.js", "[À FOURNIR]"] },
      { name: "Vidéo", pitch: placeholder("openclaw.moon.video"), bullets: [placeholder("moon.video.case.1"), placeholder("moon.video.case.2")], stack: ["[À FOURNIR]"] },
      { name: "Assistance", pitch: placeholder("openclaw.moon.assist"), bullets: [placeholder("moon.assist.case.1"), placeholder("moon.assist.case.2")], stack: ["Dust", "[À FOURNIR]"] },
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
```

- [ ] **Step 3: Run the test, expect green**

```bash
npm test
```

Expected: `Tests passed (5)` (sanity + content tests).

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(content): seed projects, soft skills, hobbies, stack, profile"
```

---

### Task 6: PaperPlanet primitive (SVG)

**Files:**
- Create: `/Users/aurian/Desktop/aurian-portfolio/src/components/ui/PaperPlanet.tsx`

A pure SVG paper-cutout circular planet with crater/relief details and layered drop shadow. Color comes from a CSS variable.

- [ ] **Step 1: Implement**

```tsx
// src/components/ui/PaperPlanet.tsx
"use client";
import { motion } from "framer-motion";
import type { PaperColor } from "@/lib/content";

interface PaperPlanetProps {
  color: PaperColor;
  size?: number;
  rotate?: boolean;
  seed?: number; // changes crater pattern
  className?: string;
}

const colorVar: Record<PaperColor, string> = {
  "paper-cream": "var(--color-paper-cream)",
  "paper-mint": "var(--color-paper-mint)",
  "paper-ochre": "var(--color-paper-ochre)",
  "paper-blush": "var(--color-paper-blush)",
  "paper-stone": "var(--color-paper-stone)",
};

export function PaperPlanet({ color, size = 220, rotate = true, seed = 1, className }: PaperPlanetProps) {
  const fill = colorVar[color];
  // deterministic crater positions from seed
  const craters = Array.from({ length: 5 }, (_, i) => {
    const a = (seed * 13 + i * 47) % 360;
    const r = 30 + ((seed * 7 + i * 11) % 50);
    const cx = 100 + Math.cos((a * Math.PI) / 180) * r;
    const cy = 100 + Math.sin((a * Math.PI) / 180) * r;
    const cr = 6 + ((seed + i) % 4) * 2;
    return { cx, cy, cr };
  });

  return (
    <motion.div
      className={className}
      style={{ width: size, height: size }}
      animate={rotate ? { rotate: 360 } : undefined}
      transition={rotate ? { duration: 120, ease: "linear", repeat: Infinity } : undefined}
    >
      <svg viewBox="0 0 200 200" width={size} height={size} aria-hidden>
        <defs>
          <filter id={`paperShadow-${seed}`} x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="14" stdDeviation="10" floodColor="#000" floodOpacity="0.55" />
            <feDropShadow dx="0" dy="2"  stdDeviation="2"  floodColor="#000" floodOpacity="0.35" />
          </filter>
        </defs>
        <g filter={`url(#paperShadow-${seed})`}>
          <circle cx="100" cy="100" r="92" fill={fill} />
          <circle cx="100" cy="100" r="92" fill="none" stroke="rgba(0,0,0,0.18)" strokeWidth="1" />
          {craters.map((c, i) => (
            <circle key={i} cx={c.cx} cy={c.cy} r={c.cr} fill="rgba(0,0,0,0.10)" />
          ))}
          {/* highlight */}
          <ellipse cx="78" cy="70" rx="34" ry="22" fill="rgba(255,255,255,0.18)" />
        </g>
      </svg>
    </motion.div>
  );
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

Expected: build succeeds with 0 errors.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat(ui): paper planet svg primitive with rotation"
```

---

### Task 7: ThreadLine + PaperMoon + EditorialTitle + TechPill + ScrollIndicator

**Files:**
- Create: `/Users/aurian/Desktop/aurian-portfolio/src/components/ui/ThreadLine.tsx`
- Create: `/Users/aurian/Desktop/aurian-portfolio/src/components/ui/PaperMoon.tsx`
- Create: `/Users/aurian/Desktop/aurian-portfolio/src/components/ui/EditorialTitle.tsx`
- Create: `/Users/aurian/Desktop/aurian-portfolio/src/components/ui/TechPill.tsx`
- Create: `/Users/aurian/Desktop/aurian-portfolio/src/components/ui/ScrollIndicator.tsx`

- [ ] **Step 1: `ThreadLine.tsx` — animated dashed mint SVG path**

```tsx
"use client";
import { motion } from "framer-motion";

interface ThreadLineProps {
  d: string;            // SVG path d attribute
  width?: number;
  height?: number;
  active?: boolean;     // glows when true
  className?: string;
}

export function ThreadLine({ d, width = 800, height = 200, active = true, className }: ThreadLineProps) {
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height={height}
      className={className}
      preserveAspectRatio="none"
      aria-hidden
    >
      <motion.path
        d={d}
        fill="none"
        stroke="var(--color-thread)"
        strokeWidth={1.25}
        strokeDasharray="6 8"
        strokeLinecap="round"
        opacity={active ? 0.85 : 0.18}
        initial={{ strokeDashoffset: 0 }}
        animate={{ strokeDashoffset: -200 }}
        transition={{ duration: 5, ease: "linear", repeat: Infinity }}
        style={{ filter: active ? "drop-shadow(0 0 6px var(--color-thread-glow))" : "none" }}
      />
    </svg>
  );
}
```

- [ ] **Step 2: `PaperMoon.tsx` — small planet variant for Openclaw moons**

```tsx
"use client";
import { motion } from "framer-motion";

interface PaperMoonProps {
  label: string;
  detail: string;
  angle: number;        // orbital angle in degrees
  radius: number;       // orbit radius in px
  onClick?: () => void;
  active?: boolean;
}

export function PaperMoon({ label, detail, angle, radius, onClick, active }: PaperMoonProps) {
  const x = Math.cos((angle * Math.PI) / 180) * radius;
  const y = Math.sin((angle * Math.PI) / 180) * radius;

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.1, x: x * 1.06, y: y * 1.06 }}
      style={{ position: "absolute", left: `calc(50% + ${x}px)`, top: `calc(50% + ${y}px)` }}
      className="-translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1 group"
      aria-label={`Lune ${label}`}
    >
      <span
        className="block w-12 h-12 rounded-full"
        style={{
          background: "var(--color-paper-cream)",
          boxShadow:
            "0 6px 12px rgba(0,0,0,0.5), 0 1px 2px rgba(0,0,0,0.3), inset -3px -3px 6px rgba(0,0,0,0.18)",
          outline: active ? "1px solid var(--color-thread)" : "none",
        }}
      />
      <span className="mono text-[10px] uppercase tracking-widest text-text-muted group-hover:text-text">
        {label}
      </span>
      <span className="serif-italic text-[11px] text-text-muted opacity-0 group-hover:opacity-100 transition max-w-[140px] text-center leading-tight">
        {detail}
      </span>
    </motion.button>
  );
}
```

- [ ] **Step 3: `EditorialTitle.tsx`**

```tsx
"use client";
import { motion } from "framer-motion";

interface EditorialTitleProps {
  children: React.ReactNode;
  size?: "xl" | "lg" | "md";
  as?: "h1" | "h2" | "h3";
  className?: string;
}

const sizes = {
  xl: "text-[clamp(72px,12vw,160px)] leading-[0.95]",
  lg: "text-[clamp(40px,6vw,72px)] leading-[1.05]",
  md: "text-[clamp(28px,4vw,44px)] leading-[1.1]",
};

export function EditorialTitle({ children, size = "lg", as = "h2", className = "" }: EditorialTitleProps) {
  const Tag = motion[as];
  return (
    <Tag
      className={`serif-italic text-text ${sizes[size]} ${className}`}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
    >
      {children}
    </Tag>
  );
}
```

- [ ] **Step 4: `TechPill.tsx`**

```tsx
interface TechPillProps {
  label: string;
}
export function TechPill({ label }: TechPillProps) {
  return (
    <span className="mono inline-flex items-center px-2.5 py-1 text-[11px] uppercase tracking-widest text-text-muted border border-hairline rounded-full">
      {label}
    </span>
  );
}
```

- [ ] **Step 5: `ScrollIndicator.tsx`**

```tsx
"use client";
import { motion } from "framer-motion";

export function ScrollIndicator() {
  return (
    <motion.div
      className="flex flex-col items-center gap-2 text-text-muted"
      animate={{ y: [0, 6, 0] }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
    >
      <span className="mono text-[10px] uppercase tracking-[0.3em]">scroll to explore</span>
      <span className="block w-px h-10 bg-hairline" />
    </motion.div>
  );
}
```

- [ ] **Step 6: Verify**

```bash
npm run build
```

Expected: build OK, 0 errors.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(ui): thread, moon, editorial title, tech pill, scroll indicator primitives"
```

---

## Phase 2 — Page Sections

### Task 8: PageShell + page.tsx skeleton

**Files:**
- Create: `/Users/aurian/Desktop/aurian-portfolio/src/components/layout/PageShell.tsx`
- Modify: `/Users/aurian/Desktop/aurian-portfolio/src/app/page.tsx`

- [ ] **Step 1: `PageShell.tsx`**

```tsx
export function PageShell({ children }: { children: React.ReactNode }) {
  return <main className="relative w-full overflow-x-hidden">{children}</main>;
}
```

- [ ] **Step 2: Replace `src/app/page.tsx`**

```tsx
import { PageShell } from "@/components/layout/PageShell";

export default function Home() {
  return (
    <PageShell>
      <section id="landing" className="min-h-screen flex items-center justify-center">
        <h1 className="serif-italic text-text text-[clamp(72px,12vw,160px)]">aurian.</h1>
      </section>
    </PageShell>
  );
}
```

- [ ] **Step 3: Verify dev**

```bash
npm run dev
```

Expected: `http://localhost:3000` shows centered "aurian." in italic serif on dark grain background.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(layout): page shell and landing skeleton"
```

---

### Task 9: Landing section

**Files:**
- Create: `/Users/aurian/Desktop/aurian-portfolio/src/components/sections/Landing.tsx`
- Modify: `/Users/aurian/Desktop/aurian-portfolio/src/app/page.tsx`

- [ ] **Step 1: Implement Landing**

```tsx
// src/components/sections/Landing.tsx
"use client";
import { motion } from "framer-motion";
import { PaperPlanet } from "@/components/ui/PaperPlanet";
import { ScrollIndicator } from "@/components/ui/ScrollIndicator";
import { profile, projects } from "@/lib/content";

const POSITIONS = [
  { top: "18%", left: "12%", size: 80 },
  { top: "30%", left: "78%", size: 64 },
  { top: "62%", left: "20%", size: 72 },
  { top: "70%", left: "70%", size: 90 },
  { top: "44%", left: "48%", size: 56 },
];

export function Landing() {
  return (
    <section id="landing" className="relative min-h-screen flex flex-col items-center justify-center px-6">
      {projects.map((p, i) => (
        <motion.div
          key={p.slug}
          className="absolute"
          style={{ top: POSITIONS[i].top, left: POSITIONS[i].left }}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 0.55, scale: 1 }}
          transition={{ delay: 0.2 + i * 0.15, duration: 1.2, ease: "easeOut" }}
        >
          <PaperPlanet color={p.paperColor} size={POSITIONS[i].size} seed={i + 1} />
        </motion.div>
      ))}
      <motion.h1
        className="serif-italic text-text text-[clamp(72px,12vw,160px)] leading-none text-center relative z-10"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: [0.2, 0.8, 0.2, 1] }}
      >
        aurian<span className="text-thread">.</span>
      </motion.h1>
      <motion.p
        className="serif-italic text-text-muted text-lg md:text-xl mt-6 max-w-xl text-center relative z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 1 }}
      >
        {profile.tagline}
      </motion.p>
      <div className="absolute bottom-10 z-10">
        <ScrollIndicator />
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Wire it in `page.tsx`**

```tsx
import { PageShell } from "@/components/layout/PageShell";
import { Landing } from "@/components/sections/Landing";

export default function Home() {
  return (
    <PageShell>
      <Landing />
    </PageShell>
  );
}
```

- [ ] **Step 3: Visual check**

`npm run dev`. Expected: 5 small distinct-color planets float around centered "aurian." title with tagline. Scroll indicator pulses at the bottom. No console errors.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(section): landing constellation with title and scroll indicator"
```

---

### Task 10: Prélude section

**Files:**
- Create: `/Users/aurian/Desktop/aurian-portfolio/src/components/ui/PaperSilhouette.tsx`
- Create: `/Users/aurian/Desktop/aurian-portfolio/src/components/sections/Prelude.tsx`
- Modify: `/Users/aurian/Desktop/aurian-portfolio/src/app/page.tsx`

- [ ] **Step 1: `PaperSilhouette.tsx` — abstract human silhouette**

```tsx
export function PaperSilhouette() {
  return (
    <svg viewBox="0 0 200 320" width="180" height="288" aria-hidden>
      <defs>
        <filter id="silShadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="10" stdDeviation="8" floodColor="#000" floodOpacity="0.6" />
        </filter>
      </defs>
      <g filter="url(#silShadow)" fill="var(--color-paper-cream)">
        <circle cx="100" cy="60" r="32" />
        <path d="M62 110 q38 -22 76 0 q14 18 14 90 q-22 12 -90 12 q-14 -28 0 -102z" />
        <rect x="92" y="200" width="16" height="92" rx="6" />
        <rect x="92" y="200" width="16" height="92" rx="6" transform="translate(8 0)" />
      </g>
    </svg>
  );
}
```

- [ ] **Step 2: `Prelude.tsx`**

```tsx
"use client";
import { motion } from "framer-motion";
import { PaperSilhouette } from "@/components/ui/PaperSilhouette";
import { profile, softSkills } from "@/lib/content";

const STAR_POSITIONS = [
  { top: "12%", left: "18%" },
  { top: "20%", left: "78%" },
  { top: "70%", left: "16%" },
  { top: "60%", left: "82%" },
];

export function Prelude() {
  return (
    <section id="prelude" className="relative min-h-screen flex items-center justify-center px-6 py-24">
      <div className="relative max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-12">
        <div className="relative">
          <PaperSilhouette />
          {softSkills.map((s, i) => (
            <motion.span
              key={s.slug}
              className="absolute serif-italic text-thread text-sm md:text-base whitespace-nowrap"
              style={STAR_POSITIONS[i]}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 + i * 0.2, duration: 0.8 }}
            >
              ✦ {s.label.toLowerCase()}
            </motion.span>
          ))}
        </div>
        <div className="max-w-md space-y-6">
          <p className="mono uppercase tracking-[0.3em] text-[10px] text-text-muted">prélude</p>
          <p className="serif-italic text-2xl md:text-3xl leading-snug">
            Je construis des outils qui pensent — entre rigueur du code et intuition du papier.
          </p>
          <p className="text-text-muted leading-relaxed">
            Automation, agents IA, dev web. Avec un goût pour les transitions douces, les
            interfaces lisibles, et les détails qu'on remarque au deuxième regard.
          </p>
          <div className="flex gap-4 mono text-[11px] text-text-muted">
            {profile.languages.map((l) => (
              <span key={l.code} className="flex flex-col">
                <span className="text-text">{l.code}</span>
                <span>{l.level}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Wire in `page.tsx`**

```tsx
import { PageShell } from "@/components/layout/PageShell";
import { Landing } from "@/components/sections/Landing";
import { Prelude } from "@/components/sections/Prelude";

export default function Home() {
  return (
    <PageShell>
      <Landing />
      <Prelude />
    </PageShell>
  );
}
```

- [ ] **Step 4: Visual check** — silhouette + 4 star labels + intro text. No console errors.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(section): prelude with silhouette and soft-skill stars"
```

---

### Task 11: ProjectPlanet generic section

**Files:**
- Create: `/Users/aurian/Desktop/aurian-portfolio/src/components/sections/ProjectPlanet.tsx`

- [ ] **Step 1: Implement**

```tsx
"use client";
import { motion } from "framer-motion";
import { ArrowUpRight, Github } from "lucide-react";
import type { Project } from "@/lib/content";
import { PaperPlanet } from "@/components/ui/PaperPlanet";
import { EditorialTitle } from "@/components/ui/EditorialTitle";
import { TechPill } from "@/components/ui/TechPill";
import { ThreadLine } from "@/components/ui/ThreadLine";

interface ProjectPlanetProps {
  project: Project;
  index: number;       // 0..4 — affects planet alignment alternation
  enlarged?: boolean;  // openclaw is 1.4x
  children?: React.ReactNode; // for moons composition
}

export function ProjectPlanet({ project, index, enlarged, children }: ProjectPlanetProps) {
  const reverse = index % 2 === 1;
  const planetSize = enlarged ? 320 : 240;

  return (
    <section
      id={`project-${project.slug}`}
      className="relative min-h-screen flex items-center px-6 py-24"
    >
      {/* incoming thread */}
      <div className="absolute top-0 left-0 right-0 -translate-y-1/2 pointer-events-none">
        <ThreadLine d="M0,100 C200,40 600,160 800,100" height={120} />
      </div>

      <div
        className={`relative max-w-6xl mx-auto w-full grid md:grid-cols-2 gap-12 items-center ${
          reverse ? "md:[&>*:first-child]:order-2" : ""
        }`}
      >
        <div className="flex justify-center relative">
          <PaperPlanet color={project.paperColor} size={planetSize} seed={index + 7} />
          {children}
        </div>

        <div className="space-y-6 max-w-lg">
          <p className="mono uppercase tracking-[0.3em] text-[11px] text-text-muted">
            chapitre {project.chapter}.
          </p>
          <EditorialTitle size="lg">{project.title}</EditorialTitle>
          {project.role && (
            <p className="mono text-[11px] uppercase tracking-widest text-text-muted">
              {project.role}
            </p>
          )}
          <div className="space-y-3 text-text-muted leading-relaxed whitespace-pre-line">
            {project.pitch}
          </div>
          <div>
            <p className="mono uppercase tracking-[0.3em] text-[10px] text-text-muted mb-2">stack</p>
            <div className="flex flex-wrap gap-2">
              {project.stack.map((t) => (
                <TechPill key={t} label={t} />
              ))}
            </div>
          </div>
          <div>
            <p className="mono uppercase tracking-[0.3em] text-[10px] text-text-muted mb-2">
              achievements
            </p>
            <ul className="space-y-1.5 text-text">
              {project.achievements.map((a, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-thread mt-1.5">·</span>
                  <span className="leading-snug">{a}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex gap-4 pt-2">
            {project.liveUrl && (
              <motion.a
                href={project.liveUrl}
                target="_blank"
                rel="noreferrer"
                whileHover={{ x: 2 }}
                className="mono text-[11px] uppercase tracking-widest inline-flex items-center gap-1 border-b border-hairline hover:border-thread hover:text-thread"
              >
                voir live <ArrowUpRight size={12} />
              </motion.a>
            )}
            {project.repoUrl && (
              <motion.a
                href={project.repoUrl}
                target="_blank"
                rel="noreferrer"
                whileHover={{ x: 2 }}
                className="mono text-[11px] uppercase tracking-widest inline-flex items-center gap-1 border-b border-hairline hover:border-thread hover:text-thread"
              >
                <Github size={12} /> github
              </motion.a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat(section): generic project planet template"
```

---

### Task 12: Wire 4 planets (Levels, Energizer, Mirakl, Music Agency)

**Files:**
- Modify: `/Users/aurian/Desktop/aurian-portfolio/src/app/page.tsx`

- [ ] **Step 1: Update `page.tsx`**

```tsx
import { PageShell } from "@/components/layout/PageShell";
import { Landing } from "@/components/sections/Landing";
import { Prelude } from "@/components/sections/Prelude";
import { ProjectPlanet } from "@/components/sections/ProjectPlanet";
import { projects } from "@/lib/content";

export default function Home() {
  const [levels, energizer, mirakl, music, openclaw] = projects;
  return (
    <PageShell>
      <Landing />
      <Prelude />
      <ProjectPlanet project={levels} index={0} />
      <ProjectPlanet project={energizer} index={1} />
      <ProjectPlanet project={mirakl} index={2} />
      <ProjectPlanet project={music} index={3} />
      {/* openclaw + moons in next task */}
    </PageShell>
  );
}
```

- [ ] **Step 2: Visual check** — scroll through. 4 planet sections alternate sides, threads visible at top of each, content readable, placeholders visible where data missing.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat(page): wire 4 project planets into home"
```

---

### Task 13: Openclaw planet with 3 moons

**Files:**
- Create: `/Users/aurian/Desktop/aurian-portfolio/src/components/sections/OpenclawPlanet.tsx`
- Modify: `/Users/aurian/Desktop/aurian-portfolio/src/app/page.tsx`

- [ ] **Step 1: Implement OpenclawPlanet**

```tsx
"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Project } from "@/lib/content";
import { ProjectPlanet } from "@/components/sections/ProjectPlanet";
import { PaperMoon } from "@/components/ui/PaperMoon";

interface Props {
  project: Project;
  index: number;
}

export function OpenclawPlanet({ project, index }: Props) {
  const [activeMoon, setActiveMoon] = useState<string | null>(null);
  const moons = project.moons ?? [];
  const angles = [-50, 90, -130]; // top-right, bottom, top-left

  return (
    <div className="relative">
      <ProjectPlanet project={project} index={index} enlarged>
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ width: 320, height: 320 }}
        >
          {moons.map((m, i) => (
            <div className="pointer-events-auto" key={m.name}>
              <PaperMoon
                label={m.name}
                detail={m.pitch}
                angle={angles[i]}
                radius={210}
                active={activeMoon === m.name}
                onClick={() => setActiveMoon(activeMoon === m.name ? null : m.name)}
              />
            </div>
          ))}
        </div>
      </ProjectPlanet>

      <AnimatePresence>
        {activeMoon && (
          <motion.div
            key={activeMoon}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className="max-w-3xl mx-auto px-6 -mt-12 mb-24"
          >
            {(() => {
              const m = moons.find((x) => x.name === activeMoon)!;
              return (
                <div className="border border-hairline rounded-lg p-6 bg-paper-deep/60 backdrop-blur">
                  <p className="mono uppercase tracking-[0.3em] text-[10px] text-thread mb-2">
                    lune — {m.name}
                  </p>
                  <p className="serif-italic text-xl mb-4">{m.pitch}</p>
                  <ul className="space-y-1 text-text-muted">
                    {m.bullets.map((b, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="text-thread mt-1.5">·</span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="flex flex-wrap gap-2 mt-4">
                    {m.stack.map((t) => (
                      <span
                        key={t}
                        className="mono text-[10px] uppercase tracking-widest text-text-muted border border-hairline px-2 py-0.5 rounded-full"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

- [ ] **Step 2: Wire in `page.tsx`**

```tsx
import { OpenclawPlanet } from "@/components/sections/OpenclawPlanet";
// ...
<ProjectPlanet project={music} index={3} />
<OpenclawPlanet project={openclaw} index={4} />
```

- [ ] **Step 3: Visual check** — Openclaw planet enlarged, 3 moons orbiting. Click a moon → detail panel slides in. Click again → collapses.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(section): openclaw planet with 3 orbital moons"
```

---

## Phase 3 — Signature Sections & Polish

### Task 14: Threads section (signature)

**Files:**
- Create: `/Users/aurian/Desktop/aurian-portfolio/src/components/sections/Threads.tsx`
- Modify: `/Users/aurian/Desktop/aurian-portfolio/src/app/page.tsx`

The visual centerpiece. Wide-shot constellation re-displayed. Four threads light up in stagger; each carries one mini-quote.

- [ ] **Step 1: Implement Threads**

```tsx
// src/components/sections/Threads.tsx
"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { projects, softSkills } from "@/lib/content";
import { PaperPlanet } from "@/components/ui/PaperPlanet";
import { ThreadLine } from "@/components/ui/ThreadLine";
import { EditorialTitle } from "@/components/ui/EditorialTitle";

// canonical positions per project slug, in viewBox coords (1000x600)
const PLANET_POS: Record<string, { x: number; y: number; size: number }> = {
  levels:         { x: 180, y: 180, size: 70 },
  energizer:      { x: 480, y: 110, size: 64 },
  mirakl:         { x: 820, y: 200, size: 60 },
  "music-agency": { x: 700, y: 460, size: 70 },
  openclaw:       { x: 240, y: 460, size: 90 },
};

function pathBetween(a: string, b: string) {
  const A = PLANET_POS[a], B = PLANET_POS[b];
  if (!A || !B) return "";
  const mx = (A.x + B.x) / 2;
  const my = (A.y + B.y) / 2 - 30;
  return `M${A.x},${A.y} Q${mx},${my} ${B.x},${B.y}`;
}

function chainPaths(slugs: string[]): string[] {
  const out: string[] = [];
  for (let i = 0; i < slugs.length - 1; i++) out.push(pathBetween(slugs[i], slugs[i + 1]));
  return out;
}

export function Threads() {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  return (
    <section id="threads" className="relative min-h-screen flex flex-col items-center justify-center px-6 py-24">
      <div className="text-center mb-12 max-w-2xl">
        <p className="mono uppercase tracking-[0.3em] text-[11px] text-text-muted mb-4">
          les fils
        </p>
        <EditorialTitle size="lg">
          <span className="text-text">soft skills, </span>
          <span className="text-thread">tendus</span>
          <span className="text-text"> entre les projets.</span>
        </EditorialTitle>
      </div>

      <div className="relative w-full max-w-5xl aspect-[5/3]">
        <svg viewBox="0 0 1000 600" className="absolute inset-0 w-full h-full">
          {softSkills.map((s, i) => {
            const paths = chainPaths(s.linkedProjectSlugs);
            const active = activeIdx === null || activeIdx === i;
            return paths.map((d, j) => (
              <motion.path
                key={`${s.slug}-${j}`}
                d={d}
                fill="none"
                stroke="var(--color-thread)"
                strokeWidth={activeIdx === i ? 2 : 1.1}
                strokeDasharray="6 8"
                strokeLinecap="round"
                opacity={active ? 0.85 : 0.12}
                initial={{ pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 + i * 0.5 + j * 0.1, duration: 1.2, ease: "easeOut" }}
                style={{ filter: active ? "drop-shadow(0 0 6px var(--color-thread-glow))" : "none" }}
              />
            ));
          })}
          {projects.map((p) => {
            const pos = PLANET_POS[p.slug];
            return (
              <foreignObject
                key={p.slug}
                x={pos.x - pos.size / 2}
                y={pos.y - pos.size / 2}
                width={pos.size}
                height={pos.size}
              >
                <PaperPlanet color={p.paperColor} size={pos.size} rotate={false} seed={p.slug.length} />
              </foreignObject>
            );
          })}
        </svg>
      </div>

      <div className="mt-12 grid md:grid-cols-2 gap-6 max-w-3xl w-full">
        {softSkills.map((s, i) => (
          <motion.button
            key={s.slug}
            type="button"
            onMouseEnter={() => setActiveIdx(i)}
            onMouseLeave={() => setActiveIdx(null)}
            onFocus={() => setActiveIdx(i)}
            onBlur={() => setActiveIdx(null)}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.6 + i * 0.2 }}
            className="text-left border border-hairline rounded-md p-5 hover:border-thread/40 transition group"
          >
            <p className="mono uppercase tracking-[0.3em] text-[10px] text-thread group-hover:text-thread mb-2">
              fil 0{i + 1}
            </p>
            <p className="serif-italic text-2xl mb-1">{s.label.toLowerCase()}</p>
            <p className="text-text-muted serif-italic text-base">« {s.quote} »</p>
          </motion.button>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Wire in `page.tsx`** — add `<Threads />` after `<OpenclawPlanet ... />`.

- [ ] **Step 3: Visual check** — wide constellation with mint paths drawn between linked planets. Hover a soft-skill card → its thread brightens, others dim.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(section): soft-skill threads signature"
```

---

### Task 15: StellarMap (CV + hobbies + stack + contact)

**Files:**
- Create: `/Users/aurian/Desktop/aurian-portfolio/src/components/sections/StellarMap.tsx`
- Modify: `/Users/aurian/Desktop/aurian-portfolio/src/app/page.tsx`

- [ ] **Step 1: Implement**

```tsx
"use client";
import { motion } from "framer-motion";
import { Mail, Linkedin, Github, FileDown } from "lucide-react";
import { profile, hobbies, stack } from "@/lib/content";
import { EditorialTitle } from "@/components/ui/EditorialTitle";

const groupLabel: Record<string, string> = {
  lang: "langages",
  data: "data & bi",
  cloud: "cloud",
  ai: "ai / agents",
  other: "autres",
};

export function StellarMap() {
  const grouped = stack.reduce<Record<string, typeof stack>>((acc, t) => {
    (acc[t.category] ||= []).push(t);
    return acc;
  }, {});

  return (
    <section id="map" className="relative min-h-screen px-6 py-24">
      <div className="max-w-6xl mx-auto space-y-16">
        <header className="text-center max-w-2xl mx-auto">
          <p className="mono uppercase tracking-[0.3em] text-[11px] text-text-muted mb-4">
            carte stellaire
          </p>
          <EditorialTitle size="lg">le plan, déplié.</EditorialTitle>
        </header>

        {/* CV */}
        <div className="grid md:grid-cols-2 gap-12">
          <div>
            <p className="mono uppercase tracking-[0.3em] text-[10px] text-text-muted mb-4">
              parcours
            </p>
            <ul className="space-y-6 border-l border-hairline pl-6">
              <li>
                <p className="serif-italic text-xl">{profile.cvCurrent}</p>
              </li>
              <li>
                <p className="serif-italic text-xl">{profile.cvPrevious}</p>
              </li>
              <li>
                <p className="serif-italic text-xl">{profile.formation}</p>
              </li>
            </ul>
            <a
              href={profile.cvPdf}
              download
              className="mt-6 mono text-[11px] uppercase tracking-widest inline-flex items-center gap-2 border border-hairline rounded-full px-4 py-2 hover:border-thread hover:text-thread transition"
            >
              <FileDown size={12} /> télécharger cv (pdf)
            </a>
          </div>

          {/* Hobbies as orbital moons */}
          <div>
            <p className="mono uppercase tracking-[0.3em] text-[10px] text-text-muted mb-4">
              orbites
            </p>
            <ul className="flex flex-wrap gap-3">
              {hobbies.map((h, i) => (
                <motion.li
                  key={h.label}
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="border border-hairline rounded-full px-4 py-1.5 flex items-center gap-2"
                >
                  <span className="w-2 h-2 rounded-full bg-paper-cream" />
                  <span className="serif-italic text-base">{h.label.toLowerCase()}</span>
                  {h.detail && <span className="mono text-[10px] text-text-muted">— {h.detail}</span>}
                </motion.li>
              ))}
            </ul>
          </div>
        </div>

        {/* Stack HUD */}
        <div>
          <p className="mono uppercase tracking-[0.3em] text-[10px] text-text-muted mb-4 text-center">
            stack
          </p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 border border-hairline rounded-lg p-8">
            {Object.keys(groupLabel).map((cat) => (
              <div key={cat}>
                <p className="mono uppercase tracking-[0.3em] text-[10px] text-thread mb-3">
                  {groupLabel[cat]}
                </p>
                <ul className="space-y-1.5">
                  {(grouped[cat] ?? []).map((t) => (
                    <li key={t.label} className="text-sm text-text">
                      {t.label}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Contact */}
        <div className="text-center max-w-xl mx-auto space-y-6">
          <p className="mono uppercase tracking-[0.3em] text-[10px] text-text-muted">contact</p>
          <p className="serif-italic text-2xl">{profile.tagline}</p>
          <div className="flex justify-center gap-4 flex-wrap">
            <a
              href={`mailto:${profile.email}`}
              className="mono text-[11px] uppercase tracking-widest border border-hairline rounded-full px-4 py-2 inline-flex items-center gap-2 hover:border-thread hover:text-thread transition"
            >
              <Mail size={12} /> email
            </a>
            <a
              href={profile.linkedin}
              target="_blank"
              rel="noreferrer"
              className="mono text-[11px] uppercase tracking-widest border border-hairline rounded-full px-4 py-2 inline-flex items-center gap-2 hover:border-thread hover:text-thread transition"
            >
              <Linkedin size={12} /> linkedin
            </a>
            <a
              href={profile.github}
              target="_blank"
              rel="noreferrer"
              className="mono text-[11px] uppercase tracking-widest border border-hairline rounded-full px-4 py-2 inline-flex items-center gap-2 hover:border-thread hover:text-thread transition"
            >
              <Github size={12} /> github
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Wire in `page.tsx`** — add `<StellarMap />` after `<Threads />`.

- [ ] **Step 3: Add placeholder `cv-aurian.pdf`**

```bash
printf '%%PDF-1.4\n%%placeholder\n' > public/cv-aurian.pdf
```

(Real PDF replaces this later.)

- [ ] **Step 4: Visual check** — CV timeline, hobbies pills, stack 5-column grid, contact buttons. Download CV link works (returns placeholder).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(section): stellar map with cv, hobbies, stack, contact"
```

---

### Task 16: Outro + console easter egg

**Files:**
- Create: `/Users/aurian/Desktop/aurian-portfolio/src/components/sections/Outro.tsx`
- Create: `/Users/aurian/Desktop/aurian-portfolio/src/components/ConsoleEasterEgg.tsx`
- Modify: `/Users/aurian/Desktop/aurian-portfolio/src/app/page.tsx`

- [ ] **Step 1: `Outro.tsx`**

```tsx
"use client";
import { motion } from "framer-motion";
import { ArrowUp } from "lucide-react";
import { projects, profile, outroQuote } from "@/lib/content";
import { PaperPlanet } from "@/components/ui/PaperPlanet";

const POSITIONS = [
  { top: "20%", left: "16%", size: 90 },
  { top: "30%", left: "78%", size: 72 },
  { top: "62%", left: "22%", size: 80 },
  { top: "70%", left: "72%", size: 100 },
  { top: "44%", left: "50%", size: 64 },
];

export function Outro() {
  return (
    <section id="outro" className="relative min-h-screen flex flex-col items-center justify-center px-6 py-24">
      {projects.map((p, i) => (
        <motion.div
          key={p.slug}
          className="absolute"
          style={{ top: POSITIONS[i].top, left: POSITIONS[i].left }}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 0.85 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.15, duration: 1 }}
        >
          <PaperPlanet color={p.paperColor} size={POSITIONS[i].size} seed={i + 11} />
        </motion.div>
      ))}
      <motion.p
        className="serif-italic text-3xl md:text-5xl text-center max-w-3xl relative z-10 leading-snug"
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 1 }}
      >
        {outroQuote}
      </motion.p>
      <div className="flex gap-6 mt-12 relative z-10">
        <a
          href={`mailto:${profile.email}`}
          className="mono text-[12px] uppercase tracking-widest border-b border-thread text-thread hover:opacity-80"
        >
          écrivez-moi →
        </a>
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="mono text-[12px] uppercase tracking-widest text-text-muted hover:text-text inline-flex items-center gap-1"
        >
          <ArrowUp size={12} /> rejouer
        </button>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: `ConsoleEasterEgg.tsx`**

```tsx
"use client";
import { useEffect } from "react";

const cppArt = `
// =====================================================
//   openclaw — agents inspired by Captain Claw '97
//   original c++ source: github.com/[À FOURNIR]
// =====================================================
//
//   #include <iostream>
//   int main() {
//       std::cout << "hello, recruiter." << std::endl;
//       return 0;
//   }
//
//   built with care by aurian.
//
`;

export function ConsoleEasterEgg() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    // eslint-disable-next-line no-console
    console.log("%c" + cppArt, "color:#A4F5C8;font-family:monospace;font-size:11px;line-height:1.4;");
  }, []);
  return null;
}
```

- [ ] **Step 3: Wire in `page.tsx`**

```tsx
import { Threads } from "@/components/sections/Threads";
import { StellarMap } from "@/components/sections/StellarMap";
import { Outro } from "@/components/sections/Outro";
import { ConsoleEasterEgg } from "@/components/ConsoleEasterEgg";
// ...
      <Threads />
      <StellarMap />
      <Outro />
      <ConsoleEasterEgg />
```

- [ ] **Step 4: Visual + console check** — full constellation + outro quote + CTAs. DevTools console shows mint C++ ASCII block.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(section): outro and console easter egg"
```

---

### Task 17: Pulse transition between sections

**Files:**
- Create: `/Users/aurian/Desktop/aurian-portfolio/src/components/ui/PulseDivider.tsx`
- Modify: section files to add the divider between sections

- [ ] **Step 1: Implement `PulseDivider.tsx`**

```tsx
"use client";
import { motion } from "framer-motion";

export function PulseDivider() {
  return (
    <div className="relative w-full h-px overflow-visible" aria-hidden>
      <motion.span
        className="absolute left-0 top-0 h-px"
        style={{
          width: "100%",
          background:
            "linear-gradient(90deg, transparent 0%, var(--color-thread) 50%, transparent 100%)",
        }}
        initial={{ opacity: 0, scaleX: 0.2 }}
        whileInView={{ opacity: [0, 1, 0], scaleX: [0.2, 1, 1] }}
        viewport={{ once: false, amount: 0.8 }}
        transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
      />
    </div>
  );
}
```

- [ ] **Step 2: Insert in `page.tsx` between sections**

```tsx
<Landing />
<PulseDivider />
<Prelude />
<PulseDivider />
<ProjectPlanet project={levels} index={0} />
<PulseDivider />
<ProjectPlanet project={energizer} index={1} />
<PulseDivider />
<ProjectPlanet project={mirakl} index={2} />
<PulseDivider />
<ProjectPlanet project={music} index={3} />
<PulseDivider />
<OpenclawPlanet project={openclaw} index={4} />
<PulseDivider />
<Threads />
<PulseDivider />
<StellarMap />
<PulseDivider />
<Outro />
```

Add the import: `import { PulseDivider } from "@/components/ui/PulseDivider";`

- [ ] **Step 3: Visual check** — scrolling between sections triggers a brief mint hairline sweep.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(ui): pulse divider between sections"
```

---

### Task 18: SEO meta + static OG image + favicon

**Files:**
- Create: `/Users/aurian/Desktop/aurian-portfolio/public/og-image.png` (1200x630)
- Create: `/Users/aurian/Desktop/aurian-portfolio/public/favicon.ico`
- Create: `/Users/aurian/Desktop/aurian-portfolio/scripts/generate-og.mjs`
- Modify: `/Users/aurian/Desktop/aurian-portfolio/package.json`

Since static export forbids `/api/og`, generate the OG image at build time as a static PNG using `@vercel/og` in CLI mode, or simpler: use `sharp` to compose an SVG to PNG.

- [ ] **Step 1: Add sharp**

```bash
npm install -D sharp
```

- [ ] **Step 2: `scripts/generate-og.mjs`**

```js
import sharp from "sharp";
import { writeFileSync } from "node:fs";

const svg = Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <defs>
    <radialGradient id="bg" cx="50%" cy="40%" r="80%">
      <stop offset="0%" stop-color="#14161B"/>
      <stop offset="100%" stop-color="#07080A"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <circle cx="220" cy="180" r="46" fill="#ECE6D6" opacity="0.85"/>
  <circle cx="980" cy="160" r="34" fill="#A8C4B0" opacity="0.85"/>
  <circle cx="180" cy="500" r="38" fill="#B89968" opacity="0.85"/>
  <circle cx="1020" cy="490" r="50" fill="#C8A99B" opacity="0.85"/>
  <circle cx="600" cy="540" r="28" fill="#8E8B83" opacity="0.85"/>
  <text x="600" y="320" text-anchor="middle"
        font-family="Georgia,serif" font-style="italic" font-size="160" fill="#ECE6D6">
    aurian<tspan fill="#A4F5C8">.</tspan>
  </text>
  <text x="600" y="380" text-anchor="middle"
        font-family="Georgia,serif" font-style="italic" font-size="28" fill="#6B6660">
    une nuit éditoriale, cinq planètes, des fils de menthe.
  </text>
</svg>`);

const png = await sharp(svg).png().toBuffer();
writeFileSync("public/og-image.png", png);
console.log("og-image.png written");
```

- [ ] **Step 3: Add npm script and run it**

In `package.json` `"scripts"`: `"og": "node scripts/generate-og.mjs"`. Then:

```bash
npm run og
```

Expected: `public/og-image.png` exists, ~30-80 KB.

- [ ] **Step 4: Favicon — generate quick mint dot**

```bash
node -e "import('sharp').then(({default:s})=>s(Buffer.from('<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"64\" height=\"64\"><circle cx=\"32\" cy=\"32\" r=\"24\" fill=\"#A4F5C8\"/></svg>')).png().toFile('public/favicon.png'))"
cp public/favicon.png public/favicon.ico  # crude but valid for browsers
```

(`favicon.ico` accepting a PNG is supported by all modern browsers; it's fine for portfolio.)

- [ ] **Step 5: Verify metadata renders**

```bash
npm run build
```

In `out/index.html` confirm `<meta property="og:image" content="..."/>` references `/og-image.png`.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(seo): static og image, favicon, and meta tags"
```

---

### Task 19: Mobile responsive pass + reduced motion

**Files:**
- Modify: each section component

- [ ] **Step 1: Audit at 375×667 in dev**

```bash
npm run dev
```

Open DevTools → device toolbar → iPhone SE. Walk through every section; note overflow, broken layouts, illegible text.

- [ ] **Step 2: Fix Threads section on mobile**

In `Threads.tsx`, add `aspect-[1/1.2]` for narrow screens by replacing `aspect-[5/3]` with `aspect-[5/3] md:aspect-[5/3] aspect-[4/5]`. Reduce planet sizes via the `PLANET_POS` mapping if needed (proportional via viewBox is fine — no change).

- [ ] **Step 3: Fix Landing planet positions on mobile**

In `Landing.tsx`, prefix positions with responsive classes if any overflow. Wrap each motion.div with `className="absolute hidden sm:block"` for the smaller decorative ones if they crowd the title on mobile. Keep the 2 most prominent.

```tsx
<motion.div
  key={p.slug}
  className={`absolute ${i >= 3 ? "hidden sm:block" : ""}`}
  ...
```

- [ ] **Step 4: Fix Openclaw moons on small screens**

In `OpenclawPlanet.tsx`, lower moon orbit radius on mobile by passing `radius={typeof window !== "undefined" && window.innerWidth < 640 ? 140 : 210}`. Better: use a CSS-only approach — move the orbit container to `scale-[0.7] sm:scale-100`.

```tsx
<div className="absolute inset-0 pointer-events-none scale-[0.65] sm:scale-100 origin-center" ...>
```

- [ ] **Step 5: Reduced motion check**

DevTools → Rendering → Emulate CSS media feature `prefers-reduced-motion: reduce`. Reload. Animations should be near-instant. The CSS rule already added in Task 2 step 2 handles this globally.

- [ ] **Step 6: Re-build**

```bash
npm run build
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "fix(responsive): mobile layout adjustments and reduced-motion sanity"
```

---

### Task 20: Playwright smoke test

**Files:**
- Create: `/Users/aurian/Desktop/aurian-portfolio/playwright.config.ts`
- Create: `/Users/aurian/Desktop/aurian-portfolio/e2e/portfolio.spec.ts`
- Modify: `/Users/aurian/Desktop/aurian-portfolio/package.json`

- [ ] **Step 1: `playwright.config.ts`**

```ts
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  use: {
    baseURL: "http://localhost:3000",
    headless: true,
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
```

- [ ] **Step 2: Install browsers**

```bash
npx playwright install chromium
```

- [ ] **Step 3: `e2e/portfolio.spec.ts`**

```ts
import { test, expect } from "@playwright/test";

test("renders all sections without console errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });

  await page.goto("/");
  await expect(page.getByRole("heading", { name: /aurian\./i })).toBeVisible();

  for (const id of ["landing", "prelude", "project-levels", "project-energizer", "project-mirakl", "project-music-agency", "project-openclaw", "threads", "map", "outro"]) {
    const el = page.locator(`#${id}`);
    await el.scrollIntoViewIfNeeded();
    await expect(el).toBeVisible();
  }

  expect(errors).toEqual([]);
});

test("openclaw moon expands on click", async ({ page }) => {
  await page.goto("/");
  const webdev = page.getByRole("button", { name: /Lune Webdev/i });
  await webdev.scrollIntoViewIfNeeded();
  await webdev.click();
  await expect(page.getByText(/lune — Webdev/i)).toBeVisible();
});
```

- [ ] **Step 4: Add script to `package.json`**

```json
"e2e": "playwright test"
```

- [ ] **Step 5: Run tests**

```bash
npm run e2e
```

Expected: 2 passed.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "test(e2e): playwright smoke test for sections and interaction"
```

---

### Task 21: Lighthouse + final polish

**Files:**
- Modify: any underperforming files

- [ ] **Step 1: Build production**

```bash
npm run build
npx serve out -l 3001
```

- [ ] **Step 2: Run Lighthouse against `http://localhost:3001`**

In Chrome DevTools → Lighthouse → Desktop → Performance + Accessibility + Best Practices. Run.

Target: Performance ≥ 85, Accessibility ≥ 90, Best Practices ≥ 90.

- [ ] **Step 3: Common fixes if missed**
- LCP poor → reduce above-the-fold animations; ensure title text isn't behind animated planets that delay paint.
- Accessibility: add `aria-label` on icon-only buttons, ensure color contrast on `text-text-muted` body copy (raise to `text` if any < 4.5:1).
- Best practices: replace `console.log` easter egg with `console.info` (it's not an error).

- [ ] **Step 4: Stop the server, commit**

```bash
git add -A
git commit -m "perf: lighthouse pass and accessibility fixes"
```

---

### Task 22: Push and deploy to GitHub Pages

**Files:** none

- [ ] **Step 1: Create the GitHub repo**

```bash
gh repo create aurian-portfolio --public --source=. --remote=origin
```

(If `gh` not installed: create the empty repo manually on github.com, then `git remote add origin git@github.com:<user>/aurian-portfolio.git`.)

- [ ] **Step 2: Enable Pages from Actions**

```bash
gh repo edit --enable-pages || true
```

Then in browser: repo → Settings → Pages → Source = **GitHub Actions**.

- [ ] **Step 3: Push main**

```bash
git branch -M main
git push -u origin main
```

- [ ] **Step 4: Verify deployment**

```bash
gh run watch
```

Wait for the `Deploy to GitHub Pages` workflow to succeed. Then:

```bash
gh browse
```

Expected: site live at `https://<user>.github.io/aurian-portfolio/`. All sections render, no console errors, OG preview correct (test with `https://www.opengraph.xyz/url/...`).

- [ ] **Step 5: README — update with live URL**

Add the live URL as the first line under the title. Commit + push.

```bash
git add README.md
git commit -m "docs: add live deployment url"
git push
```

---

## Self-Review Checklist (run after writing all tasks)

**Spec coverage map:**
- §1 concept narratif → Tasks 9, 10, 14 (landing, prelude, threads)
- §2 décisions design → Task 1 (stack), Task 2 (palette), Task 17 (pulse)
- §3.1 palette → Task 2
- §3.2 typo → Task 2
- §3.3 textures → Task 2 (grain), Task 6 (drop shadows)
- §3.4 animations signature → Tasks 6 (rotate), 7 (thread dash), 17 (pulse divider)
- §4 sections architecture → Tasks 8-16
- §5 anatomie planète → Task 11 (template) + Task 13 (openclaw special)
- §6 contenu → Task 5 (data), placeholders for items needing input
- §7 fils → Task 14
- §8 carte stellaire → Task 15
- §9 stack → Task 1, deploy in Task 4 + 22
- §10 inputs → README documents them; placeholders rendered
- §11 risques → mitigations are baked into phasing (Tasks 8-9 deliver shippable site early)
- §12 DoD → Task 20 (e2e) + Task 21 (lighthouse) + Task 22 (deploy) cover all 12 items
- §13 brand cohérence Energizer → menthe + fonts + pulse all in Tasks 2 and 17
- §14 hors scope → respected (no WebGL, no audio, no light mode)

**Placeholder scan:** All `[À FOURNIR — ...]` strings are intentional content placeholders (visible to user post-deploy as a checklist). No `TODO`/`TBD` in code.

**Type consistency:** `Project`, `SoftSkill`, `Hobby`, `StackTool`, `Profile`, `Moon`, `PaperColor` defined once in Task 5 and consumed by all later tasks. `slug` strings consistent. `paperColor` token names match Tailwind tokens defined in Task 2.

---



