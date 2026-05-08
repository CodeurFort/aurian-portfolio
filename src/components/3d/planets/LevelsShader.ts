import * as THREE from "three";

/**
 * Levels planet — black sphere with glowing molten veins (bordeaux→or),
 * fresnel rim light, ascending level-up pulse.
 *
 * Vertex: pass world-space position (for noise), local position (for pulse
 * along Y), and view-space normal/view direction (for fresnel).
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

/**
 * Fragment: cheap 3D simplex-ish noise via hash → fbm → vein mask. Veins are
 * narrow regions where the noise crosses zero, lit with a vertical gradient
 * (bordeaux at south pole → orange → or at north pole). Adds a fresnel rim
 * light and an ascending scan band (level-up).
 */
export const levelsFragment = /* glsl */ `
  uniform vec3 uColorVeinBase;
  uniform vec3 uColorVeinMid;
  uniform vec3 uColorVeinTop;
  uniform vec3 uColorRim;
  uniform float uVeinIntensity;
  uniform float uPulse;       // 0..1 active; outside = inactive
  uniform float uPulseWidth;
  uniform float uTime;

  varying vec3 vLocalPos;
  varying vec3 vNormalView;
  varying vec3 vViewDir;

  // Hash-based 3D value noise.
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
    // h: 0 at south pole, 1 at north pole (radius is 1.2 so divide accordingly).
    float h = clamp((vLocalPos.y + 1.2) / 2.4, 0.0, 1.0);

    // Vein mask: narrow regions where fbm is near a target value.
    // Using two octaves at different scales for organic crack feel.
    vec3 p = vLocalPos * 1.4;
    float n = fbm(p);
    float n2 = fbm(p * 2.6 + vec3(11.3, 7.7, 4.1));
    float crack = abs(n - 0.5) * 2.0;       // 0 on the ridge, 1 far away
    float crack2 = abs(n2 - 0.5) * 2.0;
    float vein = smoothstep(0.18, 0.0, crack) + smoothstep(0.10, 0.0, crack2) * 0.6;
    vein = clamp(vein, 0.0, 1.4);

    // Vertical color: bordeaux base → orange mid → or top.
    vec3 veinCol;
    if (h < 0.55) {
      veinCol = mix(uColorVeinBase, uColorVeinMid, smoothstep(0.0, 0.55, h));
    } else {
      veinCol = mix(uColorVeinMid, uColorVeinTop, smoothstep(0.55, 1.0, h));
    }

    // Subtle vein flicker with time (very slow).
    float flicker = 0.85 + 0.15 * sin(uTime * 1.7 + n * 6.28);

    // Level-up scan: bright golden band travelling base→apex.
    float band = smoothstep(uPulseWidth, 0.0, abs(h - uPulse));
    float gate = step(0.0, uPulse) * step(uPulse, 1.0);
    band *= gate;

    // Fresnel rim — strong on silhouette, dim on flat-facing.
    float ndv = max(dot(vNormalView, vViewDir), 0.0);
    float fres = pow(1.0 - ndv, 3.0);

    // Final color: black base + emissive veins + scan band + rim.
    vec3 black = vec3(0.012, 0.008, 0.012);
    vec3 col = black;
    col += veinCol * vein * uVeinIntensity * flicker;
    col += uColorVeinTop * band * 1.2;
    col += uColorRim * fres * 0.55;

    gl_FragColor = vec4(col, 1.0);
  }
`;

export function buildLevelsShellMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: levelsVertex,
    fragmentShader: levelsFragment,
    uniforms: {
      uColorVeinBase: { value: new THREE.Color("#5C0A1E") }, // bordeaux profond
      uColorVeinMid: { value: new THREE.Color("#FF6A1A") },  // orange ardent
      uColorVeinTop: { value: new THREE.Color("#FFD24A") },  // or
      uColorRim: { value: new THREE.Color("#FF8C2A") },      // halo orange
      uVeinIntensity: { value: 1.6 },
      uPulse: { value: -1.0 },
      uPulseWidth: { value: 0.10 },
      uTime: { value: 0.0 },
    },
  });
}
