const bcrypt = require('bcrypt');
const User = require('../models/user.model');
const Post = require('../models/post.model');
const Notification = require('../models/notification.model');
const uploadService = require('./upload.service');
const redisService = require('./redis.service');
const { AppError } = require('../utils/response.util');

const userService = {
    async getProfile(userId) {
        const user = await User.findById(userId)
            .select('username email avatar role createdAt isEmailVerified')
            .lean();
        if (!user) throw new AppError('Không tìm thấy người dùng', 404);

        // Thống kê bài viết
        const [totalPosts, approvedPosts, pendingPosts] = await Promise.all([
            Post.countDocuments({ author: userId }),
            Post.countDocuments({ author: userId, status: 'approved' }),
            Post.countDocuments({ author: userId, status: 'pending' }),
        ]);

        return { user, stats: { totalPosts, approvedPosts, pendingPosts } };
    },

    async updateAvatar(userId, file) {
        if (!file) throw new AppError('Vui lòng chọn ảnh avatar', 400);

        const user = await User.findById(userId).select('avatar avatarPublicId');
        if (!user) throw new AppError('Không tìm thấy người dùng', 404);

        // Xóa avatar cũ trên Cloudinary
        if (user.avatarPublicId) {
            await uploadService.deleteImage(user.avatarPublicId).catch(() => { });
        }

        // Lưu avatar mới
        user.avatar = file.path;
        user.avatarPublicId = file.filename;
        await user.save({ validateBeforeSave: false });

        return user;
    },

    async removeAvatar(userId) {
        const user = await User.findById(userId).select('avatar avatarPublicId');
        if (!user) throw new AppError('Không tìm thấy người dùng', 404);

        if (user.avatarPublicId) {
            await uploadService.deleteImage(user.avatarPublicId).catch(() => { });
        }
        user.avatar = null;
        user.avatarPublicId = null;
        await user.save({ validateBeforeSave: false });
    },

    async deleteAccount(userId, password) {
        const user = await User.findById(userId).select('+password');
        if (!user) throw new AppError('Không tìm thấy người dùng', 404);

        // Xác nhận mật khẩu
        const ok = await bcrypt.compare(password, user.password);
        if (!ok) throw new AppError('Mật khẩu không đúng', 400);

        // Soft-delete tất cả bài đăng của user
        await Post.deleteMany({ author: userId });

        // Xóa notifications
        await Notification.deleteMany({ recipient: userId });

        // Xóa Redis tokens
        try {
            await redisService.deleteRefreshToken(userId);
        } catch { }

        // Xóa avatar trên Cloudinary
        if (user.avatarPublicId) {
            await uploadService.deleteImage(user.avatarPublicId).catch(() => { });
        }

        // Xóa user
        await User.deleteOne({ _id: userId });
    },
};

module.exports = userService;