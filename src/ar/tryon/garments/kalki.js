// ─── garments/kalki.js ────────────────────────────────────────
// Kalki suit — values ported exactly from garment-renderer-3d.js
//
// Original values:
//   rotation.y   = Math.PI / 2   (face toward camera)
//   yOffset      = 1.5           (fixed world-space vertical offset)
//   baseScale    = scaleX * 1.5
//   targetScaleX = baseScale * 1.2
//   targetScaleY = baseScale
//   targetScaleZ = baseScale * 0.3
//   lerpFactor   = 0.25
// ──────────────────────────────────────────────────────────────
export const KALKI = {
  name: "⚔️  Kalki",
  glb: `${import.meta.env.BASE_URL}kalki.glb`,      // place kalki.glb in repo root
  // place kalki.glb in repo root
  rotationX: 0,
  rotationY: -Math.PI / 2,  // face toward camera
  collarOffset: 1.5,              // fixed world-space Y offset (same as original yOffset)
  scale: 0.9,              // baseScale multiplier (1.0 = exact original values)
  lerpFactor: 0.25,             // smoother than batman's 0.2
}
