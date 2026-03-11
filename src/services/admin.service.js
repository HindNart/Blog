const Post = require('../models/post.model');
const User = require('../models/user.model');
const Notification = require('../models/notification.model');
const Subscriber = require('../models/subscriber.model');
const redisService = require('./redis.service');
const emailService = require('./mail.service');
const uploadService = require('./upload.service');
const { getPagination } = require('../utils/pagination.util');
const { AppError } = require('../utils/response.util');

const adminService = {
    async getDashboardStatus() {
        const [totalPosts, pendingPosts, totalUsers, deletedPosts, approvedPosts]
            = await Promise.all([
                Post.countDocuments({ isDeleted: false }),
                Post.countDocuments({ status: 'pending', isDeleted: false }),
                Post.countDocuments({ role: 'user' }),
                Post.countDocuments({ isDeleted: true }),
                Post.countDocuments({ status: 'approved', isDeleted: false }),
            ]);
        return { totalPosts, pendingPosts, totalUsers, deletedPosts, approvedPosts }
    },

    async getPendingPosts({ page = 1, limit = 10 }) {
        const query = { status: 'pending', isDeleted: false };
        const total = await Post.countDocuments(query);
        const pag = getPagination(page, total, limit);
        const posts = await Post.find(query)
            .populate('author', 'username email avatar')
            .populate('category', 'name')
            .select('-content')
            .sort({ createdAt: 1 })
            .skip(pag.skip).limit(limit).lean();
        return { posts, pagination: pag };
    },

    async getAllApprovedPosts({ page = 1, limit = 10, keyword }) {
        const query = { status: 'approved', isDeleted: false };
        if (keyword) query.$text = { $search: keyword };
        const total = await Post.countDocuments(query);
        const pag = getPagination(page, total, limit);
        const posts = await Post.find(query)
            .populate('author', 'username email')
            .populate('category', 'name')
            .select('-content')
            .sort({ approvedAt: -1 })
            .skip(pag.skip).limit(limit).lean();
        return { posts, pagination: pag };
    },

    async getDeletedPosts({ page = 1, limit = 10 }) {
        const query = { isDeleted: true };
        const total = await Post.countDocuments(query);
        const pag = getPagination(page, total, limit);
        const posts = await Post.find(query)
            .populate('author', 'username email')
            .populate('category', 'name')
            .select('-content')
            .sort({ deletedAt: -1 })
            .skip(pag.skip).limit(limit).lean();
        return { posts, pagination: pag };
    },

    async approvePost(postId, adminId) {
        const post = await Post.findOne({ _id: postId, status: 'pending', isDeleted: false })
            .populate('author', 'email username');
        if (!post) throw new AppError('Không tìm thấy bài đăng chờ duyệt', 404);

        post.status = 'approved';
        post.approvedBy = adminId;
        post.approvedAt = new Date();
        post.rejectionReason = null;
        await post.save();

        // Invalidate cache
        await redisService.invalidatePostCache();

        // Notify author
        await Notification.create({
            recipient: post.author._id,
            type: 'post_approved',
            post: post._id,
            message: `Bài đăng "${post.title}" của bạn đã được phê duyệt.`,
        });
        await redisService.invalidateUnreadCount(post.author._id);

        // Send email (non-blocking)
        mailService.sendApprovalResult(post.author.email, post.title, post.slug, true).catch(() => { });

        // Send newsletter (non-blocking)
        Subscriber.find({ isActive: true }).lean().then((subs) => {
            if (subs.length) mailService.sendNewsletterBatch(subs, post).catch(() => { });
        });

        return post;
    },

    async rejectPost(postId, adminId, reason) {
        if (!reason?.trim()) throw new AppError('Vui lòng cung cấp lý do từ chối', 400);

        const post = await Post.findOne({ _id: postId, status: 'pending', isDeleted: false })
            .populate('author', 'email username');
        if (!post) throw new AppError('Không tìm thấy bài đăng chờ duyệt', 404);

        post.status = 'rejected';
        post.rejectionReason = reason.trim();
        await post.save();

        await Notification.create({
            recipient: post.author._id,
            type: 'post_rejected',
            post: post._id,
            message: `Bài đăng "${post.title}" đã bị từ chối. Lý do: ${reason}`,
        });
        await redisService.invalidateUnreadCount(post.author._id);

        mailService.sendApprovalResult(post.author.email, post.title, post.slug, false, reason).catch(() => { });
        return post;
    },

    async restorePost(postId) {
        const post = await Post.findOne({ _id: postId, isDeleted: true })
            .populate('author', 'email username');
        if (!post) throw new AppError('Không tìm thấy bài đăng đã xóa', 404);

        await post.restore();

        await Notification.create({
            recipient: post.author._id,
            type: 'post_restored',
            post: post._id,
            message: `Bài đăng "${post.title}" đã được admin khôi phục.`,
        });
        await redisService.invalidateUnreadCount(post.author._id);
        return post;
    },

    async permanentDelete(postId) {
        const post = await Post.findOne({ _id: postId, isDeleted: true });
        if (!post) throw new AppError('Không tìm thấy bài đăng đã xóa', 404);

        // Delete images from Cloudinary
        const publicIds = [];
        if (post.thumbnailPublicId) publicIds.push(post.thumbnailPublicId);
        post.images.forEach((img) => img.publicId && publicIds.push(img.publicId));
        await uploadService.deleteMultiple(publicIds);

        await Post.deleteOne({ _id: postId });
        return post;
    },
};

module.exports = adminService;