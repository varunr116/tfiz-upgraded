// ─── package-ar-init.js ───────────────────────────────────────
// 8th Wall runtime initialization for package scanning
// ──────────────────────────────────────────────────────────────

import { packageARState } from './package-ar-state.js'
import { initPackageScene, destroyPackageScene } from './package-ar-scene.js'

let scriptsInjected = false

/**
 * Load 8th Wall runtime scripts dynamically
 */
function load8thWallScripts() {
    return new Promise((resolve, reject) => {
        if (scriptsInjected) {
            resolve()
            return
        }

        const basePath = import.meta.env.BASE_URL || '/'

        // Load runtime.js first
        const runtimeScript = document.createElement('script')
        runtimeScript.src = `${basePath}8thwall/runtime.js`
        runtimeScript.crossOrigin = 'anonymous'
        runtimeScript.onload = () => {
            console.log('[PackageAR] runtime.js loaded')

            // Then load xr.js WITHOUT data-preload-chunks
            const xrScript = document.createElement('script')
            xrScript.src = `${basePath}8thwall/xr.js`
            xrScript.crossOrigin = 'anonymous'
            // REMOVED: xrScript.async = true
            // REMOVED: xrScript.setAttribute('data-preload-chunks', 'face, slam')

            xrScript.onload = () => {
                console.log('[PackageAR] xr.js loaded')
                scriptsInjected = true

                // Wait for XR8 to be ready
                const checkXR8 = setInterval(() => {
                    if (window.XR8) {
                        clearInterval(checkXR8)
                        packageARState.xr8Loaded = true
                        console.log('[PackageAR] XR8 ready')
                        resolve()
                    }
                }, 100)

                // Timeout after 10 seconds
                setTimeout(() => {
                    clearInterval(checkXR8)
                    if (!window.XR8) {
                        reject(new Error('XR8 failed to load after 10 seconds'))
                    }
                }, 10000)
            }

            xrScript.onerror = () => reject(new Error('Failed to load xr.js'))
            document.head.appendChild(xrScript)
        }

        runtimeScript.onerror = () => reject(new Error('Failed to load runtime.js'))
        document.head.appendChild(runtimeScript)
    })
}

/**
 * Initialize Package AR mode
 */
export async function initPackageAR() {
    try {
        console.log('[PackageAR] Initializing...')

        // Load 8th Wall scripts if not already loaded
        if (!packageARState.xr8Loaded) {
            await load8thWallScripts()
        }

        // Initialize the scene
        await initPackageScene()

        packageARState.active = true
        console.log('[PackageAR] Initialized successfully')

    } catch (err) {
        console.error('[PackageAR] Init failed:', err)
        throw err
    }
}

/**
 * Destroy Package AR mode and cleanup
 */
export async function destroyPackageAR() {
    try {
        console.log('[PackageAR] Destroying...')

        // Destroy scene
        destroyPackageScene()

        // Reset state
        packageARState.active = false
        packageARState.sceneInitialized = false

        console.log('[PackageAR] Destroyed successfully')

    } catch (err) {
        console.error('[PackageAR] Destroy failed:', err)
    }
}