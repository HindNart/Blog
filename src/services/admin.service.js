const Post = require('../models/post.model');
const User = require('../models/user.model');
const Notification = require('../models/notification.model');
const Subscriber = require('../models/subscriber.model');
const redisService = require('./redis.service');
const mailService = require('./mail.service');
const uploadService = require('./upload.service');
const { getPagination } = require('../utils/pagination.util');
const { AppError } = require('../utils/response.util');

const adminService = {
    async getDashboardStatus() {
        const [totalPosts, pendingPosts, totalUsers, deletedPosts, approvedPosts]
            = await Promise.all([
                Post.countDocuments({}),
                Post.countDocuments({ status: 'pending' }),
                User.countDocuments({ role: 'user' }),
                Post.countDocumentsDeleted({}),
                Post.countDocuments({ status: 'approved' }),
            ]);
        return { totalPosts, pendingPosts, totalUsers, deletedPosts, approvedPosts }
    },

    async getPendingPosts({ page = 1, limit = 10 }) {
        const query = { status: 'pending' };
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
        const query = { status: 'approved' };
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
        const total = await Post.countDocumentsDeleted();
        const pag = getPagination(page, total, limit);
        const posts = await Post.findDeleted()
            .populate('author', 'username email')
            .populate('category', 'name')
            .select('-content')
            .sort({ deletedAt: -1 })
            .skip(pag.skip).limit(limit).lean();
        return { posts, pagination: pag };
    },

    async approvePost(postId, adminId) {
        const post = await Post.findOne({ _id: postId, status: 'pending' })
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
        await mailService.sendPostApprovalResult(post.author.email, post.title, post.slug, true).catch(() => { });

        // Send newsletter (non-blocking)
        Subscriber.find({ isActive: true }).lean().then(async (subs) => {
            if (subs.length) await mailService.sendNewsletterToSubscribers(subs, post).catch(() => { });
        });
    },

    async rejectPost(postId, adminId, reason) {
        if (!reason?.trim()) throw new AppError('Vui lòng cung cấp lý do từ chối', 400);

        const post = await Post.findOne({ _id: postId, status: 'pending' })
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

        await mailService.sendPostApprovalResult(post.author.email, post.title, post.slug, false, reason).catch(() => { });
    },

    async restorePost(postId) {
        const post = await Post.findOneDeleted({ _id: postId })
            .populate('author', 'email username');
        if (!post) throw new AppError('Không tìm thấy bài đăng đã xóa', 404);

        await post.restore();
        await redisService.invalidatePostCache();

        await Notification.create({
            recipient: post.author._id,
            type: 'post_restored',
            post: post._id,
            message: `Bài đăng "${post.title}" đã được admin khôi phục.`,
        });
        await redisService.invalidateUnreadCount(post.author._id);
        await mailService.sendPostRestore(post.author.email, post.title, post.slug);
    },

    async permanentDelete(postId) {
        const post = await Post.findOneDeleted({ _id: postId });
        if (!post) throw new AppError('Không tìm thấy bài đăng đã xóa', 404);

        // Delete images from Cloudinary
        const publicIds = [];
        if (post.thumbnailPublicId) publicIds.push(post.thumbnailPublicId);
        post.images.forEach((img) => img.publicId && publicIds.push(img.publicId));
        await uploadService.deleteMultiple(publicIds);

        await Post.deleteOne({ _id: postId });
    },
};

module.exports = adminService;