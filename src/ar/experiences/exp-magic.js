// exp-magic.js — Dr Strange magic circles
// FPS fix: batch all arcs of the same style into ONE beginPath/stroke call
// instead of 132 individual draw calls per hand per frame.
import { state, isMobile, applyMobileShadow } from "../state.js"
import { HAND_IDX } from "../constants.js"

// Segment counts tuned per device: mobile gets ~half the geometry
const RING_SEGS = isMobile ? [12, 14, 16, 18] : [24, 28, 32, 36]
const SPARK_CNT = isMobile ? 6 : 12
const RUNE_CNT = isMobile ? 0 : 8   // runes off on mobile (font renders are slow)
const RUNES = ["ᚠ", "ᚢ", "ᚦ", "ᚨ", "ᚱ", "ᚲ", "ᚷ", "ᚹ", "ᚺ", "ᚾ", "ᛁ", "ᛃ"]

function drawMagicCircle(ctx, hand, t, offset) {
    if (!state.toScreen) return
    const ts = state.toScreen
    const palm = ts(hand[HAND_IDX.MIDDLE_MCP].x, hand[HAND_IDX.MIDDLE_MCP].y)
    const wrist = ts(hand[HAND_IDX.WRIST].x, hand[HAND_IDX.WRIST].y)
    const midTip = ts(hand[HAND_IDX.MIDDLE_TIP].x, hand[HAND_IDX.MIDDLE_TIP].y)
    const R = Math.hypot(midTip.x - wrist.x, midTip.y - wrist.y) * 0.65
    if (R < 20) return
    const cx = palm.x, cy = palm.y

    ctx.save()

    // ── Rings — ONE beginPath per style group ──────────────────
    // "bright" rings (0, 2) and "dim" rings (1, 3) are batched separately
    for (let pass = 0; pass < 2; pass++) {
        const bright = pass === 0
        ctx.strokeStyle = bright ? "#ffaa00" : "#ff6600"
        ctx.lineWidth = bright ? 2.5 : 1.5
        ctx.globalAlpha = bright ? 0.9 : 0.6
        applyMobileShadow(ctx, "#ff8800", bright ? 16 : 8)

        ctx.beginPath()
        for (let ring = 0; ring < 4; ring++) {
            if ((ring % 2 === 0) !== bright) continue   // only draw rings matching this pass
            const segs = RING_SEGS[ring]
            const rr = R * (0.9 + ring * 0.22)
            const speed = (ring % 2 === 0 ? 1 : -1) * (0.8 + ring * 0.3)
            const gapFrac = ring === 0 ? 0.04 : 0.07
            const segSpan = (1 - gapFrac) * ((Math.PI * 2) / segs)
            for (let i = 0; i < segs; i++) {
                const a0 = (i / segs) * Math.PI * 2 + t * speed + offset * 0.5
                ctx.arc(cx, cy, rr, a0, a0 + segSpan)
                // Move pen to prevent lines connecting arcs
                ctx.moveTo(cx + Math.cos(a0 + segSpan + 0.01) * rr,
                    cy + Math.sin(a0 + segSpan + 0.01) * rr)
            }
        }
        ctx.stroke()
    }

    // ── Star — single path ─────────────────────────────────────
    ctx.globalAlpha = 0.85
    ctx.strokeStyle = "#ffcc44"
    ctx.lineWidth = 1.8
    applyMobileShadow(ctx, "#ffaa00", 12)
    ctx.beginPath()
    const POINTS = 8
    for (let i = 0; i < POINTS * 2 + 1; i++) {
        const a = (i / (POINTS * 2)) * Math.PI * 2 + t * 0.4 + offset * 0.3
        const r = i % 2 === 0 ? R * 0.55 : R * 0.25
        if (i === 0) ctx.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r)
        else ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r)
    }
    ctx.closePath()
    ctx.stroke()

    // ── Runes — desktop only, single font setup ────────────────
    if (RUNE_CNT > 0) {
        ctx.fillStyle = "#ffdd88"
        ctx.font = `${Math.round(R * 0.22)}px serif`
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.shadowColor = "#ff8800"
        ctx.shadowBlur = 10
        for (let i = 0; i < RUNE_CNT; i++) {
            const a = (i / RUNE_CNT) * Math.PI * 2 + t * 0.35 + offset * 0.4
            const rx = cx + Math.cos(a) * R * 0.75
            const ry = cy + Math.sin(a) * R * 0.75
            ctx.globalAlpha = 0.7 + Math.sin(t * 2 + i) * 0.3
            ctx.save()
            ctx.translate(rx, ry)
            ctx.rotate(a + Math.PI / 2)
            ctx.fillText(RUNES[i % RUNES.length], 0, 0)
            ctx.restore()
        }
    }

    // ── Sparks — draw all as filled arcs, no shadow ────────────
    ctx.shadowBlur = 0
    ctx.globalAlpha = 0.9
    for (let i = 0; i < SPARK_CNT; i++) {
        const a = (i / SPARK_CNT) * Math.PI * 2 + t * 1.2 + offset
        const dist = R * 0.85 + Math.sin(t * 4 + i * 0.7) * R * 0.15
        const sx = cx + Math.cos(a) * dist
        const sy = cy + Math.sin(a) * dist
        const sparkR = 2 + Math.sin(t * 5 + i) * 1.5
        const sG = ctx.createRadialGradient(sx, sy, 0, sx, sy, sparkR * 3)
        sG.addColorStop(0, "rgba(255,220,100,0.95)")
        sG.addColorStop(1, "rgba(255,100,0,0)")
        ctx.fillStyle = sG
        ctx.beginPath()
        ctx.arc(sx, sy, sparkR * 3, 0, Math.PI * 2)
        ctx.fill()
    }

    // ── Centre glow — single radial gradient ──────────────────
    const portalPulse = 0.6 + Math.sin(t * 3.5 + offset) * 0.4
    const portalG = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 0.45)
    portalG.addColorStop(0, `rgba(255,200,80,${(0.5 * portalPulse).toFixed(2)})`)
    portalG.addColorStop(0.5, `rgba(255,120,0,${(0.2 * portalPulse).toFixed(2)})`)
    portalG.addColorStop(1, "rgba(0,0,0,0)")
    ctx.globalAlpha = 1
    ctx.fillStyle = portalG
    ctx.shadowBlur = 0
    ctx.beginPath()
    ctx.arc(cx, cy, R * 0.45, 0, Math.PI * 2)
    ctx.fill()

    ctx.restore()
}

export const EXP_MAGIC = {
    name: "✨  DR STRANGE", useWings: false, useMask: false, useFace: false,
    onFrame(results, ctx, t, deps) {
        const { expDot, expStatus } = deps
        const lh = results.leftHandLandmarks, rh = results.rightHandLandmarks
        if (!lh && !rh) {
            expDot.className = "hud-dot off"; expStatus.textContent = "RAISE HANDS"; return
        }
        if (lh) drawMagicCircle(ctx, lh, t, 0)
        if (rh) drawMagicCircle(ctx, rh, t, 1)
        expDot.className = "hud-dot yellow"
        expStatus.textContent = "MAGIC " + (lh ? "L✓" : "") + " " + (rh ? "R✓" : "")
    },
}