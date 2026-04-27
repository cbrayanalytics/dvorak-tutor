# Build Progress

**Project:** Dvorak Typing Tutor (browser-based, vanilla JS/CSS)
**Repo:** https://github.com/cbrayanalytics/dvorak-tutor — branch `trunk`
**Last updated:** 2026-04-26

---

## Task Status

| # | Task | Status |
|---|------|--------|
| 1 | Create GitHub repo and initialize git | ✅ done |
| 2 | Create `words.js` with word list and `getWordsForLevel()` | ✅ done |
| 3 | Write and pass tests for `words.js` | ✅ done — 49/49 |
| 4 | Create `styles.css` | ✅ done |
| 5 | Create `index.html` | ✅ done |
| 6 | Create `app.js` with game logic | ✅ done |
| 7 | Write and pass tests for `app.js` | ✅ done — 58/58 |
| 8 | Final browser smoke test | ✅ done — 100% accuracy on first round |

---

## Files Built

### `words.js`
- Embeds ~1100 common English words (all lowercase, no punctuation)
- `LEVEL_CHARS` — object mapping level 1–5 to a `Set` of allowed characters
- `getLevelChars(level)` — returns the Set; falls back to level 5 for out-of-range
- `getWordsForLevel(level)` — filters WORD_LIST to words using only allowed chars
- `getRoundWords(level, count)` — shuffled subset of the level's word pool
- Exports via `module.exports` guard (works in browser + Node)

### `styles.css`
- Dark theme (`--bg: #0f172a`)
- CSS custom properties for all 5 finger colors:
  - `--finger-pinky: #a855f7`, `--finger-ring: #60a5fa`, `--finger-middle: #4ade80`
  - `--finger-index: #fb923c`, `--finger-thumb: #94a3b8`
- Key `data-state` variants: `active`, `locked`, `home-preview`, `next`
- `next` state: filled background + `key-pulse` animation (scale + glow)
- Correct chars in `#text-display` colored by `data-finger` attribute
- Responsive breakpoint at 620px (smaller keys)
- Visual test: `tests/styles.test.html`

### `index.html`
- Full Dvorak keyboard markup: number, upper, home, bottom, space rows
- Every key has `data-char`, `data-finger`, `data-level` attributes
- `data-level` encodes when each key unlocks (matches level system below)
- IDs wired: `#text-display`, `#stat-wpm`, `#stat-acc`, `#stat-level`,
  `#progress-bar`, `#banner`, `#advance-btn`, `#level-map`, `#keyboard`
- Loads `words.js` then `app.js` at bottom of body

---

## Level System (source of truth)

| Level | Letters unlocked | Notes |
|-------|-----------------|-------|
| 1 | a o e u · h t n s | 8 home resting positions |
| 2 | + i d | Inner index keys — completes home row |
| 3 | + p y f g c r l | Upper row letters |
| 4 | + q j k x b m w v z | Bottom row letters |
| 5 | All + punctuation + numbers | Full keyboard |

Level advance condition: ≥ 90% accuracy on a completed round.

---

## app.js — Design (to implement next)

Key functions to write (all pure where possible for testability):

| Function | Purpose |
|----------|---------|
| `renderKeyboard(level)` | Sets `data-state` on each `.key` element based on current level. Level 1 special case: I and D get `home-preview` instead of `locked`. |
| `buildPhrase(level, wordCount)` | Calls `getRoundWords(level, wordCount)`, joins with spaces, returns string. |
| `renderPhrase(phrase)` | Populates `#text-display` with `.char` spans. Each span gets `data-finger` from key lookup. Space chars get class `char-space`. First char gets class `cursor`. |
| `highlightNextKey(char)` | Finds the `.key[data-char]` element and sets its `data-state` to `next`. Clears previous `next` key. |
| `handleKeydown(e)` | Core input handler. Compares typed char to expected. Updates char class (`correct`/`error`), advances cursor, updates stats, flashes key. |
| `calcWpm(charsTyped, elapsedMs)` | `Math.round((charsTyped / 5) / (elapsedMs / 60000))` |
| `calcAccuracy(correct, total)` | `Math.round((correct / total) * 100)` — returns 0 if total is 0 |
| `updateStats(wpm, accuracy)` | Writes to `#stat-wpm`, `#stat-acc`, updates `#progress-bar` width |
| `updateLevelMap(level)` | Sets `.done` / `.current` classes on `#level-map` pips |
| `advanceLevel()` | Increments level, calls `renderKeyboard`, resets round, hides advance button |
| `endRound(accuracy)` | Shows `#banner` with pass/fail message. Shows `#advance-btn` if accuracy ≥ 90 and level < 5. |
| `startRound()` | Builds and renders a new phrase, resets timer and counters, hides banner/button |
| `init()` | Entry point — called on `DOMContentLoaded`. Renders keyboard, starts first round, attaches keydown listener. |

### State variables (module-level)
```js
let currentLevel   = 1;
let phrase         = '';      // full string being typed
let cursor         = 0;       // index into phrase
let correctCount   = 0;
let totalTyped     = 0;
let roundStartTime = null;    // Date.now() on first keypress
```

### Key lookup map
`CHAR_TO_KEY` — built from querying all `.key` elements in the DOM:
```js
// { 'a': { finger: 'pinky-left', level: 1 }, ... }
```
Used by `renderPhrase` to set `data-finger` on each `.char` span, and by
`highlightNextKey` to find the keyboard element to pulse.

---

## Test Files

| File | Tests | Status |
|------|-------|--------|
| `tests/words.test.js` | 49 | ✅ all pass |
| `tests/styles.test.html` | visual | ✅ verified |
| `tests/index.test.js` | 95 | ✅ all pass |
| `tests/app.test.js` | 58 | ✅ all pass |

---

## Decisions Made

- **No build tools** — single `open index.html` to run; no npm, no bundler
- **No external dependencies** — vanilla JS/CSS only
- **Word list embedded** in `words.js` (not fetched) so app works offline
- **`module.exports` guard** in `words.js` allows same file in browser and Node tests
- **`data-state` on keys** (not CSS classes) — makes JS toggling a single attribute write
- **`color-mix()`** used for finger tints — requires Chrome 111+ / Firefox 113+ / Safari 16.2+
- **Advance is manual** — user clicks button after passing a round; no auto-advance
- **Round size** — 8 words per round (will be defined in `app.js` as `ROUND_WORD_COUNT = 8`)
