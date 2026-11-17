// Маленькие помощники экрана: элементы, значки, шапка.
export function h(tag, props, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'html') el.innerHTML = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of kids.flat(Infinity)) {
    if (c != null && c !== false) el.append(c.nodeType ? c : String(c));
  }
  return el;
}

export const ar = (text, cls = '') => h('span', { class: `ar ${cls}`.trim(), lang: 'ar', dir: 'rtl' }, text);

const PATHS = {
  back: '<path d="M15 5l-7 7 7 7"/>',
  go: '<path d="M5 12h13M13 6l6 6-6 6"/>',
  play: '<path d="M8 5v14l11-7z" fill="currentColor"/>',
  stop: '<rect x="7" y="7" width="10" height="10" rx="2" fill="currentColor"/>',
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
  eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  check: '<path d="M5 12l5 5 9-10"/>',
  repeat: '<path d="M4 12a8 8 0 0 1 14-5l2 2M20 12a8 8 0 0 1-14 5l-2-2M20 4v5h-5M4 20v-5h5"/>',
};

export function icon(name) {
  return h('span', {
    class: 'ico', 'aria-hidden': 'true',
    html: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">${PATHS[name]}</svg>`,
  });
}

export function screen(...kids) {
  const app = document.getElementById('app');
  app.replaceChildren(...kids);
  window.scrollTo(0, 0);
}

export function topbar(title, back = '#/') {
  return h('header', { class: 'top' },
    h('a', { class: 'round dark', href: back, 'aria-label': 'Назад' }, icon('back')),
    h('h1', { class: 'top-title' }, title));
}

export const tag = (text, cls = '') => h('span', { class: `tag ${cls}`.trim() }, text);

// Кнопки рядом собраны в одну плитку (правило стиля автора).
export function tile(...buttons) {
  return h('div', { class: 'tile' }, buttons);
}

export function btn(text, onclick, cls = '', ico = null) {
  return h('button', { class: `btn ${cls}`.trim(), type: 'button', onclick }, ico && icon(ico), h('span', {}, text));
}

// Строка арабских слов справа налево; render(слово, номер) рисует одно слово.
export function wordRow(words, render, cls = '') {
  return h('div', { class: `words ${cls}`.trim(), dir: 'rtl', lang: 'ar' }, words.map(render));
}

export const lineText = (line) => line.w.map((x) => x[0]).join(' ') + (line.p ? line.p : '');

export function plural(n, one, few, many) {
  const a = n % 10, b = n % 100;
  if (a === 1 && b !== 11) return one;
  if (a >= 2 && a <= 4 && (b < 10 || b >= 20)) return few;
  return many;
}
