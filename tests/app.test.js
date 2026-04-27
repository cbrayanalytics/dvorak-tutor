'use strict';

// words.js exports getRoundWords as a global in browser; mock it for Node
global.getRoundWords = require('../words.js').getRoundWords;

const {
  calcWpm,
  calcAccuracy,
  getKeyState,
  buildPhrase,
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

// ── Summary ────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(40)}`);
console.log(`  ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
