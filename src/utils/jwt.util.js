const jwt = require('jsonwebtoken');

const generateTokens = (userId, role) => {
    const accessToken = jwt.sign(
        { userId, role },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: '1h' }   // tăng lên 1h để tránh expire liên tục khi dev
    );
    const refreshToken = jwt.sign(
        { userId },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
    );
    return { accessToken, refreshToken };
};

const setCookies = (res, accessToken, refreshToken) => {
    const isProd = process.env.NODE_ENV === 'production';
    const base = {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? 'strict' : 'lax',  // 'lax' cho phép navigate giữa các trang khi dev
    };
    res.cookie('accessToken', accessToken, {
        ...base,
        maxAge: 60 * 60 * 1000,              // 1 giờ
    });
    res.cookie('refreshToken', refreshToken, {
        ...base,
        maxAge: 7 * 24 * 60 * 60 * 1000,    // 7 ngày
    });
};

const clearCookies = (res) => {
    res.clearCookie('accessToken', { httpOnly: true, sameSite: 'lax' });
    res.clearCookie('refreshToken', { httpOnly: true, sameSite: 'lax' });
};

module.exports = { generateTokens, setCookies, clearCookies };