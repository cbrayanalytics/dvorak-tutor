# Build Progress

**Project:** Dvorak Typing Tutor (browser-based, vanilla JS/CSS)
**Repo:** https://github.com/cbrayanalytics/dvorak-tutor — branch `trunk`
**Last updated:** 2026-04-26
**Phase 1 complete.** Now starting Phase 2 — Difficulty Tuning.

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

## app.js — Implemented functions

| Function | Purpose |
|----------|---------|
| `calcWpm(charsTyped, elapsedMs)` | Pure — WPM calculation |
| `calcAccuracy(correct, total)` | Pure — accuracy % |
| `getKeyState(keyLevel, activeLevel, char)` | Pure — returns `active`/`locked`/`home-preview` |
| `buildPhrase(level, wordCount)` | Pure — joins `getRoundWords()` output with spaces |
| `buildCharMap()` | DOM — builds `CHAR_TO_KEY` from keyboard markup at init |
| `renderKeyboard(level)` | DOM — sets `data-state` on all `.key` elements |
| `highlightNextKey(char)` | DOM — pulses the next key to type |
| `flashKey(char, type)` | DOM — ok/err flash animation on a key |
| `renderPhrase(text)` | DOM — populates `#text-display` with `.char` spans |
| `updateStats()` | DOM — writes WPM/ACC/progress bar |
| `updateLevelMap(level)` | DOM — sets done/current classes on level pips |
| `startRound()` | DOM — resets all state, renders new phrase |
| `endRound()` | DOM — shows banner + advance button |
| `advanceLevel()` | DOM — increments level, re-renders keyboard, starts round |
| `handleKeydown(e)` | DOM — core input handler |
| `init()` | DOM — entry point, called on DOMContentLoaded |

---

## Test Files

| File | Tests | Status |
|------|-------|--------|
| `tests/words.test.js` | 49 | ✅ all pass |
| `tests/styles.test.html` | visual | ✅ verified |
| `tests/index.test.js` | 95 | ✅ all pass |
| `tests/app.test.js` | 58 | ✅ all pass |

---

## Phase 2 — Difficulty Tuning (in progress)

### Goal
Let the user adjust difficulty settings without touching code. Values persist via `localStorage`.

### Three settings
| Setting | Current hardcoded value | Control type |
|---------|------------------------|--------------|
| Words per round | `ROUND_WORD_COUNT = 8` | Stepper / slider (range: 4–20) |
| Advance threshold | `ADVANCE_THRESHOLD = 90` | Stepper / slider (range: 50–100%) |
| Time limit | none | Toggle + stepper in seconds (off / 15s–120s) |

### Approach
- Gear icon `⚙` button in the header opens/closes a settings panel
- Panel sits above the stats bar (slides down)
- On change, values update the live constants in `app.js` and restart the current round
- Values saved to `localStorage` under key `dvorak-tutor-settings`
- Settings loaded at `init()` time, falling back to defaults if absent

### Files to modify
| File | Change |
|------|--------|
| `index.html` | Add gear button to header, add `#settings-panel` section |
| `styles.css` | Style the settings panel, controls, and toggle animation |
| `app.js` | Replace hardcoded constants with live vars, add `loadSettings()`, `saveSettings()`, `applySettings()`, timer countdown logic |
| `tests/app.test.js` | Add tests for `loadSettings`, `saveSettings`, timer calc |

### Tasks (Phase 2)
| # | Task | Status |
|---|------|--------|
| 9  | Add settings panel markup to `index.html` + tests | 🔲 pending |
| 10 | Style settings panel in `styles.css` | 🔲 pending |
| 11 | Add settings logic to `app.js` (load/save/apply + timer) + tests | 🔲 pending |
| 12 | Browser smoke test of settings panel | 🔲 pending |

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
