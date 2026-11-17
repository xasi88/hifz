// Круги «Слова тают» (версия 2.0.0, выбор автора 2026-11-17): весь текст на экране,
// с каждым кругом слов меньше. Здесь нет экрана и звука: всё проверяют тесты.
import { shuffle } from './arabic.js?v=ecc95a53';

export const ROUNDS = [
  { hide: 0, label: 'всё видно', hint: 'Слушайте чтеца и читайте вместе вслух. Коснитесь строки: чтец прочтёт только её.' },
  { hide: 1 / 3, label: 'треть слов скрыта', hint: 'Прочитайте вслух весь текст. Забыли слово: коснитесь пустого места.' },
  { hide: 2 / 3, label: 'две трети скрыты', hint: 'Слов меньше. Прочитайте вслух весь текст, пустое место открывается касанием.' },
  { hide: 1, cue: true, label: 'первые буквы', hint: 'Остались первые буквы. Прочитайте вслух весь текст.' },
  { hide: 1, label: 'по памяти', hint: 'Слов нет. Прочитайте весь текст по памяти, место слова подскажет.' },
];
export const LAST = ROUNDS.length - 1;

// Порядок слов на день: каждый день новый, в один день один и тот же.
export const daySeed = (day) => Number(day.replaceAll('-', '')) % 233280;

// Номера скрытых слов на круге. Порядок общий для всех кругов дня:
// слово, скрытое на круге 2, остаётся скрытым на круге 3.
export function hiddenSet(total, round, seed) {
  const share = ROUNDS[round].hide;
  if (!share) return new Set();
  const order = shuffle([...Array(total).keys()], seed);
  return new Set(order.slice(0, Math.ceil(total * share)));
}

// Повтор засчитан, если подсказок не больше десятой части слов.
export const passed = (hints, total) => hints <= Math.floor(total * 0.1);
