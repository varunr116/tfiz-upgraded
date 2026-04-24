// exp-venom.js — Venom
// Black liquid tendrils spread from shoulders along arms using pose.
// White symbiote eye streaks appear over face using face landmarks.
// Screen edges darken with black symbiote creep.
import { state, isMobile, applyMobileShadow } from "../state.js"
import { POSE_IDX, FACE_IDX } from "../constants.js"

// Tendril system — each tendril is a chain of points
const tendrils = []
const MAX_TENDRILS = isMobile ? 8 : 18

function spawnTendril(x, y, angle) {
  if (tendrils.length >= MAX_TENDRILS) return
  const segs  = isMobile ? 5 : 9
  const pts   = [{ x, y }]
  for (let i = 1; i <= segs; i++) {
    const jitter = (Math.random() - 0.5) * 30
    pts.push({
      x: x + Math.cos(angle + jitter * 0.04) * i * (15 + Math.random() * 12),
      y: y + Math.sin(angle + jitter * 0.04) * i * (15 + Math.random() * 12) - i * 4,
    })
  }
  tendrils.push({ pts, life: 1, decay: 0.018 + Math.random() * 0.014, width: 4 + Math.random() * 5 })
}

function updateTendrils() {
  for (let i = tendrils.length - 1; i >= 0; i--) {
    const td = tendrils[i]
    td.life -= td.decay
    // Writhe — wiggle each point slightly
    for (let j = 1; j < td.pts.length; j++) {
      td.pts[j].x += (Math.random() - 0.5) * 2.5
      td.pts[j].y += (Math.random() - 0.5) * 1.8 - 0.4
    }
    if (td.life <= 0) tendrils.splice(i, 1)
  }
}

function drawTendrils(ctx) {
  for (const td of tendrils) {
    if (td.pts.length < 2) continue
    ctx.save()
    ctx.strokeStyle = `rgba(10,10,15,${(td.life * 0.92).toFixed(2)})`
    ctx.lineWidth   = td.width * td.life
    ctx.lineCap     = "round"
    ctx.lineJoin    = "round"
    ctx.shadowColor = "rgba(80,80,100,0.6)"
    ctx.shadowBlur  = isMobile ? 4 : 10
    ctx.beginPath()
    ctx.moveTo(td.pts[0].x, td.pts[0].y)
    for (let i = 1; i < td.pts.length; i++) {
      const mp = {
        x: (td.pts[i-1].x + td.pts[i].x) / 2,
        y: (td.pts[i-1].y + td.pts[i].y) / 2,
      }
      ctx.quadraticCurveTo(td.pts[i-1].x, td.pts[i-1].y, mp.x, mp.y)
    }
    ctx.stroke()

    // White highlight streak along tendril centre
    ctx.strokeStyle = `rgba(200,200,210,${(td.life * 0.25).toFixed(2)})`
    ctx.lineWidth   = td.width * td.life * 0.25
    ctx.shadowBlur  = 0
    ctx.beginPath()
    ctx.moveTo(td.pts[0].x, td.pts[0].y)
    for (let i = 1; i < td.pts.length; i++) {
      const mp = {
        x: (td.pts[i-1].x + td.pts[i].x) / 2,
        y: (td.pts[i-1].y + td.pts[i].y) / 2,
      }
      ctx.quadraticCurveTo(td.pts[i-1].x, td.pts[i-1].y, mp.x, mp.y)
    }
    ctx.stroke()
    ctx.restore()
  }
}

function drawSymbioteEyes(ctx, face, t) {
  if (!face || !state.toScreen) return
  const ts = state.toScreen

  // Left eye — large white jagged streak
  const lEyeC = ts(
    (face[FACE_IDX.L_EYE_L].x + face[FACE_IDX.L_EYE_R].x) / 2,
    (face[FACE_IDX.L_EYE_TOP].y + face[FACE_IDX.L_EYE_BOT].y) / 2,
  )
  // Right eye
  const rEyeC = ts(
    (face[FACE_IDX.R_EYE_L].x + face[FACE_IDX.R_EYE_R].x) / 2,
    (face[FACE_IDX.R_EYE_TOP].y + face[FACE_IDX.R_EYE_BOT].y) / 2,
  )
  const lLeft  = ts(face[FACE_IDX.L_EYE_L].x, face[FACE_IDX.L_EYE_L].y)
  const rRight = ts(face[FACE_IDX.R_EYE_R].x, face[FACE_IDX.R_EYE_R].y)
  const faceW  = Math.abs(rRight.x - lLeft.x)
  const eyeW   = faceW * 0.26
  const eyeH   = eyeW * 0.38

  const pulse = 0.8 + Math.sin(t * 3.5) * 0.2

  ;[lEyeC, rEyeC].forEach((eye, side) => {
    ctx.save()
    ctx.translate(eye.x, eye.y)

    // Outer white glow
    const og = ctx.createRadialGradient(0, 0, 0, 0, 0, eyeW * 0.9)
    og.addColorStop(0,   `rgba(255,255,255,${(pulse * 0.9).toFixed(2)})`)
    og.addColorStop(0.5, `rgba(220,220,255,${(pulse * 0.55).toFixed(2)})`)
    og.addColorStop(1,   "rgba(0,0,0,0)")
    ctx.fillStyle  = og
    ctx.shadowColor = "rgba(255,255,255,0.9)"
    ctx.shadowBlur  = isMobile ? 8 : 18
    // Elongated eye shape using scale
    ctx.scale(1, eyeH / eyeW)
    ctx.beginPath()
    ctx.arc(0, 0, eyeW * 0.85, 0, Math.PI * 2)
    ctx.fill()

    // Jagged white streak (venom eye spikes)
    ctx.scale(1, eyeW / eyeH) // reset scale
    ctx.strokeStyle = `rgba(255,255,255,${(pulse * 0.95).toFixed(2)})`
    ctx.lineWidth   = 2.5
    ctx.shadowBlur  = isMobile ? 6 : 14
    ctx.beginPath()
    const spikes = 5
    for (let i = 0; i <= spikes; i++) {
      const px = -eyeW * 0.8 + (i / spikes) * eyeW * 1.6
      const py = (i % 2 === 0 ? -1 : 1) * eyeH * (0.5 + Math.random() * 0.3)
      if (i === 0) ctx.moveTo(px, py)
      else         ctx.lineTo(px, py)
    }
    ctx.stroke()
    ctx.restore()
  })
}

