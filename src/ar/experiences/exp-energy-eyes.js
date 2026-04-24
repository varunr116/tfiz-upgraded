import { state, applyMobileShadow } from "../state.js"
import { FACE_IDX } from "../constants.js"

function faceAvg(face, indices) {
    let x = 0, y = 0, z = 0
    for (const i of indices) { x += face[i].x; y += face[i].y; z += face[i].z || 0 }
    return { x: x / indices.length, y: y / indices.length, z: z / indices.length }
}

function drawEnergyEyes(ctx, face, t) {
    const ts = state.toScreen
    const lEyeC = faceAvg(face, [33, 133, 159, 145, 153, 144])
    const rEyeC = faceAvg(face, [362, 263, 386, 374, 380, 373])
    const lEye = ts(lEyeC.x, lEyeC.y), rEye = ts(rEyeC.x, rEyeC.y)
    const faceW = Math.hypot(
        ts(face[FACE_IDX.L_TEMPLE].x, face[FACE_IDX.L_TEMPLE].y).x - ts(face[FACE_IDX.R_TEMPLE].x, face[FACE_IDX.R_TEMPLE].y).x,
        ts(face[FACE_IDX.L_TEMPLE].x, face[FACE_IDX.L_TEMPLE].y).y - ts(face[FACE_IDX.R_TEMPLE].x, face[FACE_IDX.R_TEMPLE].y).y,
    )
    const eyeR = faceW * 0.06
    const eyeDir = { x: 0, y: 0.4, len: state.screen.h * 1.5 }
    ctx.save()
        ;[lEye, rEye].forEach((eye, ei) => {
            const bx = eye.x + eyeDir.x * eyeDir.len, by = eye.y + eyeDir.y * eyeDir.len
            for (let layer = 3; layer >= 0; layer--) {
                const bw = (layer + 1) * eyeR * 0.8
                const alpha = (0.5 - layer * 0.1) * (0.7 + Math.sin(t * 6 + ei) * 0.3)
                const beamG = ctx.createLinearGradient(eye.x, eye.y, bx, by)
                beamG.addColorStop(0, `rgba(255,${layer < 2 ? 50 : 150},${layer === 0 ? 200 : 50},${alpha})`)
                beamG.addColorStop(0.4, `rgba(255,${layer < 2 ? 20 : 80},0,${alpha * 0.7})`)
                beamG.addColorStop(1, `rgba(255,0,0,0)`)
                ctx.strokeStyle = beamG; ctx.lineWidth = bw; ctx.globalAlpha = 1; ctx.lineCap = "round"
                applyMobileShadow(ctx, "#ff2200", layer === 0 ? 20 : 5)
                ctx.beginPath(); ctx.moveTo(eye.x, eye.y); ctx.lineTo(bx, by); ctx.stroke()
            }
            const pulse = 0.7 + Math.sin(t * 5 + ei * Math.PI) * 0.3
            const sockG = ctx.createRadialGradient(eye.x, eye.y, 0, eye.x, eye.y, eyeR * 2.5)
            sockG.addColorStop(0, `rgba(255,255,200,${0.95 * pulse})`)
            sockG.addColorStop(0.3, `rgba(255,80,0,${0.85 * pulse})`)
            sockG.addColorStop(0.7, `rgba(200,0,0,${0.4 * pulse})`)
            sockG.addColorStop(1, "rgba(100,0,0,0)")
            ctx.globalAlpha = 1; ctx.fillStyle = sockG; applyMobileShadow(ctx, "#ff4400", 20)
            ctx.beginPath(); ctx.arc(eye.x, eye.y, eyeR * 2.5, 0, Math.PI * 2); ctx.fill()
            applyMobileShadow(ctx, "#ff4400", 15)
            for (let s = 0; s < 8; s++) {
                const sa = (s / 8) * Math.PI * 2 + t * 4, sl = eyeR * (1.0 + Math.random() * 1.5)
                const sx = bx + Math.cos(sa) * sl, sy = by + Math.sin(sa) * sl
                ctx.strokeStyle = s % 2 === 0 ? "#ff6600" : "#ffcc00"; ctx.lineWidth = 1.5 + Math.sin(t * 8 + s) * 1
                ctx.globalAlpha = 0.6 + Math.sin(t * 6 + s) * 0.4
                ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(sx, sy); ctx.stroke()
            }
        })
    ctx.restore()
}

export const EXP_ENERGY_EYES = {
    name: "👁  ENERGY EYES", useWings: false, useMask: false, useFace: false,
    onFrame(results, ctx, t, deps) {
        const { expDot, expStatus } = deps
        const face = results.faceLandmarks
        if (!face || !state.toScreen) { expDot.className = "hud-dot off"; expStatus.textContent = "SHOW YOUR FACE"; return }
        drawEnergyEyes(ctx, face, t)
        expDot.className = "hud-dot"; expStatus.textContent = "BEAM ACTIVE"
    },
}