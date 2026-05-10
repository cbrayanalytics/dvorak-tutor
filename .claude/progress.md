# Build Progress

**Project:** Dvorak Typing Tutor (browser-based, vanilla JS/CSS)
**Repo:** https://github.com/cbrayanalytics/dvorak-tutor — branch `trunk`
**Last updated:** 2026-05-09

All phases complete through Phase 14 (level-map chip + segmented bar redesign).

---

## Completed Features

- **Core game loop** — phrase generation, keystroke handling, WPM/ACC, round lifecycle
- **Level system** — 10 levels (Novice→Master), 2–4 new keys per level, persistent, pip-clickable navigation
- **Settings** — word count, threshold, timer, sound, mode (words/quotes), keyboard style; all persisted to localStorage
- **Personal bests** — per-level WPM/ACC bests, cached per round
- **Round history** — last 20 rounds per level; SVG sparkline; history panel overlay
- **Trend tracking** — `calcTrend` midpoint-split comparison; ▲/▼/— in stats bar
- **Error heatmap** — `--err-opacity` CSS var on keys; `HEAT_ERROR_MAX = 3`
- **Adaptive drill mode** — weak-key decay (0.85 factor), weighted word pool, `#drill-btn`
- **Audio feedback** — lazy AudioContext; click/error/level-up sounds
- **Gamification** — streak counter, 1–3 star rating, confetti on level advance
- **Quotes mode** — 41 curated quotes, level-filtered
- **Design overhaul** — JetBrains Mono, dark navy theme, key depth gradients, terminal cursor, phrase fade-in, pip connectors
- **Keyboard layout variants** — Standard (full 5-row), Corne 3×6 (columnar + outer-right `/−`), Corne 3×5 (columnar, no outer); column stagger via `--col-offset`; thumb cluster with SPC
- **Mid-round adaptive injection** — on word boundary, hot chars (≥3 errors) trigger splice of 5 weighted words into remaining phrase; up to 2 injections per round; injected words highlighted via `.injected` class
- **Level-map redesign** — replaced 10-pip overflow row with chip + segmented bar: pill badge (icon + name + N/10) on left, 10 thin `.level-seg` segments on right; done=green, current=orange+glow, locked=dim; tooltip on hover; fully clickable for back-navigation

---

## Test Counts

| File | Tests |
|------|-------|
| `tests/words.test.js` | 117 |
| `tests/index.test.js` | 152 |
| `tests/app.test.js` | 195 |

---

## Key Decisions

- **No build tools** — single `open index.html`; no npm, no bundler
- **`data-state` on keys** — single attribute write per key state change
- **`module.exports` guard** — same `words.js` works in browser and Node tests
- **`color-mix()`** — finger tints require Chrome 111+ / Firefox 113+ / Safari 16.2+
- **Advance is manual** — user clicks button after passing; no auto-advance
- **Timer waits for first keystroke** — `armTimer()` shows time, `startTimer()` starts interval
- **Settings panel `position: absolute`** — no reflow when opened; `[hidden]` needs explicit `display: none` to override `display: flex`
- **`_initRound()`** — shared reset body called by both `startRound` and `startDrillRound`
- **WPM/ACC color coding suppressed** until 5 chars typed
- **Animation vs. JS transform**: phrase-fade on `#text-display`, translateX on `#text-inner` — must stay on separate elements
- **Corne keyboard DOM swap** — `applyKeyboardLayout` replaces `#keyboard` children; standard layout saved as `DocumentFragment` on `init()` and restored via `cloneNode(true)`; no innerHTML (security hook rejects it)
- **Corne column stagger** — `--col-offset` CSS var set inline per column; middle=0px, ring=16px, index-inner=8px, index-outer=18px, pinky=32px, outer=38px
- **Corne outer-left removed** — 3×6 only adds an outer-right column (`/ -`); no outer-left null column
- **SPC thumb positioning** — `.corne-thumbs` uses `padding-left: calc(5 * var(--key-size) + 4 * var(--key-gap) + 60px)` to align under index-inner of right half
