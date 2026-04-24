// ─── tryon/tryon-renderer.js ──────────────────────────────────
// Orthographic Three.js renderer — landmark-driven garment placement.
// Improvements over v1:
//   - rotation.y from worldLandmarks Z diff (sideways turn)
//   - isActive() exposed for seg compositing check
// ──────────────────────────────────────────────────────────────

export class TryOnRenderer {
  constructor(canvas, W, H) {
    this._canvas = canvas
    this._W = W
    this._H = H
    this._model = null
    this._active = false
    this._garment = null
    this._lerpFactor = 0.2
    this._smoothPos = new THREE.Vector3()
    this._smoothScale = new THREE.Vector3(1, 1, 1)
    this._smoothAngleZ = 0
    this._smoothAngleY = 0
    this._scaleInited = false
    this._normSize = null

    this._initThree()
  }

  // ── Public API ───────────────────────────────────────────

  isActive() { return this._active && !!this._model }

  setActive(v) {
    this._active = v
    if (!v && this._model) this._model.visible = false
  }

  hasModel() { return !!this._model }

  loadGarment(garment) {
    this._garment = garment
    this._scaleInited = false
    this._smoothPos.set(0, 0, 0)
    this._smoothScale.set(1, 1, 1)
    this._smoothAngleZ = 0
    this._smoothAngleY = 0

    if (this._model) { this._scene.remove(this._model); this._model = null }

    const loader = new THREE.GLTFLoader()
    loader.load(garment.glb, (gltf) => {
      this._model = gltf.scene

      // Normalise to 1 world unit
      const box = new THREE.Box3().setFromObject(this._model)
      const size = new THREE.Vector3(); box.getSize(size)
      const sc = 1.0 / Math.max(size.x, size.y, size.z)
      this._model.scale.setScalar(sc)
      const center = new THREE.Vector3(); box.getCenter(center)
      this._model.position.sub(center.multiplyScalar(sc))

      // Apply initial rotation from garment config BEFORE normSize
      // so bounding box is calculated in the correct orientation
      if (garment.rotationX) this._model.rotation.x = garment.rotationX
      if (garment.rotationY) this._model.rotation.y = garment.rotationY

      const nb = new THREE.Box3().setFromObject(this._model)
      this._normSize = nb.getSize(new THREE.Vector3())

      this._model.visible = false
      this._scene.add(this._model)
      console.log("[TryOnRenderer] Loaded:", garment.name)
    }, null, err => console.error("[TryOnRenderer] Load failed:", err))
  }

