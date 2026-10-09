# Cyber IDE — Backendless Web Dev Studio + Browser Tunnel

A single-page, backendless web development IDE and "Browser Tunnel" deployment platform
built with React, Tailwind CSS (CDN), and Lucide icons — zero build step, zero npm.

## Features

- **Dashboard** — grid of saved projects persisted in browser LocalStorage
- **New Project wizard** — unified single-HTML or split HTML/CSS/JS structure + optional local file import
- **Workspace IDE** — live editors, clear pane, remove template, rename, download (`.html` or `.zip`)
- **Browser Tunnel** — compresses the active project into a 15-minute expiring URL via `lz-string`,
  served as a **pure top-level window** (no frames) by a Service Worker for full WebRTC / PeerJS / device
  permission compatibility

## Files

| File | Purpose |
|------|---------|
| `index.html` | Main IDE application (React + Babel + Tailwind + Lucide) |
| `preview.html` | Standalone tunnel preview page (decodes payload, renders top-level) |
| `sw.js` | Service Worker — intercepts `preview.html?t=...` navigations, unpacks & serves memory HTML |
| `AGENTS.md` | Build / lint / test commands |
| `README.md` | This file |

## Run locally

1. Serve the directory with any static server:
   ```
   npx serve .
   ```
2. Open `http://localhost:3000` (or wherever serve binds).
3. Projects are saved to `localStorage` — no backend.

## How the Tunnel works

1. Click **🚀 Spin Up Tunnel Server**.
2. `index.html` serializes the project JSON, compresses with `lz-string`, appends a
   15-minute expiry timestamp and project name, then opens `preview.html?t=…&e=…&n=…`.
3. The Service Worker (`sw.js`) intercepts the navigation, decodes the payload in
   memory, and responds with a synthesized `text/html` document — the project renders
   as a **native top-level window** with no `<iframe>`, so `getUserMedia`, `RTCPeerConnection`,
   `PeerJS`, and geolocation run without sandbox restrictions.
4. A live countdown overlay displays remaining time; **Kill Server** dismisses it.

## Deploy to GitHub Pages

This repo is configured for GitHub Pages on the `main` branch via the workflow in
`.github/workflows/pages.yml`. The app is fully static and runs from any static host.

## License

MIT — see `LICENSE`.
