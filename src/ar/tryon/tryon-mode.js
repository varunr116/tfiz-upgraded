// ─── tryon/tryon-mode.js ─────────────────────────────────────
// Try-On mode controller.
// ──────────────────────────────────────────────────────────────
import { GARMENTS } from "./garments/index.js"
import { TryOnRenderer } from "./tryon-renderer.js"
import { TryOnSwitcher } from "./tryon-switcher.js"

const VISION_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/vision_bundle.mjs"
const MODEL_URL = "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task"
const WASM_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm"

// ── State ─────────────────────────────────────────────────────
let _overlay = null
let _video = null
let _feedCanvas = null   // layer 1: mirrored camera feed
let _feedCtx = null
let _threeCanvas = null   // layer 2: Three.js garment (transparent)
let _segCanvas = null   // layer 3: segmentation occluder
let _segCtx = null
let _renderer = null
let _switcher = null
let _landmarker = null
let _loopId = null
let _lastVideoTs = -1
let _lastLms = null
let _latestSegMask = null  // fed from mediapipe.js via tryOnNotifySegMask()
let _active = false
let _W = 0, _H = 0
let _hipsVisible = true   // for "step back" prompt

// ── Called from mediapipe.js every Holistic frame ─────────────
// This is the ONLY entry point from the main AR pipeline.
// Pure assignment — zero cost when try-on is not active.
export function tryOnNotifySegMask(mask) {
  if (!_active) return
  _latestSegMask = mask
}

// ── Init ──────────────────────────────────────────────────────
export async function initTryOn(sharedVideo) {
  _video = sharedVideo
  _buildDOM()
  _bindEntryButton()
  _loadLandmarker().catch(e => console.warn("[TryOn] landmarker preload failed:", e))
}

// ── Button wiring ─────────────────────────────────────────────
function _bindEntryButton() {
  document.getElementById("btn-tryon").addEventListener("click", _open)
  document.getElementById("tryon-back").addEventListener("click", _close)
}

// ── Open / Close ──────────────────────────────────────────────
function _open() {
  _active = true
  _overlay.classList.remove("tryon-hidden")

  _W = window.innerWidth
  _H = window.innerHeight

  _feedCanvas.width = _W; _feedCanvas.height = _H
  _threeCanvas.width = _W; _threeCanvas.height = _H
  _segCanvas.width = _W; _segCanvas.height = _H

  if (!_renderer) {
    _renderer = new TryOnRenderer(_threeCanvas, _W, _H)
  }

  if (!_switcher) {
    _switcher = new TryOnSwitcher(GARMENTS, _onGarmentSelected)
  } else {
    _onGarmentSelected(_switcher.current())
  }

  _startLoop()
}

function _close() {
  _active = false
  _latestSegMask = null
  _overlay.classList.add("tryon-hidden")
  if (_renderer) _renderer.setActive(false)
  cancelAnimationFrame(_loopId)
}

// ── Garment selected ─────────────────────────────────────────
function _onGarmentSelected(garment) {
  if (!_renderer) return
  _renderer.setActive(false)
  _renderer.loadGarment(garment)
}

// ── Render loop ───────────────────────────────────────────────
function _startLoop() {
  const loop = () => {
    if (!_active) return
    _loopId = requestAnimationFrame(loop)
    _tick()
  }
  _loopId = requestAnimationFrame(loop)
}

