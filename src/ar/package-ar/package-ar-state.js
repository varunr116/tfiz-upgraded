// ─── package-ar-state.js ──────────────────────────────────────
// State management for Package AR mode
// ──────────────────────────────────────────────────────────────

export const packageARState = {
    active: false,
    xr8Loaded: false,
    sceneInitialized: false,
    model: null,
    imageTarget: null,
}

export function resetPackageARState() {
    packageARState.active = false
    packageARState.sceneInitialized = false
    packageARState.model = null
    packageARState.imageTarget = null
    // Note: xr8Loaded stays true once loaded
}