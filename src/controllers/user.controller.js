const userService = require('../services/user.service');
const { catchAsync, AppError } = require('../utils/response.util');
const { clearCookies } = require('../utils/jwt.util');

module.exports = {
    // GET /user/profile
    showProfile: catchAsync(async (req, res) => {
        const { user, stats } = await userService.getProfile(req.user.userId);
        res.render('user/profile', { title: 'Trang cá nhân', user, stats });
    }),

    // PUT /user/avatar — upload ảnh mới
    updateAvatar: catchAsync(async (req, res) => {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Vui lòng chọn ảnh' });
        }
        const user = await userService.updateAvatar(req.user.userId, req.file);
        res.json({ success: true, avatarUrl: user.avatar, message: 'Cập nhật avatar thành công!' });
    }),

    // DELETE /user/avatar — xóa avatar về mặc định
    removeAvatar: catchAsync(async (req, res) => {
        await userService.removeAvatar(req.user.userId);
        res.json({ success: true, message: 'Đã xóa avatar' });
    }),

    // DELETE /user/delete-account
    deleteAccount: catchAsync(async (req, res) => {
        const { password } = req.body;
        if (!password) {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập mật khẩu xác nhận' });
        }
        await userService.deleteAccount(req.user.userId, password);
        clearCookies(res);
        res.json({ success: true, message: 'Tài khoản đã được xóa thành công' });
    }),
};