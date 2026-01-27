const CACHE_NAME = 'rb-hybrid-v2'; // ← バージョンを v2 に変更（これで古いキャッシュを捨てさせる）
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './icon.jpg' // ← これを追加！忘れずにな
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  );
});
