import * as THREE from "three";

/**
 * Vertex shader — passes local Y for vertical gradient + scan band.
 */
export const energizerVertex = /* glsl */ `
  varying vec3 vLocalPos;

  void main() {
    vLocalPos = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

/**
 * Fragment shader — vertical gradient (top cyan → bottom purple) +
 * a Y-axis scan band travelling north → south when uPulse ∈ [0, 1].
 */
export const energizerFragment = /* glsl */ `
  uniform vec3 uColorTop;
  uniform vec3 uColorBottom;
  uniform vec3 uColorPulse;
  uniform float uOpacity;
  uniform float uPulse;       // 0..1 progress; outside [0,1] = inactive
  uniform float uPulseWidth;  // band thickness, normalized
  uniform float uRadius;      // sphere radius (for normalization)

  varying vec3 vLocalPos;

  void main() {
    // Vertical gradient: top (y = +radius) → bottom (y = -radius)
    float lat = clamp((uRadius - vLocalPos.y) / (2.0 * uRadius), 0.0, 1.0);
    vec3 base = mix(uColorTop, uColorBottom, lat);

    // Pulse band: smooth north → south sweep
    float band = smoothstep(uPulseWidth, 0.0, abs(lat - uPulse));
    float gate = step(0.0, uPulse) * step(uPulse, 1.0);
    band *= gate;

    vec3 color = mix(base, uColorPulse, band);
    float opacity = uOpacity + band * 0.4;
    gl_FragColor = vec4(color, clamp(opacity, 0.0, 1.0));
  }
`;

/**
 * Build a ShaderMaterial pre-configured for the energizer globe wireframe.
 * Top cyan / bottom purple gradient + scoring scan band.
 */
export function buildEnergizerShellMaterial(radius: number): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: energizerVertex,
    fragmentShader: energizerFragment,
    uniforms: {
      uColorTop: { value: new THREE.Color("#4DD8FF") },
      uColorBottom: { value: new THREE.Color("#9D5BFF") },
      uColorPulse: { value: new THREE.Color("#FFFFFF") },
      uOpacity: { value: 0.95 },
      uPulse: { value: -1.0 }, // -1 = inactive
      uPulseWidth: { value: 0.12 },
      uRadius: { value: radius },
    },
    transparent: true,
    depthWrite: false,
  });
}
