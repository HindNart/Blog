const { getRedis } = require('../config/redis');

const safeRedis = async (fn) => {
    try {
        const redis = getRedis();
        if (!redis || redis.status !== 'ready') return null;
        return await fn(redis);
    } catch (e) {
        console.warn('Redis op failed:', e.message);
        return null;
    }
};

const redisService = {
    async get(key) {
        return safeRedis((r) => r.get(key));
    },

    async set(key, value, ttl) {
        return safeRedis((r) => ttl ? r.setex(key, ttl, value) : r.set(key, value));
    },

    async del(key) {
        return safeRedis((r) => r.del(key));
    },

    async delPattern(pattern) {
        return safeRedis(async (r) => {
            const keys = await r.keys(pattern);
            if (keys.length) await r.del(keys);
        });
    },

    // Cache danh sách bài đăng (trang chủ, phân trang)
    async setPostList(key, data, ttl = 300) {  // 5 phút
        await this.setex(key, JSON.stringify(data), ttl);
    },

    async getPostList(key) {
        const data = await this.get(key);
        return data ? JSON.parse(data) : null;
    },

    // Xóa cache khi có bài mới được duyệt
    async invalidatePostCache() {
        await this.delPattern('posts:list:*');
    },

    // Lưu refresh token
    async saveRefreshToken(userId, token, ttl = 7 * 24 * 3600) {
        await this.set(`refresh:${userId}`, token, ttl);
    },

    async getRefreshToken(userId) {
        return this.get(`refresh:${userId}`);
    },

    async deleteRefreshToken(userId) {
        await this.del(`refresh:${userId}`);
    },

    // Blacklist access token khi logout
    async blacklistToken(token, ttl = 15 * 60) {
        await this.set(`blacklist:${token}`, '1', ttl);
    },

    async isBlacklisted(token) {
        const val = await this.get(`blacklist:${token}`);
        return val === "1";
    },

    // Rate limiting (chống spam submit bài)
    async checkRateLimit(userId, action, limit = 5, window = 3600) {
        const key = `ratelimit:${userId}:${action}`;
        const result = await safeRedis(async (r) => {
            const count = await r.incr(key);
            if (count === 1) await r.expire(key, window);
            return count;
        });
        return result === null ? true : result <= limit; //Allow if Redis down
    },

    // Notification count cache
    async getUnreadCount(userId) {
        const val = await this.get(`notif:${userId}`);
        return val ? parseInt(val) : null;
    },

    async setUnreadCount(userId, count) {
        await this.set(`notif:${userId}`, String(count), 300);
    },

    async invalidateUnreadCount(userId) {
        await this.del(`notif:${userId}`);
    },
};

module.exports = redisService;