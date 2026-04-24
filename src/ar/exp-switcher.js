// ─── exp-switcher.js ──────────────────────────────────────────
// iOS-style frosted glass swipe switcher.
// - Swipe left/right on the bottom bar to change experience
// - Velocity-aware: fast flick commits, slow drag can cancel
// - Position dots show where you are within the current category
// - Category label toasts in briefly when crossing a group boundary
// - NOW INCLUDES: Lock checking - prevents swiping until unlocked
// ──────────────────────────────────────────────────────────────
import { state } from "./state.js"
import { showHint } from "./ui.js"
import { EXPERIENCES } from "./experiences/index.js"

// ── Category definitions ─────────────────────────────────────
// Each entry lists the EXPERIENCES[] indices that belong to it.
// Order within each group = swipe order.
export const CATEGORIES = [
  {
    label: "BODY",
    icon: "🧍",
    indices: [0, 3, 9, 11, 13, 14, 17],
    // Wings, Iron Man, Lightning, X-Ray, Torch, Hulk, Plasma Vortex
  },
  {
    label: "HANDS",
    icon: "✋",
    indices: [1, 4, 5, 6, 7, 10, 12, 16],
    // Hand HUD, Thanos, Magic, Energy Ball, Repulsor, Web Shooter, Portal, Captain
  },
  {
    label: "FACE",
    icon: "😐",
    indices: [2, 8, 15],
    // Wolverine, Energy Eyes, Venom
  },
]

// Build a flat ordered list: [{expIndex, catIndex, posInCat}]
export const FLAT = []
CATEGORIES.forEach((cat, catIndex) => {
  cat.indices.forEach((expIndex, posInCat) => {
    FLAT.push({ expIndex, catIndex, posInCat })
  })
})

// ── State ────────────────────────────────────────────────────
let _flatPos = 0      // current position in FLAT
let _deps = null   // expDeps passed from main.js
let _onSwitch = null   // callback(expIndex) → called by index.js switchExperience

// Swipe tracking
let _touchStartX = 0
let _touchStartT = 0
let _dragging = false
let _dragOffset = 0      // px, live while dragging

// Category toast timer
let _catToastTimer = null

// ── DOM refs (set in initSwitcher) ───────────────────────────
let _bar, _nameEl, _dotsEl, _catToast

// ── Public API ───────────────────────────────────────────────

export function initSwitcher(deps) {
  _deps = deps
  _bar = document.getElementById("exp-bar")
  _nameEl = document.getElementById("exp-name")
  _dotsEl = document.getElementById("exp-dots")
  _catToast = document.getElementById("cat-toast")

  _bindSwipe()
  _render(false)
}

/** Jump directly to a flat index (used by main.js initial boot) */
export function goToFlat(flatPos, animate = false) {
  _flatPos = Math.max(0, Math.min(FLAT.length - 1, flatPos))
  _applyExperience(animate)
}

/** Called from index.js switchExperience when arrows were used (legacy) */
export function syncFromExpIndex(expIndex) {
  const idx = FLAT.findIndex(f => f.expIndex === expIndex)
  if (idx !== -1) { _flatPos = idx; _render(false) }
}

// ── Swipe binding ────────────────────────────────────────────
function _bindSwipe() {
  // Touch
  _bar.addEventListener("touchstart", _onTouchStart, { passive: true })
  _bar.addEventListener("touchmove", _onTouchMove, { passive: true })
  _bar.addEventListener("touchend", _onTouchEnd, { passive: true })
  _bar.addEventListener("touchcancel", _onTouchEnd, { passive: true })

  // Mouse (desktop testing)
  _bar.addEventListener("mousedown", e => _onTouchStart({ touches: [{ clientX: e.clientX }] }))
  window.addEventListener("mousemove", e => { if (_dragging) _onTouchMove({ touches: [{ clientX: e.clientX }] }) })
  window.addEventListener("mouseup", e => { if (_dragging) _onTouchEnd({ changedTouches: [{ clientX: e.clientX }] }) })
}

function _onTouchStart(e) {
  _touchStartX = e.touches[0].clientX
  _touchStartT = Date.now()
  _dragging = true
  _dragOffset = 0
  _bar.style.transition = "none"
}

function _onTouchMove(e) {
  if (!_dragging) return
  _dragOffset = e.touches[0].clientX - _touchStartX
  _applyDragTransform(_dragOffset)
}

async function _onTouchEnd(e) {
  if (!_dragging) return
  _dragging = false
  const endX = e.changedTouches[0].clientX
  const dx = endX - _touchStartX
  const dt = Date.now() - _touchStartT
  const velocity = Math.abs(dx) / dt   // px/ms
  const COMMIT_DIST = 60              // px
  const COMMIT_VEL = 0.3            // px/ms

  _bar.style.transition = ""

  if (dx < -COMMIT_DIST || (dx < -10 && velocity > COMMIT_VEL)) {
    // Swipe left → next
    await _navigate(+1)
  } else if (dx > COMMIT_DIST || (dx > 10 && velocity > COMMIT_VEL)) {
    // Swipe right → prev
    await _navigate(-1)
  } else {
    // Cancelled — snap back
    _resetDragTransform()
  }
  _dragOffset = 0
}

