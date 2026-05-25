# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A browser-based Dvorak keyboard layout typing tutor. No build tools, no dependencies — open `index.html` directly in a browser. All logic is vanilla JS/CSS.

## Running the App

```bash
open index.html          # macOS — opens in default browser
```

Tests are plain Node.js files — no test framework:

```bash
node tests/words.test.js   # 130 tests  — word list, level filtering, quotes
node tests/index.test.js   # 161 tests — HTML structure and data attributes
node tests/app.test.js     # 240 tests — game logic unit tests
```

Visual CSS test: open `tests/styles.test.html` directly in a browser.

## Architecture

Four files; each has a single responsibility:

| File | Role |
|------|------|
| `index.html` | Shell markup — keyboard grid, stats bar, settings panel, summary card, history panel |
| `styles.css` | Dark theme, finger-color palette (CSS vars), key state variants, animations |
| `words.js` | Embedded word list, quote set, level filtering, weighted/shuffled selection |
| `app.js` | All runtime logic: settings, game loop, input handling, level progression, bests, heatmap, history, audio, drill |

### Key visual states (`data-state` attribute on `.key` elements)

| State | Meaning |
|-------|---------|
| `active` | Unlocked at current level, finger-colored |
| `locked` | Not yet unlocked — opacity 0.18, desaturated |
| `home-preview` | I and D at Level 1 only — opacity 0.38, desaturated |
| `next` | Character user must type next — pulsing animation |

### Finger color palette (CSS custom properties)

```
--finger-pinky:  purple   --finger-ring:   blue
--finger-middle: green    --finger-index:  orange
--finger-thumb:  gray (space)
```

Applied to both keyboard keys and characters in the typed-text display. Also used as `CONFETTI_COLORS` array for level-advance particle burst.

### Level system

| Level | Name    | Letters unlocked |
|-------|---------|-----------------|
| 1     | Novice  | a o e u h t n s |
| 2     | Seeker  | + i d |
| 3     | Scout   | + r l |
| 4     | Builder | + c f |
| 5     | Shaper  | + g p |
| 6     | Climber | + y b |
| 7     | Forger  | + m w |
| 8     | Adept   | + v k |
| 9     | Expert  | + j x q z |
| 10    | Master  | All + punctuation + numbers |

Each keyboard row contains a `<div class="hand-gap"></div>` (20px spacer, `flex-shrink: 0`) between the last `index-left` and first `index-right` key — visually splits the left and right hand groups.

`#level-map` contains two children:
- **`#level-chip`** — pill badge showing `#chip-icon`, `#chip-name`, and `#chip-count` (`N / 10`) for the current level. Updated by `updateLevelMap()`.
- **`#level-bar`** — 10 `.level-seg` divs (one per level) with `data-level`, `data-label`, and `data-icon` attributes. Done segments are green and clickable (calls `applyLevel(n)`); current is orange with a glow; locked are dim. Tooltips via CSS `::after` on hover.

### Settings (`localStorage` key: `dvorak-tutor-settings`)

| Setting | Default | Range | Step |
|---------|---------|-------|------|
| `wordCount` | 100 | 10–500 | 10 |
| `threshold` | 90 | 50–100 | 5 |
| `timerOn` | false | — | — |
| `timerMins` | 15 | 1–60 | 1 |
| `level` | 1 | 1–10 | — |
| `audioOn` | true | — | — |
| `mode` | `'words'` | `'words'`/`'quotes'` | — |
| `keyboardStyle` | `'standard'` | `'standard'`/`'corne-3x6'`/`'corne-3x5'` | — |
| `layoutFamily` | `'dvorak'` | `'dvorak'`/`'colemak'`/`'colemak-dh'` | — |
| `wpmGate` | `true` | — | — |

Timer auto-suggests based on WPM: `ceil(wordCount / max(wpm,1) * 1.5)`.  
Timer **waits for first keystroke** before counting down — `armTimer()` shows the time, `startTimer()` starts the interval.

### Keyboard layout variants

