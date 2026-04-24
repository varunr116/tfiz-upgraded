// exp-torch.js — Human Torch
// Full body fire using pose landmarks.
// Flame columns rise from hands, shoulders, head.
// A body-wide heat shimmer corona wraps the silhouette.
import { state, isMobile, applyMobileShadow } from "../state.js"
import { POSE_IDX } from "../constants.js"

const MAX_PARTICLES = isMobile ? 60 : 140
const particles     = []

function spawnFlame(x, y, intensity) {
  if (particles.length >= MAX_PARTICLES) return
  const spread = intensity * 18
  particles.push({
    x: x + (Math.random() - 0.5) * spread,
    y,
    vx: (Math.random() - 0.5) * intensity * 1.8,
    vy: -(2.5 + Math.random() * intensity * 2.2),
    life: 1,
    decay: 0.022 + Math.random() * 0.018,
    size: (6 + Math.random() * intensity * 10) * (isMobile ? 0.7 : 1),
    hot: Math.random() < 0.45,   // hot = white-yellow core vs orange
  })
}

function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p  = particles[i]
    p.x     += p.vx
    p.y     += p.vy
    p.vx    *= 0.97
    p.vy    *= 0.98
    p.life  -= p.decay
    p.size  *= 0.985
    if (p.life <= 0 || p.size < 1) particles.splice(i, 1)
  }
}

function drawParticles(ctx) {
  for (const p of particles) {
    const a = p.life
    const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size)
    if (p.hot) {
      g.addColorStop(0,   `rgba(255,255,200,${(a * 0.95).toFixed(2)})`)
      g.addColorStop(0.3, `rgba(255,220,60,${(a * 0.85).toFixed(2)})`)
      g.addColorStop(0.7, `rgba(255,100,0,${(a * 0.5).toFixed(2)})`)
      g.addColorStop(1,   "rgba(180,30,0,0)")
    } else {
      g.addColorStop(0,   `rgba(255,160,20,${(a * 0.9).toFixed(2)})`)
      g.addColorStop(0.4, `rgba(255,60,0,${(a * 0.65).toFixed(2)})`)
      g.addColorStop(1,   "rgba(100,10,0,0)")
    }
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
    ctx.fill()
  }
}

function drawBodyGlow(ctx, pose, t) {
  // Amber corona that wraps the entire body silhouette
  const ts  = state.toScreen
  const pts = [
    POSE_IDX.L_SHOULDER, POSE_IDX.R_SHOULDER,
    POSE_IDX.L_ELBOW,    POSE_IDX.R_ELBOW,
    POSE_IDX.L_WRIST,    POSE_IDX.R_WRIST,
    POSE_IDX.L_HIP,      POSE_IDX.R_HIP,
  ]
  const pulse = 0.55 + Math.sin(t * 4) * 0.2
  ctx.save()
  for (const idx of pts) {
    if (!pose[idx]) continue
    const p = ts(pose[idx].x, pose[idx].y)
    const r = 28 + Math.sin(t * 6 + idx) * 6
    const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 2.2)
    g.addColorStop(0,   `rgba(255,200,50,${(pulse * 0.55).toFixed(2)})`)
    g.addColorStop(0.5, `rgba(255,80,0,${(pulse * 0.25).toFixed(2)})`)
    g.addColorStop(1,   "rgba(0,0,0,0)")
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(p.x, p.y, r * 2.2, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}

export const EXP_TORCH = {
  name: "🔥  HUMAN TORCH", useWings: false, useMask: false, useFace: false,
  onFrame(results, ctx, t, deps) {
    const { expDot, expStatus } = deps
    const pose = results.poseLandmarks
    if (!pose || !state.toScreen) {
      expDot.className = "hud-dot off"; expStatus.textContent = "STAND IN FRAME"; return
    }

    updateParticles()

    const ts = state.toScreen

    // Spawn flames at hands, elbows, shoulders, and head (nose)
    const sources = [
      { idx: POSE_IDX.L_WRIST,    intensity: 1.4 },
      { idx: POSE_IDX.R_WRIST,    intensity: 1.4 },
      { idx: POSE_IDX.L_ELBOW,    intensity: 0.9 },
      { idx: POSE_IDX.R_ELBOW,    intensity: 0.9 },
      { idx: POSE_IDX.L_SHOULDER, intensity: 0.8 },
      { idx: POSE_IDX.R_SHOULDER, intensity: 0.8 },
      { idx: POSE_IDX.NOSE,       intensity: 0.7 },
    ]
    const spawnPerSource = isMobile ? 1 : 2
    for (const src of sources) {
      if (!pose[src.idx]) continue
      const p = ts(pose[src.idx].x, pose[src.idx].y)
      for (let i = 0; i < spawnPerSource; i++) spawnFlame(p.x, p.y, src.intensity)
    }

    // Draw body corona glow
    drawBodyGlow(ctx, pose, t)

    // Draw all flame particles (no shadow — too slow)
    ctx.save()
    ctx.shadowBlur = 0
    drawParticles(ctx)
    ctx.restore()

    // Screen-wide orange heat tint
    const W = state.screen.w, H = state.screen.h
    const tint = ctx.createRadialGradient(W/2, H/2, H*0.1, W/2, H/2, H*0.8)
    const heatA = (0.06 + Math.sin(t * 3) * 0.02).toFixed(2)
    tint.addColorStop(0,   `rgba(255,120,0,${heatA})`)
    tint.addColorStop(0.6, `rgba(200,50,0,0.03)`)
    tint.addColorStop(1,   "rgba(0,0,0,0)")
    ctx.fillStyle = tint
    ctx.fillRect(0, 0, W, H)

    expDot.className      = "hud-dot yellow"
    expStatus.textContent = "TORCH ✓"
  },
}
