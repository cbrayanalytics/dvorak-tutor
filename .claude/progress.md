# Build Progress

**Project:** Dvorak Typing Tutor (browser-based, vanilla JS/CSS)
**Repo:** https://github.com/cbrayanalytics/dvorak-tutor — branch `trunk`
**Last updated:** 2026-04-30
**Phase 10 in progress.** Design review follow-up — layout consistency, keyboard hand-split, component polish.

---

## Task Status

### Phase 10 — Design Review Follow-Up

From second frontend-design plugin analysis + user discussion. Fixes remaining inconsistencies and adds hand-split keyboard feature.

#### Layout & Consistency
| # | Task | Description | Status |
|---|------|-------------|--------|
| P1 | **Unify stats bar background** | Remove border/surface bg from `#stats`; use `rgba(0,0,0,0.15)` + inset shadow to match text display | ⬜ todo |
| P2 | **Constrain layout to keyboard width** | Set `#app` max-width ~620px so stats bar, text display, and keyboard all share the same width | ⬜ todo |
| P3 | **Remove redundant LEVEL stat** | Level map shows current level already; remove `#stat-level` + divider from stats bar | ⬜ todo |

#### Keyboard
| # | Task | Description | Status |
|---|------|-------------|--------|
| P4 | **Hand-split keyboard** | Add `<div class="hand-gap">` spacer between index-left and index-right keys in each row; ~20px gap reinforces left/right hand mental model | ⬜ todo |

#### Typography & Interaction
| # | Task | Description | Status |
|---|------|-------------|--------|
| P5 | **Terminal-style cursor** | Replace box highlight + outline on `.char.cursor` with `border-bottom: 2px solid` + slow blink animation | ⬜ todo |
| P6 | **Section spacing grouping** | Header+level-map tight (0.25rem gap), then larger gap before practice area (text display + keyboard) | ⬜ todo |
| P7 | **Settings button upgrade** | Increase to 36×38px; borderless; subtle bg pill on hover only | ⬜ todo |
| P8 | **First-char cursor padding fix** | Increase `#text-display` left padding to 1.75rem so cursor outline never clips at edge | ⬜ todo |

---

### Phase 9 — Frontend Design Overhaul

Based on frontend-design plugin analysis. Goal: distinctive, production-grade aesthetic with clear visual hierarchy and character.

#### Typography
| # | Task | Description | Status |
|---|------|-------------|--------|
| T1 | **JetBrains Mono** | Load from Google Fonts; replace Segoe UI (UI) + Courier New (text display) throughout | ✅ done |
| T2 | **Wordmark sizing** | h1 from 1rem → 1.6rem; "Dvorak" plain, "Tutor" orange | ✅ done |

#### Background & Color
| # | Task | Description | Status |
|---|------|-------------|--------|
| T3 | **Background depth** | Base bg → `#0d1520` (warmer navy); add radial gradient to body | ✅ done |

#### Text Display
| # | Task | Description | Status |
|---|------|-------------|--------|
| T4 | **Text display as stage** | Remove border, transparent/darker bg, inset shadow, font 1.5 → 1.75rem | ✅ done |

#### Keyboard
| # | Task | Description | Status |
|---|------|-------------|--------|
| T5 | **Keyboard elevation** | Add `box-shadow: 0 8px 32px rgba(0,0,0,0.4)` below keyboard | ✅ done |
| T6 | **Key depth gradient** | Active keys: subtle top-highlight gradient for tactile feel | ✅ done |
| T7 | **Locked key + pulse** | Opacity 0.13 → 0.18; pulse uses `drop-shadow` filter instead of `box-shadow` | ✅ done |

#### Stats Bar
| # | Task | Description | Status |
|---|------|-------------|--------|
| T8 | **Stats hierarchy** | BEST, TREND, LEVEL demoted to secondary size; WPM, ACC, STREAK stay primary | ✅ done |

