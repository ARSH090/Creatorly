import { Redis as UpstashRedis } from '@upstash/redis';

const getCleanRedisUrl = () => {
    const url = process.env.REDIS_URL || process.env.REDIS || '';
    const cleanUrl = url.replace(/%20/g, ' ').split(' ')[0];
    const match = cleanUrl.match(/(rediss?:\/\/[^\s]+)/);
    return match ? match[1] : cleanUrl;
};

const REDIS_URL = getCleanRedisUrl();
const isEdge = process.env.NEXT_RUNTIME === 'edge';

let redis: any = null;

if (isEdge) {
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
        redis = new UpstashRedis({
            url: process.env.UPSTASH_REDIS_REST_URL,
            token: process.env.UPSTASH_REDIS_REST_TOKEN,
        });
    } else {
        console.warn('⚠ Upstash REST credentials not set for Edge Runtime');
    }
} else {
    // Node.js Runtime - Use ioredis
    try {
        const IORedis = require('ioredis');
        if (REDIS_URL) {
            const redisOptions: any = {
                maxRetriesPerRequest: 3,
                retryStrategy: (times: number) => {
                    if (times > 3) return null;
                    return Math.min(times * 50, 2000);
                },
                lazyConnect: true,
                enableOfflineQueue: false,
            };

            if (REDIS_URL.startsWith('rediss://')) {
                redisOptions.tls = { rejectUnauthorized: false };
            }

            redis = new IORedis(REDIS_URL, redisOptions);
            redis.on('error', (err: any) => console.warn('Redis error:', err.message));
            redis.connect().catch((err: any) => console.warn('Redis connect failed:', err.message));
        }
    } catch (e) {
        console.error('Failed to initialize ioredis:', e);
    }
}

if (!redis && !isEdge) {
    console.warn('⚠ Redis not initialized — falling back to null');
}

export default redis;
