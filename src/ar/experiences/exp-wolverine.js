import { state } from "../state.js"
import { HAND_IDX } from "../constants.js"

function drawWolverineClaws(ctx, hand, t) {
    if (!hand || !state.toScreen) return
    const ts = state.toScreen
    const wrist = ts(hand[HAND_IDX.WRIST].x, hand[HAND_IDX.WRIST].y)
    const iMcp = ts(hand[HAND_IDX.INDEX_MCP].x, hand[HAND_IDX.INDEX_MCP].y)
    const mMcp = ts(hand[HAND_IDX.MIDDLE_MCP].x, hand[HAND_IDX.MIDDLE_MCP].y)
    const rMcp = ts(hand[HAND_IDX.RING_MCP].x, hand[HAND_IDX.RING_MCP].y)
    const midTip = ts(hand[HAND_IDX.MIDDLE_TIP].x, hand[HAND_IDX.MIDDLE_TIP].y)
    const handLen = Math.hypot(midTip.x - wrist.x, midTip.y - wrist.y)
    if (handLen < 30) return
    const dx = mMcp.x - wrist.x, dy = mMcp.y - wrist.y
    const len = Math.hypot(dx, dy) || 1
    const ux = dx / len, uy = dy / len
    const clawLen = handLen * 1.1, baseW = handLen * 0.055
    const anchors = [iMcp, mMcp, rMcp]
    ctx.save()
    anchors.forEach((anchor, i) => {
        const spread = (i - 1) * 0.14
        const cosS = Math.cos(spread), sinS = Math.sin(spread)
        const fdx = ux * cosS - uy * sinS, fdy = ux * sinS + uy * cosS
        const pdx = -fdy, pdy = fdx
        const tx = anchor.x + fdx * clawLen, ty = anchor.y + fdy * clawLen
        const grad = ctx.createLinearGradient(anchor.x, anchor.y, tx, ty)
        grad.addColorStop(0, "rgba(180,190,200,0.95)"); grad.addColorStop(0.3, "rgba(240,245,255,0.98)")
        grad.addColorStop(0.6, "rgba(160,170,180,0.92)"); grad.addColorStop(0.88, "rgba(200,210,220,0.85)")
        grad.addColorStop(1, "rgba(220,230,240,0.3)")
        ctx.fillStyle = grad; ctx.shadowColor = "rgba(200,220,255,0.6)"; ctx.shadowBlur = 8
        ctx.beginPath(); ctx.moveTo(anchor.x + pdx * baseW, anchor.y + pdy * baseW)
        ctx.lineTo(anchor.x - pdx * baseW, anchor.y - pdy * baseW); ctx.lineTo(tx, ty); ctx.closePath(); ctx.fill()
        ctx.strokeStyle = "rgba(255,255,255,0.75)"; ctx.lineWidth = 1.2
        ctx.shadowColor = "rgba(255,255,255,0.9)"; ctx.shadowBlur = 4; ctx.globalAlpha = 0.7
        ctx.beginPath(); ctx.moveTo(anchor.x, anchor.y)
        ctx.lineTo(anchor.x + fdx * clawLen * 0.85, anchor.y + fdy * clawLen * 0.85); ctx.stroke()
        ctx.strokeStyle = "rgba(60,70,80,0.5)"; ctx.lineWidth = 0.7; ctx.shadowBlur = 0; ctx.globalAlpha = 0.5
        ctx.beginPath(); ctx.moveTo(anchor.x + fdx * 0.1, anchor.y + fdy * 0.1); ctx.lineTo(tx, ty); ctx.stroke()
        ctx.globalAlpha = 0.5; ctx.shadowBlur = 0
        const kg = ctx.createRadialGradient(anchor.x, anchor.y, 0, anchor.x, anchor.y, baseW * 2.5)
        kg.addColorStop(0, "rgba(180,200,255,0.55)"); kg.addColorStop(1, "rgba(0,0,0,0)")
        ctx.fillStyle = kg; ctx.beginPath(); ctx.arc(anchor.x, anchor.y, baseW * 2.5, 0, Math.PI * 2); ctx.fill()
    })
    ctx.globalAlpha = 1; ctx.restore()
}

export const EXP_WOLVERINE = {
    name: "⚡  WOLVERINE", useWings: false, useMask: false, useFace: false,
    onFrame(results, ctx, t, deps) {
        const { expDot, expStatus, applyFaceMatrix } = deps
        applyFaceMatrix()
        drawWolverineClaws(ctx, results.leftHandLandmarks, t)
        drawWolverineClaws(ctx, results.rightHandLandmarks, t)
        const face = !!state.lastFaceMatrix, lh = !!results.leftHandLandmarks, rh = !!results.rightHandLandmarks
        expDot.className = "hud-dot " + (face ? "" : "off")
        expStatus.textContent = "MASK " + (face ? "✓" : "—") + "  CLAWS L" + (lh ? "✓" : "—") + " R" + (rh ? "✓" : "—")
    },
}