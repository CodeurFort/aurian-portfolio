# Energizer Planet Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refondre la planète `energizer` du `PortfolioUniverse` en un « réacteur vecteur » sci-fi (icosaèdre wireframe bleu, cœur émissif, 5 anneaux pipeline, pulses de scoring, arcs électriques, flux de données, bloom), branché conditionnellement sans casser les 4 autres planètes.

**Architecture :** Composant React Three Fiber isolé `EnergizerPlanet.tsx` qui remplace, via un branchement de slug, l'appel à `PlanetMesh` pour le projet `energizer`. Le composant s'auto-suffit : il gère sa géométrie wireframe, son shader fresnel custom, ses 5 anneaux pointillés, ses arcs et son flux de données. Le bloom est ajouté au `Canvas` global via `@react-three/postprocessing`. Les 4 autres planètes restent rendues par `PlanetMesh` actuel (`MeshDistortMaterial` + atmosphère).

**Tech Stack :** Next.js 15 + React 19, `@react-three/fiber@^9`, `@react-three/drei@^10`, `three@^0.184`, à ajouter : `@react-three/postprocessing`. TypeScript strict.

**Conventions du repo (à respecter dans tout le code écrit) :**
- Fichiers TS/TSX en CamelCase pour composants, kebab-case pour utilitaires.
- Imports absolus via alias `@/...` quand applicable (`@/lib/sound`, `@/lib/content`).
- Pas de tests unitaires sur les composants 3D — vérification visuelle (`npm run dev`) + build (`npm run build`) + lint (`npm run lint`).
- Commits : convention type `feat(energizer):`, `fix(energizer):`, `chore:`.

---

## File Structure

| Fichier | Rôle | Status |
|---|---|---|
| `src/components/3d/planets/EnergizerPlanet.tsx` | Composant planète vecteur isolé (toute la géométrie + animations + interactions hover/click) | **Create** |
| `src/components/3d/planets/EnergizerShader.ts` | Shader GLSL custom (vertex + fragment) pour fresnel + pulse | **Create** |
| `src/components/3d/PortfolioUniverse.tsx` | Branchement conditionnel `if slug === 'energizer'` + ajout du `<EffectComposer><Bloom/></>` au Canvas | **Modify** (lignes 1664-1672 et 2507-2528) |
| `package.json` + lockfile | Ajout dépendance `@react-three/postprocessing` | **Modify** |

Toutes les animations vivent dans `EnergizerPlanet.tsx` via `useFrame`. Le shader est déclaré dans `EnergizerShader.ts` (string templates GLSL exportées). Le bloom est centralisé sur le Canvas pour bénéficier à toutes les planètes (mais réglé pour amplifier surtout les hautes émissions de la planète Energizer).

---

## Task 1 : Installation de la dépendance postprocessing

**Files:**
- Modify: `/Users/aurian/Desktop/aurian-portfolio/package.json`

- [ ] **Step 1 : Installer `@react-three/postprocessing`**

```bash
cd /Users/aurian/Desktop/aurian-portfolio && npm install @react-three/postprocessing
```

Expected : install completes without peer-dep warnings critiques. La ligne `"@react-three/postprocessing": "^X.Y.Z"` apparaît dans `package.json` sous `dependencies`.

- [ ] **Step 2 : Vérifier que le projet compile encore**

```bash
cd /Users/aurian/Desktop/aurian-portfolio && npm run build
```

Expected : `✓ Compiled successfully` (ou équivalent). Aucun nouveau warning lié à postprocessing.

- [ ] **Step 3 : Commit**

```bash
cd /Users/aurian/Desktop/aurian-portfolio && git add package.json package-lock.json && git commit -m "chore(energizer): add @react-three/postprocessing dep"
```

---

## Task 2 : Squelette EnergizerPlanet (wireframe + cœur émissif, sans shader)

**Files:**
- Create: `/Users/aurian/Desktop/aurian-portfolio/src/components/3d/planets/EnergizerPlanet.tsx`
- Modify: `/Users/aurian/Desktop/aurian-portfolio/src/components/3d/PortfolioUniverse.tsx:1664-1672`

- [ ] **Step 1 : Créer le dossier `planets/`**

```bash
mkdir -p /Users/aurian/Desktop/aurian-portfolio/src/components/3d/planets
```

Expected : dossier créé, aucune erreur.

- [ ] **Step 2 : Créer `EnergizerPlanet.tsx` minimal**

Fichier : `src/components/3d/planets/EnergizerPlanet.tsx`

```tsx
"use client";

import { useRef, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface EnergizerPlanetProps {
  posX: number;
  isFocused: boolean;
  onSelectPlanet: () => void;
}

/**
 * Energizer — réacteur vecteur sci-fi.
 * Étape 1 : icosaèdre wireframe + cœur émissif. Sans shader, sans anneaux, sans arcs.
 */
export function EnergizerPlanet({
  posX,
  isFocused,
  onSelectPlanet,
}: EnergizerPlanetProps) {
  const groupRef = useRef<THREE.Group>(null);
  const wireframeRef = useRef<THREE.LineSegments>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const initializedRef = useRef(false);
  const [hovered, setHovered] = useState(false);

  // Pre-build geometries once
  const wireframeGeom = useRef<THREE.EdgesGeometry>();
  const coreGeom = useRef<THREE.IcosahedronGeometry>();
  if (!wireframeGeom.current) {
    const ico = new THREE.IcosahedronGeometry(1.2, 2);
    wireframeGeom.current = new THREE.EdgesGeometry(ico);
    ico.dispose();
  }
  if (!coreGeom.current) {
    coreGeom.current = new THREE.IcosahedronGeometry(0.18, 1);
  }

  useEffect(() => {
    document.body.style.cursor = hovered && isFocused ? "pointer" : "auto";
    return () => {
      document.body.style.cursor = "auto";
    };
  }, [hovered, isFocused]);

  useFrame((state, dt) => {
    if (!groupRef.current) return;

    // Scale lerp on focus (parity with PlanetMesh)
    const targetScale = isFocused ? 1.35 : 1.0;
    if (!initializedRef.current) {
      groupRef.current.scale.setScalar(targetScale);
      initializedRef.current = true;
    } else {
      const cs = groupRef.current.scale.x;
      const ns = cs + (targetScale - cs) * 0.06;
      groupRef.current.scale.set(ns, ns, ns);
    }

    // Outer rotation (Y axis)
    if (wireframeRef.current) {
      wireframeRef.current.rotation.y += dt * 0.05;
    }

    // Core counter-rotation + heartbeat pulse
    if (coreRef.current) {
      coreRef.current.rotation.y -= dt * 0.08;
      coreRef.current.rotation.x += dt * 0.04;
      const t = state.clock.elapsedTime;
      const beat = 1.0 + Math.sin(t * 2 * Math.PI * 1.2) * 0.04;
      coreRef.current.scale.setScalar(beat);
    }
  });

  return (
    <group ref={groupRef} position={[posX, 0, 0]}>
      {/* Outer wireframe icosahedron */}
      <lineSegments
        ref={wireframeRef}
        geometry={wireframeGeom.current}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
        onClick={(e) => {
          e.stopPropagation();
          if (isFocused) onSelectPlanet();
        }}
      >
        <lineBasicMaterial color="#4DD8FF" transparent opacity={0.85} />
      </lineSegments>

      {/* Emissive core */}
      <mesh ref={coreRef} geometry={coreGeom.current}>
        <meshStandardMaterial
          color="#E6FBFF"
          emissive="#A0F0FF"
          emissiveIntensity={3}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}
```

