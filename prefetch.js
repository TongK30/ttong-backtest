/**
 * ============================================================
 *  🚀 PREFETCH.JS — Tải trước API cho tất cả 3 trang
 *  Khi mở bất kỳ trang nào (index, thong-ke, phan-ung),
 *  script này sẽ silently tải data cho 2 trang còn lại
 *  và cache vào localStorage. Khi chuyển trang → instant load.
 * ============================================================
 */
(function () {
    'use strict';

    // ===== CẤU HÌNH API =====
    const PREFETCH_CONFIG = {
        // API dùng cho Index + Thống kê (history data)
        API_HISTORY: "https://script.google.com/macros/s/AKfycbz-49U_LeCndCd1zR63A14eUEubPBJQ5ClWS75D4_Bi7_uERKXk3IERKXAPT5V0mRkW/exec",
        // API dùng cho Thống kê (primary/block10 data)
        API_THONGKE: "https://script.google.com/macros/s/AKfycbzFbTYhhgSevExqO7eS_BaeJYrhya_29MWzukuVCYeWz8Y9h4Rl85MQstYK3OhHkr2-Og/exec",
        // API dùng cho Phản ứng 
        API_PHANUNG_PRIMARY: "https://script.google.com/macros/s/AKfycbxL8WrU5YfmRA77dD8TnoFXKCkr-VmE4ttZYVvjA_uS9nXF5qtdx5d7H7Hj0EKujvYlMA/exec",
        API_PHANUNG_SECONDARY: "https://script.google.com/macros/s/AKfycbz4wW8RLRipmtqbViIRXOxrdeV9SyPSmeaDE_4FM1OZt0ABxLET4Ja90P7rZKzCsAFvgw/exec",

        // Cache keys
        CACHE_KEYS: {
            HISTORY: 'tk-history-cache',
            PRIMARY: 'tk-primary-cache',
            PHANUNG: 'tk-phanung-cache',
        },

        // Thời gian tối thiểu giữa 2 lần prefetch (tránh spam)
        COOLDOWN_MS: 2 * 60 * 1000, // 2 phút
        COOLDOWN_KEY: 'tk-prefetch-ts',
    };

    // ===== DETECT TRANG HIỆN TẠI =====
    const currentPage = (function () {
        const path = window.location.pathname.toLowerCase();
        if (path.includes('thong-ke')) return 'thongke';
        if (path.includes('phan-ung')) return 'phanung';
        if (path.includes('index') || path.endsWith('/')) return 'index';
        return 'unknown';
    })();

    // ===== HELPER: Safe fetch with timeout =====
    function safeFetch(url, timeoutMs = 15000) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        return fetch(url, { signal: controller.signal })
            .then(r => r.json())
            .finally(() => clearTimeout(timer));
    }

    // ===== PREFETCH LOGIC =====
    function prefetchAll() {
        // Kiểm tra cooldown
        try {
            const lastTs = parseInt(localStorage.getItem(PREFETCH_CONFIG.COOLDOWN_KEY) || '0');
            if (Date.now() - lastTs < PREFETCH_CONFIG.COOLDOWN_MS) {
                console.log('[Prefetch] ⏳ Cooldown - skip prefetch');
                return;
            }
        } catch (e) { }

        console.log(`[Prefetch] 🚀 Đang prefetch API cho tất cả trang (current: ${currentPage})`);
        localStorage.setItem(PREFETCH_CONFIG.COOLDOWN_KEY, String(Date.now()));

        const tasks = [];

        // 1. Prefetch History data (dùng cho index + thong-ke)
        if (!localStorage.getItem(PREFETCH_CONFIG.CACHE_KEYS.HISTORY) || currentPage !== 'index') {
            tasks.push(
                safeFetch(PREFETCH_CONFIG.API_HISTORY + "?mode=history&_t=" + Date.now())
                    .then(data => {
                        if (Array.isArray(data) && data.length > 0) {
                            try { localStorage.setItem(PREFETCH_CONFIG.CACHE_KEYS.HISTORY, JSON.stringify(data)); } catch (e) { }
                            console.log(`[Prefetch] ✅ History: ${data.length} items cached`);
                        }
                    })
                    .catch(e => console.warn('[Prefetch] ⚠️ History failed:', e.message))
            );
        }

        // 2. Prefetch Primary/Block10 data (dùng cho thong-ke)
        if (!localStorage.getItem(PREFETCH_CONFIG.CACHE_KEYS.PRIMARY) || currentPage !== 'thongke') {
            tasks.push(
                safeFetch(PREFETCH_CONFIG.API_THONGKE + "?mode=history&_t=" + Date.now())
                    .then(data => {
                        if (Array.isArray(data) && data.length > 0) {
                            try { localStorage.setItem(PREFETCH_CONFIG.CACHE_KEYS.PRIMARY, JSON.stringify(data)); } catch (e) { }
                            console.log(`[Prefetch] ✅ Primary: ${data.length} items cached`);
                        }
                    })
                    .catch(e => console.warn('[Prefetch] ⚠️ Primary failed:', e.message))
            );
        }

        // 3. Prefetch Phản ứng data
        if (!localStorage.getItem(PREFETCH_CONFIG.CACHE_KEYS.PHANUNG) || currentPage !== 'phanung') {
            // Thử endpoint chính trước
            tasks.push(
                safeFetch(PREFETCH_CONFIG.API_PHANUNG_PRIMARY + "?mode=api&sheet=phan_ung")
                    .then(data => {
                        let items = null;
                        if (Array.isArray(data) && data.length > 0) items = data;
                        else if (data?.data && Array.isArray(data.data) && data.data.length > 0) items = data.data;

                        if (items) {
                            try { localStorage.setItem(PREFETCH_CONFIG.CACHE_KEYS.PHANUNG, JSON.stringify(items)); } catch (e) { }
                            console.log(`[Prefetch] ✅ Phản ứng: ${items.length} items cached`);
                        } else {
                            // Fallback sang API secondary
                            return safeFetch(PREFETCH_CONFIG.API_PHANUNG_SECONDARY + "?mode=api&sheet=phan_ung")
                                .then(data2 => {
                                    let items2 = null;
                                    if (Array.isArray(data2) && data2.length > 0) items2 = data2;
                                    else if (data2?.data && Array.isArray(data2.data) && data2.data.length > 0) items2 = data2.data;
                                    if (items2) {
                                        try { localStorage.setItem(PREFETCH_CONFIG.CACHE_KEYS.PHANUNG, JSON.stringify(items2)); } catch (e) { }
                                        console.log(`[Prefetch] ✅ Phản ứng (secondary): ${items2.length} items cached`);
                                    }
                                });
                        }
                    })
                    .catch(e => console.warn('[Prefetch] ⚠️ Phản ứng failed:', e.message))
            );
        }

        Promise.allSettled(tasks).then(() => {
            console.log('[Prefetch] 🏁 Prefetch hoàn tất!');
        });
    }

    // ===== KHỞI CHẠY =====
    // Delay 1.5s sau page load để không ảnh hưởng trang chính
    if (document.readyState === 'complete') {
        setTimeout(prefetchAll, 1500);
    } else {
        window.addEventListener('load', () => setTimeout(prefetchAll, 1500));
    }

    // Export cho debug
    window.__prefetchConfig = PREFETCH_CONFIG;
})();
