# Plot Twisted

**Movie plots, twisted beyond recognition.** Plot Twisted is a browser-based movie trivia game from Nobody Creative. Players guess movies from ridiculous plot summaries across randomized five-question showings.

**Live:** https://plot-twisted.netlify.app

## Project structure

```text
.
├── assets/
│   ├── css/          # Landing, game, and privacy styles
│   ├── data/         # Movie question library
│   ├── images/       # App icons and the active social card
│   └── js/           # Landing interactions and game logic
├── archive/          # Inactive historical sources and exports
├── netlify/functions # Play renderer, clue overrides, and analytics
├── index.html        # Landing page
├── game.html         # Game shell rendered by the play function
├── privacy.html      # Privacy policy
├── manifest.webmanifest
└── sw.js             # PWA service worker
```

The site intentionally has no build step. Production assets use stable, descriptive names; obsolete versioned files belong in `archive/`.

## Routes

| Route | Source | Notes |
| --- | --- | --- |
| `/` | `index.html` | Marketing / launch page |
| `/play` | `netlify/functions/play.js` → `game.html` | Injects question data and clue overrides |
| `/privacy` | `privacy.html` | Privacy policy |

Netlify route rules live in `_redirects`.

## Development

Serve the repository root with a static HTTP server. The Netlify CLI is required to exercise the `/play` function exactly as deployed; `game.html` can also load the question library directly as a static fallback.

When an active cached asset is renamed, moved, or removed, update `ASSETS` and bump `CACHE` in `sw.js` so existing PWA installs do not retain stale files.

## Archive policy

Files in `archive/` are retained only for reference and are not shipped through the active dependency graph. See `archive/README.md` for the inventory.

## Built by

A **Nobody Creative** project by Ben Campbell.

Trust nobody. Especially the hints.
