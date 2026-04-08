/**
 * ============================================================
 *  📱 SERVICE WORKER — Trading Journal PWA
 *  Cache tất cả assets để xem offline trên điện thoại
 * ============================================================
 */

const CACHE_NAME = 'smcv2-cache-v1';

// Danh sách file local cần cache
const LOCAL_FILES = [
    './',
    './index.html',
    './thong-ke.html',
    './phan-ung.html',
    './shortcuts.js',
    './prefetch.js',
    './manifest.json',
];

// Danh sách CDN cần cache
const CDN_FILES = [
    'https://cdn.tailwindcss.com',
    'https://cdn.jsdelivr.net/npm/chart.js',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap',
    'https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css',
    'https://cdn.jsdelivr.net/npm/flatpickr',
    'https://cdn.jsdelivr.net/npm/sweetalert2@11',
    'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
    'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js',
];

// ===== INSTALL: Cache tất cả assets =====
self.addEventListener('install', event => {
    console.log('[SW] Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            // Cache local files
            const localPromise = cache.addAll(LOCAL_FILES).catch(err => {
                console.warn('[SW] Một số local files không cache được:', err);
            });

            // Cache CDN files (từng file riêng, không fail toàn bộ)
            const cdnPromises = CDN_FILES.map(url =>
                fetch(url, { mode: 'cors' })
                    .then(response => {
                        if (response.ok) {
                            return cache.put(url, response);
                        }
                    })
                    .catch(err => console.warn(`[SW] CDN cache skip: ${url}`, err.message))
            );

            return Promise.all([localPromise, ...cdnPromises]);
        }).then(() => {
            console.log('[SW] ✅ Cached tất cả assets!');
            return self.skipWaiting();
        })
    );
});

// ===== ACTIVATE: Xóa cache cũ =====
self.addEventListener('activate', event => {
    console.log('[SW] Activating...');
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
            )
        ).then(() => self.clients.claim())
    );
});

// ===== FETCH: Network First cho API, Cache First cho assets =====
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    // Google Apps Script API → Network First (gọi API thật, nếu fail thì dùng cache)
    if (url.hostname.includes('script.google.com')) {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    // Clone response để cache
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, clone);
                    });
                    return response;
                })
                .catch(() => {
                    // Offline → trả cached API response
                    return caches.match(event.request).then(cached => {
                        if (cached) return cached;
                        // Nếu không có cache API, trả JSON rỗng
                        return new Response('[]', {
                            headers: { 'Content-Type': 'application/json' }
                        });
                    });
                })
        );
        return;
    }

    // Google Fonts CSS/WOFF → Cache First
    if (url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')) {
        event.respondWith(
            caches.match(event.request).then(cached => {
                if (cached) return cached;
                return fetch(event.request).then(response => {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                    return response;
                }).catch(() => new Response('', { status: 503 }));
            })
        );
        return;
    }

    // CDN + Local files → Stale While Revalidate
    event.respondWith(
        caches.match(event.request).then(cached => {
            const fetchPromise = fetch(event.request).then(response => {
                // Cache response mới
                if (response.ok) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                }
                return response;
            }).catch(() => {
                // Offline, không có cached → fallback
                if (!cached) {
                    // Nếu request HTML → redirect về index cached
                    if (event.request.headers.get('accept')?.includes('text/html')) {
                        return caches.match('./index.html');
                    }
                }
                return cached;
            });

            // Trả cached ngay, fetch ngầm cập nhật
            return cached || fetchPromise;
        })
    );
});
