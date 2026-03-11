const Post = require('../models/post.model');
const Category = require('../models/category.model');
const Subscriber = require('../models/subscriber.model');
const Notification = require('../models/notification.model');
const redisService = require('./redis.service');
const mailService = require('./mail.service');
const uploadService = require('./upload.service');
const { getPagination } = require('../utils/pagination.util');
const { AppError } = require('../utils/response.util');
const sanitizeHtml = require('sanitize-html');

const SANITIZE_OPTIONS = {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'h1', 'h2', 'figure', 'figcaption']),
    allowedAttributes: {
        ...sanitizeHtml.defaults.allowedAttributes,
        'img': ['src', 'alt', 'width', 'height', 'class'],
        '*': ['class', 'style'],
    },
    allowedStyles: {
        '*': { 'text-align': [/^(left|center|right|justify)$/] },
    },
};

const postService = {
    async getPublicPosts({ page = 1, limit = 9, category, keyword, tag }) {
        const query = { status: 'approved', isDeleted: false };
        if (category) query.category = category;
        if (keyword) query.$text = { $search: keyword };
        if (tag) query.tags = tag.toLowerCase();

        const { currentPage, totalPages, skip, hasNext, hasPrev, nextPage, prevPage, pages, totalItems }
            = getPagination(page, await Post.countDocuments(query), limit);

        const posts = await Post.find(query)
            .populate('author', 'username avatar')
            .populate('category', 'name slug')
            .select('-content')
            .sort(keyword ? { score: { $meta: 'textScore' } } : { createdAt: -1 })
            .skip(skip).limit(limit).lean();

        return { posts, pagination: { currentPage, totalPages, hasNext, hasPrev, nextPage, prevPage, pages, totalItems } };
    },

    async getPostBySlug(slug) {
        const post = await Post.findOneAndUpdate(
            { slug, status: 'approved', isDeleted: false },
            { $inc: { views: 1 } },
            { new: true }
        ).populate('author', 'username avatar').populate('category', 'name slug').lean();
        if (!post) throw new AppError('Bài đăng không tồn tại', 404);
        return post;
    },

    async getUserPosts(userId, { page = 1, limit = 10, status }) {
        const query = { author: userId, isDeleted: false };
        if (status) query.status = status;

        const { currentPage, totalPages, skip, hasNext, hasPrev, nextPage, prevPage, pages, totalItems }
            = getPagination(page, await Post.countDocuments(query), limit);

        const posts = await Post.find(query)
            .populate('category', 'name')
            .select('-content')
            .sort({ createdAt: -1 })
            .skip(skip).limit(limit).lean();

        return { posts, pagination: { currentPage, totalPages, hasNext, hasPrev, nextPage, prevPage, pages, totalItems } };
    },

    async createPost({ title, content, category, tags }, authorId, files) {
        const allowed = await redisService.checkRateLimit(authorId, 'create_post', 10, 3600);
        if (!allowed) throw new AppError('Bạn đã tạo quá nhiều bài đăng. Vui lòng thử lại sau.', 429);

        const sanitizedContent = sanitizeHtml(content, SANITIZE_OPTIONS);
        const postData = {
            title, content: sanitizedContent, author: authorId, category: category || null,
            tags: tags ? tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
        };

        // Handle upload imgs
        if (files?.thumbnail?.[0]) {
            postData.thumbnail = files.thumbnail[0].path;
            postData.thumbnailPublicId = files.thumbnail[0].filename;
        }
        if (files?.contentImages) {
            postData.images = files.contentImages.map((f) => ({ publicId: f.filename, url: f.path }));
        }

        const post = await Post.create(postData);
        return post;
    },

    async updatePost(postId, userId, { title, content, category, tags }, files) {
        const post = await Post.findOne({ _id: postId, author: userId, isDeleted: false });
        if (!post) throw new AppError('Không tìm thấy bài đăng', 404);
        if (!['draft', 'rejected'].includes(post.status)) {
            throw new AppError('Chỉ có thể chỉnh sửa bài đăng ở trạng thái nháp hoặc bị từ chối', 400);
        }

        if (title) post.title = title;
        if (content) post.content = sanitizeHtml(content, SANITIZE_OPTIONS);
        if (category !== undefined) post.category = category || null;
        if (tags !== undefined) post.tags = tags ? tags.split(',').map((t) => t.trim()).filter(Boolean) : [];

        if (files?.thumbnail?.[0]) {
            if (post.thumbnailPublicId) await uploadService.deleteImage(post.thumbnailPublicId);
            post.thumbnail = files.thumbnail[0].path;
            post.thumbnailPublicId = files.thumbnail[0].filename;
        }
        if (files?.contentImages?.length) {
            post.images = files.contentImages.map((f) => ({ publicId: f.filename, url: f.path }));
        }

        await post.save();
        return post;
    },

    async submitPost(postId, userId) {
        const post = await Post.findOne({ _id: postId, author: userId, isDeleted: false });
        if (!post) throw new AppError('Không tìm thấy bài đăng', 404);
        if (!['draft', 'rejected'].includes(post.status)) {
            throw new AppError('Bài đăng không thể gửi duyệt ở trạng thái hiện tại', 400);
        }
        post.status = 'pending';
        post.rejectionReason = null;
        await post.save();
        return post;
    },

    async softDelete(postId, userId) {
        const post = await Post.findOne({ _id: postId, author: userId, isDeleted: false });
        if (!post) throw new AppError('Không tìm thấy bài đăng', 404);
        await post.delete();
        await redisService.invalidatePostCache();
        return post;
    },
};

module.exports = postService;