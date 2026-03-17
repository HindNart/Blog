const adminService = require('../services/admin.service');
const { catchAsync } = require('../utils/response.util');

module.exports = {
    dashboard: catchAsync(async (req, res) => {
        const stats = await adminService.getDashboardStatus();
        res.render('admin/dashboard', { title: 'Dashboard Admin', stats, layout: 'admin' });
    }),

    pendingPosts: catchAsync(async (req, res) => {
        const { posts, pagination } = await adminService.getPendingPosts({ page: req.query.page });
        res.render('admin/pending-posts', {
            title: 'Bài đăng chờ duyệt', posts, pagination,
            approved: req.query.approved, rejected: req.query.rejected, layout: 'admin',
        });
    }),

    allApprovedPosts: catchAsync(async (req, res) => {
        const { posts, pagination } = await adminService.getAllApprovedPosts({
            page: req.query.page, keyword: req.query.keyword,
        });
        res.render('admin/all-posts', {
            title: 'Tất cả bài đăng', posts, pagination,
            keyword: req.query.keyword, layout: 'admin',
        });
    }),

    deletedPosts: catchAsync(async (req, res) => {
        const { posts, pagination } = await adminService.getDeletedPosts({ page: req.query.page });
        res.render('admin/deleted-posts', {
            title: 'Bài đăng đã xóa', posts, pagination,
            restored: req.query.restored, permDeleted: req.query.permDeleted, layout: 'admin',
        });
    }),

    approvePost: catchAsync(async (req, res) => {
        await adminService.approvePost(req.params.id, req.user.userId);
        res.redirect('/admin/posts/pending?approved=1');
    }),

    rejectPost: catchAsync(async (req, res) => {
        const { reason } = req.body;
        await adminService.rejectPost(req.params.id, req.user.userId, reason);
        res.redirect('/admin/posts/pending?rejected=1');
    }),

    restorePost: catchAsync(async (req, res) => {
        await adminService.restorePost(req.params.id);
        res.redirect('/admin/posts/deleted?restored=1');
    }),

    permanentDelete: catchAsync(async (req, res) => {
        await adminService.permanentDelete(req.params.id);
        res.redirect('/admin/posts/deleted?permDeleted=1');
    }),
};