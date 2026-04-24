// ─── exp-kalki.js ─────────────────────────────────────────────
// Iron Man MK50 Helmet + Chest Armor — pure 2D canvas overlay
// Replaces the Kalki GLB slot. No Three.js. No GLB required.
// Uses state.toScreen for landmark → screen coord mapping.
// ──────────────────────────────────────────────────────────────
import { state } from "../state.js"
import { POSE_IDX } from "../constants.js"

// ── Face landmark indices (from MediaPipe Holistic faceLandmarks) ──
const FACE_IDX = {
    FOREHEAD_TOP: 10,
    CHIN: 152,
    LEFT_EAR: 234,
    RIGHT_EAR: 454,
}

// ── Smooth state (lerp targets) ──
const smooth = {
    helmet: { x: 0, y: 0, w: 0, h: 0, angle: 0, active: false },
    armor: { x: 0, y: 0, w: 0, h: 0, active: false },
}

function lerp(a, b, t) { return a + (b - a) * t }

function lerpSmooth(obj, target, t) {
    obj.x = lerp(obj.x, target.x, t)
    obj.y = lerp(obj.y, target.y, t)
    obj.w = lerp(obj.w, target.w, t)
    obj.h = lerp(obj.h, target.h, t)
    if (target.angle !== undefined)
        obj.angle = lerp(obj.angle, target.angle, t)
}

// ─────────────────────────────────────────────────────────────
// IRON MAN HELMET  (canvas 2D, MK50 proportions)
// ─────────────────────────────────────────────────────────────
function drawHelmet(ctx, x, y, w, h, angle) {
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(angle)

    const hw = w / 2, hh = h / 2

    ctx.shadowColor = "#ff4400"
    ctx.shadowBlur = 28

    // ── Dome (upper 65%) ──
    ctx.beginPath()
    ctx.moveTo(-hw * 0.55, hh * 0.15)
    ctx.bezierCurveTo(-hw * 0.7, -hh * 0.3, -hw * 0.5, -hh * 0.95, 0, -hh)
    ctx.bezierCurveTo(hw * 0.5, -hh * 0.95, hw * 0.7, -hh * 0.3, hw * 0.55, hh * 0.15)
    ctx.closePath()
    const domeG = ctx.createLinearGradient(0, -hh, 0, hh * 0.15)
    domeG.addColorStop(0, "#c0392b")
    domeG.addColorStop(0.4, "#e74c3c")
    domeG.addColorStop(1, "#922b21")
    ctx.fillStyle = domeG; ctx.fill()
    ctx.strokeStyle = "#ff6b4a"; ctx.lineWidth = 1.5; ctx.globalAlpha = 0.6; ctx.stroke()
    ctx.globalAlpha = 1

    // ── Face plate (lower 55%) ──
    ctx.beginPath()
    ctx.moveTo(-hw * 0.55, hh * 0.15)
    ctx.lineTo(-hw * 0.62, hh * 0.45)
    ctx.bezierCurveTo(-hw * 0.62, hh * 0.9, -hw * 0.2, hh, 0, hh)
    ctx.bezierCurveTo(hw * 0.2, hh, hw * 0.62, hh * 0.9, hw * 0.62, hh * 0.45)
    ctx.lineTo(hw * 0.55, hh * 0.15)
    ctx.closePath()
    const faceG = ctx.createLinearGradient(0, hh * 0.15, 0, hh)
    faceG.addColorStop(0, "#c0392b")
    faceG.addColorStop(0.5, "#a93226")
    faceG.addColorStop(1, "#7b241c")
    ctx.fillStyle = faceG; ctx.fill()
    ctx.strokeStyle = "#e74c3c"; ctx.lineWidth = 1; ctx.globalAlpha = 0.5; ctx.stroke()
    ctx.globalAlpha = 1

    // ── Eye slots (glowing cyan) ──
    ctx.shadowColor = "#00e5ff"; ctx.shadowBlur = 20
    const eyeY = -hh * 0.08, eyeW = hw * 0.28, eyeH = hh * 0.1, eyeGap = hw * 0.1
    ctx.fillStyle = "#00e5ff"
    ctx.beginPath(); ctx.ellipse(-eyeGap - eyeW * 0.5, eyeY, eyeW * 0.5, eyeH * 0.5, -0.2, 0, Math.PI * 2); ctx.fill()
    ctx.beginPath(); ctx.ellipse(eyeGap + eyeW * 0.5, eyeY, eyeW * 0.5, eyeH * 0.5, 0.2, 0, Math.PI * 2); ctx.fill()
    ctx.shadowBlur = 6; ctx.fillStyle = "#ffffff"; ctx.globalAlpha = 0.7
    ctx.beginPath(); ctx.ellipse(-eyeGap - eyeW * 0.5, eyeY, eyeW * 0.2, eyeH * 0.2, -0.2, 0, Math.PI * 2); ctx.fill()
    ctx.beginPath(); ctx.ellipse(eyeGap + eyeW * 0.5, eyeY, eyeW * 0.2, eyeH * 0.2, 0.2, 0, Math.PI * 2); ctx.fill()
    ctx.globalAlpha = 1; ctx.shadowBlur = 0

    // ── Nose/chin seam ──
    ctx.beginPath(); ctx.moveTo(0, hh * 0.15); ctx.lineTo(0, hh * 0.82)
    ctx.strokeStyle = "#7b241c"; ctx.lineWidth = 1.5; ctx.globalAlpha = 0.7; ctx.stroke()
    ctx.globalAlpha = 1

        // ── Cheek panel lines ──
        ;[[-1], [1]].forEach(([side]) => {
            ctx.beginPath()
            ctx.moveTo(side * hw * 0.3, hh * 0.18)
            ctx.lineTo(side * hw * 0.58, hh * 0.4)
            ctx.strokeStyle = "#7b241c"; ctx.lineWidth = 1; ctx.globalAlpha = 0.6; ctx.stroke()
        })
    ctx.globalAlpha = 1

    // ── Forehead detail line ──
    ctx.beginPath(); ctx.moveTo(-hw * 0.3, -hh * 0.55); ctx.lineTo(hw * 0.3, -hh * 0.55)
    ctx.strokeStyle = "#ff6b4a"; ctx.lineWidth = 1; ctx.globalAlpha = 0.4; ctx.stroke()
    ctx.globalAlpha = 1

    // ── Metallic sheen ──
    const sheen = ctx.createRadialGradient(-hw * 0.2, -hh * 0.5, 0, 0, 0, hw)
    sheen.addColorStop(0, "rgba(255,255,255,0.12)")
    sheen.addColorStop(0.5, "rgba(255,255,255,0)")
    ctx.fillStyle = sheen
    ctx.beginPath(); ctx.ellipse(0, -hh * 0.2, hw * 0.8, hh * 0.7, 0, 0, Math.PI * 2); ctx.fill()

    ctx.shadowBlur = 0
    ctx.restore()
}