function drawSymbioteCreep(ctx, t) {
  // Black liquid seeping in from all 4 edges
  const W = state.screen.w, H = state.screen.h
  const creep = 0.22 + Math.sin(t * 1.2) * 0.04

  const edges = [
    { x1: 0,   y1: 0,   x2: 0,   y2: 0,   dir: "right",  size: W * creep },
    { x1: W,   y1: 0,   x2: W,   y2: 0,   dir: "left",   size: W * creep },
    { x1: 0,   y1: 0,   x2: 0,   y2: 0,   dir: "down",   size: H * creep },
    { x1: 0,   y1: H,   x2: 0,   y2: H,   dir: "up",     size: H * creep },
  ]

  ctx.save()
  ctx.shadowBlur = 0

  // Top
  let g = ctx.createLinearGradient(0, 0, 0, H * creep)
  g.addColorStop(0, "rgba(0,0,5,0.82)"); g.addColorStop(1, "rgba(0,0,0,0)")
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H * creep)

  // Bottom
  g = ctx.createLinearGradient(0, H, 0, H - H * creep)
  g.addColorStop(0, "rgba(0,0,5,0.82)"); g.addColorStop(1, "rgba(0,0,0,0)")
  ctx.fillStyle = g; ctx.fillRect(0, H - H * creep, W, H * creep)

  // Left
  g = ctx.createLinearGradient(0, 0, W * creep, 0)
  g.addColorStop(0, "rgba(0,0,5,0.82)"); g.addColorStop(1, "rgba(0,0,0,0)")
  ctx.fillStyle = g; ctx.fillRect(0, 0, W * creep, H)

  // Right
  g = ctx.createLinearGradient(W, 0, W - W * creep, 0)
  g.addColorStop(0, "rgba(0,0,5,0.82)"); g.addColorStop(1, "rgba(0,0,0,0)")
  ctx.fillStyle = g; ctx.fillRect(W - W * creep, 0, W * creep, H)

  ctx.restore()
}

export const EXP_VENOM = {
  name: "🖤  VENOM", useWings: false, useMask: false, useFace: false,
  onFrame(results, ctx, t, deps) {
    const { expDot, expStatus } = deps
    const pose = results.poseLandmarks
    const face = results.faceLandmarks
    if (!pose || !state.toScreen) {
      expDot.className = "hud-dot off"; expStatus.textContent = "STAND IN FRAME"; return
    }

    const ts = state.toScreen

    // Spawn tendrils from shoulders + wrists
    const spawnSrcs = [
      { idx: POSE_IDX.L_SHOULDER, angle: -Math.PI * 0.6 },
      { idx: POSE_IDX.R_SHOULDER, angle: -Math.PI * 0.4 },
      { idx: POSE_IDX.L_WRIST,    angle: -Math.PI * 0.75 },
      { idx: POSE_IDX.R_WRIST,    angle: -Math.PI * 0.25 },
    ]
    const spawnChance = isMobile ? 0.25 : 0.45
    for (const src of spawnSrcs) {
      if (!pose[src.idx]) continue
      if (Math.random() < spawnChance) {
        const p = ts(pose[src.idx].x, pose[src.idx].y)
        const jitter = (Math.random() - 0.5) * 0.5
        spawnTendril(p.x, p.y, src.angle + jitter)
      }
    }

    updateTendrils()

    // Draw layers
    drawSymbioteCreep(ctx, t)
    drawTendrils(ctx)
    if (face) drawSymbioteEyes(ctx, face, t)

    expDot.className = "hud-dot yellow"
    const eyeStatus  = face ? "EYES✓" : "EYES—"
    expStatus.textContent = `VENOM ${eyeStatus}`
  },
}
