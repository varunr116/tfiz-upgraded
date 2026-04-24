// ═══════════════════════════════════════════════════════════
// SHARED STATE
// ═══════════════════════════════════════════════════════════

export const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
    || (navigator.maxTouchPoints > 1 && window.innerWidth < 1024)

export const state = {
    started: false,
    screen: { w: 0, h: 0 },
    toScreen: null,
    fps: { count: 0, last: performance.now() },
    segDebug: false,
    expIndex: 0,
    wingPos: { pos: null, scale: 1, active: false },
    glbLoaded: false,
    faceLandmarker: null,
    faceLandmarkerReady: false,
    lastFaceMatrix: null,
    isFrontCamera: true,
    uiVisible: true,
}

// ── FPS THROTTLE: Holistic inference target ──────────────────
// We send frames to MediaPipe at max TARGET_INFERENCE_FPS.
// The Three.js render loop + canvas draws still run at full rAF speed.
export const TARGET_INFERENCE_FPS = isMobile ? 20 : 25
export const INFERENCE_INTERVAL_MS = 1000 / TARGET_INFERENCE_FPS

export let _lastInferenceTime = 0   // timestamp of last holistic.send()
export let _holisticReady = false // set true once holistic.initialize() resolves

// Setters — modules outside state.js call these to update the let exports
export function setLastInferenceTime(t) { _lastInferenceTime = t }
export function setHolisticReady(v) { _holisticReady = v }

// ── Utility ──────────────────────────────────────────────────
export function applyMobileShadow(ctx, color, blur) {
    ctx.shadowColor = color
    ctx.shadowBlur = isMobile ? Math.min(blur, 6) : blur
}