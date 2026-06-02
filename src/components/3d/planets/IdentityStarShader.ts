import * as THREE from "three";

/**
 * Surface stellaire — granulation plasma type photosphère solaire.
 * Cellules Voronoi (convection) + fbm pour le grain fin + flicker temporel
 * + fresnel pour le limb darkening inversé (bord lumineux). Palette
 * strictement préservée : cream chaud → orange vif → orange profond.
 */
export const identityStarVertex = /* glsl */ `
  varying vec3 vLocalPos;
  varying vec3 vNormal;
  varying vec3 vNormalView;
  varying vec3 vViewDir;

  void main() {
    vLocalPos = position;
    vNormal = normalize(normal);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vNormalView = normalize(normalMatrix * normal);
    vViewDir = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;

export const identityStarFragment = /* glsl */ `
  uniform vec3 uColorCore;     // cream chaud (#FFD7B0)
  uniform vec3 uColorMid;      // orange vif (#FF8A3A)
  uniform vec3 uColorDeep;     // orange profond (#FF7A2E)
  uniform vec3 uColorEdge;     // jaune blanc surbrillance des cellules
  uniform float uTime;
  uniform float uIntensity;

  varying vec3 vLocalPos;
  varying vec3 vNormal;
  varying vec3 vNormalView;
  varying vec3 vViewDir;

  // Hash + value noise + fbm.
  float hash(vec3 p) {
    p = fract(p * vec3(0.1031, 0.1030, 0.0973));
    p += dot(p, p.yzx + 33.33);
    return fract((p.x + p.y) * p.z);
  }
  float vnoise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float n000 = hash(i + vec3(0.0));
    float n100 = hash(i + vec3(1.0, 0.0, 0.0));
    float n010 = hash(i + vec3(0.0, 1.0, 0.0));
    float n110 = hash(i + vec3(1.0, 1.0, 0.0));
    float n001 = hash(i + vec3(0.0, 0.0, 1.0));
    float n101 = hash(i + vec3(1.0, 0.0, 1.0));
    float n011 = hash(i + vec3(0.0, 1.0, 1.0));
    float n111 = hash(i + vec3(1.0, 1.0, 1.0));
    float nx00 = mix(n000, n100, f.x);
    float nx10 = mix(n010, n110, f.x);
    float nx01 = mix(n001, n101, f.x);
    float nx11 = mix(n011, n111, f.x);
    float nxy0 = mix(nx00, nx10, f.y);
    float nxy1 = mix(nx01, nx11, f.y);
    return mix(nxy0, nxy1, f.z);
  }
  float fbm(vec3 p) {
    float a = 0.5;
    float s = 0.0;
    for (int i = 0; i < 5; i++) {
      s += a * vnoise(p);
      p *= 2.07;
      a *= 0.5;
    }
    return s;
  }

  // Voronoi 3D — distance au point le plus proche dans une grille jittered.
  // Renvoie aussi la distance au second pour avoir des "lanes" sombres
  // (intercellulaires) propres à la convection solaire.
  vec2 voronoi(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    float d1 = 1.0;
    float d2 = 1.0;
    for (int x = -1; x <= 1; x++) {
      for (int y = -1; y <= 1; y++) {
        for (int z = -1; z <= 1; z++) {
          vec3 g = vec3(float(x), float(y), float(z));
          vec3 o = vec3(
            hash(i + g),
            hash(i + g + 17.0),
            hash(i + g + 31.0)
          );
          // Petit jitter temporel sur les centres → cellules qui dérivent.
          o += 0.08 * sin(uTime * 0.6 + (i + g) * 1.7);
          vec3 r = g + o - f;
          float d = dot(r, r);
          if (d < d1) {
            d2 = d1;
            d1 = d;
          } else if (d < d2) {
            d2 = d;
          }
        }
      }
    }
    return vec2(sqrt(d1), sqrt(d2));
  }

  void main() {
    // Granulation : cellules Voronoi à fréquence moyenne pour la
    // photosphère (taille typique d'un granule : ~15% du diamètre visuel).
    vec3 p = vLocalPos * 4.5;
    vec2 v = voronoi(p);
    // Distance au centre de cellule (0 = centre brillant, 1 = bord sombre).
    float cell = v.x;
    // Largeur de la lane inter-cellulaire (différence d2 - d1 → lane fine).
    float lane = clamp(v.y - v.x, 0.0, 1.0);
    // laneMask : 1 sur la lane (sombre), 0 ailleurs.
    float laneMask = 1.0 - smoothstep(0.0, 0.16, lane);

    // Granulation fine : second Voronoi à plus haute fréquence superposé
    // pour casser la régularité.
    vec2 v2 = voronoi(p * 2.4 + vec3(31.0, 7.0, 13.0));
    float lane2 = clamp(v2.y - v2.x, 0.0, 1.0);
    float laneMask2 = 1.0 - smoothstep(0.0, 0.20, lane2);

    // Flicker plasma : bruit temporel basse fréquence (cells qui dérivent
    // doucement). Amplitude réduite et fréquence ralentie pour éviter le
    // clignotement amplifié par le bloom (sortie clampée plus bas).
    float flick = fbm(vLocalPos * 6.0 + uTime * 0.18);
    float plasma = 0.85 + 0.15 * flick;

    // Couleur : centre brillant (cream chaud) → mid (orange vif) → bord
    // de cellule (orange profond) → lane sombre (deeper). Le centre est
    // donné par 1 - cell (plus on est proche du centre, plus c'est clair).
    float centerBias = 1.0 - smoothstep(0.0, 0.55, cell);
    vec3 surface = mix(uColorDeep, uColorMid, centerBias);
    surface = mix(surface, uColorCore, pow(centerBias, 2.0));

    // Surbrillance des centres très lumineux (highlights jaune-blanc).
    float hot = pow(centerBias, 4.0) * plasma;
    surface += uColorEdge * hot * 0.5;

    // Lanes sombres entre cellules (convection visible).
    surface = mix(surface, uColorDeep * 0.55, (laneMask + laneMask2 * 0.5) * 0.55);

    // Modulation temporelle globale : heartbeat très doux pour ne pas
    // créer de variations brusques que le bloom amplifierait en shimmer.
    float breathe = 0.96 + 0.04 * sin(uTime * 1.0);
    surface *= breathe * plasma;

    // Limb brightening inversé : un soleil a un assombrissement aux bords
    // (limb darkening), mais visuellement on amplifie le rim externe pour
    // accentuer la silhouette → plus captivant qu'un disque plat.
    float ndv = max(dot(vNormalView, vViewDir), 0.0);
    float limb = pow(1.0 - ndv, 1.6);
    surface = mix(surface, uColorCore * 1.2, limb * 0.35);

    // Fresnel chaud sur le très bord : lueur explosive.
    float rim = pow(1.0 - ndv, 4.0);
    surface += uColorMid * rim * 0.6;

    // CLAMP final : on garde la sortie sous 1.0 pour ne pas créer
    // d'oscillations temporelles amplifiées par le bloom (cause du
    // shimmer Mirakl-like). Le soleil reste lumineux via les coronas et
    // le pointLight, sans clignoter.
    vec3 col = clamp(surface * uIntensity, vec3(0.0), vec3(1.0));
    gl_FragColor = vec4(col, 1.0);
  }
`;

export function buildIdentityStarMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: identityStarVertex,
    fragmentShader: identityStarFragment,
    uniforms: {
      // Strictement les couleurs actuelles de l'étoile volcanique :
      uColorCore: { value: new THREE.Color("#FFD7B0") },
      uColorMid: { value: new THREE.Color("#FF8A3A") },
      uColorDeep: { value: new THREE.Color("#FF7A2E") },
      // Surbrillance des cellules : tirage chaud de la même famille.
      uColorEdge: { value: new THREE.Color("#FFE6CC") },
      uTime: { value: 0.0 },
      uIntensity: { value: 1.0 },
    },
    toneMapped: false,
  });
}