  /**
   * @param {Array|null} ml        — mirrored screen landmarks (x already flipped)
   * @param {Array|null} rawLms    — raw PoseLandmarker landmarks (for worldLandmarks Z)
   */
  update(ml, rawLms) {
    if (!this._active || !this._model || !ml) {
      if (this._model) this._model.visible = false
      this._renderer.render(this._scene, this._camera)
      return
    }

    const ls = ml[11], rs = ml[12]
    if (!ls || !rs) {
      this._model.visible = false
      this._renderer.render(this._scene, this._camera)
      return
    }
    this._model.visible = true

    const aspect = this._W / this._H
    const frustumH = 2
    const frustumW = frustumH * aspect

    const toWorld = (nx, ny) => ({
      x: (nx * 2 - 1) * (frustumW / 2),
      y: -(ny * 2 - 1) * (frustumH / 2),
    })

    const wLS = toWorld(ls.x, ls.y)
    const wRS = toWorld(rs.x, rs.y)
    const wMid = toWorld((ls.x + rs.x) / 2, (ls.y + rs.y) / 2)

    const lh = ml[23], rh = ml[24]
    const hipsOk = lh && rh && (lh.visibility ?? 1) > 0.3 && (rh.visibility ?? 1) > 0.3
    const hipMidY = hipsOk
      ? (lh.y + rh.y) / 2
      : (ls.y + rs.y) / 2 + Math.abs(rs.x - ls.x) * 1.4
    const wHip = toWorld((ls.x + rs.x) / 2, hipMidY)

    const worldShoulderW = Math.abs(wRS.x - wLS.x)
    const worldTorsoH = Math.abs(wHip.y - wMid.y)
    const g = this._garment

    // ── Position ──────────────────────────────────────────
    // collarRatio: fraction of torsoH to lift suit up (default 0.08)
    // collarOffset: override auto calculation entirely
    // offsetY: final fine-tune per garment (negative = push down)
    const autoCollar = worldTorsoH * (g.collarRatio ?? 0.08) + 0.02
    const collarOffset = g.collarOffset ?? autoCollar
    const targetPos = new THREE.Vector3(
      wMid.x,
      wMid.y - collarOffset + (g.offsetY || 0),
      g.offsetZ || 0
    )

    // ── Scale ─────────────────────────────────────────────
    const baseScale = (worldShoulderW / (this._normSize?.x || 1)) * 1.5 * (g.scale || 1)
    const tScale = new THREE.Vector3(
      Math.max(baseScale * 1.2, 0.01),
      Math.max(baseScale, 0.01),
      Math.max(baseScale * 0.3, 0.001)
    )

    // ── Z rotation — shoulder tilt ─────────────────────────
    const targetAngleZ = -Math.atan2(rs.y - ls.y, rs.x - ls.x)

    // ── Y rotation — sideways turn from worldLandmarks Z ──
    // rawLms[11].z and rawLms[12].z are metric Z in camera space.
    // When facing camera both are ~0. When turned, one shoulder
    // comes forward (negative Z) and the other goes back (positive Z).
    let targetAngleY = 0
    if (rawLms) {
      const rawLS = rawLms[11], rawRS = rawLms[12]
      if (rawLS && rawRS) {
        // Z diff in world metres — clamp to avoid extreme angles
        const zDiff = (rawRS.z - rawLS.z)
        // Map to rotation.y — positive zDiff = turned right
        targetAngleY = Math.max(-Math.PI * 0.45, Math.min(Math.PI * 0.45, zDiff * 2.5))
      }
    }

    // ── Lerp smooth ───────────────────────────────────────
    const t = this._garment.lerpFactor ?? this._lerpFactor
    this._smoothPos.lerp(targetPos, t)
    this._smoothAngleZ += (targetAngleZ - this._smoothAngleZ) * t
    this._smoothAngleY += (targetAngleY - this._smoothAngleY) * t

    if (!this._scaleInited) {
      this._scaleInited = true
      this._smoothScale.copy(tScale)
    } else {
      this._smoothScale.lerp(tScale, t)
    }

    // ── Apply transforms ──────────────────────────────────
    this._model.position.copy(this._smoothPos)
    this._model.rotation.set(this._garment.rotationX || 0, this._smoothAngleY, this._smoothAngleZ)
    this._model.scale.copy(this._smoothScale)

    this._renderer.render(this._scene, this._camera)
  }

  resize(W, H) {
    this._W = W; this._H = H
    this._renderer.setSize(W, H, false)
    this._rebuildCamera()
  }

  // ── Private ──────────────────────────────────────────────

  _initThree() {
    this._renderer = new THREE.WebGLRenderer({
      canvas: this._canvas, alpha: true, antialias: true, premultipliedAlpha: false,
    })
    this._renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this._renderer.setSize(this._W, this._H, false)
    this._renderer.setClearColor(0x000000, 0)

    this._scene = new THREE.Scene()
    this._rebuildCamera()

    // Lighting
    this._scene.add(new THREE.AmbientLight(0xffffff, 3.0))
    const hemi = new THREE.HemisphereLight(0xffffff, 0x888888, 2.0)
    hemi.position.set(0, 5, 0); this._scene.add(hemi)
    const key = new THREE.DirectionalLight(0xffffff, 2.5)
    key.position.set(0, 3, 5); this._scene.add(key)
    const fillL = new THREE.DirectionalLight(0xffffff, 1.2)
    fillL.position.set(-4, 1, 3); this._scene.add(fillL)
    const fillR = new THREE.DirectionalLight(0xffffff, 1.2)
    fillR.position.set(4, 1, 3); this._scene.add(fillR)
    const rim = new THREE.DirectionalLight(0xffffff, 0.8)
    rim.position.set(0, 2, -5); this._scene.add(rim)
  }

  _rebuildCamera() {
    const aspect = this._W / this._H
    const fH = 2, fW = fH * aspect
    this._camera = new THREE.OrthographicCamera(-fW / 2, fW / 2, fH / 2, -fH / 2, 0.01, 100)
    this._camera.position.set(0, 0, 5)
    this._camera.lookAt(0, 0, 0)
  }
}