// Import routes
const postRoutes = require('./post.routes');
const authRoutes = require('./auth.routes');
const adminRoutes = require('./admin.routes');

function routes(app) {
    app.use('/posts', postRoutes);
    app.use('/auth', authRoutes);
    app.use('/admin', adminRoutes);
}

module.exports = routes;