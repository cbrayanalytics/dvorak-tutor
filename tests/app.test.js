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
  calcProgressPct,
  getKeyState,
  buildPhrase,
  calcHeatIntensity,
  suggestTimerMins,
  loadSettings,
  saveSettings,
  settings,
  loadBests,
  saveBest,
  getBest,
  playClick,
  playError,
  playLevelUp,
  loadWeakKeys,
  saveWeakKeys,
  mergeWeakKeys,
  loadHistory,
  appendHistory,
  renderSparkline,
  calcTrend,
  applyKeyboardLayout,
  getHotChars,
  resetProgress,
  loadDailyStreak,
  saveDailyStreak,
  updateDailyStreak,
  ADVANCE_THRESHOLD,
  ROUND_WORD_COUNT,
  MID_ROUND_ERROR_THRESHOLD,
  MAX_MID_ROUND_INJECTIONS,
  MID_ROUND_INJECT_COUNT,
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

// ── calcProgressPct ────────────────────────────────────────────
console.log('\ncalcProgressPct');

assert('0 cursor → 0',                    calcProgressPct(0, 100, 100, 90) === 0);
assert('phraseLength 0 → 0',             calcProgressPct(10, 0, 100, 90) === 0);
assert('half done, at threshold → 50',   calcProgressPct(50, 100, 90, 90) === 50);
assert('complete, at threshold → 100',   calcProgressPct(100, 100, 90, 90) === 100);
assert('complete, 100% acc → 100',       calcProgressPct(100, 100, 100, 90) === 100);
assert('half done, below threshold → 25',calcProgressPct(50, 100, 45, 90) === 25);
assert('1 of 500 chars → ~0',            calcProgressPct(1, 500, 100, 90) === 0);

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
assert('level 1 key at level 10 → active',  getKeyState(1, 10, 'a') === 'active');

// Level 2 — locked until level 2
assert('"i" at level 1 → home-preview',     getKeyState(2, 1, 'i') === 'home-preview');
assert('"d" at level 1 → home-preview',     getKeyState(2, 1, 'd') === 'home-preview');
assert('"i" at level 2 → active',           getKeyState(2, 2, 'i') === 'active');
assert('"d" at level 2 → active',           getKeyState(2, 2, 'd') === 'active');

// home-preview only applies to level-2 chars at active level 1
assert('level 5 char "p" at level 1 → locked', getKeyState(5, 1, 'p') === 'locked');
assert('level 5 char "p" at level 4 → locked', getKeyState(5, 4, 'p') === 'locked');
assert('level 5 char "p" at level 5 → active', getKeyState(5, 5, 'p') === 'active');

// Level 6 chars
assert('level 6 char "b" at level 5 → locked', getKeyState(6, 5, 'b') === 'locked');
assert('level 6 char "b" at level 6 → active', getKeyState(6, 6, 'b') === 'active');

// Level 10 chars
assert('level 10 char "1" at level 9 → locked',  getKeyState(10, 9, '1') === 'locked');
assert('level 10 char "1" at level 10 → active', getKeyState(10, 10, '1') === 'active');

// home-preview only for 'i' and 'd', not an arbitrary level-2 char
// (there are no other level-2 chars but guard the logic explicitly)
assert('non i/d level-2 char at level 1 → locked', getKeyState(2, 1, 'x') === 'locked');

// ── buildPhrase ────────────────────────────────────────────────
console.log('\nbuildPhrase');

