const crypto = require('crypto');
const bcrypt = require('bcrypt');
const User = require('../models/user.model');
const redisService = require('./redis.service');
const mailService = require('./mail.service');
const { generateTokens, setCookies, clearCookies } = require('../utils/jwt.util');
const { generateResetToken, hashToken } = require('../utils/password.util');
const { AppError } = require('../utils/response.util');

// Tạo email verify token (plain + hashed)
const generateEmailToken = () => {
    const token = crypto.randomBytes(32).toString('hex');
    const hashed = crypto.createHash('sha256').update(token).digest('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
    return { token, hashed, expires };
};

const authService = {
    async register({ username, email, password }) {
        const existUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existUser) {
            throw new AppError(existUser.email === email ? 'Email đã được sử dụng' : 'Username đã tồn tại', 400);
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const { token, hashed, expires } = generateEmailToken();
        await User.create({ username, email, password: hashedPassword, emailVerifyToken: hashed, emailVerifyExpires: expires, isEmailVerified: false, });
        mailService.sendEmailVerification(email, username, token).catch(() => { });
    },

    // Xác minh email
    async verifyEmail(token) {
        const hashed = crypto.createHash('sha256').update(token).digest('hex');
        const user = await User.findOne({
            emailVerifyToken: hashed,
            emailVerifyExpires: { $gt: Date.now() },
        }).select('+emailVerifyToken +emailVerifyExpires');

        if (!user) throw new AppError('Link xác minh không hợp lệ hoặc đã hết hạn', 400);

        user.isEmailVerified = true;
        user.emailVerifyToken = undefined;
        user.emailVerifyExpires = undefined;
        await user.save({ validateBeforeSave: false });
    },

    // Gửi lại email xác minh
    async resendVerification(email) {
        const user = await User.findOne({ email })
            .select('+emailVerifyToken +emailVerifyExpires');
        if (!user) return; // Không tiết lộ email có tồn tại không
        if (user.isEmailVerified) throw new AppError('Email này đã được xác minh', 400);

        // Rate limit: không gửi lại nếu token cũ chưa hết hạn > 23h
        if (user.emailVerifyExpires && user.emailVerifyExpires > new Date(Date.now() + 23 * 60 * 60 * 1000)) {
            throw new AppError('Vui lòng chờ ít nhất 1 giờ trước khi gửi lại', 429);
        }

        const { token, hashed, expires } = generateEmailToken();
        user.emailVerifyToken = hashed;
        user.emailVerifyExpires = expires;
        await user.save({ validateBeforeSave: false });
        await mailService.resendVerification(email, user.username, token);
    },

    async login({ email, password }, res) {
        const user = await User.findOne({ email }).select('+password');
        if (!user || !(await bcrypt.compare(password, user.password))) {
            throw new AppError('Email hoặc mật khẩu không đúng', 401);
        }

        if (!user.isActive) throw new AppError('Tài khoản đã bị vô hiệu hóa', 403);
        if (!user.isEmailVerified) {
            throw new AppError('EMAIL_NOT_VERIFIED', 403);
        }

        const { accessToken, refreshToken } = generateTokens(user._id, user.role);
        try {
            await redisService.saveRefreshToken(user._id, refreshToken);
        } catch { }
        setCookies(res, accessToken, refreshToken);
        return user;
    },

    async logout(userId, accessToken, res) {
        try { await redisService.deleteRefreshToken(userId); } catch { }
        try { await redisService.blacklistToken(accessToken); } catch { }
        clearCookies(res);
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

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();
        // Invalidate all rf tokens
        try { await redisService.deleteRefreshToken(user._id); } catch { }
    },

    async changePassword(userId, currentPassword, newPassword) {
        const user = await User.findById(userId).select('+password');
        if (!(await bcrypt.compare(currentPassword, user.password))) {
            throw new AppError('Mật khẩu hiện tại không đúng', 400);
        }
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();
        try { await redisService.deleteRefreshToken(userId); } catch { }
    },
};

module.exports = authService;