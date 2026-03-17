const redisService = require('../services/redis.service');

const cacheMiddleware = (ttl = 300) => async (req, res, next) => {
    // Chỉ cache GET request
    if (req.method !== 'GET') return next();

    const cacheKey = `posts:list:${req.originalUrl}`;

    try {
        const cached = await redisService.getPostList(cacheKey);

        if (cached) return res.render('posts/index', cached);
    } catch {
        return next();
    }

    // Chưa có cache → override res.render để lưu data (KHÔNG lưu currentUser)
    const originalRender = res.render.bind(res);
    res.render = (view, data) => {
        if (view === 'posts/index' && data) {
            // Lọc ra chỉ những field cần cache (bài đăng, phân trang, categories...)
            // Loại bỏ currentUser và các field runtime khác
            const { currentUser, isAdmin, currentYear, ...cacheData } = data;
            redisService.setPostList(cacheKey, cacheData, ttl).catch(() => { });
        }
        originalRender(view, data);
    };
    next();
};

module.exports = cacheMiddleware;