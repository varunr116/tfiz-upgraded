// ─── exp-web-shooter.js ───────────────────────────────────────
// 🪄 MAGIC SPELL CAST
// Arcane rune circles, particle trails, beam shots and
// a crackling connection arc between hands.
// ──────────────────────────────────────────────────────────────
import { state, isMobile, applyMobileShadow } from "../state.js"
import { HAND_IDX } from "../constants.js"

// ── Particle pool ─────────────────────────────────────────────
const particles = []
const MAX_PARTICLES = isMobile ? 60 : 140

// ── Beam state ────────────────────────────────────────────────
const beams = []

// ── Previous hand positions for velocity ─────────────────────
const prevPos = { l: null, r: null }

// ── Rune ring rotation accumulators ──────────────────────────
let outerRot = 0
let innerRot = 0

// ── Color palette ─────────────────────────────────────────────
const COL = {
    purple: "rgba(192,132,252,",
    gold: "rgba(251,191,36,",
    cyan: "rgba(103,232,249,",
    white: "rgba(255,255,255,",
}

// ── Cycle hue: purple → gold → cyan ──────────────────────────
function cycleColor(t, alpha) {
    const seg = Math.floor(t * 0.3) % 3
    const frac = (t * 0.3) % 1
    const cols = [
        [192, 132, 252],
        [251, 191, 36],
        [103, 232, 249],
    ]
    const a = cols[seg], b = cols[(seg + 1) % 3]
    const r = Math.round(a[0] + (b[0] - a[0]) * frac)
    const g = Math.round(a[1] + (b[1] - a[1]) * frac)
    const bl = Math.round(a[2] + (b[2] - a[2]) * frac)
    return `rgba(${r},${g},${bl},${alpha})`
}

// ── Gesture detection ─────────────────────────────────────────
function isHandUp(hand) {
    if (!hand || !state.toScreen) return false
    const ts = state.toScreen
    const wrist = ts(hand[HAND_IDX.WRIST].x, hand[HAND_IDX.WRIST].y)
    const midTip = ts(hand[HAND_IDX.MIDDLE_TIP].x, hand[HAND_IDX.MIDDLE_TIP].y)
    return Math.hypot(midTip.x - wrist.x, midTip.y - wrist.y) > 30
}

function isPointing(hand) {
    if (!hand || !state.toScreen) return false
    const ts = state.toScreen
    const wrist = ts(hand[HAND_IDX.WRIST].x, hand[HAND_IDX.WRIST].y)
    const dist = idx => {
        const p = ts(hand[idx].x, hand[idx].y)
        return Math.hypot(p.x - wrist.x, p.y - wrist.y)
    }
    const indexOut = dist(HAND_IDX.INDEX_TIP) > dist(HAND_IDX.INDEX_MCP) * 0.9
    const middleFold = dist(HAND_IDX.MIDDLE_TIP) < dist(HAND_IDX.MIDDLE_MCP) * 0.85
    const ringFold = dist(HAND_IDX.RING_TIP) < dist(HAND_IDX.RING_MCP) * 0.85
    return indexOut && middleFold && ringFold
}

// ── Spawn particles from hand position ───────────────────────
function spawnParticles(x, y, vx, vy, t, count) {
    if (particles.length >= MAX_PARTICLES) return
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2
        const speed = 1.5 + Math.random() * 3
        particles.push({
            x, y,
            vx: Math.cos(angle) * speed + vx * 0.3,
            vy: Math.sin(angle) * speed + vy * 0.3,
            life: 1,
            decay: 0.025 + Math.random() * 0.03,
            size: 1.5 + Math.random() * 3,
            t,
        })
    }
}

// ── Draw outer rune ring ──────────────────────────────────────
function drawOuterRing(ctx, x, y, r, rot, t) {
    const col = cycleColor(t, 0.85)
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(rot)

    // Main ring
    ctx.beginPath()
    ctx.arc(0, 0, r, 0, Math.PI * 2)
    ctx.strokeStyle = col
    ctx.lineWidth = 2
    applyMobileShadow(ctx, col, 12)
    ctx.stroke()

    // 8 tick marks
    for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2
        const inner = i % 2 === 0 ? r * 0.82 : r * 0.88
        ctx.beginPath()
        ctx.moveTo(Math.cos(a) * inner, Math.sin(a) * inner)
        ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r)
        ctx.strokeStyle = i % 2 === 0 ? col : cycleColor(t + 1, 0.6)
        ctx.lineWidth = i % 2 === 0 ? 2.5 : 1.5
        ctx.stroke()
    }

    // Outer dot accents at each major tick
    for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2
        ctx.beginPath()
        ctx.arc(Math.cos(a) * (r + 6), Math.sin(a) * (r + 6), 3, 0, Math.PI * 2)
        ctx.fillStyle = cycleColor(t + 2, 0.9)
        ctx.shadowBlur = 8
        ctx.fill()
    }

    ctx.restore()
}

