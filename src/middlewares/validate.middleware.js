// ─── Helpers ─────────────────────────────────────────────────
const isEmail = (v) => /^\S+@\S+\.\S+$/.test(v);
const isUsername = (v) => /^[a-zA-Z0-9_]{3,30}$/.test(v);
// Mật khẩu mạnh: ≥8 ký tự, có chữ hoa, chữ thường, số
const isStrongPwd = (v) => v && v.length >= 8 && /[A-Z]/.test(v) && /[a-z]/.test(v) && /\d/.test(v);

const error = (res, view, data, msg) => {
    // Nếu là AJAX request thì trả JSON
    if (res.req.xhr || res.req.headers.accept?.includes('application/json')) {
        return res.status(400).json({ success: false, message: msg });
    }
    return res.status(400).render(view, { ...data, error: msg });
};

// ─── Auth Validators ─────────────────────────────────────────
const validateRegister = (req, res, next) => {
    const { username, email, password, confirmPassword } = req.body;
    const ctx = { title: 'Đăng ký', username, email };

    if (!username?.trim()) return error(res, 'auth/register', ctx, 'Username không được để trống');
    if (!isUsername(username)) return error(res, 'auth/register', ctx, 'Username chỉ chứa chữ cái, số, dấu gạch dưới (3–30 ký tự)');
    if (!email?.trim()) return error(res, 'auth/register', ctx, 'Email không được để trống');
    if (!isEmail(email)) return error(res, 'auth/register', ctx, 'Địa chỉ email không hợp lệ');
    if (!password) return error(res, 'auth/register', ctx, 'Mật khẩu không được để trống');
    if (!isStrongPwd(password)) return error(res, 'auth/register', ctx, 'Mật khẩu tối thiểu 8 ký tự, gồm chữ hoa, chữ thường và số');
    if (password !== confirmPassword) return error(res, 'auth/register', ctx, 'Mật khẩu xác nhận không khớp');
    next();
};

const validateLogin = (req, res, next) => {
    const { email, password } = req.body;
    const ctx = { title: 'Đăng nhập' };
    if (!email?.trim()) return error(res, 'auth/login', ctx, 'Vui lòng nhập email');
    if (!isEmail(email)) return error(res, 'auth/login', ctx, 'Email không hợp lệ');
    if (!password) return error(res, 'auth/login', ctx, 'Vui lòng nhập mật khẩu');
    next();
};

const validateForgotPassword = (req, res, next) => {
    const { email } = req.body;
    if (!email?.trim() || !isEmail(email))
        return error(res, 'auth/forgot-password', { title: 'Quên mật khẩu' }, 'Email không hợp lệ');
    next();
};

const validateResetPassword = (req, res, next) => {
    const { token, password, confirmPassword } = req.body;
    const ctx = { title: 'Đặt lại mật khẩu', token };
    if (!token) return error(res, 'auth/reset-password', ctx, 'Token không hợp lệ');
    if (!isStrongPwd(password)) return error(res, 'auth/reset-password', ctx, 'Mật khẩu tối thiểu 8 ký tự, gồm chữ hoa, chữ thường và số');
    if (password !== confirmPassword) return error(res, 'auth/reset-password', ctx, 'Mật khẩu xác nhận không khớp');
    next();
};

const validateChangePassword = (req, res, next) => {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const ctx = { title: 'Đổi mật khẩu' };
    if (!currentPassword) return error(res, 'auth/change-password', ctx, 'Vui lòng nhập mật khẩu hiện tại');
    if (!isStrongPwd(newPassword)) return error(res, 'auth/change-password', ctx, 'Mật khẩu mới tối thiểu 8 ký tự, gồm chữ hoa, chữ thường và số');
    if (newPassword !== confirmPassword) return error(res, 'auth/change-password', ctx, 'Mật khẩu xác nhận không khớp');
    if (currentPassword === newPassword) return error(res, 'auth/change-password', ctx, 'Mật khẩu mới phải khác mật khẩu hiện tại');
    next();
};

// ─── Post Validators ─────────────────────────────────────────
const validatePost = (req, res, next) => {
    const { title, content } = req.body;
    const ctx = { title, content };

    if (!title?.trim()) return error(res, 'posts/create', ctx, 'Tiêu đề không được để trống');
    else if (title.trim().length < 10) return error(res, 'posts/create', ctx, 'Tiêu đề tối thiểu 10 ký tự');
    else if (title.trim().length > 200) return error(res, 'posts/create', ctx, 'Tiêu đề tối đa 200 ký tự');

    if (!content?.trim()) return error(res, 'posts/create', ctx, 'Nội dung không được để trống');
    else {
        const textOnly = content.replace(/<[^>]+>/g, '').trim();
        if (textOnly.length < 50) return error(res, 'posts/create', ctx, 'Nội dung tối thiểu 50 ký tự');
    }
    next();
};

// ─── Subscribe Validator ─────────────────────────────────────
const validateSubscribe = (req, res, next) => {
    const { email } = req.body;
    if (!email?.trim() || !isEmail(email))
        return res.status(400).json({ success: false, message: 'Email không hợp lệ' });
    next();
};

// ─── Admin Validators ────────────────────────────────────────
const validateRejectReason = (req, res, next) => {
    const { reason } = req.body;
    const ctx = { reason };
    if (!reason?.trim() || reason.trim().length < 10)
        return error(res, 'admin/pending-posts', ctx, 'Lý do từ chối phải có ít nhất 10 ký tự');
    next();
};

module.exports = {
    validateRegister,
    validateLogin,
    validateForgotPassword,
    validateResetPassword,
    validateChangePassword,
    validatePost,
    validateSubscribe,
    validateRejectReason,
};