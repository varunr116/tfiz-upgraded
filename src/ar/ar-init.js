// ─── ar-init.js ──────────────────────────────────────────────
// Entry point for SuperheroAR in the React/Vite integration.
// ALL imports are dynamic so dom.js only runs AFTER React renders.
// NOW INCLUDES: Unlock scanner initialization
// ──────────────────────────────────────────────────────────────

let _resizeHandler = null
let _splashHandler = null
let _flipHandler = null
let _segHandler = null
let _packageScanHandler = null

export async function initAR() {

  // ── Step 1: Dynamic imports ───────────────────────────────
  const dom = await import("./dom.js")
  const { initThree, initFaceLandmarker } = await import("./three-renderer.js")
  const { initSwitcher } = await import("./exp-switcher.js")
  const { setCameraExpDeps, startCamera, onResize, flipCamera } = await import("./camera.js")
  const { initUI } = await import("./ui.js")
  const { initTryOn } = await import("./tryon/tryon-mode.js")
  const { state } = await import("./state.js")
  const { $ } = dom

  // ✨ NEW: Import unlock system
  const { lockExperiences } = await import("./unlock/unlock-state.js")
  const { initUnlockScanner } = await import("./unlock/unlock-scanner.js")
  const { showUnlockOverlay } = await import("./unlock/unlock-ui.js")

  // ── Step 2: Reset state ───────────────────────────────────
  state.started = false
  state.uiVisible = true

  // ✨ NEW: Lock experiences on start
  lockExperiences()

  // ── Step 3: Build expDeps ─────────────────────────────────
  const expDeps = {
    expDot: dom.expDot,
    expStatus: dom.expStatus,
    expNameEl: dom.expNameEl,
    wctx: dom.wctx,
    mctx: dom.mctx,
    pctx: dom.pctx,
    octx: dom.octx,
    segDot: dom.segDot,
    segStatus: dom.segStatus,
  }

  // ── Step 4: Init Three.js ─────────────────────────────────
  initThree(expDeps)

  // ── Step 5: Init pipeline ─────────────────────────────────
  initSwitcher(expDeps)
  setCameraExpDeps(expDeps)
  initUI()
  initFaceLandmarker()

  // ── Step 6: Wire buttons ──────────────────────────────────
  // Flip camera
  const btnFlip = $("btn-flip")
  _flipHandler = () => flipCamera()
  if (btnFlip) btnFlip.addEventListener("click", _flipHandler)

  // Mask debug toggle
  const btnSeg = $("btn-seg")
  _segHandler = () => {
    state.segDebug = !state.segDebug
    if (btnSeg) btnSeg.textContent = "MASK DEBUG: " + (state.segDebug ? "ON" : "OFF")
  }
  if (btnSeg) btnSeg.addEventListener("click", _segHandler)

  // ── Step 6.5: Package Scan - Opens Netlify link ──────────
  const btnPackageScan = $("btn-package-scan")

  _packageScanHandler = () => {
    console.log('[AR] Opening Package AR in new tab...')
    window.open('https://charming-zuccutto-fbc791.netlify.app/', '_blank')
  }

  if (btnPackageScan) btnPackageScan.addEventListener("click", _packageScanHandler)

  // ── Step 7: Try-On mode ───────────────────────────────────
  initTryOn(dom.video)

  // ── Step 8: Resize handler ────────────────────────────────
  _resizeHandler = () => onResize()
  window.addEventListener("resize", _resizeHandler)

  // ── Step 9: Splash tap → start camera AND unlock scanner ──
  _splashHandler = async () => {
    // Start camera
    await startCamera("user")

    // ✨ NEW: Show unlock overlay and start scanner
    showUnlockOverlay()
    setTimeout(() => {
      initUnlockScanner(dom.video)
    }, 1000) // Delay 1 second to let camera start
  }

  dom.splash.addEventListener("click", _splashHandler)
  dom.splash.addEventListener("touchend", (e) => {
    e.preventDefault()
    _splashHandler()
  })

  console.log("[AR] initAR complete")
}

export async function destroyAR() {
  try {
    const { state } = await import("./state.js")

    // ✨ NEW: Stop unlock scanner
    const { stopUnlockScanner } = await import("./unlock/unlock-scanner.js")
    stopUnlockScanner()

    // Stop all camera streams
    const video = document.getElementById("video")
    if (video?.srcObject) {
      video.srcObject.getTracks().forEach(t => t.stop())
      video.srcObject = null
    }
    const qrPreview = document.getElementById("qr-preview")
    if (qrPreview?.srcObject) {
      qrPreview.srcObject.getTracks().forEach(t => t.stop())
      qrPreview.srcObject = null
    }

    // Remove event listeners
    if (_resizeHandler) { window.removeEventListener("resize", _resizeHandler); _resizeHandler = null }

    const splash = document.getElementById("splash")
    if (splash && _splashHandler) {
      splash.removeEventListener("click", _splashHandler)
      splash.removeEventListener("touchend", _splashHandler)
      _splashHandler = null
    }

    const btnFlip = document.getElementById("btn-flip")
    if (btnFlip && _flipHandler) { btnFlip.removeEventListener("click", _flipHandler); _flipHandler = null }

    const btnSeg = document.getElementById("btn-seg")
    if (btnSeg && _segHandler) { btnSeg.removeEventListener("click", _segHandler); _segHandler = null }

    const btnPackageScan = document.getElementById("btn-package-scan")
    if (btnPackageScan && _packageScanHandler) { btnPackageScan.removeEventListener("click", _packageScanHandler); _packageScanHandler = null }

    // Clear canvases
    const W = state.screen?.w || window.innerWidth
    const H = state.screen?.h || window.innerHeight
      ;["wing-comp-canvas", "person-canvas", "mask-comp-canvas", "overlay-canvas", "record-canvas"]
        .forEach(id => document.getElementById(id)?.getContext("2d")?.clearRect(0, 0, W, H))

    state.started = false

  } catch (e) {
    console.warn("[AR] destroyAR error:", e)
  }
  console.log("[AR] destroyAR complete")
}