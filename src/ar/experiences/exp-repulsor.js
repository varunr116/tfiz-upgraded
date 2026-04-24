import { state, isMobile, applyMobileShadow } from "../state.js"
import { HAND_IDX } from "../constants.js"

const repulsorState = {
    left: { active: false, charge: 0, blasts: [] },
    right: { active: false, charge: 0, blasts: [] },
}

function drawRepulsor(ctx, hand, side, t) {
    if (!hand || !state.toScreen) return
    const ts = state.toScreen
    const palm = ts(hand[HAND_IDX.MIDDLE_MCP].x, hand[HAND_IDX.MIDDLE_MCP].y)
    const wrist = ts(hand[HAND_IDX.WRIST].x, hand[HAND_IDX.WRIST].y)
    const midTip = ts(hand[HAND_IDX.MIDDLE_TIP].x, hand[HAND_IDX.MIDDLE_TIP].y)
    const handLen = Math.hypot(midTip.x - wrist.x, midTip.y - wrist.y)
    if (handLen < 30) return
    const tipAvgY = [4, 8, 12, 16, 20].reduce((s, i) => s + ts(hand[i].x, hand[i].y).y, 0) / 5
    const isBlasting = tipAvgY < palm.y - handLen * 0.1
    const rs = repulsorState[side]
    rs.charge = isBlasting ? Math.min(1, rs.charge + 0.06) : Math.max(0, rs.charge - 0.04)
    if (rs.charge > 0.95 && Math.random() < 0.3 && rs.blasts.length < (isMobile ? 3 : 8))
        rs.blasts.push({ x: palm.x, y: palm.y, r: 0, maxR: state.screen.w * 0.6, alpha: 1.0 })
    ctx.save()
    const R = handLen * 0.28, cx = palm.x, cy = palm.y
    if (rs.charge > 0.05) {
        const outerG = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 2.5)
        outerG.addColorStop(0, `rgba(150,220,255,${0.3 * rs.charge})`); outerG.addColorStop(1, "rgba(0,100,200,0)")
        ctx.fillStyle = outerG; ctx.globalAlpha = 1; ctx.shadowBlur = 0
        ctx.beginPath(); ctx.arc(cx, cy, R * 2.5, 0, Math.PI * 2); ctx.fill()
        const chargeSegs = Math.floor(rs.charge * 12)
        for (let i = 0; i < chargeSegs; i++) {
            const a0 = (i / 12) * Math.PI * 2 - Math.PI / 2 + t * 2, a1 = a0 + (Math.PI * 2 / 12) * 0.75
            ctx.strokeStyle = rs.charge > 0.8 ? "#ffffff" : "#00aaff"; ctx.lineWidth = 3.5
            applyMobileShadow(ctx, "#00e5ff", 16); ctx.globalAlpha = 0.85
            ctx.beginPath(); ctx.arc(cx, cy, R * 1.2, a0, a1); ctx.stroke()
        }
        const coreG = ctx.createRadialGradient(cx, cy, 0, cx, cy, R)
        coreG.addColorStop(0, `rgba(255,255,255,${rs.charge})`); coreG.addColorStop(0.4, `rgba(100,200,255,${0.8 * rs.charge})`); coreG.addColorStop(1, "rgba(0,100,200,0)")
        ctx.globalAlpha = rs.charge; ctx.fillStyle = coreG; applyMobileShadow(ctx, "#00e5ff", 25)
        ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill()
    }
    for (let i = rs.blasts.length - 1; i >= 0; i--) {
        const b = rs.blasts[i]; b.r += 18 + b.r * 0.05; b.alpha -= 0.025
        if (b.r > b.maxR || b.alpha <= 0) { rs.blasts.splice(i, 1); continue }
        const w = Math.max(1, 8 - b.r * 0.015)
        ctx.strokeStyle = `rgba(100,200,255,${b.alpha * 0.9})`; ctx.lineWidth = w
        applyMobileShadow(ctx, "#00e5ff", 20 * b.alpha); ctx.globalAlpha = b.alpha
        ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.stroke()
        if (b.r > 30) {
            ctx.strokeStyle = `rgba(200,240,255,${b.alpha * 0.6})`; ctx.lineWidth = w * 0.5; ctx.shadowBlur = 10 * b.alpha
            ctx.beginPath(); ctx.arc(b.x, b.y, b.r * 0.7, 0, Math.PI * 2); ctx.stroke()
        }
    }
    ctx.restore()
}

export const EXP_REPULSOR = {
    name: "⚡  REPULSOR", useWings: false, useMask: false, useFace: false,
    onFrame(results, ctx, t, deps) {
        const { expDot, expStatus } = deps
        const lh = results.leftHandLandmarks, rh = results.rightHandLandmarks
        if (!lh && !rh) { expDot.className = "hud-dot off"; expStatus.textContent = "POINT PALM AT CAMERA"; return }
        if (lh) drawRepulsor(ctx, lh, "left", t)
        if (rh) drawRepulsor(ctx, rh, "right", t)
        const lc = repulsorState.left.charge, rc = repulsorState.right.charge
        expDot.className = "hud-dot" + (lc > 0.5 || rc > 0.5 ? "" : " off")
        expStatus.textContent = "CHARGE L:" + Math.round(lc * 100) + "% R:" + Math.round(rc * 100) + "%"
    },
    // Expose reset for switchExperience
    reset() {
        repulsorState.left = { active: false, charge: 0, blasts: [] }
        repulsorState.right = { active: false, charge: 0, blasts: [] }
    },
}