const CACHE_NAME = 'rb-hybrid-v1';
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon.png'
];

// 1. Install Event: 最小限のファイルをキャッシュ
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching App Shell');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// 2. Activate Event: 古いキャッシュを削除
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

// 3. Fetch Event: ネットワーク優先、失敗したらキャッシュ (Network First Strategy)
self.addEventListener('fetch', (event) => {
  // FirestoreやAuthの通信はキャッシュしない（リアルタイム性重視）
  if (event.request.url.includes('firestore.googleapis.com') || 
      event.request.url.includes('googleapis.com') ||
      event.request.url.includes('google-analytics.com')) {
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return fetch(event.request)
        .then((response) => {
          // CDNなどの外部リソースも動的にキャッシュに追加する
          if (response.status === 200) {
            cache.put(event.request, response.clone());
          }
          return response;
        })
        .catch(() => {
          // オフライン時はキャッシュから返す
          return cache.match(event.request);
        });
    })
  );
});
