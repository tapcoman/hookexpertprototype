// Service worker clear script
self.addEventListener('install', function(event) {
  // Force the service worker to activate immediately
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    // Clear all caches
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          console.log('Deleting cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(function() {
      // Take control of all pages
      return self.clients.claim();
    })
  );
});

// Clear all API caches
self.addEventListener('fetch', function(event) {
  if (event.request.url.includes('/api/')) {
    // Force fresh network request for all API calls
    event.respondWith(fetch(event.request));
  }
});