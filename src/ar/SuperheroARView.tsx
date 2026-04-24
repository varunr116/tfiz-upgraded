// ─── SuperheroARView.tsx ──────────────────────────────────────
// React wrapper for the SuperheroAR experience.
// Uses dynamic import for ar-init so dom.js only runs AFTER
// React has painted the DOM — not at Vite bundle parse time.
// NOW INCLUDES: Unlock overlay and MindAR container
// ──────────────────────────────────────────────────────────────
import React, { useEffect } from "react"
import "./superhero-ar.css"
import "./unlock/unlock.css"

interface Props {
  onClose: () => void
}

const SuperheroARView: React.FC<Props> = ({ onClose }) => {
  useEffect(() => {
    document.body.style.overflow = "hidden"

    let destroyed = false

    // Dynamic import — Vite only evaluates ar-init (and dom.js)
    // when this runs, which is AFTER React has rendered the DOM.
    const timer = setTimeout(() => {
      import("./ar-init.js").then(({ initAR }) => {
        if (!destroyed) {
          initAR().catch((err) =>
            console.error("[SuperheroARView] initAR failed:", err),
          )
        }
      })
    }, 50)

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)

    return () => {
      destroyed = true
      clearTimeout(timer)
      document.body.style.overflow = ""
      window.removeEventListener("keydown", onKey)
      // Dynamic import for destroyAR too — same module, already cached
      import("./ar-init.js").then(({ destroyAR }) => destroyAR())
    }
  }, [])

  return (
    <div className="ar-root">
      {/* ── Splash screen ── */}
      <div id="splash">
        <div className="splash-ring">
          <span className="splash-icon">⚡</span>
        </div>
        <div className="splash-title">SuperheroAR</div>
        <div className="splash-sub">Tap to activate &amp; allow camera</div>
      </div>

      {/* ✨ NEW: Unlock Overlay ── */}
      <div id="unlock-overlay" className="unlock-hidden">
        <div className="unlock-icon">🔒</div>
        <div className="unlock-text">
          <div className="unlock-text-main">SCAN TO UNLOCK</div>
          <div className="unlock-text-sub">Point your camera at the poster</div>
        </div>
        <div className="unlock-scanning"></div>
      </div>

      {/* ✨ NEW: Unlock Success Toast ── */}
      <div id="unlock-toast" className="unlock-toast-hidden"></div>

      {/* ✨ NEW: MindAR Container (hidden, used for tracking) ── */}
      <div
        id="mindar-container"
        style={{
          position: "absolute",
          width: "1px",
          height: "1px",
          overflow: "hidden",
          opacity: 0,
          pointerEvents: "none",
        }}></div>

      {/* ── Camera video ── */}
      <video id="video" autoPlay playsInline muted></video>

      {/* ── Canvas stack ── */}
      <canvas
        id="aura-canvas"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          zIndex: 2,
          pointerEvents: "none",
          display: "none",
        }}
      />
      <canvas id="wing-canvas" />
      <canvas id="wing-comp-canvas" />
      <canvas id="person-canvas" />
      <canvas id="mask-canvas" />
      <canvas id="mask-comp-canvas" />
      <canvas id="overlay-canvas" />
      <canvas
        id="record-canvas"
        style={{
          display: "none",
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          zIndex: -1,
        }}
      />

      {/* ── HIDE UI button ── */}
      <button id="btn-toggle-ui" title="Toggle HUD">
        HIDE UI
      </button>

      {/* ── Record button ── */}
      <div id="rec-timer">⏺ 00:00</div>
      <button id="btn-record" title="Record">
        <span id="rec-dot"></span>
        <span id="rec-label">REC</span>
      </button>

      {/* ── Back button ── */}
      <button
        onClick={onClose}
        style={{
          position: "absolute",
          top: 12,
          left: 12,
          zIndex: 999,
          background: "rgba(0,0,0,0.6)",
          border: "1px solid rgba(255,255,255,0.18)",
          color: "#fff",
          fontFamily: "Courier New, monospace",
          fontSize: 11,
          letterSpacing: "0.1em",
          padding: "7px 14px",
          borderRadius: 20,
          cursor: "pointer",
          backdropFilter: "blur(10px)",
        }}>
        ← BACK
      </button>

      {/* ── Package Scan Button - Opens Netlify ── */}
      <button
        id="btn-package-scan"
        title="Scan T-Shirt Tube (Opens in new tab)"
        style={{
          position: "absolute",
          top: 12,
          right: 12,
          zIndex: 999,
          background: "rgba(138, 43, 226, 0.8)",
          border: "1px solid rgba(255,255,255,0.18)",
          color: "#fff",
          fontFamily: "Courier New, monospace",
          fontSize: 11,
          letterSpacing: "0.1em",
          padding: "7px 14px",
          borderRadius: 20,
          cursor: "pointer",
          backdropFilter: "blur(10px)",
        }}>
        📦 SCAN TUBE
      </button>

      {/* ── Debug HUD ── */}
      <div id="debug-hud">
        <div className="hud-pill">
          <div className="hud-dot red" id="cam-dot"></div>
          <span id="cam-status">CAMERA OFFLINE</span>
        </div>
        <div className="hud-pill">
          <div className="hud-dot off" id="mp-dot"></div>
          <span id="mp-status">MEDIAPIPE LOADING</span>
        </div>
        <div className="hud-pill">
          <div className="hud-dot off" id="fps-dot"></div>
          <span id="fps-status">FPS --</span>
        </div>
        <div className="hud-pill">
          <div className="hud-dot off" id="seg-dot"></div>
          <span id="seg-status">SEG --</span>
        </div>
        <div className="hud-pill">
          <div className="hud-dot off" id="exp-dot"></div>
          <span id="exp-status">EXP --</span>
        </div>
        <div className="hud-pill" id="perf-pill">
          <div className="hud-dot yellow"></div>
          <span>MOBILE MODE</span>
        </div>
      </div>

      {/* ── Controls ── */}
      <div id="controls">
        <button className="ctrl-btn" id="btn-seg">
          MASK DEBUG: OFF
        </button>
      </div>

      {/* ── Camera mode pill + Flip button ── */}
      <div id="cam-mode-pill">FRONT</div>
      <button id="btn-flip" title="Flip Camera">
        &#x1F504;
      </button>

      {/* ── Try-On button ── */}
      <button id="btn-tryon" title="Try On Mode">
        👕 TRY ON
      </button>

      {/* ── Hint overlay ── */}
      <div id="hint-overlay" className="hint-hidden">
        <div id="hint-icon">✋</div>
        <div id="hint-text">Loading…</div>
      </div>

      {/* ── Category toast ── */}
      <div id="cat-toast" className="cat-toast-hidden"></div>

      {/* ── Experience bar ── */}
      <div id="exp-bar">
        <div id="exp-name">ANGEL WINGS</div>
        <div id="exp-dots"></div>
      </div>
    </div>
  )
}

export default SuperheroARView
