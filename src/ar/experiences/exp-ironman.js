import { state, isMobile, applyMobileShadow } from "../state.js"
import { POSE_IDX } from "../constants.js"

const chestParticles = []

export const EXP_IRONMAN_CHEST = {
    name: "🔴  IRON MAN", useWings: false, useMask: false, useFace: false,
    onFrame(results, ctx, t, deps) {
        const { expDot, expStatus } = deps
        const pose = results.poseLandmarks
        if (!pose || !state.toScreen) { expDot.className = "hud-dot off"; expStatus.textContent = "STAND IN FRAME"; return }
        const ls = pose[POSE_IDX.L_SHOULDER], rs = pose[POSE_IDX.R_SHOULDER]
        if (!ls || !rs) return
        const ts = state.toScreen
        const lsp = ts(ls.x, ls.y), rsp = ts(rs.x, rs.y)
        const cx = (lsp.x + rsp.x) / 2
        const cy = (lsp.y + rsp.y) / 2 + Math.hypot(rsp.x - lsp.x, rsp.y - lsp.y) * 0.55
        const shoulderW = Math.hypot(rsp.x - lsp.x, rsp.y - lsp.y)
        const R = shoulderW * 0.22
        if (R < 10) return
        ctx.save()
        const fieldPulse = 0.7 + Math.sin(t * 2.8) * 0.3
        const fieldG = ctx.createRadialGradient(cx, cy, R * 0.5, cx, cy, R * 2.8)
        fieldG.addColorStop(0, `rgba(0,180,255,${0.12 * fieldPulse})`)
        fieldG.addColorStop(0.5, `rgba(0,100,200,${0.06 * fieldPulse})`)
        fieldG.addColorStop(1, "rgba(0,0,100,0)")
        ctx.fillStyle = fieldG; ctx.shadowBlur = 0
        ctx.beginPath(); ctx.arc(cx, cy, R * 2.8, 0, Math.PI * 2); ctx.fill()
        const SEG = 36
        for (let i = 0; i < SEG; i++) {
            const a0 = (i / SEG) * Math.PI * 2 + t * 0.6, a1 = ((i + 0.7) / SEG) * Math.PI * 2 + t * 0.6
            ctx.strokeStyle = i % 4 === 0 ? "#ffffff" : "#00aaff"
            ctx.lineWidth = i % 4 === 0 ? 2.5 : 1.2; ctx.globalAlpha = i % 4 === 0 ? 0.9 : 0.45
            applyMobileShadow(ctx, "#00e5ff", 10)
            ctx.beginPath(); ctx.arc(cx, cy, R * 1.4, a0, a1); ctx.stroke()
        }
        for (let i = 0; i < 18; i++) {
            const a0 = (i / 18) * Math.PI * 2 - t * 1.2, a1 = a0 + Math.PI * 0.08
            ctx.strokeStyle = "#ff6600"; ctx.lineWidth = 2.0; ctx.globalAlpha = 0.75
            applyMobileShadow(ctx, "#ff4400", 12)
            ctx.beginPath(); ctx.arc(cx, cy, R * 1.08, a0, a1); ctx.stroke()
        }
        ctx.globalAlpha = 0.9; applyMobileShadow(ctx, "#00e5ff", 20)
        ctx.strokeStyle = "#00e5ff"; ctx.lineWidth = 2
        const triR = R * 0.62
        ctx.beginPath()
        for (let i = 0; i < 3; i++) {
            const a = (i / 3) * Math.PI * 2 - Math.PI / 2 + t * 0.3
            if (i === 0) ctx.moveTo(cx + Math.cos(a) * triR, cy + Math.sin(a) * triR)
            else ctx.lineTo(cx + Math.cos(a) * triR, cy + Math.sin(a) * triR)
        }
        ctx.closePath(); ctx.stroke()
        ctx.strokeStyle = "#4488ff"; ctx.lineWidth = 1.5; ctx.shadowBlur = 8
        const hexR = R * 0.42
        ctx.beginPath()
        for (let i = 0; i < 6; i++) {
            const a = (i / 6) * Math.PI * 2 + t * 0.5
            if (i === 0) ctx.moveTo(cx + Math.cos(a) * hexR, cy + Math.sin(a) * hexR)
            else ctx.lineTo(cx + Math.cos(a) * hexR, cy + Math.sin(a) * hexR)
        }
        ctx.closePath(); ctx.stroke()
        const cPulse = 0.85 + Math.sin(t * 5.0) * 0.15
        const coreG = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 0.38)
        coreG.addColorStop(0, `rgba(200,240,255,${cPulse})`)
        coreG.addColorStop(0.3, `rgba(0,180,255,${0.9 * cPulse})`)
        coreG.addColorStop(0.7, `rgba(0,80,200,${0.5 * cPulse})`)
        coreG.addColorStop(1, "rgba(0,0,100,0)")
        ctx.globalAlpha = 1; ctx.fillStyle = coreG; applyMobileShadow(ctx, "#00e5ff", 30)
        ctx.beginPath(); ctx.arc(cx, cy, R * 0.38, 0, Math.PI * 2); ctx.fill()
        ctx.shadowBlur = 5
        for (let i = 0; i < 48; i++) {
            const a = (i / 48) * Math.PI * 2 + t * 0.6, major = i % 6 === 0
            ctx.strokeStyle = major ? "#ffffff" : "#0088cc"; ctx.lineWidth = major ? 2.5 : 1
            ctx.globalAlpha = major ? 1.0 : 0.5
            const r0 = R * 1.4, r1 = R * (major ? 1.58 : 1.5)
            ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0)
            ctx.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1); ctx.stroke()
        }
        ;[lsp, rsp].forEach(sh => {
            const streamG = ctx.createLinearGradient(cx, cy, sh.x, sh.y)
            streamG.addColorStop(0, "rgba(0,229,255,0.6)"); streamG.addColorStop(1, "rgba(0,229,255,0)")
            ctx.strokeStyle = streamG; ctx.lineWidth = 2; applyMobileShadow(ctx, "#00e5ff", 12)
            ctx.globalAlpha = 0.5 + Math.sin(t * 3 + (sh === lsp ? 0 : 1)) * 0.25
            ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(sh.x, sh.y); ctx.stroke()
        })
        if (chestParticles.length < (isMobile ? 14 : 30) && Math.random() < 0.5) {
            const a = Math.random() * Math.PI * 2
            chestParticles.push({
                x: cx + Math.cos(a) * R * 1.4, y: cy + Math.sin(a) * R * 1.4,
                vx: (Math.random() - 0.5) * 2, vy: (Math.random() - 1.5) * 2.5,
                life: 1, decay: 0.025 + Math.random() * 0.03, size: 2 + Math.random() * 3, type: Math.floor(Math.random() * 3)
            })
        }
        const pcols = ["#00e5ff", "#ff6600", "#ffffff"]
        for (let i = chestParticles.length - 1; i >= 0; i--) {
            const p = chestParticles[i]; p.x += p.vx; p.y += p.vy; p.vy -= 0.05; p.life -= p.decay
            if (p.life <= 0) { chestParticles.splice(i, 1); continue }
            ctx.globalAlpha = p.life * 0.85; ctx.fillStyle = pcols[p.type]
            ctx.shadowColor = pcols[p.type]; ctx.shadowBlur = 8
            ctx.beginPath(); ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2); ctx.fill()
        }
        ctx.restore()
        expDot.className = "hud-dot"; expStatus.textContent = "REACTOR ONLINE"
    },
}