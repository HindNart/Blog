const Subscriber = require('../models/subscriber.model');
const { catchAsync, AppError } = require('../utils/response.util');

module.exports = {
    subscribe: catchAsync(async (req, res) => {
        const { email } = req.body;
        if (!email) throw new AppError('Vui lòng nhập email', 400);

        const existing = await Subscriber.findOne({ email });
        if (existing) {
            if (!existing.isActive) {
                existing.isActive = true;
                await existing.save();
                return res.json({ success: true, message: 'Đăng ký nhận tin thành công!' });
            }
            return res.json({ success: true, message: 'Email đã đăng ký trước đó.' });
        }
        await Subscriber.create({ email });
        res.json({ success: true, message: 'Đăng ký nhận tin thành công!' });
    }),

    unsubscribe: catchAsync(async (req, res) => {
        const { token } = req.query;
        if (!token) return res.render('unsubscribe', { title: 'Hủy đăng ký', error: 'Token không hợp lệ' });

        const sub = await Subscriber.findOne({ unsubscribeToken: token });
        if (!sub) return res.render('unsubscribe', { title: 'Hủy đăng ký', error: 'Token không hợp lệ hoặc đã hủy' });

        sub.isActive = false;
        await sub.save();
        res.render('unsubscribe', { title: 'Hủy đăng ký', success: 'Bạn đã hủy đăng ký nhận tin thành công.' });
    }),
};