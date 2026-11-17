// Проверка чтения голосом. Браузер (Chrome, Edge, Safari) слушает арабскую речь
// и отдаёт текст; запись голоса уходит на сервер Google, Microsoft или Apple.
import { h, icon } from './ui.js?v=8408ebe5';
import { check } from './arabic.js?v=8408ebe5';

const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
export const canListen = Boolean(SR);

const ERRORS = {
  'not-allowed': 'Нет доступа к микрофону. Разрешите микрофон для этого сайта в настройках браузера.',
  'service-not-allowed': 'Браузер не даёт распознавание речи. Откройте сайт в Chrome или Edge.',
  network: 'Нет связи с сервером распознавания. Проверьте интернет.',
  'no-speech': 'Голос не услышан. Нажмите и прочитайте ещё раз.',
  'audio-capture': 'Микрофон не найден.',
};

// Кнопка «Сказать голосом». words: какие слова ждём. onResult({ ok, score, text }).
export function voiceButton(words, onResult) {
  const box = h('div', { class: 'voice' });
  const live = h('p', { class: 'voice-live', 'aria-live': 'polite' });
  const label = h('span', {}, 'Сказать голосом');
  const b = h('button', { class: 'btn sky', type: 'button' }, icon('mic'), label);
  let stopFn = null;
  let heard = '';

  b.addEventListener('click', () => {
    if (stopFn) { stopFn(); return; }
    heard = '';
    live.textContent = 'Слушаю. Читайте, потом нажмите «Готово».';
    label.textContent = 'Готово';
    b.classList.add('on');
    let err = '';
    const r = new SR();
    r.lang = 'ar-SA';
    r.continuous = true;
    r.interimResults = true;
    r.onresult = (e) => {
      let all = '';
      for (let k = 0; k < e.results.length; k++) all += ' ' + e.results[k][0].transcript;
      heard = all.trim();
      live.replaceChildren(h('span', { lang: 'ar', dir: 'rtl' }, heard));
    };
    r.onerror = (e) => { err = e.error; };
    r.onend = () => {
      stopFn = null;
      label.textContent = 'Сказать голосом';
      b.classList.remove('on');
      if (!heard) {
        live.textContent = ERRORS[err] || ERRORS['no-speech'];
        return;
      }
      onResult({ ...check(words, heard), text: heard });
    };
    stopFn = () => r.stop();
    try { r.start(); } catch { stopFn = null; }
  });

  box.append(b, live);
  return box;
}
