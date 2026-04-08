// ============================================================
//  ⌨️ SHARED KEYBOARD SHORTCUT ENGINE v3
//  Dùng chung cho index.html & thong-ke.html
//  CÙNG 1 BẢNG PHÍM TẮT — không cần nhớ riêng
//  Cấu hình lưu trong localStorage('tk-settings').shortcuts
// ============================================================
(function () {
    'use strict';

    // --- Detect current page ---
    var _p = window.location.pathname.toLowerCase();
    var PAGE = _p.includes('thong-ke') ? 'thong-ke' : _p.includes('phan-ung') ? 'phan-ung' : 'index';

    // ═══════════════════════════════════════════════════════
    //  BẢNG PHÍM TẮT THỐNG NHẤT (dùng chung cả 2 trang)
    // ═══════════════════════════════════════════════════════
    var SHORTCUTS = [
        { id: 'reload', key: 'r', label: 'Tải lại dữ liệu', icon: 'fa-rotate-right' },
        { id: 'nhap-lieu', key: 'i', label: 'Nhập lệnh', icon: 'fa-pen-to-square' },
        { id: 'history', key: 'h', label: 'Lịch sử lệnh', icon: 'fa-list-ul' },
        { id: 'dashboard', key: 'd', label: 'Dashboard Thống kê', icon: 'fa-chart-simple' },
        { id: 'playbook-win', key: 'w', label: 'Playbook Win', icon: 'fa-trophy' },
        { id: 'playbook-loss', key: 'x', label: 'Playbook Loss', icon: 'fa-skull-crossbones' },
        { id: 'compare', key: 'c', label: 'So sánh Split View', icon: 'fa-scale-balanced' },
        { id: 'settings', key: 's', label: 'Cài đặt', icon: 'fa-gear' },
        { id: 'notes', key: 'n', label: 'Ghi chú Notes', icon: 'fa-book-open' },
        { id: 'phan-ung', key: 'u', label: 'Mẫu hình PƯ', icon: 'fa-diagram-project' },
        { id: 'help', key: '?', label: 'Bảng phím tắt', icon: 'fa-keyboard' },
        { id: 'logout', key: 'l', label: 'Đăng xuất', icon: 'fa-right-from-bracket' },
    ];

    // [OPT-1] Trang nào xử lý local → dùng Set cho O(1) lookup
    var LOCAL_MAP = {
        'index': { reload: 1, 'nhap-lieu': 1, history: 1, help: 1, logout: 1, 'phan-ung': 1 },
        'thong-ke': { reload: 1, dashboard: 1, 'playbook-win': 1, 'playbook-loss': 1, compare: 1, settings: 1, notes: 1, help: 1, logout: 1, 'phan-ung': 1 },
        'phan-ung': { reload: 1, help: 1, 'phan-ung': 1, 'nhap-lieu': 1, history: 1, dashboard: 1, 'playbook-win': 1, 'playbook-loss': 1, compare: 1, settings: 1, notes: 1, logout: 1 }
    };

    // ═══════════════════════════════════════════════════════
    //  Đọc cấu hình phím tắt từ localStorage (shared)
    // ═══════════════════════════════════════════════════════
    window._shortcutEnabled = true;

    // [OPT-2] Cache key map, invalidate khi settings thay đổi
    var _cachedKeyMap = null;
    var _cacheTime = 0;
    var CACHE_TTL = 10000; // 10s

    function getDefaultKeyMap() {
        var map = {};
        for (var i = 0; i < SHORTCUTS.length; i++) map[SHORTCUTS[i].id] = SHORTCUTS[i].key;
        return map;
    }

    function getKeyMap() {
        var now = Date.now();
        if (_cachedKeyMap && (now - _cacheTime) < CACHE_TTL) return _cachedKeyMap;

        var defaults = getDefaultKeyMap();
        try {
            var saved = localStorage.getItem('tk-settings');
            if (saved) {
                var parsed = JSON.parse(saved);
                if (parsed.shortcuts) {
                    for (var k in parsed.shortcuts) {
                        if (parsed.shortcuts.hasOwnProperty(k)) defaults[k] = parsed.shortcuts[k];
                    }
                }
            }
        } catch (e) { }
        _cachedKeyMap = defaults;
        _cacheTime = now;
        return defaults;
    }

    // [OPT-3] Invalidate cache khi settings modal lưu
    window.invalidateShortcutCache = function () { _cachedKeyMap = null; _cacheTime = 0; };

    // Expose
    window.getSharedShortcuts = getKeyMap;
    window.SHORTCUT_DEFAULTS = getDefaultKeyMap();

    // ═══════════════════════════════════════════════════════
    //  Thực thi phím tắt (tự chuyển trang nếu cần)
    // ═══════════════════════════════════════════════════════
    function call(fn) {
        var args = Array.prototype.slice.call(arguments, 1);
        if (typeof window[fn] === 'function') { window[fn].apply(null, args); return true; }
        return false;
    }

    function isLocal(action) {
        var map = LOCAL_MAP[PAGE];
        return map ? !!map[action] : false;
    }

    // [OPT-4] Chuyển trang thông minh — truyền action qua hash
    // để trang đích tự thực hiện action khi load xong
    function navigateWithAction(url, action) {
        window.location.href = url + '#sc=' + action;
    }

    function executeShortcut(action) {
        if (PAGE === 'index') {
            switch (action) {
                case 'reload': call('reloadData'); break;
                case 'nhap-lieu': call('switchTab', 'form'); break;
                case 'history': call('switchTab', 'history'); break;
                case 'dashboard': navigateWithAction('./thong-ke.html', 'dashboard'); break;
                case 'playbook-win': navigateWithAction('./thong-ke.html', 'playbook-win'); break;
                case 'playbook-loss': navigateWithAction('./thong-ke.html', 'playbook-loss'); break;
                case 'compare': navigateWithAction('./thong-ke.html', 'compare'); break;
                case 'settings': navigateWithAction('./thong-ke.html', 'settings'); break;
                case 'notes': navigateWithAction('./thong-ke.html', 'notes'); break;
                case 'phan-ung': window.location.href = './phan-ung.html'; break;
                case 'help': toggleShortcutHelp(); break;
                case 'logout': call('doLogout'); break;
            }
        } else if (PAGE === 'thong-ke') {
            switch (action) {
                case 'reload': call('loadData'); break;
                case 'dashboard': call('switchView', 'dashboard'); break;
                case 'playbook-win': call('switchView', 'win'); break;
                case 'playbook-loss': call('switchView', 'loss'); break;
                case 'compare': call('switchView', 'compare'); break;
                case 'settings': call('openSettingsModal'); break;
                case 'notes': call('openNotesModal'); break;
                case 'nhap-lieu': window.location.href = './index.html'; break;
                case 'history': navigateWithAction('./index.html', 'history'); break;
                case 'phan-ung': window.location.href = './phan-ung.html'; break;
                case 'help': toggleShortcutHelp(); break;
                case 'logout':
                    try { var _s = window.getSettings ? window.getSettings() : {}; if (_s.loginRequired) call('doLogout'); } catch (e) { call('doLogout'); }
                    break;
            }
        } else if (PAGE === 'phan-ung') {
            switch (action) {
                case 'reload': call('loadData'); break;
                case 'nhap-lieu': window.location.href = './index.html'; break;
                case 'history': navigateWithAction('./index.html', 'history'); break;
                case 'dashboard': navigateWithAction('./thong-ke.html', 'dashboard'); break;
                case 'playbook-win': navigateWithAction('./thong-ke.html', 'playbook-win'); break;
                case 'playbook-loss': navigateWithAction('./thong-ke.html', 'playbook-loss'); break;
                case 'compare': navigateWithAction('./thong-ke.html', 'compare'); break;
                case 'settings': navigateWithAction('./thong-ke.html', 'settings'); break;
                case 'notes': navigateWithAction('./thong-ke.html', 'notes'); break;
                case 'phan-ung': call('loadData'); break;
                case 'help': toggleShortcutHelp(); break;
                case 'logout': call('doLogout'); break;
            }
        }
    }

    // [OPT-4b] Khi trang load xong, check hash → tự chạy action
    function processHashAction() {
        var hash = window.location.hash;
        if (!hash || hash.indexOf('#sc=') !== 0) return;
        var action = hash.replace('#sc=', '');
        // Xóa hash để không chạy lại khi F5
        history.replaceState(null, '', window.location.pathname + window.location.search);
        // Delay nhỏ để các function trên trang kịp init
        setTimeout(function () { executeShortcut(action); }, 300);
    }

    // Chạy khi DOM ready hoặc ngay lập tức nếu đã ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', processHashAction);
    } else {
        setTimeout(processHashAction, 100);
    }

    // ═══════════════════════════════════════════════════════
    //  Keydown Listener
    // ═══════════════════════════════════════════════════════
    // [OPT-5] Build reverse lookup (key → action) để O(1)
    function buildKeyActionMap() {
        var km = getKeyMap();
        var reverseMap = {};
        for (var i = 0; i < SHORTCUTS.length; i++) {
            var k = (km[SHORTCUTS[i].id] || SHORTCUTS[i].key).toLowerCase();
            reverseMap[k] = SHORTCUTS[i];
        }
        return reverseMap;
    }

    document.addEventListener('keydown', function (e) {
        if (!window._shortcutEnabled) return;
        var tag = document.activeElement ? document.activeElement.tagName : '';
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
        // [OPT-5b] Check contenteditable
        if (document.activeElement && document.activeElement.isContentEditable) return;

        // Skip modals
        var sm = document.getElementById('settings-modal');
        var nm = document.getElementById('notes-modal');
        if (sm && !sm.classList.contains('hidden')) {
            if (e.key === 'Escape' && typeof window.closeSettingsModal === 'function') window.closeSettingsModal();
            return;
        }
        if (nm && !nm.classList.contains('hidden')) {
            if (e.key === 'Escape' && typeof window.closeNotesModal === 'function') window.closeNotesModal();
            return;
        }
        // Skip SweetAlert & help overlay
        if (document.querySelector('.swal2-container')) return;
        if (e.ctrlKey || e.altKey || e.metaKey) return;

        var reverseMap = buildKeyActionMap();
        var k = e.key.toLowerCase();
        // Đặc biệt: phím '?' = Shift + '/' nên check cả e.key gốc
        var sc = reverseMap[k] || reverseMap[e.key];
        if (sc) {
            e.preventDefault();
            executeShortcut(sc.id);
            var km = getKeyMap();
            showShortcutToast(sc, km[sc.id] || sc.key);
        }
    });

    // ═══════════════════════════════════════════════════════
    //  Toast (hiện phím vừa bấm)
    // ═══════════════════════════════════════════════════════
    function showShortcutToast(sc, key) {
        var toast = document.getElementById('shortcut-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'shortcut-toast';
            toast.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%) translateY(20px);z-index:9999;transition:all 0.2s;opacity:0;pointer-events:none';
            document.body.appendChild(toast);
        }
        var local = isLocal(sc.id);
        var arrow = local ? '' : '<span style="color:#fbbf24;font-size:10px;margin-right:2px">↗</span>';
        toast.innerHTML = '<div style="background:#18181b;border:1px solid #3f3f46;border-radius:10px;padding:8px 16px;display:flex;align-items:center;gap:8px;box-shadow:0 8px 24px rgba(0,0,0,0.5)">'
            + '<kbd style="background:#27272a;border:1px solid #52525b;border-radius:5px;padding:2px 8px;font-family:monospace;font-size:12px;color:#e4e4e7;font-weight:bold">' + key.toUpperCase() + '</kbd>'
            + arrow
            + '<span style="font-size:12px;color:#a1a1aa;font-weight:600">' + sc.label + '</span>'
            + '</div>';
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(-50%) translateY(0)';
        clearTimeout(toast._t);
        toast._t = setTimeout(function () { toast.style.opacity = '0'; toast.style.transform = 'translateX(-50%) translateY(20px)'; }, 1500);
    }

    // ═══════════════════════════════════════════════════════
    //  Help Overlay (CÙNG 1 BẢNG cho cả 2 trang)
    // ═══════════════════════════════════════════════════════
    function toggleShortcutHelp() {
        var overlay = document.getElementById('shortcut-help-overlay');
        if (overlay) { overlay.remove(); return; }

        var km = getKeyMap();
        var rows = '';
        for (var i = 0; i < SHORTCUTS.length; i++) {
            var sc = SHORTCUTS[i];
            var k = km[sc.id] || sc.key;
            var local = isLocal(sc.id);
            var navBadge = local
                ? '<span style="font-size:9px;color:#22c55e;margin-left:auto;margin-right:8px">●</span>'
                : '<span style="font-size:9px;color:#f59e0b;margin-left:auto;margin-right:8px">↗ chuyển trang</span>';

            rows += '<div style="display:flex;align-items:center;padding:7px 0;border-bottom:1px solid #27272a">'
                + '<i class="fa-solid ' + sc.icon + '" style="width:18px;color:#71717a;font-size:12px"></i>'
                + '<span style="font-size:13px;color:#d4d4d8;font-weight:500;margin-left:8px">' + sc.label + '</span>'
                + navBadge
                + '<kbd style="background:#27272a;border:1px solid #52525b;border-radius:6px;padding:3px 10px;font-family:monospace;font-size:13px;color:#e4e4e7;font-weight:bold;min-width:28px;text-align:center">' + k.toUpperCase() + '</kbd>'
                + '</div>';
        }

        var pageLabel = PAGE === 'index' ? 'Nhập Liệu' : PAGE === 'thong-ke' ? 'Thống Kê' : 'Mẫu hình PƯ';
        var pageBg = PAGE === 'index' ? '#3b82f6' : PAGE === 'thong-ke' ? '#8b5cf6' : '#7c3aed';

        overlay = document.createElement('div');
        overlay.id = 'shortcut-help-overlay';
        overlay.style.cssText = 'position:fixed;inset:0;z-index:9990;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.7);backdrop-filter:blur(4px)';
        overlay.onclick = function (e) { if (e.target === overlay) overlay.remove(); };
        overlay.innerHTML = '<div style="background:#18181b;border:1px solid #3f3f46;border-radius:20px;padding:28px;width:420px;max-width:90vw;box-shadow:0 24px 60px rgba(0,0,0,0.6)">'
            + '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">'
            + '<div style="display:flex;align-items:center;gap:10px">'
            + '<div style="width:36px;height:36px;background:linear-gradient(135deg,#3b82f6,#8b5cf6);border-radius:10px;display:flex;align-items:center;justify-content:center">'
            + '<i class="fa-solid fa-keyboard" style="color:white;font-size:15px"></i></div>'
            + '<div>'
            + '<span style="font-size:15px;font-weight:900;color:white">Phím tắt</span>'
            + '<div style="font-size:10px;color:#71717a;margin-top:2px">Đang ở: <span style="background:' + pageBg + ';color:white;font-size:9px;font-weight:900;padding:1px 5px;border-radius:4px">' + pageLabel + '</span></div>'
            + '</div></div>'
            + '<button onclick="document.getElementById(\'shortcut-help-overlay\').remove()" style="background:#27272a;border:none;border-radius:8px;width:30px;height:30px;color:#71717a;cursor:pointer;font-size:14px">✕</button>'
            + '</div>'
            + '<div style="display:flex;gap:16px;margin-bottom:12px;padding:8px 12px;background:#27272a;border-radius:8px">'
            + '<span style="font-size:10px;color:#a1a1aa"><span style="color:#22c55e">●</span> Thực hiện ngay</span>'
            + '<span style="font-size:10px;color:#a1a1aa"><span style="color:#f59e0b">↗</span> Chuyển trang rồi thực hiện</span>'
            + '</div>'
            + rows
            + '<p style="margin-top:12px;font-size:11px;color:#52525b;text-align:center">'
            + '<i class="fa-solid fa-link" style="margin-right:4px"></i>Bảng phím tắt giống hệt trên cả 2 trang • ESC để đóng</p>'
            + '</div>';
        document.body.appendChild(overlay);
    }

    window.toggleShortcutHelp = toggleShortcutHelp;
    window.showShortcutToast = showShortcutToast;
})();
