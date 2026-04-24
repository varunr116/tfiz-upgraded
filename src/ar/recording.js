// ─── recording.js ─────────────────────────────────────────────
// Records via MediaRecorder (webm on Android/desktop).
// On stop, converts webm → mp4 using ffmpeg.wasm in-browser.
// iOS Safari: canvas.captureStream() unsupported — shows native
// screen record instructions instead.
// ──────────────────────────────────────────────────────────────
import { state } from "./state.js"
import {
  video, wingCompCanvas, personCanvas, maskCompCanvas,
  overlayCanvas, recordCanvas, rctx,
  recBtn, recLabel, recTimer,
} from "./dom.js"

let _mediaRecorder = null
let _recChunks = []
let _recStartTime = 0
let _recTimerInterval = null
let _isRecording = false

// ffmpeg.wasm instance — loaded lazily on first recording
let _ffmpeg = null
let _ffmpegReady = false
let _ffmpegLoading = false

// ── Platform detection ────────────────────────────────────────
const _isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)

const _canCaptureStream = typeof HTMLCanvasElement !== "undefined" &&
  typeof HTMLCanvasElement.prototype.captureStream === "function"

// ── MIME: prefer webm for recording (best MediaRecorder support)
// then convert to mp4 via ffmpeg.wasm after stop.
const MIME_CANDIDATES = [
  "video/webm;codecs=vp9",
  "video/webm;codecs=vp8",
  "video/webm",
  "video/mp4",
]

function _getBestMime() {
  if (typeof MediaRecorder === "undefined") return null
  return MIME_CANDIDATES.find(m => MediaRecorder.isTypeSupported(m)) || null
}

// ── Load ffmpeg.wasm lazily ───────────────────────────────────
// Uses ffmpeg.wasm 0.12.x from CDN with SharedArrayBuffer support.
// Falls back to direct webm download if ffmpeg fails to load.
async function _loadFFmpeg() {
  if (_ffmpegReady) return true
  if (_ffmpegLoading) {
    // Wait for in-progress load
    await new Promise(resolve => {
      const check = setInterval(() => {
        if (!_ffmpegLoading) { clearInterval(check); resolve() }
      }, 100)
    })
    return _ffmpegReady
  }
  _ffmpegLoading = true
  _showToast("⚙️ Loading converter… (~30MB, once only)", 8000)

  try {
    // Dynamically import ffmpeg.wasm UMD build
    await _loadScript("https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.12.6/dist/umd/ffmpeg.js")
    await _loadScript("https://cdn.jsdelivr.net/npm/@ffmpeg/util@0.12.1/dist/umd/index.js")

    const { FFmpeg } = window.FFmpegWASM || window["@ffmpeg/ffmpeg"] || {}
    if (!FFmpeg) throw new Error("FFmpeg global not found")

    _ffmpeg = new FFmpeg()

    // Load the core wasm — this is the ~30MB download
    await _ffmpeg.load({
      coreURL: "https://cdn.jsdelivr.net/npm/@ffmpeg/core-st@0.12.6/dist/umd/ffmpeg-core.js",
      wasmURL: "https://cdn.jsdelivr.net/npm/@ffmpeg/core-st@0.12.6/dist/umd/ffmpeg-core.wasm",
    })

    _ffmpegReady = true
    _ffmpegLoading = false
    return true
  } catch (e) {
    console.warn("ffmpeg.wasm failed to load:", e)
    _ffmpegLoading = false
    return false
  }
}

function _loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return }
    const s = document.createElement("script")
    s.src = src
    s.onload = resolve
    s.onerror = reject
    document.head.appendChild(s)
  })
}

// ── Convert webm blob → mp4 blob via ffmpeg.wasm ─────────────
async function _convertToMp4(webmBlob) {
  const ok = await _loadFFmpeg()
  if (!ok) return null   // ffmpeg unavailable — caller falls back to webm

  _showToast("🎬 Converting to MP4…", 15000)

  try {
    const { fetchFile } = window["@ffmpeg/util"] || {}

    // Write input
    const inData = new Uint8Array(await webmBlob.arrayBuffer())
    await _ffmpeg.writeFile("input.webm", inData)

    // Remux webm → mp4 (copy codecs — very fast, no re-encode)
    await _ffmpeg.exec([
      "-i", "input.webm",
      "-c:v", "copy",
      "-c:a", "copy",
      "-movflags", "+faststart",   // moov atom at front for streaming
      "output.mp4"
    ])

    const outData = await _ffmpeg.readFile("output.mp4")

    // Clean up wasm filesystem
    await _ffmpeg.deleteFile("input.webm")
    await _ffmpeg.deleteFile("output.mp4")

    _hideToast()
    return new Blob([outData.buffer], { type: "video/mp4" })
  } catch (e) {
    console.warn("ffmpeg conversion failed:", e)
    _hideToast()
    return null
  }
}

