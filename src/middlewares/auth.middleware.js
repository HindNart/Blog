const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const redisService = require('../services/redis.service');
const { generateTokens, setCookies, clearCookies } = require('../utils/jwt.util');

// ─── Verify access token (sync, no DB) ──────────────────────
function verifyAccess(token) {
    try {
        return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    } catch (e) {
        return null; // null = invalid hoặc expired
    }
}

// ─── Verify refresh token (sync, no DB) ─────────────────────
function verifyRefresh(token) {
    try {
        return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch (e) {
        return null;
    }
}

// ─── Cấp lại token mới từ refresh token ─────────────────────
async function issueNewTokens(res, userId, role) {
    const { accessToken, refreshToken } = generateTokens(userId, role);
    // Lưu vào Redis nếu có — nếu Redis down thì bỏ qua, không crash
    try { await redisService.saveRefreshToken(userId, refreshToken); } catch { }
    setCookies(res, accessToken, refreshToken);
    return { accessToken, refreshToken };
}

// ════════════════════════════════════════════════════════════
// authenticate — dùng cho routes yêu cầu login bắt buộc
// ════════════════════════════════════════════════════════════
const authenticate = async (req, res, next) => {
    const accessToken = req.cookies.accessToken;
    const refreshToken = req.cookies.refreshToken;

    // 1. Thử access token trước
    if (accessToken) {
        const decoded = verifyAccess(accessToken);
        if (decoded) {
            // Kiểm tra blacklist (logout) — nếu Redis down thì cho qua
            try {
                const bl = await redisService.isBlacklisted(accessToken);
                if (bl) { clearCookies(res); return res.redirect('/auth/login'); }
            } catch { }
            req.user = decoded;
            return next();
        }
    }

    // 2. Access token hết hạn/không có → thử refresh token
    if (!refreshToken) {
        clearCookies(res);
        return res.redirect('/auth/login');
    }

    const refreshDecoded = verifyRefresh(refreshToken);
    if (!refreshDecoded) {
        clearCookies(res);
        return res.redirect('/auth/login');
    }

    // 3. Kiểm tra refresh token trong Redis (nếu Redis available)
    try {
        const stored = await redisService.getRefreshToken(refreshDecoded.userId);
        if (stored !== null && stored !== refreshToken) {
            // Redis available VÀ token không khớp → invalid
            clearCookies(res);
            return res.redirect('/auth/login');
        }
    } catch {
        // Redis down → bỏ qua kiểm tra, tin vào JWT signature
    }

    // 4. Lấy user từ DB
    try {
        const user = await User.findById(refreshDecoded.userId).select('_id role isActive').lean();
        if (!user || !user.isActive) {
            clearCookies(res);
            return res.redirect('/auth/login');
        }
        await issueNewTokens(res, user._id, user.role);
        req.user = { userId: user._id, role: user.role };
        return next();
    } catch {
        clearCookies(res);
        return res.redirect('/auth/login');
    }
};

// ════════════════════════════════════════════════════════════
// optionalAuth — dùng cho mọi route, KHÔNG redirect
// Luôn gọi next() dù có user hay không
// ════════════════════════════════════════════════════════════
const optionalAuth = async (req, res, next) => {
    const accessToken = req.cookies.accessToken;
    const refreshToken = req.cookies.refreshToken;

    // 1. Thử access token
    if (accessToken) {
        const decoded = verifyAccess(accessToken);
        if (decoded) {
            try {
                const bl = await redisService.isBlacklisted(accessToken);
                if (!bl) {
                    req.user = decoded;
                    return next();
                }
                // Blacklisted → clear và tiếp tục không có user
                clearCookies(res);
                return next();
            } catch {
                // Redis down → tin JWT, set user
                req.user = decoded;
                return next();
            }
        }
        // Access token invalid/expired → thử refresh
    }

    // 2. Thử refresh token (silent refresh)
    if (!refreshToken) return next(); // chưa đăng nhập

    const refreshDecoded = verifyRefresh(refreshToken);
    if (!refreshDecoded) {
        // Refresh token cũng invalid → clear cookie
        clearCookies(res);
        return next();
    }

    // 3. Kiểm tra Redis (nếu available)
    try {
        const stored = await redisService.getRefreshToken(refreshDecoded.userId);
        if (stored !== null && stored !== refreshToken) {
            clearCookies(res);
            return next();
        }
    } catch {
        // Redis down → bỏ qua, tin JWT
    }

    // 4. Lấy user từ DB và cấp token mới
    try {
        const user = await User.findById(refreshDecoded.userId).select('_id role isActive').lean();
        if (!user || !user.isActive) {
            clearCookies(res);
            return next();
        }
        await issueNewTokens(res, user._id, user.role);
        req.user = { userId: user._id, role: user.role };
    } catch {
        // DB lỗi → tiếp tục không có user, không clear cookie
    }

    return next();
};

// ════════════════════════════════════════════════════════════
// authorize — kiểm tra role
// ════════════════════════════════════════════════════════════
const authorize = (...roles) => (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
        return res.status(403).render('error', {
            title: 'Từ chối truy cập',
            message: 'Bạn không có quyền thực hiện hành động này.',
            statusCode: 403,
        });
    }
    next();
};

module.exports = { authenticate, optionalAuth, authorize };