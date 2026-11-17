// Урок одной строки: шесть шагов подряд, внизу кнопка «Дальше».
// Методика: docs/Спецификация.md, раздел «Как учим».
import { h, ar, tag, btn, screen, topbar, lineText } from './ui.js?v=8408ebe5';
import { stop } from './audio.js?v=8408ebe5';
import { finishLesson, nextNew } from './progress.js?v=8408ebe5';
import { meaning, listen, fade, build, recall, chainStep } from './steps.js?v=8408ebe5';

const STEPS = [
  { name: 'Смысл', fn: meaning },
  { name: 'Слушать', fn: listen },
  { name: 'Подсказки', fn: fade },
  { name: 'Собрать', fn: build },
  { name: 'По памяти', fn: recall },
  { name: 'Цепочка', fn: chainStep },
];

export function lesson(text, i) {
  const line = text.lines[i];
  if (!line) { location.hash = '#/text'; return; }
  // У первой строки цепочки нет: она сама начало дуа.
  const steps = i === 0 ? STEPS.slice(0, 5) : STEPS;
  let s = 0;
  const ctx = { text, i, line, words: line.w.map((x) => x[0]), errors: 0 };
  const body = h('main', { class: 'body' });
  const dots = h('ol', { class: 'steps', 'aria-label': 'Шаги урока' }, steps.map((st, k) => h('li', { title: st.name }, k + 1)));
  const next = btn('Дальше', () => {
    if (ctx.onNext && ctx.onNext() === false) return;
    go();
  }, 'lime big');

  function draw() {
    stop();
    ctx.onNext = null;
    next.disabled = true;
    [...dots.children].forEach((li, k) => { li.className = k < s ? 'done' : k === s ? 'now' : ''; });
    body.replaceChildren(
      h('h2', { class: 'step-title' }, steps[s].name, h('small', {}, `шаг ${s + 1} из ${steps.length}`)),
      steps[s].fn(ctx));
    window.scrollTo(0, 0);
  }
  function go() {
    if (s < steps.length - 1) { s++; draw(); } else finish();
  }
  function finish() {
    stop();
    finishLesson(text.id, i, ctx.errors);
    done(text, i);
  }
  ctx.ready = () => { next.disabled = false; };
  ctx.go = go;

  screen(topbar(`Строка ${i + 1} из ${text.lines.length}`, '#/text'), dots, body, h('footer', { class: 'bar' }, next));
  draw();
}

function done(text, i) {
  const nx = nextNew(text.id, text.lines.length);
  screen(topbar('Строка выучена', '#/'),
    h('main', { class: 'body stack' },
      h('div', { class: 'card pad center pop' },
        tag('Выучено', 'lime'),
        h('h2', { class: 'card-title' }, `Строка ${i + 1}`),
        ar(lineText(text.lines[i]), 'line'),
        h('p', { class: 'hint dark' }, 'Повтор завтра. Потом через 3, 7, 14 и 30 дней.')),
      nx === -1
        ? [h('p', { class: 'ok-msg' }, 'Все строки пройдены. Дальше повтор по графику и проверка всего дуа.'),
          btn('Проверить всё дуа', () => { location.hash = '#/check'; }, 'lime big')]
        : btn(`Учить строку ${nx + 1}`, () => { location.hash = `#/lesson/${nx}`; }, 'lime big'),
      btn('На главную', () => { location.hash = '#/'; }, 'dark')));
}
