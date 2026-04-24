import { state, isMobile } from "../state.js"
import { HAND_IDX } from "../constants.js"

const portalStars = Array.from({ length: isMobile ? 50 : 120 }, () => ({
    angle: Math.random() * Math.PI * 2, dist: Math.random(), size: 0.5 + Math.random() * 2,
    speed: 0.4 + Math.random() * 1.2, bright: Math.random() > 0.7,
}))

function drawPortal(ctx, hand, t, side) {
    if (!hand || !state.toScreen) return
    const ts = state.toScreen
    const palm = ts(hand[HAND_IDX.MIDDLE_MCP].x, hand[HAND_IDX.MIDDLE_MCP].y)
    const wrist = ts(hand[HAND_IDX.WRIST].x, hand[HAND_IDX.WRIST].y)
    const midTip = ts(hand[HAND_IDX.MIDDLE_TIP].x, hand[HAND_IDX.MIDDLE_TIP].y)
    const R = Math.hypot(midTip.x - wrist.x, midTip.y - wrist.y) * 0.72
    if (R < 20) return
    const cx = palm.x, cy = palm.y, offset = side === "left" ? 0 : Math.PI * 0.7
    ctx.save()
    const voidG = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 0.9)
    voidG.addColorStop(0, "rgba(0,0,8,0.92)"); voidG.addColorStop(0.6, "rgba(5,0,20,0.88)"); voidG.addColorStop(1, "rgba(20,5,40,0.7)")
    ctx.fillStyle = voidG; ctx.shadowBlur = 0; ctx.globalAlpha = 1
    ctx.beginPath(); ctx.arc(cx, cy, R * 0.9, 0, Math.PI * 2); ctx.fill()
    ctx.globalAlpha = 1
    portalStars.forEach(star => {
        star.angle += star.speed * 0.008
        const maxD = R * 0.88, starDist = star.dist * maxD
        const sx = cx + Math.cos(star.angle + offset) * starDist
        const sy = cy + Math.sin(star.angle + offset) * starDist * 0.55
        const twinkle = 0.5 + Math.sin(t * (2 + star.speed) + star.angle * 5) * 0.5
        if (sx < cx - R || sx > cx + R || sy < cy - R || sy > cy + R) return
        const starG = ctx.createRadialGradient(sx, sy, 0, sx, sy, star.size * 2.5)
        starG.addColorStop(0, `rgba(${star.bright ? "255,240,200" : "180,180,255"},${0.95 * twinkle})`)
        starG.addColorStop(1, "rgba(0,0,0,0)")
        ctx.fillStyle = starG; ctx.beginPath(); ctx.arc(sx, sy, star.size * 2.5, 0, Math.PI * 2); ctx.fill()
    })
        ;[[0.3, 0.2, "#1a0050"], [0.6, -0.15, "#002255"], [-0.3, 0.3, "#220040"]].forEach(([ox, oy, col]) => {
            const nx = cx + ox * R, ny = cy + oy * R * 0.55
            const ng = ctx.createRadialGradient(nx, ny, 0, nx, ny, R * 0.5)
            ng.addColorStop(0, col + "aa"); ng.addColorStop(1, col + "00")
            ctx.fillStyle = ng; ctx.globalAlpha = 0.35; ctx.beginPath(); ctx.arc(nx, ny, R * 0.5, 0, Math.PI * 2); ctx.fill()
        })
    const SPARK_COUNT = 64
    ctx.globalAlpha = 1
    for (let i = 0; i < SPARK_COUNT; i++) {
        const a = (i / SPARK_COUNT) * Math.PI * 2 + t * 1.8 + offset, wobble = Math.sin(t * 4 + i * 0.4) * R * 0.04
        const sparkR = R + wobble, sx = cx + Math.cos(a) * sparkR, sy = cy + Math.sin(a) * sparkR
        const sparkSz = i % 4 === 0 ? 4.5 : 2
        const sparkG = ctx.createRadialGradient(sx, sy, 0, sx, sy, sparkSz * 3)
        const bright = i % 4 === 0
        sparkG.addColorStop(0, bright ? "rgba(255,200,50,1.0)" : "rgba(255,140,0,0.85)")
        sparkG.addColorStop(1, "rgba(255,80,0,0)")
        ctx.fillStyle = sparkG; ctx.shadowColor = "#ffaa00"; ctx.shadowBlur = bright ? 12 : 5
        ctx.beginPath(); ctx.arc(sx, sy, sparkSz * 3, 0, Math.PI * 2); ctx.fill()
    }
    for (let i = 0; i < 32; i++) {
        const a = (i / 32) * Math.PI * 2 - t * 2.5 + offset, sr = R * 0.9
        const sx = cx + Math.cos(a) * sr, sy = cy + Math.sin(a) * sr
        ctx.fillStyle = "rgba(180,220,255,0.7)"; ctx.shadowColor = "#aaddff"; ctx.shadowBlur = 6
        ctx.globalAlpha = 0.5 + Math.sin(t * 5 + i) * 0.3
        ctx.beginPath(); ctx.arc(sx, sy, 1.5, 0, Math.PI * 2); ctx.fill()
    }
    for (let ring = 0; ring < 4; ring++) {
        const rr = R * (1.0 + ring * 0.12), alpha = 0.7 - ring * 0.15
        ctx.strokeStyle = ring < 2 ? `rgba(255,160,0,${alpha})` : `rgba(255,80,0,${alpha * 0.5})`
        ctx.lineWidth = ring < 2 ? 3 - ring : 1; ctx.shadowColor = "#ff8800"; ctx.shadowBlur = ring === 0 ? 20 : 8
        ctx.globalAlpha = 1; ctx.beginPath(); ctx.arc(cx, cy, rr, 0, Math.PI * 2); ctx.stroke()
    }
    ctx.fillStyle = "rgba(255,180,50,0.6)"; ctx.shadowColor = "#ffaa00"; ctx.shadowBlur = 8
    ctx.font = `${Math.round(R * 0.18)}px Courier New`; ctx.textAlign = "center"; ctx.globalAlpha = 0.7
    ctx.fillText(side === "left" ? "ORIGIN" : "DEST", cx, cy + R * 1.3)
    ctx.restore()
}

export const EXP_PORTAL = {
    name: "🌀  PORTAL", useWings: false, useMask: false, useFace: false,
    onFrame(results, ctx, t, deps) {
        const { expDot, expStatus } = deps
        const lh = results.leftHandLandmarks, rh = results.rightHandLandmarks
        if (!lh && !rh) { expDot.className = "hud-dot off"; expStatus.textContent = "RAISE YOUR HANDS"; return }
        if (lh) drawPortal(ctx, lh, t, "left")
        if (rh) drawPortal(ctx, rh, t, "right")
        expDot.className = "hud-dot yellow"
        expStatus.textContent = "PORTALS OPEN " + (lh ? "L✓" : "") + (rh ? " R✓" : "")
    },
}