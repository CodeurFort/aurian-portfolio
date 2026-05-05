# Portfolio Aurian — Constellation Papier Découpé

**Date :** 2026-05-05
**Statut :** Design validé
**Auteur :** Aurian (cadrage avec Claude Opus 4)
**Contrainte :** 1 jour effectif d'exécution
**Déploiement :** GitHub Pages (static export Next.js)

---

## 1. Concept narratif

> *« Une nuit éditoriale où 5 planètes de papier flottent. Des fils de menthe les relient — ce sont mes soft skills qui les ont rendues possibles. »*

Portfolio = livre pop-up cosmique scrollable. 5 planètes = 5 projets. Fils tendus entre projets racontent comment les soft skills traversent le travail.

Public : recruteurs tech (corporate + scale-up + agence) qui scannent en 30-90s. Métaphore comprise instantanément, contenu scannable sans cliquer.

---

## 2. Décisions design verrouillées

| Décision | Choix |
|---|---|
| Métaphore | Constellation 5 planètes reliées par fils soft skills |
| Style | Papier découpé 2D, ombres profondes, grain papier |
| Personnalité | Soft luxury dark / éditorial premium |
| Navigation | Scroll-driven cinématique |
| Tech stack | Next.js 16 + React 19 + Framer Motion + SVG + Tailwind v4 + TS |
| Pas de WebGL/R3F | Path A retenu (1 jour, < 500 Ko) |
| Ton | Hybride : poétique structure/transitions, factuel stack/achievements |
| Hosting | **GitHub Pages** (static export) |

---

## 3. Système d'identité visuelle

### 3.1 Palette (Tailwind v4 `@theme inline`)

```css
--paper-bg       #0E0F12
--paper-deep     #07080A
--paper-cream    #ECE6D6
--paper-blush    #C8A99B
--paper-stone    #8E8B83
--paper-ochre    #B89968
--paper-mint     #A8C4B0
--paper-ink      #1A1B1F
--thread         #A4F5C8
--thread-glow    #A4F5C840
--text           #ECE6D6
--text-muted     #6B6660
--text-subtle    #3A3D38
--hairline       #1F2521
```

### 3.2 Typographie (`next/font/google`)

- `Instrument Serif` (italic) — titres, citations
- `Inter Tight` — body, UI (200/400/500/700)
- `IBM Plex Mono` — stack, dates, données (400/500)

### 3.3 Textures
- Grain papier SVG noise overlay 8-12 % opacity
- Drop-shadows 2-3 layers par découpage
- Hairlines 1px en `--hairline`
- Pas d'images bitmap pour planètes — tout SVG

### 3.4 Animations signature
- **Pulse** : hairline menthe traverse écran à chaque transition (600ms ease-out)
- Fils : dash-array animé (loop 4-6s)
- Hover planète → fil correspondant s'illumine

---

## 4. Architecture sections

```
0. LANDING            wide shot constellation + "aurian." 96-140pt
1. PRÉLUDE            silhouette + soft skills étoiles
2. LEVELS             planète 1 — papier crème
3. ENERGIZER          planète 2 — papier menthe pâle
4. MIRAKL             planète 3 — papier ocre
5. MUSIC AGENCY       planète 4 — papier blush
6. OPENCLAW + 3 LUNES planète 5 — papier stone
7. LES FILS           4 fils soft skills illuminés en stagger
8. CARTE STELLAIRE    CV + hobbies + stack + contact
9. OUTRO              constellation entière illuminée + CTA
```

---

## 5. Anatomie planète

```
chapitre 0X. (Plex Mono 11px uppercase muted)
NomDuProjet (Instrument Serif italic 56pt)

[planète SVG]    Contexte (2 paragraphes)
                 Stack pills [react] [supabase]
                 Achievements bullets
                 [↗ live]  [github →]

fils menthe entrant + sortant
```

**Cas Openclaw** : planète 1.4×, 3 lunes orbitales (Webdev/Vidéo/Assistance), hover détache la lune.

---

## 6. Contenu projets (5 planètes)

### 6.1 Levels (papier crème — pos. 1)
⚠️ INPUT NEEDED — pitch, rôle, achievements, stack, URL, GitHub

### 6.2 Energizer SEO/GEO/AEO (papier menthe — pos. 2)
- Agent IA 5 étapes (Stratégie, Veille, Concurrence, Critique, Scoring) + Blog Redactor
- Multi-tenant
- FastAPI + Next.js + Supabase + OpenAI + DALL-E
- Scoring /100 (SEO + GEO + E-E-A-T + Pertinence) avec auto-revision
- Crawler maison BeautifulSoup
- Stack : FastAPI · Next.js 16 · Supabase · OpenAI GPT-4 · DALL-E 3 · Tailwind v4 · Vercel · Railway

