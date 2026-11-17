// Учёба по всему тексту, «Слова тают» (версия 2.0.0, выбор автора 2026-11-17).
// Весь текст на одном экране, пять кругов: с каждым кругом слов меньше.
// Касание пустого места показывает слово на 1,6 с и считается подсказкой.
import { h, tag, tile, btn, icon, screen, plural, dateRu } from './ui.js?v=ecc95a53';
import { play, playButton, stop } from './audio.js?v=ecc95a53';
import { firstLetter } from './arabic.js?v=ecc95a53';
import { canListen, voiceButton } from './voice.js?v=ecc95a53';
import { ROUNDS, LAST, daySeed, hiddenSet, passed } from './rounds.js?v=ecc95a53';
import { INTERVALS, today, state, setRound, finishLearn, finishReview } from './progress.js?v=ecc95a53';

const days = (n) => `${n} ${plural(n, 'день', 'дня', 'дней')}`;

function slot(word, cue, onPeek) {
  const s = h('button', { class: 'slot', type: 'button', 'aria-label': 'Показать слово' },
    h('span', { class: 'hid' }, word), cue && h('span', { class: 'cue' }, cue));
  s.addEventListener('click', () => {
    if (s.classList.contains('open')) return;
    onPeek();
    s.classList.add('peek');
    clearTimeout(s._t);
    s._t = setTimeout(() => s.classList.remove('peek'), 1600);
  });
  return s;
}

