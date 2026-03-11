const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const redisService = require('../services/redis.service');
const { generateTokens, setCookies, clearCookie } = require('../utils/jwt.util');

const authenticate = async (req, res, next) => {
    try {
        let accessToken = req.cookies.accessToken;

        if (!accessToken) {
            // Thử refresh nếu có refreshToken
            const refreshToken = req.cookies.refreshToken;
            if (!refreshToken) {
                return res.redirect('/auth/login');
            }
            // Tự động refresh token
            return await handleRefresh(req, res, next, refreshToken);
        }

        // Kiểm tra token có bị blacklist không (logout trước đó)
        const blacklisted = await redisService.isBlacklisted(accessToken);
        if (blacklisted) {
            clearCookie(res);
            return res.redirect('/auth/login');
        }

        const decoded = jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            // Access token hết hạn → thử refresh
            const refreshToken = req.cookies.refreshToken;
            if (refreshToken) {
                return await handleRefresh(req, res, next, refreshToken);
            }
        }
        clearCookie(res);
        return res.redirect('/auth/login');
    }
};

const handleRefresh = async (req, res, next, refreshToken) => {
    try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

        // Kiểm tra refreshToken trong Redis
        const storedToken = await redisService.getRefreshToken(decoded.userId);
        if (storedToken !== refreshToken || !storedToken) {
            clearCookie(res);
            return res.redirect('/auth/login');
        }

        const user = await User.findById(decoded.userId);
        if (!user || !user.isActive) {
            clearCookie(res);
            return res.redirect('/auth/login');
        }

        const { accessToken: newAccess, refreshToken: newRefresh } = generateTokens(user._id, user.role);

        // Rotate refresh token (bảo mật hơn)
        await redisService.saveRefreshToken(user._id, newRefresh);
        setCookies(res, newAccess, newRefresh);
        req.user = { userId: user._id.toString(), role: user.role };
        next();
    } catch {
        clearCookie(res);
        return res.redirect('/auth/login');
    }
};

// Optional auth (không redirect nếu chưa đăng nhập)
const optionalAuth = async (req, res, next) => {
    try {
        const accessToken = req.cookies.accessToken;
        if (!accessToken) return next();
        const blacklisted = await redisService.isBlacklisted(accessToken);
        if (blacklisted) return next();

        const decoded = jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET);
        req.user = decoded;
    } catch { } next();
};

// Middleware kiểm tra role
const authorize = (...roles) => (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
        return res.status(403).render('error', { title: 'Từ chối truy cập', message: 'Bạn không có quyền thực hiện hành động này.', statusCode: 403 });
    }
    next();
};

module.exports = { authenticate, optionalAuth, authorize };