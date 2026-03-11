const Redis = require('ioredis');

let redis;

const connectRedis = () => {
    redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
        retryStrategy: (times) => {
            if (times > 3) {
                console.warn('Redis unavailable, running without cache');
                return null;
            }
            return Math.min(times * 200, 2000);
        },
        enableOfflineQueue: false,
        lazyConnect: true,
    });

    redis.on('connect', () => console.log('Redis connected'));
    redis.on('error', (err) => console.error('Redis error:', err));
    redis.connect().catch(() => { });
};

const getRedis = () => {
    if (!redis) throw new Error('Redis not initialized');
    return redis;
};

module.exports = { connectRedis, getRedis };