import * as THREE from "three";

/**
 * Levels planet — globe cartographique hand-drawn (océans bleu-ardoise
 * aquarellés, continents sage-olive, contours encrés au fusain), parcouru
 * par un tracé incandescent montant.
 *
 * IMPORTANT (root cause identifié par bissection) : le fresnel rim
 * `pow(1 - ndv, 2.6+)` produit un shimmer sur base claire parce que la
 * non-linéarité amplifie le bruit d'interpolation des normales par
 * fragment. Sur base sombre (HEAD vein design) c'est invisible. Sur
 * base claire (carto) ça devient un clignotement perçu sur tout le rim.
 *
 * Solution : fresnel LINÉAIRE (1 - ndv, sans pow) en mix-darken vers
 * l'ink. Donne quand même le volume — silhouette plus sombre = perspective
 * de globe vu en perspective, look carto cohérent.
 */
export const levelsVertex = /* glsl */ `
  varying vec3 vLocalPos;
  varying vec3 vNormalView;
  varying vec3 vViewDir;

  void main() {
    vLocalPos = position;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vNormalView = normalize(normalMatrix * normal);
    vViewDir = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;

export const levelsFragment = /* glsl */ `
  uniform vec3 uColorOcean;
  uniform vec3 uColorLand;
  uniform vec3 uColorInk;
  uniform vec3 uColorTrace;
  uniform vec3 uColorRim;
  uniform float uVeinIntensity;
  uniform float uPulse;
  uniform float uPulseWidth;
  uniform float uTime;

  varying vec3 vLocalPos;
  varying vec3 vNormalView;
  varying vec3 vViewDir;

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
      p *= 2.07;
      a *= 0.5;
    }
    return s;
  }

  void main() {
    float h = clamp((vLocalPos.y + 1.2) / 2.4, 0.0, 1.0);

    // CONTINENTS — fbm basse fréquence.
    vec3 p = vLocalPos * 1.05;
    float n  = fbm(p);
    float n2 = fbm(p * 2.3 + vec3(7.7, 3.3, 11.1));
    float continent = n * 0.7 + n2 * 0.3;
    float landSoft = smoothstep(0.46, 0.55, continent);

    // CÔTE — bande large pour absorber l'aliasing rotation.
    float edgeDist = abs(continent - 0.50);
    float coast = smoothstep(0.06, 0.0, edgeDist);

    // HATCHING aquarelle, statique (pas d'uTime).
    float hatch = fbm(p * 5.2) - 0.5;
    float hatchLines = smoothstep(0.06, 0.0, abs(hatch)) * (1.0 - landSoft) * 0.14;

    // Grain interne aux continents.
    float landGrain = fbm(p * 4.0) * 0.08;

    // BASE — océan / terres / fusain.
    vec3 base = mix(uColorOcean, uColorLand, landSoft);
    base += vec3(landGrain) * landSoft;
    base -= vec3(hatchLines);
    base = mix(base, uColorInk, coast * 0.55);

    // SCAN BAND level-up + ROUTE qui s'embrase sur la côte.
    float band = smoothstep(uPulseWidth, 0.0, abs(h - uPulse));
    float gate = step(0.0, uPulse) * step(uPulse, 1.0);
    band *= gate;
    float route = coast * band * 2.0;

    vec3 col = base;
    col += uColorTrace * route * uVeinIntensity;
    col += uColorTrace * band * 0.30;

    // FRESNEL — LINÉAIRE (PAS DE POW) en mix-darken vers ink.
    // Identifié par bissection : pow(1-ndv, k>1) avec base claire = shimmer
    // sur le rim. Linéaire = pas d'amplification, plus de flicker, donne
    // quand même la profondeur perspective d'un globe.
    float ndv = max(dot(vNormalView, vViewDir), 0.0);
    float fres = 1.0 - ndv;
    col = mix(col, uColorInk, fres * 0.30);

    // VIGNETTE pôles — invariante par rotation Y (utilise vLocalPos.y),
    // donc pas de flicker.
    float poleFalloff = 1.0 - smoothstep(0.75, 1.0, abs(vLocalPos.y) / 1.2);
    col *= mix(0.82, 1.0, poleFalloff);

    gl_FragColor = vec4(col, 1.0);
  }
`;

export function buildLevelsShellMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: levelsVertex,
    fragmentShader: levelsFragment,
    uniforms: {
      uColorOcean: { value: new THREE.Color("#B7C5CE") },
      uColorLand:  { value: new THREE.Color("#7A9275") },
      uColorInk:   { value: new THREE.Color("#1B1E25") },
      uColorTrace: { value: new THREE.Color("#EFE8D8") },
      uColorRim:   { value: new THREE.Color("#BCC7C0") },
      uVeinIntensity: { value: 1.4 },
      uPulse: { value: -1.0 },
      uPulseWidth: { value: 0.10 },
      uTime: { value: 0.0 },
    },
  });
}
