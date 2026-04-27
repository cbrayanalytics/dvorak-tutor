'use strict';

// ── Settings ───────────────────────────────────────────────────
const SETTINGS_KEY      = 'dvorak-tutor-settings';
const SETTINGS_DEFAULTS = { wordCount: 100, threshold: 90, timerOn: false, timerMins: 15, level: 1 };

let settings = { ...SETTINGS_DEFAULTS };

function loadSettings() {
  // Mutate in-place so exported references (tests, getters) stay valid.
  Object.assign(settings, SETTINGS_DEFAULTS);
  try {
    const stored = JSON.parse(localStorage.getItem(SETTINGS_KEY));
    if (stored && typeof stored === 'object') Object.assign(settings, stored);
  } catch (_) { /* malformed JSON: keep defaults */ }
  settings.level = Math.max(1, Math.min(5, settings.level));
}

function saveSettings(overrides) {
  if (overrides) Object.assign(settings, overrides);
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

// ── Personal bests ─────────────────────────────────────────────
const BESTS_KEY = 'dvorak-tutor-bests';

function loadBests() {
  try {
    const stored = JSON.parse(localStorage.getItem(BESTS_KEY));
    if (stored && typeof stored === 'object') return stored;
  } catch (_) {}
  return {};
}

function saveBest(level, wpm, acc) {
  const bests = loadBests();
  if (!bests[level] || wpm > bests[level].wpm) {
    bests[level] = { wpm, acc };
    localStorage.setItem(BESTS_KEY, JSON.stringify(bests));
    return true;
  }
  return false;
}

function getBest(level) {
  return loadBests()[level] || null;
}

// Timer suggestion: 1.5× buffer over actual pace; capped 1–60 min.
// At 10 WPM + 100 words → 15 min (matches beginner expectation).
function suggestTimerMins(wordCount, wpm) {
  const safeWpm = Math.max(wpm, 1);
  return Math.max(1, Math.min(60, Math.ceil((wordCount / safeWpm) * 1.5)));
}

// ── State ─────────────────────────────────────────────────────
let currentLevel   = 1;
let phrase         = '';
let cursor         = 0;
let correctCount   = 0;
let totalTyped     = 0;
let roundStartTime = null;
let lastWpm        = 10;  // seed with 10 WPM (beginner) for first timer suggestion
let timerInterval  = null;
let timerRemaining = 0;

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
  return getRoundWords(level, wordCount).join(' ');
}

// ── DOM shortcuts ──────────────────────────────────────────────
function $(id) { return document.getElementById(id); }

// ── Keyboard ───────────────────────────────────────────────────

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
      Number(el.dataset.level), level, el.dataset.char
    );
  });
}

function highlightNextKey(char) {
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
  void key.offsetWidth;
  key.classList.add(cls);
  key.addEventListener('animationend', () => key.classList.remove(cls), { once: true });
}

// ── Text display ───────────────────────────────────────────────

