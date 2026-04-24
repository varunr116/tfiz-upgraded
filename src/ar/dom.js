// ─── dom.js ───────────────────────────────────────────────────
// Central store of all DOM element references and canvas contexts.
//
// REACT INTEGRATION NOTE:
// This file calls getElementById at module parse time.
// It is safe because ar-init.js uses dynamic import() —
// meaning this module only evaluates when initAR() is called,
// which happens 50ms after React has rendered all AR elements.
// ──────────────────────────────────────────────────────────────

export const $ = id => document.getElementById(id)

// ── Video + canvases ──────────────────────────────────────────
export const splash = $("splash")
export const video = $("video")
export const wingCanvas = $("wing-canvas")
export const wingCompCanvas = $("wing-comp-canvas")
export const personCanvas = $("person-canvas")
export const maskCanvas = $("mask-canvas")
export const maskCompCanvas = $("mask-comp-canvas")
export const overlayCanvas = $("overlay-canvas")
export const recordCanvas = $("record-canvas")

// ── 2D contexts ───────────────────────────────────────────────
export const wctx = wingCompCanvas.getContext("2d")
export const pctx = personCanvas.getContext("2d")
export const mctx = maskCompCanvas.getContext("2d")
export const octx = overlayCanvas.getContext("2d")
export const rctx = recordCanvas.getContext("2d")

// ── HUD dots + status labels ──────────────────────────────────
export const camDot = $("cam-dot")
export const camStatus = $("cam-status")
export const mpDot = $("mp-dot")
export const mpStatus = $("mp-status")
export const fpsDot = $("fps-dot")
export const fpsStatus = $("fps-status")
export const segDot = $("seg-dot")
export const segStatus = $("seg-status")
export const expDot = $("exp-dot")
export const expStatus = $("exp-status")
export const expNameEl = $("exp-name")

// ── QR gate elements ──────────────────────────────────────────
export const qrGate = $("qr-gate")
export const qrPreview = $("qr-preview")
export const qrCanvas = $("qr-canvas")
export const qrStatus = $("qr-status")
export const qrCtx = qrCanvas
  ? qrCanvas.getContext("2d", { willReadFrequently: true })
  : null

// ── Buttons ───────────────────────────────────────────────────
export const recBtn = $("btn-record")
export const recLabel = $("rec-label")
export const recTimer = $("rec-timer")
export const btnToggleUI = $("btn-toggle-ui")