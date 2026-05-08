import * as THREE from "three";

/**
 * Vertex shader — exposes world-space normal/position AND local position
 * (used by the fragment to compute the Y-axis scan band).
 */
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

/**
 * Fragment shader — fresnel gradient + a Y-axis scan band that travels
 * from north pole to south pole when uPulse is in [0, 1].
 */
export const energizerFragment = /* glsl */ `
  uniform vec3 uColorRim;
  uniform vec3 uColorBase;
  uniform vec3 uColorPulse;
  uniform float uOpacity;
  uniform float uFresnelPower;
  uniform float uPulse;       // 0..1 progress; outside [0,1] = inactive
  uniform float uPulseWidth;  // band thickness, normalized

  varying vec3 vWorldNormal;
  varying vec3 vWorldPos;
  varying vec3 vLocalPos;

  void main() {
    vec3 viewDir = normalize(cameraPosition - vWorldPos);
    float fresnel = 1.0 - max(dot(viewDir, vWorldNormal), 0.0);
    fresnel = pow(fresnel, uFresnelPower);
    vec3 base = mix(uColorBase, uColorRim, fresnel);

    // Pulse band: a wave travelling along the Y axis (latitude on the
    // icosahedron). vLocalPos.y ranges from -1.2 to +1.2 → normalize to
    // [0, 1] running from top (north) to bottom (south).
    float lat = (1.2 - vLocalPos.y) / 2.4;
    lat = clamp(lat, 0.0, 1.0);
    float band = smoothstep(uPulseWidth, 0.0, abs(lat - uPulse));
    float gate = step(0.0, uPulse) * step(uPulse, 1.0);
    band *= gate;

    vec3 color = mix(base, uColorPulse, band);
    float opacity = uOpacity + band * 0.5;
    gl_FragColor = vec4(color, clamp(opacity, 0.0, 1.0));
  }
`;

/**
 * Build a ShaderMaterial pre-configured for the energizer wireframe.
 * Includes uniforms for fresnel + scoring pulse band.
 */
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
