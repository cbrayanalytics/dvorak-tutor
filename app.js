'use strict';

// ── Constants ─────────────────────────────────────────────────
const ROUND_WORD_COUNT  = 8;
const ADVANCE_THRESHOLD = 90; // minimum accuracy % to unlock next level

// ── State ─────────────────────────────────────────────────────
let currentLevel   = 1;
let phrase         = '';
let cursor         = 0;
let correctCount   = 0;
let totalTyped     = 0;
let roundStartTime = null; // Date.now() on first keypress of the round

// ── Pure helpers (no DOM — exported for tests) ─────────────────

function calcWpm(charsTyped, elapsedMs) {
  if (elapsedMs <= 0 || charsTyped <= 0) return 0;
  return Math.round((charsTyped / 5) / (elapsedMs / 60000));
}

function calcAccuracy(correct, total) {
  if (total === 0) return 0;
  return Math.round((correct / total) * 100);
}

// Determines data-state for a key given the active level.
// 'i' and 'd' are shown as home-preview at level 1 so the user can
// see where their index fingers will extend to.
function getKeyState(keyLevel, activeLevel, char) {
  if (keyLevel <= activeLevel) return 'active';
  if (activeLevel === 1 && keyLevel === 2 && (char === 'i' || char === 'd')) {
    return 'home-preview';
  }
  return 'locked';
}

function buildPhrase(level, wordCount) {
  // getRoundWords is defined in words.js (loaded before app.js)
  return getRoundWords(level, wordCount).join(' ');
}

// ── DOM shortcuts ──────────────────────────────────────────────
function $(id)  { return document.getElementById(id); }

// ── Keyboard ───────────────────────────────────────────────────

// Builds char → { finger, level } from the keyboard markup.
// Called once at init; result stored in CHAR_TO_KEY.
function buildCharMap() {
  const map = {};
  document.querySelectorAll('.key[data-char]').forEach(el => {
    map[el.dataset.char] = {
      finger: el.dataset.finger,
      level:  Number(el.dataset.level),
    };
  });
  return map;
}

let CHAR_TO_KEY = {};

function renderKeyboard(level) {
  document.querySelectorAll('.key[data-char]').forEach(el => {
    el.dataset.state = getKeyState(
      Number(el.dataset.level),
      level,
      el.dataset.char
    );
  });
}

function highlightNextKey(char) {
  // Restore previous "next" key to its normal active/locked state
  const prev = document.querySelector('.key[data-state="next"]');
  if (prev) {
    prev.dataset.state = getKeyState(
      Number(prev.dataset.level), currentLevel, prev.dataset.char
    );
  }
  const key = document.querySelector(`.key[data-char="${CSS.escape(char)}"]`);
  if (key) key.dataset.state = 'next';
}

function clearNextKey() {
  const key = document.querySelector('.key[data-state="next"]');
  if (!key) return;
  key.dataset.state = getKeyState(
    Number(key.dataset.level), currentLevel, key.dataset.char
  );
}

function flashKey(char, type) {
  const key = document.querySelector(`.key[data-char="${CSS.escape(char)}"]`);
  if (!key) return;
  const cls = type === 'ok' ? 'flash-ok' : 'flash-err';
  key.classList.remove('flash-ok', 'flash-err');
  void key.offsetWidth; // force reflow so animation restarts
  key.classList.add(cls);
  key.addEventListener('animationend', () => key.classList.remove(cls), { once: true });
}

// ── Text display ───────────────────────────────────────────────

function renderPhrase(text) {
  const display = $('text-display');
  display.innerHTML = '';
  [...text].forEach((ch, i) => {
    const span  = document.createElement('span');
    const info  = CHAR_TO_KEY[ch] || {};
    if (ch === ' ') {
      span.className   = 'char char-space pending';
      span.textContent = ' ';
    } else {
      span.className   = 'char pending';
      span.textContent = ch;
    }
    if (info.finger) span.dataset.finger = info.finger;
    if (i === 0) span.classList.add('cursor');
    display.appendChild(span);
  });
}

// ── Stats & level map ──────────────────────────────────────────

