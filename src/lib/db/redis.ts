import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || process.env.REDIS || '';

if (!REDIS_URL) {
  console.warn('REDIS_URL not set — rate limiting will fall back to in-memory (not recommended for production)');
}

const redis = REDIS_URL ? new Redis(REDIS_URL) : null;

export default redis;