- [ ] **Step 3 : Brancher `EnergizerPlanet` conditionnellement dans `PortfolioUniverse.tsx`**

Modifier `src/components/3d/PortfolioUniverse.tsx`. D'abord ajouter l'import en haut du fichier (après les autres imports `@/components`) :

```tsx
import { EnergizerPlanet } from "./planets/EnergizerPlanet";
```

Puis remplacer le `projects.map` qui rend `<PlanetMesh>` (lignes ~1664-1672) par :

```tsx
{projects.map((p, i) => {
  if (p.slug === "energizer") {
    return (
      <EnergizerPlanet
        key={p.slug}
        posX={i * 6 - 12}
        isFocused={i === index}
        onSelectPlanet={() => onSelectPlanet(p)}
      />
    );
  }
  return (
    <PlanetMesh
      key={p.slug}
      project={p}
      posX={i * 6 - 12}
      isFocused={i === index}
      onSelectStar={onSelectStar}
      onSelectPlanet={() => onSelectPlanet(p)}
    />
  );
})}
```

Note : la planète Energizer n'a temporairement pas de satellites (stars en orbite). Cela sera ajouté plus tard si besoin — pour l'instant on valide le rendu de la planète elle-même.

- [ ] **Step 4 : Vérifier visuellement**

```bash
cd /Users/aurian/Desktop/aurian-portfolio && npm run dev
```

Ouvrir http://localhost:3000, naviguer jusqu'à la planète Energizer (2e à 4e position selon l'ordre de `projects`).

Expected :
- Un icosaèdre wireframe bleu cyan visible à la place de la sphère verdâtre.
- Un petit cœur blanc-bleu lumineux pulse au centre.
- L'outer wireframe tourne lentement, le cœur tourne en sens inverse.
- Aucun crash en console.

- [ ] **Step 5 : Vérifier build et lint**

```bash
cd /Users/aurian/Desktop/aurian-portfolio && npm run lint && npm run build
```

Expected : aucune erreur de typage, lint clean, build success.

- [ ] **Step 6 : Commit**

```bash
cd /Users/aurian/Desktop/aurian-portfolio && git add src/components/3d/planets/EnergizerPlanet.tsx src/components/3d/PortfolioUniverse.tsx && git commit -m "feat(energizer): wireframe icosahedron + emissive core scaffolding"
```

---

## Task 3 : Shader fresnel (gradient bleu sur les arêtes)

**Files:**
- Create: `/Users/aurian/Desktop/aurian-portfolio/src/components/3d/planets/EnergizerShader.ts`
- Modify: `/Users/aurian/Desktop/aurian-portfolio/src/components/3d/planets/EnergizerPlanet.tsx`

- [ ] **Step 1 : Créer `EnergizerShader.ts`**

Fichier : `src/components/3d/planets/EnergizerShader.ts`

```ts
import * as THREE from "three";

/**
 * Vertex shader — calcule la position et passe la normale + position monde
 * pour le calcul fresnel dans le fragment.
 */
export const energizerVertex = /* glsl */ `
  varying vec3 vWorldNormal;
  varying vec3 vWorldPos;

  void main() {
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPos = worldPos.xyz;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

/**
 * Fragment shader — fresnel : arêtes vues de profil → couleur claire (#4DD8FF),
 * arêtes face caméra → couleur foncée (#1E5FFF). Lerp via uFresnelPower.
 */
export const energizerFragment = /* glsl */ `
  uniform vec3 uColorRim;   // #4DD8FF
  uniform vec3 uColorBase;  // #1E5FFF
  uniform float uOpacity;
  uniform float uFresnelPower;

  varying vec3 vWorldNormal;
  varying vec3 vWorldPos;

  void main() {
    vec3 viewDir = normalize(cameraPosition - vWorldPos);
    float fresnel = 1.0 - max(dot(viewDir, vWorldNormal), 0.0);
    fresnel = pow(fresnel, uFresnelPower);
    vec3 color = mix(uColorBase, uColorRim, fresnel);
    gl_FragColor = vec4(color, uOpacity);
  }
`;

/**
 * Build a ShaderMaterial pre-configured for the energizer wireframe.
 * NOTE: pour appliquer ce shader sur des LineSegments, on utilise un
 * ShaderMaterial standard. Pas besoin de uniforms d'illumination (lignes pures).
 */
export function buildEnergizerShellMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: energizerVertex,
    fragmentShader: energizerFragment,
    uniforms: {
      uColorRim: { value: new THREE.Color("#4DD8FF") },
      uColorBase: { value: new THREE.Color("#1E5FFF") },
      uOpacity: { value: 0.9 },
      uFresnelPower: { value: 2.2 },
    },
    transparent: true,
    depthWrite: false,
  });
}
```

- [ ] **Step 2 : Utiliser le shader dans `EnergizerPlanet.tsx`**

Dans `src/components/3d/planets/EnergizerPlanet.tsx`, ajouter l'import :

```tsx
import { buildEnergizerShellMaterial } from "./EnergizerShader";
```

Puis dans le composant, créer le matériau via un ref (le construire une seule fois) :

```tsx
const shellMaterialRef = useRef<THREE.ShaderMaterial>();
if (!shellMaterialRef.current) {
  shellMaterialRef.current = buildEnergizerShellMaterial();
}
```

Et remplacer le `<lineSegments>` du Step 2 (Task 2) par :

```tsx
<lineSegments
  ref={wireframeRef}
  geometry={wireframeGeom.current}
  material={shellMaterialRef.current}
  onPointerOver={(e) => {
    e.stopPropagation();
    setHovered(true);
  }}
  onPointerOut={() => setHovered(false)}
  onClick={(e) => {
    e.stopPropagation();
    if (isFocused) onSelectPlanet();
  }}
