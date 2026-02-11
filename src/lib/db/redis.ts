import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || process.env.REDIS || '';

let redis: Redis | null = null;

if (REDIS_URL) {
  // Configure Redis with TLS support for Upstash
  const redisOptions: any = {
    maxRetriesPerRequest: 3,
    retryStrategy: (times: number) => {
      if (times > 3) {
        console.warn('Redis connection failed after 3 retries');
        return null;
      }
      return Math.min(times * 50, 2000);
    },
    lazyConnect: true,
    enableOfflineQueue: false,
  };

  // Add TLS config if using rediss:// protocol (Upstash)
  if (REDIS_URL.startsWith('rediss://')) {
    redisOptions.tls = {
      rejectUnauthorized: false, // Required for Upstash
    };
  }

  redis = new Redis(REDIS_URL, redisOptions);

  redis.on('error', (err) => {
    console.warn('Redis connection error:', err.message);
  });

  redis.connect().catch((err) => {
    console.warn('Failed to connect to Redis:', err.message);
    redis = null;
  });
} else {
  console.warn('⚠ REDIS_URL not set — rate limiting will fall back to in-memory');
}

export default redis;
