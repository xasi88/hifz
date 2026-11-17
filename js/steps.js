// Шаги урока одной строки. Каждый шаг получает ctx и возвращает элемент.
// ctx.ready() открывает кнопку «Дальше», ctx.go() сразу ведёт к следующему шагу,
// ctx.onNext может удержать шаг (круги подсказок), ctx.errors считает ошибки.
import { h, ar, tag, tile, btn, wordRow, lineText } from './ui.js?v=8408ebe5';
import { norm, firstLetter, shuffle } from './arabic.js?v=8408ebe5';
import { playButton } from './audio.js?v=8408ebe5';
import { canListen, voiceButton } from './voice.js?v=8408ebe5';

const nameNote = () => h('p', { class: 'name-note' }, tag('Здесь назовите своё дело', 'pink'));

// Скрытое слово: место остаётся, касание показывает слово на 1,6 с.
export function slot(word, cue = '') {
  const s = h('button', { class: 'slot', type: 'button', 'aria-label': 'Показать слово' },
    ar(word, 'hid'), cue && ar(cue, 'cue'));
  s.addEventListener('click', () => {
    if (s.classList.contains('open')) return;
    s.classList.add('peek');
    clearTimeout(s._t);
    s._t = setTimeout(() => s.classList.remove('peek'), 1600);
  });
  return s;
}

const openSlots = (slots, marks) => slots.forEach((s, k) => {
  s.classList.add('open');
  if (marks) s.classList.add(marks[k] ? 'good' : 'miss');
});

const heardText = (r) => `Услышано ${Math.round(r.score * 100)}% слов. Красные слова пропущены или не расслышаны.`;

export function meaning(ctx) {
  const { line, text } = ctx;
  ctx.ready();
  return h('div', { class: 'stack' },
    h('div', { class: 'card pad' },
      wordRow(line.w, ([w, ru]) => h('span', { class: 'wt' }, ar(w), h('small', {}, ru)), 'big'),
      line.name && nameNote()),
    h('div', { class: 'card pad' },
      h('p', { class: 'ru' }, line.ru),
      h('p', { class: 'sense' }, tag('Пояснение', 'lime'), ' ', line.sense)),
    playButton(text.audio, line.t[0], line.t[1], { cls: 'pink' }));
}

export function listen(ctx) {
  const { line, text } = ctx;
  let n = 0;
  const dots = h('div', { class: 'count', 'aria-label': 'Сколько раз прочитано' }, [0, 1, 2].map(() => h('span', { class: 'dot' })));
  const said = btn('Прочитал вслух', () => {
    if (n >= 3) return;
    dots.children[n].classList.add('on');
    n++;
    if (n === 3) { said.disabled = true; ctx.ready(); }
  }, 'lime', 'check');
  return h('div', { class: 'stack' },
    h('div', { class: 'card pad center' }, ar(lineText(line), 'line'), line.name && nameNote()),
    playButton(text.audio, line.t[0], line.t[1], { cls: 'pink', auto: true }),
    h('p', { class: 'hint' }, 'Послушайте и прочитайте строку вслух. Три раза.'),
    dots, said);
}

const ROUNDS = [0.34, 0.67, 'first', 1];
const ROUND_HINT = {
  0.34: 'Прочитайте вслух. Забыли слово: нажмите на пустое место.',
  0.67: 'Слов меньше. Прочитайте вслух, пустое место открывается касанием.',
  first: 'Остались первые буквы. Прочитайте строку вслух.',
  1: 'Слов нет. Прочитайте строку по памяти, место слова подскажет.',
};

export function fade(ctx) {
  const { words } = ctx;
  const order = shuffle(words.map((_, k) => k), ctx.i + 7);
  let round = 0;
  const box = h('div', { class: 'stack' });
  const draw = () => {
    const mode = ROUNDS[round];
    const hide = new Set(typeof mode === 'number' && mode < 1 ? order.slice(0, Math.ceil(words.length * mode)) : order);
    box.replaceChildren(
      h('p', { class: 'round-label' }, `Круг ${round + 1} из ${ROUNDS.length}`),
      h('div', { class: 'card pad' }, wordRow(words, (w, k) => (hide.has(k)
        ? slot(w, mode === 'first' ? firstLetter(w) : '')
        : h('span', { class: 'wt' }, ar(w))), 'big')),
      h('p', { class: 'hint' }, ROUND_HINT[mode]));
  };
  ctx.onNext = () => {
    if (round < ROUNDS.length - 1) { round++; draw(); return false; }
    return true;
  };
  draw();
  ctx.ready();
  return box;
}

