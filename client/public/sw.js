// Hook Line Studio Service Worker for PWA functionality
const CACHE_NAME = 'hook-line-studio-v1';
const STATIC_CACHE_NAME = 'hook-line-studio-static-v1';
const DYNAMIC_CACHE_NAME = 'hook-line-studio-dynamic-v1';

// Files to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  // Add critical CSS/JS files here when generated
];

// Runtime caching patterns
const CACHE_STRATEGIES = {
  images: {
    cacheName: 'hook-studio-images',
    expiration: {
      maxEntries: 100,
      maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
    },
  },
  api: {
    cacheName: 'hook-studio-api',
    expiration: {
      maxEntries: 50,
      maxAgeSeconds: 5 * 60, // 5 minutes
    },
  },
  fonts: {
    cacheName: 'hook-studio-fonts',
    expiration: {
      maxEntries: 10,
      maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
    },
  },
};

// Installation event
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Pre-caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Installation complete');
        // Skip waiting to activate immediately
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Installation failed:', error);
      })
  );
});

// Activation event
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE_NAME && 
                cacheName !== DYNAMIC_CACHE_NAME &&
                !Object.values(CACHE_STRATEGIES).some(strategy => strategy.cacheName === cacheName)) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Claim all clients
      self.clients.claim()
    ])
      .then(() => {
        console.log('[SW] Activation complete');
      })
  );
});

// Fetch event - Network strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Handle different types of requests
  if (url.pathname.startsWith('/api/')) {
    // API requests - Network first with cache fallback
    event.respondWith(handleApiRequest(request));
  } else if (request.destination === 'image') {
    // Images - Cache first with network fallback
    event.respondWith(handleImageRequest(request));
  } else if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    // Fonts - Cache first
    event.respondWith(handleFontRequest(request));
  } else if (url.pathname === '/' || url.pathname.endsWith('.html')) {
    // HTML - Network first with cache fallback
    event.respondWith(handleNavigationRequest(request));
  } else {
    // Static assets - Cache first with network fallback
    event.respondWith(handleStaticRequest(request));
  }
});

// API request handler - Network first
async function handleApiRequest(request) {
  const cache = await caches.open(CACHE_STRATEGIES.api.cacheName);
  
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful API responses (except POST/PUT/DELETE)
      if (request.method === 'GET') {
        cache.put(request, networkResponse.clone());
      }
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] API network failed, trying cache:', request.url);
    
    // Fallback to cache
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline response for API failures
    return new Response(
      JSON.stringify({ 
        error: 'Offline', 
        message: 'No network connection. Please try again when online.' 
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Image request handler - Cache first
async function handleImageRequest(request) {
  const cache = await caches.open(CACHE_STRATEGIES.images.cacheName);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('[SW] Image load failed:', request.url);
    // Return placeholder or error image
    return new Response('', { status: 404 });
  }
}

// Font request handler - Cache first
async function handleFontRequest(request) {
  const cache = await caches.open(CACHE_STRATEGIES.fonts.cacheName);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('[SW] Font load failed:', request.url);
    return new Response('', { status: 404 });
  }
}

// Navigation request handler - Network first with cache fallback
async function handleNavigationRequest(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Navigation network failed, trying cache:', request.url);
    
    // Try cache
    const cache = await caches.open(DYNAMIC_CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Fallback to index.html for SPA routing
    const indexResponse = await cache.match('/index.html');
    if (indexResponse) {
      return indexResponse;
    }
    
    // Last resort offline page
    return new Response(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Hook Line Studio - Offline</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { 
              font-family: system-ui, sans-serif; 
              text-align: center; 
              padding: 50px 20px; 
              background: #f8fafc;
              color: #334155;
            }
            .offline-container {
              max-width: 400px;
              margin: 0 auto;
            }
            .offline-icon {
              font-size: 48px;
              margin-bottom: 20px;
            }
            .retry-btn {
              background: #3b82f6;
              color: white;
              border: none;
              padding: 12px 24px;
              border-radius: 8px;
              font-size: 16px;
              cursor: pointer;
              margin-top: 20px;
            }
            .retry-btn:hover {
              background: #2563eb;
            }
          </style>
        </head>
        <body>
          <div class="offline-container">
            <div class="offline-icon">📱</div>
            <h1>You're Offline</h1>
            <p>Hook Line Studio needs an internet connection to work properly.</p>
            <p>Please check your connection and try again.</p>
            <button class="retry-btn" onclick="window.location.reload()">
              Try Again
            </button>
          </div>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    });
  }
}

// Static asset handler - Cache first
async function handleStaticRequest(request) {
  const cache = await caches.open(STATIC_CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('[SW] Static asset load failed:', request.url);
    return new Response('', { status: 404 });
  }
}

// Background sync for failed requests
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('[SW] Background sync triggered');
    event.waitUntil(
      // Handle any queued operations here
      Promise.resolve()
    );
  }
});

// Push notification handling
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: data.tag || 'hook-studio-notification',
    requireInteraction: false,
    actions: data.actions || []
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // If there's already a window open, focus it
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Message handling from client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_HOOK') {
    // Cache a specific hook for offline access
    const hookData = event.data.payload;
    caches.open('hook-studio-offline-hooks').then(cache => {
      cache.put(
        `/hooks/${hookData.id}`,
        new Response(JSON.stringify(hookData), {
          headers: { 'Content-Type': 'application/json' }
        })
      );
    });
  }
});

console.log('[SW] Service Worker loaded');