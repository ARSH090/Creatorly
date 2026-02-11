import Redis from 'ioredis';

// Check if Redis URL is configured
const REDIS_URL = process.env.REDIS_URL || process.env.REDIS_HOST;

let redis: Redis | null = null;

// Only initialize Redis if URL is provided
if (REDIS_URL) {
  const redisOptions: any = {
    retryStrategy: (times: number) => {
      if (times > 3) {
        console.warn('Redis connection failed after 3 retries, falling back to no-cache mode');
        return null; // Stop retrying
      }
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    enableReadyCheck: false,
    enableOfflineQueue: false,
    lazyConnect: true, // Don't connect immediately
  };

  // Add TLS config if using rediss:// protocol (Upstash)
  if (REDIS_URL.startsWith('rediss://')) {
    redisOptions.tls = {
      rejectUnauthorized: false, // Required for Upstash
    };
  }

  redis = new Redis(REDIS_URL, redisOptions);

  // Handle errors gracefully
  redis.on('error', (err) => {
    console.warn('Redis connection error (falling back to no-cache):', err.message);
  });

  redis.on('connect', () => console.log('✓ Redis connected'));
  redis.on('disconnect', () => console.log('Redis disconnected'));

  // Try to connect, but don't crash if it fails
  redis.connect().catch((err) => {
    console.warn('Failed to connect to Redis, running without cache:', err.message);
    redis = null;
  });
} else {
  console.warn('⚠ REDIS_URL not set — caching disabled (in-memory fallback)');
}


interface CacheOptions {
  ttl?: number; // Time to live in seconds
  tags?: string[]; // For cache invalidation groups
}

/**
 * Get value from cache
 */
export async function getCachedValue<T>(key: string): Promise<T | null> {
  if (!redis) return null;
  try {
    const value = await redis.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error(`Error getting cache key ${key}:`, error);
    return null;
  }
}

/**
 * Set value in cache
 */
export async function setCachedValue<T>(
  key: string,
  value: T,
  options: CacheOptions = {}
): Promise<boolean> {
  if (!redis) return false;
  try {
    const serialized = JSON.stringify(value);
    const ttl = options.ttl || 3600; // Default 1 hour

    if (ttl) {
      await redis.setex(key, ttl, serialized);
    } else {
      await redis.set(key, serialized);
    }

    // Add tags for grouped invalidation
    if (options.tags && options.tags.length > 0) {
      for (const tag of options.tags) {
        await redis.sadd(`tag:${tag}`, key);
      }
    }

    return true;
  } catch (error) {
    console.error(`Error setting cache key ${key}:`, error);
    return false;
  }
}

/**
 * Delete cache key
 */
export async function deleteCachedValue(key: string): Promise<boolean> {
  if (!redis) return false;
  try {
    await redis.del(key);
    return true;
  } catch (error) {
    console.error(`Error deleting cache key ${key}:`, error);
    return false;
  }
}

/**
 * Invalidate all keys with specific tag
 */
export async function invalidateByTag(tag: string): Promise<number> {
  if (!redis) return 0;
  try {
    const keys = await redis.smembers(`tag:${tag}`);
    if (keys.length === 0) return 0;

    await redis.del(...keys);
    await redis.del(`tag:${tag}`);
    return keys.length;
  } catch (error) {
    console.error(`Error invalidating tag ${tag}:`, error);
    return 0;
  }
}

/**
 * Get or set pattern - fetch from cache or compute
 */
export async function getOrSet<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  // Try cache first
  const cached = await getCachedValue<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Compute value
  const value = await fetcher();

  // Store in cache
  await setCachedValue(key, value, options);

  return value;
}

/**
 * Memoize expensive function calls
 */
export function memoize<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  keyPrefix: string,
  ttl: number = 3600
) {
  return async (...args: any[]) => {
    const key = `${keyPrefix}:${JSON.stringify(args)}`;
    return getOrSet(key, () => fn(...args), { ttl });
  };
}

/**
 * Cache layer for database queries
 */
export async function cachedQuery<T>(
  key: string,
  query: () => Promise<T>,
  ttl: number = 3600,
  tags: string[] = []
): Promise<T> {
  return getOrSet(key, query, { ttl, tags });
}

/**
 * Clear entire cache (use with caution)
 */
export async function clearAllCache(): Promise<number> {
  if (!redis) return 0;
  try {
    const keys = await redis.keys('*');
    if (keys.length === 0) return 0;
    await redis.del(...keys);
    return keys.length;
  } catch (error) {
    console.error('Error clearing cache:', error);
    return 0;
  }
}

/**
 * Get cache stats
 */
export async function getCacheStats() {
  if (!redis) return null;
  try {
    const info = await redis.info('stats');
    const keys = await redis.dbsize();
    return {
      keyCount: keys,
      info,
    };
  } catch (error) {
    console.error('Error getting cache stats:', error);
    return null;
  }
}

/**
 * Cache decorators for API responses
 */
export function CacheDecorator(ttl: number = 3600, tags: string[] = []) {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cacheKey = `${propertyKey}:${JSON.stringify(args)}`;
      return cachedQuery(cacheKey, () => originalMethod.apply(this, args), ttl, tags);
    };

    return descriptor;
  };
}

/**
 * Session storage helpers
 */
export async function storeSession(sessionId: string, data: any): Promise<void> {
  await setCachedValue(`session:${sessionId}`, data, {
    ttl: 86400 * 30, // 30 days
    tags: ['sessions'],
  });
}

export async function getSession(sessionId: string): Promise<any> {
  return getCachedValue(`session:${sessionId}`);
}

export async function deleteSession(sessionId: string): Promise<void> {
  await deleteCachedValue(`session:${sessionId}`);
}

export default redis;
