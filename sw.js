const CACHE = 'plot-twisted-v13';
const ASSETS = [
  './landing-v3.html', './landing-v2.css', './brand-icons.css', './landing-v3.css', './landing-v3.js',
  './social-preview.svg', './index.html', './manifest.webmanifest',
  './icon-192.png', './icon-512.png', './icon-maskable-512.png',
  './apple-touch-icon-180.png', './og-image.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  const isLandingAsset = /landing-v3\.(html|css|js)$/.test(url.pathname)
    || /landing-v2\.css$/.test(url.pathname)
    || /brand-icons\.css$/.test(url.pathname)
    || /social-preview\.svg$/.test(url.pathname);

  if (request.mode === 'navigate' || isLandingAsset) {
    event.respondWith(
      fetch(request).then(response => {
        const copy = response.clone();
        caches.open(CACHE).then(cache => cache.put(request, copy)).catch(() => {});
        return response;
      }).catch(() => {
        if (request.mode === 'navigate') {
          const isGame = url.pathname.endsWith('/play') || url.pathname.endsWith('/play/') || url.pathname.endsWith('/index.html');
          return isGame
            ? caches.match('./index.html')
            : caches.match('./landing-v3.html').then(page => page || caches.match('./index.html'));
        }
        return caches.match(request);
      })
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(hit => hit || fetch(request).then(response => {
      const copy = response.clone();
      caches.open(CACHE).then(cache => cache.put(request, copy)).catch(() => {});
      return response;
    }))
  );
});