// ── Draw inner counter-rotating ring with runes ───────────────
function drawInnerRing(ctx, x, y, r, rot, t) {
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(rot)

    // Ring
    ctx.beginPath()
    ctx.arc(0, 0, r, 0, Math.PI * 2)
    ctx.strokeStyle = cycleColor(t + 1.5, 0.7)
    ctx.lineWidth = 1.5
    ctx.setLineDash([6, 4])
    applyMobileShadow(ctx, cycleColor(t + 1.5, 1), 8)
    ctx.stroke()
    ctx.setLineDash([])

    // 6 rune symbols — drawn as small geometric shapes
    for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2
        const rx = Math.cos(a) * r
        const ry = Math.sin(a) * r
        const sz = 5
        const col = cycleColor(t + i * 0.5, 0.9)
        ctx.save()
        ctx.translate(rx, ry)
        ctx.rotate(a + rot * 0.5)
        ctx.strokeStyle = col
        ctx.lineWidth = 1.2
        ctx.shadowColor = col
        ctx.shadowBlur = 6

        // Alternate between triangle and diamond rune shapes
        if (i % 2 === 0) {
            ctx.beginPath()
            ctx.moveTo(0, -sz); ctx.lineTo(sz * 0.87, sz * 0.5); ctx.lineTo(-sz * 0.87, sz * 0.5)
            ctx.closePath(); ctx.stroke()
        } else {
            ctx.beginPath()
            ctx.moveTo(0, -sz); ctx.lineTo(sz, 0); ctx.lineTo(0, sz); ctx.lineTo(-sz, 0)
            ctx.closePath(); ctx.stroke()
        }
        ctx.restore()
    }

    ctx.restore()
}

// ── Draw centre sigil (Star of David / hexagram) ──────────────
function drawSigil(ctx, x, y, r, t) {
    const pulse = 0.85 + Math.sin(t * 2.2) * 0.15
    const pr = r * pulse
    const col = cycleColor(t, 1)

    ctx.save()
    ctx.translate(x, y)
    applyMobileShadow(ctx, col, 20)
    ctx.strokeStyle = col
    ctx.lineWidth = 1.8

    // Two overlapping triangles
    for (let tri = 0; tri < 2; tri++) {
        const offset = tri * (Math.PI / 3) + Math.sin(t * 0.8) * 0.1
        ctx.beginPath()
        for (let i = 0; i < 3; i++) {
            const a = offset + (i / 3) * Math.PI * 2 - Math.PI / 2
            const px = Math.cos(a) * pr
            const py = Math.sin(a) * pr
            i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)
        }
        ctx.closePath()
        ctx.stroke()
    }

    // Centre dot
    const coreG = ctx.createRadialGradient(0, 0, 0, 0, 0, pr * 0.45)
    coreG.addColorStop(0, `rgba(255,255,255,${0.95 * pulse})`)
    coreG.addColorStop(0.4, cycleColor(t, 0.7 * pulse))
    coreG.addColorStop(1, cycleColor(t + 1, 0))
    ctx.fillStyle = coreG
    ctx.shadowBlur = 15
    ctx.beginPath()
    ctx.arc(0, 0, pr * 0.45, 0, Math.PI * 2)
    ctx.fill()

    ctx.restore()
}

// ── Draw aura glow behind ring ────────────────────────────────
function drawAura(ctx, x, y, r, t) {
    const pulse = 0.6 + Math.sin(t * 1.8) * 0.4
    const g = ctx.createRadialGradient(x, y, 0, x, y, r * 1.8)
    g.addColorStop(0, cycleColor(t, 0.25 * pulse))
    g.addColorStop(0.5, cycleColor(t + 1, 0.1 * pulse))
    g.addColorStop(1, "rgba(0,0,0,0)")
    ctx.fillStyle = g
    ctx.shadowBlur = 0
    ctx.beginPath()
    ctx.arc(x, y, r * 1.8, 0, Math.PI * 2)
    ctx.fill()
}

