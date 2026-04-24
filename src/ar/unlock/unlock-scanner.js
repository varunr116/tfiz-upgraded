// ─── unlock-scanner.js ────────────────────────────────────────
// MindAR-based image scanner for unlock targets
// Scans for any of 3 target images and triggers unlock
// ──────────────────────────────────────────────────────────────

import { unlockState, unlockExperiences } from './unlock-state.js'
import { showUnlockSuccess } from './unlock-ui.js'

let mindarInstances = []
let unlocked = false

const basePath = import.meta.env.BASE_URL || '/'

/**
 * Initialize MindAR scanner for all 3 unlock targets
 */
export async function initUnlockScanner(videoElement) {
    try {
        console.log('[UnlockScanner] Initializing MindAR...')

        // Dynamically load MindAR scripts
        await loadMindARScripts()

        // Wait for MindAR to be available
        if (!window.MINDAR || !window.MINDAR.IMAGE) {
            throw new Error('MindAR not loaded')
        }

        console.log('[UnlockScanner] MindAR loaded, creating controllers for 3 targets...')

        // Start scanning for all 3 targets
        startScanningTarget(1, videoElement)
        startScanningTarget(2, videoElement)
        startScanningTarget(3, videoElement)

    } catch (err) {
        console.error('[UnlockScanner] Init failed:', err)
    }
}

/**
 * Start scanning for a specific target
 */
async function startScanningTarget(targetNum, videoElement) {
    try {
        const controller = new window.MINDAR.IMAGE.MindARThree({
            container: document.getElementById('mindar-container'),
            imageTargetSrc: `${basePath}targets/unlock-${targetNum}.mind`,
            maxTrack: 1,
            uiScanning: false,
            uiLoading: false,
        })

        const { renderer, scene, camera } = controller

        await controller.start()
        console.log(`[UnlockScanner] Target ${targetNum} scanner started`)

        mindarInstances.push({ controller, renderer, scene, camera, targetNum })

        // Listen for target found
        const anchor = controller.addAnchor(0)

        anchor.onTargetFound = () => {
            console.log(`[UnlockScanner] Target ${targetNum} detected! 🎯`)
            if (!unlocked) {
                unlocked = true
                handleUnlock()
            }
        }

        anchor.onTargetLost = () => {
            console.log(`[UnlockScanner] Target ${targetNum} lost`)
        }

        // Start render loop
        startRenderLoop(renderer, scene, camera)

    } catch (err) {
        console.error(`[UnlockScanner] Target ${targetNum} init failed:`, err)
    }
}

/**
 * Handle successful unlock
 */
function handleUnlock() {
    console.log('[UnlockScanner] UNLOCK TRIGGERED! 🎉')

    // Stop all scanners
    stopUnlockScanner()

    // Update state
    unlockExperiences()

    // Show success animation
    showUnlockSuccess()
}

/**
 * Stop all scanners and cleanup
 */
export function stopUnlockScanner() {
    try {
        mindarInstances.forEach(({ controller }) => {
            if (controller) {
                controller.stop()
            }
        })

        mindarInstances = []
        unlocked = false

        console.log('[UnlockScanner] All scanners stopped')
    } catch (err) {
        console.warn('[UnlockScanner] Stop error:', err)
    }
}

/**
 * Render loop for MindAR
 */
function startRenderLoop(renderer, scene, camera) {
    const render = () => {
        if (!unlockState.scannerActive) return

        renderer.render(scene, camera)
        requestAnimationFrame(render)
    }
    render()
}

/**
 * Load MindAR scripts dynamically - FIXED VERSION
 */
function loadMindARScripts() {
    return new Promise((resolve, reject) => {
        // Check if already loaded
        if (window.MINDAR) {
            resolve()
            return
        }

        console.log('[UnlockScanner] Loading MindAR from CDN...')

        // Load A-Frame first (MindAR dependency)
        const aframeScript = document.createElement('script')
        aframeScript.src = 'https://cdn.jsdelivr.net/npm/aframe@1.3.0/dist/aframe-master.min.js'

        aframeScript.onload = () => {
            console.log('[UnlockScanner] A-Frame loaded')

            // Then load MindAR - NO TYPE="MODULE"!
            const mindarScript = document.createElement('script')
            mindarScript.src = 'https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-image-three.prod.js'

            mindarScript.onload = () => {
                console.log('[UnlockScanner] MindAR script loaded')

                // Wait for MINDAR to be available
                let attempts = 0
                const checkMindAR = setInterval(() => {
                    attempts++

                    if (window.MINDAR && window.MINDAR.IMAGE) {
                        clearInterval(checkMindAR)
                        console.log('[UnlockScanner] MindAR ready!')
                        resolve()
                    } else if (attempts > 50) {
                        clearInterval(checkMindAR)
                        reject(new Error('MindAR failed to initialize after 5 seconds'))
                    }
                }, 100)
            }

            mindarScript.onerror = () => reject(new Error('Failed to load MindAR script'))

            document.head.appendChild(mindarScript)
        }

        aframeScript.onerror = () => reject(new Error('Failed to load A-Frame script'))

        document.head.appendChild(aframeScript)
    })
}