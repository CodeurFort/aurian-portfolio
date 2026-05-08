# Energizer Planet — Refonte visuelle vecteur (proof of concept)

**Date :** 2026-05-08
**Scope :** Refonte de la planète `energizer` dans `PortfolioUniverse.tsx`. Sert de benchmark qualité pour les 4 autres planètes à venir.
**Hors scope :** Les autres planètes (levels, mirakl, music-agency, thelook) restent inchangées dans cette itération. La mini-portfolio dédiée à Energizer (l'écran après clic) est un projet séparé.

---

## Pourquoi

Les 5 planètes actuelles utilisent toutes `MeshDistortMaterial` avec une distorsion subtile et la même émission verdâtre. Faiblement différenciées entre elles. L'identité visuelle ne raconte pas chaque projet.

**Direction esthétique globale validée :** hybride — chaque planète choisit son esthétique selon le projet. Energizer est la première à être refondue car c'est le concept le plus marquant (« lasers / vecteurs bleus »), et sert de proof-of-concept pour fixer le standard de qualité du portfolio.

**Identité du projet Energizer :** outil d'audit SEO/GEO/AEO, pipeline 5 étapes (stratégie, veille, concurrence, critique, scoring), score sur 100, self-revising. Le visuel doit évoquer : audit / scanner / énergie / pipeline / score.

---

## Concept visuel — « Réacteur Vecteur »

Sphère wireframe semi-transparente qu'on voit à travers, avec un cœur émissif au centre, 5 anneaux internes (un par étape pipeline), et des animations vivantes (pulses de scoring, arcs électriques, données qui circulent). Esthétique sci-fi / futuriste, dominante bleu électrique.

Voir section « Géométrie », « Couleurs » et « Animations ».

---

## Géométrie

### 1. Enveloppe externe — Sphère vecteur
- Geometry source : `IcosahedronGeometry(radius=1, detail=2)` → ~80 vertices, ~240 arêtes.
- Render via `THREE.LineSegments` + `EdgesGeometry`, ou `<lineSegments>` JSX RTF.
- Pas de face solide (transparent à 100 %, on voit l'intérieur).
- Rotation lente sur l'axe Y (~0.05 rad/s).

### 2. Cœur interne — Mini-icosaèdre émissif
- Geometry : `IcosahedronGeometry(radius=0.32, detail=1)` (~12 vertices).
- Render : double — wireframe `LineSegments` blanc-bleu + petite sphère solide centrale (radius=0.18) avec matériau émissif fort.
- Rotation en **sens inverse** de l'enveloppe externe (~−0.08 rad/s).
- Pulse échelle 1.0 → 1.08 → 1.0 toutes les ~0.83s (rythme cardiaque, ~1.2 Hz).

### 3. 5 Anneaux pipeline
- 5 anneaux fins en lignes pointillées, chacun à une inclinaison différente (0°, 36°, 72°, 108°, 144°).
- Rayon `1.05` (juste au-dessus de l'enveloppe externe).
- Render : `<Line>` de drei avec `dashed` ou `THREE.LineDashedMaterial`.
- Chacun tourne à sa propre vitesse (entre 0.1 et 0.4 rad/s, randomisées).
- Couleur : bleu électrique légèrement plus pâle que l'enveloppe.

---

## Couleurs

| Élément | Couleur | Usage |
|---|---|---|
| Enveloppe vecteur principale | `#4DD8FF` → `#1E5FFF` (gradient via fresnel) | Lignes externes |
| Cœur émissif | `#E6FBFF` (blanc-bleu pur) | Sphère centrale + wireframe interne |
| Anneaux pipeline | `#7FE3FF` (bleu pâle) | Pointillés orbitaux |
| Arcs électriques | `#FFFFFF` flash | Très brefs |
| Background | Noir profond `#000010` | Fond du canvas |
| Vignette | `rgba(0,0,30,0.4)` | Légère, pour faire ressortir le bleu |

Le gradient fresnel sur l'enveloppe = les arêtes vues de profil brillent plus que celles face caméra (effet "rim light"). Implémenté via shader custom (voir section Tech).

---

## Animations vivantes

### A. Pulse de scoring (signature animation)
- Toutes les ~3 secondes, une **onde lumineuse** part du cœur et se propage le long des arêtes du wireframe externe vers la périphérie.
- Implémentation : varying GLSL `uPulseProgress` 0→1 sur ~1.2s, masque les arêtes en fonction de leur distance au centre.
- L'arête s'illumine quand `pulseProgress` atteint sa distance normalisée, puis fade.

### B. Arcs électriques (mode show-off)
- 2-3 arcs simultanés possibles, chacun d'une durée 250ms.
- Fréquence : 1 nouvel arc toutes les 0.4-1.2s en moyenne (random).
- Implémentation : `Line` 3D entre 2 vertices random distants, opacité animée 0→1→0 en 250ms, légère courbure (Bezier) avec ~3 points intermédiaires bruités.
- Couleur : blanc pur, blend additif.

### C. Rotation
- Enveloppe externe : `+0.05 rad/s` axe Y.
- Cœur : `−0.08 rad/s` axe Y + `+0.04 rad/s` axe X (donne une oscillation visible).
- Anneaux : 5 vitesses indépendantes (entre 0.1 et 0.4 rad/s), axes inclinés différents.

### D. Flux de données (data flow le long des arêtes)
- ~12 points lumineux (`Sparkles` ou geometry custom) parcourent en continu les arêtes du wireframe externe.
- Chaque point suit une arête de bout en bout (~1.5-3s par arête), puis saute sur une arête voisine.
- Couleur : cyan brillant `#A0F0FF`.

### E. Pulse cardiaque du cœur
- Echelle 1.0 → 1.08 → 1.0, easing `easeInOutSine`, période 0.83s.
- Couplage : à chaque pulse, légère intensification de l'émission (1.0 → 1.4 → 1.0).

---

## Interaction

### Hover
- Intensité de pulse globale +30 %.
- Fréquence des arcs électriques ×2.
- Le cœur grossit légèrement (échelle ×1.05 sur 200ms).
- Le label projet apparaît à proximité (déjà géré par le code existant — on garde la mécanique actuelle).

### Click
- Phase 1 (200ms) : compression du cœur (échelle 1.0 → 0.4) + accélération rotation × 3.
- Phase 2 (300ms) : flash blanc lumineux + bloom à fond + explosion outward de tous les vecteurs (vertices se déplacent radialement de +0.3).
- Phase 3 : transition (déjà gérée par `PlanetTransition.tsx` existant) vers le détail du projet.
- Bruitage : utiliser `playWhoosh()` + `startEruptionRumble()` (déjà disponibles dans `lib/sound.ts`).

---

## Bloom — Post-processing

- Pipeline `@react-three/postprocessing` ajoute un `<Bloom>` au `<EffectComposer>`.
- Réglages cibles :
  - `intensity: 1.6` (modéré-fort)
  - `luminanceThreshold: 0.18`
  - `luminanceSmoothing: 0.9`
  - `mipmapBlur: true`
- Le bloom amplifie : cœur, anneaux émissifs, arcs électriques, ondes de pulse.
- À vérifier : si `EffectComposer` n'est pas déjà actif dans `PortfolioUniverse.tsx`, l'ajouter (impact perf à mesurer).

---

## Tech stack

| Élément | Approche |
|---|---|
| Sphère wireframe | `<lineSegments>` + `<edgesGeometry>` sur `IcosahedronGeometry` |
| Shader matériau vecteur | `shaderMaterial` custom (drei) avec fresnel + uPulseProgress + uTime |
| Cœur émissif | `<mesh>` + `<meshStandardMaterial emissive emissiveIntensity={3}>` |
| Anneaux pointillés | `<Line>` de `@react-three/drei` avec `dashed dashSize=0.04 gapSize=0.06` |
| Arcs électriques | `<Line>` dynamique avec animation opacité (3-point bezier brouillé) |
| Flux de données | `<Sparkles>` de drei OU `<points>` custom suivant les arêtes |
| Bloom | `@react-three/postprocessing` `<EffectComposer><Bloom/></>` |
| Sons | `playBlip` au hover, `playWhoosh` + `startEruptionRumble` au click (déjà existants) |

### Nouveau fichier proposé

```
src/components/3d/planets/EnergizerPlanet.tsx   ← composant isolé
src/components/3d/planets/shaders/energizer.glsl ← shader (ou inline)
```

Garder cette séparation permet d'extraire chaque planète comme composant autonome → facilite l'itération et le replication pattern pour les 4 suivantes.

### Intégration dans PortfolioUniverse

`PortfolioUniverse.tsx` actuellement choisit un variant via `PLANET_VARIANTS[slug]`. On ajoute un branchement :
```tsx
if (project.slug === "energizer") {
  return <EnergizerPlanet position={...} onHover={...} onClick={...} />;
}
// fallback : ancien rendu MeshDistortMaterial pour les autres planètes
```

Cela garde les 4 autres planètes intactes pendant qu'on itère sur Energizer.

---

## Critères de succès

1. **Singularité** : un visiteur qui voit l'univers du portfolio doit immédiatement distinguer Energizer des 4 autres planètes (qui se ressemblent toutes actuellement).
2. **Lisibilité de l'identité projet** : les 5 anneaux + le scan-pulse + le cœur évoquent clairement « audit / scoring / pipeline » sans qu'on lise une légende.
3. **Performance** : 60 fps stable sur desktop standard (M1, GTX 1060+). Mobile mid-range : minimum 30 fps. À mesurer avant merge.
4. **Cohérence avec le reste** : la planète s'intègre dans le système d'orbites/positions actuel sans casser les autres planètes.
5. **Réutilisabilité** : le composant `EnergizerPlanet.tsx` doit être un pattern reproductible pour les 4 autres (props commun : `position`, `scale`, `onHover`, `onClick`, `isActive`).

---

## Risques & mitigations

| Risque | Mitigation |
|---|---|
| Custom shader trop coûteux en perf | Fallback : si fps < 40, désactiver bloom + flux de données (mode lite) |
| Bloom amplifie le bruit visuel et fait perdre la lisibilité | Réglage `luminanceThreshold` à monter si trop diffus ; tester sur 3 écrans différents |
| Difficile d'intégrer un composant nouveau sans casser les 4 autres | Branching conditionnel propre dans `PortfolioUniverse`, test visuel sur les 5 planètes après merge |
| Mobile / low-end : trop d'effets simultanés | Détection capabilities + mode dégradé : 0 arcs électriques, 0 flux, bloom intensité ÷ 2 |
| Le user ne valide pas le rendu (subjectif) | Itérer sur la base d'un MVP visible le plus tôt possible. Déployer sur Vercel preview avant validation. |

---

## Ordre d'implémentation suggéré (haut niveau)

1. Créer `EnergizerPlanet.tsx` minimal : wireframe icosaèdre + cœur émissif (sans shader custom, sans bloom). Vérifier que ça s'affiche dans `PortfolioUniverse`.
2. Ajouter le shader fresnel pour le gradient bleu sur les arêtes.
3. Ajouter les 5 anneaux pointillés.
4. Ajouter le pulse de scoring (animation onde le long des arêtes).
5. Ajouter les arcs électriques (mode show-off).
6. Ajouter le flux de données.
7. Brancher le bloom global.
8. Polish : interactions hover/click, calage des sons, optimisation mobile.

Le plan détaillé (tâche par tâche, avec code) sera produit séparément via la skill `superpowers:writing-plans` après validation de ce spec.
