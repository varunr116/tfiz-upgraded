// exp-captain.js — Captain America
// A vibranium shield tracks the dominant (most visible) hand.
// Shield tilts to match hand orientation.
// Stars + concentric rings + metallic sheen rendered in canvas 2D.
import { state, isMobile, applyMobileShadow } from "../state.js"
import { HAND_IDX } from "../constants.js"

// Smooth shield position
const smooth = { x: null, y: null, r: null, angle: null, active: false }

function drawShield(ctx, cx, cy, R, tilt, t) {
  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate(tilt)

  const RINGS = [
    { frac: 1.00, color: "#1a3fa8", dark: "#0d2470" },  // outer blue
    { frac: 0.78, color: "#c8c8c8", dark: "#888"    },  // silver
    { frac: 0.60, color: "#c8141e", dark: "#7a0a10" },  // red
    { frac: 0.38, color: "#c8c8c8", dark: "#888"    },  // silver inner
    { frac: 0.20, color: "#1a3fa8", dark: "#0d2470" },  // blue centre
  ]

  // ── Rings ────────────────────────────────────────────────
  for (const ring of RINGS) {
    const rr = R * ring.frac
    // Metallic radial gradient for each ring
    const grad = ctx.createRadialGradient(-rr*0.3, -rr*0.3, 0, 0, 0, rr)
    grad.addColorStop(0,   ring.color)
    grad.addColorStop(0.55, ring.dark)
    grad.addColorStop(1,   shadeHex(ring.dark, -30))
    ctx.fillStyle = grad
    ctx.shadowBlur = 0
    ctx.beginPath()
    ctx.arc(0, 0, rr, 0, Math.PI * 2)
    ctx.fill()

    // Rim highlight
    ctx.strokeStyle = `rgba(255,255,255,0.18)`
    ctx.lineWidth   = Math.max(1, rr * 0.03)
    ctx.beginPath()
    ctx.arc(0, 0, rr - ctx.lineWidth * 0.5, 0, Math.PI * 2)
    ctx.stroke()
  }

  // ── Star ─────────────────────────────────────────────────
  const starR = R * 0.17
  ctx.fillStyle   = "#e8e8e8"
  ctx.shadowColor = "rgba(200,220,255,0.5)"
  ctx.shadowBlur  = isMobile ? 4 : 10
  ctx.beginPath()
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2
    const r = i % 2 === 0 ? starR : starR * 0.42
    if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r)
    else         ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r)
  }
  ctx.closePath()
  ctx.fill()

  // ── Glare sweep — white arc rotating across surface ──────
  ctx.shadowBlur  = 0
  const glareA    = t * 0.6
  const glareG    = ctx.createLinearGradient(
    Math.cos(glareA) * R * 0.8, Math.sin(glareA) * R * 0.8,
    Math.cos(glareA + Math.PI) * R * 0.3, Math.sin(glareA + Math.PI) * R * 0.3,
  )
  glareG.addColorStop(0,   "rgba(255,255,255,0)")
  glareG.addColorStop(0.45, "rgba(255,255,255,0.18)")
  glareG.addColorStop(0.55, "rgba(255,255,255,0.22)")
  glareG.addColorStop(1,   "rgba(255,255,255,0)")
  ctx.fillStyle = glareG
  ctx.beginPath()
  ctx.arc(0, 0, R, 0, Math.PI * 2)
  ctx.fill()

  // ── Edge shadow ──────────────────────────────────────────
  const edgeG = ctx.createRadialGradient(0, 0, R * 0.75, 0, 0, R)
  edgeG.addColorStop(0, "rgba(0,0,0,0)")
  edgeG.addColorStop(1, "rgba(0,0,0,0.45)")
  ctx.fillStyle = edgeG
  ctx.beginPath()
  ctx.arc(0, 0, R, 0, Math.PI * 2)
  ctx.fill()

  ctx.restore()
}

// Simple hex darkening helper
function shadeHex(hex, amount) {
  const n = parseInt(hex.replace("#",""), 16)
  const r = Math.max(0, ((n>>16)&0xff) + amount)
  const g = Math.max(0, ((n>>8)&0xff)  + amount)
  const b = Math.max(0, (n&0xff)        + amount)
  return `rgb(${r},${g},${b})`
}

function getHandMetrics(hand) {
  if (!hand || !state.toScreen) return null
  const ts     = state.toScreen
  const wrist  = ts(hand[HAND_IDX.WRIST].x,       hand[HAND_IDX.WRIST].y)
  const palm   = ts(hand[HAND_IDX.MIDDLE_MCP].x,  hand[HAND_IDX.MIDDLE_MCP].y)
  const midTip = ts(hand[HAND_IDX.MIDDLE_TIP].x,  hand[HAND_IDX.MIDDLE_TIP].y)
  const handLen = Math.hypot(midTip.x - wrist.x, midTip.y - wrist.y)
  if (handLen < 30) return null
  // Angle from wrist to middle fingertip
  const angle = Math.atan2(midTip.y - wrist.y, midTip.x - wrist.x) - Math.PI / 2
  return { cx: palm.x, cy: palm.y, R: handLen * 1.05, angle }
}

export const EXP_CAPTAIN = {
  name: "🛡️  CAPTAIN AMERICA", useWings: false, useMask: false, useFace: false,
  onFrame(results, ctx, t, deps) {
    const { expDot, expStatus } = deps
    const lh = results.leftHandLandmarks
    const rh = results.rightHandLandmarks

    if (!lh && !rh) {
      expDot.className = "hud-dot off"; expStatus.textContent = "RAISE A HAND"; return
    }

    // Pick dominant hand — prefer right, fall back to left
    const metrics = getHandMetrics(rh) || getHandMetrics(lh)
    if (!metrics) {
      expDot.className = "hud-dot off"; expStatus.textContent = "SHOW HAND"; return
    }

    const { cx, cy, R, angle } = metrics

    // Smooth position + size
    const LERP = 0.18
    if (!smooth.active) {
      smooth.x = cx; smooth.y = cy; smooth.r = R; smooth.angle = angle; smooth.active = true
    } else {
      smooth.x     += (cx    - smooth.x)     * LERP
      smooth.y     += (cy    - smooth.y)     * LERP
      smooth.r     += (R     - smooth.r)     * LERP
      // Angle lerp — handle wrap-around
      let da = angle - smooth.angle
      if (da >  Math.PI) da -= Math.PI * 2
      if (da < -Math.PI) da += Math.PI * 2
      smooth.angle += da * LERP
    }

    // Draw drop shadow first
    ctx.save()
    ctx.shadowColor = "rgba(0,0,50,0.55)"
    ctx.shadowBlur  = isMobile ? 10 : 22
    ctx.shadowOffsetX = smooth.r * 0.06
    ctx.shadowOffsetY = smooth.r * 0.09
    ctx.beginPath()
    ctx.arc(smooth.x, smooth.y, smooth.r, 0, Math.PI * 2)
    ctx.fillStyle = "rgba(0,0,0,0.01)" // near-invisible fill just to cast shadow
    ctx.fill()
    ctx.restore()

    drawShield(ctx, smooth.x, smooth.y, smooth.r, smooth.angle, t)

    expDot.className      = "hud-dot yellow"
    expStatus.textContent = "SHIELD " + (rh ? "R✓" : "L✓")
  },
}
