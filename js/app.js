// Хифз: главная и переходы между экранами (адрес после #).
import { h, ar, tag, btn, screen, lineText, plural, dateRu } from './ui.js?v=ecc95a53';
import { stop } from './audio.js?v=ecc95a53';
import { state } from './progress.js?v=ecc95a53';
import { study } from './study.js?v=ecc95a53';
import { ROUNDS } from './rounds.js?v=ecc95a53';
import { VERSION, NEWS } from './version.js?v=ecc95a53';
import istikhara from './data/istikhara.js?v=ecc95a53';

const TEXT = istikhara;
const go = (hash) => () => { location.hash = hash; };

const METHOD = [
  ['Весь текст перед глазами', 'Дуа учится целиком, как его читают: от первого слова до последнего.'],
  ['Подсказки исчезают', 'С каждым кругом слов меньше: память достраивает сама.'],
  ['Вспомнить самому', 'Попытка вспомнить полезнее, чем перечитывать. Слово открывается только по касанию.'],
  ['Вслух', 'Каждый круг читайте вслух. Сказанное вслух запоминается лучше.'],
  ['Смысл', 'Кнопка «Перевод» показывает перевод и пояснение каждой строки.'],
  ['Повтор по графику', 'Завтра, через 3, 7, 14 и 30 дней. Без повтора выученное уходит.'],
];

function ring(done, total, label) {
  const r = 26, c = 2 * Math.PI * r, part = total ? done / total : 0;
  return h('div', {
    class: 'ring', 'aria-label': `Пройдено кругов: ${done} из ${total}`,
    html: `<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="${r}" class="ring-bg"/>${part ? `<circle cx="32" cy="32" r="${r}" class="ring-fg" stroke-dasharray="${(c * part).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 32 32)"/>` : ''}</svg><b>${label}</b>`,
  });
}

function home() {
  const st = state(TEXT.id);
  const n = ROUNDS.length;
  const words = TEXT.lines.reduce((s, l) => s + l.w.length, 0);
  let note, main;
  if (st.mode === 'learn') {
    note = st.round ? `Пройдено кругов: ${st.round} из ${n}. Продолжим с круга ${st.round + 1}.`
      : `${TEXT.lines.length} строк, ${words} слов. Весь текст на одном экране, ${n} кругов: с каждым кругом слов меньше.`;
    main = btn(st.round ? `Учить: круг ${st.round + 1} из ${n}` : 'Начать учить', go('#/learn'), 'lime big', 'play');
  } else if (st.mode === 'review') {
    note = 'Пора повторить: весь текст по памяти.';
    main = btn('Повтор всего дуа', go('#/learn'), 'pink big', 'repeat');
  } else {
    const when = st.days === 1 ? 'завтра' : `через ${st.days} ${plural(st.days, 'день', 'дня', 'дней')}`;
    note = `Выучено. Следующий повтор ${when}, ${dateRu(st.due)}.`;
    main = btn('Прочитать по памяти', go('#/learn'), 'lime big', 'eye');
  }
  const learned = st.mode !== 'learn';
  screen(
    h('header', { class: 'hero' },
      h('span', { class: 'logo', 'aria-hidden': 'true' }, ar('ح')),
      h('div', {}, h('h1', { class: 'title' }, 'Хифз'), h('p', { class: 'marker' }, 'заучивание наизусть'))),
    h('main', { class: 'body stack' },
      h('section', { class: 'card pad text-card' },
        h('div', { class: 'text-head' },
          h('div', {}, tag(TEXT.kind, 'pink'), h('h2', { class: 'card-title' }, TEXT.title)),
          ring(learned ? n : st.round, n, learned ? '✓' : `${st.round}/${n}`)),
        ar(lineText(TEXT.lines[0]), 'line preview'),
        h('p', { class: 'hint dark' }, note)),
      main,
      h('details', { class: 'card pad more' },
        h('summary', {}, 'Когда читают и откуда текст'),
        h('p', {}, TEXT.when),
        h('p', {}, TEXT.nameNote),
        h('p', { class: 'small' }, h('b', {}, 'Источник. '), TEXT.source),
        h('p', { class: 'small' }, h('b', {}, 'Запись. '), TEXT.audioSource),
        h('p', { class: 'small' }, h('b', {}, 'Перевод и пояснения '), 'написаны простыми словами для заучивания. Это пояснение смысла, а не слова хадиса.')),
      h('details', { class: 'card pad more' },
        h('summary', {}, 'Как Хифз помогает запомнить'),
        h('ol', { class: 'method' }, METHOD.map(([t, d]) => h('li', {}, h('b', {}, t), ' ', d)))),
      h('details', { class: 'card pad more' },
        h('summary', {}, `Версия ${VERSION}: что нового`),
        NEWS.map((x) => h('div', {}, h('p', {}, h('b', {}, `${x.v}, ${x.date}`)), h('ul', {}, x.items.map((t) => h('li', {}, t))))))));
}

// #/learn: учёба или повтор; #/learn/3: сразу третий круг. Старые адреса 1.0.0 ведут на главную.
function route() {
  stop();
  const [, page, arg] = location.hash.split('/');
  const k = Number(arg) - 1;
  if (page === 'learn') study(TEXT, Number.isInteger(k) && k >= 0 && k < ROUNDS.length ? k : undefined);
  else home();
}

window.addEventListener('hashchange', route);
route();

if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
