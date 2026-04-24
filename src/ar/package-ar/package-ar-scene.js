// ─── package-ar-scene.js ──────────────────────────────────────
// 8th Wall scene setup using ECS architecture (Desktop app style)
// ──────────────────────────────────────────────────────────────

import { packageARState } from './package-ar-state.js'

const basePath = import.meta.env.BASE_URL || '/'

/**
 * Load image target data
 */
async function loadImageTarget() {
    try {
        const response = await fetch(`${basePath}targets/zindabad-tube/zindabad-tube.json`)
        const targetData = await response.json()
        return targetData
    } catch (err) {
        console.error('[PackageAR] Failed to load image target:', err)
        throw err
    }
}

/**
 * Initialize 8th Wall scene using ECS - WITHOUT XrController.configure
 */
export async function initPackageScene() {
    if (packageARState.sceneInitialized) {
        console.warn('[PackageAR] Scene already initialized')
        return
    }

    try {
        console.log('[PackageAR] Loading image target...')
        const targetData = await loadImageTarget()

        console.log('[PackageAR] Building scene configuration...')

        // Store target data globally for XR8 to find
        window.__imageTargetData = [targetData]

        // ECS scene configuration (from bundle.js)
        const sceneConfig = {
            objects: {
                // Ambient Light
                'ambient-light': {
                    components: {},
                    geometry: null,
                    id: 'ambient-light',
                    light: { type: 'ambient' },
                    material: null,
                    name: 'Ambient Light',
                    position: [10, 5, 5],
                    rotation: [0, 0, 0, 1],
                    scale: [1, 1, 1],
                    parentId: 'default-space',
                    order: 0.4
                },

                // Camera
                'ar-camera': {
                    camera: {
                        type: 'perspective',
                        xr: {
                            desktop: 'disabled',
                            xrCameraType: 'world',
                            headset: 'disabled',
                            phone: 'AR'
                        }
                    },
                    components: {},
                    geometry: null,
                    id: 'ar-camera',
                    material: null,
                    name: 'Camera',
                    position: [0, 5, 5],
                    rotation: [0, 0, 0, 1],
                    scale: [1, 1, 1],
                    parentId: 'default-space',
                    order: 1.0
                },

                // Directional Light
                'directional-light': {
                    components: {},
                    geometry: null,
                    id: 'directional-light',
                    light: { intensity: 1, type: 'directional' },
                    material: null,
                    name: 'Directional Light',
                    position: [20, 20, 10],
                    rotation: [0, 0, 0, 1],
                    scale: [1, 1, 1],
                    parentId: 'default-space',
                    order: 0.6
                },

                // Image Target
                'image-target': {
                    id: 'image-target',
                    position: [0, 0, 0],
                    rotation: [0, 0, 0, 1],
                    scale: [1, 1, 1],
                    geometry: null,
                    material: null,
                    parentId: 'default-space',
                    components: {},
                    name: 'Image Target',
                    imageTarget: { name: 'zindabad-tube' },
                    order: 3.0
                },

                // GLB Model (child of image target)
                'tshirt-model': {
                    id: 'tshirt-model',
                    position: [0, -1.0690324746580822, 0.3093898931817489],
                    rotation: [0, 0, 0, 1],
                    scale: [0.01, 0.01, 0.01],
                    geometry: null,
                    material: null,
                    parentId: 'image-target',
                    components: {},
                    gltfModel: {
                        src: {
                            type: 'asset',
                            asset: `models/normal_t-shirt_animated.glb` // Relative path for ECS
                        },
                        animationClip: 'Object_0',
                        loop: true,
                        paused: false
                    },
                    name: 'normal_t-shirt_animated.glb',
                    order: 1.7
                }
            },

            spaces: {
                'default-space': {
                    id: 'default-space',
                    name: 'Default',
                    activeCamera: 'ar-camera',
                    reflections: {
                        type: 'url',
                        url: 'https://cdn.8thwall.com/web/assets/envmap/basic_env_map-m9hqpneh.jpg'
                    }
                }
            },

            entrySpaceId: 'default-space',
            runtimeVersion: {
                type: 'version',
                level: 'major',
                major: 2,
                minor: 0,
                patch: 0
            },

            // Embed image target data directly
            imageTargets: window.__imageTargetData
        }

        // Clean up history fields
        delete sceneConfig.history
        delete sceneConfig.historyVersion

        // Wait for ECS
        if (!window.ecs || !window.ecs.application) {
            throw new Error('ECS application not available')
        }

        console.log('[PackageAR] Initializing ECS application...')
        // ADD THIS - Request camera permissions first
        try {
            console.log('[PackageAR] Requesting camera permissions...')
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            })
            console.log('[PackageAR] Camera permission granted')
            // Stop the test stream - 8th Wall will request its own
            stream.getTracks().forEach(track => track.stop())
        } catch (err) {
            console.warn('[PackageAR] Camera permission denied or unavailable:', err)
        }

        // Initialize ECS scene
        window.ecs.application.init(sceneConfig)

        packageARState.sceneInitialized = true
        console.log('[PackageAR] Scene initialized successfully!')

    } catch (err) {
        console.error('[PackageAR] Scene init failed:', err)
        throw err
    }
}

/**
 * Destroy scene and cleanup
 */
export function destroyPackageScene() {
    try {
        console.log('[PackageAR] Destroying scene...')

        if (window.ecs && window.ecs.application && window.ecs.application.clear) {
            window.ecs.application.clear()
        }

        if (window.XR8 && window.XR8.stop) {
            window.XR8.stop()
        }

        delete window.__imageTargetData

        packageARState.sceneInitialized = false
        console.log('[PackageAR] Scene destroyed')

    } catch (err) {
        console.error('[PackageAR] Destroy error:', err)
    }
}