#### Animations & Motion
| # | Task | Description | Status |
|---|------|-------------|--------|
| T9  | **Phrase fade-in** | Round start: text display content fades in over 150ms | ✅ done |
| T10 | **Level advance delay** | 200ms pause after confetti fires before keyboard re-renders | ✅ done |
| T11 | **WPM flash** | Brief color flash on WPM stat on each live update | ✅ done |

#### Component Polish
| # | Task | Description | Status |
|---|------|-------------|--------|
| T12 | **Pip connectors** | Increase to 3px; fill green for completed levels | ✅ done |
| T13 | **Stars** | Empty star → `☆` outline; filled → `★`; not opacity/color tricks | ✅ done |
| T14 | **Banner height** | Remove dead `min-height` space; animate height properly | ✅ done |
| T15 | **Button radius** | Advance btn `border-radius` 8px → 10px (match everything else) | ✅ done |

---

### Phase 8 — UI/UX Redesign

| # | Task | Description | Status |
|---|------|-------------|--------|
| 8.1 | **Compact header** | Wordmark shrinks + left-aligns; gear stays right; level map unchanged | ✅ done |
| 8.2 | **Single-line text display (CSS)** | Fixed single-line height, `overflow: hidden`, `white-space: nowrap`; inner wrapper added | ✅ done |
| 8.3 | **Scroll anchor logic (JS)** | Translate inner wrapper left per keypress; current char anchored ~40px from left edge | ✅ done |
| 8.4 | **Reorder DOM** | Keyboard moves directly below text display; summary card + buttons move below keyboard | ✅ done |
| 8.5 | **Hand diagram** | SVG left+right hand above keyboard; `updateFingerIndicator` highlights active finger on diagram | ✅ done |
| 8.6 | **Tests for new IDs** | Add hand diagram element IDs to `index.test.js` | ✅ done |
| 8.7 | **Layout polish** | Tighten spacing; verify narrow widths | ✅ done |

---

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

**Total tests passing: 386/386** (84 words + 149 index + 153 app)

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
- `shuffle(arr)` — Fisher-Yates in-place shuffle; used by `getRoundWords` and `getWeightedWords`
- `getRoundWords(level, count)` — shuffled subset of the level's word pool
- `getWeightedWords(level, weakKeys, count)` — biased pool; error chars get up to 5× word copies
- `QUOTE_LIST` — 41 curated short quotes/phrases
- `getQuotesForLevel(level)` — filters QUOTE_LIST to quotes using only level-allowed chars
- `getRoundQuote(level)` — returns one random quote for the level, or `''` if none exist
- Exports via `module.exports` guard (works in browser + Node)

### `styles.css`
- Dark theme (`--bg: #0f172a`); CSS custom properties for all 5 finger colors
- Key `data-state` variants: `active`, `locked`, `home-preview`, `next`
- `next` state: filled background + `key-pulse` animation; `--err-opacity` CSS var for heatmap
- Correct chars in `#text-display` colored by `data-finger`; `char-shake` on error
- `#text-display` fixed at `12rem` height with hidden scrollbar; auto-scrolls on keystroke
- Settings panel slide animation driven by `scrollHeight`-based JS; `position: absolute` overlay
- Summary card (`#summary-card`) with fade-in animation; `.star`/`.star-filled` rating
- `#round-actions` flex container for `#restart-btn` + `#drill-btn` (blue accent when visible)
- `#finger-indicator` strip: colored dot (`#finger-dot[data-finger=...]`) + `#finger-label`
- `#history-panel` overlay: chart area + responsive table with newest-row highlight
- Sparkline SVG styled via `currentColor` (inherits finger-ring blue)
- `.stat-good` / `.stat-warn` / `.stat-bad` / `.stat-empty` color classes on stat values
- `@keyframes confetti-burst` — CSS custom property driven particle animation
- Responsive breakpoint at 620px (smaller keys)

### `index.html`
- Full Dvorak keyboard markup: number, upper, home, bottom, space rows
- Every key has `data-char`, `data-finger`, `data-level` attributes
- Settings panel: word count / threshold / timer / sound / mode toggles
- Stats bar IDs: `stat-wpm`, `stat-acc`, `stat-level`, `stat-best`, `stat-streak`, `stat-trend`,
  `stat-timer-wrap`, `stat-timer`, `progress-bar`, `progress-wrap`
