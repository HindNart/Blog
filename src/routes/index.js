const authRoutes = require('./auth.routes');
const postRoutes = require('./post.routes');
const adminRoutes = require('./admin.routes');
const subscriberRoutes = require('./subscriber.routes');
const homeRoutes = require('./home.routes');
const { optionalAuth } = require('../middlewares/auth.middleware');

function routes(app) {
    // Inject current user vào mọi view
    app.use(optionalAuth);
    app.use((req, res, next) => {
        res.locals.currentUser = req.user || null;
        res.locals.isAdmin = req.user?.role === 'admin';
        next();
    });

    app.use('/auth', authRoutes);
    app.use('/posts', postRoutes);
    app.use('/admin', adminRoutes);
    app.use('/', subscriberRoutes);
    app.use('/', homeRoutes);

    // 404
    app.use((req, res) => {
        res.status(404).render('error', { title: '404', message: 'Trang không tồn tại', statusCode: 404 });
    });
};

module.exports = routes;