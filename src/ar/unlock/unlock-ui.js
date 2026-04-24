// ─── unlock-ui.js ─────────────────────────────────────────────
// UI for unlock overlay and success animation
// ──────────────────────────────────────────────────────────────

let unlockOverlay = null
let successAudio = null

/**
 * Show the unlock scan overlay
 */
export function showUnlockOverlay() {
    unlockOverlay = document.getElementById('unlock-overlay')
    if (!unlockOverlay) {
        console.warn('[UnlockUI] unlock-overlay element not found')
        return
    }

    unlockOverlay.classList.remove('unlock-hidden')
    console.log('[UnlockUI] Showing scan overlay')
}

/**
 * Hide the unlock scan overlay
 */
export function hideUnlockOverlay() {
    if (!unlockOverlay) return

    unlockOverlay.classList.add('unlock-fade-out')

    setTimeout(() => {
        unlockOverlay.classList.add('unlock-hidden')
        unlockOverlay.classList.remove('unlock-fade-out')
    }, 800)

    console.log('[UnlockUI] Hiding scan overlay')
}

/**
 * Show success animation when unlocked
 */
export function showUnlockSuccess() {
    console.log('[UnlockUI] Showing success animation')

    // Play success sound
    playSuccessSound()

    // Show success burst animation
    showBurstAnimation()

    // Show toast message
    showSuccessToast()

    // Hide overlay after animation
    setTimeout(() => {
        hideUnlockOverlay()
    }, 1500)
}

/**
 * Play success sound effect
 */
function playSuccessSound() {
    try {
        // Create simple success beep using Web Audio API
        const audioContext = new (window.AudioContext || window.webkitAudioContext)()
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()

        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)

        oscillator.frequency.value = 880 // A5 note
        oscillator.type = 'sine'

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)

        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + 0.5)

        console.log('[UnlockUI] Success sound played')
    } catch (err) {
        console.warn('[UnlockUI] Could not play sound:', err)
    }
}

/**
 * Show golden burst animation
 */
function showBurstAnimation() {
    const overlay = document.getElementById('unlock-overlay')
    if (!overlay) return

    // Add success class for animation
    overlay.classList.add('unlock-success')

    // Create particle burst
    const burstContainer = document.createElement('div')
    burstContainer.className = 'unlock-burst'
    overlay.appendChild(burstContainer)

    // Create 20 particles
    for (let i = 0; i < 20; i++) {
        const particle = document.createElement('div')
        particle.className = 'unlock-particle'

        const angle = (i / 20) * Math.PI * 2
        const distance = 100 + Math.random() * 50
        const x = Math.cos(angle) * distance
        const y = Math.sin(angle) * distance

        particle.style.setProperty('--tx', `${x}px`)
        particle.style.setProperty('--ty', `${y}px`)
        particle.style.animationDelay = `${i * 0.02}s`

        burstContainer.appendChild(particle)
    }

    // Remove burst after animation
    setTimeout(() => {
        burstContainer.remove()
        overlay.classList.remove('unlock-success')
    }, 1500)
}

/**
 * Show success toast message
 */
function showSuccessToast() {
    const toast = document.getElementById('unlock-toast')
    if (!toast) {
        console.warn('[UnlockUI] unlock-toast element not found')
        return
    }

    toast.textContent = '✨ EXPERIENCES UNLOCKED!'
    toast.classList.remove('unlock-toast-hidden')
    toast.classList.add('unlock-toast-show')

    setTimeout(() => {
        toast.classList.remove('unlock-toast-show')
        toast.classList.add('unlock-toast-hidden')
    }, 2500)
}