// ─── three-renderer.js ────────────────────────────────────────
import { isMobile, state } from "./state.js"
import { POSE_IDX } from "./constants.js"
import { screenToWorld } from "./coords.js"
import { compositeRecordFrame } from "./recording.js"
import {
  wingCanvas, wingCompCanvas, personCanvas,
  maskCanvas, maskCompCanvas,
  wctx, pctx, mctx,
  segDot, segStatus,
} from "./dom.js"

const THREE = window.THREE

export let wingRenderer, wingScene, wingCamera
export let maskRenderer, maskScene, maskCamera
export let wingGroup = null
export let maskGroup = null
export let kalkiGroup = null
let armorGroup = null
export const kalkiSmooth = { pos: null, scale: 1, active: false }
export let kalkiLoaded = false
let maskGlbLoaded = false

export function initThree(expDeps) {
  const AA = !isMobile
  const DPR = isMobile ? Math.min(window.devicePixelRatio, 1.5) : window.devicePixelRatio

  wingRenderer = new THREE.WebGLRenderer({ canvas: wingCanvas, alpha: true, antialias: AA })
  wingRenderer.setPixelRatio(DPR)
  wingRenderer.setSize(window.innerWidth, window.innerHeight)
  wingScene = new THREE.Scene()

  wingCamera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.01, 200)
  wingCamera.position.set(0, 0, 5)

  wingScene.add(new THREE.AmbientLight(0x334455, 1.2))
  const wKey = new THREE.DirectionalLight(0x88ccff, 1.8); wKey.position.set(0, 2, 3); wingScene.add(wKey)
  const wRim = new THREE.DirectionalLight(0x00e5ff, 1.0); wRim.position.set(0, -1, -2); wingScene.add(wRim)
  const kKey = new THREE.DirectionalLight(0xffd080, 2.2); kKey.position.set(1, 3, 2); wingScene.add(kKey)
  const kFill = new THREE.DirectionalLight(0x8090ff, 0.9); kFill.position.set(-2, 0, -1); wingScene.add(kFill)

  loadWingsGLB(expDeps)
  buildChestArmor(expDeps)

  maskRenderer = new THREE.WebGLRenderer({ canvas: maskCanvas, alpha: true, antialias: AA })
  maskRenderer.setPixelRatio(DPR)
  maskRenderer.setSize(window.innerWidth, window.innerHeight)
  maskScene = new THREE.Scene()
  maskCamera = new THREE.PerspectiveCamera(63, window.innerWidth / window.innerHeight, 0.01, 1000)
  maskCamera.position.set(0, 0, 0)
  maskScene.add(new THREE.AmbientLight(0x888888, 1.2))
  const mKey = new THREE.DirectionalLight(0xffffff, 2.0); mKey.position.set(0, 1, 1); maskScene.add(mKey)
  const mRim = new THREE.DirectionalLight(0x334466, 1.0); mRim.position.set(-1, -0.5, -1); maskScene.add(mRim)
  loadMaskGLB(expDeps)

  expDeps.wingScene = wingScene
  expDeps.wingCamera = wingCamera
  expDeps.driveKalkiBones = driveKalkiBones
  expDeps.updateKalkiRoot = updateKalkiRoot
  expDeps.updateWingPosition = updateWingPosition
  expDeps.compositeWings = compositeWings
  expDeps.applyFaceMatrix = applyFaceMatrix
  expDeps.updateDebugBody = () => { }

    ; (function loop() {
      requestAnimationFrame(loop)
      const t = performance.now() / 1000
      if (wingGroup && wingGroup.visible) {
        wingGroup.rotation.z = Math.sin(t * 2.2) * 0.04
        wingGroup.rotation.x = Math.sin(t * 1.6) * 0.02
      }
      if (armorGroup) {
        const core = armorGroup.getObjectByName("armorCore")
        if (core) core.material.emissiveIntensity = 1.4 + Math.sin(t * 3.0) * 0.5
      }
      wingRenderer.render(wingScene, wingCamera)
      maskRenderer.render(maskScene, maskCamera)
      compositeRecordFrame()
    })()
}

