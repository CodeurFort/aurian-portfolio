import * as THREE from "three";

/**
 * Beyond core — petit astre rocheux cratéré (style lune) en palette blush.
 * Bandes verticales-libres (pas horizontales comme Mirakl) générées via
 * fbm 3D + craters Worley-like, terminator jour/nuit avec lumière fake
 * directionnelle pour donner un volume crédible sans dépendre d'éclairage
 * de scène.
 */
export const beyondVertex = /* glsl */ `
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

export const beyondFragment = /* glsl */ `
  uniform vec3 uColorRock;     // base rocheuse (rose-bordeaux mate)
  uniform vec3 uColorHigh;     // crête / poudré clair (crème blush)
  uniform vec3 uColorCrater;   // intérieur des cratères (rose foncé)
  uniform vec3 uColorIce;      // calottes polaires (blanc-crème glacé)
  uniform vec3 uColorCloud;    // nuages atmosphériques (blanc poudré)
  uniform vec3 uColorRim;      // halo fresnel
  uniform vec3 uLightDir;      // direction de la lumière fake (terminator)
  uniform float uTime;
  uniform float uIntensity;

  varying vec3 vLocalPos;
  varying vec3 vNormal;
  varying vec3 vNormalView;
  varying vec3 vViewDir;

  // Hash 3D + value noise.
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
    for (int i = 0; i < 5; i++) {
      s += a * vnoise(p);
      p *= 2.07;
      a *= 0.5;
    }
    return s;
  }

  // Worley-ish : distance au point le plus proche dans une grille jitter.
  // Utilisé pour créer des cratères ronds.
  float worley(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    float d = 1.0;
    for (int x = -1; x <= 1; x++) {
      for (int y = -1; y <= 1; y++) {
        for (int z = -1; z <= 1; z++) {
          vec3 g = vec3(float(x), float(y), float(z));
          vec3 o = vec3(
            hash(i + g),
            hash(i + g + 17.0),
            hash(i + g + 31.0)
          );
          vec3 r = g + o - f;
          d = min(d, dot(r, r));
        }
      }
    }
    return sqrt(d);
  }

  void main() {
    // Surface rocheuse : base fbm (relief) + cratères Worley.
    vec3 p = vLocalPos * 2.4;
    float relief = fbm(p);
    float relief2 = fbm(p * 2.8);

    // Cratères : zones où Worley est faible (proche d'un centre).
    float craterBig = worley(vLocalPos * 3.0);
    float craterSmall = worley(vLocalPos * 7.0);

    // Couleur de surface : rock base ↔ highlights ponctués par craters.
    vec3 surface = mix(uColorRock, uColorHigh, smoothstep(0.35, 0.75, relief));
    surface = mix(surface, surface * 0.85, smoothstep(0.0, 0.6, relief2) * 0.4);

    // On assombrit l'intérieur des cratères (faible Worley = creux).
    float craterDepth = 1.0 - smoothstep(0.0, 0.4, craterBig);
    surface = mix(surface, uColorCrater, craterDepth * 0.85);

    // -------------------------------------------------------------
    // CALOTTES POLAIRES : zones glacées aux deux pôles. Le bord de
    // la calotte est irrégulier grâce au bruit (pas une ligne nette).
    // C'est la signature visuelle qui distingue radicalement de Mirakl
    // (qui a des bandes horizontales équatoriales, pas polaires).
    // -------------------------------------------------------------
    float lat = abs(normalize(vNormal).y); // 0 équateur → 1 pôles
    float iceNoise = fbm(vNormal * 4.0) * 0.18;
    float iceMask = smoothstep(0.62, 0.85, lat + iceNoise);
    surface = mix(surface, uColorIce, iceMask * 0.92);

    // -------------------------------------------------------------
    // NUAGES ATMOSPHÉRIQUES : taches blanches irrégulières (PAS des
    // bandes horizontales — fbm 3D pleine sphère, motifs en patches).
    // Lents à dériver, donne du mouvement subtil et un look habité.
    // -------------------------------------------------------------
    vec3 cloudP = vNormal * 3.2 + vec3(uTime * 0.018, 0.0, uTime * 0.012);
    float clouds = fbm(cloudP);
    float cloudMask = smoothstep(0.55, 0.78, clouds);
    // Atténuer les nuages sur les calottes (déjà blanches → évite cumul).
    cloudMask *= (1.0 - iceMask * 0.7);
    surface = mix(surface, uColorCloud, cloudMask * 0.75);

    // Lumière fake : produit scalaire normale ↔ direction lumineuse fixe.
    // Terminator doux jour/nuit → volume crédible.
    vec3 L = normalize(uLightDir);
    float diff = max(dot(vNormal, L), 0.0);
    float lit = pow(diff, 0.7) * 0.85 + 0.18;

    vec3 col = surface * lit;

    // Highlights spéculaires sur les crêtes éclairées hors cratère.
    float spec = pow(max(0.0, diff), 8.0) * (1.0 - craterDepth);
    col += uColorHigh * spec * 0.2;

    // Fresnel atmosphérique — légèrement renforcé pour donner une
    // ambiance "planète habitable avec atmosphère" (vs un caillou nu).
    float ndv = max(dot(vNormalView, vViewDir), 0.0);
    float fres = pow(1.0 - ndv, 2.5);
    col += uColorRim * fres * 0.5;

    // Clamp final — pas de bloom shimmer.
    col = clamp(col * uIntensity, vec3(0.0), vec3(1.0));
    gl_FragColor = vec4(col, 1.0);
  }
`;

export function buildBeyondCoreMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: beyondVertex,
    fragmentShader: beyondFragment,
    uniforms: {
      // Palette blush rocheuse : rose-bordeaux mat → crème blush poudré,
      // creux des cratères dans une teinte rose foncé pour lire le relief.
      uColorRock: { value: new THREE.Color("#A87080") },
      uColorHigh: { value: new THREE.Color("#F5DBC8") },
      uColorCrater: { value: new THREE.Color("#6A4452") },
      // Calottes polaires : cream blanc-glacé légèrement teinté blush.
      uColorIce: { value: new THREE.Color("#F0E8DC") },
      // Nuages atmosphériques : blanc poudré chaud (famille blush).
      uColorCloud: { value: new THREE.Color("#FFE8DC") },
      uColorRim: { value: new THREE.Color("#E8A8B0") },
      // Lumière fake légèrement décentrée — terminator visible.
      uLightDir: { value: new THREE.Vector3(0.7, 0.5, 0.8).normalize() },
      uTime: { value: 0.0 },
      uIntensity: { value: 1.0 },
    },
  });
}