// ─────────────────────────────────────────────────────────────
// IRON MAN CHEST ARMOR  (canvas 2D, arc reactor + plate panels)
// ─────────────────────────────────────────────────────────────
function drawArmor(ctx, x, y, w, h) {
    ctx.save()
    ctx.translate(x, y)

    const hw = w / 2, hh = h / 2

    ctx.shadowColor = "#ff4400"; ctx.shadowBlur = 22

    // ── Main chest plate ──
    ctx.beginPath()
    ctx.moveTo(-hw, -hh * 0.85)
    ctx.lineTo(-hw * 0.72, -hh)
    ctx.lineTo(hw * 0.72, -hh)
    ctx.lineTo(hw, -hh * 0.85)
    ctx.lineTo(hw, hh * 0.6)
    ctx.bezierCurveTo(hw, hh * 0.9, hw * 0.5, hh, 0, hh)
    ctx.bezierCurveTo(-hw * 0.5, hh, -hw, hh * 0.9, -hw, hh * 0.6)
    ctx.closePath()
    const plateG = ctx.createLinearGradient(0, -hh, 0, hh)
    plateG.addColorStop(0, "#c0392b")
    plateG.addColorStop(0.3, "#e74c3c")
    plateG.addColorStop(0.7, "#a93226")
    plateG.addColorStop(1, "#7b241c")
    ctx.fillStyle = plateG; ctx.fill()
    ctx.strokeStyle = "#ff6b4a"; ctx.lineWidth = 1.5; ctx.globalAlpha = 0.5; ctx.stroke()
    ctx.globalAlpha = 1

    // ── Gold collar ──
    ctx.beginPath()
    ctx.moveTo(-hw * 0.72, -hh)
    ctx.lineTo(-hw * 0.45, -hh * 0.75)
    ctx.lineTo(hw * 0.45, -hh * 0.75)
    ctx.lineTo(hw * 0.72, -hh)
    ctx.closePath()
    const collarG = ctx.createLinearGradient(0, -hh, 0, -hh * 0.75)
    collarG.addColorStop(0, "#f39c12"); collarG.addColorStop(1, "#d68910")
    ctx.fillStyle = collarG; ctx.fill()

    ctx.shadowBlur = 0

        // ── Shoulder detail lines ──
        ;[[-1], [1]].forEach(([side]) => {
            ctx.beginPath()
            ctx.moveTo(side * hw * 0.72, -hh * 0.95)
            ctx.lineTo(side * hw * 0.55, -hh * 0.6)
            ctx.strokeStyle = "#7b241c"; ctx.lineWidth = 2; ctx.globalAlpha = 0.7; ctx.stroke()
        })
    ctx.globalAlpha = 1

    // ── Centre panel + horizontal ridge ──
    ctx.beginPath(); ctx.moveTo(0, -hh * 0.62); ctx.lineTo(0, hh * 0.35)
    ctx.strokeStyle = "#7b241c"; ctx.lineWidth = 2; ctx.globalAlpha = 0.6; ctx.stroke()
    ctx.beginPath(); ctx.moveTo(-hw * 0.7, -hh * 0.1); ctx.lineTo(hw * 0.7, -hh * 0.1)
    ctx.strokeStyle = "#922b21"; ctx.lineWidth = 2; ctx.globalAlpha = 0.7; ctx.stroke()
    ctx.globalAlpha = 1

    // ── Arc Reactor ──
    const rx = 0, ry = -hh * 0.15
    const rr = Math.min(w, h) * 0.11
    ctx.shadowColor = "#00e5ff"; ctx.shadowBlur = 30
    ctx.beginPath(); ctx.arc(rx, ry, rr * 1.3, 0, Math.PI * 2)
    ctx.strokeStyle = "rgba(0,229,255,0.3)"; ctx.lineWidth = 2; ctx.stroke()
    ctx.beginPath(); ctx.arc(rx, ry, rr, 0, Math.PI * 2)
    ctx.fillStyle = "#1a1a2e"; ctx.fill()
    ctx.strokeStyle = "#00b8d4"; ctx.lineWidth = 2; ctx.stroke()
    const reactorG = ctx.createRadialGradient(rx, ry, 0, rx, ry, rr * 0.85)
    reactorG.addColorStop(0, "#ffffff")
    reactorG.addColorStop(0.25, "#00e5ff")
    reactorG.addColorStop(0.6, "#0097a7")
    reactorG.addColorStop(1, "#006064")
    ctx.beginPath(); ctx.arc(rx, ry, rr * 0.85, 0, Math.PI * 2)
    ctx.fillStyle = reactorG; ctx.fill()
    ctx.shadowBlur = 6
    ctx.beginPath()
    for (let i = 0; i < 3; i++) {
        const a = -Math.PI / 2 + (i * Math.PI * 2 / 3)
        const px = rx + Math.cos(a) * rr * 0.5
        const py = ry + Math.sin(a) * rr * 0.5
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)
    }
    ctx.closePath(); ctx.strokeStyle = "rgba(255,255,255,0.8)"; ctx.lineWidth = 1.5; ctx.stroke()

    ctx.shadowBlur = 0

    // ── Metallic sheen ──
    const sheen = ctx.createRadialGradient(-hw * 0.3, -hh * 0.6, 0, 0, 0, hw)
    sheen.addColorStop(0, "rgba(255,255,255,0.1)")
    sheen.addColorStop(0.6, "rgba(255,255,255,0)")
    ctx.fillStyle = sheen
    ctx.beginPath(); ctx.ellipse(0, -hh * 0.2, hw * 0.85, hh * 0.7, 0, 0, Math.PI * 2); ctx.fill()

    ctx.restore()
}

