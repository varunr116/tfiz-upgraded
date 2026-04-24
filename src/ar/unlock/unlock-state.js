// ─── unlock-state.js ──────────────────────────────────────────
// Manages lock/unlock state for experiences
// Session-based - resets when AR is closed
// ──────────────────────────────────────────────────────────────

export const unlockState = {
    isUnlocked: false,
    scannerActive: false,
    detectionCount: 0, // Count how many times target was detected (for stability)
}

export function unlockExperiences() {
    unlockState.isUnlocked = true
    unlockState.scannerActive = false
    console.log('[Unlock] Experiences unlocked! ✨')
}

export function lockExperiences() {
    unlockState.isUnlocked = false
    unlockState.scannerActive = true
    unlockState.detectionCount = 0
    console.log('[Unlock] Experiences locked 🔒')
}

export function isUnlocked() {
    return unlockState.isUnlocked
}