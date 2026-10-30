// Match Vision app 3.3 - online first, with the last saved copy when there is no internet.
// feed.json is always fetched fresh. Only files of this app are kept (never other websites).
const VERSION = '3.27';
const CACHE = 'mv-app-' + VERSION;
const FILES = ['./', 'index.html', 'manifest.json', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png'];
self.addEventListener('message', event => {
  if (event.data === 'MV_VERSION' && event.ports && event.ports[0]) event.ports[0].postMessage(VERSION);
});
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES)));
  self.skipWaiting();
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('mv-app-') && key !== CACHE).map(key => caches.delete(key)))));
  self.clients.claim();
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  // 3.6.1: videos, pictures and other media go straight to the network, whole and untouched (never cached here)
  if (event.request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.endsWith('feed.json') ||
      url.pathname.includes('/media/') || (/\.(mp4|mov|webm|jpg|jpeg|png|webp)$/i.test(url.pathname) && !url.pathname.includes('/icons/')) || event.request.headers.has('range')) return;
  event.respondWith(fetch(event.request).then(response => {
    if (response.ok) { const copy = response.clone(); caches.open(CACHE).then(cache => cache.put(event.request, copy)); }
    return response;
  }).catch(() => caches.match(event.request).then(response => response || (event.request.mode === 'navigate' ? caches.match('index.html') : undefined))));
});