function renderPhrase(text) {
  const display = $('text-display');
  display.innerHTML = '';
  display.scrollTop = 0;
  [...text].forEach((ch, i) => {
    const span = document.createElement('span');
    const info = CHAR_TO_KEY[ch] || {};
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

// ── Timer ──────────────────────────────────────────────────────

function formatTimer(secs) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return m > 0 ? `${m}m${String(s).padStart(2, '0')}s` : `${s}s`;
}

function clearTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
}

function startTimer() {
  clearTimer();
  timerRemaining = settings.timerMins * 60;
  $('stat-timer').textContent = formatTimer(timerRemaining);
  timerInterval = setInterval(() => {
    timerRemaining--;
    $('stat-timer').textContent = formatTimer(timerRemaining);
    if (timerRemaining <= 0) {
      clearTimer();
      endRound();
    }
  }, 1000);
}

function updateTimerVisibility() {
  const on = settings.timerOn;
  $('timer-divider').hidden   = !on;
  $('stat-timer-wrap').hidden = !on;
  if (!on) $('stat-timer').textContent = '—';
}

// ── Stats & level map ──────────────────────────────────────────

function updateStats() {
  const elapsed = roundStartTime ? Date.now() - roundStartTime : 0;
  const wpm     = calcWpm(cursor, elapsed);
  const acc     = calcAccuracy(correctCount, totalTyped);

  $('stat-wpm').textContent   = roundStartTime ? wpm : 0;
  $('stat-acc').textContent   = totalTyped > 0 ? acc + '%' : '—';
  $('stat-level').textContent = currentLevel;

  const best = getBest(currentLevel);
  $('stat-best').textContent  = best ? best.wpm + ' WPM' : '—';

  const pct = totalTyped > 0
    ? Math.min(100, Math.round((acc / settings.threshold) * 100))
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

// ── Settings panel UI ─────────────────────────────────────────

function applySettingsToDisplay() {
  $('val-words').textContent     = settings.wordCount;
  $('val-threshold').textContent = settings.threshold + '%';
  $('val-timer').textContent     = settings.timerMins + 'm';
  const toggle = $('timer-toggle');
  toggle.textContent = settings.timerOn ? 'ON' : 'OFF';
  toggle.setAttribute('aria-pressed', String(settings.timerOn));
  $('timer-stepper').hidden = !settings.timerOn;
  updateTimerVisibility();
}

function openSettingsPanel() {
  const panel = $('settings-panel');
  panel.hidden = false;
  void panel.offsetHeight;                   // layout with natural CSS before measuring
  const naturalHeight = panel.scrollHeight;  // measure BEFORE zeroing padding
  panel.style.maxHeight     = '0';
  panel.style.paddingTop    = '0';
  panel.style.paddingBottom = '0';
  panel.style.opacity       = '0';
  void panel.offsetHeight;                   // force reflow so transition sees start state
  panel.style.maxHeight     = naturalHeight + 'px';
  panel.style.paddingTop    = '';
  panel.style.paddingBottom = '';
  panel.style.opacity       = '1';
  $('settings-btn').setAttribute('aria-expanded', 'true');
}

function closeSettingsPanel() {
  const panel = $('settings-panel');
  panel.style.maxHeight  = panel.scrollHeight + 'px';
  panel.style.opacity    = '1';
  void panel.offsetHeight;
  panel.style.maxHeight  = '0';
  panel.style.paddingTop = '0';
  panel.style.paddingBottom = '0';
  panel.style.opacity    = '0';
  setTimeout(() => {
    panel.hidden = true;
    panel.style.cssText = '';  // clear all inline styles
  }, 300);
  $('settings-btn').setAttribute('aria-expanded', 'false');
}

function toggleSettingsPanel() {
  $('settings-panel').hidden ? openSettingsPanel() : closeSettingsPanel();
}

// ── Settings change handlers ───────────────────────────────────

function showInfoBanner(msg) {
  const banner = $('banner');
  banner.textContent = msg;
  banner.className   = 'info';
}

function changeWordCount(delta) {
  settings.wordCount = Math.max(10, Math.min(500, settings.wordCount + delta));
  settings.timerMins = suggestTimerMins(settings.wordCount, lastWpm);
  $('val-words').textContent = settings.wordCount;
  $('val-timer').textContent = settings.timerMins + 'm';
  saveSettings();
  showInfoBanner('Word count changed — starting new round');
  setTimeout(startRound, 900);
}

function changeThreshold(delta) {
  settings.threshold = Math.max(50, Math.min(100, settings.threshold + delta));
  $('val-threshold').textContent = settings.threshold + '%';
  saveSettings();
  updateStats();
  showInfoBanner('Advance threshold updated');
}

function changeTimerMins(delta) {
  settings.timerMins = Math.max(1, Math.min(60, settings.timerMins + delta));
  $('val-timer').textContent = settings.timerMins + 'm';
  saveSettings();
  if (settings.timerOn) startTimer();
}

function toggleTimer() {
  settings.timerOn = !settings.timerOn;
  const toggle = $('timer-toggle');
  toggle.textContent = settings.timerOn ? 'ON' : 'OFF';
  toggle.setAttribute('aria-pressed', String(settings.timerOn));
  $('timer-stepper').hidden = !settings.timerOn;
  updateTimerVisibility();
  saveSettings();
  if (settings.timerOn) {
    startTimer();
  } else {
    clearTimer();
  }
}

// ── Round lifecycle ────────────────────────────────────────────

function startRound() {
  clearTimer();
  phrase         = buildPhrase(currentLevel, settings.wordCount);
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

  if (settings.timerOn) startTimer();
}

function endRound() {
  clearTimer();
  clearNextKey();

  // Capture WPM before resetting; update timer suggestion for next round
  if (roundStartTime) {
    const wpm = calcWpm(cursor, Date.now() - roundStartTime);
    if (wpm > 0) {
      lastWpm = wpm;
      const suggested = suggestTimerMins(settings.wordCount, lastWpm);
      if (suggested !== settings.timerMins) {
        settings.timerMins = suggested;
        $('val-timer').textContent = settings.timerMins + 'm';
        saveSettings();
      }
    }
  }

  const acc      = calcAccuracy(correctCount, totalTyped);
  const wpmFinal = roundStartTime ? calcWpm(cursor, Date.now() - roundStartTime) : 0;
  const isNewBest = totalTyped > 0 && saveBest(currentLevel, wpmFinal, acc);
  updateStats();

  const banner = $('banner');

  if (acc >= settings.threshold) {
    if (currentLevel < 5) {
      banner.textContent = isNewBest
        ? `New best! ${wpmFinal} WPM · ${acc}% accuracy — great work.`
        : `Round complete! ${acc}% accuracy — great work.`;
      banner.className   = 'success';
      const btn          = $('advance-btn');
      btn.textContent    = `Advance to Level ${currentLevel + 1} →`;
      btn.classList.add('visible');
    } else {
      banner.textContent = isNewBest
        ? `New best! ${wpmFinal} WPM · ${acc}% — you've mastered all 5 levels!`
        : `${acc}% accuracy — you've mastered all 5 levels!`;
      banner.className   = 'success';
    }
  } else {
    banner.textContent = `${acc}% — keep going! Need ${settings.threshold}% to advance.`;
    banner.className   = 'fail';
    setTimeout(startRound, 1800);
  }
}

function advanceLevel() {
  if (currentLevel >= 5) return;
  currentLevel++;
  saveSettings({ level: currentLevel });
  renderKeyboard(currentLevel);
  updateLevelMap(currentLevel);
  startRound();
}

// ── Input handler ──────────────────────────────────────────────

function handleKeydown(e) {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (cursor >= phrase.length) return;

  const typed = e.key;
  if (typed.length !== 1) return;

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
    chars[cursor].scrollIntoView({ behavior: 'instant', block: 'nearest' });
    highlightNextKey(phrase[cursor]);
  } else {
    endRound();
  }

  updateStats();
}

// ── Init ───────────────────────────────────────────────────────

function init() {
  loadSettings();
  currentLevel = settings.level;

  CHAR_TO_KEY = buildCharMap();
  renderKeyboard(currentLevel);
  updateLevelMap(currentLevel);
  applySettingsToDisplay();
  startRound();

  document.addEventListener('keydown', handleKeydown);
  $('advance-btn').addEventListener('click', advanceLevel);
  $('settings-btn').addEventListener('click', toggleSettingsPanel);
  $('words-dec').addEventListener('click',     () => changeWordCount(-10));
  $('words-inc').addEventListener('click',     () => changeWordCount(10));
  $('threshold-dec').addEventListener('click', () => changeThreshold(-5));
  $('threshold-inc').addEventListener('click', () => changeThreshold(5));
  $('timer-dec').addEventListener('click',     () => changeTimerMins(-1));
  $('timer-inc').addEventListener('click',     () => changeTimerMins(1));
  $('timer-toggle').addEventListener('click',  toggleTimer);
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
    suggestTimerMins,
    loadSettings,
    saveSettings,
    settings,
    loadBests,
    saveBest,
    getBest,
    get ADVANCE_THRESHOLD() { return settings.threshold; },
    get ROUND_WORD_COUNT()  { return settings.wordCount;  },
  };
}
