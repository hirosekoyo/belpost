const CACHE_NAME = 'belpost-v1';
const urlsToCache = [
  '/',
  '/admin',
  '/admin/dashboard',
  '/admin/stats',
  '/admin/waiting',
  '/admin/record'
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
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
}); 