function _tick() {
  if (!_video || _video.readyState < 2) return

  // ── 1. Mirrored camera feed ───────────────────────────────
  _feedCtx.save()
  _feedCtx.translate(_W, 0)
  _feedCtx.scale(-1, 1)
  _feedCtx.drawImage(_video, 0, 0, _W, _H)
  _feedCtx.restore()

  // ── 2. Pose detection ─────────────────────────────────────
  const lms = _detectPose()
  const ml = lms ? lms.map(lm => ({ ...lm, x: 1 - lm.x })) : null

  // ── 3. Hip visibility check → step-back prompt ───────────
  const lh = lms?.[23], rh = lms?.[24]
  _hipsVisible = !!(lh && rh && (lh.visibility ?? 1) > 0.3 && (rh.visibility ?? 1) > 0.3)
  const prompt = document.getElementById("tryon-prompt")
  if (prompt) prompt.classList.toggle("tryon-hidden", _hipsVisible || !ml)

  // ── 4. Auto-activate renderer ─────────────────────────────
  if (_renderer && _renderer.hasModel() && ml) {
    _renderer.setActive(true)
  }

  // ── 5. Update Three.js garment ────────────────────────────
  if (_renderer) _renderer.update(ml, lms)   // pass raw lms for worldLandmarks Z

  // ── 6. Segmentation occluder ──────────────────────────────
  // Goal: garment appears on body, but arms/hands appear IN FRONT.
  // Technique:
  //   a) Draw garment (Three.js canvas)
  //   b) Draw person pixels on top using source-in with seg mask
  //      so only the person silhouette region gets painted over
  _segCtx.clearRect(0, 0, _W, _H)

  if (_renderer?.isActive()) {
    // Step 1 — draw the garment
    _segCtx.drawImage(_threeCanvas, 0, 0, _W, _H)

    if (_latestSegMask) {
      // Step 2 — paint person pixels on top only where seg mask says "person"
      // Use a temp offscreen approach:
      //   a) draw seg mask
      //   b) source-in with camera feed → gives only person pixels
      //   c) draw that on top of garment

      // Draw mirrored camera feed clipped to person silhouette
      _segCtx.save()
      // First draw the seg mask as a clipping stencil
      _segCtx.globalCompositeOperation = "destination-out"
      // We want to KEEP garment where there is NO person
      // and show camera feed where there IS person
      // So: draw person-shaped camera pixels on top (source-over after clearing person area)
      _segCtx.translate(_W, 0)
      _segCtx.scale(-1, 1)
      _segCtx.drawImage(_latestSegMask, 0, 0, _W, _H)
      _segCtx.restore()

      // Now the garment has a person-shaped hole.
      // Fill that hole with the actual camera feed (person pixels).
      _segCtx.save()
      _segCtx.globalCompositeOperation = "destination-over"
      _segCtx.translate(_W, 0)
      _segCtx.scale(-1, 1)
      _segCtx.drawImage(_video, 0, 0, _W, _H)
      _segCtx.restore()
      _segCtx.globalCompositeOperation = "source-over"
    }
  }
}

// ── Pose detection ────────────────────────────────────────────
async function _loadLandmarker() {
  const { FilesetResolver, PoseLandmarker } = await import(VISION_URL)
  const vision = await FilesetResolver.forVisionTasks(WASM_URL)
  _landmarker = await PoseLandmarker.createFromOptions(vision, {
    baseOptions: { modelAssetPath: MODEL_URL, delegate: "GPU" },
    runningMode: "VIDEO",
    numPoses: 1,
    minPoseDetectionConfidence: 0.5,
    minPosePresenceConfidence: 0.5,
    minTrackingConfidence: 0.5,
  })
  console.log("[TryOn] PoseLandmarker ready")
}

function _detectPose() {
  if (!_landmarker) return null
  if (_video.currentTime === _lastVideoTs) return _lastLms
  _lastVideoTs = _video.currentTime
  const result = _landmarker.detectForVideo(_video, performance.now())
  _lastLms = result?.landmarks?.[0] ?? null
  return _lastLms
}

// ── DOM builder ───────────────────────────────────────────────
function _buildDOM() {
  const div = document.createElement("div")
  div.id = "tryon-overlay"; div.className = "tryon-hidden"
  div.innerHTML = `
    <!-- Layer 1: mirrored camera feed -->
    <canvas id="tryon-feed-canvas"></canvas>

    <!-- Layer 2: Three.js garment (transparent bg) — hidden, used as source -->
    <canvas id="tryon-canvas" style="display:none"></canvas>

    <!-- Layer 3: composited result (garment + seg occluder) -->
    <canvas id="tryon-seg-canvas"></canvas>

    <!-- Back button -->
    <button id="tryon-back" class="tryon-back-btn">← BACK</button>

    <!-- Step-back prompt -->
    <div id="tryon-prompt" class="tryon-hidden">
      <span>Step back so your full body is visible</span>
    </div>

    <!-- Garment switcher bar -->
    <div id="tryon-bar">
      <button id="tryon-prev" class="tryon-arrow">‹</button>
      <div id="tryon-bar-centre">
        <div id="tryon-exp-name">Loading…</div>
        <div id="tryon-exp-dots"></div>
      </div>
      <button id="tryon-next" class="tryon-arrow">›</button>
    </div>
  `
  document.body.appendChild(div)

  _overlay = div
  _feedCanvas = div.querySelector("#tryon-feed-canvas")
  _feedCtx = _feedCanvas.getContext("2d")
  _threeCanvas = div.querySelector("#tryon-canvas")
  _segCanvas = div.querySelector("#tryon-seg-canvas")
  _segCtx = _segCanvas.getContext("2d")
}