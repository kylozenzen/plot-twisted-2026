# Plot Twisted

**Movie plots, twisted beyond recognition.** Plot Twisted is a browser-based movie trivia game from Nobody Creative. Players get a deliberately ridiculous plot summary, type the movie title, and work through five-question showings across multiple categories.

**Live:** https://plot-twisted.netlify.app/

## Production architecture

Plot Twisted is intentionally a static site. The production URL must stay boring and predictable:

| Route | Source | Notes |
| --- | --- | --- |
| `/` | `index.html` | Canonical game URL. Netlify serves this file directly; there is no root redirect, rewrite, or renderer function. |
| `/play` | 301 → `/` | Legacy compatibility only. |
| `/privacy` | `privacy.html` | Privacy policy. |

`game.js` loads `questions.json` in the browser. There is no server-side game renderer and no server-side clue override layer.

### Routing guardrail

**Do not put `/` behind a Netlify Function or add a root rule to `_redirects`.** `index.html` is the root document and is intentionally served as a static file. This keeps browser navigation, social crawlers, canonical metadata, and the PWA pointed at the same URL.

`netlify.toml` pins the publish directory to the repository root. `scripts/validate-social-preview.py` and the `Validate social preview` GitHub Action enforce the routing and metadata contract on pull requests and pushes to `main`.

## What is live

- Six movie categories with randomized five-question rounds
- Fuzzy answer matching and hints
- Keyboard-style theater interface on desktop and mobile
- Shareable end-of-round receipts
- Installable PWA
- Optional analytics and Netlify feedback form
- No account required

## Production files

### Game
- `index.html` — canonical game shell and social metadata at `/`
- `game.css` — game UI
- `game.js` — game logic and client-side question loading
- `questions.json` — canonical question library

### Site / PWA
- `manifest.webmanifest` — PWA manifest; start URL and scope are `/`
- `sw.js` — offline/runtime cache; social preview artwork is deliberately not cached by the service worker
- `icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `apple-touch-icon-180.png` — app/browser icons
- `_headers` — Netlify headers for static files
- `_redirects` — legacy `/play` and privacy routing only; never add a root rule
- `netlify.toml` — explicit Netlify publish/functions directories
- `netlify/functions/analytics.js` — consent-aware analytics loader; the only production Netlify Function

### Social preview

The canonical Open Graph/Twitter card is a direct static PNG at:

`/assets/social/plot-twisted-share-8e257690.png`

The filename is content-addressed so the asset can safely use immutable caching without reusing an old social-crawler cache entry. `index.html` points directly to this absolute PNG URL. There is no image transformation endpoint and no query-string cache versioning.

### Privacy
- `privacy.html`
- `privacy.css`

### Historical landing assets

`landing-v4.html`, its JS, and landing CSS files are retained for reference, but they are not routed to `/` and are not part of the canonical game entry point. Do not infer production routing from their versioned filenames.

## Validation

Run:

```bash
python scripts/validate-social-preview.py
```

The check fails if the root is routed through `_redirects`, the removed renderer functions return, the social metadata points at a stale/ transformed URL, the PNG is missing or has the wrong dimensions, the service worker caches social artwork, or Netlify's publish directory is no longer pinned to the repository root.

## Built by

A **Nobody Creative** project by Ben Campbell.

Trust nobody. Especially the hints.
