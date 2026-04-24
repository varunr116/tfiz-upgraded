// ─── qr.js ────────────────────────────────────────────────────
// QR scan gate: opens back camera, scans frames with jsQR,
// unlocks AR only when the correct code is detected.
// ──────────────────────────────────────────────────────────────
import { qrGate, qrPreview, qrCanvas, qrCtx, qrStatus } from "./dom.js"

// Change this string to match whatever you print on your QR card.
export const QR_UNLOCK_VALUE = "TFIZ_AR_UNLOCK"

let _qrStream = null
let _qrRafId = null
let _qrUnlocked = false

// Injected by main.js to avoid circular dep (qr → camera → qr)
let _onUnlock = null

/**
 * Call once from main.js, passing the startCamera function.
 * This breaks the circular dependency between qr.js and camera.js.
 */
export function setQRUnlockCallback(fn) {
  _onUnlock = fn
}

export async function startQRGate() {
  qrGate.classList.remove("hidden")
  try {
    _qrStream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: "environment" },
        width: { ideal: 640 },
        height: { ideal: 480 },
      },
      audio: false,
    })
    qrPreview.srcObject = _qrStream
    await qrPreview.play()
    _scanQRLoop()
  } catch (err) {
    qrStatus.textContent = "Camera unavailable — skipping scan"
    setTimeout(() => _unlockAR(), 1500)
  }
}

function _scanQRLoop() {
  if (_qrUnlocked) return
  const vw = qrPreview.videoWidth, vh = qrPreview.videoHeight
  if (vw > 0 && vh > 0) {
    qrCanvas.width = vw
    qrCanvas.height = vh
    qrCtx.drawImage(qrPreview, 0, 0, vw, vh)
    const imgData = qrCtx.getImageData(0, 0, vw, vh)
    const code = jsQR(imgData.data, vw, vh, { inversionAttempts: "dontInvert" })
    if (code) {
      if (code.data === QR_UNLOCK_VALUE) {
        qrStatus.textContent = "✓ Unlocked!"
        qrStatus.classList.add("found")
        _qrUnlocked = true
        setTimeout(() => _unlockAR(), 600)
        return
      } else {
        qrStatus.textContent = "Wrong code — try again"
        setTimeout(() => { qrStatus.textContent = "Searching for QR code…" }, 1200)
      }
    }
  }
  _qrRafId = requestAnimationFrame(_scanQRLoop)
}

function _unlockAR() {
  if (_qrStream) { _qrStream.getTracks().forEach(t => t.stop()); _qrStream = null }
  cancelAnimationFrame(_qrRafId)
  qrGate.classList.add("hidden")
  if (_onUnlock) _onUnlock()
}
