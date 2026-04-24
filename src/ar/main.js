// ─── main.js ──────────────────────────────────────────────────
// Boot entry point. Imports all modules and wires them together.
// HTML shell loads only: <script type="module" src="src/ar/main.js">
// ──────────────────────────────────────────────────────────────
import { state } from "./state.js"
import { initUI } from "./ui.js"
import { initRecording } from "./recording.js"

import { initThree, initFaceLandmarker } from "./three-renderer.js"
import { onResize, startCamera, flipCamera, setCameraExpDeps } from "./camera.js"
import { initSwitcher, goToFlat } from "./exp-switcher.js"
import {
  splash, video,
  expDot, expStatus, expNameEl,
  wctx, mctx, pctx, $,
} from "./dom.js"

// ── expDeps ──────────────────────────────────────────────────
const expDeps = {
  expDot,
  expStatus,
  expNameEl,
  wctx,
  mctx,
  wingGroup: null,
  kalkiGroup: null,
  maskGroup: null,
  kalkiLoaded: false,
  kalkiSmooth: null,
  driveKalkiBones: null,
  updateKalkiRoot: null,
  updateWingPosition: null,
  compositeWings: null,
  applyFaceMatrix: null,
}

// ── Boot ─────────────────────────────────────────────────────
function init() {
  setCameraExpDeps(expDeps)
  

  initThree(expDeps)
  onResize()
  window.addEventListener("resize", onResize)

  video.classList.add("mirror")

  // iOS glass swipe switcher — replaces old btn-prev / btn-next
  initSwitcher(expDeps)
  goToFlat(0)   // start on first experience (Kalki Suit)

  initUI()
  initRecording()

  $("btn-flip").addEventListener("click", flipCamera)

  $("btn-seg").addEventListener("click", () => {
    state.segDebug = !state.segDebug
    $("btn-seg").textContent = "MASK DEBUG: " + (state.segDebug ? "ON" : "OFF")
    if (!state.segDebug) pctx.clearRect(0, 0, state.screen.w, state.screen.h)
  })

  initFaceLandmarker()

  splash.addEventListener("click", () => {
    splash.classList.add("hidden")
    startCamera("user")  // ← Changed
  })
  splash.addEventListener("touchend", e => {
    e.preventDefault()
    splash.classList.add("hidden")
    startCamera("user")  // ← Changed
  })
  if (!/iPad|iPhone|iPod/.test(navigator.userAgent)) {
    setTimeout(() => {
      splash.classList.add("hidden")
      startCamera("user")  // ← Changed
    }, 300)
  }
}

init()