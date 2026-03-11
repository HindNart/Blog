const jwt = require('jsonwebtoken');

const generateTokens = (userId, role) => {
    const accessToken = jwt.sign(
        { userId, role },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: '15m' });

    const refreshToken = jwt.sign(
        { userId },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: '7d' });

    return { accessToken, refreshToken };
};

const setCookies = (res, accessToken, refreshToken) => {
    // httpOnly: JS phía client không đọc được → chống XSS
    res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // HTTPS only in prod
        sameSite: 'strict',  // Chống CSRF
        maxAge: 15 * 60 * 1000  // 15 phút
    });

    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000  // 7 ngày
    });
};

const clearCookies = (res) => {
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
};

module.exports = {
    generateTokens,
    setCookies,
    clearCookies
};
