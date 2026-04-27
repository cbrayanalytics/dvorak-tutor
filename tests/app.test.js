'use strict';

// words.js exports getRoundWords as a global in browser; mock it for Node
global.getRoundWords = require('../words.js').getRoundWords;

// localStorage mock for Node (not available outside browser)
global.localStorage = (() => {
  let store = {};
  return {
    getItem:    k       => store[k] ?? null,
    setItem:    (k, v)  => { store[k] = String(v); },
    removeItem: k       => { delete store[k]; },
    clear:      ()      => { store = {}; },
  };
})();

const {
  calcWpm,
  calcAccuracy,
  getKeyState,
  buildPhrase,
  suggestTimerMins,
  loadSettings,
  saveSettings,
  settings,
  loadBests,
  saveBest,
  getBest,
  ADVANCE_THRESHOLD,
  ROUND_WORD_COUNT,
} = require('../app.js');

let passed = 0;
let failed = 0;

function assert(label, condition, detail = '') {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ ${label}${detail ? ' — ' + detail : ''}`);
    failed++;
  }
}

// ── calcWpm ────────────────────────────────────────────────────
console.log('\ncalcWpm');

assert('0 chars typed → 0',       calcWpm(0, 5000) === 0);
assert('elapsed 0 → 0',           calcWpm(100, 0) === 0);
assert('negative elapsed → 0',    calcWpm(100, -1) === 0);
assert('5 chars in 60s → 1 wpm',  calcWpm(5, 60000) === 1);
assert('50 chars in 60s → 10 wpm',calcWpm(50, 60000) === 10);
assert('250 chars in 60s → 50 wpm',calcWpm(250, 60000) === 50);
assert('500 chars in 60s → 100 wpm',calcWpm(500, 60000) === 100);
assert('rounds result',           calcWpm(26, 60000) === 5); // 26/5=5.2 → 5

// ── calcAccuracy ───────────────────────────────────────────────
console.log('\ncalcAccuracy');

assert('0 total → 0',             calcAccuracy(0, 0) === 0);
assert('all correct → 100',       calcAccuracy(10, 10) === 100);
assert('none correct → 0',        calcAccuracy(0, 10) === 0);
assert('half correct → 50',       calcAccuracy(5, 10) === 50);
assert('9/10 → 90',               calcAccuracy(9, 10) === 90);
assert('rounds result',           calcAccuracy(2, 3) === 67); // 66.6 → 67
assert('correct > total handled', calcAccuracy(11, 10) === 110); // no clamp — caller's job

// ── getKeyState ────────────────────────────────────────────────
console.log('\ngetKeyState');

// Level 1 — home keys active
assert('level 1 key at level 1 → active',   getKeyState(1, 1, 'a') === 'active');
assert('level 1 key at level 2 → active',   getKeyState(1, 2, 'a') === 'active');
assert('level 1 key at level 5 → active',   getKeyState(1, 5, 'a') === 'active');

// Level 2 — locked until level 2
assert('"i" at level 1 → home-preview',     getKeyState(2, 1, 'i') === 'home-preview');
assert('"d" at level 1 → home-preview',     getKeyState(2, 1, 'd') === 'home-preview');
assert('"i" at level 2 → active',           getKeyState(2, 2, 'i') === 'active');
assert('"d" at level 2 → active',           getKeyState(2, 2, 'd') === 'active');

// home-preview only applies to level-2 chars at active level 1
assert('level 3 char "p" at level 1 → locked', getKeyState(3, 1, 'p') === 'locked');
assert('level 3 char "p" at level 2 → locked', getKeyState(3, 2, 'p') === 'locked');
assert('level 3 char "p" at level 3 → active', getKeyState(3, 3, 'p') === 'active');

// Level 4 chars
assert('level 4 char "b" at level 3 → locked', getKeyState(4, 3, 'b') === 'locked');
assert('level 4 char "b" at level 4 → active', getKeyState(4, 4, 'b') === 'active');

// Level 5 chars
assert('level 5 char "1" at level 4 → locked', getKeyState(5, 4, '1') === 'locked');
assert('level 5 char "1" at level 5 → active', getKeyState(5, 5, '1') === 'active');

// home-preview only for 'i' and 'd', not an arbitrary level-2 char
// (there are no other level-2 chars but guard the logic explicitly)
assert('non i/d level-2 char at level 1 → locked', getKeyState(2, 1, 'x') === 'locked');

// ── buildPhrase ────────────────────────────────────────────────
console.log('\nbuildPhrase');

for (let level = 1; level <= 5; level++) {
  const { getLevelChars } = require('../words.js');
  const allowed = getLevelChars(level);
  const phrase  = buildPhrase(level, ROUND_WORD_COUNT);

  assert(`level ${level}: returns a string`,  typeof phrase === 'string');
  assert(`level ${level}: non-empty`,         phrase.length > 0);

  // Every non-space character must be in the allowed set
  const bad = [...phrase].find(c => c !== ' ' && !allowed.has(c));
  assert(`level ${level}: only uses allowed letters`, !bad,
    bad ? `offending char: "${bad}"` : '');

  // Should contain spaces (word separators)
  assert(`level ${level}: contains spaces`, phrase.includes(' '));

  // Word count ≤ ROUND_WORD_COUNT (can be less if pool is small)
  const wordCount = phrase.split(' ').length;
  assert(`level ${level}: ≤ ${ROUND_WORD_COUNT} words`, wordCount <= ROUND_WORD_COUNT,
    `got ${wordCount}`);
}

// Different calls produce different phrases (shuffle is working)
const p1 = buildPhrase(3, ROUND_WORD_COUNT);
const p2 = buildPhrase(3, ROUND_WORD_COUNT);
// Not guaranteed to differ every time, but almost certainly will with 8 words from a large pool
// Just verify both are valid strings
assert('repeated calls return strings', typeof p1 === 'string' && typeof p2 === 'string');

// ── Constants ──────────────────────────────────────────────────
console.log('\nConstants');

assert('ADVANCE_THRESHOLD is 90',       ADVANCE_THRESHOLD === 90);
assert('ROUND_WORD_COUNT is at least 1', ROUND_WORD_COUNT >= 1);

// ── suggestTimerMins ───────────────────────────────────────────
console.log('\nsuggestTimerMins');

assert('10 WPM, 100 words → 15 min',   suggestTimerMins(100, 10) === 15);
assert('20 WPM, 100 words → 8 min',    suggestTimerMins(100, 20) === 8);
assert('30 WPM, 100 words → 5 min',    suggestTimerMins(100, 30) === 5);
assert('10 WPM,  10 words → 2 min',    suggestTimerMins(10,  10) === 2);
assert('10 WPM, 200 words → 30 min',   suggestTimerMins(200, 10) === 30);
assert('10 WPM, 500 words → 60 min (capped)', suggestTimerMins(500, 10) === 60);
assert('0 WPM does not crash → 60 min (capped)', suggestTimerMins(100, 0) === 60);
assert('1 WPM, 10 words → 15 min (ceil)', suggestTimerMins(10, 1) === 15);
assert('always at least 1 min',         suggestTimerMins(1, 100) >= 1);

// ── loadSettings / saveSettings ────────────────────────────────
console.log('\nloadSettings / saveSettings');

// Reset localStorage before each block
localStorage.clear();
loadSettings();
assert('defaults: wordCount = 100',     settings.wordCount === 100);
assert('defaults: threshold = 90',      settings.threshold === 90);

// Round-trip: save non-default values then reload
localStorage.clear();
saveSettings({ wordCount: 50, threshold: 75, timerOn: true, timerMins: 10 });
loadSettings();
assert('round-trip: wordCount = 50',    settings.wordCount === 50);
assert('round-trip: threshold = 75',    settings.threshold === 75);

// Partial storage: missing keys fall back to defaults
localStorage.clear();
localStorage.setItem('dvorak-tutor-settings', JSON.stringify({ wordCount: 30 }));
loadSettings();
assert('partial: wordCount = 30',       settings.wordCount === 30);
assert('partial: threshold defaults to 90', settings.threshold === 90);

// Malformed JSON does not crash
localStorage.clear();
localStorage.setItem('dvorak-tutor-settings', 'not-json');
loadSettings();
assert('malformed JSON: falls back to defaults', settings.wordCount === 100);

// Restore clean state
localStorage.clear();
loadSettings();

// ── Level persistence ───────────────────────────────────────────
console.log('\nLevel persistence');

localStorage.clear();
loadSettings();
assert('defaults: level = 1',              settings.level === 1);

localStorage.clear();
saveSettings({ level: 3 });
loadSettings();
assert('round-trip: level 3 persists',    settings.level === 3);

localStorage.clear();
saveSettings({ level: 5 });
loadSettings();
assert('round-trip: level 5 persists',    settings.level === 5);

localStorage.clear();
localStorage.setItem('dvorak-tutor-settings', JSON.stringify({ level: 6 }));
loadSettings();
assert('level 6 clamps to 5',             settings.level === 5);

localStorage.clear();
localStorage.setItem('dvorak-tutor-settings', JSON.stringify({ level: 0 }));
loadSettings();
assert('level 0 clamps to 1',             settings.level === 1);

// Restore clean state
localStorage.clear();
loadSettings();

// ── Personal bests ─────────────────────────────────────────────
console.log('\nPersonal bests');

localStorage.clear();
assert('loadBests: empty object when no data', JSON.stringify(loadBests()) === '{}');

// saveBest: first entry always saves, returns true
localStorage.clear();
assert('saveBest: first entry saved',         saveBest(1, 40, 92) === true);
assert('getBest: returns saved entry',        getBest(1)?.wpm === 40 && getBest(1)?.acc === 92);

// saveBest: updates when new WPM is higher
assert('saveBest: higher WPM updates',        saveBest(1, 55, 88) === true);
assert('getBest: reflects new best WPM',      getBest(1)?.wpm === 55);

// saveBest: does NOT update when WPM is lower or equal
assert('saveBest: lower WPM skipped',         saveBest(1, 30, 99) === false);
assert('getBest: WPM unchanged after skip',   getBest(1)?.wpm === 55);
assert('saveBest: equal WPM skipped',         saveBest(1, 55, 100) === false);

// getBest: null for level with no entry
assert('getBest: null for unseen level',      getBest(3) === null);

// Each level tracked independently
localStorage.clear();
saveBest(1, 40, 90);
saveBest(2, 30, 95);
assert('level 1 best independent',           getBest(1)?.wpm === 40);
assert('level 2 best independent',           getBest(2)?.wpm === 30);

// loadBests: malformed JSON returns empty object, does not crash
localStorage.clear();
localStorage.setItem('dvorak-tutor-bests', 'not-json');
assert('loadBests: malformed JSON safe',      JSON.stringify(loadBests()) === '{}');

// Restore
localStorage.clear();

// ── Summary ────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(40)}`);
console.log(`  ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
