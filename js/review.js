// Повтор по графику и проверка всего выученного подряд.
// Как в медресе: сабак (новое), сабки (недавнее), манзиль (старое).
import { h, tag, tile, btn, screen, topbar, plural } from './ui.js?v=8408ebe5';
import { playButton, stop } from './audio.js?v=8408ebe5';
import { canListen, voiceButton } from './voice.js?v=8408ebe5';
import { dueList, rec, grade, learnedCount, nextNew } from './progress.js?v=8408ebe5';
import { slot, chain } from './steps.js?v=8408ebe5';

export function review(text) {
  const queue = dueList(text.id, text.lines.length);
  let k = 0;
  const body = h('main', { class: 'body stack' });

  function draw() {
    stop();
    if (k >= queue.length) return finished();
    const i = queue[k];
    const line = text.lines[i];
    const old = (rec(text.id, i).lvl || 0) >= 3;
    const words = line.w.map((x) => x[0]);
    const slots = words.map((w) => slot(w));
    const res = h('div', { class: 'stack', 'aria-live': 'polite' });
    const answer = (ok) => { grade(text.id, i, ok); k++; draw(); };
    const reveal = (marks) => {
      slots.forEach((s, n) => {
        s.classList.add('open');
        if (marks) s.classList.add(marks[n] ? 'good' : 'miss');
      });
      res.append(
        playButton(text.audio, line.t[0], line.t[1], { cls: 'pink' }),
        tile(btn('Забыл', () => answer(false), 'pink'), btn('Помню', () => answer(true), 'lime', 'check')));
    };
    body.replaceChildren(
      h('p', { class: 'round-label' }, `${k + 1} из ${queue.length}`),
      h('div', { class: 'card pad' },
        tag(old ? 'Старое' : 'Недавнее', old ? 'lime' : 'pink'),
        h('p', { class: 'ru' }, h('b', {}, `Строка ${i + 1}. `), line.ru),
        h('div', { class: 'words big', dir: 'rtl', lang: 'ar' }, slots)),
      h('p', { class: 'hint' }, 'Прочитайте строку вслух по памяти, потом сверьте.'),
      canListen && voiceButton(words, (r) => {
        res.replaceChildren(h('p', { class: r.score >= 0.85 ? 'ok-msg' : 'hint' }, `Услышано ${Math.round(r.score * 100)}% слов.`));
        reveal(r.ok);
      }),
      btn('Показать и сверить', () => { res.replaceChildren(); reveal(); }, 'dark', 'eye'),
      res);
    window.scrollTo(0, 0);
  }

  function finished() {
    const n = learnedCount(text.id, text.lines.length);
    body.replaceChildren(
      h('div', { class: 'card pad center pop' },
        tag('Повтор', 'lime'),
        h('h2', { class: 'card-title' }, queue.length ? 'На сегодня всё' : 'Сегодня повторять нечего'),
        h('p', { class: 'hint dark' }, queue.length
          ? `Повторено ${queue.length} ${plural(queue.length, 'строка', 'строки', 'строк')}. Следующие сроки приложение помнит само.`
          : 'Строки придут на повтор в свой день.')),
      n > 0 && btn('Прочитать всё выученное подряд', () => { location.hash = '#/check'; }, 'lime big'),
      btn('На главную', () => { location.hash = '#/'; }, 'dark'));
  }

  screen(topbar('Повтор'), body);
  draw();
}

export function checkAll(text) {
  const n = text.lines.length;
  const nx = nextNew(text.id, n);
  const to = nx === -1 ? n - 1 : nx - 1;
  const body = h('main', { class: 'body stack' });
  if (to < 0) {
    body.append(h('p', { class: 'hint' }, 'Сначала выучите первую строку.'), btn('Учить строку 1', () => { location.hash = '#/lesson/0'; }, 'lime big'));
  } else {
    body.append(
      h('p', { class: 'hint' }, to === n - 1 ? 'Всё дуа по памяти, от первой строки до последней.' : `Выученное по памяти: строки с 1 по ${to + 1}.`),
      chain({
        text, from: 0, to,
        onDone: (err) => {
          stop();
          body.replaceChildren(
            h('div', { class: 'card pad center pop' },
              tag(err ? 'Есть ошибки' : 'Без ошибок', err ? 'pink' : 'lime'),
              h('p', { class: 'hint dark' }, err
                ? 'Строки с ошибками придут на повтор чаще, если отметить их в «Повторе». Можно пройти урок строки ещё раз.'
                : 'Отлично. Проверку стоит повторять раз в неделю.')),
            btn('Весь текст', () => { location.hash = '#/text'; }, 'lime big'),
            btn('На главную', () => { location.hash = '#/'; }, 'dark'));
        },
      }));
  }
  screen(topbar('Проверка по памяти'), body);
}