`applyKeyboardLayout(style)` swaps `#keyboard`'s children between three layouts. The standard layout is saved as a `DocumentFragment` on `init()` and restored via `cloneNode(true)`. After each swap, `buildCharMap()` and `renderKeyboard()` are called to rebuild the char→key lookup and re-apply key states.

| Style | Description |
|-------|-------------|
| `standard` | Full 5-row staggered Dvorak keyboard |
| `corne-3x6` | Columnar split — 5 left cols + outer-right col (`/ -`) |
| `corne-3x5` | Columnar split — 5 cols per side, no outer col |

Corne layout internals:
- `CORNE_COLS` (10 entries) — char/finger/column-offset per column; `--col-offset` CSS var drives `margin-top` stagger (0px middle → 32px pinky)
- `CORNE_OUTER_RIGHT` — outer-right column for 3×6 only (`/ -`); null entries are skipped (not rendered)
- Thumb cluster: right side only (`⌥ SPC ⏎`); `.corne-thumbs` uses `padding-left: calc(5 * var(--key-size) + 4 * var(--key-gap) + 60px)` to align SPC under the index-inner area

### Round history (`localStorage` key: `dvorak-tutor-history`)

Stored as `{ 1: [{wpm, acc, ts}, ...], 2: ... }` — last 20 entries per level (oldest trimmed). `appendHistory` called in `endRound` only when `totalTyped > 0`. `calcTrend` splits the array at its midpoint and compares average WPM of each half; threshold ±2 WPM to avoid noise. Summary card shows a clickable SVG sparkline — click opens `#history-panel` overlay. Stats bar **TREND** stat shows ▲ (green) / ▼ (red) / — (muted) and updates at round end.

### Personal bests (`localStorage` key: `dvorak-tutor-bests`)

Stored as `{ 1: {wpm, acc}, 2: {wpm, acc}, ... }` — one entry per level, updated only when WPM improves. Cached in `currentBest` per round to avoid repeated localStorage reads on every keystroke.

### Audio feedback (`localStorage` key: `dvorak-tutor-settings` → `audioOn`)

Web Audio API via lazy `AudioContext`. Three sounds — `playClick()` (correct key), `playError()` (wrong key), `playLevelUp()` (ascending 3-note chime on level advance). Graceful no-op when AudioContext is unavailable (Node/old browsers). Mute toggle in settings panel (`#audio-toggle`).

### Error heatmap

`errorMap[char]` tracks wrong-key counts during a round. On round end, `showHeatmap()` sets `--err-opacity` on each `.key` element via a CSS `::after` overlay. `HEAT_ERROR_MAX = 3` — full intensity at 3+ errors.

### Adaptive drill mode (`localStorage` key: `dvorak-tutor-weak-keys`)

Stored as `{ 1: { char: count }, 2: ... }` — per-level error history. After each round, `mergeWeakKeys(stored, errorMap)` decays existing counts by `DECAY_FACTOR = 0.85` and adds new errors, then calls `saveWeakKeys()`. Chars that decay to 0 are pruned.

`getWeightedWords(level, weakKeys, count)` in `words.js` biases the word pool by giving extra copies to words containing high-error chars (1 + min(floor(score/2), 4) copies). After dedup, returns a shuffled subset.

`#drill-btn` appears post-round whenever `loadWeakKeys(currentLevel)` is non-empty. `startDrillRound()` generates the weighted phrase and sets `drillMode = true`. Enter key is drill-aware: prefers drill over restart when "Drill Weak Keys" is visible.

**Mid-round adaptive injection**: on each word boundary (space typed), `injectAdaptiveWords()` checks `getHotChars(errorMap, MID_ROUND_ERROR_THRESHOLD=3)`. If hot chars exist and `injectionCount < MAX_MID_ROUND_INJECTIONS=2`, it splices `MID_ROUND_INJECT_COUNT=5` weighted words into the remaining phrase at the cursor position. Injected words are highlighted with `.injected` CSS class.

### Speed gate (`WPM_FLOOR`)

