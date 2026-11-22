const CACHE_NAME = 'my-morning-news-v7';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './news-data.json',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('news-data.json')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put('./news-data.json', clone);
            });
          }
          return response;
        })
        .catch(() =>
          caches.match('./news-data.json', { ignoreSearch: true })
            .then((res) => res || caches.match(event.request, { ignoreSearch: true }))
        )
    );
    return;
  }

  // Network first for HTML to pick up UI changes, fallback to cache ignoring query strings
  if (event.request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put('./index.html', clone));
          }
          return response;
        })
        .catch(() =>
          caches.match('./index.html', { ignoreSearch: true })
            .then((res) => res || caches.match(event.request, { ignoreSearch: true }))
        )
    );
    return;
  }

  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then((cachedResponse) => {
      return cachedResponse || fetch(event.request);
    })
  );
});
