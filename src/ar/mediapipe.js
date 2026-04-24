// ─── mediapipe.js ─────────────────────────────────────────────
// MediaPipe Holistic init, throttled inference loop, onResults
// dispatcher, and FPS counter.
// ──────────────────────────────────────────────────────────────
import { isMobile, state, INFERENCE_INTERVAL_MS, _holisticReady, _lastInferenceTime, setHolisticReady, setLastInferenceTime } from "./state.js"
import { mpDot, mpStatus, fpsDot, fpsStatus, octx } from "./dom.js"
import { EXPERIENCES } from "./experiences/index.js"
import {
  runFaceDetection,
  updateWingPosition,
  compositeWings,
  compositeMask,
} from "./three-renderer.js"

// video element passed in from camera.js via initMediaPipe(video, expDeps)
let _video = null
let _expDeps = null

export function initMediaPipe(video, expDeps) {
  _video = video
  _expDeps = expDeps

  mpStatus.textContent = "HOLISTIC LOADING..."; mpDot.className = "hud-dot yellow"

  const holistic = new Holistic({
    locateFile: f => "https://cdn.jsdelivr.net/npm/@mediapipe/holistic/" + f,
  })
  holistic.setOptions({
    modelComplexity: isMobile ? 0 : 1,
    smoothLandmarks: true,
    enableSegmentation: true,
    smoothSegmentation: true,
    refineFaceLandmarks: false,
    minDetectionConfidence: isMobile ? 0.5 : 0.55,
    minTrackingConfidence: isMobile ? 0.4 : 0.5,
  })
  holistic.onResults(onResults)
  holistic.initialize()
    .then(() => {
      setHolisticReady(true)
      mpStatus.textContent = "HOLISTIC ✓"; mpDot.className = "hud-dot"
    })
    .catch(() => {
      mpStatus.textContent = "MP ERROR"; mpDot.className = "hud-dot red"
    })

  // ── Throttled inference loop ─────────────────────────────
  // Runs at full rAF speed but only sends a frame to Holistic
  // when elapsed time >= INFERENCE_INTERVAL_MS.
  // Rendering (~60fps) stays smooth while inference runs ~20-25fps.
  async function sendFrame(now) {
    requestAnimationFrame(sendFrame)
    if (!_holisticReady) return
    if (_video.readyState < 2 || _video.paused) return
    const elapsed = now - _lastInferenceTime
    if (elapsed < INFERENCE_INTERVAL_MS) return
    setLastInferenceTime(now)
    await holistic.send({ image: _video })
  }
  requestAnimationFrame(sendFrame)
}

// ── Results dispatcher ───────────────────────────────────────
function onResults(results) {
  tickFPS()
  const exp = EXPERIENCES[state.expIndex]
  const t = performance.now() / 1000

  if (exp.useFace) runFaceDetection(_video)
  if (exp.useWings) updateWingPosition(results.poseLandmarks || null)
  if (!exp.useKalki) compositeWings(results.segmentationMask || null, exp.useWings)
  compositeMask(!!exp.useMask)

  octx.clearRect(0, 0, state.screen.w, state.screen.h)
  exp.onFrame(results, octx, t, _expDeps)
}

// ── FPS counter ──────────────────────────────────────────────
function tickFPS() {
  state.fps.count = (state.fps.count || 0) + 1
  const now = performance.now(), el = now - state.fps.last
  if (el >= 1000) {
    const fps = Math.round((state.fps.count * 1000) / el)
    state.fps.count = 0; state.fps.last = now
    fpsStatus.textContent = "FPS " + fps
    fpsDot.className = "hud-dot " + (fps >= 25 ? "" : fps >= 15 ? "yellow" : "red")
  }
}
