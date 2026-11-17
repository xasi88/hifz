// Прогресс хранится только на этом устройстве (решение автора 2026-11-17: без облака).
// Повтор по графику: после урока завтра, потом через 3, 7, 14, 30, 60, 120 дней.
// «Забыл» возвращает строку к повтору на завтра.
const KEY = 'hifz.v1';
export const INTERVALS = [1, 3, 7, 14, 30, 60, 120];

const pad = (n) => String(n).padStart(2, '0');
const fmt = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// Новый день начинается в 3:00 ночи, как в Органайзере: ночной повтор идёт в тот же день.
export function today(now = new Date()) {
  return fmt(new Date(now.getTime() - 3 * 3600 * 1000));
}

export function addDays(day, n) {
  const [y, m, d] = day.split('-').map(Number);
  return fmt(new Date(y, m - 1, d + n));
}

export function daysBetween(a, b) {
  const [y1, m1, d1] = a.split('-').map(Number);
  const [y2, m2, d2] = b.split('-').map(Number);
  return Math.round((new Date(y2, m2 - 1, d2) - new Date(y1, m1 - 1, d1)) / 86400000);
}

// Новая запись строки после ответа «помню» или «забыл».
export function nextReview(rec, remembered, day) {
  const lvl = remembered ? Math.min((rec.lvl || 0) + 1, INTERVALS.length - 1) : 0;
  return { ...rec, lvl, due: addDays(day, INTERVALS[lvl]), seen: (rec.seen || 0) + 1, miss: (rec.miss || 0) + (remembered ? 0 : 1) };
}

let db = {};
try { db = JSON.parse(localStorage.getItem(KEY)) || {}; } catch { db = {}; }
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(db)); } catch { /* приватное окно: работаем без сохранения */ }
}
const bag = (id) => (db[id] ??= { lines: {} });

export const rec = (id, i) => bag(id).lines[i];

export function learnedCount(id, n) {
  let c = 0;
  for (let i = 0; i < n; i++) if (rec(id, i)) c++;
  return c;
}

export function nextNew(id, n) {
  for (let i = 0; i < n; i++) if (!rec(id, i)) return i;
  return -1;
}

export function dueList(id, n, day = today()) {
  const out = [];
  for (let i = 0; i < n; i++) { const r = rec(id, i); if (r && r.due <= day) out.push(i); }
  return out;
}

// new: не учили; due: пора повторить; learned: выучена; strong: держится больше двух недель.
export function status(id, i, day = today()) {
  const r = rec(id, i);
  if (!r) return 'new';
  if (r.due <= day) return 'due';
  return r.lvl >= 3 ? 'strong' : 'learned';
}

export function finishLesson(id, i, errors) {
  const r = rec(id, i) || {};
  bag(id).lines[i] = { ...r, lvl: 0, due: addDays(today(), INTERVALS[0]), learned: r.learned || today(), err: (r.err || 0) + errors };
  save();
}

export function grade(id, i, remembered) {
  const r = rec(id, i);
  if (!r) return;
  bag(id).lines[i] = nextReview(r, remembered, today());
  save();
}

export function resetText(id) {
  delete db[id];
  save();
}