// ── Navigation ───────────────────────────────────────────────
async function _navigate(dir) {
  // ✨ NEW: Check if experiences are locked
  const { isUnlocked } = await import("./unlock/unlock-state.js")

  if (!isUnlocked()) {
    console.log('[Switcher] Experiences locked - cannot swipe 🔒')
    _resetDragTransform()

    // Show a subtle shake animation
    _bar.style.animation = 'none'
    requestAnimationFrame(() => {
      _bar.style.animation = 'exp-bar-shake 0.3s ease'
    })
    setTimeout(() => {
      _bar.style.animation = ''
    }, 300)

    return
  }

  const prevCat = FLAT[_flatPos].catIndex
  _flatPos = (_flatPos + dir + FLAT.length) % FLAT.length
  const newCat = FLAT[_flatPos].catIndex

  _applyExperience(true, dir)

  // Show category toast if crossing a boundary
  if (newCat !== prevCat) _showCatToast(CATEGORIES[newCat])
}

function _applyExperience(animate, dir = 0) {
  const { expIndex } = FLAT[_flatPos]
  const exp = EXPERIENCES[expIndex]

  // Tell the experience system to switch
  _switchExpByIndex(expIndex)

  // Animate name slide
  if (animate && dir !== 0) {
    _nameEl.style.transition = "none"
    _nameEl.style.transform = `translateX(${dir > 0 ? "40px" : "-40px"})`
    _nameEl.style.opacity = "0"
    requestAnimationFrame(() => {
      _nameEl.style.transition = "transform 0.22s cubic-bezier(0.22,1,0.36,1), opacity 0.18s ease"
      _nameEl.style.transform = "translateX(0)"
      _nameEl.style.opacity = "1"
    })
  }

  _nameEl.textContent = exp.name

  _render(false)

  // Show hint
  if (exp.hint) showHint(exp.hint.icon, exp.hint.text)
}

function _applyDragTransform(dx) {
  // Rubber-band resistance at edges
  const atStart = _flatPos === 0
  const atEnd = _flatPos === FLAT.length - 1
  let effectiveDx = dx
  if ((dx > 0 && atStart) || (dx < 0 && atEnd)) {
    effectiveDx = dx * 0.25  // resist
  }
  _nameEl.style.transition = "none"
  _nameEl.style.transform = `translateX(${effectiveDx * 0.45}px)`
  _nameEl.style.opacity = `${Math.max(0.3, 1 - Math.abs(effectiveDx) / 180)}`
}

function _resetDragTransform() {
  _nameEl.style.transition = "transform 0.3s cubic-bezier(0.34,1.56,0.64,1), opacity 0.2s ease"
  _nameEl.style.transform = "translateX(0)"
  _nameEl.style.opacity = "1"
}

// ── Category toast ───────────────────────────────────────────
function _showCatToast(cat) {
  if (!_catToast) return
  clearTimeout(_catToastTimer)
  _catToast.textContent = cat.icon + "  " + cat.label
  _catToast.classList.remove("cat-toast-hidden", "cat-toast-fade")
  _catToastTimer = setTimeout(() => {
    _catToast.classList.add("cat-toast-fade")
    setTimeout(() => _catToast.classList.add("cat-toast-hidden"), 500)
  }, 1500)
}

// ── Dots render ──────────────────────────────────────────────
function _render() {
  const { catIndex, posInCat } = FLAT[_flatPos]
  const cat = CATEGORIES[catIndex]
  const total = cat.indices.length

  // Rebuild dots
  _dotsEl.innerHTML = ""
  for (let i = 0; i < total; i++) {
    const d = document.createElement("span")
    d.className = "exp-dot" + (i === posInCat ? " exp-dot-active" : "")
    _dotsEl.appendChild(d)
  }
}

// ── Experience switch (mirrors old switchExperience logic) ───
function _switchExpByIndex(targetExpIndex) {
  if (!_deps) return
  const { wingGroup, kalkiGroup, wctx, mctx } = _deps
  const mandalaGroup = _deps.mandalaGroup || null
  state.expIndex = targetExpIndex
  const exp = EXPERIENCES[targetExpIndex]

  if (!exp.useWings && !exp.useKalki) {
    if (wingGroup) wingGroup.visible = false
    if (kalkiGroup) kalkiGroup.visible = false
    wctx.clearRect(0, 0, state.screen.w, state.screen.h)
  }
  // Always hide mandala when switching to any other experience
  if (mandalaGroup) mandalaGroup.visible = false
  if (exp.useWings && !exp.useKalki) { if (kalkiGroup) kalkiGroup.visible = false }
  if (exp.useKalki && !exp.useWings) { if (wingGroup) wingGroup.visible = false }
  if (!exp.useMask) {
    if (_deps.maskGroup) _deps.maskGroup.visible = false
    mctx.clearRect(0, 0, state.screen.w, state.screen.h)
  }

  state.wingPos.active = false
  if (_deps.kalkiSmooth) _deps.kalkiSmooth.active = false
  state.lastFaceMatrix = null
  state._lastEnergyPos = null

  // Reset repulsor if needed
  const { EXP_REPULSOR } = EXPERIENCES
  if (exp.reset) exp.reset()
}