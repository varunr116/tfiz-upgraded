// coi-serviceworker.js
// Adds Cross-Origin-Isolation headers so ffmpeg.wasm (SharedArrayBuffer)
// works on GitHub Pages without server configuration.
// Source: https://github.com/gzuidhof/coi-serviceworker
self.addEventListener("install", () => self.skipWaiting())
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()))

function crossOriginIsolated(headers) {
  return headers.get("cross-origin-embedder-policy") === "require-corp" &&
         headers.get("cross-origin-opener-policy")   === "same-origin"
}

self.addEventListener("fetch", function (event) {
  if (event.request.cache === "only-if-cached" && event.request.mode !== "same-origin") return

  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (crossOriginIsolated(response.headers)) return response

        const newHeaders = new Headers(response.headers)
        newHeaders.set("Cross-Origin-Embedder-Policy", "require-corp")
        newHeaders.set("Cross-Origin-Opener-Policy", "same-origin")

        return new Response(response.body, {
          status:     response.status,
          statusText: response.statusText,
          headers:    newHeaders,
        })
      })
      .catch(e => console.error(e))
  )
})
