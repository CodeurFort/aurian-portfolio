import * as THREE from "three";

/**
 * Vertex shader — passes the world-space normal and position to the fragment
 * shader so we can compute the fresnel coefficient.
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
 * Fragment shader — fresnel gradient: edges silhouetted to camera glow with
 * uColorRim (#4DD8FF), edges facing camera fade to uColorBase (#1E5FFF).
 */
export const energizerFragment = /* glsl */ `
  uniform vec3 uColorRim;
  uniform vec3 uColorBase;
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
