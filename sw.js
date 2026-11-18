const CACHE = 'plot-twisted-v28';
const ASSETS = [
  './index.html', './game.html', './privacy.html', './manifest.webmanifest',
  './assets/css/landing.css', './assets/css/game.css', './assets/css/privacy.css',
  './assets/css/desktop-expansion.css', './assets/css/wide-desktop-categories.css', './assets/css/cinema-polish.css',
  './assets/js/landing.js', './assets/js/game.js', './assets/js/category-expansion.js',
  './assets/js/mobile-feedback-polish.js', './assets/js/cinema-icons.js', './assets/js/cinema-polish.js',
  './assets/data/questions.json',
  './assets/images/icon-marquee-192.png', './assets/images/icon-marquee-512.png',
  './assets/images/icon-marquee-maskable-512.png', './assets/images/apple-touch-icon-marquee-180.png',
  './assets/images/favicon-marquee-48.png'
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
  const isFreshAsset = /assets\/(css|js|data|images)\//.test(url.pathname)
    || /privacy\.(html|css)$/.test(url.pathname)
    || /game\.(html|css|js)$/.test(url.pathname)
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
            const isGame = url.pathname.endsWith('/play') || url.pathname.endsWith('/play/') || url.pathname.endsWith('/game.html');
            const isPrivacy = url.pathname.endsWith('/privacy') || url.pathname.endsWith('/privacy/') || url.pathname.endsWith('/privacy.html');
            if (isGame) return caches.match('./game.html');
            if (isPrivacy) return caches.match('./privacy.html');
            return caches.match('./index.html');
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
