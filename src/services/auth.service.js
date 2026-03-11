const bcrypt = require('bcrypt');
const User = require('../models/user.model');
const redisService = require('./redis.service');
const mailService = require('./mail.service');
const { generateTokens, setCookies, clearCookies } = require('../utils/jwt.util');
const { generateResetToken, hashToken } = require('../utils/password.util');
const { AppError } = require('../utils/response.util');

const authService = {
    async register({ username, email, password }) {
        const existUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existUser) {
            throw new AppError(existUser.email === data.email ? 'Email đã được sử dụng' : 'Username đã tồn tại', 400);
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({ username, email, password: hashedPassword });
        return user;
    },

    async login({ email, password }, res) {
        const user = await User.findOne({ email }).select('+password');
        if (!user || !(await bcrypt.compare(password, user.password))) {
            throw new AppError('Email hoặc mật khẩu không đúng', 401);
        }

        if (!user.isActive) throw new AppError('Tài khoản đã bị vô hiệu hóa', 403);

        const { accessToken, refreshToken } = generateTokens(user._id, user.role);
        await redisService.saveRefreshToken(user._id, refreshToken);
        setCookies(res, accessToken, refreshToken);
        return user;
    },

    async logout(userId, accessToken, res) {
        await redisService.deleteRefreshToken(userId);
        await redisService.blacklistToken(accessToken);
        clearCookies(res);
    },

    async refreshTokens(userId, refreshToken, res) {
        const stored = await redisService.getRefreshToken(userId);
        if (!stored || stored !== refreshToken) {
            clearCookies(res);
            throw new AppError('Phiên đăng nhập không hợp lệ', 401);
        }
        const user = await User.findById(userId);
        if (!user || !user.isActive) throw new AppError('Tài khoản không tồn tại', 401);

        const { accessToken: newAccess, refreshToken: newRefresh } = generateTokens(user._id, user.role);
        await redisService.saveRefreshToken(user._id, newRefresh);
        setCookies(res, newAccess, newRefresh);
        return user;
    },

    async forgotPassword(email) {
        const user = await User.findOne({ email });
        if (!user) return;
        const { token, hashed, expires } = generateResetToken();
        user.resetPasswordToken = hashed;
        user.resetPasswordExpires = expires;
        await user.save({ validateBeforeSave: false });
        await mailService.sendResetPassword(email, token);
    },

    async resetPassword(token, newPassword) {
        const hashed = hashToken(token);
        const user = await User.findOne({
            resetPasswordToken: hashed,
            resetPasswordExpires: { $gt: Date.now() },
        }).select('+resetPasswordToken +resetPasswordExpires');
        if (!user) throw new AppError('Token không hợp lệ hoặc đã hết hạn', 400);

        user.password = newPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();
        // Invalidate all rf tokens
        await redisService.deleteRefreshToken(user._id);
    },

    async changePassword(userId, currentPassword, newPassword) {
        const user = await User.findById(userId).select('+password');
        if (!(await bcrypt.compare(currentPassword, user.password))) {
            throw new AppError('Mật khẩu hiện tại không đúng', 400);
        }
        user.password = newPassword;
        await user.save();
        await redisService.deleteRefreshToken(userId);
    },
};

module.exports = authService;