/>
```

(Plus de `<lineBasicMaterial>` enfant — on utilise prop `material`.)

- [ ] **Step 3 : Disposer le matériau au unmount**

Ajouter dans le composant, juste avant le `return` :

```tsx
useEffect(() => {
  return () => {
    shellMaterialRef.current?.dispose();
    wireframeGeom.current?.dispose();
    coreGeom.current?.dispose();
  };
}, []);
```

- [ ] **Step 4 : Vérifier visuellement**

```bash
cd /Users/aurian/Desktop/aurian-portfolio && npm run dev
```

Expected :
- Les arêtes de profil (silhouette du wireframe) brillent en cyan clair `#4DD8FF`.
- Les arêtes face caméra apparaissent en bleu plus foncé `#1E5FFF`.
- L'effet rim light est visible quand la planète tourne.

- [ ] **Step 5 : Vérifier lint + build**

```bash
cd /Users/aurian/Desktop/aurian-portfolio && npm run lint && npm run build
```

Expected : aucune erreur.

- [ ] **Step 6 : Commit**

```bash
cd /Users/aurian/Desktop/aurian-portfolio && git add src/components/3d/planets/EnergizerShader.ts src/components/3d/planets/EnergizerPlanet.tsx && git commit -m "feat(energizer): fresnel shader for wireframe gradient"
```

---

## Task 4 : 5 anneaux pipeline pointillés

**Files:**
- Modify: `/Users/aurian/Desktop/aurian-portfolio/src/components/3d/planets/EnergizerPlanet.tsx`

- [ ] **Step 1 : Importer `Line` de drei + créer le composant `PipelineRing` interne**

Ajouter en haut de `EnergizerPlanet.tsx` :

```tsx
import { Line } from "@react-three/drei";
import { useMemo } from "react";
```

Ajouter, **avant** `export function EnergizerPlanet`, le composant interne :

```tsx
interface PipelineRingProps {
  inclination: number; // radians
  speed: number;       // rad/s
  radius: number;
}

/**
 * Single dashed ring orbiting around the energizer core.
 * Each ring tilted by `inclination` and rotates at `speed` rad/s.
 */
function PipelineRing({ inclination, speed, radius }: PipelineRingProps) {
  const ringRef = useRef<THREE.Group>(null);

  // Pre-compute 64 points around a circle in the XZ plane
  const points = useMemo(() => {
    const pts: [number, number, number][] = [];
    const SEG = 64;
    for (let i = 0; i <= SEG; i++) {
      const a = (i / SEG) * Math.PI * 2;
      pts.push([Math.cos(a) * radius, 0, Math.sin(a) * radius]);
    }
    return pts;
  }, [radius]);

  useFrame((_, dt) => {
    if (ringRef.current) {
      ringRef.current.rotation.y += dt * speed;
    }
  });

  return (
    <group ref={ringRef} rotation={[inclination, 0, 0]}>
      <Line
        points={points}
        color="#7FE3FF"
        lineWidth={1}
        transparent
        opacity={0.7}
        dashed
        dashSize={0.04}
        gapSize={0.06}
      />
    </group>
  );
}
```

- [ ] **Step 2 : Render les 5 anneaux dans `EnergizerPlanet`**

Dans le `return` du composant `EnergizerPlanet`, juste après le `<mesh ref={coreRef}...>`, ajouter :

```tsx
{/* 5 pipeline rings (one per audit step) */}
{[0, 1, 2, 3, 4].map((i) => {
  const inclination = (i * Math.PI) / 5; // 0°, 36°, 72°, 108°, 144°
  // Speeds randomised but stable across renders
  const speeds = [0.12, 0.28, 0.18, 0.36, 0.22];
  return (
    <PipelineRing
      key={i}
      inclination={inclination}
      speed={speeds[i]}
      radius={1.32}
    />
  );
})}
```

- [ ] **Step 3 : Vérifier visuellement**

```bash
cd /Users/aurian/Desktop/aurian-portfolio && npm run dev
```

Expected :
- 5 anneaux pointillés bleu pâle (`#7FE3FF`) inclinés différemment autour de la planète.
- Chaque anneau tourne à sa propre vitesse (visible si on observe ~5s).
- Les anneaux sont à une distance légèrement supérieure au wireframe (`radius=1.32` vs sphère 1.2).
- Pas de chevauchement visuel cassant (effet sci-fi cohérent).

- [ ] **Step 4 : Vérifier lint + build**

```bash
cd /Users/aurian/Desktop/aurian-portfolio && npm run lint && npm run build
```

Expected : aucune erreur.

- [ ] **Step 5 : Commit**

```bash
cd /Users/aurian/Desktop/aurian-portfolio && git add src/components/3d/planets/EnergizerPlanet.tsx && git commit -m "feat(energizer): 5 dashed pipeline rings"
```

---

## Task 5 : Pulse de scoring (onde lumineuse le long des arêtes)

**Files:**
- Modify: `/Users/aurian/Desktop/aurian-portfolio/src/components/3d/planets/EnergizerShader.ts`
- Modify: `/Users/aurian/Desktop/aurian-portfolio/src/components/3d/planets/EnergizerPlanet.tsx`

L'idée : ajouter un uniform `uPulse` (0→1) au shader. Quand `uPulse` progresse, on illumine en blanc les arêtes dont la distance normalisée au centre correspond à `uPulse` (avec une bande de tolérance). Comme on travaille sur des `LineSegments`, la « distance au centre » est calculée en fragment via `length(vWorldPos - planetCenter)` normalisé sur `[0, radiusMax]`.

- [ ] **Step 1 : Étendre le shader avec uPulse + uPulseWidth**

Modifier `src/components/3d/planets/EnergizerShader.ts`. Remplacer la déclaration de `energizerFragment` par :

