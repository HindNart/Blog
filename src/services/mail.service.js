const transporter = require('../config/mailer');

const from = () => `"Blog App" <${process.env.GMAIL_USER}>`;
const appUrl = () => process.env.APP_URL || 'http://localhost:3000';
const year = () => new Date().getFullYear();

const baseTemplate = (content) => `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.08)">
  <div style="background:linear-gradient(135deg,#3b82f6,#6366f1);padding:2rem;text-align:center">
    <h1 style="color:#fff;margin:0;font-size:1.5rem">✍️ Blog App</h1>
  </div>
  <div style="padding:2rem">${content}</div>
  <div style="background:#f8fafc;padding:1rem 2rem;text-align:center;font-size:.8rem;color:#94a3b8;border-top:1px solid #e2e8f0">
    &copy; ${year()} Blog App. Nền tảng chia sẻ kiến thức.
  </div>
</div>
`;

const btnPrimary = (url, text) => `
<a href="${url}" style="display:inline-block;background:#3b82f6;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;margin:1rem 0">${text}</a>
`;

const mailService = {
    // Xác minh email
    async sendEmailVerification(email, username, token) {
        const verifyUrl = `${appUrl()}/auth/verify-email?token=${token}`;
        await transporter.sendMail({
            from: from(),
            to: email,
            subject: '📧 Xác minh địa chỉ email của bạn',
            html: baseTemplate(`
            <h2 style="color:#1e293b;margin-top:0">Xin chào ${username}! 👋</h2>
            <p style="color:#475569;line-height:1.6">Cảm ơn bạn đã đăng ký. Vui lòng xác minh địa chỉ email để kích hoạt tài khoản.</p>
            <div style="text-align:center;margin:1.5rem 0">${btnPrimary(verifyUrl, '✅ Xác minh email')}</div>
            <p style="color:#94a3b8;font-size:.85rem">Link có hiệu lực trong <strong>24 giờ</strong>. Nếu bạn không đăng ký, hãy bỏ qua email này.</p>
            <div style="background:#fef3c7;border-left:4px solid #f59e0b;padding:.8rem;border-radius:4px;margin-top:1rem">
                <p style="margin:0;font-size:.85rem;color:#92400e">⚠️ Không thể đăng nhập cho đến khi xác minh email.</p>
            </div>`),
        })
    },

    // Resend verification
    async resendVerification(email, username, token) {
        await this.sendEmailVerification(email, username, token);
    },

    // Gửi email reset password
    async sendResetPassword(email, token) {
        const resetUrl = `${appUrl()}/auth/reset-password?token=${token}`;
        await transporter.sendMail({
            from: from(),
            to: email,
            subject: '🔑 Đặt lại mật khẩu - Blog App',
            html: baseTemplate(`
            <h2 style="color:#1e293b;margin-top:0">Đặt lại mật khẩu</h2>
            <p style="color:#475569;line-height:1.6">Bạn đã yêu cầu đặt lại mật khẩu. Click vào nút bên dưới:</p>
            <div style="text-align:center;margin:1.5rem 0">${btnPrimary(resetUrl, '🔑 Đặt lại mật khẩu')}</div>
            <p style="color:#94a3b8;font-size:.85rem">Link có hiệu lực trong <strong>1 giờ</strong>. Nếu bạn không yêu cầu, hãy bỏ qua email này.</p>`),
        });
    },

    // Thông báo kết quả duyệt bài
    async sendPostApprovalResult(email, postTitle, postSlug, isApproved, reason = null) {
        const postUrl = `${appUrl()}/posts/${postSlug}`;
        const subject = isApproved ? '✅ Bài đăng đã được phê duyệt' : '❌ Bài đăng bị từ chối';
        const body = isApproved ?
            `<h2 style="color:#166534;margin-top:0">🎉 Chúc mừng!</h2>
            <p style="color:#475569">Bài đăng <strong>"${postTitle}"</strong> đã được phê duyệt và hiển thị công khai.</p>
            <div style="text-align:center;margin:1.5rem 0">${btnPrimary(postUrl, '👁️ Xem bài đăng')}</div>`
            : `<h2 style="color:#991b1b;margin-top:0">Bài đăng bị từ chối</h2>
            <p style="color:#475569">Bài đăng <strong>"${postTitle}"</strong> chưa được phê duyệt.</p>
            <div style="background:#fee2e2;border-left:4px solid #ef4444;padding:1rem;border-radius:4px;margin:1rem 0">
            <strong style="color:#991b1b">Lý do:</strong>
            <p style="color:#7f1d1d;margin:.5rem 0 0">${reason}</p>
            </div>
            <p style="color:#475569">Bạn có thể chỉnh sửa và gửi lại bài đăng.</p>`;
        await transporter.sendMail({
            from: from(),
            to: email,
            subject,
            html: baseTemplate(body)
        });
    },

    // Thông báo khôi phục bài
    async sendPostRestore(email, postTitle, postSlug) {
        const postUrl = `${appUrl()}/posts/${postSlug}`;
        const subject = '🔁 Khôi phục bài viết';
        const body = `
            <h2 style="color:#166534;margin-top:0">🎉 Chúc mừng!</h2>
            <p style="color:#475569">Bài đăng <strong>"${postTitle}"</strong> đã được khôi phục và hiển thị công khai trở lại.</p>
            <div style="text-align:center;margin:1.5rem 0">${btnPrimary(postUrl, '👁️ Xem bài đăng')}</div>`
        await transporter.sendMail({
            from: from(),
            to: email,
            subject,
            html: baseTemplate(body)
        });
    },

    // Newsletter cho subscribers khi có bài đăng mới
    async sendNewsletterToSubscribers(subscribers, post) {
        const postUrl = `${appUrl()}/posts/${post.slug}`;
        const BATCH = 50;
        for (let i = 0; i < subscribers.length; i += BATCH) {
            const batch = subscribers.slice(i, i + BATCH);
            await Promise.allSettled(batch.map((sub) =>
                transporter.sendMail({
                    from: from(), to: sub.email,
                    subject: `📰 Bài viết mới: ${post.title}`,
                    html: baseTemplate(`
            <h2 style="margin-top:0"><a href="${postUrl}" style="color:#3b82f6;text-decoration:none">${post.title}</a></h2>
            <p style="color:#475569;line-height:1.6">${post.excerpt}</p>
            <div style="text-align:center;margin:1.5rem 0">${btnPrimary(postUrl, '📖 Đọc bài viết')}</div>
            <hr style="border:none;border-top:1px solid #e2e8f0;margin:1.5rem 0">
            <p style="color:#94a3b8;font-size:.8rem;text-align:center">
              <a href="${appUrl()}/unsubscribe?token=${sub.unsubscribeToken}" style="color:#94a3b8">Hủy đăng ký nhận tin</a>
            </p>`),
                })
            ));
            if (i + BATCH < subscribers.length) await new Promise((r) => setTimeout(r, 1000));
        }
    }
};

module.exports = mailService;