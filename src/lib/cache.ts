import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

export async function getCached<T>(
    key: string,
    ttl: number,
    fetchFn: () => Promise<T>
): Promise<T> {
    try {
        const cached = await redis.get(key);
        if (cached) {
            console.log(`[CACHE HIT] ${key}`);
            return (typeof cached === 'string' ? JSON.parse(cached) : cached) as T;
        }
    } catch (error) {
        console.error(`[CACHE ERROR] get: ${key}`, error);
    }

    const data = await fetchFn();

    try {
        await redis.set(key, JSON.stringify(data), { ex: ttl });
        console.log(`[CACHE MISS] ${key} - stored with TTL ${ttl}s`);
    } catch (error) {
        console.error(`[CACHE ERROR] set: ${key}`, error);
    }

    return data;
}

export async function invalidateCache(...keys: string[]) {
    try {
        await redis.del(...keys);
        console.log(`[CACHE INVALIDATE] ${keys.join(', ')}`);
    } catch (error) {
        console.error(`[CACHE ERROR] invalidate: ${keys}`, error);
    }
}

export default redis;
