const redisService = require('../services/redis.service');

const cacheMiddleware = (ttl = 300) => async (req, res, next) => {
    // Chỉ cache GET request, không cache request của logged-in user
    if (req.method !== 'GET' || req.user) return next();

    const cacheKey = `posts:list:${req.originalUrl}`;
    const cached = await redisService.getPostList(cacheKey);

    if (cached) return res.render('posts/index', cached);

    // Override res.render để intercept và cache
    const originalRender = res.render.bind(res);
    res.render = (view, data) => {
        if (view === 'posts/index') redisService.setPostList(cacheKey, data, ttl).catch(() => { });
        originalRender(view, data);
    };
    next();
};

module.exports = cacheMiddleware;