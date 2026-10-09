/*
 * sw.js — Cyber IDE Browser Tunnel Service Worker
 * version: 1.0.2  (cache-bust to force SW reinstall after blank-page deploy)
 *
 * Pure top-level deployment routing mechanism. When a Tunnel Preview URL
 * (preview.html?t=<lz-string>&e=<expiry>&n=<name>) is navigated to, this
 * Service Worker intercepts the network request, decodes the compressed
 * project payload, and serves a synthesized top-level document directly
 * from memory — zero iframes, full permissions for WebRTC / PeerJS / devices.
 *
 * Exported for index.html registration.
 */
const TUNNEL_BASE_PATH = "/preview.html";
const EXPIRY_WINDOW_MS = 900000;

function _decodePayload(param) {
  if (!param || typeof lzString === "undefined") return null;
  try {
    let raw = lzString.decompressFromEncodedURIComponent(param);
    if (raw == null) raw = lzString.decompressFromUTF16(param);
    if (raw == null) {
      const b64 = param.replace(/-/g, "+").replace(/_/g, "/");
      raw = decodeURIComponent(atob(b64));
    }
    return raw;
  } catch { return null; }
}

function _buildPreviewDoc(payload, name) {
  let data = null;
  try { data = JSON.parse(payload); } catch { return null; }
  const html = String(data.html || "");
  let out = '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">';
  out += '<meta name="viewport" content="width=device-width,initial-scale=1">';
  if (data.css) { out += '<style>' + data.css + '</style>'; }
  out += '</head><body>';
  out += html;
  if (data.js) { out += '<script>(function(){try{' + data.js + '}catch(e){console.error("[tunnel]",e);}})();<\/script>'; }
  out += '<footer style="position:fixed;bottom:0;left:0;right:0;background:rgba(2,6,23,0.85);border-top:1px solid #334155;color:#94a3b8;font-family:ui-monospace,monospace;font-size:0.7rem;padding:0.25rem 0.5rem;z-index:2147483646;text-align:center;">Cyber IDE Tunnel • ' + (name || "Live Preview") + ' • no iframe • native top-level</footer>';
  out += '</body></html>';
  return out;
}

const sw = {
  register() {
    if (!("serviceWorker" in navigator)) { return Promise.resolve({ supported: false }); }
    return navigator.serviceWorker.register("/sw.js")
      .then(reg => {
        reg.update();
        return { supported: true, reg };
      })
      .catch(err => {
        console.warn("SW registration fallback:", err);
        return { supported: true, reg: null };
      });
  },
  decodePayload: _decodePayload,
  buildPreviewDoc: _buildPreviewDoc,
};

if (typeof self !== "undefined" && typeof self.addEventListener === "function") {
  self.addEventListener("install", (event) => {
    // Force the waiting SW to become active.
    self.skipWaiting();
  });

  self.addEventListener("activate", (event) => {
    event.waitUntil(self.clients.claim());
  });

  self.addEventListener("fetch", (event) => {
    const url = new URL(event.request.url);

    // Intercept ONLY navigation requests to the preview tunnel page.
    const isPreview = url.pathname === TUNNEL_BASE_PATH || url.pathname.endsWith("/preview.html");
    const hasToken = url.searchParams.has("t") || url.searchParams.has("data");
    const isNavigate = event.request.mode === "navigate" ||
      (event.request.destination === "document" && (event.request.method === "GET"));

    if (isPreview && hasToken && isNavigate) {
      const encoded = url.searchParams.get("t") || url.searchParams.get("data") || "";
      const name = decodeURIComponent(url.searchParams.get("n") || "Live Preview");
      const expiry = url.searchParams.get("e");

      // Expiry check
      if (expiry) {
        try {
          const now = Date.now();
          if (now > Number(expiry)) {
            event.respondWith(new Response(_expiredPage(name), {
              status: 410,
              headers: { "Content-Type": "text/html;charset=utf-8" }
            }));
            return;
          }
        } catch { /* ignore */ }
      }

      const payload = _decodePayload(encoded);
      if (payload != null) {
        const doc = _buildPreviewDoc(payload, name);
        if (doc) {
          event.respondWith(new Response(doc, {
            status: 200,
            headers: {
              "Content-Type": "text/html;charset=utf-8",
              "Cache-Control": "no-store"
            }
          }));
          return;
        }
      }

      // Payload corrupted/missing → friendly error page, still a native top-level doc.
      event.respondWith(new Response(_errorPage(name, "Tunnel payload could not be decoded. The link may be corrupted."), {
        status: 200,
        headers: { "Content-Type": "text/html;charset=utf-8", "Cache-Control": "no-store" }
      }));
      return;
    }

    // Default: let the network handle everything else.
  });

  // Handle messages from clients for tunnel lifecycle events.
  self.addEventListener("message", (event) => {
    try {
      const data = event.data || {};
      if (data.type === "PING") {
        event.source && event.source.postMessage({ type: "PONG", active: true });
      }
    } catch { /* no-op */ }
  });
} else {
  // Running inside index.html as a registration helper module on the main thread.
  // Expose globally so index.html can use it.
  if (typeof window !== "undefined") {
    window.__CYBER_SW = sw;
  }
}

function _errorPage(name, msg) {
  return '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<title>Tunnel Error</title>' +
    '<style>body{margin:0;padding:0;background:#020617;color:#e2e8f0;font-family:ui-monospace,monospace;height:100vh;display:grid;place-items:center;text-align:center;}' +
    '.card{background:rgba(15,23,42,0.9);border:1px solid rgba(248,113,113,.4);border-radius:1rem;padding:2rem;max-width:20rem;}' +
    'h1{color:#f87171}' +
    '</style></head><body><div class="card"><h1>⚠ Tunnel Error</h1>' +
    '<p style="color:#94a3b8;margin:.75rem 0;">Project: ' + (name || "—") + '</p>' +
    '<p style="color:#cbd5e1;font-size:.85rem;">' + (msg || "Unknown error") + '</p>' +
    '<button onclick="location.replace(\'/\')" style="margin-top:1rem;padding:.5rem 1rem;border-radius:.3rem;background:#0891b2;color:#fff;border:0;cursor:pointer;">Back to IDE</button></div></body></html>';
}

function _expiredPage(name) {
  return '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<title>Tunnel Expired</title>' +
    '<style>body{margin:0;padding:0;background:#020617;color:#e2e8f0;font-family:ui-monospace,monospace;height:100vh;display:grid;place-items:center;text-align:center;}' +
    '.card{background:rgba(15,23,42,0.9);border:1px solid rgba(148,165,230,.4);border-radius:1rem;padding:2rem;max-width:20rem;}' +
    'h1{color:#c084fc}' +
    '</style></head><body><div class="card"><h1>⏳ Tunnel Expired</h1>' +
    '<p style="color:#94a3b8;margin:.75rem 0;">Project: ' + (name || "—") + '</p>' +
    '<p style="color:#cbd5e1;font-size:.85rem;">This tunnel link was valid for 15 minutes and has now expired.</p>' +
    '<button onclick="location.replace(\'/\')" style="margin-top:1rem;padding:.5rem 1rem;border-radius:.3rem;background:#0891b2;color:#fff;border:0;cursor:pointer;">Back to IDE</button></div></body></html>';
}

export default sw;
