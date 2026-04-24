import { state, applyMobileShadow } from "../state.js"
import { POSE_IDX } from "../constants.js"

export const EXP_WINGS = {
    name: "🪶  ANGEL WINGS", useWings: true, useMask: false, useFace: false,
    onFrame(results, ctx, t, deps) {
        const { expDot, expStatus, updateWingPosition, compositeWings } = deps
        const pose = results.poseLandmarks
        updateWingPosition(pose)
        compositeWings(results.segmentationMask || null, true)
        if (!pose || !state.toScreen) return
        const ls = state.toScreen(pose[POSE_IDX.L_SHOULDER].x, pose[POSE_IDX.L_SHOULDER].y)
        const rs = state.toScreen(pose[POSE_IDX.R_SHOULDER].x, pose[POSE_IDX.R_SHOULDER].y)
        const pulse = 0.5 + Math.sin(t * 2.5) * 0.3
            ;[ls, rs].forEach(p => {
                const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 30)
                g.addColorStop(0, "rgba(0,229,255," + 0.6 * pulse + ")")
                g.addColorStop(1, "rgba(0,229,255,0)")
                ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, 30, 0, Math.PI * 2); ctx.fill()
            })
        expDot.className = "hud-dot"; expStatus.textContent = "WINGS ✓"
    },
}