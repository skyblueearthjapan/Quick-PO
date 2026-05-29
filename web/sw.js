/* 発注書アプリ service worker — シンプルなアプリシェルのキャッシュ */
const CACHE = 'quick-po-v1';
const SHELL = [
  './',
  './index.html',
  './manifest.json',
  './app/core.jsx',
  './app/themes.jsx',
  './app/ui.jsx',
  './app/screens-create.jsx',
  './app/screens-home.jsx',
  './app/screens-preview.jsx',
  './app/PhoneApp.jsx',
  './brandkit/sakurai-logo-mark.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;                 // never cache POST /api/parse
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;  // let CDN / API go to network
  e.respondWith(
    caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
      return res;
    }).catch(() => caches.match('./index.html')))
  );
});
