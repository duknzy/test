const CACHE_NAME = 'rb-hybrid-v3'; // バージョンを上げておく
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  // ★重要：Firestore, Google API, そして「.mp4」はService Workerを通さない（スルーさせる）
  if (url.includes('firestore.googleapis.com') || 
      url.includes('googleapis.com') ||
      url.includes('google-analytics.com') ||
      url.endsWith('.mp4')) { // ← ここに .mp4 除外を追加した
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return fetch(event.request)
        .then((response) => {
          if (response.status === 200) {
            cache.put(event.request, response.clone());
          }
          return response;
        })
        .catch(() => {
          return cache.match(event.request);
        });
    })
  );
});
