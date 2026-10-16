// Match Vision app 2.2.2 - online-first app shell with offline fallback for the last saved files.
const VERSION = '2.2.2';
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
  if (event.request.method !== 'GET' || url.pathname.endsWith('feed.json')) return;
  event.respondWith(fetch(event.request).then(response => {
    if (response.ok) caches.open(CACHE).then(cache => cache.put(event.request, response.clone()));
    return response;
  }).catch(() => caches.match(event.request).then(response => response || caches.match('index.html'))));
});
