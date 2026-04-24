import { state, isMobile } from "../state.js"

const lightningBolts2 = []
let nextLightningTime = 0, lightningFlash = 0

function generateLightningBolt(x1, y1, x2, y2, roughness, depth) {
    if (depth === 0) return [[x1, y1], [x2, y2]]
    const mx = (x1 + x2) / 2 + (Math.random() - 0.5) * roughness
    const my = (y1 + y2) / 2 + (Math.random() - 0.5) * roughness
    const left = generateLightningBolt(x1, y1, mx, my, roughness * 0.55, depth - 1)
    const right = generateLightningBolt(mx, my, x2, y2, roughness * 0.55, depth - 1)
    if (depth > 2 && Math.random() < 0.35) {
        const bx = mx + (Math.random() - 0.5) * roughness * 1.2
        const by = my + roughness * 1.5 + Math.random() * roughness
        const branch = generateLightningBolt(mx, my, bx, by, roughness * 0.4, depth - 2)
        return [...left, ...right, ...branch]
    }
    return [...left, ...right]
}

function drawLightningBolt(ctx, pts, alpha, width, col) {
    if (pts.length < 2) return
    ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = width; ctx.globalAlpha = alpha
    ctx.shadowColor = col; ctx.shadowBlur = 15; ctx.lineCap = "round"; ctx.lineJoin = "round"
    ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1])
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1])
    ctx.stroke(); ctx.restore()
}

export const EXP_LIGHTNING = {
    name: "⚡  LIGHTNING", useWings: false, useMask: false, useFace: false,
    onFrame(results, ctx, t, deps) {
        const { expDot, expStatus } = deps
        const W = state.screen.w, H = state.screen.h
        const now = performance.now()
        if (now > nextLightningTime) {
            const startX = Math.random() * W, endX = startX + (Math.random() - 0.5) * W * 0.4
            const pts = generateLightningBolt(startX, 0, endX, H * 0.8, W * 0.15, isMobile ? 4 : 6)
            lightningBolts2.push({ pts, life: 1.0, decay: 0.04 + Math.random() * 0.04, mainWidth: 2.5 + Math.random() * 2, color: Math.random() < 0.7 ? "#aaddff" : "#ffffff" })
            if (Math.random() < 0.5) {
                const sx2 = Math.random() * W
                const pts2 = generateLightningBolt(sx2, 0, sx2 + (Math.random() - 0.5) * W * 0.3, H * 0.6, W * 0.1, isMobile ? 3 : 5)
                lightningBolts2.push({ pts: pts2, life: 0.8, decay: 0.06 + Math.random() * 0.04, mainWidth: 1.5, color: "#88aaff" })
            }
            lightningFlash = 0.6; nextLightningTime = now + 400 + Math.random() * 1200
        }
        if (lightningFlash > 0) {
            ctx.save(); ctx.fillStyle = `rgba(180,210,255,${lightningFlash * 0.08})`; ctx.fillRect(0, 0, W, H); ctx.restore()
            lightningFlash *= 0.85
        }
        for (let i = lightningBolts2.length - 1; i >= 0; i--) {
            const b = lightningBolts2[i]; b.life -= b.decay
            if (b.life <= 0) { lightningBolts2.splice(i, 1); continue }
            drawLightningBolt(ctx, b.pts, b.life * 0.95, b.mainWidth, b.color)
            drawLightningBolt(ctx, b.pts, b.life * 0.25, b.mainWidth * 5, "rgba(100,160,255,0.3)")
            drawLightningBolt(ctx, b.pts, b.life * 1.0, b.mainWidth * 0.3, "#ffffff")
        }
        lightningBolts2.forEach(b => {
            if (b.pts.length < 2) return
            const last = b.pts[b.pts.length - 1]
            const gr = ctx.createRadialGradient(last[0], last[1], 0, last[0], last[1], 80 * b.life)
            gr.addColorStop(0, `rgba(200,220,255,${b.life * 0.4})`); gr.addColorStop(1, "rgba(0,50,200,0)")
            ctx.save(); ctx.fillStyle = gr; ctx.globalAlpha = 1
            ctx.beginPath(); ctx.arc(last[0], last[1], 80 * b.life, 0, Math.PI * 2); ctx.fill(); ctx.restore()
        })
        expDot.className = lightningBolts2.length > 0 ? "hud-dot yellow" : "hud-dot"
        expStatus.textContent = "BOLTS: " + lightningBolts2.length
    },
}