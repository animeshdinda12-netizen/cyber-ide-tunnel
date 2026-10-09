# AGENTS.md

## Project: Cyber IDE (static frontend app)

No build step — the app runs directly from static hosting (CDN scripts only).

## Commands

| Command | Purpose |
|---------|---------|
| `node validate.js` | Syntax-validate the Babel JSX block, `preview.html` script, and `sw.js` (requires `acorn` + `acorn-jsx`). |
| `npm run lint` | N/A — vanilla JS, linted via `node validate.js`. |
| `npm run typecheck` | N/A — vanilla JS. `node validate.js` is the equivalent pre-deploy gate. |
| `npm test` | Manual test: open `index.html` via `npx serve .`, create a project, spin up a tunnel, verify preview. |

## Pre-deploy gate

Run `node validate.js` before committing. All three modules must report `PARSE OK`.

## Deploy

GitHub Actions auto-deploys `main` to GitHub Pages. Push to trigger.