// startAt: номер круга с 0. Без него: учёба с сохранённого круга, повтор с последнего.
export function study(text, startAt) {
  const st = state(text.id);
  const words = text.lines.flatMap((l) => l.w.map((x) => x[0]));
  const total = words.length;
  const seed = daySeed(today());
  const end = text.lines[text.lines.length - 1].t[1];
  let round = startAt ?? (st.mode === 'learn' ? st.round : LAST);
  let peeked = new Set();
  let lns = [];
  let slots = [];

  const mark = (i) => lns.forEach((el, k) => el.classList.toggle('playing', k === i));
  const lineAt = (t) => text.lines.findIndex((l) => t >= l.t[0] && t <= l.t[1] + 0.4);

  const chips = tile(...ROUNDS.map((r, k) => {
    const b = btn(String(k + 1), () => goRound(k), 'dark');
    b.setAttribute('aria-label', `Круг ${k + 1}: ${r.label}`);
    return b;
  }));
  chips.classList.add('rounds');
  const box = h('div', { class: 'card text-box' });
  const trBtn = btn('Перевод', () => {
    trBtn.classList.toggle('on');
    box.classList.toggle('tr');
  }, 'dark');
  const tools = tile(playButton(text.audio, 0, end, { cls: 'pink', time: (t) => mark(lineAt(t)), onEnd: () => mark(-1) }), trBtn);
  tools.classList.add('tools');
  const label = h('p', { class: 'round-label' });
  const count = h('p', { class: 'hint', 'aria-live': 'polite' });
  const hint = h('p', { class: 'hint' });
  const extra = h('div', { class: 'stack' });
  const mainBtn = btn('', next, 'lime big', 'check');
  const bar = h('div', { class: 'bar' }, mainBtn);
  const body = h('main', { class: 'body stack study' }, box, count, hint, extra);

  function line(l, i, hide, cue, at) {
    const parts = l.w.map(([w], j) => {
      const n = at + j;
      const el = hide.has(n) ? (slots[n] = slot(w, cue && firstLetter(w), () => peek(n))) : w;
      return j ? [' ', el] : el;
    });
    const ln = h('span', { class: 'ln' }, parts, l.p,
      l.name && h('span', { class: 'name-tag', dir: 'ltr', lang: 'ru' }, 'ваше дело'),
      h('span', { class: 'ru-ln', dir: 'ltr', lang: 'ru' }, `${i + 1}. ${l.ru}`,
        h('small', {}, 'Пояснение: ', l.sense)));
    if (round === 0) {
      ln.setAttribute('role', 'button');
      ln.tabIndex = 0;
      const say = () => play(text.audio, l.t[0], l.t[1], () => mark(-1), () => mark(i));
      ln.addEventListener('click', say);
      ln.addEventListener('keydown', (e) => { if (e.key === 'Enter') say(); });
    }
    return ln;
  }

  function drawText() {
    const hide = hiddenSet(total, round, seed);
    const cue = ROUNDS[round].cue;
    let at = 0;
    lns = [];
    slots = [];
    box.replaceChildren(...text.parts.map((p) => h('p', { class: 'flow', dir: 'rtl', lang: 'ar' },
      text.lines.slice(p.from, p.to + 1).map((l, j) => {
        const i = p.from + j;
        lns[i] = line(l, i, hide, cue, at);
        at += l.w.length;
        return [lns[i], ' '];
      }))));
  }

  function peek(n) {
    peeked.add(n);
    showCount();
  }

  function showCount() {
    count.textContent = round && peeked.size ? `Подсказок: ${peeked.size}` : '';
  }

  function draw() {
    [...chips.children].forEach((c, k) => c.classList.toggle('now', k === round));
    label.textContent = st.mode === 'review' && round === LAST ? 'Повтор: весь текст по памяти'
      : `Круг ${round + 1} из ${ROUNDS.length}: ${ROUNDS[round].label}`;
    hint.textContent = ROUNDS[round].hint;
    mainBtn.lastChild.textContent = round < LAST ? 'Прочитал вслух, дальше' : 'Прочитал по памяти, готово';
    drawText();
    extra.replaceChildren(...(round === LAST && canListen ? [voiceButton(words, heard)] : []));
    showCount();
  }

  function goRound(k) {
    round = k;
    peeked = new Set();
    if (st.mode === 'learn') setRound(text.id, k);
    draw();
    window.scrollTo(0, 0);
  }

  function next() {
    if (round < LAST) goRound(round + 1); else finish();
  }

  // Голос на последнем круге: пропущенные слова тоже считаются подсказками.
  function heard(r) {
    r.ok.forEach((ok, n) => {
      slots[n]?.classList.add('open', ok ? 'good' : 'miss');
      if (!ok) peeked.add(n);
    });
    showCount();
  }

  function finish() {
    stop();
    const hints = peeked.size;
    const ok = passed(hints, total);
    const said = `Подсказок: ${hints} из ${total} слов.`;
    let head, note, again = false;
    if (st.mode === 'learn') {
      finishLearn(text.id, hints);
      head = ok ? 'Выучено' : 'Первый день';
      note = `${said} Завтра повтор: весь текст по памяти.`;
    } else if (st.mode === 'review') {
      const w = finishReview(text.id, ok, hints);
      head = ok ? 'Помню' : 'Повторим завтра';
      note = ok ? `${said} Следующий повтор через ${days(INTERVALS[w.lvl])}, ${dateRu(w.due)}.`
        : `${said} Это больше десятой части текста, поэтому повтор завтра. Можно сейчас пройти круги с первого.`;
      again = !ok;
    } else {
      head = 'Прочитано';
      note = `${said} Повтор по графику: ${dateRu(st.due)}.`;
    }
    [bar, chips, label, tools].forEach((el) => el.remove());
    body.classList.remove('study');
    body.replaceChildren(
      h('div', { class: 'card pad center pop' },
        tag(head, ok ? '' : 'pink'),
        h('h2', { class: 'card-title' }, text.title),
        h('p', { class: 'hint dark' }, note)),
      ...(again ? [btn('Круги с первого', () => study(text, 0), 'lime big', 'repeat')] : []),
      btn('На главную', () => { location.hash = '#/'; }, again ? 'dark' : 'lime big'));
    window.scrollTo(0, 0);
  }

  screen(
    h('header', { class: 'top study-top' },
      h('a', { class: 'round dark', href: '#/', 'aria-label': 'На главную' }, icon('back')),
      chips, label, tools),
    body, bar);
  draw();
}
