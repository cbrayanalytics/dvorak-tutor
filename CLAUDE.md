# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A browser-based Dvorak keyboard layout typing tutor. No build tools, no dependencies — open `index.html` directly in a browser. All logic is vanilla JS/CSS.

## Running the App

```bash
open index.html          # macOS — opens in default browser
python3 -m http.server   # optional local server if needed for fetch()
```

There are no lint commands and no build step. Tests live in `tests/` as plain JS files runnable with Node:

```bash
node tests/words.test.js   # 49 tests — word list and level filtering
node tests/index.test.js   # 95 tests — HTML structure and data attributes
node tests/app.test.js     # 58 tests  — game logic unit tests
```

Visual CSS test: open `tests/styles.test.html` directly in a browser.

## Architecture

Four files; each has a single responsibility:

| File | Role |
|------|------|
| `index.html` | Shell markup — keyboard grid (`div.key` per key), stats bar, typed-text display |
| `styles.css` | Dark theme, finger-color palette (CSS vars), key state variants, pulse animation |
| `words.js` | Embedded word list array + `getWordsForLevel(level)` filter function |
| `app.js` | All runtime logic: key data, keyboard rendering, game loop, input handling, level progression |

### Key data model (`app.js`)

`DVORAK_KEYS` is the single source of truth — a flat array of objects:

```js
{ char: 'a', row: 'home', col: 0, finger: 'pinky-left', unlockedAtLevel: 1 }
```

`finger` values drive CSS class assignment for color coding. `unlockedAtLevel` drives which keys are active vs. grayed on each level.

### Level system

| Level | Keys added |
|-------|-----------|
| 1 | A O E U · H T N S (8 home resting positions) |
| 2 | I D (inner index keys, completing the home row) |
| 3 | P Y F G C R L (upper row letters) |
| 4 | Q J K X B M W V Z (bottom row letters) |
| 5 | Full keyboard — all letters, punctuation, numbers |

### Key visual states (CSS `data-state` attribute)

- `active` — unlocked at current level, finger-colored
- `locked` — not yet unlocked, dimmed (opacity 0.25)
- `home-preview` — I and D on Level 1 only: visible but grayed (opacity 0.45)
- `next` — the character the user must type next; pulsing animation

### Finger color palette (CSS custom properties)

```
--finger-pinky:  purple
--finger-ring:   blue
--finger-middle: green
--finger-index:  orange
--finger-thumb:  gray  (space)
```

Applied both to keyboard keys and to characters in the typed-text display.

## Workflow Rules

1. Maintain a task list and work one task at a time.
2. After each function/file is created, commit and push — one logical change per commit.
3. Write tests for every function before moving on. Run tests and confirm green before the next task.
4. Ask probing questions when a request is vague.

### Level progression

`advanceLevel()` is called when the user completes a round with ≥ 90% accuracy. It increments `currentLevel`, calls `renderKeyboard(currentLevel)`, and refreshes the word pool via `getWordsForLevel(currentLevel)`.

## Difficulty Tuning (next feature)

Planned additions to make the tutor adjustable without requiring code changes:

- **Word count per round** — how many words appear per practice round (currently hardcoded to 8)
- **Advance threshold** — minimum accuracy % required to unlock the next level (currently hardcoded to 90%)
- **Time limit** — optional countdown per round; failing to finish in time restarts the round

All three values should be exposed in a settings panel in the UI. Current constants in `app.js`:
- `ROUND_WORD_COUNT = 8`
- `ADVANCE_THRESHOLD = 90`

The settings panel will live in `index.html` and be toggled by a gear icon. Values should be saved to `localStorage` so they persist across sessions.

## Repository

- GitHub: https://github.com/cbrayanalytics/dvorak-tutor
- Branch: `trunk`
- See `.claude/progress.md` for current build status.
