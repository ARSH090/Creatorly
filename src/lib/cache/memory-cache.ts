/**
 * Lightweight in-process TTL cache for Vercel serverless functions.
 * 
 * Because each Vercel lambda is a long-lived process (warm), data cached here
 * survives across requests within the same instance. It will NOT be shared
 * across different lambda instances (use Vercel KV / Redis for that), but it
 * eliminates redundant DB hits within a single instance's lifetime.
 *
 * Usage:
 *   const plansCache = createMemoryCache<Plan[]>(5 * 60 * 1000); // 5 min TTL
 *   const data = await plansCache.get('plans', () => Plan.find().lean());
 */

interface CacheEntry<T> {
    value: T;
    expiresAt: number;
}

export interface MemoryCache<T> {
    get(key: string, fetcher: () => Promise<T>): Promise<T>;
    set(key: string, value: T): void;
    invalidate(key: string): void;
    invalidateAll(): void;
}

export function createMemoryCache<T>(ttlMs: number): MemoryCache<T> {
    const store = new Map<string, CacheEntry<T>>();
    // In-flight deduplication: prevent multiple concurrent fetches for the same key
    const inflight = new Map<string, Promise<T>>();

    return {
        async get(key: string, fetcher: () => Promise<T>): Promise<T> {
            const now = Date.now();
            const entry = store.get(key);

            // Return cached value if still valid
            if (entry && entry.expiresAt > now) {
                return entry.value;
            }

            // Dedup concurrent requests for the same key
            const existing = inflight.get(key);
            if (existing) return existing;

            const promise = fetcher().then(value => {
                store.set(key, { value, expiresAt: now + ttlMs });
                inflight.delete(key);
                return value;
            }).catch(err => {
                inflight.delete(key);
                throw err;
            });

            inflight.set(key, promise);
            return promise;
        },

        set(key: string, value: T): void {
            store.set(key, { value, expiresAt: Date.now() + ttlMs });
        },

        invalidate(key: string): void {
            store.delete(key);
        },

        invalidateAll(): void {
            store.clear();
        }
    };
}
