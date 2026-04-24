// exp-hulk.js — Hulk Smash
// Green body tint overlay + muscle mass glow around shoulders/arms.
// Velocity detection on wrists: fast downward movement triggers
// a shockwave ring explosion from that hand.
import { state, isMobile, applyMobileShadow } from "../state.js"
import { POSE_IDX } from "../constants.js"

// Shockwave pool
const shockwaves = []

// Track previous wrist Y positions for velocity detection
let _prevLWristY = null, _prevRWristY = null
let _smashCooldown = 0

function triggerShockwave(x, y) {
  shockwaves.push({ x, y, r: 10, maxR: state.screen.h * 0.45, life: 1 })
}

function updateShockwaves() {
  for (let i = shockwaves.length - 1; i >= 0; i--) {
    const sw = shockwaves[i]
    sw.r    += (sw.maxR - sw.r) * 0.12
    sw.life -= 0.03
    if (sw.life <= 0) shockwaves.splice(i, 1)
  }
}

function drawShockwaves(ctx) {
  for (const sw of shockwaves) {
    const a = sw.life
    // Outer ring
    ctx.save()
    ctx.strokeStyle = `rgba(80,255,80,${(a * 0.9).toFixed(2)})`
    ctx.lineWidth   = 4 + (1 - sw.r / sw.maxR) * 8
    ctx.shadowColor = "#44ff44"
    ctx.shadowBlur  = isMobile ? 8 : 20
    ctx.beginPath()
    ctx.arc(sw.x, sw.y, sw.r, 0, Math.PI * 2)
    ctx.stroke()
    // Inner fainter ring
    if (sw.r > 30) {
      ctx.strokeStyle = `rgba(180,255,140,${(a * 0.4).toFixed(2)})`
      ctx.lineWidth   = 2
      ctx.shadowBlur  = 0
      ctx.beginPath()
      ctx.arc(sw.x, sw.y, sw.r * 0.65, 0, Math.PI * 2)
      ctx.stroke()
    }
    ctx.restore()
  }
}

function drawHulkGlow(ctx, pose, t) {
  if (!state.toScreen) return
  const ts    = state.toScreen
  const pulse = 0.6 + Math.sin(t * 2.5) * 0.25

  // Wide green aura on shoulders — gives "bigger" appearance
  const massPts = [
    { idx: POSE_IDX.L_SHOULDER, r: 55 },
    { idx: POSE_IDX.R_SHOULDER, r: 55 },
    { idx: POSE_IDX.L_ELBOW,    r: 38 },
    { idx: POSE_IDX.R_ELBOW,    r: 38 },
    { idx: POSE_IDX.L_WRIST,    r: 28 },
    { idx: POSE_IDX.R_WRIST,    r: 28 },
  ]
  ctx.save()
  ctx.shadowBlur = 0
  for (const pt of massPts) {
    if (!pose[pt.idx]) continue
    const p = ts(pose[pt.idx].x, pose[pt.idx].y)
    const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, pt.r * 2.5)
    g.addColorStop(0,   `rgba(60,255,80,${(pulse * 0.45).toFixed(2)})`)
    g.addColorStop(0.4, `rgba(30,180,40,${(pulse * 0.2).toFixed(2)})`)
    g.addColorStop(1,   "rgba(0,0,0,0)")
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(p.x, p.y, pt.r * 2.5, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}

function drawGreenTint(ctx, t) {
  // Full-screen green tint that pulses when smashing
  const W = state.screen.w, H = state.screen.h
  const rage = Math.max(0, ...(shockwaves.map(s => s.life)))
  const base = 0.08 + Math.sin(t * 1.8) * 0.02
  const boost = rage * 0.18
  ctx.fillStyle = `rgba(30,160,40,${(base + boost).toFixed(2)})`
  ctx.fillRect(0, 0, W, H)

  // Vignette-style green edge when raging
  if (rage > 0.3) {
    const vg = ctx.createRadialGradient(W/2, H/2, H*0.25, W/2, H/2, H*0.85)
    vg.addColorStop(0,   "rgba(0,0,0,0)")
    vg.addColorStop(1,   `rgba(0,100,10,${(rage * 0.35).toFixed(2)})`)
    ctx.fillStyle = vg
    ctx.fillRect(0, 0, W, H)
  }
}

export const EXP_HULK = {
  name: "💚  HULK SMASH", useWings: false, useMask: false, useFace: false,
  onFrame(results, ctx, t, deps) {
    const { expDot, expStatus } = deps
    const pose = results.poseLandmarks
    if (!pose || !state.toScreen) {
      expDot.className = "hud-dot off"; expStatus.textContent = "STAND IN FRAME"; return
    }

    const ts = state.toScreen

    // Velocity detection — smash when wrist drops fast
    if (_smashCooldown > 0) _smashCooldown--

    const lw = pose[POSE_IDX.L_WRIST], rw = pose[POSE_IDX.R_WRIST]
    const SMASH_THRESHOLD = 0.045   // normalised Y delta per frame

    if (lw && _prevLWristY !== null && _smashCooldown === 0) {
      const dy = lw.y - _prevLWristY
      if (dy > SMASH_THRESHOLD) {
        const p = ts(lw.x, lw.y)
        triggerShockwave(p.x, p.y)
        _smashCooldown = isMobile ? 18 : 12
      }
    }
    if (rw && _prevRWristY !== null && _smashCooldown === 0) {
      const dy = rw.y - _prevRWristY
      if (dy > SMASH_THRESHOLD) {
        const p = ts(rw.x, rw.y)
        triggerShockwave(p.x, p.y)
        _smashCooldown = isMobile ? 18 : 12
      }
    }
    _prevLWristY = lw ? lw.y : null
    _prevRWristY = rw ? rw.y : null

    updateShockwaves()

    // Draw layers
    drawGreenTint(ctx, t)
    drawHulkGlow(ctx, pose, t)
    drawShockwaves(ctx)

    expDot.className      = "hud-dot yellow"
    expStatus.textContent = "HULK " + (shockwaves.length > 0 ? "SMASH! 💥" : "READY")
  },
}
