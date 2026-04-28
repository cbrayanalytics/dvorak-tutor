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
node tests/words.test.js   # 49 tests  — word list and level filtering
node tests/index.test.js   # 125 tests — HTML structure and data attributes
node tests/app.test.js     # 103 tests — game logic unit tests
```

Visual CSS test: open `tests/styles.test.html` directly in a browser.

## Architecture

Four files; each has a single responsibility:

| File | Role |
|------|------|
| `index.html` | Shell markup — keyboard grid, stats bar, settings panel, summary card |
| `styles.css` | Dark theme, finger-color palette (CSS vars), key state variants, animations |
| `words.js` | Embedded word list + `getWordsForLevel(level)` filter |
| `app.js` | All runtime logic: settings, game loop, input handling, level progression, bests, heatmap |

### Key visual states (`data-state` attribute on `.key` elements)

| State | Meaning |
|-------|---------|
| `active` | Unlocked at current level, finger-colored |
| `locked` | Not yet unlocked — opacity 0.13, desaturated |
| `home-preview` | I and D at Level 1 only — opacity 0.38, desaturated |
| `next` | Character user must type next — pulsing animation |

### Finger color palette (CSS custom properties)

```
--finger-pinky:  purple   --finger-ring:   blue
--finger-middle: green    --finger-index:  orange
--finger-thumb:  gray (space)
```

Applied to both keyboard keys and characters in the typed-text display.

### Settings (`localStorage` key: `dvorak-tutor-settings`)

| Setting | Default | Range | Step |
|---------|---------|-------|------|
| `wordCount` | 100 | 10–500 | 10 |
| `threshold` | 90 | 50–100 | 5 |
| `timerOn` | false | — | — |
| `timerMins` | 15 | 1–60 | 1 |
| `level` | 1 | 1–5 | — |

Timer auto-suggests based on WPM: `ceil(wordCount / max(wpm,1) * 1.5)`.

### Personal bests (`localStorage` key: `dvorak-tutor-bests`)

Stored as `{ 1: {wpm, acc}, 2: {wpm, acc}, ... }` — one entry per level, updated only when WPM improves.

### Error heatmap

`errorMap[char]` tracks wrong-key counts during a round. On round end, `showHeatmap()` sets `--err-opacity` on each `.key` element. `HEAT_ERROR_MAX = 3` — full intensity at 3+ errors.

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

## Workflow Rules

1. Maintain a task list and work one task at a time.
2. After each function/file change, commit and push — one logical change per commit.
3. Write tests before implementing. Run all three test files and confirm green before the next task.
4. Ask probing questions when a request is vague.

## Repository

- GitHub: https://github.com/cbrayanalytics/dvorak-tutor
- Branch: `trunk`
- See `.claude/progress.md` for full task history and decisions.
