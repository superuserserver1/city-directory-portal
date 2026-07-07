interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const store = new Map<string, CacheEntry<unknown>>();

// Auto-cleanup every 5 minutes
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let cleanupTimer: ReturnType<typeof setInterval> | null = null;

function startCleanup() {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (entry.expiresAt <= now) {
        store.delete(key);
      }
    }
  }, CLEANUP_INTERVAL_MS);

  // Allow the process to exit even if the timer is active
  if (cleanupTimer.unref) {
    cleanupTimer.unref();
  }
}

/**
 * Get a cached value by key. Returns null if not found or expired.
 */
export function get<T>(key: string): T | null {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.value as T;
}

/**
 * Set a cache entry with a TTL in milliseconds.
 */
export function set(key: string, value: unknown, ttlMs: number): void {
  startCleanup();
  store.set(key, {
    value,
    expiresAt: Date.now() + ttlMs,
  });
}

/**
 * Invalidate a single cache entry by exact key.
 */
export function invalidate(key: string): void {
  store.delete(key);
}

/**
 * Invalidate all cache entries whose keys match the given prefix/pattern.
 * Uses simple startsWith matching for efficiency.
 */
export function invalidatePattern(pattern: string): void {
  for (const key of store.keys()) {
    if (key.startsWith(pattern)) {
      store.delete(key);
    }
  }
}