// ── Simple toast (reuses hint overlay) ───────────────────────
let _toastTimer = null
function _showToast(msg, duration = 3000) {
  const icon = document.getElementById("hint-icon")
  const text = document.getElementById("hint-text")
  const overlay = document.getElementById("hint-overlay")
  if (!overlay) return
  clearTimeout(_toastTimer)
  if (icon) icon.textContent = ""
  if (text) text.textContent = msg
  overlay.style.display = ""
  overlay.classList.remove("hint-hidden", "hint-fade-out")
  if (duration > 0) {
    _toastTimer = setTimeout(() => _hideToast(), duration)
  }
}
function _hideToast() {
  const overlay = document.getElementById("hint-overlay")
  if (!overlay) return
  overlay.classList.add("hint-fade-out")
  setTimeout(() => overlay.classList.add("hint-hidden"), 600)
}

function _showIOSPrompt() {
  _showToast("📱 Use iPhone Screen Record\n(Control Centre → Screen Record)", 5000)
}

// ── Composite frame (called every render tick) ────────────────
export function compositeRecordFrame() {
  if (!_isRecording) return
  const W = state.screen.w, H = state.screen.h
  rctx.clearRect(0, 0, W, H)

  rctx.save()
  if (state.isFrontCamera) {
    rctx.translate(W, 0)
    rctx.scale(-1, 1)
  }
  if (video.readyState >= 2) rctx.drawImage(video, 0, 0, W, H)
  rctx.restore()

  rctx.drawImage(wingCompCanvas, 0, 0, W, H)
  rctx.drawImage(personCanvas, 0, 0, W, H)
  rctx.drawImage(maskCompCanvas, 0, 0, W, H)
  rctx.drawImage(overlayCanvas, 0, 0, W, H)
}

function _formatTime(ms) {
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  return String(m).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0")
}

function _downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 8000)
}

// ── Start ─────────────────────────────────────────────────────
export function startRecording() {
  if (_isRecording) return

  if (_isIOS || !_canCaptureStream) {
    _showIOSPrompt()
    return
  }

  const W = state.screen.w, H = state.screen.h
  recordCanvas.width = W
  recordCanvas.height = H

  const mime = _getBestMime()
  const stream = recordCanvas.captureStream(30)

  try {
    _mediaRecorder = new MediaRecorder(stream, mime ? { mimeType: mime } : {})
  } catch (e) {
    _mediaRecorder = new MediaRecorder(stream)
  }

  _recChunks = []
  _mediaRecorder.ondataavailable = e => { if (e.data.size > 0) _recChunks.push(e.data) }

  _mediaRecorder.onstop = async () => {
    const recordedMime = _mediaRecorder.mimeType || mime || "video/webm"
    const webmBlob = new Blob(_recChunks, { type: recordedMime })
    _recChunks = []

    const isWebm = recordedMime.includes("webm")

    if (isWebm) {
      // Try to convert to mp4
      const mp4Blob = await _convertToMp4(webmBlob)
      if (mp4Blob) {
        _downloadBlob(mp4Blob, "SuperheroAR_" + Date.now() + ".mp4")
      } else {
        // ffmpeg unavailable — fall back to webm download
        _showToast("⚠️ Saved as .webm (open on desktop)", 4000)
        _downloadBlob(webmBlob, "SuperheroAR_" + Date.now() + ".webm")
      }
    } else {
      // Already mp4 (some browsers)
      _downloadBlob(webmBlob, "SuperheroAR_" + Date.now() + ".mp4")
    }
  }

  _mediaRecorder.start(100)
  _isRecording = true
  _recStartTime = performance.now()

  recBtn.classList.add("recording")
  recLabel.textContent = "STOP"
  recTimer.style.display = "block"
  _recTimerInterval = setInterval(() => {
    recTimer.textContent = "⏺ " + _formatTime(performance.now() - _recStartTime)
  }, 500)

  // Pre-load ffmpeg in background while user is recording
  // so conversion is faster when they stop
  if (!_ffmpegReady && !_ffmpegLoading) {
    setTimeout(() => _loadFFmpeg(), 1000)
  }
}

// ── Stop ──────────────────────────────────────────────────────
export function stopRecording() {
  if (!_isRecording || !_mediaRecorder) return
  _mediaRecorder.stop()
  _isRecording = false
  recBtn.classList.remove("recording")
  recLabel.textContent = "REC"
  recTimer.style.display = "none"
  clearInterval(_recTimerInterval)
}

// ── Init ──────────────────────────────────────────────────────
export function initRecording() {
  if (_isIOS || !_canCaptureStream) {
    recBtn.title = "Use iPhone Screen Record (Control Centre)"
    const badge = document.createElement("span")
    badge.textContent = "iOS"
    badge.style.cssText = "font-size:8px;font-weight:700;letter-spacing:0.05em;opacity:0.6;margin-left:2px;"
    recBtn.appendChild(badge)
  }

  recBtn.addEventListener("click", () => {
    if (_isRecording) stopRecording()
    else startRecording()
  })
}