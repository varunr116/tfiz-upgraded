// ─── ui.js ────────────────────────────────────────────────────
// UI visibility toggle and experience hint overlay.
// ──────────────────────────────────────────────────────────────
import { state } from "./state.js"
import { $, btnToggleUI } from "./dom.js"

const UI_TOGGLEABLE = [
  "debug-hud", "controls", "exp-bar",
  "btn-flip", "cam-mode-pill", "btn-record",
]

export function setUIVisible(visible) {
  state.uiVisible = visible
  UI_TOGGLEABLE.forEach(id => {
    const el = $(id)
    if (!el) return
    if (visible) el.classList.remove("ui-hidden")
    else el.classList.add("ui-hidden")
  })
  btnToggleUI.textContent = visible ? "HIDE UI" : "SHOW UI"
  if (visible) btnToggleUI.classList.remove("ui-hidden-mode")
  else btnToggleUI.classList.add("ui-hidden-mode")
}

export function initUI() {
  btnToggleUI.addEventListener("click", () => setUIVisible(!state.uiVisible))
}

// ── Hint overlay ─────────────────────────────────────────────
let _hintTimeout = null

export function showHint(icon, text) {
  const overlay = $("hint-overlay")
  const iconEl = $("hint-icon")
  const textEl = $("hint-text")
  if (!overlay || !iconEl || !textEl) return

  // Reset any in-progress fade
  clearTimeout(_hintTimeout)
  overlay.classList.remove("hint-fade-out")
  overlay.style.opacity = ""

  iconEl.textContent = icon
  textEl.textContent = text

  // Show
  overlay.classList.remove("hint-hidden")

  // Fade out after 5 seconds
  _hintTimeout = setTimeout(() => {
    overlay.classList.add("hint-fade-out")
    // After CSS transition completes, fully hide
    setTimeout(() => overlay.classList.add("hint-hidden"), 600)
  }, 5000)
}