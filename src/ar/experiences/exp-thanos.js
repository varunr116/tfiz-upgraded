import { state } from "../state.js"
import { HAND_IDX, FINGER_CHAINS } from "../constants.js"

const GEM_COLORS = [
    { name: "Soul", color: "#ff7700", glow: "rgba(255,100,0,", ring: "rgba(255,140,0," },
    { name: "Mind", color: "#ffee00", glow: "rgba(255,220,0,", ring: "rgba(255,240,80," },
    { name: "Space", color: "#4488ff", glow: "rgba(30,80,255,", ring: "rgba(80,140,255," },
    { name: "Reality", color: "#ff2200", glow: "rgba(255,30,0,", ring: "rgba(255,80,60," },
    { name: "Power", color: "#aa00ff", glow: "rgba(150,0,255,", ring: "rgba(180,60,255," },
    { name: "Time", color: "#00ff88", glow: "rgba(0,220,120,", ring: "rgba(0,255,140," },
]

function drawThanosGauntlet(ctx, hand, side, t) {
    if (!state.toScreen) return
    const ts = state.toScreen
    ctx.save()
    const wrist = ts(hand[HAND_IDX.WRIST].x, hand[HAND_IDX.WRIST].y)
    const palm = ts(hand[HAND_IDX.MIDDLE_MCP].x, hand[HAND_IDX.MIDDLE_MCP].y)
    const midTip = ts(hand[HAND_IDX.MIDDLE_TIP].x, hand[HAND_IDX.MIDDLE_TIP].y)
    const handLen = Math.hypot(midTip.x - wrist.x, midTip.y - wrist.y)
    if (handLen < 30) { ctx.restore(); return }
    const fingerSize = handLen * 0.12
    FINGER_CHAINS.forEach((chain, fi) => {
        for (let i = 0; i < chain.length - 1; i++) {
            const pa = ts(hand[chain[i]].x, hand[chain[i]].y)
            const pb = ts(hand[chain[i + 1]].x, hand[chain[i + 1]].y)
            const dx = pb.x - pa.x, dy = pb.y - pa.y
            const segLen = Math.hypot(dx, dy); if (segLen < 1) continue
            const nx = -dy / segLen, ny = dx / segLen
            const w = fingerSize * (0.45 - i * 0.04)
            const g = ctx.createLinearGradient(pa.x, pa.y, pb.x, pb.y)
            g.addColorStop(0, "rgba(200,160,40,0.95)"); g.addColorStop(0.3, "rgba(255,210,80,0.98)")
            g.addColorStop(0.7, "rgba(180,130,20,0.95)"); g.addColorStop(1, "rgba(140,100,10,0.88)")
            ctx.fillStyle = g; ctx.shadowColor = "#ffcc00"; ctx.shadowBlur = 10
            ctx.beginPath()
            ctx.moveTo(pa.x + nx * w, pa.y + ny * w); ctx.lineTo(pa.x - nx * w, pa.y - ny * w)
            ctx.lineTo(pb.x - nx * w * 0.7, pb.y - ny * w * 0.7); ctx.lineTo(pb.x + nx * w * 0.7, pb.y + ny * w * 0.7)
            ctx.closePath(); ctx.fill()
            ctx.strokeStyle = "rgba(80,50,0,0.7)"; ctx.lineWidth = 1; ctx.shadowBlur = 0; ctx.globalAlpha = 0.6
            ctx.beginPath()
            ctx.moveTo(pa.x + nx * w, pa.y + ny * w); ctx.lineTo(pb.x + nx * w * 0.7, pb.y + ny * w * 0.7)
            ctx.moveTo(pa.x - nx * w, pa.y - ny * w); ctx.lineTo(pb.x - nx * w * 0.7, pb.y - ny * w * 0.7)
            ctx.stroke()
        }
    })
    const gemPositions = [
        ts(hand[HAND_IDX.WRIST].x, hand[HAND_IDX.WRIST].y),
        ts(hand[HAND_IDX.INDEX_MCP].x, hand[HAND_IDX.INDEX_MCP].y),
        ts(hand[HAND_IDX.MIDDLE_MCP].x, hand[HAND_IDX.MIDDLE_MCP].y),
        ts(hand[HAND_IDX.RING_MCP].x, hand[HAND_IDX.RING_MCP].y),
        ts(hand[HAND_IDX.PINKY_MCP].x, hand[HAND_IDX.PINKY_MCP].y),
        ts(hand[HAND_IDX.THUMB_MCP].x, hand[HAND_IDX.THUMB_MCP].y),
    ]
    gemPositions.forEach((gp, gi) => {
        const gem = GEM_COLORS[gi % GEM_COLORS.length]
        const pulse = 0.7 + Math.sin(t * 3.5 + gi * 1.1) * 0.3
        const gemR = fingerSize * (gi === 0 ? 0.75 : 0.55)
        const aura = ctx.createRadialGradient(gp.x, gp.y, 0, gp.x, gp.y, gemR * 3)
        aura.addColorStop(0, gem.glow + 0.5 * pulse + ")"); aura.addColorStop(1, gem.glow + "0)")
        ctx.globalAlpha = 1; ctx.fillStyle = aura; ctx.shadowBlur = 0
        ctx.beginPath(); ctx.arc(gp.x, gp.y, gemR * 3, 0, Math.PI * 2); ctx.fill()
        ctx.shadowColor = gem.color; ctx.shadowBlur = 18 * pulse
        ctx.fillStyle = gem.color; ctx.globalAlpha = 0.92 * pulse
        ctx.beginPath()
        for (let k = 0; k < 8; k++) {
            const a = (k / 8) * Math.PI * 2 + t * 0.8, r = gemR * (k % 2 === 0 ? 1.0 : 0.75)
            if (k === 0) ctx.moveTo(gp.x + Math.cos(a) * r, gp.y + Math.sin(a) * r)
            else ctx.lineTo(gp.x + Math.cos(a) * r, gp.y + Math.sin(a) * r)
        }
        ctx.closePath(); ctx.fill()
        ctx.fillStyle = "rgba(255,255,255,0.7)"; ctx.shadowBlur = 0; ctx.globalAlpha = 0.65
        ctx.beginPath(); ctx.ellipse(gp.x - gemR * 0.2, gp.y - gemR * 0.25, gemR * 0.3, gemR * 0.2, -0.5, 0, Math.PI * 2); ctx.fill()
        ctx.strokeStyle = gem.ring + "0.8)"; ctx.lineWidth = 1.5; ctx.shadowColor = gem.color; ctx.shadowBlur = 8
        ctx.globalAlpha = 0.7 * pulse; ctx.beginPath(); ctx.arc(gp.x, gp.y, gemR * 1.5, 0, Math.PI * 2); ctx.stroke()
    })
    const ovG = ctx.createRadialGradient(palm.x, palm.y, 0, palm.x, palm.y, handLen * 0.7)
    ovG.addColorStop(0, "rgba(255,200,50,0.15)"); ovG.addColorStop(1, "rgba(255,150,0,0)")
    ctx.globalAlpha = 0.7; ctx.fillStyle = ovG; ctx.shadowBlur = 0
    ctx.beginPath(); ctx.arc(palm.x, palm.y, handLen * 0.7, 0, Math.PI * 2); ctx.fill()
    ctx.restore()
}

export const EXP_THANOS = {
    name: "💎  THANOS", useWings: false, useMask: false, useFace: false,
    onFrame(results, ctx, t, deps) {
        const { expDot, expStatus } = deps
        const lh = results.leftHandLandmarks, rh = results.rightHandLandmarks
        if (!lh && !rh) { expDot.className = "hud-dot off"; expStatus.textContent = "RAISE YOUR HAND"; return }
        if (lh) drawThanosGauntlet(ctx, lh, "left", t)
        if (rh) drawThanosGauntlet(ctx, rh, "right", t)
        expDot.className = "hud-dot yellow"
        expStatus.textContent = "GAUNTLET " + (lh ? "L✓" : "") + " " + (rh ? "R✓" : "")
    },
}