- Level map: 5 `.level-pip` divs with `data-level`, `data-label`, `.pip-icon`, `.pip-label`
- Summary card: `sum-wpm`, `sum-acc`, `sum-time`, `sum-stars`, `sum-sparkline-wrap`, `sum-trend`
- History panel: `history-panel`, `history-title`, `history-close`, `history-chart`, `history-tbody`
- Finger indicator: `finger-indicator`, `finger-dot`, `finger-label`
- Post-round buttons: `#round-actions` wraps `#restart-btn` + `#drill-btn`

### `app.js`
- **Settings**: `loadSettings`, `saveSettings`, `applySettingsToDisplay`; defaults include `audioOn`, `mode`
- **Round history**: `loadHistory`, `appendHistory` (last 20 per level); `calcTrend`; `renderSparkline`
- **Personal bests**: `loadBests`, `saveBest`, `getBest`; cached in `currentBest` per round
- **Weak keys**: `loadWeakKeys`, `saveWeakKeys`, `mergeWeakKeys` (0.85 decay); drives drill mode
- **Audio**: lazy `AudioContext`; `playClick`, `playError`, `playLevelUp`; no-op without AudioContext
- **Round lifecycle**: `_initRound` (shared reset), `startRound`, `startDrillRound`, `endRound`
- **Keyboard**: `renderKeyboard`, `highlightNextKey`, `clearNextKey`, `flashKey`, `buildCharMap`
- **Finger indicator**: `FINGER_LABELS` map; `updateFingerIndicator(char)` called by `highlightNextKey`
- **History UI**: `showHistoryPanel`, `closeHistoryPanel`; sparkline + table populated from `loadHistory`
- **Level map**: `updateLevelMap`; pip click handlers call `applyLevel(n)`
- **Timer**: `armTimer` (display only), `startTimer` (interval on first key), `clearTimer`
- **Gamification**: `streak`, `spawnConfetti`, star rating in `showSummaryCard`
- **Stats**: `updateStats` updates WPM/ACC/BEST/STREAK/TREND with color coding; suppressed until 5 chars
- **Heatmap**: `showHeatmap` / `clearHeatmap` using `--err-opacity` CSS var; `HEAT_ERROR_MAX = 3`

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

See **CLAUDE.md** for the authoritative function list (Pure functions + Key DOM functions tables).

---

## Test Files

| File | Tests | Status |
|------|-------|--------|
| `tests/words.test.js` | 84 | ✅ all pass |
| `tests/styles.test.html` | visual | ✅ verified |
| `tests/index.test.js` | 151 | ✅ all pass |
| `tests/app.test.js` | 153 | ✅ all pass |

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
- **`_initRound()`** is the shared reset body extracted from `startRound`/`startDrillRound` (Phase 6 simplify)
- **Fisher-Yates shuffle** replaces `Math.random()-0.5` sort in `getRoundWords` + `getWeightedWords`
- **`updateDrillBtn(weak)`** accepts the already-merged value to avoid a redundant localStorage read
- **Audio on by default** — `audioOn: true`; Web Audio API with lazy `AudioContext` init
- **Drill mode** — `drillMode` flag; `startDrillRound` uses `getWeightedWords`; Enter key is drill-aware
- **Weak key decay** — `DECAY_FACTOR = 0.85`; chars that reach 0 are pruned from the stored object
- **Progress history** — last 20 rounds per level; `calcTrend` uses midpoint-split average comparison
- **Sparkline** — pure SVG polyline via `renderSparkline(wpmValues)`; Node stub returns plain object
- **Quotes mode** — `mode:'words'|'quotes'` setting; `getRoundQuote` falls back to word mode if no quotes exist at level
- **Finger indicator** — `#finger-indicator` fades in/out with `.active`; dot color driven by `data-finger` attribute CSS selectors

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
