/**
 * SMC-2026 Auth Guard
 * Thêm <script src="./auth.js"></script> vào đầu <body> của mọi trang cần bảo vệ
 */
(function () {
    const SESSION_KEY = 'smc_auth';
    const SESSION_TTL = 8 * 60 * 60 * 1000; // 8 tiếng

    function getSession() {
        try {
            const raw = localStorage.getItem(SESSION_KEY);
            if (!raw) return null;
            const s = JSON.parse(raw);
            if (Date.now() > s.exp) {
                localStorage.removeItem(SESSION_KEY);
                return null;
            }
            return s;
        } catch { return null; }
    }

    // Nếu chưa đăng nhập → redirect ngay
    if (!getSession()) {
        const current = encodeURIComponent(window.location.pathname + window.location.search);
        window.location.replace('./login.html?redirect=' + current);
    }

    // Hàm logout dùng toàn cục
    window.smc_logout = function () {
        localStorage.removeItem(SESSION_KEY);
        window.location.replace('./login.html');
    };

    // Hàm lấy thông tin user hiện tại
    window.smc_user = function () {
        const s = getSession();
        return s ? s.user : null;
    };
})();
