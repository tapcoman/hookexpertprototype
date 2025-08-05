// Hook Line Studio Service Worker for PWA functionality
const CACHE_NAME = 'hook-line-studio-v2';
const STATIC_CACHE_NAME = 'hook-line-studio-static-v2';
const DYNAMIC_CACHE_NAME = 'hook-line-studio-dynamic-v2';

// Files to cache immediately - only include files that actually exist
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/icons/icon-144x144.png',
  // Critical CSS/JS files will be added dynamically from dist directory
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
      .then(async (cache) => {
        console.log('[SW] Pre-caching static assets');
        
        // Cache assets individually with error handling for graceful degradation
        const cachePromises = STATIC_ASSETS.map(async (asset) => {
          try {
            const response = await fetch(asset);
            if (response.ok) {
              await cache.put(asset, response);
              console.log(`[SW] Cached: ${asset}`);
            } else {
              console.warn(`[SW] Failed to fetch (${response.status}): ${asset}`);
            }
          } catch (error) {
            console.warn(`[SW] Error caching ${asset}:`, error.message);
            // Continue installation even if individual assets fail
          }
        });
        
        // Wait for all cache attempts to complete
        await Promise.allSettled(cachePromises);
        
        // Try to cache critical dist assets if they exist
        try {
          const distAssets = await findCriticalDistAssets();
          for (const asset of distAssets) {
            try {
              const response = await fetch(asset);
              if (response.ok) {
                await cache.put(asset, response);
                console.log(`[SW] Cached dist asset: ${asset}`);
              }
            } catch (error) {
              console.warn(`[SW] Could not cache dist asset ${asset}:`, error.message);
            }
          }
        } catch (error) {
          console.warn('[SW] Could not load dist assets:', error.message);
        }
      })
      .then(() => {
        console.log('[SW] Installation complete - service worker ready');
        // Skip waiting to activate immediately
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Installation failed:', error);
        // Still skip waiting to allow service worker to activate
        // This ensures the SW is functional even if caching partially fails
        return self.skipWaiting();
      })
  );
});

// Helper function to find critical dist assets
async function findCriticalDistAssets() {
  const criticalAssets = [];
  
  try {
    // Try to fetch the main HTML to extract asset URLs
    const htmlResponse = await fetch('/index.html');
    if (htmlResponse.ok) {
      const htmlText = await htmlResponse.text();
      
      // Extract CSS and JS file paths from HTML
      const cssMatches = htmlText.match(/href="([^"]*\.css[^"]*)"/g) || [];
      const jsMatches = htmlText.match(/src="([^"]*\.js[^"]*)"/g) || [];
      
      // Clean up the matches and add to critical assets
      cssMatches.forEach(match => {
        const path = match.match(/href="([^"]*)"/)[1];
        if (path.startsWith('/')) criticalAssets.push(path);
      });
      
      jsMatches.forEach(match => {
        const path = match.match(/src="([^"]*)"/)[1];
        if (path.startsWith('/') && !path.includes('main.tsx')) criticalAssets.push(path);
      });
    }
  } catch (error) {
    console.warn('[SW] Could not analyze HTML for dist assets:', error);
  }
  
  return criticalAssets;
}

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
  try {
    const cache = await caches.open(CACHE_STRATEGIES.api.cacheName);
    
    try {
      // Try network first
      const networkResponse = await fetch(request);
      
      if (networkResponse.ok) {
        // Cache successful API responses (except POST/PUT/DELETE)
        if (request.method === 'GET') {
          try {
            await cache.put(request, networkResponse.clone());
          } catch (cacheError) {
            console.warn('[SW] Failed to cache API response:', request.url, cacheError.message);
          }
        }
      }
      
      return networkResponse;
    } catch (networkError) {
      console.log('[SW] API network failed, trying cache:', request.url, networkError.message);
      
      // Fallback to cache
      try {
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
          return cachedResponse;
        }
      } catch (cacheError) {
        console.warn('[SW] Failed to read API cache:', request.url, cacheError.message);
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
  } catch (error) {
    console.error('[SW] API handler error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'ServiceWorkerError', 
        message: 'Service worker encountered an error. Please refresh the page.' 
      }),
      {
        status: 500,
        statusText: 'Internal Server Error',
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Image request handler - Cache first
async function handleImageRequest(request) {
  try {
    const cache = await caches.open(CACHE_STRATEGIES.images.cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    try {
      const networkResponse = await fetch(request);
      if (networkResponse.ok) {
        // Safely attempt to cache the response
        try {
          await cache.put(request, networkResponse.clone());
        } catch (cacheError) {
          console.warn('[SW] Failed to cache image:', request.url, cacheError.message);
        }
      }
      return networkResponse;
    } catch (networkError) {
      console.log('[SW] Image network failed:', request.url, networkError.message);
      return new Response('', { status: 404 });
    }
  } catch (error) {
    console.error('[SW] Image handler error:', error);
    return new Response('', { status: 500 });
  }
}

// Font request handler - Cache first
async function handleFontRequest(request) {
  try {
    const cache = await caches.open(CACHE_STRATEGIES.fonts.cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    try {
      const networkResponse = await fetch(request);
      if (networkResponse.ok) {
        // Safely attempt to cache the response
        try {
          await cache.put(request, networkResponse.clone());
        } catch (cacheError) {
          console.warn('[SW] Failed to cache font:', request.url, cacheError.message);
        }
      }
      return networkResponse;
    } catch (networkError) {
      console.log('[SW] Font network failed:', request.url, networkError.message);
      return new Response('', { status: 404 });
    }
  } catch (error) {
    console.error('[SW] Font handler error:', error);
    return new Response('', { status: 500 });
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

// Static asset handler - Cache first with better error handling
async function handleStaticRequest(request) {
  try {
    const cache = await caches.open(STATIC_CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    try {
      const networkResponse = await fetch(request);
      if (networkResponse.ok) {
        // Safely attempt to cache the response
        try {
          await cache.put(request, networkResponse.clone());
        } catch (cacheError) {
          console.warn('[SW] Failed to cache static asset:', request.url, cacheError.message);
          // Continue even if caching fails
        }
      }
      return networkResponse;
    } catch (networkError) {
      console.log('[SW] Static asset network failed:', request.url, networkError.message);
      
      // For critical assets, try to provide a meaningful fallback
      if (request.url.includes('.css')) {
        return new Response('/* Asset unavailable */', {
          status: 200,
          headers: { 'Content-Type': 'text/css' }
        });
      } else if (request.url.includes('.js')) {
        return new Response('console.warn("Asset unavailable: ' + request.url + '");', {
          status: 200,
          headers: { 'Content-Type': 'application/javascript' }
        });
      }
      
      return new Response('', { status: 404 });
    }
  } catch (error) {
    console.error('[SW] Static asset handler error:', error);
    return new Response('', { status: 500 });
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
  
  if (event.data && event.data.type === 'GET_SW_STATUS') {
    // Return service worker health status
    event.ports[0].postMessage({
      type: 'SW_STATUS_RESPONSE',
      status: 'active',
      cacheNames: {
        static: STATIC_CACHE_NAME,
        dynamic: DYNAMIC_CACHE_NAME,
        api: CACHE_STRATEGIES.api.cacheName,
        images: CACHE_STRATEGIES.images.cacheName,
        fonts: CACHE_STRATEGIES.fonts.cacheName
      },
      staticAssets: STATIC_ASSETS,
      timestamp: Date.now()
    });
  }
});

console.log('[SW] Service Worker loaded');