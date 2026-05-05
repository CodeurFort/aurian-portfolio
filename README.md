# aurian-portfolio

Personal portfolio. Next.js 16 static export → GitHub Pages.

## Dev

```bash
npm install
npm run dev
```

## Build

```bash
npm run build   # output in ./out
```

## Deploy

Push to `main`. The `deploy.yml` workflow builds and publishes to GitHub Pages.

For a custom domain (e.g. `aurian.dev`), drop a `CNAME` file in `public/` and unset `NEXT_PUBLIC_USE_BASE_PATH` in the workflow.

## Inputs still needed

See `docs/superpowers/specs/2026-05-05-portfolio-constellation-design.md` § 10.
