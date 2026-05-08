import * as THREE from "three";

/**
 * Vertex shader — passes local Y for vertical 3-stop gradient + scan band.
 */
export const levelsVertex = /* glsl */ `
  varying vec3 vLocalPos;

  void main() {
    vLocalPos = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

/**
 * Fragment shader — 3-stop vertical gradient (base bordeaux → mid orange →
 * apex gold) + ascending scan band (level-up wave).
 */
export const levelsFragment = /* glsl */ `
  uniform vec3 uColorBase;
  uniform vec3 uColorMid;
  uniform vec3 uColorTop;
  uniform vec3 uColorPulse;
  uniform float uOpacity;
  uniform float uPulse;       // 0..1 progress; outside [0,1] = inactive
  uniform float uPulseWidth;
  uniform float uYBase;
  uniform float uYApex;

  varying vec3 vLocalPos;

  void main() {
    float h = clamp((vLocalPos.y - uYBase) / (uYApex - uYBase), 0.0, 1.0);

    // 3-stop gradient: base → mid (at h=0.5) → top
    vec3 base;
    if (h < 0.5) {
      base = mix(uColorBase, uColorMid, h * 2.0);
    } else {
      base = mix(uColorMid, uColorTop, (h - 0.5) * 2.0);
    }

    // Scan band: level-up wave travelling base → apex
    float band = smoothstep(uPulseWidth, 0.0, abs(h - uPulse));
    float gate = step(0.0, uPulse) * step(uPulse, 1.0);
    band *= gate;

    vec3 color = mix(base, uColorPulse, band);
    float opacity = uOpacity + band * 0.5;
    gl_FragColor = vec4(color, clamp(opacity, 0.0, 1.0));
  }
`;

export interface LevelsShellOptions {
  yBase: number;
  yApex: number;
}

export function buildLevelsShellMaterial(opts: LevelsShellOptions): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: levelsVertex,
    fragmentShader: levelsFragment,
    uniforms: {
      uColorBase: { value: new THREE.Color("#5C0A1E") }, // bordeaux profond
      uColorMid: { value: new THREE.Color("#FF8C2A") },  // orange ardent
      uColorTop: { value: new THREE.Color("#FFD24A") },  // or
      uColorPulse: { value: new THREE.Color("#FFFFFF") },
      uOpacity: { value: 0.95 },
      uPulse: { value: -1.0 },
      uPulseWidth: { value: 0.12 },
      uYBase: { value: opts.yBase },
      uYApex: { value: opts.yApex },
    },
    transparent: true,
    depthWrite: false,
  });
}