`WPM_FLOOR = [0, 15, 18, 22, 26, 30, 35, 40, 45, 50, 55]` — minimum WPM required to advance at each level (index = level number). `getRoundResult(wpm, acc, threshold, level)` returns `'pass'`, `'fail'`, or `'wpm-gate'`. When `wpmGate` is off, `'wpm-gate'` is treated as `'pass'` at the call site.

- **`wpm-gate` result**: accuracy passes but WPM is below floor — banner shows orange warning, Advance button is NOT shown, no auto-restart (unlike `'fail'`).
- **Summary card**: `#wpm-target` hint appears below the WPM value on wpm-gate rounds (`"need N WPM"`).
- **TARGET stat**: `#stat-target-wrap` hidden when `wpmGate` is off; updated by `updateTargetVisibility()` (called from `applyLevel`, `syncSettingsPanel`, and `toggleWpmGate`).

### Gamification

- **Streak**: `streak` counter increments on each passing round, resets on fail. Color-coded in stats bar (orange at 3+, green at 5+).
- **Stars**: Summary card shows 1–3 stars based on accuracy (70%/80%/90% thresholds).
- **Confetti**: 28 CSS particles burst from viewport center on level advance. Colors from `CONFETTI_COLORS`. CSS custom properties (`--dx`, `--dy`, `--rot`, `--dur`) drive per-particle animation.

### Stats bar behavior

Stats bar order: **WPM | ACC | progress bar | BEST | TARGET | STREAK | TREND | TIME** (TARGET hidden when `wpmGate` is off; TIME hidden unless timer is on). There is no LEVEL stat — current level is shown in the level map pips above.

- WPM and ACC color coding (`stat-good` / `stat-warn` / `stat-bad`) only activates after **5 characters typed** — prevents misleading values at round start.
- WPM shows `—` until 5 chars typed, then updates live.
- TARGET shows the WPM floor for the current level; turns green once WPM is met live.
- STREAK shows `0` (dimmed) when no streak; BEST shows `—` (dimmed) when no data yet.
- TREND shows `—` (dimmed) until enough history exists; updates live after each round end.

### Settings panel

`position: absolute` overlay anchored to `<header>` — opens below the gear icon without reflowing the page. Slide animation uses `scrollHeight`-based JS (`openSettingsPanel` / `closeSettingsPanel`). `#settings-panel[hidden]` requires explicit `display: none` to override `display: flex`.

## Pure functions (exported for tests)

| Function | Purpose |
|----------|---------|
| `calcWpm(chars, elapsedMs)` | WPM from chars typed and elapsed time |
| `calcAccuracy(correct, total)` | Accuracy % |
| `calcProgressPct(cursor, phraseLen, acc, threshold)` | Progress bar % (weighted by completion × accuracy) |
| `getKeyState(keyLevel, activeLevel, char)` | Returns `active` / `locked` / `home-preview` |
| `buildPhrase(level, wordCount)` | Joins `getRoundWords()` with spaces |
| `suggestTimerMins(wordCount, wpm)` | WPM-based timer suggestion |
| `calcHeatIntensity(errorCount)` | 0–1 heatmap intensity (max at `HEAT_ERROR_MAX`) |
| `loadSettings()` / `saveSettings()` | localStorage read/write |
| `loadBests()` / `saveBest()` / `getBest()` | Per-level best WPM/accuracy |
| `playClick()` / `playError()` / `playLevelUp()` | Web Audio feedback (no-op without AudioContext) |
| `loadWeakKeys(level)` / `saveWeakKeys(level, keys)` | Per-level error history persistence |
| `mergeWeakKeys(stored, round)` | Decay + merge error maps; prunes chars at 0 |
| `getWeightedWords(level, weakKeys, count)` | Biased word pool for drill mode (in `words.js`) |
| `getQuotesForLevel(level)` / `getRoundQuote(level)` | Level-filtered quote pool (in `words.js`) |
| `loadHistory(level)` / `appendHistory(level, entry)` | Per-level round history (last 20 entries) |
| `calcTrend(history)` | Returns `'up'`/`'down'`/`'flat'` from history array |
| `renderSparkline(wpmValues)` | SVG polyline element for WPM trend |
| `getHotChars(errMap, threshold)` | Returns chars with error count ≥ threshold (used for mid-round injection) |
| `getRoundResult(wpm, acc, threshold, level)` | Returns `'pass'` / `'fail'` / `'wpm-gate'` based on WPM_FLOOR and accuracy threshold |
| `getLayoutFamily()` | Returns active layout family (`'dvorak'`/`'colemak'`/`'colemak-dh'`) from settings |