for (let level = 1; level <= 10; level++) {
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
saveSettings({ level: 10 });
loadSettings();
assert('round-trip: level 10 persists',   settings.level === 10);

localStorage.clear();
localStorage.setItem('dvorak-tutor-settings', JSON.stringify({ level: 11 }));
loadSettings();
assert('level 11 clamps to 10',           settings.level === 10);

localStorage.clear();
localStorage.setItem('dvorak-tutor-settings', JSON.stringify({ level: 0 }));
loadSettings();
assert('level 0 clamps to 1',             settings.level === 1);

// Restore clean state
localStorage.clear();
loadSettings();

// ── calcHeatIntensity ──────────────────────────────────────────
console.log('\ncalcHeatIntensity');

assert('0 errors → 0',          calcHeatIntensity(0) === 0);
assert('1 error  → ~0.333',     Math.abs(calcHeatIntensity(1) - 1/3) < 0.001);
assert('3 errors → 1 (max)',    calcHeatIntensity(3) === 1);
assert('10 errors → 1 (cap)',   calcHeatIntensity(10) === 1);
assert('2 errors → ~0.667',     Math.abs(calcHeatIntensity(2) - 2/3) < 0.001);

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

// ── weak keys storage ──────────────────────────────────────────
console.log('\nweak keys storage');

localStorage.clear();
assert('loadWeakKeys: empty when no data',           JSON.stringify(loadWeakKeys(1)) === '{}');
assert('loadWeakKeys: missing level returns {}',     JSON.stringify(loadWeakKeys(3)) === '{}');

// saveWeakKeys + loadWeakKeys round-trip
localStorage.clear();
saveWeakKeys(1, { h: 4, t: 2 });
assert('round-trip: saved keys present',             loadWeakKeys(1).h === 4 && loadWeakKeys(1).t === 2);
assert('other levels unaffected',                    JSON.stringify(loadWeakKeys(2)) === '{}');

// Levels stored independently
saveWeakKeys(2, { i: 6 });
assert('level 1 unchanged after level 2 save',      loadWeakKeys(1).h === 4);
assert('level 2 stored correctly',                   loadWeakKeys(2).i === 6);

// Malformed JSON does not crash
localStorage.clear();
localStorage.setItem('dvorak-tutor-weak-keys', 'bad-json');
assert('malformed JSON: loadWeakKeys does not crash', JSON.stringify(loadWeakKeys(1)) === '{}');

localStorage.clear();

// ── mergeWeakKeys ──────────────────────────────────────────────
console.log('\nmergeWeakKeys');

// Fresh merge: stored is empty
assert('merge into empty: returns round errors',
  mergeWeakKeys({}, { h: 3, t: 1 }).h === 3);

// Existing counts decay before adding new round counts
// Decay factor is 0.85; 10 * 0.85 = 8.5 + 2 = 10.5 → floor = 10
const merged = mergeWeakKeys({ h: 10 }, { h: 2 });
assert('decay applied before merging',               merged.h === 10); // floor(10*0.85+2)=floor(10.5)=10

// New char in round added fresh
const m2 = mergeWeakKeys({ h: 4 }, { t: 3 });
assert('new error char added',                       m2.t === 3);
assert('existing char decays when not in new round', m2.h === 3); // floor(4*0.85)=floor(3.4)=3

// Chars that decay to 0 are removed
const m3 = mergeWeakKeys({ h: 1 }, {});
assert('chars decaying to 0 are pruned',             m3.h === undefined);

// null/undefined inputs do not crash
let mergeSafe = true;
try { mergeWeakKeys(null, null); mergeWeakKeys(undefined, {}); } catch (e) { mergeSafe = false; }
assert('mergeWeakKeys tolerates null inputs',        mergeSafe);

localStorage.clear();

// ── history storage ────────────────────────────────────────────
console.log('\nhistory storage');

localStorage.clear();
assert('loadHistory: empty array when no data',      Array.isArray(loadHistory(1)) && loadHistory(1).length === 0);
assert('loadHistory: missing level returns []',      loadHistory(3).length === 0);

// appendHistory stores an entry
localStorage.clear();
appendHistory(1, { wpm: 45, acc: 92, ts: 1000 });
const h1 = loadHistory(1);
assert('appendHistory: entry stored',                h1.length === 1);
assert('appendHistory: wpm correct',                 h1[0].wpm === 45);
assert('appendHistory: acc correct',                 h1[0].acc === 92);
assert('appendHistory: ts correct',                  h1[0].ts === 1000);

// Multiple entries accumulate in order (oldest first)
appendHistory(1, { wpm: 50, acc: 95, ts: 2000 });
appendHistory(1, { wpm: 55, acc: 88, ts: 3000 });
const h2 = loadHistory(1);
assert('multiple entries in order',                  h2[0].wpm === 45 && h2[2].wpm === 55);

// Levels stored independently
appendHistory(2, { wpm: 30, acc: 80, ts: 4000 });
assert('level 1 unaffected by level 2 append',      loadHistory(1).length === 3);
assert('level 2 stored independently',              loadHistory(2).length === 1);

// Trims to 20 entries (oldest dropped first)
localStorage.clear();
for (let i = 0; i < 25; i++) appendHistory(1, { wpm: i, acc: 90, ts: i });
const hTrim = loadHistory(1);
assert('trims to 20 entries',                        hTrim.length === 20);
assert('oldest entries dropped',                     hTrim[0].wpm === 5);  // 0–4 dropped
assert('newest entry retained',                      hTrim[19].wpm === 24);

// Malformed JSON returns empty array
localStorage.clear();
localStorage.setItem('dvorak-tutor-history', 'bad-json');
assert('malformed JSON: loadHistory safe',           loadHistory(1).length === 0);

localStorage.clear();

// ── renderSparkline ────────────────────────────────────────────
console.log('\nrenderSparkline');

const svg1 = renderSparkline([40, 45, 50, 48, 55]);
assert('renderSparkline returns an object',          typeof svg1 === 'object' && svg1 !== null);
assert('renderSparkline: tagName is svg (case-insensitive)',
  svg1.tagName && svg1.tagName.toLowerCase() === 'svg');
assert('renderSparkline: has viewBox attribute',     svg1.getAttribute('viewBox') !== null);

// Edge cases
const svgEmpty = renderSparkline([]);
assert('renderSparkline: empty array does not crash', typeof svgEmpty === 'object');

const svgOne = renderSparkline([42]);
assert('renderSparkline: single point does not crash', typeof svgOne === 'object');

// ── calcTrend ──────────────────────────────────────────────────
console.log('\ncalcTrend');

assert('no history → null',                         calcTrend([]) === null);
assert('fewer than 2 entries → null',               calcTrend([{ wpm: 40 }]) === null);
assert('improving trend → "up"',                    calcTrend([
  { wpm: 30 }, { wpm: 32 }, { wpm: 35 }, { wpm: 38 }, { wpm: 40 },
  { wpm: 42 }, { wpm: 44 }, { wpm: 46 }, { wpm: 48 }, { wpm: 50 },
]) === 'up');
assert('declining trend → "down"',                  calcTrend([
  { wpm: 50 }, { wpm: 48 }, { wpm: 46 }, { wpm: 44 }, { wpm: 42 },
  { wpm: 40 }, { wpm: 38 }, { wpm: 36 }, { wpm: 34 }, { wpm: 32 },
]) === 'down');
assert('flat trend → "flat"',                       calcTrend([
  { wpm: 40 }, { wpm: 40 }, { wpm: 41 }, { wpm: 40 }, { wpm: 40 },
  { wpm: 40 }, { wpm: 41 }, { wpm: 40 }, { wpm: 40 }, { wpm: 40 },
]) === 'flat');
assert('with < 10 entries, uses all available',     calcTrend([
  { wpm: 30 }, { wpm: 35 }, { wpm: 40 }, { wpm: 45 },
]) === 'up');

// ── mode setting ───────────────────────────────────────────────
console.log('\nmode setting');

localStorage.clear();
loadSettings();
assert('defaults: mode = words',              settings.mode === 'words');

localStorage.clear();
saveSettings({ mode: 'quotes' });
loadSettings();
assert('round-trip: mode quotes persists',    settings.mode === 'quotes');

localStorage.clear();
saveSettings({ mode: 'words' });
loadSettings();
assert('round-trip: mode words persists',     settings.mode === 'words');

localStorage.clear();
localStorage.setItem('dvorak-tutor-settings', JSON.stringify({ wordCount: 50 }));
loadSettings();
assert('missing mode defaults to words',      settings.mode === 'words');

localStorage.clear();
loadSettings();

// ── audioOn setting ────────────────────────────────────────────
console.log('\naudioOn setting');

localStorage.clear();
loadSettings();
assert('defaults: audioOn = true',              settings.audioOn === true);

localStorage.clear();
saveSettings({ audioOn: false });
loadSettings();
assert('round-trip: audioOn false persists',    settings.audioOn === false);

localStorage.clear();
saveSettings({ audioOn: true });
loadSettings();
assert('round-trip: audioOn true persists',     settings.audioOn === true);

// Malformed / missing audioOn falls back to default
localStorage.clear();
localStorage.setItem('dvorak-tutor-settings', JSON.stringify({ wordCount: 50 }));
loadSettings();
assert('missing audioOn defaults to true',      settings.audioOn === true);

// Restore
localStorage.clear();
loadSettings();

// ── audio functions ────────────────────────────────────────────
console.log('\naudio functions');

assert('playClick is a function',               typeof playClick   === 'function');
assert('playError is a function',               typeof playError   === 'function');
assert('playLevelUp is a function',             typeof playLevelUp === 'function');

// Must not throw in Node where AudioContext is unavailable
let audioNoCrash = true;
try { playClick(); playError(); playLevelUp(); } catch (e) { audioNoCrash = false; }
assert('audio functions do not crash without AudioContext', audioNoCrash);

// Calling with audioOn: false must also not crash
saveSettings({ audioOn: false });
let audioOffNoCrash = true;
try { playClick(); playError(); playLevelUp(); } catch (e) { audioOffNoCrash = false; }
assert('audio functions silent when audioOn = false', audioOffNoCrash);

localStorage.clear();
loadSettings();

// ── keyboardStyle setting ──────────────────────────────────────
console.log('\nkeyboardStyle setting');

localStorage.clear();
loadSettings();
assert('defaults: keyboardStyle = standard',        settings.keyboardStyle === 'standard');

localStorage.clear();
saveSettings({ keyboardStyle: 'corne-3x6' });
loadSettings();
assert('round-trip: corne-3x6 persists',            settings.keyboardStyle === 'corne-3x6');

localStorage.clear();
saveSettings({ keyboardStyle: 'corne-3x5' });
loadSettings();
assert('round-trip: corne-3x5 persists',            settings.keyboardStyle === 'corne-3x5');

localStorage.clear();
localStorage.setItem('dvorak-tutor-settings', JSON.stringify({ wordCount: 50 }));
loadSettings();
assert('missing keyboardStyle defaults to standard', settings.keyboardStyle === 'standard');

localStorage.clear();
loadSettings();

// ── applyKeyboardLayout ────────────────────────────────────────
console.log('\napplyKeyboardLayout');

{
  // Minimal DOM mock: enough for applyKeyboardLayout to set data-layout and no-op the rest
  const noopEl = () => ({
    className: '', dataset: {}, style: { setProperty() {} }, textContent: '',
    appendChild() {}, firstChild: null, removeChild() {},
    cloneNode() { return this; },
  });
  const kbEl = { dataset: {}, firstChild: null, removeChild() {}, appendChild() {} };
  global.document = {
    getElementById:        id  => id === 'keyboard' ? kbEl : null,
    querySelectorAll:      ()  => [],
    createElement:         ()  => noopEl(),
    createDocumentFragment: () => ({ appendChild() {}, cloneNode() { return this; } }),
  };

  applyKeyboardLayout('standard');
  assert('standard sets data-layout = standard',   kbEl.dataset.layout === 'standard');

  applyKeyboardLayout('corne-3x6');
  assert('corne-3x6 sets data-layout = corne-3x6', kbEl.dataset.layout === 'corne-3x6');

  applyKeyboardLayout('corne-3x5');
  assert('corne-3x5 sets data-layout = corne-3x5', kbEl.dataset.layout === 'corne-3x5');

  delete global.document;
}

// ── getHotChars ────────────────────────────────────────────────
console.log('\ngetHotChars');

assert('empty errorMap → no hot chars',
  getHotChars({}, 3).length === 0);
assert('all chars below threshold → empty',
  getHotChars({ a: 2, e: 1 }, 3).length === 0);
assert('char exactly at threshold → included',
  getHotChars({ a: 3 }, 3).includes('a'));
assert('char above threshold → included',
  getHotChars({ a: 5 }, 3).includes('a'));
assert('only chars meeting threshold returned',
  JSON.stringify(getHotChars({ a: 3, e: 1, o: 4 }, 3).sort()) === JSON.stringify(['a', 'o']));
assert('threshold 1 → all chars with any error',
  getHotChars({ a: 1, b: 1 }, 1).length === 2);
assert('char at threshold - 1 → not included',
  getHotChars({ a: 2 }, 3).length === 0);

// ── Mid-round injection constants ──────────────────────────────
console.log('\nMid-round injection constants');

assert('MID_ROUND_ERROR_THRESHOLD is a positive number',
  typeof MID_ROUND_ERROR_THRESHOLD === 'number' && MID_ROUND_ERROR_THRESHOLD > 0);
assert('MAX_MID_ROUND_INJECTIONS is a positive number',
  typeof MAX_MID_ROUND_INJECTIONS === 'number' && MAX_MID_ROUND_INJECTIONS > 0);
assert('MID_ROUND_INJECT_COUNT is a positive number',
  typeof MID_ROUND_INJECT_COUNT === 'number' && MID_ROUND_INJECT_COUNT > 0);

// ── resetProgress ──────────────────────────────────────────────
console.log('\nresetProgress');

{
  localStorage.clear();
  saveBest(1, 60, 95);
  appendHistory(1, { wpm: 60, acc: 95, ts: 1000 });
  saveWeakKeys(1, { a: 3 });
  saveSettings({ level: 5 });

  resetProgress();

  loadSettings();
  assert('resetProgress: clears bests',
    Object.keys(loadBests()).length === 0);
  assert('resetProgress: clears history',
    loadHistory(1).length === 0);
  assert('resetProgress: clears weak keys',
    Object.keys(loadWeakKeys(1)).length === 0);
  assert('resetProgress: resets level to 1',
    settings.level === 1);
}

// ── Daily streak ───────────────────────────────────────────────
console.log('\nloadDailyStreak / saveDailyStreak');

{
  localStorage.clear();
  const d = loadDailyStreak();
  assert('loadDailyStreak: default lastDate is empty string', d.lastDate === '');
  assert('loadDailyStreak: default streak is 0', d.streak === 0);
  assert('loadDailyStreak: default todayCount is 0', d.todayCount === 0);
}

console.log('\nupdateDailyStreak');

{
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = (() => {
    const d = new Date(); d.setDate(d.getDate() - 1); return d.toISOString().slice(0, 10);
  })();

  // First call — no prior data
  localStorage.clear();
  const first = updateDailyStreak();
  assert('updateDailyStreak: first call sets streak to 1', first.streak === 1);
  assert('updateDailyStreak: first call sets todayCount to 1', first.todayCount === 1);
  assert('updateDailyStreak: first call sets lastDate to today', first.lastDate === today);

  // Same day — todayCount increments, streak unchanged
  const second = updateDailyStreak();
  assert('updateDailyStreak: same day increments todayCount', second.todayCount === 2);
  assert('updateDailyStreak: same day keeps streak', second.streak === 1);

  // Yesterday — streak increments
  localStorage.clear();
  saveDailyStreak({ lastDate: yesterday, streak: 3, todayCount: 4 });
  const fromYesterday = updateDailyStreak();
  assert('updateDailyStreak: yesterday increments streak', fromYesterday.streak === 4);
  assert('updateDailyStreak: yesterday resets todayCount to 1', fromYesterday.todayCount === 1);

  // Old date — streak resets
  localStorage.clear();
  saveDailyStreak({ lastDate: '2020-01-01', streak: 10, todayCount: 2 });
  const fromOld = updateDailyStreak();
  assert('updateDailyStreak: old date resets streak to 1', fromOld.streak === 1);
  assert('updateDailyStreak: old date resets todayCount to 1', fromOld.todayCount === 1);
}

// ── Summary ────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(40)}`);
console.log(`  ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
