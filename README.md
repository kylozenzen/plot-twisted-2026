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

### Visual system

Landing page, game, icons, and share card all use one theater look: velvet (`#4a1216`), brass (`#e4b34c`), bulb cream (`#fcebc0`), and neon pink (`#ff4d8d`), set in Bungee, Barlow Condensed, Barlow, and Space Mono.

- `assets/css/cinema-polish.css` + `assets/js/cinema-polish.js` — loaded last on the game: ticket-stub box office, proscenium valance, projector beam, film grain, reel labels, and the 3-2-1 leader countdown. They wrap core functions instead of editing them.
- `assets/js/cinema-icons.js` — the line-icon set for every showing, shared by the game board and the landing page.
- `assets/images/icon-marquee-*`, `favicon-marquee-48.png`, `social-share-marquee.png` — the marquee-sign icon set and share card. Icons are served `immutable`, so give a redesigned icon a new filename.
- `assets/images/screens/` — real game screenshots used on the landing page. Recapture them when the game UI changes.

### Difficulty

`assets/data/questions.json` holds one entry per movie: a `title`, a `clues` list (the original clue first, then any alternate versions), and `"deep": true` on lesser-known films. Leave the tag off and a film counts as popular.

- **Normal** (default) deals popular films only.
- **Director's Cut** (Settings → Difficulty) deals from the whole bank and guarantees at least 3 deep cuts per round (`HARD_MIN_DEEP` in `game.js`).
- A round picks titles first, then one clue per title, so adding alternate clues never makes a film show up more often.
- Best scores are kept per mode (`Family` vs `Family:hard`).
- A clue override in `netlify/functions/clue-overrides.js` replaces a movie's first clue and keeps its alternates.

Bump the cache name in `sw.js` whenever `questions.json` changes, or returning players keep the old bank.

An entry can also carry `aliases`: extra accepted answers, matched with the same fuzzy rules as the title. Use them for titles that can't be typed on the phone keyboard, which has letters only (for example `X2` → "X-Men United").

### Keyboard (desktop)

| Key | Action |
| --- | --- |
| Letters, digits, Space | Type the answer |
| Enter | Submit, or continue after a result |
| Shift + Enter | Skip |
| `/` | Hint |
| Esc | Open or close the exit menu |
| 1–8 | Pick a showing at the box office |

Shortcuts only use keys that never appear in an answer. Keycaps show on the buttons on desktops with a mouse and stay hidden on touch screens.

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
