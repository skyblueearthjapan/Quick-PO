/* 発注書アプリ service worker — ネットワーク優先（オンライン時は常に最新） */
const CACHE = 'quick-po-v3';
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
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).catch(() => {}));
});

self.addEventListener('activate', (e) => {
  // 古いバージョンのキャッシュを全削除（更新が確実に反映されるように）
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;                 // POST /api/parse 等はそのまま
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;  // CDN / API はネットワークへ

  // ネットワーク優先：オンラインなら常に最新を取得し、キャッシュも更新。
  // オフライン時のみキャッシュ（最後の手段として index.html）を返す。
  e.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(req).then((hit) => hit || caches.match('./index.html')))
  );
});
