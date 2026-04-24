import { state } from "../state.js"
import { showHint } from "../ui.js"
//import { EXP_KALKI } from "./exp-kalki.js"
import { EXP_WINGS } from "./exp-wings.js"
import { EXP_HAND_HUD } from "./exp-hand-hud.js"
import { EXP_WOLVERINE } from "./exp-wolverine.js"
import { EXP_IRONMAN_CHEST } from "./exp-ironman.js"
import { EXP_THANOS } from "./exp-thanos.js"
import { EXP_MAGIC } from "./exp-magic.js"
import { EXP_ENERGY_BALL } from "./exp-energy-ball.js"
import { EXP_REPULSOR } from "./exp-repulsor.js"
import { EXP_ENERGY_EYES } from "./exp-energy-eyes.js"
import { EXP_LIGHTNING } from "./exp-lightning.js"
import { EXP_WEB_SHOOTER } from "./exp-web-shooter.js"
import { EXP_XRAY } from "./exp-xray.js"
import { EXP_PORTAL } from "./exp-portal.js"
import { EXP_TORCH } from "./exp-torch.js"
import { EXP_HULK } from "./exp-hulk.js"
import { EXP_VENOM } from "./exp-venom.js"
import { EXP_CAPTAIN } from "./exp-captain.js"
import { EXP_PLASMA_VORTEX } from "./exp-plasma-vortex.js"

// ── Hints ────────────────────────────────────────────────────
//EXP_KALKI.hint = { icon: "🧍", text: "Stand back so your full body is visible" }
EXP_WINGS.hint = { icon: "🧍", text: "Stand back so your full body is visible" }
EXP_HAND_HUD.hint = { icon: "✋", text: "Hold both hands up in front of you" }
EXP_WOLVERINE.hint = { icon: "✋", text: "Hold both hands up — claws on your knuckles!" }
EXP_IRONMAN_CHEST.hint = { icon: "🧍", text: "Stand in frame to activate your arc reactor" }
EXP_THANOS.hint = { icon: "✋", text: "Show one or both hands to wear the gauntlet" }
EXP_MAGIC.hint = { icon: "✋", text: "Hold both hands up to cast magic circles" }
EXP_ENERGY_BALL.hint = { icon: "✋", text: "Bring both hands close together to charge the ball" }
EXP_REPULSOR.hint = { icon: "✋", text: "Hold a hand up — open palm to charge, fingers up to blast" }
EXP_ENERGY_EYES.hint = { icon: "😐", text: "Look into the camera to activate laser eyes" }
EXP_LIGHTNING.hint = { icon: "⚡", text: "Lightning strikes automatically — just stand there!" }
EXP_WEB_SHOOTER.hint = { icon: "🤘", text: "Make the Spidey sign — pinky + thumb out, 3 fingers folded" }
EXP_XRAY.hint = { icon: "🧍", text: "Stand back so your full skeleton is visible" }
EXP_PORTAL.hint = { icon: "✋", text: "Hold both hands up to open inter-dimensional portals" }
EXP_TORCH.hint = { icon: "🔥", text: "Stand back — your whole body will be on fire!" }
EXP_HULK.hint = { icon: "💪", text: "Stand in frame — smash fists DOWN fast for a shockwave!" }
EXP_VENOM.hint = { icon: "🖤", text: "Stand in frame — show your face for symbiote eyes" }
EXP_CAPTAIN.hint = { icon: "🛡️", text: "Raise one hand — the shield follows your palm" }
EXP_PLASMA_VORTEX.hint = { icon: "🌀", text: "Stand back — the vortex centres on your body" }

export const EXPERIENCES = [
    // EXP_KALKI,         // 0
    EXP_WINGS,         // 1
    EXP_HAND_HUD,      // 2
    EXP_WOLVERINE,     // 3
    EXP_IRONMAN_CHEST, // 4
    EXP_THANOS,        // 5
    EXP_MAGIC,         // 6
    EXP_ENERGY_BALL,   // 7
    EXP_REPULSOR,      // 8
    EXP_ENERGY_EYES,   // 9
    EXP_LIGHTNING,     // 10
    EXP_WEB_SHOOTER,   // 11
    EXP_XRAY,          // 12
    EXP_PORTAL,        // 13
    EXP_TORCH,         // 14
    EXP_HULK,          // 15
    EXP_VENOM,         // 16
    EXP_CAPTAIN,       // 17
    EXP_PLASMA_VORTEX, // 18
]

export function switchExperience(dir, deps) {
    const { expNameEl, wingGroup, kalkiGroup, wctx, mctx } = deps
    state.expIndex = (state.expIndex + dir + EXPERIENCES.length) % EXPERIENCES.length
    const exp = EXPERIENCES[state.expIndex]

    expNameEl.classList.add("flash")
    setTimeout(() => { expNameEl.textContent = exp.name; expNameEl.classList.remove("flash") }, 160)

    if (exp.hint) showHint(exp.hint.icon, exp.hint.text)

    if (!exp.useWings && !exp.useKalki) {
        if (wingGroup) wingGroup.visible = false
        if (kalkiGroup) kalkiGroup.visible = false
        wctx.clearRect(0, 0, state.screen.w, state.screen.h)
    }
    if (exp.useWings && !exp.useKalki) { if (kalkiGroup) kalkiGroup.visible = false }
    if (exp.useKalki && !exp.useWings) { if (wingGroup) wingGroup.visible = false }
    if (!exp.useMask) {
        if (deps.maskGroup) deps.maskGroup.visible = false
        mctx.clearRect(0, 0, state.screen.w, state.screen.h)
    }

    state.wingPos.active = false
    if (deps.kalkiSmooth) deps.kalkiSmooth.active = false
    state.lastFaceMatrix = null
    state._lastEnergyPos = null
    if (EXP_REPULSOR.reset) EXP_REPULSOR.reset()
}