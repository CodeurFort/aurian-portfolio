import * as THREE from "three";

/**
 * Build a pyramid wireframe geometry — square base + 4 ascending edges to
 * the apex + N horizontal strate rings (visible levels).
 *
 * Returns a single BufferGeometry suitable for `THREE.LineSegments`.
 *
 * Coordinates: base square at y = -baseY, apex at y = +apexY.
 * The X/Z half-extent at the base equals `baseHalf`.
 */
export function buildLevelsPyramid(
  baseHalf: number,
  baseY: number,
  apexY: number,
  strates: number[],
): THREE.BufferGeometry {
  const positions: number[] = [];

  const yBase = -baseY;
  const yApex = apexY;
  const totalH = yApex - yBase;

  // 4 base corners (clockwise)
  const corners = [
    [-baseHalf, yBase, -baseHalf],
    [+baseHalf, yBase, -baseHalf],
    [+baseHalf, yBase, +baseHalf],
    [-baseHalf, yBase, +baseHalf],
  ] as const;
  const apex = [0, yApex, 0] as const;

  // ----- Base perimeter (4 edges) -----
  for (let i = 0; i < 4; i++) {
    const a = corners[i];
    const b = corners[(i + 1) % 4];
    positions.push(a[0], a[1], a[2], b[0], b[1], b[2]);
  }

  // ----- Ascending edges (corner → apex) -----
  for (let i = 0; i < 4; i++) {
    const a = corners[i];
    positions.push(a[0], a[1], a[2], apex[0], apex[1], apex[2]);
  }

  // ----- Horizontal strate rings -----
  // For each strate height, compute pyramid taper factor and emit a square.
  for (const y of strates) {
    if (y <= yBase || y >= yApex) continue;
    // Linear taper: size(y) = baseHalf * (yApex - y) / totalH
    const t = (yApex - y) / totalH;
    const half = baseHalf * t;
    const sCorners = [
      [-half, y, -half],
      [+half, y, -half],
      [+half, y, +half],
      [-half, y, +half],
    ] as const;
    for (let i = 0; i < 4; i++) {
      const a = sCorners[i];
      const b = sCorners[(i + 1) % 4];
      positions.push(a[0], a[1], a[2], b[0], b[1], b[2]);
    }
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );
  return geom;
}
