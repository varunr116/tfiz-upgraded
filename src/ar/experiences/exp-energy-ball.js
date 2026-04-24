import { state, isMobile, applyMobileShadow } from "../state.js"
import { HAND_IDX } from "../constants.js"

let energyBallScale = 0
const energyOrbiters = Array.from({ length: isMobile ? 4 : 8 }, (_, i) => ({
    angle: (i / 8) * Math.PI * 2, speed: 1.2 + Math.random() * 0.8,
    dist: 0.6 + Math.random() * 0.3, size: 3 + Math.random() * 4, color: Math.random() < 0.5 ? 0 : 1,
}))

export const EXP_ENERGY_BALL = {
    name: "🌀  ENERGY BALL", useWings: false, useMask: false, useFace: false,
    onFrame(results, ctx, t, deps) {
        const { expDot, expStatus } = deps
        const lh = results.leftHandLandmarks, rh = results.rightHandLandmarks
        if (!lh || !rh || !state.toScreen) {
            energyBallScale *= 0.9
            expDot.className = "hud-dot off"; expStatus.textContent = "BRING BOTH HANDS CLOSE"
            if (energyBallScale < 0.01) return
        }
        let cx, cy, R
        if (lh && rh) {
            const ts = state.toScreen
            const lp = ts(lh[HAND_IDX.MIDDLE_MCP].x, lh[HAND_IDX.MIDDLE_MCP].y)
            const rp = ts(rh[HAND_IDX.MIDDLE_MCP].x, rh[HAND_IDX.MIDDLE_MCP].y)
            cx = (lp.x + rp.x) / 2; cy = (lp.y + rp.y) / 2
            const dist = Math.hypot(rp.x - lp.x, rp.y - lp.y)
            R = Math.min(dist * 0.45, state.screen.w * 0.2)
            energyBallScale += (1 - energyBallScale) * 0.08
            expDot.className = "hud-dot"; expStatus.textContent = "POWER: " + Math.round(energyBallScale * 100) + "%"
        } else {
            energyBallScale *= 0.92
            if (!state._lastEnergyPos) return
            cx = state._lastEnergyPos.cx; cy = state._lastEnergyPos.cy; R = state._lastEnergyPos.R
        }
        if (lh && rh) state._lastEnergyPos = { cx, cy, R }
        const sc = energyBallScale; if (sc < 0.05) return
        ctx.save()
        for (let layer = 3; layer >= 0; layer--) {
            const lr = R * sc * (1.0 + layer * 0.35)
            const corona = ctx.createRadialGradient(cx, cy, 0, cx, cy, lr)
            const cols = [["rgba(0,200,255,", "rgba(100,0,255,"], ["rgba(100,0,255,", "rgba(0,200,255,"], ["rgba(0,255,200,", "rgba(0,100,255,"], ["rgba(200,0,255,", "rgba(0,200,200,"]]
            corona.addColorStop(0, cols[layer][0] + (0.4 - layer * 0.08) + ")")
            corona.addColorStop(0.5, cols[layer][1] + (0.2 - layer * 0.04) + ")")
            corona.addColorStop(1, "rgba(0,0,0,0)")
            ctx.globalAlpha = 0.6 * sc; ctx.fillStyle = corona; ctx.shadowBlur = 0
            ctx.beginPath(); ctx.arc(cx, cy, lr, 0, Math.PI * 2); ctx.fill()
        }
        for (let ring = 0; ring < 3; ring++) {
            const rr = R * sc * (0.7 + ring * 0.15)
            ctx.save(); ctx.translate(cx, cy); ctx.rotate(t * (ring % 2 === 0 ? 1.5 : -2.0) + ring * 0.7)
            ctx.strokeStyle = ring === 1 ? "#aa00ff" : "#00aaff"; ctx.lineWidth = 2.5 - ring * 0.5
            ctx.globalAlpha = (0.8 - ring * 0.15) * sc; applyMobileShadow(ctx, ring === 1 ? "#aa00ff" : "#00aaff", 14)
            ctx.beginPath(); ctx.arc(0, 0, rr, 0, Math.PI * 2); ctx.stroke()
            for (let d = 0; d < 12; d++) {
                const da = (d / 12) * Math.PI * 2; ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 1
                ctx.shadowBlur = 4; ctx.globalAlpha = 0.5 * sc
                ctx.beginPath(); ctx.arc(0, 0, rr, da, da + 0.1); ctx.stroke()
            }
            ctx.restore()
        }
        energyOrbiters.forEach(orb => {
            orb.angle += orb.speed * 0.04
            const ox = cx + Math.cos(orb.angle) * R * sc * orb.dist
            const oy = cy + Math.sin(orb.angle) * R * sc * orb.dist
            const og = ctx.createRadialGradient(ox, oy, 0, ox, oy, orb.size * 3)
            og.addColorStop(0, orb.color === 0 ? "rgba(0,229,255,0.95)" : "rgba(170,0,255,0.95)")
            og.addColorStop(1, "rgba(0,0,0,0)")
            ctx.globalAlpha = 0.9 * sc; ctx.fillStyle = og; ctx.shadowBlur = 0
            ctx.beginPath(); ctx.arc(ox, oy, orb.size * 3, 0, Math.PI * 2); ctx.fill()
        })
        const coreR = R * sc * 0.35
        const coreG = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR)
        coreG.addColorStop(0, "rgba(255,255,255,1.0)"); coreG.addColorStop(0.2, "rgba(180,100,255,0.9)")
        coreG.addColorStop(0.6, "rgba(0,100,255,0.6)"); coreG.addColorStop(1, "rgba(0,0,100,0)")
        ctx.globalAlpha = sc; ctx.fillStyle = coreG; applyMobileShadow(ctx, "#aa00ff", 30)
        ctx.beginPath(); ctx.arc(cx, cy, coreR, 0, Math.PI * 2); ctx.fill()
        ctx.restore()
    },
}