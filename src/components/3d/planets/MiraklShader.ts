import * as THREE from "three";

/**
 * Mirakl planet — gas giant à la Jupiter avec bandes nuageuses tourbillonnantes,
 * palette violet sombre → magenta → ocre doré → crème, + une grande tache
 * anti-cyclonique (clin d'œil à la grande tache rouge).
 *
 * Vertex : on transmet la position locale pour calculer la latitude (bandes
 * horizontales) et appliquer du bruit 3D, plus normale/vue pour le fresnel.
 */
export const miraklVertex = /* glsl */ `
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

/**
 * Fragment :
 *   - Latitude (vLocalPos.y / radius) → bandes horizontales nettes
 *   - fbm 3D animé dans le temps → tourbillons / déformation des bandes
 *   - Mélange progressif violet sombre → magenta → ocre → crème selon le band index
 *   - Tache anti-cyclonique (zone gaussienne plus chaude) tournant lentement
 *   - Fresnel rim doux pour le halo violet
 */
export const miraklFragment = /* glsl */ `
  uniform vec3 uColorDeep;     // violet très sombre
  uniform vec3 uColorMid;      // violet rosé
  uniform vec3 uColorWarm;     // ocre doré (la "bonne couleur" Mirakl)
  uniform vec3 uColorCream;    // crème clair (bords de bandes)
  uniform vec3 uColorSpot;     // magenta chaud (tache anti-cyclonique)
  uniform vec3 uColorRim;      // violet rosé pour le halo fresnel
  uniform float uTime;
  uniform float uIntensity;
  uniform float uPlanetRadius;

  varying vec3 vLocalPos;
  varying vec3 vNormalView;
  varying vec3 vViewDir;

  // Hash 3D + value noise + fbm — léger et suffisant pour des bandes nuageuses.
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
    // Latitude normalisée : -1 (pôle sud) → +1 (pôle nord).
    float lat = vLocalPos.y / uPlanetRadius;

    // Bruit 3D animé : déforme les bandes pour un effet tourbillonnant.
    // Échantillonnage anisotrope : on étire X/Z (axe horizontal) pour que le
    // bruit s'écoule plutôt en bandes plutôt qu'en grumeaux uniformes.
    vec3 p = vec3(vLocalPos.x * 1.6, vLocalPos.y * 4.5, vLocalPos.z * 1.6);
    float swirl = fbm(p + vec3(uTime * 0.05, 0.0, -uTime * 0.03));
    float swirl2 = fbm(p * 2.3 + vec3(-uTime * 0.04, uTime * 0.02, uTime * 0.03));
    float distortedLat = lat + (swirl - 0.5) * 0.35 + (swirl2 - 0.5) * 0.12;

    // Bandes : 7 bandes horizontales générées via cosinus de la latitude.
    float bandPhase = distortedLat * 7.0;
    float band = 0.5 + 0.5 * cos(bandPhase);
    band = pow(band, 1.4); // bandes plus marquées

    // Couleur de base : on construit un dégradé en 4 paliers selon
    // (band × pos verticale) pour avoir des bandes warm près de l'équateur
    // et des bandes plus violettes vers les pôles.
    float poleness = abs(distortedLat); // 0 équateur, 1 pôles
    vec3 baseDark = mix(uColorMid, uColorDeep, smoothstep(0.4, 1.0, poleness));
    vec3 baseLight = mix(uColorWarm, uColorCream, smoothstep(0.0, 0.5, poleness * (1.0 - band)));
    vec3 col = mix(baseDark, baseLight, band);

    // Détails fins : un second bruit plus haute fréquence ajoute du grain
    // organique aux interfaces de bandes.
    float detail = fbm(p * 4.5 + vec3(uTime * 0.08));
    col = mix(col, col * (0.85 + 0.3 * detail), 0.4);

    // Tache anti-cyclonique : grande zone elliptique tournant lentement
    // dans l'hémisphère sud. On compute la longitude pour la positionner.
    float lon = atan(vLocalPos.z, vLocalPos.x); // -π .. π
    float spotLon = mod(uTime * 0.04, 6.2831);
    float dLon = abs(mod(lon - spotLon + 3.14159, 6.2831) - 3.14159);
    float dLat = abs(distortedLat - (-0.35)); // sud
    // Ellipse plus large en longitude qu'en latitude.
    float spotDist = sqrt(pow(dLon / 0.6, 2.0) + pow(dLat / 0.18, 2.0));
    float spotMask = smoothstep(1.0, 0.0, spotDist);
    col = mix(col, uColorSpot, spotMask * 0.65);

    // Fresnel : halo doux sur le bord du disque, en vert tendre.
    // Contribution réduite (0.22) pour éviter de pousser les bords au-dessus
    // du seuil de bloom (qui causait du shimmer temporel sur les voisins).
    float ndv = max(dot(vNormalView, vViewDir), 0.0);
    float fres = pow(1.0 - ndv, 2.4);
    col += uColorRim * fres * 0.22;

    // Clamp final : on garde tout sous ~1.0 pour ne pas alimenter le bloom.
    // Les bandes claires (cream) gardent leur richesse mais ne flickerent plus.
    col = clamp(col * uIntensity, vec3(0.0), vec3(1.0));
    gl_FragColor = vec4(col, 1.0);
  }
`;

export function buildMiraklShellMaterial(
  planetRadius: number,
): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: miraklVertex,
    fragmentShader: miraklFragment,
    uniforms: {
      // Palette analogue : verts sage clair en dominante + sable doux pour
      // les bandes chaudes (ocre désaturé vers le beige pour ne pas jurer
      // avec les verts). Tout reste dans une même famille tonale.
      uColorDeep: { value: new THREE.Color("#3A5547") }, // vert profond doux
      uColorMid: { value: new THREE.Color("#88A088") },  // sage clair (dominante)
      uColorWarm: { value: new THREE.Color("#C9B583") }, // sable chaud (ex-ocre)
      uColorCream: { value: new THREE.Color("#DDD3A8") }, // crème vert pâle
      uColorSpot: { value: new THREE.Color("#9FBC8E") }, // vert tendre lumineux
      uColorRim: { value: new THREE.Color("#BFD0BC") },  // halo vert pâle
      uTime: { value: 0.0 },
      uIntensity: { value: 1.0 },
      uPlanetRadius: { value: planetRadius },
    },
  });
}