// ── Draw beam from fingertip ──────────────────────────────────
function fireBeam(hand, t) {
    if (!hand || !state.toScreen) return
    const ts = state.toScreen
    const tipPos = ts(hand[HAND_IDX.INDEX_TIP].x, hand[HAND_IDX.INDEX_TIP].y)
    const dipPos = ts(hand[HAND_IDX.INDEX_DIP].x, hand[HAND_IDX.INDEX_DIP].y)
    const dx = tipPos.x - dipPos.x
    const dy = tipPos.y - dipPos.y
    const len = Math.hypot(dx, dy) || 1
    const nx = dx / len, ny = dy / len
    const W = state.screen.w, H = state.screen.h
    const dist = Math.max(W, H) * 1.5

    beams.push({
        x: tipPos.x, y: tipPos.y,
        ex: tipPos.x + nx * dist, ey: tipPos.y + ny * dist,
        life: 1, decay: 0.08, t,
    })
}

function drawBeams(ctx, t) {
    for (let i = beams.length - 1; i >= 0; i--) {
        const b = beams[i]
        b.life -= b.decay
        if (b.life <= 0) { beams.splice(i, 1); continue }

        const col = cycleColor(b.t, b.life * 0.9)
        ctx.save()
        // Outer glow
        ctx.strokeStyle = col
        ctx.lineWidth = 18 * b.life
        ctx.lineCap = "round"
        ctx.shadowColor = col
        ctx.shadowBlur = 30
        ctx.globalAlpha = b.life * 0.3
        ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(b.ex, b.ey); ctx.stroke()
        // Core
        ctx.strokeStyle = `rgba(255,255,255,${b.life * 0.95})`
        ctx.lineWidth = 3 * b.life
        ctx.shadowBlur = 10
        ctx.globalAlpha = b.life
        ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(b.ex, b.ey); ctx.stroke()
        // Origin flash
        const flash = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, 30 * b.life)
        flash.addColorStop(0, `rgba(255,255,255,${b.life})`)
        flash.addColorStop(0.3, cycleColor(b.t, b.life * 0.8))
        flash.addColorStop(1, "rgba(0,0,0,0)")
        ctx.fillStyle = flash; ctx.globalAlpha = b.life
        ctx.beginPath(); ctx.arc(b.x, b.y, 30 * b.life, 0, Math.PI * 2); ctx.fill()
        ctx.restore()
    }
}

// ── Draw connection arc between hands ─────────────────────────
function drawConnectionArc(ctx, p1, p2, t) {
    const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y)
    if (dist > state.screen.w * 0.45) return  // too far apart

    const mx = (p1.x + p2.x) / 2
    const my = (p1.y + p2.y) / 2
    const col = cycleColor(t, 0.9)

    ctx.save()
    applyMobileShadow(ctx, col, 20)

    // Draw 3 jagged arc lines for crackling effect
    for (let arc = 0; arc < 3; arc++) {
        ctx.beginPath()
        ctx.moveTo(p1.x, p1.y)
        const steps = isMobile ? 8 : 14
        for (let s = 1; s < steps; s++) {
            const frac = s / steps
            const bx = p1.x + (p2.x - p1.x) * frac
            const by = p1.y + (p2.y - p1.y) * frac
            const jitter = (arc === 1 ? 0 : (Math.random() - 0.5) * dist * 0.12)
            const perp = { x: -(p2.y - p1.y) / dist, y: (p2.x - p1.x) / dist }
            ctx.lineTo(bx + perp.x * jitter, by + perp.y * jitter)
        }
        ctx.lineTo(p2.x, p2.y)
        ctx.strokeStyle = arc === 1
            ? `rgba(255,255,255,0.9)`
            : col
        ctx.lineWidth = arc === 1 ? 1.5 : 3
        ctx.globalAlpha = arc === 1 ? 0.95 : 0.5
        ctx.stroke()
    }

    // Energy orb at midpoint
    const orbG = ctx.createRadialGradient(mx, my, 0, mx, my, 20)
    orbG.addColorStop(0, `rgba(255,255,255,0.95)`)
    orbG.addColorStop(0.3, cycleColor(t, 0.8))
    orbG.addColorStop(1, "rgba(0,0,0,0)")
    ctx.fillStyle = orbG; ctx.globalAlpha = 0.9
    ctx.beginPath(); ctx.arc(mx, my, 20, 0, Math.PI * 2); ctx.fill()

    ctx.restore()
}