```ts
export const energizerFragment = /* glsl */ `
  uniform vec3 uColorRim;
  uniform vec3 uColorBase;
  uniform vec3 uColorPulse;
  uniform float uOpacity;
  uniform float uFresnelPower;
  uniform float uPulse;       // 0..1 progress; >1 means inactive
  uniform float uPulseWidth;  // band thickness, normalized

  varying vec3 vWorldNormal;
  varying vec3 vWorldPos;

  void main() {
    vec3 viewDir = normalize(cameraPosition - vWorldPos);
    float fresnel = 1.0 - max(dot(viewDir, vWorldNormal), 0.0);
    fresnel = pow(fresnel, uFresnelPower);
    vec3 base = mix(uColorBase, uColorRim, fresnel);

    // Pulse band: a thin ring of brightness travelling outward from center.
    // We approximate "distance from planet center" by length(vWorldPos) since
    // the planet sits at world origin (group is positioned, but vWorldPos is
    // computed from modelMatrix which already includes the group offset →
    // we instead use the local position via modelMatrix inverse... cheaper:
    // pass length divided by max possible radius. radius ~1.2 * 1.35 = 1.62.
    float distNorm = length(vWorldPos - vec3(0.0)) / 2.5;
    distNorm = clamp(distNorm, 0.0, 1.0);

    float band = smoothstep(uPulseWidth, 0.0, abs(distNorm - uPulse));
    // Pulse only contributes when uPulse in [0, 1]
    float gate = step(0.0, uPulse) * step(uPulse, 1.0);
    band *= gate;

    vec3 color = mix(base, uColorPulse, band);
    float opacity = uOpacity + band * 0.5;
    gl_FragColor = vec4(color, clamp(opacity, 0.0, 1.0));
  }
`;
```

Et ajouter les uniforms dans `buildEnergizerShellMaterial` :

```ts
export function buildEnergizerShellMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: energizerVertex,
    fragmentShader: energizerFragment,
    uniforms: {
      uColorRim: { value: new THREE.Color("#4DD8FF") },
      uColorBase: { value: new THREE.Color("#1E5FFF") },
      uColorPulse: { value: new THREE.Color("#FFFFFF") },
      uOpacity: { value: 0.9 },
      uFresnelPower: { value: 2.2 },
      uPulse: { value: -1.0 },     // -1 = inactive
      uPulseWidth: { value: 0.12 },
    },
    transparent: true,
    depthWrite: false,
  });
}
```

> Note importante : `vWorldPos - vec3(0.0)` suppose que la planète est à l'origine du monde. Comme le `group` parent est positionné à `posX != 0`, il faut soit :
> (a) passer un uniform `uCenter` mis à jour depuis JS chaque frame, ou
> (b) utiliser la position locale au lieu de world. **On utilise (b) : moins de plomberie.**

Modifier `energizerVertex` pour passer aussi la position locale :

