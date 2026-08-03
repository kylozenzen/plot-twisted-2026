const CACHE = 'plot-twisted-v10';
const ASSETS = [
  './landing.html', './landing.css', './landing.js', './index.html', './manifest.webmanifest',
  './icon-192.png', './icon-512.png', './icon-maskable-512.png',
  './apple-touch-icon-180.png', './og-image.png'
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => { try { c.put(req, copy); } catch (_) {} });
        return res;
      }).catch(() => {
        const path = new URL(req.url).pathname;
        return path.endsWith('/index.html')
          ? caches.match('./index.html')
          : caches.match('./landing.html').then(page => page || caches.match('./index.html'));
      })
    );
    return;
  }

  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => { try { c.put(req, copy); } catch (_) {} });
      return res;
    }))
  );
});
