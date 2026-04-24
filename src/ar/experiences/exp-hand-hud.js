import { state, isMobile, applyMobileShadow } from "../state.js"
import { HAND_IDX, FINGER_CHAINS, FINGER_TIPS, KNUCKLES } from "../constants.js"

const particles = { left: [], right: [] }

function spawnAndUpdateParticles(cx, cy, r, side) {
    const arr = particles[side]
    if (arr.length < (isMobile ? 8 : 20) && Math.random() < 0.4) {
        const a = Math.random() * Math.PI * 2
        arr.push({
            x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r,
            vx: (Math.random() - 0.5) * 3, vy: (Math.random() - 1) * 3,
            life: 1, decay: 0.035 + Math.random() * 0.04,
            size: 1.5 + Math.random() * 3, cyan: Math.random() < 0.6
        })
    }
    for (let i = arr.length - 1; i >= 0; i--) {
        const p = arr[i]; p.x += p.vx; p.y += p.vy; p.vy += 0.1; p.life -= p.decay
        if (p.life <= 0) arr.splice(i, 1)
    }
}

function drawArcReactor(ctx, hand, side, t) {
    if (!hand || !state.toScreen) return
    const ts = state.toScreen
    const palm = ts(hand[HAND_IDX.MIDDLE_MCP].x, hand[HAND_IDX.MIDDLE_MCP].y)
    const wrist = ts(hand[HAND_IDX.WRIST].x, hand[HAND_IDX.WRIST].y)
    const midTip = ts(hand[HAND_IDX.MIDDLE_TIP].x, hand[HAND_IDX.MIDDLE_TIP].y)
    const r = Math.hypot(midTip.x - wrist.x, midTip.y - wrist.y) * 0.36
    if (r < 12) return
    const cx = palm.x, cy = palm.y
    const CYAN = "#00e5ff", ORG = "#ff6600"
    ctx.save()
    FINGER_CHAINS.forEach(chain => {
        for (let i = 0; i < chain.length - 1; i++) {
            const pa = ts(hand[chain[i]].x, hand[chain[i]].y)
            const pb = ts(hand[chain[i + 1]].x, hand[chain[i + 1]].y)
            const ratio = i / (chain.length - 2)
            const g = ctx.createLinearGradient(pa.x, pa.y, pb.x, pb.y)
            g.addColorStop(0, "rgba(0,229,255," + (0.75 - ratio * 0.2) + ")")
            g.addColorStop(1, "rgba(255," + Math.round(80 + ratio * 150) + ",0," + (0.5 + ratio * 0.45) + ")")
            ctx.strokeStyle = g; ctx.lineWidth = 1.6 + ratio * 0.9
            applyMobileShadow(ctx, CYAN, 7)
            ctx.beginPath(); ctx.moveTo(pa.x, pa.y); ctx.lineTo(pb.x, pb.y); ctx.stroke()
        }
    })
    hand.forEach((lm, i) => {
        const p = ts(lm.x, lm.y)
        const tip = FINGER_TIPS.has(i), knuc = KNUCKLES.has(i)
        const rad = tip ? 5.5 : knuc ? 4 : i === 0 ? 6.5 : 3
        const col = tip ? ORG : CYAN
        ctx.fillStyle = col; applyMobileShadow(ctx, col, tip ? 16 : 9)
        ctx.globalAlpha = 0.92; ctx.beginPath(); ctx.arc(p.x, p.y, rad, 0, Math.PI * 2); ctx.fill()
    })
    ctx.globalAlpha = 1; ctx.shadowBlur = 0
    const SEG = 28, GAP = 0.07
    ctx.strokeStyle = CYAN; ctx.lineWidth = 1.5; applyMobileShadow(ctx, CYAN, 9)
    for (let i = 0; i < SEG; i++) {
        const a0 = (i / SEG) * Math.PI * 2 + t * 0.45
        const a1 = ((i + 1) / SEG) * Math.PI * 2 - GAP + t * 0.45
        ctx.globalAlpha = i % 7 === 0 ? 1.0 : 0.6
        ctx.beginPath(); ctx.arc(cx, cy, r * 1.18, a0, a1); ctx.stroke()
    }
    ctx.strokeStyle = ORG; ctx.lineWidth = 2.2; applyMobileShadow(ctx, ORG, 14)
    for (let i = 0; i < 6; i++) {
        if (i % 2 === 0) continue
        const a0 = (i / 6) * Math.PI * 2 - t * 2.0, a1 = ((i + 0.65) / 6) * Math.PI * 2 - t * 2.0
        ctx.globalAlpha = 0.85; ctx.beginPath(); ctx.arc(cx, cy, r * 0.84, a0, a1); ctx.stroke()
    }
    ctx.strokeStyle = "rgba(0,229,255,0.65)"; ctx.lineWidth = 1; ctx.shadowBlur = 5
    for (let i = 0; i < 14; i++) {
        const a0 = (i / 14) * Math.PI * 2 + t * 3.5, a1 = a0 + Math.PI / 16
        ctx.globalAlpha = 0.7; ctx.beginPath(); ctx.arc(cx, cy, r * 0.62, a0, a1); ctx.stroke()
    }
    ctx.shadowBlur = 5
    for (let i = 0; i < 24; i++) {
        const a = (i / 24) * Math.PI * 2 + t * 0.45, major = i % 6 === 0
        ctx.strokeStyle = major ? "#ffffff" : CYAN; ctx.lineWidth = major ? 2.5 : 1
        ctx.globalAlpha = major ? 1.0 : 0.55
        const r0 = r * 1.21, r1 = r * (major ? 1.37 : 1.29)
        ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0)
        ctx.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1); ctx.stroke()
    }
    const scanA = (t * 2.4) % (Math.PI * 2)
    ctx.globalAlpha = 0.22; ctx.fillStyle = "rgba(0,229,255,0.18)"; ctx.shadowBlur = 0
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, r * 1.15, scanA, scanA + Math.PI * 0.42); ctx.closePath(); ctx.fill()
    ctx.globalAlpha = 0.75; ctx.strokeStyle = CYAN; ctx.lineWidth = 1.5; applyMobileShadow(ctx, CYAN, 12)
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(scanA) * r * 1.18, cy + Math.sin(scanA) * r * 1.18); ctx.stroke()
    const pulse = 0.8 + Math.sin(t * 4.2) * 0.2, orbR = r * 0.21 * pulse
    const coroG = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 0.5)
    coroG.addColorStop(0, "rgba(0,229,255," + 0.22 * pulse + ")"); coroG.addColorStop(1, "rgba(0,229,255,0)")
    ctx.globalAlpha = 1; ctx.fillStyle = coroG; ctx.shadowBlur = 0
    ctx.beginPath(); ctx.arc(cx, cy, r * 0.5, 0, Math.PI * 2); ctx.fill()
    const coreG = ctx.createRadialGradient(cx, cy, 0, cx, cy, orbR)
    coreG.addColorStop(0, "rgba(255,230,90," + 0.98 * pulse + ")")
    coreG.addColorStop(0.45, "rgba(255,90,0," + 0.85 * pulse + ")")
    coreG.addColorStop(1, "rgba(0,180,255,0)")
    ctx.fillStyle = coreG; applyMobileShadow(ctx, "#ff8800", 24)
    ctx.beginPath(); ctx.arc(cx, cy, orbR, 0, Math.PI * 2); ctx.fill()
    spawnAndUpdateParticles(cx, cy, r * 1.05, side)
    ctx.shadowBlur = 10
    particles[side].forEach(p => {
        ctx.globalAlpha = p.life * 0.9; ctx.fillStyle = p.cyan ? CYAN : ORG
        ctx.shadowColor = p.cyan ? CYAN : ORG
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2); ctx.fill()
    })
    ctx.globalAlpha = 0.7; ctx.strokeStyle = CYAN; ctx.lineWidth = 1.8; ctx.shadowBlur = 7
    const bR = r * 1.55, bS = r * 0.22
        ;[[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([sx, sy]) => {
            const bx = cx + sx * bR * 0.7, by = cy + sy * bR * 0.7
            ctx.beginPath(); ctx.moveTo(bx, by - sy * bS); ctx.lineTo(bx, by); ctx.lineTo(bx + sx * bS, by); ctx.stroke()
        })
    const angle = Math.round((Math.atan2(midTip.y - wrist.y, midTip.x - wrist.x) * 180) / Math.PI + 90)
    ctx.shadowColor = CYAN; ctx.shadowBlur = 10; ctx.fillStyle = CYAN
    ctx.textAlign = "center"; ctx.globalAlpha = 0.92
    ctx.font = "bold " + Math.round(r * 0.28) + "px Courier New"
    ctx.fillText(Math.abs(angle) + "°", cx + r * 1.8, cy + r * 0.1)
    ctx.font = Math.round(r * 0.17) + "px Courier New"; ctx.globalAlpha = 0.75
    const dots = ["", ".", "..", "..", ".", ""][Math.floor(t * 3) % 6]
    ctx.fillText("SCAN" + dots, cx, cy + r * 1.65); ctx.fillText(side.toUpperCase() + " HAND", cx, cy + r * 1.88)
    ctx.restore()
}

export const EXP_HAND_HUD = {
    name: "⚡  ARC REACTOR", useWings: false, useMask: false, useFace: false,
    onFrame(results, ctx, t, deps) {
        const { expDot, expStatus } = deps
        drawArcReactor(ctx, results.leftHandLandmarks, "left", t)
        drawArcReactor(ctx, results.rightHandLandmarks, "right", t)
        const lh = !!results.leftHandLandmarks, rh = !!results.rightHandLandmarks
        expDot.className = "hud-dot " + (lh || rh ? "" : "off")
        expStatus.textContent = lh || rh ? "HAND " + (lh ? "L✓" : "") + " " + (rh ? "R✓" : "") : "RAISE YOUR HAND"
    },
}