// ─────────────────────────────────────────────────────────────
// CHEST ARMOR  (procedural geometry)
// ─────────────────────────────────────────────────────────────
function buildChestArmor(expDeps) {
  armorGroup = new THREE.Group()

  const plateMat = new THREE.MeshStandardMaterial({
    color: 0x8899bb, emissive: new THREE.Color(0x112244),
    emissiveIntensity: 0.4, roughness: 0.25, metalness: 0.9,
  })
  const panelMat = new THREE.MeshStandardMaterial({
    color: 0xaabbcc, emissive: new THREE.Color(0x001133),
    emissiveIntensity: 0.3, roughness: 0.2, metalness: 1.0,
  })
  const coreMat = new THREE.MeshStandardMaterial({
    color: 0x00e5ff, emissive: new THREE.Color(0x00e5ff),
    emissiveIntensity: 1.6, roughness: 0.0, metalness: 0.0,
    transparent: true, opacity: 0.95,
  })
  const rimMat = new THREE.MeshStandardMaterial({
    color: 0x4488ff, emissive: new THREE.Color(0x2255cc),
    emissiveIntensity: 0.8, roughness: 0.1, metalness: 0.8,
  })

  // Main chest plate (hexagonal prism)
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.44, 0.06, 6), plateMat)
  plate.rotation.y = Math.PI / 6
  armorGroup.add(plate)

  // Collar ridge
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.48, 0.03, 6), panelMat)
  collar.rotation.y = Math.PI / 6
  collar.position.y = 0.045
  armorGroup.add(collar)

    // Vertical panel strips
    ;[-0.16, 0, 0.16].forEach(ox => {
      const strip = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.35, 0.07), panelMat)
      strip.position.set(ox, -0.01, 0.02)
      armorGroup.add(strip)
    })

  // Belt ridge
  const belt = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.045, 0.065), panelMat)
  belt.position.set(0, -0.2, 0.01)
  armorGroup.add(belt)

    // Shoulder pads
    ;[-0.52, 0.52].forEach(ox => {
      const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.11, 0.055, 6), plateMat)
      pad.rotation.y = Math.PI / 6
      pad.position.set(ox, 0.05, 0.0)
      armorGroup.add(pad)
    })

  // Glowing core disc
  const core = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.10, 0.04, 32), coreMat)
  core.name = "armorCore"
  core.position.set(0, 0.04, 0.05)
  armorGroup.add(core)

  // Core rim torus
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.018, 8, 32), rimMat)
  rim.position.set(0, 0.04, 0.04)
  rim.rotation.x = Math.PI / 2
  armorGroup.add(rim)

  // Edge bevel ring
  const edge = new THREE.Mesh(new THREE.TorusGeometry(0.47, 0.012, 6, 6), rimMat)
  edge.rotation.x = Math.PI / 2
  edge.rotation.y = Math.PI / 6
  armorGroup.add(edge)

  armorGroup.visible = false
  wingScene.add(armorGroup)

  kalkiGroup = armorGroup
  kalkiLoaded = true
  expDeps.kalkiGroup = armorGroup
  expDeps.kalkiLoaded = true
  expDeps.kalkiSmooth = kalkiSmooth
}

// no-op — armor is rigid, no bones
export function driveKalkiBones(_pose) { }

