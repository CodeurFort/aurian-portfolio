import * as THREE from "three";

/**
 * TheLook planet — astre stratifié type pierre sédimentaire.
 * 12 strates horizontales franches (référence directe aux 12 CTEs du
 * pipeline SQL), légèrement teintées ocre/grès/pierre chaude. Pas de
 * tourbillons (Mirakl), pas de cratères (Beyond) : lecture géologique
 * propre + canaux verticaux lumineux qui simulent le flux data top→bottom.
 */
export const thelookVertex = /* glsl */ `
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

export const thelookFragment = /* glsl */ `
  uniform vec3 uColorStone;     // pierre claire (strate dominante)
  uniform vec3 uColorSand;      // grès chaud (strate moyenne)
  uniform vec3 uColorOchre;     // ocre profond (strate sombre)
  uniform vec3 uColorEdge;      // crème pour les fines stries de séparation
  uniform vec3 uColorFlow;      // bleu/cyan doux pour le flux data
  uniform vec3 uColorRim;       // halo fresnel chaud
  uniform float uTime;
  uniform float uIntensity;
  uniform float uPlanetRadius;

  varying vec3 vLocalPos;
  varying vec3 vNormal;
  varying vec3 vNormalView;
  varying vec3 vViewDir;

  // Hash + value noise + fbm pour le grain rocheux des strates.
  float hash(vec3 p) {
    p = fract(p * vec3(0.1031, 0.1030, 0.0973));
    p += dot(p, p.yzx + 33.33);
    return fract((p.x + p.y) * p.z);
  }
  float vnoise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float n000 = hash(i + vec3(0.0, 0.0, 0.0));
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
    for (int i = 0; i < 4; i++) {
      s += a * vnoise(p);
      p *= 2.05;
      a *= 0.5;
    }
    return s;
  }

  void main() {
    // Hauteur normalisée : -1 (pôle sud) → +1 (pôle nord).
    float h = vLocalPos.y / uPlanetRadius;

    // -------------------------------------------------------------
    // 12 STRATES (référence directe aux 12 CTEs du pipeline SQL).
    // On découpe la sphère en 12 bandes horizontales franches,
    // chacune avec sa nuance. Les coupes sont nettes (pas tourbillonnantes)
    // pour signifier "structuré / pipeline" vs Mirakl turbulent.
    // -------------------------------------------------------------
    float strataIdxF = floor((h * 0.5 + 0.5) * 12.0);
    float strataIdx = clamp(strataIdxF, 0.0, 11.0);
    // Variation procédurale par index pour différencier les strates.
    float strataSeed = strataIdx * 0.137;

    // Palette par strate : alterne stone clair, sand chaud, ocre profond
    // selon une suite pseudo-aléatoire stable (basée sur strataIdx).
    float palettePick = fract(sin(strataIdx * 12.9898) * 43758.5453);
    vec3 baseStrata;
    if (palettePick < 0.33) {
      baseStrata = uColorStone;
    } else if (palettePick < 0.7) {
      baseStrata = uColorSand;
    } else {
      baseStrata = uColorOchre;
    }

    // Modulation interne légère pour donner du grain rocheux à chaque strate
    // (sans casser la lisibilité des coupes franches).
    float grain = fbm(vLocalPos * 6.0 + strataSeed * 17.0);
    vec3 col = baseStrata * (0.85 + 0.25 * grain);

    // -------------------------------------------------------------
    // STRIES DE SÉPARATION : lignes claires aux interfaces de strates.
    // Repère visuel "couches" comme des veines de craie blanche.
    // -------------------------------------------------------------
    float strataPos = (h * 0.5 + 0.5) * 12.0;
    float strataFrac = fract(strataPos);
    float edgeMask = smoothstep(0.0, 0.04, strataFrac) * smoothstep(1.0, 0.96, strataFrac);
    edgeMask = 1.0 - edgeMask; // 1 sur l'interface, 0 au milieu de la strate
    col = mix(col, uColorEdge, edgeMask * 0.6);

    // -------------------------------------------------------------
    // CANAUX DE FLUX VERTICAUX : 5 colonnes lumineuses qui descendent
    // verticalement (longitude fixe, pas de rotation), avec une animation
    // de pulse qui descend du pôle nord vers le pôle sud → lecture directe
    // "pipeline data top→bottom".
    // -------------------------------------------------------------
    float lon = atan(vLocalPos.z, vLocalPos.x); // -π .. π
    // 5 canaux régulièrement espacés en longitude.
    float channelPhase = lon * 5.0 / 6.2831 * 6.2831; // = lon * 5
    float channelMask = pow(0.5 + 0.5 * cos(channelPhase), 32.0);
    // Animation : un pulse d'intensité descend en y au cours du temps.
    float flowWave = sin(h * 6.0 - uTime * 1.6);
    float flowPulse = smoothstep(0.4, 1.0, flowWave) * channelMask;
    // Atténuer un peu sur les pôles pour ne pas saturer.
    float poleAttenuation = 1.0 - smoothstep(0.7, 1.0, abs(h));
    flowPulse *= poleAttenuation;
    col = mix(col, uColorFlow, flowPulse * 0.55);

    // -------------------------------------------------------------
    // ÉCLAIRAGE FAKE : terminator doux pour donner du volume.
    // -------------------------------------------------------------
    vec3 lightDir = normalize(vec3(0.6, 0.4, 0.8));
    float diff = max(dot(vNormal, lightDir), 0.0);
    float lit = pow(diff, 0.7) * 0.85 + 0.22;
    col *= lit;

    // Highlight spéculaire très doux sur les arêtes des strates éclairées
    // (lit l'edgeMask) — donne un côté "pierre polie".
    float spec = pow(diff, 6.0) * edgeMask * 0.3;
    col += uColorEdge * spec;

    // Fresnel chaud pour le halo atmosphérique.
    float ndv = max(dot(vNormalView, vViewDir), 0.0);
    float fres = pow(1.0 - ndv, 2.4);
    col += uColorRim * fres * 0.32;

    // Clamp final pour ne pas alimenter le bloom (anti-shimmer comme Mirakl).
    col = clamp(col * uIntensity, vec3(0.0), vec3(1.0));
    gl_FragColor = vec4(col, 1.0);
  }
`;

export function buildTheLookMaterial(planetRadius: number): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: thelookVertex,
    fragmentShader: thelookFragment,
    uniforms: {
      // Palette pierre / grès / ocre — famille tonale chaude désaturée
      // qui se distingue du sage de Mirakl et du blush de Beyond.
      uColorStone: { value: new THREE.Color("#C8B89A") },  // pierre claire
      uColorSand: { value: new THREE.Color("#A88A60") },   // grès chaud
      uColorOchre: { value: new THREE.Color("#7A5840") },  // ocre profond
      uColorEdge: { value: new THREE.Color("#E8DCC0") },   // crème (stries)
      // Cyan-vert sage doux pour le flux data — contraste avec la pierre
      // chaude tout en restant dans une lumière naturelle.
      uColorFlow: { value: new THREE.Color("#9EC8B0") },
      uColorRim: { value: new THREE.Color("#D8B88E") },    // halo chaud
      uTime: { value: 0.0 },
      uIntensity: { value: 1.0 },
      uPlanetRadius: { value: planetRadius },
    },
  });
}
