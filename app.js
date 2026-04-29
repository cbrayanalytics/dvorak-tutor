'use strict';

// ── Settings ───────────────────────────────────────────────────
const SETTINGS_KEY      = 'dvorak-tutor-settings';
const SETTINGS_DEFAULTS = { wordCount: 100, threshold: 90, timerOn: false, timerMins: 15, level: 1, audioOn: true, mode: 'words' };

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

// ── Round history ─────────────────────────────────────────────
const HISTORY_KEY    = 'dvorak-tutor-history';
const HISTORY_LIMIT  = 20;

function loadHistory(level) {
  try {
    const stored = JSON.parse(localStorage.getItem(HISTORY_KEY));
    if (stored && typeof stored === 'object') return stored[level] || [];
  } catch (_) {}
  return [];
}

function appendHistory(level, entry) {
  let all = {};
  try {
    const stored = JSON.parse(localStorage.getItem(HISTORY_KEY));
    if (stored && typeof stored === 'object') all = stored;
  } catch (_) {}
  const entries = (all[level] || []).concat(entry);
  all[level] = entries.slice(-HISTORY_LIMIT);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(all));
}

// Returns 'up', 'down', or 'flat' based on whether the recent half of history
// has a higher average WPM than the earlier half. Returns null with < 2 entries.
function calcTrend(history) {
  if (!history || history.length < 2) return null;
  const mid   = Math.floor(history.length / 2);
  const avg   = arr => arr.reduce((s, e) => s + e.wpm, 0) / arr.length;
  const early = avg(history.slice(0, mid));
  const late  = avg(history.slice(mid));
  const delta = late - early;
  if (delta > 2)  return 'up';
  if (delta < -2) return 'down';
  return 'flat';
}

