const authService = require('../services/auth.service');
const { catchAsync } = require('../utils/response.util');

module.exports = {
    showLogin: (req, res) => res.render('auth/login', { title: 'Đăng nhập' }),
    showRegister: (req, res) => res.render('auth/register', { title: 'Đăng ký' }),
    showForgotPassword: (req, res) => res.render('auth/forgot-password', { title: 'Quên mật khẩu' }),
    showResetPassword: (req, res) => res.render('auth/reset-password', { title: 'Đặt lại mật khẩu', token: req.query.token }),
    showChangePassword: (req, res) => res.render('auth/change-password', { title: 'Đổi mật khẩu' }),

    register: catchAsync(async (req, res) => {
        const { username, email, password, confirmPassword } = req.body;
        if (password !== confirmPassword) {
            return res.render('auth/register', { title: 'Đăng ký', error: 'Mật khẩu xác nhận không khớp', username, email });
        }
        const register = await authService.register({ username, email, password }); ////
        return res.json({ message: "Register succesfully!", register });
        // res.redirect('/auth/login?registered=1');
    }),

    login: catchAsync(async (req, res) => {
        const { email, password, redirect } = req.body;
        const user = await authService.login({ email, password }, res);
        const target = redirect && redirect.startsWith('/') ? redirect : (user.role === 'admin' ? '/admin/dashboard' : '/');
        res.redirect(target);
    }),

    logout: catchAsync(async (req, res) => {
        await authService.logout(req.user.userId, req.cookies.accessToken, res);
        res.redirect('/auth/login');
    }),

    forgotPassword: catchAsync(async (req, res) => {
        await authService.forgotPassword(req.body.email);
        res.render('auth/forgot-password', { title: 'Quên mật khẩu', success: 'Nếu email tồn tại, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu.' });
    }),

    resetPassword: catchAsync(async (req, res) => {
        const { token, password, confirmPassword } = req.body;
        if (password !== confirmPassword) {
            return res.render('auth/reset-password', { title: 'Đặt lại mật khẩu', error: 'Mật khẩu xác nhận không khớp', token });
        }
        await authService.resetPassword(token, password);
        res.redirect('/auth/login?reset=1');
    }),

    changePassword: catchAsync(async (req, res) => {
        const { currentPassword, newPassword, confirmPassword } = req.body;
        if (newPassword !== confirmPassword) {
            return res.render('auth/change-password', { title: 'Đổi mật khẩu', error: 'Mật khẩu mới xác nhận không khớp' });
        }
        await authService.changePassword(req.user.userId, currentPassword, newPassword);
        res.render('auth/change-password', { title: 'Đổi mật khẩu', success: 'Đổi mật khẩu thành công! Vui lòng đăng nhập lại.' });
    }),
};