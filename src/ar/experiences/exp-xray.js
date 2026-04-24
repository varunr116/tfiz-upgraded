import { state, isMobile, applyMobileShadow } from "../state.js"

const xrayHistory = []

function drawXraySkeleton(ctx, pose, face, t) {
    if (!pose || !state.toScreen) return
    const ts = state.toScreen
    const W = state.screen.w, H = state.screen.h
    xrayHistory.push(pose)
    if (xrayHistory.length > 4) xrayHistory.shift()
    const smoothed = pose.map((_lm, i) => {
        let sx = 0, sy = 0
        xrayHistory.forEach(h => { sx += h[i].x; sy += h[i].y })
        return { x: sx / xrayHistory.length, y: sy / xrayHistory.length }
    })
    const p = idx => ts(smoothed[idx].x, smoothed[idx].y)
    const NOSE = 0, LSH = 11, RSH = 12, LEL = 13, REL = 14, LWR = 15, RWR = 16, LHI = 23, RHI = 24, LKN = 25, RKN = 26, LAN = 27, RAN = 28
    ctx.save()
    const scanY = (((t * 0.4) % 1.2) - 0.1) * H
    const scanG = ctx.createLinearGradient(0, scanY - 60, 0, scanY + 60)
    scanG.addColorStop(0, "rgba(0,255,120,0)"); scanG.addColorStop(0.5, "rgba(0,255,120,0.06)"); scanG.addColorStop(1, "rgba(0,255,120,0)")
    ctx.fillStyle = scanG; ctx.globalAlpha = 1; ctx.fillRect(0, scanY - 60, W, 120)
    const bSize = 28, bW = 2
    const corners = [[20, 20], [W - 20, 20], [20, H - 20], [W - 20, H - 20]]
    const signs = [[1, 1], [-1, 1], [1, -1], [-1, -1]]
    ctx.strokeStyle = "#00ff88"; ctx.lineWidth = bW; applyMobileShadow(ctx, "#00ff88", 8); ctx.globalAlpha = 0.7
    corners.forEach(([cx2, cy2], i) => {
        const [sx, sy] = signs[i]
        ctx.beginPath(); ctx.moveTo(cx2 + sx * bSize, cy2); ctx.lineTo(cx2, cy2); ctx.lineTo(cx2, cy2 + sy * bSize); ctx.stroke()
    })
    const BONE_PAIRS = [[NOSE, LSH], [NOSE, RSH], [LSH, RSH], [LSH, LHI], [RSH, RHI], [LHI, RHI], [LSH, LEL], [LEL, LWR], [RSH, REL], [REL, RWR], [LHI, LKN], [LKN, LAN], [RHI, RKN], [RKN, RAN]]
    ctx.lineCap = "round"; ctx.lineJoin = "round"
    BONE_PAIRS.forEach(([a, b]) => {
        const pa = p(a), pb = p(b)
        const boneLen = Math.hypot(pb.x - pa.x, pb.y - pa.y); if (boneLen < 5) return
        ctx.strokeStyle = "rgba(0,255,140,0.18)"; ctx.lineWidth = 16; ctx.shadowBlur = 0; ctx.globalAlpha = 1
        ctx.beginPath(); ctx.moveTo(pa.x, pa.y); ctx.lineTo(pb.x, pb.y); ctx.stroke()
        ctx.strokeStyle = "rgba(0,255,140,0.45)"; ctx.lineWidth = 7; applyMobileShadow(ctx, "#00ff88", 12)
        ctx.beginPath(); ctx.moveTo(pa.x, pa.y); ctx.lineTo(pb.x, pb.y); ctx.stroke()
        const boneG = ctx.createLinearGradient(pa.x, pa.y, pb.x, pb.y)
        boneG.addColorStop(0, "rgba(180,255,210,0.95)"); boneG.addColorStop(0.5, "rgba(255,255,255,1.0)"); boneG.addColorStop(1, "rgba(180,255,210,0.95)")
        ctx.strokeStyle = boneG; ctx.lineWidth = 2.5; ctx.shadowBlur = 6
        ctx.beginPath(); ctx.moveTo(pa.x, pa.y); ctx.lineTo(pb.x, pb.y); ctx.stroke()
        ctx.strokeStyle = "rgba(0,180,100,0.3)"; ctx.lineWidth = 1; ctx.shadowBlur = 0; ctx.setLineDash([4, 6])
        ctx.beginPath(); ctx.moveTo(pa.x, pa.y); ctx.lineTo(pb.x, pb.y); ctx.stroke(); ctx.setLineDash([])
    })
    const JOINTS = [NOSE, LSH, RSH, LEL, REL, LWR, RWR, LHI, RHI, LKN, RKN, LAN, RAN]
    JOINTS.forEach(idx => {
        const jp = p(idx), isLarge = [NOSE, LSH, RSH, LHI, RHI].includes(idx), r = isLarge ? 10 : 7
        const pulse = 0.7 + Math.sin(t * 4 + idx * 0.5) * 0.3
        ctx.strokeStyle = `rgba(0,255,140,${0.5 * pulse})`; ctx.lineWidth = 1.5
        applyMobileShadow(ctx, "#00ff88", 12); ctx.globalAlpha = 1
        ctx.beginPath(); ctx.arc(jp.x, jp.y, r * 1.8, 0, Math.PI * 2); ctx.stroke()
        const jG = ctx.createRadialGradient(jp.x, jp.y, 0, jp.x, jp.y, r)
        jG.addColorStop(0, `rgba(255,255,255,${0.9 * pulse})`); jG.addColorStop(0.4, `rgba(0,255,140,${0.8 * pulse})`); jG.addColorStop(1, `rgba(0,100,60,${0.3 * pulse})`)
        ctx.fillStyle = jG; ctx.shadowBlur = 10; ctx.beginPath(); ctx.arc(jp.x, jp.y, r, 0, Math.PI * 2); ctx.fill()
    })
    if (!isMobile && face && face.length > 400) {
        const skullPts = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109]
        ctx.beginPath()
        skullPts.forEach((idx, i) => {
            const sp = ts(face[idx].x, face[idx].y)
            if (i === 0) ctx.moveTo(sp.x, sp.y); else ctx.lineTo(sp.x, sp.y)
        })
        ctx.closePath(); ctx.fillStyle = "rgba(0,255,140,0.08)"; ctx.strokeStyle = "rgba(0,255,140,0.55)"
        ctx.lineWidth = 1.5; applyMobileShadow(ctx, "#00ff88", 10); ctx.globalAlpha = 0.85; ctx.fill(); ctx.stroke()
            ;[[33, 133, 159, 145], [362, 263, 386, 374]].forEach(eyeIdxs => {
                const eyePts = eyeIdxs.map(i => ts(face[i].x, face[i].y))
                const ecx = eyePts.reduce((s, p2) => s + p2.x, 0) / eyePts.length
                const ecy = eyePts.reduce((s, p2) => s + p2.y, 0) / eyePts.length
                const er = Math.hypot(eyePts[0].x - eyePts[1].x, eyePts[0].y - eyePts[1].y) * 0.55
                ctx.fillStyle = "rgba(0,0,0,0.7)"; ctx.strokeStyle = "rgba(0,255,140,0.8)"
                applyMobileShadow(ctx, "rgba(0,255,140,0.8)", 12); ctx.lineWidth = 1.5; ctx.globalAlpha = 0.9
                ctx.beginPath(); ctx.ellipse(ecx, ecy, er, er * 0.65, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke()
                const egG = ctx.createRadialGradient(ecx, ecy, 0, ecx, ecy, er)
                egG.addColorStop(0, "rgba(0,255,100,0.4)"); egG.addColorStop(1, "rgba(0,0,0,0)")
                ctx.fillStyle = egG; ctx.beginPath(); ctx.ellipse(ecx, ecy, er, er * 0.65, 0, 0, Math.PI * 2); ctx.fill()
            })
    }
    ctx.font = "10px Courier New"; ctx.textAlign = "left"; ctx.fillStyle = "#00ff88"
    applyMobileShadow(ctx, "#00ff88", 6); ctx.globalAlpha = 0.75
    const nose2 = p(NOSE)
        ;[[nose2.x + 30, nose2.y - 20, "SKULL INTEGRITY: 100%"], [nose2.x + 30, nose2.y - 5, "BONE DENSITY: HIGH"], [nose2.x + 30, nose2.y + 10, `JOINTS TRACKED: ${JOINTS.length}`]].forEach(([rx, ry, txt]) => ctx.fillText(txt, rx, ry))
    ctx.restore()
}

export const EXP_XRAY = {
    name: "🦴  X-RAY SKELETON", useWings: false, useMask: false, useFace: false,
    onFrame(results, ctx, t, deps) {
        const { expDot, expStatus } = deps
        drawXraySkeleton(ctx, results.poseLandmarks, results.faceLandmarks, t)
        expDot.className = results.poseLandmarks ? "hud-dot" : "hud-dot off"
        expStatus.textContent = results.poseLandmarks ? "SCANNING ✓" : "STAND IN FRAME"
    },
}