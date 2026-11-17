// Хифз: главная, весь текст и переходы между экранами (адрес после #).
import { h, ar, tag, tile, btn, icon, screen, topbar, lineText, plural } from './ui.js?v=8408ebe5';
import { playButton, stop } from './audio.js?v=8408ebe5';
import { learnedCount, nextNew, dueList, status } from './progress.js?v=8408ebe5';
import { lesson } from './lesson.js?v=8408ebe5';
import { review, checkAll } from './review.js?v=8408ebe5';
import { slot } from './steps.js?v=8408ebe5';
import { VERSION, NEWS } from './version.js?v=8408ebe5';
import istikhara from './data/istikhara.js?v=8408ebe5';

const TEXT = istikhara;
const go = (hash) => () => { location.hash = hash; };

const METHOD = [
  ['Сначала смысл', 'Понятые слова держатся в памяти дольше набора звуков.'],
  ['Кусочки и цепочка', 'Строка за строкой, и каждый раз чтение с начала дуа. Так учат в медресе.'],
  ['Подсказки исчезают', 'С каждым кругом слов меньше: память достраивает сама.'],
  ['Вспомнить самому', 'Собрать строку и прочитать по памяти полезнее, чем перечитывать.'],
  ['Вслух', 'Сказанное вслух запоминается лучше. Голос можно проверить.'],
  ['Повтор по графику', 'Завтра, через 3, 7, 14 и 30 дней: новое, недавнее и старое.'],
];

function ring(done, total) {
  const r = 26, c = 2 * Math.PI * r, part = total ? done / total : 0;
  return h('div', {
    class: 'ring', 'aria-label': `Выучено ${done} из ${total}`,
    html: `<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="${r}" class="ring-bg"/>${part ? `<circle cx="32" cy="32" r="${r}" class="ring-fg" stroke-dasharray="${(c * part).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 32 32)"/>` : ''}</svg><b>${done}/${total}</b>`,
  });
}

function home() {
  const n = TEXT.lines.length;
  const done = learnedCount(TEXT.id, n);
  const nx = nextNew(TEXT.id, n);
  const due = dueList(TEXT.id, n).length;
  screen(
    h('header', { class: 'hero' },
      h('span', { class: 'logo', 'aria-hidden': 'true' }, ar('ح')),
      h('div', {}, h('h1', { class: 'title' }, 'Хифз'), h('p', { class: 'marker' }, 'заучивание наизусть'))),
    h('main', { class: 'body stack' },
      h('section', { class: 'card pad text-card' },
        h('div', { class: 'text-head' },
          h('div', {}, tag(TEXT.kind, 'pink'), h('h2', { class: 'card-title' }, TEXT.title)),
          ring(done, n)),
        ar(lineText(TEXT.lines[0]), 'line preview'),
        h('p', { class: 'hint dark' }, done === 0 ? `${n} строк. Одна строка за урок, урок около 5 минут.`
          : `Выучено ${done} из ${n}. ${due ? `Повторить сегодня: ${due} ${plural(due, 'строку', 'строки', 'строк')}.` : 'Повтор на сегодня сделан.'}`)),
      nx === -1 ? btn('Проверить всё дуа', go('#/check'), 'lime big')
        : btn(done ? `Учить строку ${nx + 1}` : 'Начать с первой строки', go(`#/lesson/${nx}`), 'lime big', 'play'),
      due > 0 && btn(`Повтор: ${due} ${plural(due, 'строка', 'строки', 'строк')}`, go('#/review'), 'pink big', 'repeat'),
      tile(btn('Весь текст', go('#/text'), 'dark'), btn('Проверка', go('#/check'), 'dark')),
      h('details', { class: 'card pad more' },
        h('summary', {}, 'Как Хифз помогает запомнить'),
        h('ol', { class: 'method' }, METHOD.map(([t, d]) => h('li', {}, h('b', {}, t), ' ', d)))),
      h('details', { class: 'card pad more' },
        h('summary', {}, `Версия ${VERSION}: что нового`),
        NEWS.map((x) => h('div', {}, h('p', {}, h('b', {}, `${x.v}, ${x.date}`)), h('ul', {}, x.items.map((t) => h('li', {}, t))))))));
}

const STATUS = { new: 'новая', due: 'повтор сегодня', learned: 'выучена', strong: 'держится' };

function textScreen() {
  let hidden = false;
  const rows = [];
  const list = h('div', { class: 'stack' });
  const all = playButton(TEXT.audio, 0, TEXT.lines[TEXT.lines.length - 1].t[1], {
    label: 'Слушать всё дуа', cls: 'pink',
    time: (t) => rows.forEach((r, i) => r.classList.toggle('playing', t >= TEXT.lines[i].t[0] && t <= TEXT.lines[i].t[1] + 0.4)),
  });
  const mode = tile(
    btn('Всё видно', () => setMode(false), 'dark on'),
    btn('Проверить себя', () => setMode(true), 'dark'));

  function setMode(v) {
    hidden = v;
    mode.children[0].classList.toggle('on', !v);
    mode.children[1].classList.toggle('on', v);
    draw();
  }

  function draw() {
    rows.length = 0;
    list.replaceChildren(...TEXT.parts.map((p) => h('section', { class: 'stack' },
      tag(p.title, 'pink'),
      TEXT.lines.slice(p.from, p.to + 1).map((l, k) => {
        const i = p.from + k;
        const st = status(TEXT.id, i);
        const row = h('div', { class: `card row st-${st}` },
          h('span', { class: 'num' }, i + 1),
          h('div', { class: 'row-text' },
            hidden ? slot(lineText(l)) : ar(lineText(l), 'line'),
            l.name && h('p', { class: 'name-note' }, tag('здесь назовите своё дело', 'pink')),
            h('p', { class: 'ru small' }, l.ru),
            h('span', { class: `chip-st ${st}` }, STATUS[st])),
          h('div', { class: 'row-acts' },
            playButton(TEXT.audio, l.t[0], l.t[1], { label: '', cls: 'round pink' }),
            h('a', { class: 'round lime', href: `#/lesson/${i}`, 'aria-label': `Учить строку ${i + 1}` }, icon('go'))));
        rows.push(row);
        return row;
      }))));
  }

  draw();
  screen(topbar(TEXT.title),
    h('main', { class: 'body stack' },
      h('div', { class: 'card pad' },
        h('p', {}, TEXT.when),
        h('p', { class: 'small' }, TEXT.nameNote)),
      all, mode, list,
      h('div', { class: 'card pad small' },
        h('p', {}, h('b', {}, 'Источник. '), TEXT.source),
        h('p', {}, h('b', {}, 'Запись. '), TEXT.audioSource),
        h('p', {}, h('b', {}, 'Перевод и пояснения '), 'написаны простыми словами для заучивания. Это пояснение смысла, а не слова хадиса.'))));
}

function route() {
  stop();
  const [, page, arg] = location.hash.split('/');
  if (page === 'text') textScreen();
  else if (page === 'lesson') lesson(TEXT, Number(arg) || 0);
  else if (page === 'review') review(TEXT);
  else if (page === 'check') checkAll(TEXT);
  else home();
}

window.addEventListener('hashchange', route);
route();

if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
