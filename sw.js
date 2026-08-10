const CACHE = 'plot-twisted-v20';
const ASSETS = [
  './landing-v4.html', './landing-v2.css', './brand-icons.css', './landing-v3.css', './install.css', './landing-v4.js',
  './privacy.html', './privacy.css',
  './index.html', './game.css', './game.js', './questions.json', './manifest.webmanifest',
  './icon-192.png', './icon-512.png', './icon-maskable-512.png', './apple-touch-icon-180.png'
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
  const isFreshAsset = /landing-v4\.(html|js)$/.test(url.pathname)
    || /landing-v3\.css$/.test(url.pathname)
    || /landing-v2\.css$/.test(url.pathname)
    || /brand-icons\.css$/.test(url.pathname)
    || /install\.css$/.test(url.pathname)
    || /privacy\.(html|css)$/.test(url.pathname)
    || /game\.(css|js)$/.test(url.pathname)
    || /questions\.json$/.test(url.pathname);

  if (request.mode === 'navigate' || isFreshAsset) {
    event.respondWith(
      fetch(request).then(response => {
        const copy = response.clone();
        caches.open(CACHE).then(cache => cache.put(request, copy)).catch(() => {});
        return response;
      }).catch(() => {
        if (request.mode === 'navigate') {
          return caches.match(request).then(cachedPage => {
            if (cachedPage) return cachedPage;
            const isGame = url.pathname.endsWith('/play') || url.pathname.endsWith('/play/') || url.pathname.endsWith('/index.html');
            const isPrivacy = url.pathname.endsWith('/privacy') || url.pathname.endsWith('/privacy/') || url.pathname.endsWith('/privacy.html');
            if (isGame) return caches.match('./index.html');
            if (isPrivacy) return caches.match('./privacy.html');
            return caches.match('./landing-v4.html').then(page => page || caches.match('./index.html'));
          });
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
