# aurian-portfolio

Personal portfolio — an interactive 3D universe of planets, stars and projects.
Built as a static Next.js 16 export, deployed to GitHub Pages.

Live: https://codeurfort.github.io/aurian-portfolio

## Stack

- **Next.js 16** (App Router, static export)
- **React 19** + **TypeScript**
- **Tailwind CSS v4**
- **Framer Motion** for 2D motion
- **React Three Fiber** + **drei** for the 3D scene
- **Web Audio API** for synthesized SFX (zero audio assets)
- **Vitest** (unit) + **Playwright** (e2e smoke)

## Scripts

```bash
npm install
npm run dev        # local dev server
npm run build      # static export → ./out
npm run lint
npm test           # vitest unit tests
npm run test:e2e   # playwright smoke
```

## Project structure

```
src/
  app/                    Next.js App Router entry (layout, page, globals)
  components/
    3d/PortfolioUniverse  Main R3F scene (planets, stars, overlays)
    ui/                   Small reusable visual primitives
    Chatbot, LangToggle, SocialDock, SoundToggle, …
  lib/
    content.ts            Bilingual content (FR/EN) — projects, stack, profile
    i18n.tsx              Language context + UI string dictionary
    sound.ts              Web Audio synth (mute toggle, SFX, ambient pad)
    thelookQuery.ts       Raw SQL shown in the TheLook overlay
public/                   Static assets (CV, OG image, project visuals)
docs/superpowers/         Design spec + implementation plan
e2e/                      Playwright smoke tests
scripts/generate-og.mjs   Build-time OG image generator
```

## Deploy

Pushes to `main` trigger `.github/workflows/deploy.yml` which builds and
publishes the `out/` directory to GitHub Pages.

For a custom domain, drop a `CNAME` file in `public/` and unset
`NEXT_PUBLIC_USE_BASE_PATH` in the workflow.
