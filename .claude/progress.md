# Build Progress

**Project:** Dvorak Typing Tutor (browser-based, vanilla JS/CSS)
**Repo:** https://github.com/cbrayanalytics/dvorak-tutor — branch `trunk`
**Last updated:** 2026-04-28
**Phase 7 complete.** Progress history, quotes mode, and finger indicator shipped.

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

**Total tests passing: 388/388** (84 words + 151 index + 153 app)

---

## Phase 7 — Progress History, Quotes Mode & Finger Indicator

### Features

| # | Task | Description | Status |
|---|------|-------------|--------|
| 1 | History storage | `loadHistory`/`appendHistory` — last 20 rounds per level in localStorage | ✅ done |
| 2 | History accumulation | `appendHistory` called in `endRound` (only when `totalTyped > 0`) | ✅ done |
| 3 | `renderSparkline` | SVG polyline from WPM array; stub in Node | ✅ done |
| 4 | Sparkline on summary card | Clickable sparkline + trend label; click opens history panel | ✅ done |
| 5 | History panel markup | Overlay with chart + table of last 20 rounds | ✅ done |
| 6 | History panel styles | Panel, table, sparkline, trend color classes | ✅ done |
| 7 | TREND stat in stats bar | `calcTrend` compares first/second half averages; ▲/▼/— with color | ✅ done |
| 8 | Quote list + filter | 41 quotes in `words.js`, `getQuotesForLevel`/`getRoundQuote` | ✅ done |
| 9 | Mode setting + toggle | `mode:'words'` default; Words/Quotes toggle in settings panel | ✅ done |
| 10 | Wire quotes into startRound | Falls back to word mode if no quotes at current level | ✅ done |
| 11 | Mode toggle style | Reuses `.toggle-btn` | ✅ done |
| 12 | Finger indicator markup | `#finger-indicator` strip between text display and keyboard | ✅ done |
| 13 | `updateFingerIndicator` | Looks up `CHAR_TO_KEY`, updates dot color + label text | ✅ done |
| 14 | Wire indicator | Called in `highlightNextKey`; cleared in `clearNextKey` | ✅ done |
| 15 | Finger indicator styles | Dot uses finger-color CSS vars; fades in/out with `.active` | ✅ done |
| 16 | Docs update | CLAUDE.md + progress.md | ✅ done |

---

## Phase 6 — Audio Feedback & Adaptive Drill Mode

### Goal
Improve learning effectiveness with targeted practice on weak keys, and add audio feedback for a more polished feel.

### Features

| # | Task | Description | Status |
|---|------|-------------|--------|
| 1 | Audio functions | `playClick`, `playError`, `playLevelUp` via lazy `AudioContext` in `app.js` | ✅ done |
| 2 | Audio setting | `audioOn: true` default, persisted to `localStorage` | ✅ done |
| 3 | Mute toggle markup | `#audio-toggle` in settings panel | ✅ done |
| 4 | Mute toggle style | Reuses `.toggle-btn`; wired to `toggleAudio()` | ✅ done |
| 5 | Wire audio calls | `playClick/playError` in `handleKeydown`, `playLevelUp` in `advanceLevel` | ✅ done |
| 6 | `getWeightedWords` | Biased word pool in `words.js`; tests in `words.test.js` | ✅ done |
| 7 | Weak key storage | `loadWeakKeys/saveWeakKeys/mergeWeakKeys` (0.85 decay); tests in `app.test.js` | ✅ done |
| 8 | Accumulate errors | `endRound()` merges `errorMap` into persistent weak key history per level | ✅ done |
| 9 | Drill button markup | `#drill-btn` inside `#round-actions` wrapper alongside `#restart-btn` | ✅ done |
| 10 | Drill mode logic | `startDrillRound()`, `updateDrillBtn()`, `drillMode` flag, Enter key aware | ✅ done |
| 11 | Drill button style | Blue border/text; `#round-actions` flex container | ✅ done |
| 12 | Docs update | CLAUDE.md + progress.md updated | ✅ done |

---

## Files Built

### `words.js`
- Embeds ~1100 common English words (all lowercase, no punctuation)
- `LEVEL_CHARS` — object mapping level 1–5 to a `Set` of allowed characters
- `getLevelChars(level)` — returns the Set; falls back to level 5 for out-of-range
- `getWordsForLevel(level)` — filters WORD_LIST to words using only allowed chars
- `getRoundWords(level, count)` — shuffled subset of the level's word pool
- `getWeightedWords(level, weakKeys, count)` — biased pool; error chars get up to 5× word copies
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

See CLAUDE.md for the current authoritative function list. Summary of key additions since Phase 2:

- `calcProgressPct`, `calcHeatIntensity` — pure helpers for progress bar and heatmap
- `loadBests`, `saveBest`, `getBest` — per-level personal best storage
- `showHeatmap`, `clearHeatmap` — error overlay on keys post-round
- `showSummaryCard` — end-of-round WPM/ACC/time/stars card
- `applyLevel(n)` — shared level-switch helper (used by advanceLevel + pip click)
- `spawnConfetti` — 28-particle CSS burst on level advance
- `setStatColor` — swaps stat color class on a stat element
- `armTimer` / `startTimer` — split so timer waits for first keystroke
- `streak` state — consecutive passing rounds, shown in stats bar

