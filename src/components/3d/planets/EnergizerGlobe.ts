import * as THREE from "three";

/**
 * Build a wireframe globe geometry — meridians (longitude) + parallels
 * (latitude), as continuous solid lines.
 *
 * Returns a single BufferGeometry suitable for `THREE.LineSegments`.
 *
 * @param radius      sphere radius
 * @param meridians   number of longitude lines (vertical half-circles, pole-to-pole)
 * @param parallels   number of latitude lines (horizontal full circles), excluding poles
 * @param segments    angular segments per line (smoothness)
 */
export function buildGlobeWireframe(
  radius: number,
  meridians: number,
  parallels: number,
  segments: number,
): THREE.BufferGeometry {
  const positions: number[] = [];

  // ----- Meridians (longitude half-circles) -----
  // For each meridian, sample `segments` points from north pole (phi=0)
  // to south pole (phi=π), then emit consecutive segment pairs.
  for (let m = 0; m < meridians; m++) {
    const theta = (m / meridians) * Math.PI * 2;
    const cosT = Math.cos(theta);
    const sinT = Math.sin(theta);
    let prevX = 0;
    let prevY = radius;
    let prevZ = 0;
    for (let i = 1; i <= segments; i++) {
      const phi = (i / segments) * Math.PI;
      const sinP = Math.sin(phi);
      const x = radius * sinP * cosT;
      const y = radius * Math.cos(phi);
      const z = radius * sinP * sinT;
      positions.push(prevX, prevY, prevZ, x, y, z);
      prevX = x;
      prevY = y;
      prevZ = z;
    }
  }

  // ----- Parallels (latitude circles) -----
  // Skip poles (i=0 and i=parallels+1). Each parallel is a closed loop.
  for (let p = 1; p <= parallels; p++) {
    const phi = (p / (parallels + 1)) * Math.PI;
    const sinP = Math.sin(phi);
    const y = radius * Math.cos(phi);
    const r = radius * sinP;
    let prevX = r;
    let prevZ = 0;
    for (let i = 1; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      const x = r * Math.cos(theta);
      const z = r * Math.sin(theta);
      positions.push(prevX, y, prevZ, x, y, z);
      prevX = x;
      prevZ = z;
    }
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );
  return geom;
}