// ─────────────────────────────────────────────────────────────
// ARMOR POSITIONING
// Anchor = shoulder midpoint pushed down into chest
// Scale  = shoulder width × factor
// Tilt   = shoulder angle
// ─────────────────────────────────────────────────────────────
export function updateKalkiRoot(pose) {
  if (!armorGroup || !pose) {
    if (armorGroup) armorGroup.visible = false
    return
  }

  const ls = pose[POSE_IDX.L_SHOULDER]
  const rs = pose[POSE_IDX.R_SHOULDER]
  if (!ls || !rs) { armorGroup.visible = false; return }

  // MediaPipe nx in [0,1] where 0=left edge of raw video.
  // Front camera is mirrored on screen, so flip X.
  const mirror = state.isFrontCamera
  const lx = mirror ? 1 - ls.x : ls.x
  const rx = mirror ? 1 - rs.x : rs.x
  const ly = ls.y, ry = rs.y

  // Chest anchor — midpoint, pushed 10% down into chest
  const cx = (lx + rx) / 2
  const cy = (ly + ry) / 2 + 0.10

  // Direct NDC unproject (skip screenToWorld which re-flips X)
  const _THREE = window.THREE
  const nv = new _THREE.Vector3(cx * 2 - 1, -(cy * 2 - 1), 0.5)
  nv.unproject(wingCamera)
  const dir = nv.sub(wingCamera.position).normalize()
  const worldPos = wingCamera.position.clone().addScaledVector(dir, 4.2)

  // Scale from shoulder width
  const swNorm = Math.abs(rx - lx)
  const worldScale = swNorm * 9.0

  // Tilt to match shoulder angle
  const tiltZ = -Math.atan2(ry - ly, rx - lx)

  // Smooth lerp
  const sm = kalkiSmooth
  if (!sm.active) {
    sm.pos = worldPos.clone()
    sm.scale = worldScale
    sm.tiltZ = tiltZ
    sm.active = true
  } else {
    sm.pos.lerp(worldPos, 0.2)
    sm.scale += (worldScale - sm.scale) * 0.2
    let da = tiltZ - (sm.tiltZ || 0)
    if (da > Math.PI) da -= Math.PI * 2
    if (da < -Math.PI) da += Math.PI * 2
    sm.tiltZ = (sm.tiltZ || 0) + da * 0.2
  }

  armorGroup.position.copy(sm.pos)
  armorGroup.scale.setScalar(sm.scale)
  armorGroup.rotation.set(0, 0, sm.tiltZ)
  armorGroup.visible = true
}

// ─────────────────────────────────────────────────────────────
// WINGS
// ─────────────────────────────────────────────────────────────
function loadWingsGLB(expDeps) {
  const s = document.createElement("script")
  s.src = "https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js"
  s.onload = () => {
    new THREE.GLTFLoader().load(`${import.meta.env.BASE_URL}Wings.glb`, (gltf) => {
      const model = gltf.scene
      const box = new THREE.Box3().setFromObject(model)
      const size = new THREE.Vector3(); box.getSize(size)
      const sc = 4.0 / Math.max(size.x, size.y, size.z)
      model.scale.setScalar(sc)
      const center = new THREE.Vector3(); box.getCenter(center)
      model.position.sub(center.multiplyScalar(sc))
      model.traverse(c => {
        if (c.isMesh) {
          c.material = c.material.clone()
          c.material.emissive = new THREE.Color(0x001133)
          c.material.emissiveIntensity = 0.35
        }
      })
      wingGroup = new THREE.Group()
      wingGroup.add(model)
      wingGroup.visible = false
      wingScene.add(wingGroup)
      state.glbLoaded = true
      expDeps.wingGroup = wingGroup
    }, null, () => buildFallbackWings(expDeps))
  }
  s.onerror = () => buildFallbackWings(expDeps)
  document.head.appendChild(s)
}

