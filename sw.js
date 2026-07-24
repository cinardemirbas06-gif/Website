// Kişisel Panel için minimal, "network-first" servis çalışanı.
// Amaç: çevrimdışıyken panel kabuğunun (shell) açılabilmesini sağlamak.
// Supabase/CDN isteklerine dokunmaz; her zaman önce ağı dener, ağ yoksa önbelleğe düşer.
const CACHE_VERSION = 'panel-cache-v1';
const APP_SHELL = [
    '/dashboard.html',
    '/money.html',
    '/planner.html',
    '/analysis.html',
    '/notes.html',
    '/login.html',
    '/dashboard.css',
    '/dashboard.js',
    '/supabase.js'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_SHELL)).catch(() => {})
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key)))
        )
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Sadece kendi sunucumuzdan gelen, panel kabuğu dosyalarını yönet.
    if (url.origin !== self.location.origin || !APP_SHELL.includes(url.pathname)) {
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                const clone = response.clone();
                caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, clone));
                return response;
            })
            .catch(() => caches.match(event.request))
    );
});
