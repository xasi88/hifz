// Работа без сети: сначала сеть, при её отсутствии копия. Имя копии меняется с версией
// (тест сверяет его с js/version.js). Запись звука идёт кусками (Range), её браузер берёт сам.
// Хранилище копий общее у всех приложений на xasi88.github.io: удаляем только свои (hifz-).
// Свои файлы берём с cache: 'no-cache' (скилл «Выкладка»), чтобы новые не смешались со старыми.
const CACHE = 'hifz-2.0.1';
const CORE = [
  './', 'index.html', 'manifest.webmanifest', 'css/tokens.css', 'css/app.css',
  'js/app.js', 'js/ui.js', 'js/arabic.js', 'js/progress.js', 'js/audio.js', 'js/voice.js',
  'js/study.js', 'js/rounds.js', 'js/version.js', 'js/data/istikhara.js',
  'fonts/hafs.woff2', 'icons/icon.svg', 'icons/icon-192.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE.map((u) => new Request(u, { cache: 'no-cache' })))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k.startsWith('hifz-') && k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || req.headers.has('range') || new URL(req.url).origin !== location.origin) return;
  e.respondWith(fetch(req.mode === 'navigate' ? req : new Request(req, { cache: 'no-cache' }))
    .then((res) => {
      if (res.ok && res.status === 200) {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
      }
      return res;
    })
    .catch(() => caches.match(req, { ignoreSearch: true })));
});