export function build(ctx) {
  const { words, text, i } = ctx;
  const target = words.map(norm);
  let extra = [];
  if (words.length <= 6) {
    const pool = [];
    text.lines.forEach((l, k) => {
      if (k === i) return;
      l.w.forEach(([w]) => {
        const n = norm(w);
        if (!target.includes(n) && !pool.some((p) => norm(p) === n)) pool.push(w);
      });
    });
    extra = shuffle(pool, i + 3).slice(0, 2);
  }
  const chips = shuffle([...words, ...extra], i + 11);
  let pos = 0, miss = 0, streak = 0;
  const placed = wordRow(words, (w) => h('span', { class: 'slot empty' }, ar(w, 'hid')), 'big');
  const status = h('p', { class: 'hint', 'aria-live': 'polite' }, 'Нажимайте слова по порядку. Строка идёт справа налево.');
  const pool = h('div', { class: 'pool', dir: 'rtl' });
  for (const w of chips) {
    const b = h('button', { class: 'chip', type: 'button' }, ar(w));
    b.addEventListener('click', () => {
      if (pos >= words.length) return;
      if (norm(w) === target[pos]) {
        placed.children[pos].classList.replace('empty', 'open');
        b.remove();
        pos++;
        streak = 0;
        pool.querySelectorAll('.hint-me').forEach((x) => x.classList.remove('hint-me'));
        if (pos === words.length) {
          status.textContent = miss ? `Собрано. Ошибок: ${miss}.` : 'Собрано без ошибок.';
          if (miss) ctx.errors++;
          pool.hidden = true;
          ctx.ready();
        }
      } else {
        miss++;
        streak++;
        b.classList.remove('bad');
        void b.offsetWidth;
        b.classList.add('bad');
        if (streak >= 2) [...pool.children].find((x) => norm(x.textContent) === target[pos])?.classList.add('hint-me');
      }
    });
    pool.append(b);
  }
  return h('div', { class: 'stack' }, h('div', { class: 'card pad' }, placed), status, pool);
}

export function recall(ctx) {
  const { words, line } = ctx;
  const box = h('div', { class: 'stack' });
  const draw = () => {
    const slots = words.map((w) => slot(w));
    const res = h('div', { class: 'stack', 'aria-live': 'polite' });
    const gradeTile = () => tile(
      btn('Ошибся', () => {
        ctx.errors++;
        res.replaceChildren(h('p', { class: 'hint' }, 'Посмотрите строку ещё раз и попробуйте снова.'), btn('Ещё раз', draw, 'pink', 'repeat'));
      }, 'pink'),
      btn('Сказал верно', () => ctx.go(), 'lime', 'check'));
    box.replaceChildren(
      h('div', { class: 'card pad' }, h('p', { class: 'ru' }, line.ru), h('div', { class: 'words big', dir: 'rtl', lang: 'ar' }, slots)),
      h('p', { class: 'hint' }, 'Прочитайте строку вслух по памяти. Подсказка: перевод сверху.'),
      canListen && voiceButton(words, (r) => {
        openSlots(slots, r.ok);
        if (r.score >= 0.85) {
          res.replaceChildren(h('p', { class: 'ok-msg' }, 'Верно. Можно дальше.'));
          ctx.ready();
        } else res.replaceChildren(h('p', { class: 'hint' }, heardText(r)), gradeTile());
      }),
      btn('Показать и сверить', () => { openSlots(slots); res.replaceChildren(gradeTile()); }, 'dark', 'eye'),
      res);
  };
  draw();
  return box;
}

// Чтение подряд строк from..to по памяти. Нужно уроку (цепочка) и проверке всего текста.
export function chain({ text, from = 0, to, onDone }) {
  const lines = text.lines.slice(from, to + 1);
  const slots = lines.map((l) => {
    const s = h('button', { class: 'slot line-slot', type: 'button', 'aria-label': 'Показать строку' }, ar(lineText(l), 'hid'));
    s.addEventListener('click', () => s.classList.toggle('open'));
    return s;
  });
  const res = h('div', { class: 'stack', 'aria-live': 'polite' });
  const gradeTile = () => tile(
    btn('Были ошибки', () => onDone(true), 'pink'),
    btn('Без ошибок', () => onDone(false), 'lime', 'check'));
  const words = lines.flatMap((l) => l.w.map((x) => x[0]));
  return h('div', { class: 'stack' },
    h('div', { class: 'card pad chain' }, lines.map((l, k) => h('div', { class: 'chain-row' },
      h('span', { class: 'num' }, from + k + 1),
      h('div', { class: 'chain-text' }, h('p', { class: 'ru small' }, l.ru), slots[k])))),
    h('p', { class: 'hint' }, 'Прочитайте вслух подряд. Забыли строку: нажмите на неё.'),
    canListen && voiceButton(words, (r) => {
      let at = 0;
      lines.forEach((l, k) => {
        const part = r.ok.slice(at, at + l.w.length);
        at += l.w.length;
        slots[k].classList.add('open', part.every(Boolean) ? 'good' : 'miss');
      });
      res.replaceChildren(h('p', { class: r.score >= 0.85 ? 'ok-msg' : 'hint' }, heardText(r)), gradeTile());
    }),
    btn('Показать и сверить', () => { slots.forEach((s) => s.classList.add('open')); res.replaceChildren(gradeTile()); }, 'dark', 'eye'),
    res);
}

export function chainStep(ctx) {
  return chain({ text: ctx.text, from: 0, to: ctx.i, onDone: (err) => { if (err) ctx.errors++; ctx.go(); } });
}