### 6.3 Mirakl Prospector (papier ocre — pos. 3)
⚠️ INPUT NEEDED — contexte hackathon, équipe/solo, résultat, stack, lien

### 6.4 Music Agency 5 Dust (papier blush — pos. 4)
⚠️ INPUT NEEDED — 5 agents Dust, rôles, artistes/labels, résultats

### 6.5 Openclaw + 3 lunes (papier stone — pos. 5)
⚠️ INPUT NEEDED — pitch + repo C++ original + détail 3 lunes (webdev/vidéo/assistance)
- Easter egg console : ASCII art C++ commenté

---

## 7. Section "Les Fils"

| Fil | Projets reliés | Mini-citation |
|---|---|---|
| Créativité | Levels, Music Agency, Openclaw | *« quand le code rencontre l'intuition »* |
| Adaptabilité | Mirakl, Energizer, Openclaw | *« d'un univers à l'autre, sans perdre le fil »* |
| Travailleur | Energizer, Levels | *« la rigueur comme matière première »* |
| Sociabilité | Music Agency, Openclaw | *« comprendre l'humain avant l'outil »* |

Hover fil → planètes pulsent. Click fil → citation s'agrandit.

---

## 8. Carte Stellaire

### 8.1 Hobbies (lunes orbitales)
Musique · Théâtre · Échecs (élo 1600) · Jujitsu brésilien · Poésie · Séries · Mindset

### 8.2 CV
- VSOLUTION (avril 2026 →) automation, dev web, agents IA
- ⚠️ INPUT NEEDED : poste précédent, formation
- Bouton "télécharger CV (PDF)" → fichier statique `/public/cv-aurian.pdf`

### 8.3 Stack HUD
- Langages : Python · SQL · JS · TS
- Data/BI : Power BI · Tableau · Airtable
- Backend/Cloud : Supabase · Firebase · Vercel · Railway
- AI : Dust · OpenAI · Claude · Anthropic SDK
- Other : Excel · Notion · Slack

### 8.4 Contact
Email · LinkedIn · GitHub · Twitter (optionnel)

---

## 9. Stack technique

```json
{
  "framework": "Next.js 16 App Router (output: export)",
  "react": "19",
  "typescript": "5 strict",
  "styling": "Tailwind v4 @theme inline",
  "animation": "Framer Motion",
  "scroll": "Framer Motion useScroll/useTransform",
  "fonts": "next/font/google",
  "icons": "Lucide React",
  "pdf": "Static file in /public",
  "deploy": "GitHub Pages via GitHub Actions"
}
```

### Performance cibles
- LCP < 2s sur 4G
- Bundle < 500 Ko gzip
- Mobile-first 320px → 1920px
- SSG static, pas de loading spinner

---

## 10. Inputs encore nécessaires

1. Levels — pitch + achievements + stack + URLs
2. Mirakl — résultat hackathon + stack + lien
3. Music Agency — 5 agents Dust + rôles + clients
4. Openclaw — pitch global + repo C++
5. Openclaw lunes — détails 3 sous-agents
6. CV — poste précédent + formation
7. Coordonnées — email, LinkedIn, GitHub
8. Photo / silhouette
9. Domaine — `aurian.dev` ou autre
10. Validation associations soft-skill / projets
11. Citation outro

---

## 11. Risques & mitigations

| Risque | P | I | Mitigation |
|---|---|---|---|
| Scope > 1 jour | M | É | Phases : skeleton+landing+Levels → 4 planètes → Threads+Map → polish. Couper Outro/PDF si retard. |
| Inputs manquants | É | M | Placeholders `[À FOURNIR]` + README inputs. Shippable malgré tout. |
| Anim lourde mobile | M | M | reduced-motion + simplification mobile |
| Domaine non acheté | M | F | Deploy initial `<user>.github.io/aurian-portfolio`, custom domain plus tard |

---

## 12. Definition of done

1. Toutes sections présentes et scrollables
2. 4 fils soft skills illuminés en stagger
3. ≥ 3 projets sur 5 avec contenu réel
4. CV liste VSOLUTION + 1 poste + formation
5. Stack ≥ 10 outils
6. Mobile responsive (375px min)
7. Lighthouse Perf ≥ 85 desktop
8. Déployé GitHub Pages avec URL publique
9. Easter egg console C++
10. Pas d'erreur console au load
11. `prefers-reduced-motion` respecté
12. OG image fonctionnelle

---

## 13. Cohérence brand Energizer

Couleur menthe `#A4F5C8`, fonts triplet, animation Pulse, soft luxury dark.

---

## 14. Hors scope

WebGL/R3F · audio · light mode · i18n · backend contact · blog · physique anim · AAA · Konami code.