// Returns an SVG element plotting wpmValues as a polyline sparkline.
// Returns a plain object stub in non-browser environments (tests).
function renderSparkline(wpmValues) {
  const W = 120, H = 32, PAD = 3;
  const ns  = 'http://www.w3.org/2000/svg';
  if (typeof document === 'undefined') {
    return { tagName: 'svg', getAttribute: () => '0 0 120 32' };
  }
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.setAttribute('width',  W);
  svg.setAttribute('height', H);
  svg.setAttribute('aria-hidden', 'true');

  if (!wpmValues || wpmValues.length === 0) return svg;

  const vals = wpmValues;
  const min  = Math.min(...vals);
  const max  = Math.max(...vals);
  const range = max - min || 1;

  const points = vals.map((v, i) => {
    const x = PAD + (i / Math.max(vals.length - 1, 1)) * (W - PAD * 2);
    const y = H - PAD - ((v - min) / range) * (H - PAD * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

  const line = document.createElementNS(ns, 'polyline');
  line.setAttribute('points', points);
  line.setAttribute('fill',         'none');
  line.setAttribute('stroke',       'currentColor');
  line.setAttribute('stroke-width', '1.5');
  line.setAttribute('stroke-linecap', 'round');
  line.setAttribute('stroke-linejoin', 'round');
  svg.appendChild(line);
  return svg;
}

// ── Weak key history ───────────────────────────────────────────
const WEAK_KEYS_KEY   = 'dvorak-tutor-weak-keys';
const DECAY_FACTOR    = 0.85;

function loadWeakKeys(level) {
  try {
    const stored = JSON.parse(localStorage.getItem(WEAK_KEYS_KEY));
    if (stored && typeof stored === 'object') return stored[level] || {};
  } catch (_) {}
  return {};
}

function saveWeakKeys(level, keys) {
  let all = {};
  try {
    const stored = JSON.parse(localStorage.getItem(WEAK_KEYS_KEY));
    if (stored && typeof stored === 'object') all = stored;
  } catch (_) {}
  all[level] = keys;
  localStorage.setItem(WEAK_KEYS_KEY, JSON.stringify(all));
}

// Decays stored counts by DECAY_FACTOR then merges in this round's errors.
// Chars that decay to 0 are pruned so the object stays lean.
function mergeWeakKeys(stored, round) {
  const s = (stored && typeof stored === 'object') ? stored : {};
  const r = (round  && typeof round  === 'object') ? round  : {};
  const result = {};
  const chars = new Set([...Object.keys(s), ...Object.keys(r)]);
  for (const ch of chars) {
    const val = Math.floor((s[ch] || 0) * DECAY_FACTOR) + (r[ch] || 0);
    if (val > 0) result[ch] = val;
  }
  return result;
}

// ── Error heatmap ──────────────────────────────────────────────

const HEAT_ERROR_MAX   = 3;
const CONFETTI_COLORS  = ['#a855f7', '#60a5fa', '#4ade80', '#fb923c', '#94a3b8'];

function calcHeatIntensity(errorCount) {
  return Math.min(errorCount / HEAT_ERROR_MAX, 1);
}

function showHeatmap() {
  document.querySelectorAll('.key[data-char]').forEach(el => {
    const count   = errorMap[el.dataset.char] || 0;
    const opacity = (calcHeatIntensity(count) * 0.7).toFixed(3);
    el.style.setProperty('--err-opacity', opacity);
  });
}

function clearHeatmap() {
  document.querySelectorAll('.key[data-char]').forEach(el => {
    el.style.removeProperty('--err-opacity');
  });
}

// ── Audio ──────────────────────────────────────────────────────

let _audioCtx = null;

function getAudioCtx() {
  const Ctor = typeof AudioContext !== 'undefined' ? AudioContext
             : typeof webkitAudioContext !== 'undefined' ? webkitAudioContext
             : null;
  if (!Ctor) return null;
  if (!_audioCtx) _audioCtx = new Ctor();
  return _audioCtx;
}

function playTone(freq, type, duration, peak) {
  if (!settings.audioOn) return;
  const ctx = getAudioCtx();
  if (!ctx) return;
  const osc  = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.frequency.value = freq;
  osc.type            = type;
  gain.gain.setValueAtTime(peak, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
}

function playClick()   { playTone(700, 'sine',   0.04, 0.08); }
function playError()   { playTone(180, 'square', 0.12, 0.15); }
function playLevelUp() {
  [523, 659, 784].forEach((freq, i) => {
    setTimeout(() => playTone(freq, 'sine', 0.25, 0.15), i * 130);
  });
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
let errorMap       = {}; // char → error count for current round
let charEls        = []; // cached .char NodeList for current round
let currentBest    = null; // best for currentLevel, refreshed each round
let streak         = 0;   // consecutive rounds at or above threshold
let drillMode      = false;

// ── Pure helpers (no DOM — exported for tests) ─────────────────

function calcProgressPct(cursor, phraseLength, acc, threshold) {
  if (cursor <= 0 || phraseLength <= 0) return 0;
  return Math.min(100, Math.round((cursor / phraseLength) * (acc / threshold) * 100));
}

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

function setStatColor(el, cls) {
  el.classList.remove('stat-good', 'stat-warn', 'stat-bad');
  if (cls) el.classList.add(cls);
}

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

const FINGER_LABELS = {
  'pinky-left':   'Left Pinky',
  'ring-left':    'Left Ring',
  'middle-left':  'Left Middle',
  'index-left':   'Left Index',
  'index-right':  'Right Index',
  'middle-right': 'Right Middle',
  'ring-right':   'Right Ring',
  'pinky-right':  'Right Pinky',
  'thumb':        'Thumb',
};

function updateFingerIndicator(char) {
  const info = char ? CHAR_TO_KEY[char] : null;
  const dot  = $('finger-dot');
  const lbl  = $('finger-label');
  if (info && info.finger) {
    dot.dataset.finger  = info.finger;
    lbl.textContent     = FINGER_LABELS[info.finger] || info.finger;
    $('finger-indicator').classList.add('active');
  } else {
    dot.dataset.finger  = '';
    lbl.textContent     = '—';
    $('finger-indicator').classList.remove('active');
  }
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
  updateFingerIndicator(char);
}

function clearNextKey() {
  const key = document.querySelector('.key[data-state="next"]');
  if (!key) return;
  key.dataset.state = getKeyState(
    Number(key.dataset.level), currentLevel, key.dataset.char
  );
  updateFingerIndicator(null);
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

function armTimer() {
  clearTimer();
  timerRemaining = settings.timerMins * 60;
  $('stat-timer').textContent = formatTimer(timerRemaining);
}

function startTimer() {
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

  const hasWpm = roundStartTime && cursor >= 5;
  $('stat-wpm').textContent   = hasWpm ? wpm : (roundStartTime ? '—' : 0);
  $('stat-acc').textContent   = totalTyped > 0 ? acc + '%' : '—';
  $('stat-level').textContent = currentLevel;

  setStatColor($('stat-wpm'), !hasWpm ? null
    : wpm >= 50 ? 'stat-good'
    : wpm >= 25 ? 'stat-warn'
    : null);

  setStatColor($('stat-acc'), totalTyped < 5 ? null
    : acc >= settings.threshold       ? 'stat-good'
    : acc >= settings.threshold - 20  ? 'stat-warn'
    : 'stat-bad');

  const bestEl = $('stat-best');
  bestEl.textContent = currentBest ? currentBest.wpm + ' WPM' : '—';
  setStatColor(bestEl, currentBest ? null : 'stat-empty');

  const streakEl = $('stat-streak');
  streakEl.textContent = streak;
  setStatColor(streakEl, streak >= 5 ? 'stat-good' : streak >= 3 ? 'stat-warn' : streak === 0 ? 'stat-empty' : null);

  const trendEl   = $('stat-trend');
  const trend     = calcTrend(loadHistory(currentLevel));
  trendEl.textContent = trend === 'up' ? '▲' : trend === 'down' ? '▼' : '—';
  setStatColor(trendEl, trend === 'up' ? 'stat-good' : trend === 'down' ? 'stat-bad' : 'stat-empty');

  const pct = calcProgressPct(cursor, phrase.length, acc, settings.threshold);
  $('progress-bar').style.width = pct + '%';
  $('progress-bar').classList.toggle('progress-complete', pct >= 100);
}

function updateLevelMap(level) {
  document.querySelectorAll('#level-map .level-pip[data-level]').forEach(pip => {
    const l      = Number(pip.dataset.level);
    const label  = pip.querySelector('.pip-label');
    pip.classList.remove('done', 'current', 'locked');
    if (l < level)  pip.classList.add('done');
    if (l === level) pip.classList.add('current');
    if (l > level)  pip.classList.add('locked');
    if (label) label.textContent = l > level ? '···' : pip.dataset.label;
  });
}

// ── Settings panel UI ─────────────────────────────────────────

function applySettingsToDisplay() {
  $('val-words').textContent     = settings.wordCount;
  $('val-threshold').textContent = settings.threshold + '%';
  $('val-timer').textContent     = settings.timerMins + 'm';
  const timerToggle = $('timer-toggle');
  timerToggle.textContent = settings.timerOn ? 'ON' : 'OFF';
  timerToggle.setAttribute('aria-pressed', String(settings.timerOn));
  $('timer-stepper').hidden = !settings.timerOn;
  updateTimerVisibility();
  const audioToggle = $('audio-toggle');
  audioToggle.textContent = settings.audioOn ? 'ON' : 'OFF';
  audioToggle.setAttribute('aria-pressed', String(settings.audioOn));
  const modeToggle = $('mode-toggle');
  modeToggle.textContent = settings.mode === 'quotes' ? 'Quotes' : 'Words';
  modeToggle.setAttribute('aria-pressed', String(settings.mode === 'quotes'));
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
  if (settings.timerOn) { armTimer(); if (roundStartTime) startTimer(); }
}

function toggleMode() {
  settings.mode = settings.mode === 'quotes' ? 'words' : 'quotes';
  const toggle = $('mode-toggle');
  toggle.textContent = settings.mode === 'quotes' ? 'Quotes' : 'Words';
  toggle.setAttribute('aria-pressed', String(settings.mode === 'quotes'));
  saveSettings();
  startRound();
}

function toggleAudio() {
  settings.audioOn = !settings.audioOn;
  const toggle = $('audio-toggle');
  toggle.textContent = settings.audioOn ? 'ON' : 'OFF';
  toggle.setAttribute('aria-pressed', String(settings.audioOn));
  saveSettings();
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
    armTimer();
    if (roundStartTime) startTimer();
  } else {
    clearTimer();
  }
}

// ── Round lifecycle ────────────────────────────────────────────

function _initRound() {
  clearTimer();
  cursor         = 0;
  correctCount   = 0;
  totalTyped     = 0;
  roundStartTime = null;
  errorMap       = {};
  currentBest    = getBest(currentLevel);
  renderPhrase(phrase);
  charEls = Array.from($('text-display').querySelectorAll('.char'));
  highlightNextKey(phrase[0]);
  updateStats();
  clearHeatmap();
  $('banner').textContent    = '';
  $('banner').className      = '';
  $('advance-btn').classList.remove('visible');
  $('restart-btn').classList.remove('visible');
  $('drill-btn').classList.remove('visible');
  $('summary-card').hidden   = true;
  if (settings.timerOn) armTimer();
}

function startDrillRound() {
  drillMode = true;
  phrase    = getWeightedWords(currentLevel, loadWeakKeys(currentLevel), settings.wordCount).join(' ');
  _initRound();
  $('banner').textContent = '🎯 Drilling weak keys';
  $('banner').className   = 'info';
}

function startRound() {
  drillMode = false;
  if (settings.mode === 'quotes') {
    const q = getRoundQuote(currentLevel);
    phrase = q || buildPhrase(currentLevel, settings.wordCount);
  } else {
    phrase = buildPhrase(currentLevel, settings.wordCount);
  }
  _initRound();
}

function showSummaryCard(wpm, acc, elapsedMs, isNewBest) {
  $('sum-wpm').textContent  = wpm;
  $('sum-acc').textContent  = acc + '%';
  $('sum-time').textContent = elapsedMs > 0 ? formatTimer(Math.round(elapsedMs / 1000)) : '—';

  const rating = acc >= 90 ? 3 : acc >= 80 ? 2 : acc >= 70 ? 1 : 0;
  document.querySelectorAll('#sum-stars .star').forEach((s, i) => {
    s.classList.toggle('star-filled', i < rating);
  });

  const history = loadHistory(currentLevel);
  const wrapEl  = $('sum-sparkline-wrap');
  const sparkEl = $('sum-sparkline');
  const trendEl = $('sum-trend');
  sparkEl.innerHTML = '';
  if (history.length >= 2) {
    sparkEl.appendChild(renderSparkline(history.map(e => e.wpm)));
    const trend = calcTrend(history);
    trendEl.textContent = trend === 'up' ? '▲ TREND' : trend === 'down' ? '▼ TREND' : '— TREND';
    trendEl.className   = 'sum-label trend-' + trend;
    wrapEl.classList.add('has-data');
  } else {
    trendEl.textContent = 'TREND';
    trendEl.className   = 'sum-label';
    wrapEl.classList.remove('has-data');
  }

  $('summary-card').hidden = false;
}

function showHistoryPanel() {
  const history = loadHistory(currentLevel);
  $('history-title').textContent = `Round History — Level ${currentLevel}`;

  const chartEl = $('history-chart');
  chartEl.innerHTML = '';
  if (history.length >= 2) {
    chartEl.appendChild(renderSparkline(history.map(e => e.wpm)));
  }

  const tbody = $('history-tbody');
  tbody.innerHTML = '';
  history.slice().reverse().forEach((e, i) => {
    const tr = document.createElement('tr');
    const date = new Date(e.ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    tr.innerHTML = `<td>${history.length - i}</td><td>${e.wpm}</td><td>${e.acc}%</td><td>${date}</td>`;
    tbody.appendChild(tr);
  });

  $('history-panel').hidden = false;
}

function closeHistoryPanel() {
  $('history-panel').hidden = true;
}

function endRound() {
  clearTimer();
  clearNextKey();

  const elapsedMs = roundStartTime ? Date.now() - roundStartTime : 0;
  const wpmFinal  = calcWpm(cursor, elapsedMs);
  const acc       = calcAccuracy(correctCount, totalTyped);

  if (wpmFinal > 0) {
    lastWpm = wpmFinal;
    const suggested = suggestTimerMins(settings.wordCount, lastWpm);
    if (suggested !== settings.timerMins) {
      settings.timerMins = suggested;
      $('val-timer').textContent = settings.timerMins + 'm';
      saveSettings();
    }
  }

  const isNewBest = totalTyped > 0 && saveBest(currentLevel, wpmFinal, acc);
  if (isNewBest) currentBest = getBest(currentLevel);

  if (totalTyped > 0) appendHistory(currentLevel, { wpm: wpmFinal, acc, ts: Date.now() });

  const updatedWeak = mergeWeakKeys(loadWeakKeys(currentLevel), errorMap);
  saveWeakKeys(currentLevel, updatedWeak);

  updateStats();
  showSummaryCard(wpmFinal, acc, elapsedMs, isNewBest);
  showHeatmap();
  $('restart-btn').classList.add('visible');
  updateDrillBtn(updatedWeak);

  const banner = $('banner');

  if (acc >= settings.threshold) {
    streak++;
    if (currentLevel < 5) {
      banner.textContent = isNewBest ? 'New personal best!' : 'Round complete!';
      banner.className   = 'success';
      const btn          = $('advance-btn');
      btn.textContent    = `Advance to Level ${currentLevel + 1} →`;
      btn.classList.add('visible');
    } else {
      banner.textContent = isNewBest ? 'New best — all 5 levels mastered!' : 'All 5 levels mastered!';
      banner.className   = 'success';
    }
  } else {
    streak = 0;
    banner.textContent = `Need ${settings.threshold}% to advance — keep going!`;
    banner.className   = 'fail';
    setTimeout(startRound, 3500);
  }
}

function spawnConfetti() {
  const colors = CONFETTI_COLORS;
  const cx = window.innerWidth  / 2;
  const cy = window.innerHeight * 0.4;

  for (let i = 0; i < 28; i++) {
    const el       = document.createElement('div');
    el.className   = 'confetti-particle';
    const size     = 6 + Math.random() * 8;
    const angle    = Math.random() * Math.PI * 2;
    const speed    = 60 + Math.random() * 180;
    const dx       = Math.cos(angle) * speed;
    const dy       = Math.sin(angle) * speed - 100;
    const duration = 900 + Math.random() * 500;
    const rot      = (Math.random() * 720 - 360).toFixed(0);

    el.style.cssText = `left:${cx}px;top:${cy}px;width:${size}px;height:${size}px;` +
      `background:${colors[i % colors.length]};` +
      `border-radius:${Math.random() > 0.5 ? '50%' : '2px'};`;
    el.style.setProperty('--dx',  dx.toFixed(1)  + 'px');
    el.style.setProperty('--dy',  dy.toFixed(1)  + 'px');
    el.style.setProperty('--rot', rot             + 'deg');
    el.style.setProperty('--dur', duration.toFixed(0) + 'ms');

    document.body.appendChild(el);
    el.addEventListener('animationend', () => el.remove(), { once: true });
  }
}

function updateDrillBtn(weak) {
  $('drill-btn').classList.toggle('visible', Object.keys(weak).length > 0);
}

function applyLevel(n) {
  currentLevel = n;
  saveSettings({ level: currentLevel });
  renderKeyboard(currentLevel);
  updateLevelMap(currentLevel);
  startRound();
}

function advanceLevel() {
  if (currentLevel >= 5) return;
  spawnConfetti();
  playLevelUp();
  applyLevel(currentLevel + 1);
}

// ── Input handler ──────────────────────────────────────────────

function handleKeydown(e) {
  if (e.ctrlKey || e.metaKey || e.altKey) return;

  if (e.key === 'Enter' && cursor >= phrase.length) {
    e.preventDefault();
    if ($('advance-btn').classList.contains('visible')) advanceLevel();
    else if ($('drill-btn').classList.contains('visible')) startDrillRound();
    else startRound();
    return;
  }

  if (cursor >= phrase.length) return;

  const typed = e.key;
  if (typed.length !== 1) return;

  e.preventDefault();

  if (!roundStartTime) {
    roundStartTime = Date.now();
    if (settings.timerOn) startTimer();
  }

  const expected = phrase[cursor];
  const current  = charEls[cursor];

  totalTyped++;

  if (typed === expected) {
    current.classList.replace('pending', 'correct');
    correctCount++;
    flashKey(expected, 'ok');
    playClick();
  } else {
    current.classList.replace('pending', 'error');
    current.classList.add('char-shake');
    playError();
    current.addEventListener('animationend', () => current.classList.remove('char-shake'), { once: true });
    flashKey(expected, 'err');
    errorMap[expected] = (errorMap[expected] || 0) + 1;
  }

  current.classList.remove('cursor');
  cursor++;

  if (cursor < phrase.length) {
    charEls[cursor].classList.add('cursor');
    charEls[cursor].scrollIntoView({ behavior: 'instant', block: 'nearest' });
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

  document.querySelectorAll('#level-map .level-pip[data-level]').forEach(pip => {
    pip.addEventListener('click', () => {
      const target = Number(pip.dataset.level);
      if (target > currentLevel) return;
      applyLevel(target);
    });
  });

  document.addEventListener('keydown', handleKeydown);
  $('advance-btn').addEventListener('click',       advanceLevel);
  $('restart-btn').addEventListener('click',       startRound);
  $('drill-btn').addEventListener('click',         startDrillRound);
  $('sum-sparkline-wrap').addEventListener('click', showHistoryPanel);
  $('history-close').addEventListener('click',     closeHistoryPanel);
  $('settings-btn').addEventListener('click', toggleSettingsPanel);
  $('words-dec').addEventListener('click',     () => changeWordCount(-10));
  $('words-inc').addEventListener('click',     () => changeWordCount(10));
  $('threshold-dec').addEventListener('click', () => changeThreshold(-5));
  $('threshold-inc').addEventListener('click', () => changeThreshold(5));
  $('timer-dec').addEventListener('click',     () => changeTimerMins(-1));
  $('timer-inc').addEventListener('click',     () => changeTimerMins(1));
  $('timer-toggle').addEventListener('click',  toggleTimer);
  $('audio-toggle').addEventListener('click',  toggleAudio);
  $('mode-toggle').addEventListener('click',   toggleMode);
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', init);
}

// ── Exports (Node test environment only) ──────────────────────
if (typeof module !== 'undefined') {
  module.exports = {
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
    get ADVANCE_THRESHOLD() { return settings.threshold; },
    get ROUND_WORD_COUNT()  { return settings.wordCount;  },
  };
}
