# Plot Twisted

**Movie plots, twisted beyond recognition.** Plot Twisted is a browser-based movie trivia game from Nobody Creative. Players get a deliberately ridiculous plot summary, type the movie title, and work through five-question showings across multiple categories.

**Live:** https://plot-twisted.netlify.app

## What is live

- Eight movie categories with randomized five-question rounds
- Fuzzy answer matching and hints
- Keyboard-style theater interface on desktop and mobile
- Shareable end-of-round receipts
- Installable PWA
- Optional analytics and Netlify feedback form
- No account required

## Routes

| Route | Source | Notes |
| --- | --- | --- |
| `/` | `landing-v4.html` | Marketing / launch page, rewritten by Netlify |
| `/play` | `netlify/functions/play.js` → `index.html` | Injects question data and clue overrides before returning the game HTML |
| `/privacy` | `privacy.html` | Privacy policy |

Route rules live in `_redirects`.

## Production files

### Landing page
- `landing-v4.html` — current landing page markup
- `landing-v4.js` — landing interactions, install UI, demo behavior
- `landing-v2.css` — primary landing styles
- `landing-v3.css` — current landing overrides
- `brand-icons.css` — shared brand icon styling
- `install.css` — install/PWA UI styles

The versioned names are historical, but these files are **currently active**. Do not archive them solely because the names look old.

### Game
- `index.html` — game shell and social metadata for `/play`
- `game.css` — game UI
- `game.js` — game logic
- `questions.json` — question library, including 80 Horror clues and 80 Classics clues balanced across the 1960s–1990s
- `netlify/functions/play.js` — `/play` renderer
- `netlify/functions/clue-overrides.js` — server-side clue overrides

### Site / PWA
- `manifest.webmanifest` — PWA manifest
- `sw.js` — service worker and offline cache
- `icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `apple-touch-icon-180.png` — app and browser icons
- `_headers` — Netlify cache/content headers
- `_redirects` — Netlify routing
- `netlify/functions/analytics.js` — consent-aware analytics loader

### Privacy
- `privacy.html`
- `privacy.css`

## Social previews

Both `/` and `/play` use the same direct PNG asset for Open Graph and Twitter/X metadata:

`https://plot-twisted.netlify.app/icon-512.png?v=20260810`

This intentionally avoids depending on an SVG-to-PNG transformation endpoint during social-crawler requests. The query version can be bumped when the preview asset changes to help bypass cached unfurls.

## Archive

Files in `archive/` are retained for reference but are not part of the active production dependency graph.

- `archive/social-preview-v2.svg` — previous social preview source that relied on Netlify image transformation
- `archive/site-polish.css` — unused polish stylesheet from an earlier landing-page pass

## Service worker note

Whenever an active cached asset is renamed, moved, or removed, update the `ASSETS` list in `sw.js` and bump the cache version. Otherwise existing PWA installs can keep stale files or fail during service-worker installation.

## Deployment

The site is deployed on Netlify from this repository. There is no build step; the project is primarily static HTML/CSS/JS plus Netlify Functions.

## Built by

A **Nobody Creative** project by Ben Campbell.

Trust nobody. Especially the hints.
