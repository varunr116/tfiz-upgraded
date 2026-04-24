// ─── tryon/tryon-switcher.js ──────────────────────────────────
// Horizontal garment picker — same visual style as exp-switcher.
// Renders inside #tryon-bar which lives in the tryon overlay.
// ──────────────────────────────────────────────────────────────

export class TryOnSwitcher {
  /**
   * @param {Array}    garments  — GARMENTS array from garments/index.js
   * @param {Function} onChange  — called with garment config on selection
   */
  constructor(garments, onChange) {
    this._garments  = garments
    this._onChange  = onChange
    this._current   = 0

    this._bar    = document.getElementById("tryon-bar")
    this._nameEl = document.getElementById("tryon-exp-name")
    this._dotsEl = document.getElementById("tryon-exp-dots")

    this._buildDots()
    this._bindSwipe()
    this._select(0, false)
  }

  // ── Public ───────────────────────────────────────────────

  current() { return this._garments[this._current] }

  // ── Private ──────────────────────────────────────────────

  _buildDots() {
    this._dotsEl.innerHTML = ""
    this._garments.forEach((_, i) => {
      const d = document.createElement("div")
      d.className = "tryon-dot" + (i === 0 ? " active" : "")
      d.addEventListener("click", () => this._select(i, true))
      this._dotsEl.appendChild(d)
    })
  }

  _select(idx, animate) {
    this._current = idx
    const g = this._garments[idx]
    this._nameEl.textContent = g.name

    // Update dots
    const dots = this._dotsEl.querySelectorAll(".tryon-dot")
    dots.forEach((d, i) => d.classList.toggle("active", i === idx))

    this._onChange(g)
  }

  _prev() {
    const n = (this._current - 1 + this._garments.length) % this._garments.length
    this._select(n, true)
  }

  _next() {
    const n = (this._current + 1) % this._garments.length
    this._select(n, true)
  }

  _bindSwipe() {
    // Arrow buttons
    document.getElementById("tryon-prev").addEventListener("click", () => this._prev())
    document.getElementById("tryon-next").addEventListener("click", () => this._next())

    // Touch swipe on the bar
    let startX = null
    this._bar.addEventListener("touchstart", e => { startX = e.touches[0].clientX }, { passive: true })
    this._bar.addEventListener("touchend", e => {
      if (startX === null) return
      const dx = e.changedTouches[0].clientX - startX
      if (Math.abs(dx) > 40) dx < 0 ? this._next() : this._prev()
      startX = null
    }, { passive: true })
  }
}
