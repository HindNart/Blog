const postService = require('../services/post.service');
const Category = require('../models/category.model');
const Notification = require('../models/notification.model');
const redisService = require('../services/redis.service');
const { catchAsync } = require('../utils/response.util');

module.exports = {
    // GET / - Trang chủ danh sách bài đăng
    index: catchAsync(async (req, res) => {
        const { page, category, keyword, tag } = req.query;
        const categories = await Category.find().lean();
        let selectedCategory = null;

        if (category) selectedCategory = await Category.findOne({ slug: category }).lean();

        const { posts, pagination } = await postService.getPublicPosts({
            page, limit: 9, category: selectedCategory?._id, keyword, tag,
        });

        res.render('posts/index', {
            title: keyword ? `Kết quả: "${keyword}"` : 'Trang chủ',
            posts, pagination, categories, keyword, tag,
            selectedCategory, currentUser: req.user || null,
        });
    }),

    // GET /posts/:slug - Chi tiết bài đăng
    show: catchAsync(async (req, res) => {
        const post = await postService.getPostBySlug(req.params.slug);
        const categories = await Category.find().lean();
        res.render('posts/detail', {
            title: post.title, post, categories,
            currentUser: req.user || null,
            isOwner: req.user && req.user.userId === post.author._id.toString(),
        });
    }),

    // GET /posts/create - Form tạo bài
    showCreate: catchAsync(async (req, res) => {
        const categories = await Category.find().lean();
        res.render('posts/create', { title: 'Viết bài mới', categories });
    }),

    // POST /posts/create - Tạo bài
    create: catchAsync(async (req, res) => {
        const post = await postService.createPost(req.body, req.user.userId, req.files);
        if (req.body.action === 'submit') {
            await postService.submitPost(post._id, req.user.userId);
            return res.redirect('/posts/my-posts?submitted=1');
        }
        res.redirect(`/posts/${post._id}/edit?created=1`);
    }),

    // GET /posts/:id/edit - Form chỉnh sửa
    showEdit: catchAsync(async (req, res) => {
        const Post = require('../models/Post');
        const post = await Post.findOne({ _id: req.params.id, author: req.user.userId, isDeleted: false })
            .populate('category').lean();
        if (!post) return res.status(404).render('error', { title: 'Không tìm thấy', message: 'Bài đăng không tồn tại', statusCode: 404 });
        if (!['draft', 'rejected'].includes(post.status)) {
            return res.redirect('/posts/my-posts?editError=1');
        }
        const categories = await Category.find().lean();
        res.render('posts/edit', {
            title: 'Chỉnh sửa bài đăng', post, categories,
            created: req.query.created, tagsString: post.tags?.join(', '),
        });
    }),

    // PUT /posts/:id - Cập nhật bài
    update: catchAsync(async (req, res) => {
        const post = await postService.updatePost(req.params.id, req.user.userId, req.body, req.files);
        if (req.body.action === 'submit') {
            await postService.submitPost(post._id, req.user.userId);
            return res.redirect('/posts/my-posts?submitted=1');
        }
        res.redirect(`/posts/${post._id}/edit?updated=1`);
    }),

    // DELETE /posts/:id - Xóa mềm
    delete: catchAsync(async (req, res) => {
        await postService.softDelete(req.params.id, req.user.userId);
        res.redirect('/posts/my-posts?deleted=1');
    }),

    // GET /posts/my-posts - Bài của tôi
    myPosts: catchAsync(async (req, res) => {
        const { page, status } = req.query;
        const { posts, pagination } = await postService.getUserPosts(req.user.userId, { page, status });

        // Notifications
        let unreadCount = await redisService.getUnreadCount(req.user.userId);
        if (unreadCount === null) {
            unreadCount = await Notification.countDocuments({ recipient: req.user.userId, isRead: false });
            await redisService.setUnreadCount(req.user.userId, unreadCount);
        }
        const notifications = await Notification.find({ recipient: req.user.userId })
            .populate('post', 'title slug').sort({ createdAt: -1 }).limit(10).lean();

        res.render('posts/my-posts', {
            title: 'Bài đăng của tôi', posts, pagination,
            currentStatus: status || '', notifications, unreadCount,
            submitted: req.query.submitted, deleted: req.query.deleted,
            updated: req.query.updated, editError: req.query.editError,
        });
    }),

    // POST /posts/notifications/read-all
    markNotificationsRead: catchAsync(async (req, res) => {
        await Notification.updateMany({ recipient: req.user.userId, isRead: false }, { isRead: true });
        await redisService.setUnreadCount(req.user.userId, 0);
        res.json({ success: true });
    }),
};