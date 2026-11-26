const CACHE_NAME = 'au-whv-tracker-v1';
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json'
];

// 安裝時快取核心網頁檔案
self.addEventListener('install', function(event) {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(CORE_ASSETS);
    })
  );
});

// 啟動時清理舊版快取
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE_NAME; })
            .map(function(k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

// 網路優先策略：有網路時抓最新版（確保你在 GitHub 一改程式碼就同步更新），沒網路時自動讀快取秒開
self.addEventListener('fetch', function(event) {
  if (event.request.method !== 'GET') return;
  // Firebase 與外部匯率 API 不走靜態快取
  if (event.request.url.includes('firebase') || event.request.url.includes('er-api.com') || event.request.url.includes('openstreetmap')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(function(networkRes) {
        const resClone = networkRes.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(event.request, resClone);
        });
        return networkRes;
      })
      .catch(function() {
        return caches.match(event.request);
      })
  );
});
