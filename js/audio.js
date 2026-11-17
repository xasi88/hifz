// Один плеер на всё приложение. Строка играет от t[0] до t[1] одного файла записи.
// Между строками в файле тишина 0,4 с, поэтому остановка с запасом не задевает соседнюю строку.
import { h, icon } from './ui.js?v=ecc95a53';

let a = null;
let end = 0;
let done = null;
let onTime = null;
let raf = 0;

function tick() {
  raf = requestAnimationFrame(() => {
    if (!a) return;
    onTime && onTime(a.currentTime);
    if (a.currentTime >= end || a.ended) finish(); else tick();
  });
}

function finish() {
  cancelAnimationFrame(raf);
  if (a) a.pause();
  const d = done;
  done = null; onTime = null;
  d && d();
}

export function stop() {
  if (done) finish();
}

export function play(src, from, to, onDone, time) {
  stop();
  if (!a) { a = new Audio(); a.preload = 'auto'; }
  if (!a.src.endsWith(src)) a.src = src;
  end = to; done = onDone || (() => {}); onTime = time || null;
  const go = () => {
    a.currentTime = from;
    a.play().then(tick).catch(finish);
  };
  if (a.readyState >= 1) go(); else a.addEventListener('loadedmetadata', go, { once: true });
}

// Кнопка «Слушать» для строки или всего текста. Второе нажатие останавливает.
// onEnd: звук закончился или остановлен (снять подсветку строки).
export function playButton(src, from, to, { label = 'Слушать', cls = '', time, auto = false, onEnd } = {}) {
  const text = h('span', {}, label);
  const ico = icon('play');
  const b = h('button', { class: `btn ${cls}`.trim(), type: 'button', 'aria-label': label ? null : 'Слушать строку' }, ico, label && text);
  const idle = () => { b.classList.remove('on'); b.firstChild.replaceWith(icon('play')); text.textContent = label; onEnd && onEnd(); };
  const start = () => {
    b.classList.add('on');
    b.firstChild.replaceWith(icon('stop'));
    if (label) text.textContent = 'Стоп';
    play(src, from, to, idle, time);
  };
  b.addEventListener('click', () => (b.classList.contains('on') ? stop() : start()));
  if (auto) setTimeout(start, 250);
  return b;
}