// ─────────────────────────────────────────────────────────────
// COMPUTE TARGETS FROM LANDMARKS
// ─────────────────────────────────────────────────────────────
function computeHelmetTarget(face) {
    if (!face || !state.toScreen) return null
    const forehead = face[FACE_IDX.FOREHEAD_TOP]
    const chin = face[FACE_IDX.CHIN]
    const leftEar = face[FACE_IDX.LEFT_EAR]
    const rightEar = face[FACE_IDX.RIGHT_EAR]
    if (!forehead || !chin || !leftEar || !rightEar) return null

    const fTop = state.toScreen(forehead.x, forehead.y)
    const fBot = state.toScreen(chin.x, chin.y)
    const fLeft = state.toScreen(leftEar.x, leftEar.y)
    const fRight = state.toScreen(rightEar.x, rightEar.y)

    const faceWidth = Math.abs(fRight.x - fLeft.x)
    const helmetW = faceWidth * 1.35
    const helmetH = helmetW * 1.25
    const centerX = (fLeft.x + fRight.x) / 2
    const centerY = fTop.y + helmetH * -0.52 + helmetH / 2
    const angle = Math.atan2(fRight.y - fLeft.y, fRight.x - fLeft.x)

    return { x: centerX, y: centerY, w: helmetW, h: helmetH, angle }
}

