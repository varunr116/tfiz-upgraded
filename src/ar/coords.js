// ─── coords.js ────────────────────────────────────────────────
// Coordinate mapping helpers used by experiences and renderers.
// No DOM deps — pure math.
// ──────────────────────────────────────────────────────────────
import { state } from "./state.js"

/**
 * Returns a mapper fn: (nx, ny, mirror?) => {x, y} in CSS pixels.
 * Accounts for aspect-ratio letterboxing between video and canvas.
 */
export function buildCoordMapper(vw, vh, cw, ch) {
  const va = vw / vh, ca = cw / ch
  let sx, sy, ox, oy
  if (va > ca) { sy = ch; sx = ch * va; ox = (cw - sx) / 2; oy = 0 }
  else         { sx = cw; sy = cw / va; ox = 0; oy = (ch - sy) / 2 }
  return (nx, ny, mirror = state.isFrontCamera) => ({
    x: ox + (mirror ? 1 - nx : nx) * sx,
    y: oy + ny * sy,
  })
}

/**
 * Unprojects a normalised screen point into Three.js world space
 * at the given depth along the camera ray.
 */
export function screenToWorld(nx, ny, depth, cam) {
  // Import THREE lazily to avoid hard dep at module parse time
  const THREE = window.THREE
  const v = new THREE.Vector3((1 - nx) * 2 - 1, -(ny * 2 - 1), 0.5)
  v.unproject(cam)
  return cam.position.clone().add(
    v.sub(cam.position).normalize().multiplyScalar(depth)
  )
}

/**
 * Average a set of face landmarks by index.
 */
export function faceAvg(face, indices) {
  let x = 0, y = 0, z = 0
  for (const i of indices) { x += face[i].x; y += face[i].y; z += face[i].z || 0 }
  return { x: x / indices.length, y: y / indices.length, z: z / indices.length }
}
