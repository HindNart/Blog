const authRoutes = require('./auth.routes');
const postRoutes = require('./post.routes');
const adminRoutes = require('./admin.routes');
const userRoutes = require('./user.routes');
const subscriberRoutes = require('./subscriber.routes');
const homeRoutes = require('./home.routes');
const { optionalAuth } = require('../middlewares/auth.middleware');
const User = require('../models/user.model');

function routes(app) {
    app.use(optionalAuth);
    // Inject current user vào mọi view
    app.use(async (req, res, next) => {
        res.locals.currentUser = null;
        res.locals.isAdmin = false;
        res.locals.currentYear = new Date().getFullYear();

        if (req.user?.userId) {
            try {
                const user = await User.findById(req.user.userId).select('username email role avatar').lean();
                if (user) {
                    res.locals.currentUser = { ...req.user, username: user.username, email: user.email, role: user.role, avatar: user.avatar };
                    res.locals.isAdmin = user.role === 'admin';
                }
            } catch (err) { console.error('Inject user error: ', err.message); }
        }
        next();
    });

    app.use('/auth', authRoutes);
    app.use('/posts', postRoutes);
    app.use('/admin', adminRoutes);
    app.use('/user', userRoutes);
    app.use('/', subscriberRoutes);
    app.use('/', homeRoutes);

    // 404
    app.use((req, res) => {
        res.status(404).render('error', { title: '404', message: 'Trang không tồn tại', statusCode: 404 });
    });
};

module.exports = routes;