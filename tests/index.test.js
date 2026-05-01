'use strict';

const fs = require('fs');
const html = fs.readFileSync(__dirname + '/../index.html', 'utf8');

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

function hasId(id)       { return html.includes(`id="${id}"`); }
function hasAttr(a, v)   { return html.includes(`${a}="${v}"`); }
function countAttr(a, v) { return (html.match(new RegExp(`${a}="${v}"`, 'g')) || []).length; }

// ── Required elements ──────────────────────────────────────────
console.log('\nRequired element IDs');
[
  'app','level-map','stats','stat-wpm','stat-acc','stat-level','stat-best',
  'progress-bar','text-display','banner','advance-btn','restart-btn','drill-btn',
  'round-actions','keyboard','stat-streak','stat-trend',
].forEach(id => assert(`#${id} exists`, hasId(id)));

// ── Script tags ────────────────────────────────────────────────
console.log('\nScript references');
assert('loads words.js',  html.includes('src="words.js"'));
assert('loads app.js',    html.includes('src="app.js"'));
assert('loads styles.css',html.includes('href="styles.css"'));

// ── Keyboard keys ──────────────────────────────────────────────
console.log('\nKeyboard — all Dvorak letters present');
const letters = 'abcdefghijklmnopqrstuvwxyz'.split('');
letters.forEach(ch => {
  assert(`data-char="${ch}" present`, hasAttr('data-char', ch));
});

console.log('\nKeyboard — selected punctuation / number keys');
["'", ',', '.', '/', '-', ';', ' '].forEach(ch => {
  assert(`data-char="${ch}" present`, hasAttr('data-char', ch));
});
for (let d = 0; d <= 9; d++) {
  assert(`data-char="${d}" present`, hasAttr('data-char', String(d)));
}

// ── data-level assignments ─────────────────────────────────────
console.log('\ndata-level — level 1 home-row letters (a o e u h t n s)');
const level1Letters = ['a','o','e','u','h','t','n','s'];
level1Letters.forEach(ch => {
  const regex = new RegExp(`data-char="${ch}"[^>]*data-level="1"|data-level="1"[^>]*data-char="${ch}"`);
  assert(`"${ch}" has data-level="1"`, regex.test(html));
});

console.log('\ndata-level — level 2 inner index keys (i d)');
['i','d'].forEach(ch => {
  const regex = new RegExp(`data-char="${ch}"[^>]*data-level="2"|data-level="2"[^>]*data-char="${ch}"`);
  assert(`"${ch}" has data-level="2"`, regex.test(html));
});

console.log('\ndata-level — level 3 upper-row letters (p y f g c r l)');
['p','y','f','g','c','r','l'].forEach(ch => {
  const regex = new RegExp(`data-char="${ch}"[^>]*data-level="3"|data-level="3"[^>]*data-char="${ch}"`);
  assert(`"${ch}" has data-level="3"`, regex.test(html));
});

console.log('\ndata-level — level 4 bottom-row letters (q j k x b m w v z)');
['q','j','k','x','b','m','w','v','z'].forEach(ch => {
  const regex = new RegExp(`data-char="${ch}"[^>]*data-level="4"|data-level="4"[^>]*data-char="${ch}"`);
  assert(`"${ch}" has data-level="4"`, regex.test(html));
});

// ── data-finger values are valid ───────────────────────────────
console.log('\ndata-finger — only valid values used');
const validFingers = new Set([
  'pinky-left','ring-left','middle-left','index-left',
  'pinky-right','ring-right','middle-right','index-right',
  'thumb',
]);
const fingerMatches = html.match(/data-finger="([^"]+)"/g) || [];
const invalidFingers = fingerMatches
  .map(m => m.replace(/data-finger="([^"]+)"/, '$1'))
  .filter(f => !validFingers.has(f));

assert('all data-finger values are valid', invalidFingers.length === 0,
  invalidFingers.length ? `invalid: ${[...new Set(invalidFingers)].join(', ')}` : '');

assert('space key uses data-finger="thumb"',
  html.includes('data-finger="thumb"'));

// ── Row classes ────────────────────────────────────────────────
console.log('\nRow classes');
['row-number','row-upper','row-home','row-bottom','row-space'].forEach(cls => {
  assert(`class="${cls}" present`, html.includes(cls));
});

// ── Level map pips ─────────────────────────────────────────────
console.log('\nLevel map');
assert('5 level pip data-level attrs', countAttr('data-level', '1') >= 1 &&
  [1,2,3,4,5].every(l => html.includes(`data-level="${l}"`)));
assert('level-pip-connector elements present',
  (html.match(/level-pip-connector/g) || []).length >= 4);
assert('level pip data-label attrs present',
  ['Novice','Learner','Builder','Adept','Master'].every(n => html.includes(`data-label="${n}"`)));
assert('pip-label and pip-icon spans present',
  html.includes('pip-label') && html.includes('pip-icon'));

// ── Accessibility ──────────────────────────────────────────────
console.log('\nAccessibility');
assert('keyboard has aria-hidden="true"', html.includes('aria-hidden="true"'));
assert('text-display has aria-label',     html.includes('aria-label="Practice text"'));
assert('advance-btn has type="button"',   html.includes('type="button"'));

// ── Settings panel ────────────────────────────────────────────
console.log('\nSettings panel — required IDs');
[
  'settings-btn','settings-panel','settings-close',
  'words-dec','val-words','words-inc',
  'threshold-dec','val-threshold','threshold-inc',
  'timer-toggle','timer-stepper','timer-dec','val-timer','timer-inc',
  'timer-divider','stat-timer-wrap','stat-timer',
  'audio-toggle','mode-toggle',
].forEach(id => assert(`#${id} exists`, hasId(id)));

console.log('\nSettings panel — audio/mode toggle accessibility');
assert('audio-toggle has aria-pressed',  html.includes('id="audio-toggle"') && html.includes('aria-pressed="true"'));
assert('audio-toggle has aria-label',    html.includes('aria-label="Toggle sound"'));
assert('mode-toggle has aria-label',     html.includes('aria-label="Toggle practice mode"'));

console.log('\nSettings panel — default values');
assert('val-words default is 100',     html.includes('>100<'));
assert('val-threshold default is 90%', html.includes('>90%<'));
assert('val-timer default is 60s',     html.includes('>60s<'));

console.log('\nSettings panel — accessibility');
assert('settings-btn has aria-expanded',    html.includes('aria-expanded="false"'));
assert('settings-btn has aria-controls',    html.includes('aria-controls="settings-panel"'));
assert('timer-toggle has aria-pressed',     html.includes('aria-pressed="false"'));
assert('settings-btn has aria-label',       html.includes('aria-label="Settings"'));
assert('timer-toggle has aria-label',       html.includes('aria-label="Toggle time limit"'));

// ── Summary card ──────────────────────────────────────────────
console.log('\nSummary card — required IDs');
['summary-card','sum-wpm','sum-acc','sum-time','sum-stars','sum-sparkline','sum-sparkline-wrap','sum-trend']
  .forEach(id => assert(`#${id} exists`, hasId(id)));

// ── History panel ─────────────────────────────────────────────
console.log('\nHistory panel — required IDs');
['history-panel','history-header','history-title','history-close','history-chart','history-table','history-tbody']
  .forEach(id => assert(`#${id} exists`, hasId(id)));
assert('history-close has aria-label', html.includes('aria-label="Close history"'));

// ── Summary ────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(40)}`);
console.log(`  ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