---

## Test Files

| File | Tests | Status |
|------|-------|--------|
| `tests/words.test.js` | 49 | ✅ all pass |
| `tests/styles.test.html` | visual | ✅ verified |
| `tests/index.test.js` | 129 | ✅ all pass |
| `tests/app.test.js` | 103 | ✅ all pass |

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
- **Settings panel is `position: absolute`** overlay inside `<header>` — does not reflow page on open
- **Timer waits for first keystroke** — `armTimer()` shows time, `startTimer()` starts interval on first key
- **`applyLevel(n)`** is the shared level-switch helper; `advanceLevel()` wraps it with confetti
- **WPM/ACC color coding** suppressed until 5 chars typed to prevent misleading early values
- **Level names**: Novice / Learner / Builder / Adept / Master with icons ⌂ → ↑ ◆ ✦
- **Level pips are clickable** — any done/current pip navigates to that level via `applyLevel`

---

## Phase 5 — UX Layout & Navigation

### Goal
Fix layout issues identified from live screenshots, add level navigation, and patch bugs found during review.

### Features

| # | Task | Description | Status |
|---|------|-------------|--------|
| 22 | Level pip markup | New names (Novice/Learner/Builder/Adept/Master), icons (⌂→↑◆✦), data-label attrs | ✅ done |
| 23 | Level pip styling | Done=green, current=orange+larger dot, locked=···, hover underline | ✅ done |
| 24 | Clickable pip navigation | Click any done/current pip → `applyLevel(n)` | ✅ done |
| 25 | Try Again repositioned | Hidden during round; shown below keyboard post-round only | ✅ done |
| 26 | Level map enlarged | Font 0.7→0.82rem, dots larger, connectors 24→32px, padding for hit area | ✅ done |
| 27 | Settings panel overlay | `position: absolute` — no layout reflow when opened | ✅ done |
| 28 | Stats empty state | STREAK shows 0 (dimmed), BEST styled muted when no data | ✅ done |
| 29 | Tighten whitespace | Body padding and #app gap reduced | ✅ done |
| —  | WPM/ACC warmup | Suppress color coding and WPM until 5 chars typed | ✅ done |
| —  | Settings panel nudge | Increased top offset to clear stats bar | ✅ done |
| —  | Timer on first keystroke | `armTimer()` shows time; `startTimer()` starts interval on first key | ✅ done |
| —  | `applyLevel(n)` helper | Extracted shared level-switch logic from advanceLevel + pip handler | ✅ done |
| —  | `CONFETTI_COLORS` constant | Named constant replaces inline hex array in spawnConfetti | ✅ done |

---

## Phase 4 — Polish & Gamification

### Goal
Improve moment-to-moment feel and motivation through visual polish, better UX affordances, and light gamification.

### Features (in order)

| # | Task | Description | Status |
|---|------|-------------|--------|
| 13 | getBest cache | Cache best per round — eliminates localStorage read on every keystroke | ✅ done |
| 14 | Try Again button + Enter shortcut | Always-visible restart button; Enter key advances or restarts | ✅ done |
| 15 | Slower auto-restart after fail | 3.5s delay (was 1.8s) so heatmap is readable | ✅ done |
| 16 | Color-code WPM + ACC stats | Green/yellow/red based on threshold bands | ✅ done |
| 17 | Progress bar turns green at threshold | Color transition when goal is met | ✅ done |
| 18 | Streak counter | Consecutive passing rounds shown in stats bar | ✅ done |
| 19 | Summary card star rating | 1–3 stars based on accuracy bands | ✅ done |
| 20 | Error char shake animation | Text-display character shakes on wrong keystroke | ✅ done |
| 21 | Level advance confetti | CSS particle burst when advancing a level | ✅ done |

---

## Phase 3 — Progress & Feedback

### Goal
Give users meaningful feedback on their improvement and make progress persist across sessions.

### Features (in order)

| # | Task | Description | Status |
|---|------|-------------|--------|
| 14 | Level persistence | Save/load `currentLevel` to `localStorage`; survives page refresh | ✅ done |
| 15 | Personal bests | Save best WPM + accuracy per level; show in stats bar | ✅ done |
| 16 | End-of-round summary | Richer result card: WPM, accuracy, time, best WPM with new-best highlight | ✅ done |
| 17 | Key error heatmap | Track wrong-key counts per round; tint keys red (23–70% opacity) after round | ✅ done |

### Files to modify

| File | Change |
|------|--------|
| `app.js` | Level persistence in `init()`/`advanceLevel()`; bests tracking; error map accumulation |
| `index.html` | Personal best display in stats bar; summary card markup |
| `styles.css` | Summary card styles; heatmap tint on keys |
| `tests/app.test.js` | Tests for bests storage, error tracking helpers |
