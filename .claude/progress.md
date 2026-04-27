# Build Progress

**Project:** Dvorak Typing Tutor (browser-based, vanilla JS/CSS)
**Repo:** https://github.com/cbrayanalytics/dvorak-tutor — branch `trunk`
**Last updated:** 2026-04-27
**Phase 2 complete.** Now planning Phase 3.

---

## Task Status

### Phase 1 — Core App

| # | Task | Status |
|---|------|--------|
| 1 | Create GitHub repo and initialize git | ✅ done |
| 2 | Create `words.js` with word list and `getWordsForLevel()` | ✅ done |
| 3 | Write and pass tests for `words.js` | ✅ done — 49/49 |
| 4 | Create `styles.css` | ✅ done |
| 5 | Create `index.html` | ✅ done |
| 6 | Create `app.js` with game logic | ✅ done |
| 7 | Write and pass tests for `app.js` | ✅ done — 74/74 |
| 8 | Final browser smoke test | ✅ done |

### Phase 2 — Difficulty Tuning

| # | Task | Status |
|---|------|--------|
| 9  | Add settings panel markup to `index.html` + tests | ✅ done — 119/119 index tests |
| 10 | Style settings panel in `styles.css` | ✅ done |
| 11 | Add settings logic to `app.js` + tests | ✅ done — 74/74 app tests |
| 12 | Browser smoke test + bug fixes (panel toggle, clipping) | ✅ done |
| 13 | Scrolling text display (fixed height, auto-scroll cursor) | ✅ done |

**Total tests passing: 242/242** (49 words + 119 index + 74 app)

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
- `#text-display` fixed at `12rem` height with hidden scrollbar; auto-scrolls on keystroke
- Settings panel with slide-open/close animation driven by JS `scrollHeight`
- Responsive breakpoint at 620px (smaller keys)

### `index.html`
- Full Dvorak keyboard markup: number, upper, home, bottom, space rows
- Every key has `data-char`, `data-finger`, `data-level` attributes
- Settings panel: gear button, word count / threshold / timer steppers, timer toggle
- IDs wired: `#text-display`, `#stat-wpm`, `#stat-acc`, `#stat-level`, `#stat-timer`,
  `#progress-bar`, `#banner`, `#advance-btn`, `#level-map`, `#keyboard`,
  `#settings-btn`, `#settings-panel`

### `app.js`
- Settings: `loadSettings()`, `saveSettings()`, `applySettingsToDisplay()`
- Settings defaults: `wordCount: 100`, `threshold: 90`, `timerOn: false`, `timerMins: 15`
- Timer: `startTimer()`, `clearTimer()`, `formatTimer()`, WPM-based auto-suggest
- Timer formula: `ceil(wordCount / max(wpm, 1) * 1.5)` — 15 min at 10 WPM / 100 words
- `lastWpm` seeded at 10 (beginner); updated after each round; drives timer suggestion
- Threshold and timer changes apply in-place; word count change restarts the round
- Settings persisted to `localStorage` under key `dvorak-tutor-settings`

---

## Level System (source of truth)

| Level | Letters unlocked | Notes |
|-------|-----------------|-------|
| 1 | a o e u · h t n s | 8 home resting positions |
| 2 | + i d | Inner index keys — completes home row |
| 3 | + p y f g c r l | Upper row letters |
| 4 | + q j k x b m w v z | Bottom row letters |
| 5 | All + punctuation + numbers | Full keyboard |

Level advance condition: ≥ threshold% accuracy (default 90%) on a completed round.

---

## app.js — Implemented functions

| Function | Purpose |
|----------|---------|
| `calcWpm(charsTyped, elapsedMs)` | Pure — WPM calculation |
| `calcAccuracy(correct, total)` | Pure — accuracy % |
| `getKeyState(keyLevel, activeLevel, char)` | Pure — returns `active`/`locked`/`home-preview` |
| `buildPhrase(level, wordCount)` | Pure — joins `getRoundWords()` output with spaces |
| `suggestTimerMins(wordCount, wpm)` | Pure — WPM-based timer suggestion |
| `loadSettings()` / `saveSettings()` | localStorage read/write |
| `buildCharMap()` | DOM — builds `CHAR_TO_KEY` from keyboard markup at init |
| `renderKeyboard(level)` | DOM — sets `data-state` on all `.key` elements |
| `highlightNextKey(char)` | DOM — pulses the next key to type |
| `flashKey(char, type)` | DOM — ok/err flash animation on a key |
| `renderPhrase(text)` | DOM — populates `#text-display` with `.char` spans, resets scroll |
| `updateStats()` | DOM — writes WPM/ACC/progress bar |
| `updateLevelMap(level)` | DOM — sets done/current classes on level pips |
| `startRound()` / `endRound()` | DOM — round lifecycle |
| `advanceLevel()` | DOM — increments level, re-renders keyboard, starts round |
| `handleKeydown(e)` | DOM — core input handler; scrolls cursor into view |
| `init()` | DOM — entry point, called on DOMContentLoaded |

---

## Test Files

| File | Tests | Status |
|------|-------|--------|
| `tests/words.test.js` | 49 | ✅ all pass |
| `tests/styles.test.html` | visual | ✅ verified |
| `tests/index.test.js` | 119 | ✅ all pass |
| `tests/app.test.js` | 74 | ✅ all pass |

---

## Decisions Made

- **No build tools** — single `open index.html` to run; no npm, no bundler
- **No external dependencies** — vanilla JS/CSS only
- **Word list embedded** in `words.js` (not fetched) so app works offline
- **`module.exports` guard** in `words.js` allows same file in browser and Node tests
- **`data-state` on keys** (not CSS classes) — makes JS toggling a single attribute write
- **`color-mix()`** used for finger tints — requires Chrome 111+ / Firefox 113+ / Safari 16.2+
- **Advance is manual** — user clicks button after passing a round; no auto-advance
- **`ROUND_WORD_COUNT`** defaults to 100 (user-adjustable via settings, range 10–500)
- **Timer auto-scales** with WPM: `ceil(wordCount / wpm * 1.5)`; seeded at 10 WPM
- **Settings panel** uses `scrollHeight`-based JS animation (not CSS-only `max-height`)
- **`#settings-panel[hidden]`** requires explicit `display: none` rule to override `display: flex`

---

## Phase 3 — Progress & Feedback

### Goal
Give users meaningful feedback on their improvement and make progress persist across sessions.

### Features (in order)

| # | Task | Description | Status |
|---|------|-------------|--------|
| 14 | Level persistence | Save/load `currentLevel` to `localStorage`; survives page refresh | 🔲 pending |
| 15 | Personal bests | Save best WPM + accuracy per level; show in stats bar | 🔲 pending |
| 16 | End-of-round summary | Richer result card: WPM, accuracy, errors, time used | 🔲 pending |
| 17 | Key error heatmap | Track wrong-key counts per round; tint keys on keyboard after round | 🔲 pending |

### Files to modify

| File | Change |
|------|--------|
| `app.js` | Level persistence in `init()`/`advanceLevel()`; bests tracking; error map accumulation |
| `index.html` | Personal best display in stats bar; summary card markup |
| `styles.css` | Summary card styles; heatmap tint on keys |
| `tests/app.test.js` | Tests for bests storage, error tracking helpers |