function buildFallbackWings(expDeps) {
  const mat = new THREE.MeshStandardMaterial({
    color: 0x0055aa, emissive: new THREE.Color(0x001133), emissiveIntensity: 0.6,
    roughness: 0.3, metalness: 0.8, transparent: true, opacity: 0.9, side: THREE.DoubleSide,
  })
  const gm = new THREE.MeshStandardMaterial({
    color: 0x00e5ff, emissive: new THREE.Color(0x00e5ff), emissiveIntensity: 2.5,
    roughness: 0, metalness: 0, transparent: true, opacity: 0.85,
  })
  wingGroup = new THREE.Group()
    ;[[-1], [1]].forEach(([sign]) => {
      ;[{ len: 1.0, w: 0.22, z: sign * 0.18 }, { len: 1.4, w: 0.18, z: sign * 0.5 }, { len: 1.1, w: 0.14, z: sign * 0.85 }]
        .forEach(({ len, w, z }) => {
          const sh = new THREE.Shape()
          sh.moveTo(-w * 0.5, 0); sh.lineTo(w * 0.5, 0)
          sh.lineTo(w * 0.12, len); sh.lineTo(-w * 0.12, len); sh.closePath()
          const m = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.02, bevelEnabled: false }), mat)
          m.rotation.z = z
          const sp = new THREE.Mesh(new THREE.BoxGeometry(0.016, len * 0.88, 0.016), gm)
          sp.position.set(0, len * 0.44, 0.012); m.add(sp)
          wingGroup.add(m)
        })
    })
  wingGroup.visible = false
  wingScene.add(wingGroup)
  state.glbLoaded = true
  expDeps.wingGroup = wingGroup
}

export function updateWingPosition(pose) {
  if (!pose || !state.glbLoaded || !wingGroup) {
    if (wingGroup) wingGroup.visible = false
    return
  }
  const ls = pose[POSE_IDX.L_SHOULDER], rs = pose[POSE_IDX.R_SHOULDER]
  if (!ls || !rs) { wingGroup.visible = false; return }

  const mx = (ls.x + rs.x) / 2
  const my = (ls.y + rs.y) / 2
  const sw = Math.abs(rs.x - ls.x)
  const sc = sw * 8.0
  const target = screenToWorld(mx, my, 5.8, wingCamera)
  const wp = state.wingPos

  if (!wp.active) { wp.pos = target.clone(); wp.scale = sc; wp.active = true }
  else { wp.pos.lerp(target, 0.12); wp.scale += (sc - wp.scale) * 0.12 }

  wingGroup.position.copy(wp.pos)
  wingGroup.scale.setScalar(wp.scale)
  wingGroup.visible = true
}

// ─────────────────────────────────────────────────────────────
// COMPOSITING
// ─────────────────────────────────────────────────────────────
export function compositeWings(segMask, showWings) {
  const W = state.screen.w, H = state.screen.h
  wctx.clearRect(0, 0, W, H)

  if (showWings) {
    wctx.drawImage(wingCanvas, 0, 0, W, H)
    if (segMask) {
      wctx.globalCompositeOperation = "destination-out"
      if (state.isFrontCamera) {
        wctx.save(); wctx.translate(W, 0); wctx.scale(-1, 1)
        wctx.drawImage(segMask, 0, 0, W, H); wctx.restore()
      } else {
        wctx.drawImage(segMask, 0, 0, W, H)
      }
      wctx.globalCompositeOperation = "source-over"
    }
  }

  pctx.clearRect(0, 0, W, H)
  if (segMask && state.segDebug) {
    if (state.isFrontCamera) {
      pctx.save(); pctx.translate(W, 0); pctx.scale(-1, 1)
      pctx.drawImage(segMask, 0, 0, W, H); pctx.restore()
    } else {
      pctx.drawImage(segMask, 0, 0, W, H)
    }
    pctx.globalCompositeOperation = "source-in"
    pctx.fillStyle = "rgba(0,255,100,.35)"
    pctx.fillRect(0, 0, W, H)
    pctx.globalCompositeOperation = "source-over"
  }

  segDot.className = segMask ? "hud-dot" + (state.segDebug ? " yellow" : "") : "hud-dot off"
  segStatus.textContent = segMask ? "SEG " + (state.segDebug ? "[DEBUG]" : "✓") : "SEG —"
}