function updateStats() {
  const elapsed = roundStartTime ? Date.now() - roundStartTime : 0;
  const wpm     = calcWpm(cursor, elapsed);
  const acc     = calcAccuracy(correctCount, totalTyped);

  $('stat-wpm').textContent   = roundStartTime ? wpm : 0;
  $('stat-acc').textContent   = totalTyped > 0 ? acc + '%' : '—';
  $('stat-level').textContent = currentLevel;

  // Progress bar fills toward ADVANCE_THRESHOLD accuracy
  const pct = totalTyped > 0
    ? Math.min(100, Math.round((acc / ADVANCE_THRESHOLD) * 100))
    : 0;
  $('progress-bar').style.width = pct + '%';
}

function updateLevelMap(level) {
  document.querySelectorAll('#level-map .level-pip[data-level]').forEach(pip => {
    const l = Number(pip.dataset.level);
    pip.classList.remove('done', 'current');
    if (l < level)  pip.classList.add('done');
    if (l === level) pip.classList.add('current');
  });
}

// ── Round lifecycle ────────────────────────────────────────────

function startRound() {
  phrase         = buildPhrase(currentLevel, ROUND_WORD_COUNT);
  cursor         = 0;
  correctCount   = 0;
  totalTyped     = 0;
  roundStartTime = null;

  renderPhrase(phrase);
  highlightNextKey(phrase[0]);
  updateStats();

  $('banner').textContent = '';
  $('banner').className   = '';
  $('advance-btn').classList.remove('visible');
}

function endRound() {
  const acc    = calcAccuracy(correctCount, totalTyped);
  const banner = $('banner');

  clearNextKey();

  if (acc >= ADVANCE_THRESHOLD) {
    if (currentLevel < 5) {
      banner.textContent = `Round complete! ${acc}% accuracy — great work.`;
      banner.className   = 'success';
      const btn          = $('advance-btn');
      btn.textContent    = `Advance to Level ${currentLevel + 1} →`;
      btn.classList.add('visible');
    } else {
      banner.textContent = `${acc}% accuracy — you\'ve mastered all 5 levels!`;
      banner.className   = 'success';
    }
  } else {
    banner.textContent = `${acc}% — keep going! Need ${ADVANCE_THRESHOLD}% to advance.`;
    banner.className   = 'fail';
    setTimeout(startRound, 1800);
  }
}

function advanceLevel() {
  if (currentLevel >= 5) return;
  currentLevel++;
  renderKeyboard(currentLevel);
  updateLevelMap(currentLevel);
  startRound();
}

// ── Input handler ──────────────────────────────────────────────

function handleKeydown(e) {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (cursor >= phrase.length) return;

  const typed = e.key;
  if (typed.length !== 1) return; // ignore Shift, Enter, Tab, ArrowLeft, etc.

  e.preventDefault();

  if (!roundStartTime) roundStartTime = Date.now();

  const expected = phrase[cursor];
  const chars    = $('text-display').querySelectorAll('.char');
  const current  = chars[cursor];

  totalTyped++;

  if (typed === expected) {
    current.classList.replace('pending', 'correct');
    correctCount++;
    flashKey(expected, 'ok');
  } else {
    current.classList.replace('pending', 'error');
    flashKey(expected, 'err');
  }

  current.classList.remove('cursor');
  cursor++;

  if (cursor < phrase.length) {
    chars[cursor].classList.add('cursor');
    highlightNextKey(phrase[cursor]);
  } else {
    endRound();
  }

  updateStats();
}

// ── Init ───────────────────────────────────────────────────────

function init() {
  CHAR_TO_KEY = buildCharMap();
  renderKeyboard(currentLevel);
  updateLevelMap(currentLevel);
  startRound();
  document.addEventListener('keydown', handleKeydown);
  $('advance-btn').addEventListener('click', advanceLevel);
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', init);
}

// ── Exports (Node test environment only) ──────────────────────
if (typeof module !== 'undefined') {
  module.exports = {
    calcWpm,
    calcAccuracy,
    getKeyState,
    buildPhrase,
    ADVANCE_THRESHOLD,
    ROUND_WORD_COUNT,
  };
}
