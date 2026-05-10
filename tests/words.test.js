'use strict';

const { WORD_LIST, LEVEL_CHARS, getLevelChars, getWordsForLevel, getRoundWords, getWeightedWords, getQuotesForLevel, getRoundQuote } = require('../words.js');

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

assert('has entries for levels 1-10', [1,2,3,4,5,6,7,8,9,10].every(l => LEVEL_CHARS[l] instanceof Set));

assert('Level 1 contains exactly a o e u h t n s (8 chars)',
  LEVEL_CHARS[1].size === 8 &&
  [...'aoeuhtns'].every(c => LEVEL_CHARS[1].has(c)));

assert('Level 2 adds i and d (10 chars)',
  LEVEL_CHARS[2].size === 10 &&
  LEVEL_CHARS[2].has('i') && LEVEL_CHARS[2].has('d'));

assert('Level 3 adds r l (12 chars)',
  LEVEL_CHARS[3].size === 12 &&
  ['r','l'].every(c => LEVEL_CHARS[3].has(c)));

assert('Level 4 adds c f (14 chars)',
  LEVEL_CHARS[4].size === 14 &&
  ['c','f'].every(c => LEVEL_CHARS[4].has(c)));

assert('Level 5 adds g p (16 chars)',
  LEVEL_CHARS[5].size === 16 &&
  ['g','p'].every(c => LEVEL_CHARS[5].has(c)));

assert('Level 6 adds y b (18 chars)',
  LEVEL_CHARS[6].size === 18 &&
  ['y','b'].every(c => LEVEL_CHARS[6].has(c)));

assert('Level 7 adds m w (20 chars)',
  LEVEL_CHARS[7].size === 20 &&
  ['m','w'].every(c => LEVEL_CHARS[7].has(c)));

assert('Level 8 adds v k (22 chars)',
  LEVEL_CHARS[8].size === 22 &&
  ['v','k'].every(c => LEVEL_CHARS[8].has(c)));

assert('Level 9 adds j x q z — all 26 letters',
  LEVEL_CHARS[9].size === 26 &&
  ['j','x','q','z'].every(c => LEVEL_CHARS[9].has(c)));

assert('Level 10 contains all 26 letters',
  [...'abcdefghijklmnopqrstuvwxyz'].every(c => LEVEL_CHARS[10].has(c)));

assert('Levels are cumulative (each is superset of previous)', [2,3,4,5,6,7,8,9,10].every(l => {
  const prev = LEVEL_CHARS[l - 1];
  const curr = LEVEL_CHARS[l];
  return [...prev].every(c => curr.has(c));
}));

// ── getLevelChars ──────────────────────────────────────────────────────────
console.log('\ngetLevelChars');

assert('returns correct Set for level 1', getLevelChars(1) === LEVEL_CHARS[1]);
assert('returns correct Set for level 10', getLevelChars(10) === LEVEL_CHARS[10]);
assert('falls back to level 10 for out-of-range input',
  getLevelChars(99) === LEVEL_CHARS[10]);

// ── getWordsForLevel ───────────────────────────────────────────────────────
console.log('\ngetWordsForLevel');

for (let level = 1; level <= 10; level++) {
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
assert('Level 9 returns all words in WORD_LIST',
  getWordsForLevel(9).length === WORD_LIST.length);

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

// ── getWeightedWords ──────────────────────────────────────────────────────
console.log('\ngetWeightedWords');

// Returns an array of strings
const ww1 = getWeightedWords(1, { h: 5, t: 3 }, 20);
assert('returns an array',                  Array.isArray(ww1));
assert('all items are strings',             ww1.every(w => typeof w === 'string'));
assert('respects count cap',                ww1.length <= 20);
assert('no duplicates',                     ww1.length === new Set(ww1).size);

// All words use only level-allowed chars
const level1Chars = getLevelChars(1);
assert('all words use only level-1 chars',
  ww1.every(w => [...w].every(c => level1Chars.has(c))));

// Empty weakKeys behaves like getRoundWords (returns valid words)
const wwEmpty = getWeightedWords(2, {}, 30);
assert('empty weakKeys: returns array',     Array.isArray(wwEmpty));
assert('empty weakKeys: no duplicates',     wwEmpty.length === new Set(wwEmpty).size);
const level2Chars = getLevelChars(2);
assert('empty weakKeys: only level-2 chars',
  wwEmpty.every(w => [...w].every(c => level2Chars.has(c))));

// null / undefined weakKeys does not crash
let nullSafe = true;
try { getWeightedWords(1, null, 10); getWeightedWords(1, undefined, 10); }
catch (e) { nullSafe = false; }
assert('null/undefined weakKeys does not crash', nullSafe);

// Words containing error chars appear in the result
// With 'h' heavily errored, words containing 'h' should appear
const wwBiased = getWeightedWords(1, { h: 10 }, 50);
const hasHWord = wwBiased.some(w => w.includes('h'));
assert('biased result includes words with the error char', hasHWord);

// Result is a subset of the level word pool
const pool1 = new Set(getWordsForLevel(1));
assert('all returned words are from the level pool',
  ww1.every(w => pool1.has(w)));

// Count exceeding pool still returns at most pool size
const fullPool = getWordsForLevel(1);
const wwMax = getWeightedWords(1, { h: 5 }, 9999);
assert('caps at pool size when count exceeds pool',
  wwMax.length <= fullPool.length);

// ── getQuotesForLevel ─────────────────────────────────────────────────────
console.log('\ngetQuotesForLevel');

for (let level = 1; level <= 10; level++) {
  const quotes = getQuotesForLevel(level);
  const allowed = getLevelChars(level);
  assert(`level ${level}: returns an array`, Array.isArray(quotes));
  // Every char in every quote (excluding spaces) must be in the allowed set
  const bad = quotes.find(q => [...q].some(c => c !== ' ' && !allowed.has(c)));
  assert(`level ${level}: all chars are allowed`, !bad, bad ? `offending quote: "${bad}"` : '');
}

// Higher levels have at least as many quotes as lower levels
assert('level 10 has more quotes than level 1',
  getQuotesForLevel(10).length >= getQuotesForLevel(1).length);

// Returns at least some quotes at level 7+
assert('level 7 has at least 3 quotes', getQuotesForLevel(7).length >= 3);
assert('level 9 has at least 10 quotes', getQuotesForLevel(9).length >= 10);

// ── getRoundQuote ─────────────────────────────────────────────────────────
console.log('\ngetRoundQuote');

for (let level = 7; level <= 10; level++) {
  const quote = getRoundQuote(level);
  assert(`level ${level}: getRoundQuote returns a string`, typeof quote === 'string');
  assert(`level ${level}: quote is non-empty`, quote.length > 0);
  const allowed = getLevelChars(level);
  const badChar = [...quote].find(c => c !== ' ' && !allowed.has(c));
  assert(`level ${level}: quote uses only allowed chars`, !badChar,
    badChar ? `offending: "${badChar}"` : '');
}

// Falls back gracefully at level 1 (may return empty string if no quotes exist)
const q1 = getRoundQuote(1);
assert('getRoundQuote level 1 does not crash', typeof q1 === 'string');

// ── SUMMARY ───────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(40)}`);
console.log(`  ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
