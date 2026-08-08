const CACHE_NAME = 'retraq-v5';
const ASSETS = [
    './',
    './index.html',
    './manifest.json',
    './css/style.css',
    './assets/icons/favicon.png',
    './js/utils.js',
    './js/components.js',
    './js/db.js',
    './js/tasks.js',
    './js/notes.js',
    './js/bilinks.js',
    './js/capture.js',
    './js/inbox.js',
    './js/daily-notes.js',
    './js/library.js',
    './js/areas.js',
    './js/search.js',
    './js/habits.js',
    './js/review.js',
    './js/projects.js',
    './js/project-detail.js',
    './js/dashboard.js',
    './js/app.js'
];

self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open(CACHE_NAME).then(function(cache) {
            return cache.addAll(ASSETS);
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', function(event) {
    event.waitUntil(
        caches.keys().then(function(keys) {
            return Promise.all(
                keys.filter(function(key) { return key !== CACHE_NAME; })
                    .map(function(key) { return caches.delete(key); })
            );
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', function(event) {
    if (event.request.method !== 'GET') return;

    event.respondWith(
        caches.match(event.request).then(function(cached) {
            var fetchPromise = fetch(event.request).then(function(response) {
                if (response && response.status === 200 && response.type === 'basic') {
                    var clone = response.clone();
                    caches.open(CACHE_NAME).then(function(cache) {
                        cache.put(event.request, clone);
                    });
                }
                return response;
            }).catch(function() {
                return cached;
            });

            return cached || fetchPromise;
        })
    );
});