```ts
export const energizerVertex = /* glsl */ `
  varying vec3 vWorldNormal;
  varying vec3 vWorldPos;
  varying vec3 vLocalPos;

  void main() {
    vLocalPos = position;
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPos = worldPos.xyz;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;
```

Et dans le fragment, remplacer `length(vWorldPos - vec3(0.0)) / 2.5` par :

```glsl
float distNorm = length(vLocalPos) / 1.2;  // radius of the icosahedron
distNorm = clamp(distNorm, 0.0, 1.0);
```

Ne pas oublier la déclaration `varying vec3 vLocalPos;` aussi en haut du fragment shader.

> Les arêtes d'un icosaèdre ont toutes leurs sommets sur la sphère de rayon 1.2, donc `length(vLocalPos)` = ~1.2 partout. Pour avoir une vraie variation de distance, on doit baser la pulse sur autre chose : **l'angle azimutal** (axe Y) ou **la latitude** (axe Y normalisé). On choisit la latitude car elle donne une vague qui part « du pôle nord vers le pôle sud » — visuellement lisible comme une « onde de scan ».

Ajuster le fragment shader. Remplacer le bloc `// Pulse band` par :

```glsl
// Pulse band: wave travelling along the Y-axis (latitude).
// vLocalPos.y goes from -1.2 to +1.2; normalize to [0,1] from top to bottom.
float lat = (1.2 - vLocalPos.y) / 2.4;
lat = clamp(lat, 0.0, 1.0);
float band = smoothstep(uPulseWidth, 0.0, abs(lat - uPulse));
float gate = step(0.0, uPulse) * step(uPulse, 1.0);
band *= gate;
```

(Le reste du shader reste inchangé.)

- [ ] **Step 2 : Animer `uPulse` côté JS dans `EnergizerPlanet.tsx`**

Ajouter à l'intérieur de `useFrame` du composant, juste après la rotation du cœur :

```tsx
// Trigger a scoring pulse every ~3s, lasting ~1.2s
const t = state.clock.elapsedTime;
const period = 3.0;
const duration = 1.2;
const phase = (t % period) / duration;
const mat = shellMaterialRef.current;
if (mat) {
  mat.uniforms.uPulse.value = phase <= 1.0 ? phase : -1.0;
}
```

- [ ] **Step 3 : Vérifier visuellement**

```bash
cd /Users/aurian/Desktop/aurian-portfolio && npm run dev
```

Expected :
- Toutes les ~3 secondes, une bande blanche traverse le wireframe du « pôle nord » vers le « pôle sud ».
- L'onde dure ~1.2s, puis la planète revient à son rendu fresnel normal pendant ~1.8s.
- Les arêtes touchées par l'onde s'éclaircissent visiblement (effet « scan »).

- [ ] **Step 4 : Vérifier lint + build**

```bash
cd /Users/aurian/Desktop/aurian-portfolio && npm run lint && npm run build
```

Expected : aucune erreur.

- [ ] **Step 5 : Commit**

```bash
cd /Users/aurian/Desktop/aurian-portfolio && git add src/components/3d/planets/EnergizerShader.ts src/components/3d/planets/EnergizerPlanet.tsx && git commit -m "feat(energizer): scoring pulse wave along edges"
```

---

## Task 6 : Arcs électriques (mode show-off)

**Files:**
- Modify: `/Users/aurian/Desktop/aurian-portfolio/src/components/3d/planets/EnergizerPlanet.tsx`

L'approche : un pool de N arcs préalloués. À chaque frame, certains slots sont « actifs » (ils ont une trajectoire, une opacité, un timer). Quand un slot expire, on le réinitialise avec 2 nouveaux endpoints aléatoires sur la sphère + 3 points intermédiaires perturbés (Bezier-ish).

- [ ] **Step 1 : Ajouter le composant interne `ElectricArc`**

Dans `src/components/3d/planets/EnergizerPlanet.tsx`, ajouter avant `export function EnergizerPlanet` :

```tsx
interface ElectricArcProps {
  active: boolean;
  points: THREE.Vector3[];
  opacity: number;
}

/**
 * Single electric arc rendered via drei <Line>.
 * Parent controls activation, geometry, and opacity via props.
 */
function ElectricArc({ active, points, opacity }: ElectricArcProps) {
  if (!active) return null;
  return (
    <Line
      points={points.map((v) => [v.x, v.y, v.z]) as [number, number, number][]}
      color="#FFFFFF"
      lineWidth={1.4}
      transparent
      opacity={opacity}
    />
  );
}
```

- [ ] **Step 2 : Gérer le pool d'arcs dans `EnergizerPlanet`**

Ajouter ces refs/state au début du composant `EnergizerPlanet` :

```tsx
const ARC_POOL_SIZE = 3;

interface ArcSlot {
  active: boolean;
  points: THREE.Vector3[];
  opacity: number;
  ttl: number;       // remaining seconds
  duration: number;  // total seconds for fade curve
}

const arcsRef = useRef<ArcSlot[]>(
  Array.from({ length: ARC_POOL_SIZE }, () => ({
    active: false,
    points: [],
    opacity: 0,
    ttl: 0,
    duration: 0.25,
  }))
);

const nextArcCheckRef = useRef(0);
const [arcsTick, setArcsTick] = useState(0); // forces re-render when arcs change
```

Ajouter une fonction utilitaire **avant** le `useFrame` :

```tsx
function spawnArc(slot: ArcSlot) {
  const r = 1.2;
  // pick 2 random endpoints on sphere
  const a = randomPointOnSphere(r);
  const b = randomPointOnSphere(r);
  // 3 intermediate points along the great-circle arc, perturbed
  const mid = new THREE.Vector3().lerpVectors(a, b, 0.5);
  const m1 = new THREE.Vector3().lerpVectors(a, mid, 0.5);
  const m2 = new THREE.Vector3().lerpVectors(mid, b, 0.5);
  const jitter = (v: THREE.Vector3) =>
    v
      .clone()
      .add(
        new THREE.Vector3(
          (Math.random() - 0.5) * 0.18,
          (Math.random() - 0.5) * 0.18,
          (Math.random() - 0.5) * 0.18
        )
      );
  slot.points = [a, jitter(m1), jitter(mid), jitter(m2), b];
  slot.opacity = 1;
  slot.ttl = 0.25;
  slot.duration = 0.25;
  slot.active = true;
}

function randomPointOnSphere(radius: number): THREE.Vector3 {
  const u = Math.random();
  const v = Math.random();
  const theta = 2 * Math.PI * u;
  const phi = Math.acos(2 * v - 1);
  return new THREE.Vector3(
    radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.sin(phi) * Math.sin(theta),
    radius * Math.sin(phi) * Math.cos(theta)
  );
}
```

> Note : `randomPointOnSphere` doit être déclaré **hors** du composant React pour éviter d'être recréé à chaque render. Le placer juste après les imports en haut du fichier.

Ajouter dans le `useFrame`, après le bloc pulse :

```tsx
// Electric arcs lifecycle
let needsTick = false;
arcsRef.current.forEach((slot) => {
  if (slot.active) {
    slot.ttl -= dt;
    if (slot.ttl <= 0) {
      slot.active = false;
      slot.opacity = 0;
      needsTick = true;
    } else {
      // fade out: opacity = ttl / duration
      slot.opacity = Math.max(0, slot.ttl / slot.duration);
    }
  }
});

// Maybe spawn a new arc — average 1 per 0.4-1.2s (random)
nextArcCheckRef.current -= dt;
if (nextArcCheckRef.current <= 0) {
  nextArcCheckRef.current = 0.4 + Math.random() * 0.8;
  const freeSlot = arcsRef.current.find((s) => !s.active);
  if (freeSlot) {
    spawnArc(freeSlot);
    needsTick = true;
  }
}
if (needsTick) setArcsTick((x) => x + 1);
```

- [ ] **Step 3 : Render les arcs dans le JSX**

Dans le `return`, juste après le bloc des 5 anneaux pipeline, ajouter :

```tsx
{/* Electric arcs (show-off) */}
{arcsRef.current.map((slot, i) => (
  <ElectricArc
    key={`arc-${i}-${arcsTick}`}
    active={slot.active}
    points={slot.points}
    opacity={slot.opacity}
  />
))}
```

> Le `arcsTick` dans la `key` force le remount du `<Line>` à chaque cycle (drei `Line` reconstruit sa geometry sur changement de points).

- [ ] **Step 4 : Vérifier visuellement**

```bash
cd /Users/aurian/Desktop/aurian-portfolio && npm run dev
```

Expected :
- 1 à 3 arcs blancs apparaissent simultanément sur la planète.
- Chaque arc dure ~250 ms puis disparaît en fade-out.
- Les arcs sont courbés (5 points, légère brouille).
- Fréquence : ~1 nouvel arc par seconde en moyenne.

- [ ] **Step 5 : Vérifier lint + build**

```bash
cd /Users/aurian/Desktop/aurian-portfolio && npm run lint && npm run build
```

Expected : aucune erreur.

- [ ] **Step 6 : Commit**

```bash
cd /Users/aurian/Desktop/aurian-portfolio && git add src/components/3d/planets/EnergizerPlanet.tsx && git commit -m "feat(energizer): electric arcs show-off pool"
```

---

## Task 7 : Flux de données (Sparkles)

**Files:**
- Modify: `/Users/aurian/Desktop/aurian-portfolio/src/components/3d/planets/EnergizerPlanet.tsx`

- [ ] **Step 1 : Ajouter `Sparkles` autour du wireframe**

Dans `src/components/3d/planets/EnergizerPlanet.tsx`, ajouter à l'import drei existant :

```tsx
import { Line, Sparkles } from "@react-three/drei";
```

Dans le `return`, juste avant le bloc des 5 anneaux pipeline (donc **après** le `<mesh ref={coreRef}>` et **avant** le `{[0,1,2,3,4].map(...)}`), ajouter :

```tsx
{/* Data flow particles around the wireframe */}
<Sparkles
  count={12}
  scale={[2.6, 2.6, 2.6]}
  size={2.5}
  speed={0.4}
  opacity={0.9}
  color="#A0F0FF"
  noise={1.2}
/>
```

- [ ] **Step 2 : Vérifier visuellement**

```bash
cd /Users/aurian/Desktop/aurian-portfolio && npm run dev
```

Expected :
- ~12 petits points cyan (`#A0F0FF`) flottent dans/autour du wireframe.
- Mouvement lent, légèrement bruité.
- Effet « particules de données » subtile, ne masque pas la planète.

- [ ] **Step 3 : Vérifier lint + build**

```bash
cd /Users/aurian/Desktop/aurian-portfolio && npm run lint && npm run build
```

Expected : aucune erreur.

- [ ] **Step 4 : Commit**

```bash
cd /Users/aurian/Desktop/aurian-portfolio && git add src/components/3d/planets/EnergizerPlanet.tsx && git commit -m "feat(energizer): sparkles data flow around wireframe"
```

---

## Task 8 : Bloom postprocessing global

**Files:**
- Modify: `/Users/aurian/Desktop/aurian-portfolio/src/components/3d/PortfolioUniverse.tsx:2507-2528`

- [ ] **Step 1 : Importer `EffectComposer` et `Bloom`**

En haut de `src/components/3d/PortfolioUniverse.tsx`, ajouter :

```tsx
import { EffectComposer, Bloom } from "@react-three/postprocessing";
```

- [ ] **Step 2 : Ajouter `<EffectComposer>` au Canvas**

Dans `PortfolioUniverse.tsx`, repérer le bloc `<Canvas dpr={[1, 1.5]}...>` (~ ligne 2507). Juste avant la fermeture `</Canvas>` (ligne ~2528, après `{introDismissed && <Universe ... />}`), ajouter :

```tsx
<EffectComposer multisampling={0}>
  <Bloom
    intensity={1.6}
    luminanceThreshold={0.18}
    luminanceSmoothing={0.9}
    mipmapBlur
  />
</EffectComposer>
```

Le bloc final ressemblera à :

```tsx
<Canvas
  dpr={[1, 1.5]}
  camera={{ position: [-12, 0, 6], fov: 55 }}
  gl={{ antialias: true }}
>
  <color attach="background" args={["#07080A"]} />
  <fog attach="fog" args={["#07080A", 12, 28]} />

  <ambientLight intensity={0.35} />
  <directionalLight position={[5, 6, 5]} intensity={1.0} color="#f5efdf" />
  <directionalLight position={[-4, -2, -5]} intensity={0.25} color="#a8c4b0" />

  <Stars radius={50} depth={40} count={1500} factor={3} saturation={0} fade speed={0.3} />

  {introDismissed && (
    <Universe
      index={index}
      onSelectStar={handleSelectStar}
      onSelectPlanet={handleSelectPlanet}
    />
  )}

  <EffectComposer multisampling={0}>
    <Bloom
      intensity={1.6}
      luminanceThreshold={0.18}
      luminanceSmoothing={0.9}
      mipmapBlur
    />
  </EffectComposer>
</Canvas>
```

- [ ] **Step 3 : Vérifier visuellement**

```bash
cd /Users/aurian/Desktop/aurian-portfolio && npm run dev
```

Expected :
- Le cœur émissif d'Energizer brille avec un halo doux (bloom modéré).
- Les arcs électriques laissent un léger glow blanc.
- Les autres planètes restent visuellement raisonnables (pas de surexposition).
- Les `Stars` du fond ne sont pas trop amplifiés (ajuster `luminanceThreshold` à 0.22 si trop diffus).

- [ ] **Step 4 : Vérifier lint + build**

```bash
cd /Users/aurian/Desktop/aurian-portfolio && npm run lint && npm run build
```

Expected : aucune erreur.

- [ ] **Step 5 : Commit**

```bash
cd /Users/aurian/Desktop/aurian-portfolio && git add src/components/3d/PortfolioUniverse.tsx && git commit -m "feat(energizer): bloom postprocessing for emissive amplification"
```

---

## Task 9 : Interactions hover & click + sons

**Files:**
- Modify: `/Users/aurian/Desktop/aurian-portfolio/src/components/3d/planets/EnergizerPlanet.tsx`

Le spec définit :
- Hover : intensité pulse +30 %, fréquence arcs ×2, cœur scale ×1.05.
- Click : compression cœur (1.0→0.4), accélération rotation ×3, flash blanc + explosion vecteurs (vertices déplacés radialement +0.3), puis transition.

On garde les sons existants (`playWhoosh`, `startEruptionRumble`) déjà disponibles dans `@/lib/sound`.

- [ ] **Step 1 : Importer les sons**

Dans `src/components/3d/planets/EnergizerPlanet.tsx`, ajouter :

```tsx
import { playBlip, playWhoosh, startEruptionRumble } from "@/lib/sound";
```

- [ ] **Step 2 : Hover effects**

Modifier la portion `useFrame` pour appliquer les boosts hover. Ajouter ces variables tout en haut du composant (après les autres refs) :

```tsx
const arcSpawnMultiplierRef = useRef(1);
```

Dans le `useEffect` qui gère le cursor (déjà présent), élargir pour jouer un son et booster les arcs :

```tsx
useEffect(() => {
  document.body.style.cursor = hovered && isFocused ? "pointer" : "auto";
  if (hovered && isFocused) {
    playBlip();
    arcSpawnMultiplierRef.current = 2;
  } else {
    arcSpawnMultiplierRef.current = 1;
  }
  return () => {
    document.body.style.cursor = "auto";
  };
}, [hovered, isFocused]);
```

Modifier la ligne dans `useFrame` qui calcule `nextArcCheckRef.current` à chaque spawn :

```tsx
// Replace the existing line:
//   nextArcCheckRef.current = 0.4 + Math.random() * 0.8;
// With:
nextArcCheckRef.current = (0.4 + Math.random() * 0.8) / arcSpawnMultiplierRef.current;
```

Modifier la portion pulse dans `useFrame` pour booster l'intensité quand hovered. Remplacer :

```tsx
mat.uniforms.uPulse.value = phase <= 1.0 ? phase : -1.0;
```

par :

```tsx
mat.uniforms.uPulse.value = phase <= 1.0 ? phase : -1.0;
mat.uniforms.uPulseWidth.value = (hovered && isFocused) ? 0.16 : 0.12;
```

(La largeur de bande plus grande = pulse plus visible quand on hover.)

Pour la scale du cœur en hover, modifier la portion heartbeat :

```tsx
// Replace:
//   const beat = 1.0 + Math.sin(t * 2 * Math.PI * 1.2) * 0.04;
// With:
const heartScale = hovered && isFocused ? 1.05 : 1.0;
const beat = heartScale * (1.0 + Math.sin(t * 2 * Math.PI * 1.2) * 0.04);
```

- [ ] **Step 3 : Click animation (compression + flash + explosion)**

Ajouter un state d'animation click au début du composant :

```tsx
const clickPhaseRef = useRef<"idle" | "compress" | "explode">("idle");
const clickTimerRef = useRef(0);
```

Modifier l'`onClick` du `<lineSegments>` pour démarrer l'animation au lieu d'appeler directement `onSelectPlanet` :

```tsx
onClick={(e) => {
  e.stopPropagation();
  if (!isFocused || clickPhaseRef.current !== "idle") return;
  clickPhaseRef.current = "compress";
  clickTimerRef.current = 0;
  playWhoosh();
  startEruptionRumble();
}}
```

Dans `useFrame`, ajouter en fin de fonction (après le bloc arcs) :

```tsx
// Click animation
if (clickPhaseRef.current !== "idle") {
  clickTimerRef.current += dt;
  if (clickPhaseRef.current === "compress") {
    // Phase 1 (200ms): compress core 1.0 -> 0.4, accelerate rotations
    const t01 = Math.min(clickTimerRef.current / 0.2, 1);
    if (coreRef.current) {
      const s = 1.0 - t01 * 0.6;
      coreRef.current.scale.setScalar(s);
    }
    if (wireframeRef.current) {
      wireframeRef.current.rotation.y += dt * 0.05 * 3;
    }
    if (t01 >= 1) {
      clickPhaseRef.current = "explode";
      clickTimerRef.current = 0;
    }
  } else if (clickPhaseRef.current === "explode") {
    // Phase 2 (300ms): flash + outward scale of wireframe
    const t02 = Math.min(clickTimerRef.current / 0.3, 1);
    if (wireframeRef.current) {
      const s = 1.0 + t02 * 0.25;
      wireframeRef.current.scale.setScalar(s);
    }
    if (shellMaterialRef.current) {
      shellMaterialRef.current.uniforms.uOpacity.value = 0.9 + t02 * 0.3;
    }
    if (t02 >= 1) {
      // Hand off to the parent transition (already handles route change)
      onSelectPlanet();
      clickPhaseRef.current = "idle";
      // Reset visual state on next idle frame
      if (wireframeRef.current) wireframeRef.current.scale.setScalar(1);
      if (shellMaterialRef.current) shellMaterialRef.current.uniforms.uOpacity.value = 0.9;
    }
  }
}
```

> La rotation/scale normales du `useFrame` continuent de s'appliquer en parallèle. Si conflit visuel, l'animation click prendra le pas car elle écrit en dernier sur ces refs.

- [ ] **Step 4 : Vérifier visuellement**

```bash
cd /Users/aurian/Desktop/aurian-portfolio && npm run dev
```

Hover Energizer (focused) :
- Curseur pointer.
- `playBlip` joué (son court).
- Pulses légèrement plus larges, arcs plus fréquents (~2×).
- Cœur visiblement plus gros.

Click Energizer (focused) :
- Cœur se compresse en 200 ms.
- Wireframe explose vers l'extérieur en 300 ms.
- `playWhoosh` + `startEruptionRumble` joués.
- À la fin, `onSelectPlanet` est appelé (transition existante prend le relais).

- [ ] **Step 5 : Vérifier lint + build**

```bash
cd /Users/aurian/Desktop/aurian-portfolio && npm run lint && npm run build
```

Expected : aucune erreur.

- [ ] **Step 6 : Commit**

```bash
cd /Users/aurian/Desktop/aurian-portfolio && git add src/components/3d/planets/EnergizerPlanet.tsx && git commit -m "feat(energizer): hover boosts + click compression+explode + sounds"
```

---

## Task 10 : Mode dégradé low-end (mobile, GPU faibles)

**Files:**
- Modify: `/Users/aurian/Desktop/aurian-portfolio/src/components/3d/planets/EnergizerPlanet.tsx`
- Modify: `/Users/aurian/Desktop/aurian-portfolio/src/components/3d/PortfolioUniverse.tsx`

Spec : si fps < 40 ou device mobile low-end → désactiver arcs + sparkles, bloom intensity ÷ 2. Détection simple : `window.matchMedia("(max-width: 768px)")` + détection de `navigator.hardwareConcurrency < 4`.

- [ ] **Step 1 : Helper `usePerformanceTier`**

Créer un hook simple en haut de `src/components/3d/planets/EnergizerPlanet.tsx` (juste après les imports) :

```tsx
function usePerformanceTier(): "high" | "low" {
  const [tier, setTier] = useState<"high" | "low">("high");
  useEffect(() => {
    if (typeof window === "undefined") return;
    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    const lowCpu = (navigator.hardwareConcurrency ?? 8) < 4;
    setTier(isMobile || lowCpu ? "low" : "high");
  }, []);
  return tier;
}
```

- [ ] **Step 2 : Utiliser le tier dans le composant**

Dans `EnergizerPlanet`, ajouter en début de composant :

```tsx
const tier = usePerformanceTier();
```

Conditionner les `<Sparkles>` :

```tsx
{tier === "high" && (
  <Sparkles
    count={12}
    scale={[2.6, 2.6, 2.6]}
    size={2.5}
    speed={0.4}
    opacity={0.9}
    color="#A0F0FF"
    noise={1.2}
  />
)}
```

Conditionner le rendu des arcs (le pool reste géré, mais les `<ElectricArc>` ne sont rendus que si tier=high) :

```tsx
{tier === "high" &&
  arcsRef.current.map((slot, i) => (
    <ElectricArc
      key={`arc-${i}-${arcsTick}`}
      active={slot.active}
      points={slot.points}
      opacity={slot.opacity}
    />
  ))}
```

- [ ] **Step 3 : Bloom intensity réduit en mode low**

Dans `src/components/3d/PortfolioUniverse.tsx`, ajouter en haut du fichier (après les imports) :

```tsx
function usePerfTier(): "high" | "low" {
  const [tier, setTier] = useState<"high" | "low">("high");
  useEffect(() => {
    if (typeof window === "undefined") return;
    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    const lowCpu = (navigator.hardwareConcurrency ?? 8) < 4;
    setTier(isMobile || lowCpu ? "low" : "high");
  }, []);
  return tier;
}
```

> DRY note : on duplique le hook plutôt que de créer un fichier `useTier.ts` dédié, car YAGNI — 2 utilisations seulement, et chaque composant reste autonome. Si le tier devient utilisé ailleurs, extraire dans `src/lib/usePerfTier.ts` à ce moment-là.

Dans le composant principal du `PortfolioUniverse`, juste avant le `return` qui contient le `<Canvas>`, ajouter :

```tsx
const perfTier = usePerfTier();
```

Modifier le `<Bloom>` :

```tsx
<EffectComposer multisampling={0}>
  <Bloom
    intensity={perfTier === "low" ? 0.8 : 1.6}
    luminanceThreshold={0.18}
    luminanceSmoothing={0.9}
    mipmapBlur
  />
</EffectComposer>
```

- [ ] **Step 4 : Vérifier visuellement (desktop + mobile)**

Desktop :
```bash
cd /Users/aurian/Desktop/aurian-portfolio && npm run dev
```
Expected : effets complets (sparkles + arcs + bloom 1.6).

Mobile (devtools → responsive view, throttle CPU 4×) :
- Pas de sparkles.
- Pas d'arcs électriques.
- Bloom plus discret.
- FPS reste fluide (>30).

- [ ] **Step 5 : Vérifier lint + build**

```bash
cd /Users/aurian/Desktop/aurian-portfolio && npm run lint && npm run build
```

Expected : aucune erreur.

- [ ] **Step 6 : Commit**

```bash
cd /Users/aurian/Desktop/aurian-portfolio && git add src/components/3d/planets/EnergizerPlanet.tsx src/components/3d/PortfolioUniverse.tsx && git commit -m "feat(energizer): low-end tier degrades sparkles, arcs, bloom"
```

---

## Task 11 : Vérification croisée — les 4 autres planètes restent intactes

**Files:** aucun (vérification visuelle seulement).

- [ ] **Step 1 : Démarrer le dev server**

```bash
cd /Users/aurian/Desktop/aurian-portfolio && npm run dev
```

- [ ] **Step 2 : Naviguer entre toutes les planètes et vérifier**

Dans le navigateur, naviguer vers chaque planète (flèches gauche/droite ou swipe) :

| Planète | Attendu (inchangé) |
|---|---|
| **levels** | Sphère avec MeshDistortMaterial vert pâle, peu distordue |
| **energizer** | **NOUVEAU** : wireframe vecteur bleu + cœur émissif + 5 anneaux + arcs + sparkles + bloom |
| **mirakl** | Sphère avec anneau Saturne (`hasRing`) |
| **music-agency** | Sphère qui « respire » (`breathe`) + lune (`hasMoon`) |
| **thelook** | Sphère angulaire (`angularDistort`) |

- [ ] **Step 3 : Vérifier la transition click sur Energizer**

Cliquer sur Energizer focused → l'animation click se joue → `onSelectPlanet` appelé → la transition `PlanetTransition` existante démarre normalement vers le détail du projet.

Expected : aucune régression sur le flow projet → détail.

- [ ] **Step 4 : Vérifier la console**

Aucune erreur React/Three. Aucun warning critique.

- [ ] **Step 5 : Vérifier perf**

DevTools → Performance ou Stats overlay (si activé) :
- Desktop M1 : 60 fps stable.
- Mobile mid (throttle 4x CPU) : ≥ 30 fps.

Si fps < 30 sur mobile, ajuster :
- Réduire `count` des `Sparkles` à 8.
- Réduire `ARC_POOL_SIZE` à 2.

- [ ] **Step 6 : Commit final (changelog ou notes)**

Si aucune correction nécessaire, pas de commit. Sinon, commit ciblé.

---

## Self-Review

**1. Spec coverage**
- ✅ Géométrie enveloppe + cœur + 5 anneaux → Tasks 2, 4
- ✅ Couleurs (`#4DD8FF`, `#1E5FFF`, `#E6FBFF`, `#7FE3FF`, `#FFFFFF`) → Tasks 2, 3, 4, 5, 6
- ✅ Pulse de scoring → Task 5
- ✅ Arcs électriques show-off → Task 6
- ✅ Rotation enveloppe + cœur + anneaux → Tasks 2, 4
- ✅ Flux de données (Sparkles) → Task 7
- ✅ Pulse cardiaque cœur → Task 2
- ✅ Bloom → Task 8
- ✅ Hover (pulse +30 %, arcs ×2, cœur ×1.05) → Task 9
- ✅ Click (compression + flash + explosion + sons) → Task 9
- ✅ Tech stack respecté (drei `Line`, `Sparkles`, postprocessing `Bloom`, shader custom) → Tasks 3, 4, 6, 7, 8
- ✅ Branchement conditionnel propre → Task 2 step 3
- ✅ Mode dégradé mobile/low-end → Task 10
- ✅ Vérif non-régression 4 autres planètes → Task 11
- ⚠ Le label projet à proximité (Hover spec) — déjà géré par le composant parent (`Universe`/`Html`), aucun changement nécessaire ici, conservé via la prop `onSelectPlanet`. **Note explicite dans Task 2 step 3** : Energizer perd temporairement les satellites star — acceptable d'après le spec qui disait « la mécanique actuelle reste ».

**2. Placeholder scan**
- Aucun TODO, aucun « implement later », aucun « similar to Task N ».
- Tous les blocs de code sont complets et copiables tel quel.
- Toutes les commandes shell sont exactes avec output attendu.

**3. Type consistency**
- `EnergizerPlanetProps` (`posX`, `isFocused`, `onSelectPlanet`) consistant Task 2 → Task 9.
- `PipelineRingProps` (`inclination`, `speed`, `radius`) défini Task 4, jamais modifié.
- `ArcSlot` interface définie Task 6, utilisée cohéremment.
- `ElectricArcProps` (`active`, `points`, `opacity`) consistant.
- `buildEnergizerShellMaterial` signature stable (`(): THREE.ShaderMaterial`) Task 3 → Task 5.
- Uniforms shader (`uColorRim`, `uColorBase`, `uColorPulse`, `uOpacity`, `uFresnelPower`, `uPulse`, `uPulseWidth`) cohérents entre `EnergizerShader.ts` et `EnergizerPlanet.tsx`.
- `usePerformanceTier` retourne `"high" | "low"` partout.

**4. Note d'attention spéciale (potentiel piège d'exécution)**
- Task 5 inclut une **deuxième révision du fragment shader** (changement de `length(vWorldPos)` → `length(vLocalPos)` → puis `vLocalPos.y` pour latitude). L'engineer doit appliquer la version **finale** : pulse basée sur `lat = (1.2 - vLocalPos.y) / 2.4`. Les versions intermédiaires servent à expliquer le raisonnement, ne pas les laisser dans le fichier.
- Task 6 : `randomPointOnSphere` doit être hors composant (top-level du fichier). Spawn arcs reset `nextArcCheckRef` proprement.
- Task 9 : pendant l'animation click, ne pas réappeler `onSelectPlanet()` plusieurs fois — guard via `clickPhaseRef.current !== "idle"`.

---

Plan complet. Sauvegardé à `docs/superpowers/plans/2026-05-08-energizer-planet.md`.
