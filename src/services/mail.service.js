const transporter = require('../config/mailer');

const from = () => `"Blog App" <${process.env.GMAIL_USER}>`;
const appUrl = () => process.env.APP_URL || 'http://localhost:3000';

const mailService = {
    // Gửi email reset password
    async sendResetPassword(email, token) {
        const resetUrl = `${appUrl()}/auth/reset-password?token=${token}`;
        await transporter.sendMail({
            from: from(),
            to: email,
            subject: '🔑 Đặt lại mật khẩu - Blog App',
            html: `
            <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto">
                <h2 style="color:#333">Đặt lại mật khẩu</h2>
                <p>Bạn đã yêu cầu đặt lại mật khẩu. Click vào link dưới đây để đặt lại mật khẩu (có hiệu lực trong <strong>1 giờ</strong>):</p>
                <a href="${resetUrl}" style="display:inline-block;background:#007bff;color:white;padding:10px 20px;
                    border-radius:5px;text-decoration:none;margin:16px 0">Đặt lại mật khẩu</a>
                <p style="color:#888;font-size:13px">Nếu bạn không yêu cầu, hãy bỏ qua email này.</p>
                <hr style="border:none;border-top:1px solid #eee>
                <p style="color:#aaa;font-size:12px">Blog App &copy; ${newDate().getFullYear()}</p>
            </div>
            `,
        });
    },

    // Thông báo kết quả duyệt bài
    async sendPostApprovalResult(email, postTitle, postSlug, isApproved, reason = null) {
        const postUrl = `${appUrl()}/posts/${postSlug}`;
        const subject = isApproved
            ? `✅ Bài đăng "${postTitle}" đã được phê duyệt`
            : `❌ Bài đăng "${postTitle}" bị từ chối`;

        const body = isApproved
            ? `<h2>Chúc mừng!</h2><p>Bài đăng <strong>${postTitle}</strong> đã được admin phê duyệt và hiển thị công khai.</p>
               <a> href="${postUrl}" style="color:#007bff"Xem bài đăng →</a>`
            : `<h2>Thông báo từ chối</h2>
               <p>Bài đăng <strong>${postTitle}</strong> đã bị từ chối.</p>
               <div style="background:#fff3cd;border-left:4px solid #ffc107;padding:12px;margin:12px 0">
               <strong>Lý do:</strong> ${reason}
               </div>
               <p>Bạn có thể chỉnh sửa và gửi lại bài đăng.</p>`;

        await transporter.sendMail({
            from: from(),
            to: email,
            subject,
            html: `
            <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto" 
                ${body}
                <hr style="border:none;border-top:1px solid #eee;margin-top:24px>
                <p style="color:#aaa;font-size:12px">Blog App &copy; ${newDate().getFullYear()}</p>
            </div>
            `,
        });
    },

    // Newsletter cho subscribers khi có bài đăng mới
    async sendNewsletterToSubscribers(subscribers, post) {
        const postUrl = `${process.env.APP_URL}/posts/${post.slug}`;

        // Gửi theo batch để tránh spam limit (50 email/lần)
        const batchSize = 50;
        for (let i = 0; i < subscribers.length; i += batchSize) {
            const batch = subscribers.slice(i, i + batchSize);
            const emailPromises = batch.map(sub =>
                transporter.sendMail({
                    from: from(),
                    to: sub.email,
                    subject: `📰 Bài viết mới: ${post.title}`,
                    html: `
                    <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto" 
                        <h2 style="color:#333">${post.title}</h2>
                        <p style="color:#555">${post.excerpt}</p>
                        <a href="${postUrl}" style="display:inline-block;background:#007bff;color:#fff;
                            padding:10px 20px;border-radius:6px;text-decoration:none">Đọc bài →</a>
                        <hr style="border:none;border-top:1px solid #eee;margin-top:24px>
                        <p style="color:#aaa;font-size:12px">Blog App &copy; ${newDate().getFullYear()}</p>
                        <small>
                            <a href="${appUrl()}/unsubscribe?token=${sub.unsubscribeToken}" style="color:#aaa;font-size:12px">
                                Hủy đăng ký
                            </a>
                        </small>
                    </div>
                    `,
                })
            );
            await Promise.allSettled(emailPromises);  // Không dừng nếu 1 email lỗi
            // Delay giữa các batch (tránh rate limit Gmail)
            if (i + batchSize < subscribers.length) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
    }
};

module.exports = mailService;