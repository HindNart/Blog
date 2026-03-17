const authService = require('../services/auth.service');
const { catchAsync } = require('../utils/response.util');

module.exports = {
    showLogin: (req, res) => res.render('auth/login', {
        title: 'Đăng nhập',
        registered: req.query.registered === '1',
        verified: req.query.verified === '1',
        reset: req.query.reset === '1',
        redirect: req.query.redirect || '',
    }),
    showRegister: (req, res) => res.render('auth/register', { title: 'Đăng ký' }),
    showForgotPassword: (req, res) => res.render('auth/forgot-password', { title: 'Quên mật khẩu' }),
    showResetPassword: (req, res) => res.render('auth/reset-password', { title: 'Đặt lại mật khẩu', token: req.query.token }),
    showResendVerification: (req, res) => res.render('auth/resend-verification', { title: 'Gửi lại email xác minh' }),

    register: catchAsync(async (req, res) => {
        const { username, email, password, confirmPassword } = req.body;
        if (password !== confirmPassword) {
            return res.render('auth/register', {
                title: 'Đăng ký',
                error: 'Mật khẩu xác nhận không khớp', username, email
            });
        }
        await authService.register({ username, email, password });
        res.redirect('/auth/login?registered=1');
    }),

    verifyEmail: catchAsync(async (req, res) => {
        const { token } = req.query;
        if (!token) return res.redirect('/auth/login?verifyFailed=1');
        await authService.verifyEmail(token);
        res.redirect('/auth/login?verified=1');
    }),

    resendVerification: catchAsync(async (req, res) => {
        await authService.resendVerification(req.body.email);
        res.render('auth/resend-verification', {
            title: 'Gửi lại email xác minh',
            success: 'Nếu email tồn tại và chưa xác minh, chúng tôi đã gửi lại link xác minh.',
        });
    }),

    login: catchAsync(async (req, res) => {
        const { email, password, redirect } = req.body;
        let user;
        try {
            user = await authService.login({ email, password }, res);
        } catch (err) {
            // Email chưa xác minh → redirect đến trang thông báo
            if (err.message === 'EMAIL_NOT_VERIFIED') {
                return res.render('auth/login', {
                    title: 'Đăng nhập',
                    error: 'Email chưa được xác minh.',
                    emailNotVerified: true,
                    email,
                });
            }
            return res.render('auth/login', {
                title: 'Đăng nhập',
                error: err.message
            });
        }
        const target = redirect && redirect.startsWith('/') ? redirect : (user.role === 'admin' ? '/admin/dashboard' : '/');
        res.redirect(target);
    }),

    logout: catchAsync(async (req, res) => {
        await authService.logout(req.user.userId, req.cookies.accessToken, res);
        res.redirect('/auth/login');
    }),

    forgotPassword: catchAsync(async (req, res) => {
        await authService.forgotPassword(req.body.email);
        res.render('auth/forgot-password', {
            title: 'Quên mật khẩu',
            success: 'Nếu email tồn tại, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu.'
        });
    }),

    resetPassword: catchAsync(async (req, res) => {
        const { token, password, confirmPassword } = req.body;
        if (password !== confirmPassword) {
            return res.render('auth/reset-password', {
                title: 'Đặt lại mật khẩu',
                error: 'Mật khẩu xác nhận không khớp',
                token
            });
        }
        await authService.resetPassword(token, password);
        res.redirect('/auth/login?reset=1');
    }),

    changePassword: catchAsync(async (req, res) => {
        const { currentPassword, newPassword, confirmPassword } = req.body;
        if (newPassword !== confirmPassword) {
            return res.render('user/profile', {
                title: 'Trang cá nhân',
                error: 'Mật khẩu mới xác nhận không khớp'
            });
        }
        await authService.changePassword(req.user.userId, currentPassword, newPassword);
        res.render('user/profile', {
            title: 'Trang cá nhân',
            success: 'Đổi mật khẩu thành công!'
        });
    }),
};