export function compositeMask(active) {
  const W = state.screen.w, H = state.screen.h
  mctx.clearRect(0, 0, W, H)
  if (active && maskGlbLoaded) mctx.drawImage(maskCanvas, 0, 0, W, H)
}

// ─────────────────────────────────────────────────────────────
// MASK GLB
// ─────────────────────────────────────────────────────────────
function loadMaskGLB(expDeps) {
  function tryLoad() {
    if (!THREE.GLTFLoader) { setTimeout(tryLoad, 300); return }
    new THREE.GLTFLoader().load(`${import.meta.env.BASE_URL}Mask.glb`, (gltf) => {
      const model = gltf.scene
      const box = new THREE.Box3().setFromObject(model)
      const size = new THREE.Vector3(); box.getSize(size)
      const sc = 18.0 / Math.max(size.x, size.y, size.z)
      model.scale.setScalar(sc)
      const center = new THREE.Vector3(); box.getCenter(center)
      model.position.sub(center.multiplyScalar(sc))
      maskGroup = new THREE.Group()
      maskGroup.add(model)
      maskGroup.visible = false
      maskGroup.matrixAutoUpdate = false
      maskScene.add(maskGroup)
      maskGlbLoaded = true
      expDeps.maskGroup = maskGroup
    }, null, () => { maskGlbLoaded = true })
  }
  tryLoad()
}

export function applyFaceMatrix() {
  if (!maskGroup || !maskGlbLoaded) return
  if (!state.lastFaceMatrix) { maskGroup.visible = false; return }
  const d = state.lastFaceMatrix
  const m = new THREE.Matrix4()
  m.set(
    -d[0], d[4], -d[8], -d[12],
    -d[1], d[5], -d[9], -d[13],
    -d[2], d[6], -d[10], d[14],
    d[3], d[7], d[11], d[15],
  )
  maskGroup.matrix.copy(m)
  maskGroup.matrixAutoUpdate = false
  maskGroup.visible = true
}

// ─────────────────────────────────────────────────────────────
// FACE LANDMARKER
// ─────────────────────────────────────────────────────────────
export async function initFaceLandmarker() {
  try {
    const { FaceLandmarker, FilesetResolver } = await import(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs"
    )
    const filesetResolver = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
    )
    state.faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
      baseOptions: {
        modelAssetPath:
          "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
        delegate: "GPU",
      },
      outputFaceBlendshapes: false,
      outputFacialTransformationMatrixes: true,
      runningMode: "VIDEO",
      numFaces: 1,
    })
    state.faceLandmarkerReady = true
  } catch (err) {
    console.error("FaceLandmarker init failed:", err)
    state.faceLandmarkerReady = false
    state.faceLandmarker = null
  }
}

let _lastFaceTs = -1
export function runFaceDetection(video) {
  if (!state.faceLandmarkerReady || !state.faceLandmarker) return
  if (!video.videoWidth || video.readyState < 2) return
  const now = performance.now()
  if (now <= _lastFaceTs) return
  _lastFaceTs = now
  try {
    const results = state.faceLandmarker.detectForVideo(video, now)
    state.lastFaceMatrix =
      results.facialTransformationMatrixes?.length > 0
        ? results.facialTransformationMatrixes[0].data
        : null
  } catch {
    state.lastFaceMatrix = null
  }
}

// ─────────────────────────────────────────────────────────────
// RESIZE
// ─────────────────────────────────────────────────────────────
export function resizeRenderers(w, h, dpr) {
  if (wingRenderer) wingRenderer.setSize(w, h)
  if (wingCamera) { wingCamera.aspect = w / h; wingCamera.updateProjectionMatrix() }
  if (maskRenderer) maskRenderer.setSize(w, h)
  if (maskCamera) { maskCamera.aspect = w / h; maskCamera.updateProjectionMatrix() }
}