'use strict';

const { WORD_LIST, LEVEL_CHARS, getLevelChars, getWordsForLevel, getRoundWords } = require('../words.js');

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

// ── WORD_LIST ──────────────────────────────────────────────────────────────
console.log('\nWORD_LIST');

assert('is an array', Array.isArray(WORD_LIST));
assert('has at least 500 words', WORD_LIST.length >= 500, `got ${WORD_LIST.length}`);

const hasDuplicate = new Set(WORD_LIST).size !== WORD_LIST.length;
assert('has no duplicate entries', !hasDuplicate);

const nonAlpha = WORD_LIST.filter(w => !/^[a-z]+$/.test(w));
assert('all words are lowercase alpha only', nonAlpha.length === 0,
  nonAlpha.length ? `first offender: "${nonAlpha[0]}"` : '');

const tooShort = WORD_LIST.filter(w => w.length < 2);
assert('no words shorter than 2 characters', tooShort.length === 0,
  tooShort.length ? `e.g. "${tooShort[0]}"` : '');

// ── LEVEL_CHARS ────────────────────────────────────────────────────────────
console.log('\nLEVEL_CHARS');

assert('has entries for levels 1-5', [1,2,3,4,5].every(l => LEVEL_CHARS[l] instanceof Set));

assert('Level 1 contains exactly a o e u h t n s (8 chars)',
  LEVEL_CHARS[1].size === 8 &&
  [...'aoeuhtns'].every(c => LEVEL_CHARS[1].has(c)));

assert('Level 2 adds i and d (10 chars)',
  LEVEL_CHARS[2].size === 10 &&
  LEVEL_CHARS[2].has('i') && LEVEL_CHARS[2].has('d'));

assert('Level 3 adds p y f g c r l (17 chars)',
  LEVEL_CHARS[3].size === 17 &&
  [...'pyfgcrl'].every(c => LEVEL_CHARS[3].has(c)));

assert('Level 4 adds q j k x b m w v z (26 chars)',
  LEVEL_CHARS[4].size === 26);

assert('Level 5 contains all 26 letters',
  LEVEL_CHARS[5].size === 26 &&
  [...'abcdefghijklmnopqrstuvwxyz'].every(c => LEVEL_CHARS[5].has(c)));

assert('Levels are cumulative (each is superset of previous)', [2,3,4,5].every(l => {
  const prev = LEVEL_CHARS[l - 1];
  const curr = LEVEL_CHARS[l];
  return [...prev].every(c => curr.has(c));
}));

// ── getLevelChars ──────────────────────────────────────────────────────────
console.log('\ngetLevelChars');

assert('returns correct Set for level 1', getLevelChars(1) === LEVEL_CHARS[1]);
assert('returns correct Set for level 5', getLevelChars(5) === LEVEL_CHARS[5]);
assert('falls back to level 5 for out-of-range input',
  getLevelChars(99) === LEVEL_CHARS[5]);

// ── getWordsForLevel ───────────────────────────────────────────────────────
console.log('\ngetWordsForLevel');

for (let level = 1; level <= 5; level++) {
  const words = getWordsForLevel(level);
  const allowed = getLevelChars(level);

  assert(`Level ${level}: returns an array`, Array.isArray(words));
  assert(`Level ${level}: non-empty`, words.length > 0, `got ${words.length}`);

  const badWord = words.find(w => w.split('').some(c => !allowed.has(c)));
  assert(`Level ${level}: all words use only allowed letters`, !badWord,
    badWord ? `offender: "${badWord}"` : '');
}

assert('Level 1 has at least 30 words', getWordsForLevel(1).length >= 30,
  `got ${getWordsForLevel(1).length}`);
assert('Level 2 has more words than Level 1',
  getWordsForLevel(2).length > getWordsForLevel(1).length);
assert('Level 3 has more words than Level 2',
  getWordsForLevel(3).length > getWordsForLevel(2).length);
assert('Level 5 returns all words in WORD_LIST',
  getWordsForLevel(5).length === WORD_LIST.length);

// Spot-check known Level 1 words
const l1 = new Set(getWordsForLevel(1));
['the','hat','sun','tone','shout','stone','honest'].forEach(w => {
  assert(`Level 1 includes "${w}"`, l1.has(w));
});

// Spot-check that words requiring Level 2+ letters are absent at Level 1
const shouldMissL1 = ['this','and','hide','diet'];
shouldMissL1.forEach(w => {
  assert(`Level 1 excludes "${w}"`, !l1.has(w));
});

// ── getRoundWords ──────────────────────────────────────────────────────────
console.log('\ngetRoundWords');

const round = getRoundWords(1, 10);
assert('returns an array', Array.isArray(round));
assert('returns requested count', round.length === 10, `got ${round.length}`);

const l1allowed = getLevelChars(1);
const badRound = round.find(w => w.split('').some(c => !l1allowed.has(c)));
assert('all round words respect level filter', !badRound,
  badRound ? `offender: "${badRound}"` : '');

const smallPool = getWordsForLevel(1);
const cap = getRoundWords(1, 9999);
assert('caps at pool size when count exceeds pool',
  cap.length === smallPool.length, `got ${cap.length}, pool is ${smallPool.length}`);

// ── SUMMARY ───────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(40)}`);
console.log(`  ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
