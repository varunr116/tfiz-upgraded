// ─── camera.js ────────────────────────────────────────────────
// Camera start/flip and canvas resize handler.
// ──────────────────────────────────────────────────────────────
import { isMobile, state } from "./state.js"
import { buildCoordMapper } from "./coords.js"
import {
  splash, video,
  wingCompCanvas, personCanvas, maskCompCanvas, overlayCanvas, recordCanvas,
  wctx, pctx, mctx, octx,
  camDot, camStatus, $,
} from "./dom.js"
import { initMediaPipe } from "./mediapipe.js"
import { resizeRenderers } from "./three-renderer.js"

let _expDeps = null

export function setCameraExpDeps(expDeps) {
  _expDeps = expDeps
}

export async function startCamera(facingMode = "user") {
  if (state.started) return
  state.started = true
  splash.classList.add("hidden")
  state.isFrontCamera = facingMode === "user"

  if (state.isFrontCamera) video.classList.add("mirror")
  else video.classList.remove("mirror")

  const modePill = document.getElementById("cam-mode-pill")
  if (modePill) modePill.textContent = state.isFrontCamera ? "FRONT" : "BACK"

  try {
    const camW = isMobile ? 640 : 1280
    const camH = isMobile ? 480 : 720
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode, width: { ideal: camW }, height: { ideal: camH } },
      audio: false,
    })
    video.srcObject = stream
    await new Promise((res, rej) => { video.onloadedmetadata = res; video.onerror = rej })
    await video.play()
    onResize()
    state.toScreen = buildCoordMapper(video.videoWidth, video.videoHeight, state.screen.w, state.screen.h)
    camDot.className = "hud-dot"
    camStatus.textContent = "CAM ✓ " + (state.isFrontCamera ? "FRONT" : "BACK") +
      " " + video.videoWidth + "×" + video.videoHeight
    if (isMobile) {
      const perfPill = document.getElementById("perf-pill")
      if (perfPill) perfPill.style.display = "flex"
    }
    initMediaPipe(video, _expDeps)
  } catch (err) {
    camDot.className = "hud-dot red"
    camStatus.textContent = "CAM ERROR: " + err.name
    splash.classList.remove("hidden")
    state.started = false
  }
}

export async function flipCamera() {
  if (!state.started) return
  const newFacing = state.isFrontCamera ? "environment" : "user"
  if (video.srcObject) { video.srcObject.getTracks().forEach(t => t.stop()); video.srcObject = null }
  state.started = false
  const W = state.screen.w, H = state.screen.h
    ;[wctx, pctx, mctx, octx].forEach(c => c.clearRect(0, 0, W, H))
  await startCamera(newFacing)
}

export function onResize() {
  const w = window.innerWidth
  const h = window.innerHeight
  const rawDpr = window.devicePixelRatio || 1
  const dpr = isMobile ? Math.min(rawDpr, 1.5) : rawDpr

  resizeRenderers(w, h, dpr)

    ;[wingCompCanvas, personCanvas, maskCompCanvas, overlayCanvas].forEach(c => {
      c.width = w * dpr
      c.height = h * dpr
      c.style.width = w + "px"
      c.style.height = h + "px"
    })

  // Record canvas stays at logical resolution (no DPR scaling needed)
  recordCanvas.width = w
  recordCanvas.height = h
  recordCanvas.style.width = w + "px"
  recordCanvas.style.height = h + "px"

  wctx.scale(dpr, dpr)
  pctx.scale(dpr, dpr)
  mctx.scale(dpr, dpr)
  octx.scale(dpr, dpr)

  state.screen.w = w
  state.screen.h = h

  if (video.videoWidth && video.videoHeight)
    state.toScreen = buildCoordMapper(video.videoWidth, video.videoHeight, w, h)
}
