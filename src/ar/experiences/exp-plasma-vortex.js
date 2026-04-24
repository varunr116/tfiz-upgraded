// ─── exp-plasma-vortex.js ─────────────────────────────────────
// Mandala GLB — glowing, rotating, centred behind the person.
// ──────────────────────────────────────────────────────────────
import { state } from "../state.js"
import { POSE_IDX } from "../constants.js"

let mandalaGroup = null
let mandalaLoaded = false
let _rotation = 0
let _initDone = false
let _sm = { pos: null, scale: 1, active: false }

// Colour cycle: gold → white → cyan
const COLS = [
  [1.0, 0.85, 0.2],
  [1.0, 1.0, 1.0],
  [0.3, 0.95, 1.0],
]
function cycleColour(t) {
  const idx = Math.floor(t * 0.2) % COLS.length
  const next = (idx + 1) % COLS.length
  const f = (t * 0.2) % 1
  const a = COLS[idx], b = COLS[next]
  return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f]
}

function loadMandala(wingScene, wingCamera) {
  _initDone = true
  const THREE = window.THREE

  function tryLoad() {
    if (!THREE.GLTFLoader) { setTimeout(tryLoad, 200); return }

    new THREE.GLTFLoader().load(`${import.meta.env.BASE_URL}mandla.glb`,
      (gltf) => {
        const model = gltf.scene

        // Normalise to 1 world unit
        const box = new THREE.Box3().setFromObject(model)
        const size = new THREE.Vector3(); box.getSize(size)
        const sc = 1.0 / Math.max(size.x, size.y, size.z)
        model.scale.setScalar(sc)
        const center = new THREE.Vector3(); box.getCenter(center)
        model.position.sub(center.multiplyScalar(sc))

        // Keep original GLB material as-is
        model.traverse(c => {
          if (c.isMesh) c.material.side = THREE.DoubleSide
        })

        // Dedicated lights so original material renders correctly
        const mLight1 = new THREE.PointLight(0xffffff, 3.0, 50)
        mLight1.position.set(0, 0, 5)
        const mLight2 = new THREE.PointLight(0xffd060, 2.0, 50)
        mLight2.position.set(0, 5, 2)
        const mAmbient = new THREE.AmbientLight(0xffffff, 1.5)

        mandalaGroup = new THREE.Group()
        mandalaGroup.add(mLight1)
        mandalaGroup.add(mLight2)
        mandalaGroup.add(mAmbient)
        mandalaGroup.add(model)

        // Lights so MeshStandardMaterial is visible
        const ambL = new THREE.AmbientLight(0xffffff, 2.0)
        mandalaGroup.add(ambL)
        const dirL = new THREE.DirectionalLight(0xffffff, 3.0)
        dirL.position.set(0, 0, 5)
        mandalaGroup.add(dirL)
        const rimL = new THREE.DirectionalLight(0xffe8a0, 1.5)
        rimL.position.set(0, 5, -2)
        mandalaGroup.add(rimL)

        mandalaGroup.visible = false
        wingScene.add(mandalaGroup)

        mandalaLoaded = true
      },
      null,
      (err) => console.warn("mandla.glb failed:", err)
    )
  }
  tryLoad()
}

function updatePosition(pose, wingCamera) {
  if (!mandalaGroup || !pose) {
    if (mandalaGroup) mandalaGroup.visible = false
    return
  }
  const ls = pose[POSE_IDX.L_SHOULDER]
  const rs = pose[POSE_IDX.R_SHOULDER]
  if (!ls || !rs) { mandalaGroup.visible = false; return }

  const THREE = window.THREE
  const mirror = state.isFrontCamera
  const lx = mirror ? 1 - ls.x : ls.x
  const rx = mirror ? 1 - rs.x : rs.x

  // Centre on shoulder midpoint — same vertical level, no downward nudge
  const cx = (lx + rx) / 2
  const cy = (ls.y + rs.y) / 2

  // Depth 6.5 = behind wings (5.8) = behind person
  const nv = new THREE.Vector3(cx * 2 - 1, -(cy * 2 - 1), 0.5)
  nv.unproject(wingCamera)
  const dir = nv.sub(wingCamera.position).normalize()
  const target = wingCamera.position.clone().addScaledVector(dir, 6.5)

  // Scale: shoulder width × 18 so mandala is large and dramatic
  const swNorm = Math.abs(rx - lx)
  const targetScale = swNorm * 30.0

  const sm = _sm
  if (!sm.active) {
    sm.pos = target.clone()
    sm.scale = targetScale
    sm.active = true
  } else {
    sm.pos.lerp(target, 0.08)
    sm.scale += (targetScale - sm.scale) * 0.08
  }

  mandalaGroup.position.copy(sm.pos)
  mandalaGroup.scale.setScalar(sm.scale)
  mandalaGroup.visible = true
}

export const EXP_PLASMA_VORTEX = {
  name: "🌀  MANDALA", useWings: false, useMask: false, useFace: false,

  onFrame(results, ctx, t, deps) {
    const { expDot, expStatus, compositeWings, wingGroup, wingScene, wingCamera } = deps
    const pose = results.poseLandmarks

    if (wingGroup) wingGroup.visible = false

    // Load GLB once
    if (!_initDone && wingScene && wingCamera) {
      loadMandala(wingScene, wingCamera)
    }
    // Keep deps.mandalaGroup in sync so exp-switcher can hide it
    if (mandalaGroup) deps.mandalaGroup = mandalaGroup

    if (mandalaGroup) {
      // Continuous Z rotation
      _rotation += 0.008
      mandalaGroup.rotation.z = _rotation

      // Gentle scale pulse
      if (_sm.active) {
        const pulse = 1.0 + Math.sin(t * 1.8) * 0.05
        mandalaGroup.scale.setScalar(_sm.scale * pulse)
      }


    }

    if (mandalaLoaded && wingCamera) {
      updatePosition(pose, wingCamera)
    }

    // showWings=true → segmentation cuts person out so mandala is BEHIND them
    compositeWings(results.segmentationMask || null, true)

    expDot.className = mandalaLoaded ? "hud-dot yellow" : "hud-dot off"
    expStatus.textContent = mandalaLoaded
      ? (pose ? "MANDALA ✓" : "STAND IN FRAME")
      : "LOADING..."
  },
}