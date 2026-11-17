// Сравнение арабских слов без огласовок: для проверки чтения голосом и для заданий.
const MARKS = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g;

export function norm(word) {
  return word.replace(MARKS, '')
    .replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه')
    .replace(/ؤ/g, 'و').replace(/ئ/g, 'ي')
    .replace(/[^\u0621-\u064A]/g, '');
}

export function lev(a, b) {
  const row = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const keep = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = keep;
    }
  }
  return row[b.length];
}

// Одно и то же слово, если распознавание ошиблось в одной букве (в длинном слове: в двух).
export function same(a, b) {
  if (a === b) return true;
  const n = Math.max(a.length, b.length);
  const d = lev(a, b);
  return (n >= 4 && d <= 1) || (n >= 7 && d <= 2);
}

// Какие слова строки прозвучали. expected: слова с огласовками, heard: распознанный текст.
export function check(expected, heard) {
  const E = expected.map(norm);
  const H = String(heard || '').split(/\s+/).map(norm).filter(Boolean);
  const n = E.length, m = H.length;
  const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = same(E[i], H[j]) ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const ok = new Array(n).fill(false);
  for (let i = 0, j = 0; i < n && j < m;) {
    if (same(E[i], H[j])) { ok[i] = true; i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) i++;
    else j++;
  }
  // Распознавание иногда склеивает или делит слова: длинное слово ищем в сплошном тексте.
  const joined = H.join('');
  E.forEach((w, i) => { if (!ok[i] && w.length >= 3 && joined.includes(w)) ok[i] = true; });
  const good = ok.filter(Boolean).length;
  return { ok, score: n ? good / n : 0 };
}

// Показ в шрифте «Мадина»: в нём кружок U+0652 значит «не читается», а сукун рисуется знаком U+06E1.
// В данных текст как в хадисе (сукун U+0652); на экран идёт знак мусхафа. Данные не меняются.
export const mushaf = (s) => String(s).replaceAll('ْ', 'ۡ');

// Первая буква слова вместе с её огласовкой: подсказка «первые буквы».
export function firstLetter(word) {
  const m = word.match(/^[\u0621-\u064A\u0671][\u064B-\u065F\u0670]*/);
  return m ? m[0] : word.slice(0, 1);
}

// Повторяемая перестановка: одна и та же строка в одном круге прячет одни и те же слова.
export function shuffle(list, seed = 1) {
  const a = list.slice();
  let s = seed * 9301 + 49297;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
