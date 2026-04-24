// ─── garments/batman.js ───────────────────────────────────────
// Add a new garment = copy this file, change the values, then
// import + add to garments/index.js  — that's it.
// ──────────────────────────────────────────────────────────────
export const BATMAN = {
  name: "🦇 Batman",
  glb: `${import.meta.env.BASE_URL}batman.glb`,
  scale: 1.5,                // uniform scale multiplier on top of auto-fit
  offsetY: 0,               // push up (+) or down (-) in world units
  offsetZ: -5,                // depth offset (leave 0 normally)
}