## Key DOM functions

| Function | Purpose |
|----------|---------|
| `updateLevelMap(level)` | Updates `.level-seg` classes (done/current/locked) and syncs chip icon/name/count |
| `applyKeyboardLayout(style)` | Swaps `#keyboard` children (standard fragment or Corne DOM); rebuilds `CHAR_TO_KEY` |
| `applyLevel(n)` | Sets `currentLevel`, saves, re-renders keyboard/map, starts round |
| `advanceLevel()` | Fires confetti, then calls `applyLevel(currentLevel + 1)` |
| `armTimer()` | Sets `timerRemaining` + display — no interval started |
| `startTimer()` | Starts countdown interval (call after `armTimer`) |
| `setStatColor(el, cls)` | Swaps `stat-good/warn/bad/empty` class on a stat element |
| `spawnConfetti()` | Creates 28 fixed-position particles, self-removes on animationend |
| `_initRound()` | Shared reset body called by both `startRound` and `startDrillRound` |
| `startRound()` / `endRound()` | Round lifecycle |
| `startDrillRound()` | Drill round using weighted word pool from weak key history |
| `updateDrillBtn(weak)` | Shows/hides `#drill-btn` based on weak key object |
| `showHistoryPanel()` / `closeHistoryPanel()` | Open/close round history overlay |
| `handleKeydown(e)` | Core input handler; starts timer + roundStartTime on first key |
| `updateTargetVisibility()` | Shows/hides `#stat-target-wrap` and `#target-divider` based on `wpmGate` setting; sets TARGET value |
| `toggleWpmGate()` | Toggles `settings.wpmGate`, updates button label, calls `updateTargetVisibility()` |
| `applyLayoutFamily(family)` | Switches layout family (Dvorak/Colemak/Colemak-DH); resets to level 1 on family change |
| `init()` | Entry point — called on DOMContentLoaded |

## CSS Gotchas

**Animation vs. JS transform conflict**: CSS animation values override inline `style.transform`. If a keyframe animation runs on `#text-inner`, it blocks `updateTextScroll()`'s `translateX` — the text cannot scroll. Keep animation targets and JS transform targets on **separate elements**. The phrase-fade animation belongs on `#text-display`; `#text-inner` is transform-only.

**`#app` max-width is 620px** — sized to match the keyboard's intrinsic width so all sections (stats bar, text display, keyboard) share the same column.

**.char.cursor** is a terminal underline (`border-bottom: 2px solid var(--finger-index)`) with a `cursor-blink` keyframe animation (1.2s, `step-start`, `infinite`) — not a box highlight.

**Corne column stagger via `--col-offset`**: Each `.corne-col` gets `margin-top: var(--col-offset, 0px)`. The offset is set inline by `_makeCorneCol()` using `el.style.setProperty('--col-offset', ...)`. Middle finger = 0px (highest), pinky = 32px (lowest). The `corne-body` gap is 20px, `hand-gap` is 20px, giving 60px total inter-half separation — used in the `padding-left` calc for `.corne-thumbs`.

## Workflow Rules

1. Maintain a task list and work one task at a time.
2. After each function/file change, commit and push — one logical change per commit.
3. Write tests before implementing. Run all three test files and confirm green before the next task.
4. Ask probing questions when a request is vague.

## Repository

- GitHub: https://github.com/cbrayanalytics/dvorak-tutor
- Branch: `trunk`
- See `.claude/progress.md` for full task history and decisions.