// ── Draw + update particles ───────────────────────────────────
function drawParticles(ctx, t) {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        p.x += p.vx; p.y += p.vy
        p.vy += 0.06  // slight gravity
        p.life -= p.decay
        if (p.life <= 0) { particles.splice(i, 1); continue }

        const col = cycleColor(p.t, p.life * 0.9)
        ctx.save()
        ctx.globalAlpha = p.life
        ctx.fillStyle = col
        ctx.shadowColor = col
        ctx.shadowBlur = 8
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
    }
}

// ── Beam spawn throttle ───────────────────────────────────────
let _lastBeamL = 0, _lastBeamR = 0

// ── Main draw function ────────────────────────────────────────
function drawMagicSpell(ctx, lh, rh, t) {
    const ts = state.toScreen
    if (!ts) return

    // Update ring rotations
    outerRot += 0.008
    innerRot -= 0.014

    ctx.save()
    ctx.globalAlpha = 1

    const hands = [
        { hand: lh, prev: prevPos.l, key: "l", beamTimer: _lastBeamL },
        { hand: rh, prev: prevPos.r, key: "r", beamTimer: _lastBeamR },
    ]

    const wristPositions = []

    hands.forEach(({ hand, prev, key }, hi) => {
        if (!hand || !isHandUp(hand)) return

        const wrist = ts(hand[HAND_IDX.WRIST].x, hand[HAND_IDX.WRIST].y)
        const midTip = ts(hand[HAND_IDX.MIDDLE_TIP].x, hand[HAND_IDX.MIDDLE_TIP].y)
        const handLen = Math.hypot(midTip.x - wrist.x, midTip.y - wrist.y)
        if (handLen < 20) return

        const outerR = handLen * 1.1
        const innerR = handLen * 0.65
        const sigilR = handLen * 0.28

        wristPositions.push(wrist)

        // Velocity for particle spawning
        let vx = 0, vy = 0
        if (prev) {
            vx = wrist.x - prev.x
            vy = wrist.y - prev.y
            const speed = Math.hypot(vx, vy)
            if (speed > 3 && particles.length < MAX_PARTICLES) {
                spawnParticles(wrist.x, wrist.y, vx, vy, t, isMobile ? 2 : 4)
            }
        }
        prevPos[key] = wrist

        // Draw layers back to front
        drawAura(ctx, wrist.x, wrist.y, outerR, t)
        drawOuterRing(ctx, wrist.x, wrist.y, outerR, outerRot * (hi === 0 ? 1 : -1), t)
        drawInnerRing(ctx, wrist.x, wrist.y, innerR, innerRot * (hi === 0 ? 1 : -1), t)
        drawSigil(ctx, wrist.x, wrist.y, sigilR, t)

        // Beam on point gesture
        const now = performance.now()
        if (isPointing(hand)) {
            const beamTimer = hi === 0 ? _lastBeamL : _lastBeamR
            if (now - beamTimer > 180) {
                fireBeam(hand, t)
                if (hi === 0) _lastBeamL = now
                else _lastBeamR = now
                // Burst particles at tip
                const tip = ts(hand[HAND_IDX.INDEX_TIP].x, hand[HAND_IDX.INDEX_TIP].y)
                spawnParticles(tip.x, tip.y, 0, 0, t, isMobile ? 4 : 8)
            }
        }
    })

    // Connection arc when both hands visible and close
    if (wristPositions.length === 2) {
        drawConnectionArc(ctx, wristPositions[0], wristPositions[1], t)
    }

    // Draw beams and particles on top
    drawBeams(ctx, t)
    drawParticles(ctx, t)

    ctx.restore()
}

// ── Experience export — name/key kept identical ───────────────
export const EXP_WEB_SHOOTER = {
    name: "🪄  MAGIC SPELL", useWings: false, useMask: false, useFace: false,
    onFrame(results, ctx, t, deps) {
        const { expDot, expStatus } = deps
        const lh = results.leftHandLandmarks
        const rh = results.rightHandLandmarks

        drawMagicSpell(ctx, lh, rh, t)

        const lUp = isHandUp(lh)
        const rUp = isHandUp(rh)
        const lPoint = isPointing(lh)
        const rPoint = isPointing(rh)

        if (lPoint || rPoint) {
            expDot.className = "hud-dot"
            expStatus.textContent = "✨ CASTING BEAM!"
        } else if (lUp || rUp) {
            expDot.className = "hud-dot"
            expStatus.textContent = "🪄 SPELL ACTIVE" + (lUp && rUp ? " — BRING HANDS CLOSE" : "")
        } else {
            expDot.className = "hud-dot off"
            expStatus.textContent = "RAISE YOUR HANDS"
        }
    },
}