function computeArmorTarget(pose) {
    if (!pose || !state.toScreen) return null
    const ls = pose[POSE_IDX.L_SHOULDER]
    const rs = pose[POSE_IDX.R_SHOULDER]
    const lh = pose[POSE_IDX.L_HIP]
    const rh = pose[POSE_IDX.R_HIP]
    if (!ls || !rs || !lh || !rh) return null

    const ts = state.toScreen
    const pLS = ts(ls.x, ls.y), pRS = ts(rs.x, rs.y)
    const pLH = ts(lh.x, lh.y), pRH = ts(rh.x, rh.y)

    const shoulderW = Math.abs(pRS.x - pLS.x)
    const torsoH = Math.abs(((pLH.y + pRH.y) / 2) - ((pLS.y + pRS.y) / 2))
    const pad = shoulderW * 0.18
    const armorW = shoulderW + pad * 2
    const armorH = torsoH * (1 + 0.08 + 0.05)
    const centerX = (pLS.x + pRS.x) / 2
    const topY = Math.min(pLS.y, pRS.y) - torsoH * 0.08
    const centerY = topY + armorH / 2

    return { x: centerX, y: centerY, w: armorW, h: armorH }
}

// ─────────────────────────────────────────────────────────────
// EXPERIENCE EXPORT
// ─────────────────────────────────────────────────────────────
export const EXP_KALKI = {
    name: "🦾  IRON MAN", useWings: false, useKalki: false, useMask: false, useFace: false,

    onFrame(results, ctx, t, deps) {
        const { expDot, expStatus, compositeWings } = deps
        const pose = results.poseLandmarks
        const face = results.faceLandmarks

        // This is a 2D canvas experience — no Three.js wing compositing needed
        compositeWings(null, false)

        const L = 0.18

        // ── Helmet ──
        // const helmetTarget = computeHelmetTarget(face)
        // if (helmetTarget) {
        //     if (!smooth.helmet.active) {
        //         Object.assign(smooth.helmet, helmetTarget)
        //         smooth.helmet.active = true
        //     } else {
        //         lerpSmooth(smooth.helmet, helmetTarget, L)
        //     }
        //     drawHelmet(ctx, smooth.helmet.x, smooth.helmet.y, smooth.helmet.w, smooth.helmet.h, smooth.helmet.angle)
        // } else {
        //     smooth.helmet.active = false
        // }

        // ── Chest armor ──
        const armorTarget = computeArmorTarget(pose)
        if (armorTarget) {
            if (!smooth.armor.active) {
                Object.assign(smooth.armor, armorTarget)
                smooth.armor.active = true
            } else {
                lerpSmooth(smooth.armor, armorTarget, L)
            }
            drawArmor(ctx, smooth.armor.x, smooth.armor.y, smooth.armor.w, smooth.armor.h)
        } else {
            smooth.armor.active = false
        }

        // ── HUD ──
        if (pose || face) {
            expDot.className = "hud-dot"
            expStatus.textContent = "IRON MAN ✓"
        } else {
            expDot.className = "hud-dot off"
            expStatus.textContent = "STAND IN FRAME"
        }
    },
}