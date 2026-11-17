// Прогресс хранится только на этом устройстве (решение автора 2026-11-17: без облака).
// С версии 2.0.0 учим весь текст сразу: запись whole. Записи строк версии 1.0.0 (lines)
// остаются в браузере нетронутыми, так старый прогресс не теряется.
// Повтор по графику: после пятого круга завтра, потом через 3, 7, 14, 30, 60, 120 дней.
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

// Новая запись после повтора: «помню» двигает срок дальше, «забыл» возвращает на завтра.
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
const whole = (id) => (bag(id).whole ??= { round: 0 });

// learn: идут круги; review: пора повторить; rest: выучено, повтор позже.
export function state(id, day = today()) {
  const w = bag(id).whole || { round: 0 };
  if (!w.learned) return { mode: 'learn', round: w.round || 0 };
  if (w.due <= day) return { mode: 'review', lvl: w.lvl, due: w.due };
  return { mode: 'rest', lvl: w.lvl, due: w.due, days: daysBetween(day, w.due) };
}

// Круг, с которого продолжить учёбу в следующий раз.
export function setRound(id, round) {
  const w = whole(id);
  if (w.learned || w.round === round) return;
  w.round = round;
  save();
}

// Пятый круг пройден первый раз: текст выучен, повтор завтра.
export function finishLearn(id, hints) {
  const day = today();
  bag(id).whole = { ...whole(id), round: 0, learned: day, lvl: 0, due: addDays(day, INTERVALS[0]), hints };
  save();
  return bag(id).whole;
}

export function finishReview(id, remembered, hints) {
  bag(id).whole = { ...nextReview(whole(id), remembered, today()), hints };
  save();
  return bag(id).whole;
}
