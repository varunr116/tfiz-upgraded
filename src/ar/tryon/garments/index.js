// ─── garments/index.js ───────────────────────────────────────
// Central garment registry.
// To add a new garment:
//   1. Create garments/yourname.js  (copy batman.js as template)
//   2. Import it below
//   3. Add it to the GARMENTS array
// ──────────────────────────────────────────────────────────────
import { BATMAN } from "./batman.js"
import { KALKI } from "./kalki.js"
// import { IRONMAN }   from "./ironman.js"   // ← uncomment to add
// import { SPIDERMAN } from "./spiderman.js"

export const GARMENTS = [
  BATMAN,
  KALKI,
  // IRONMAN,
  // SPIDERMAN,
]