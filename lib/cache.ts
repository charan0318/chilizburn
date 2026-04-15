type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

const memoryCache = new Map<string, CacheEntry<unknown>>();

interface CacheOptions {
  returnStaleOnError?: boolean;
}

export async function getOrSetCache<T>(
  key: string,
  ttlMs: number,
  loader: () => Promise<T>,
  options?: CacheOptions,
): Promise<T> {
  const now = Date.now();
  const cached = memoryCache.get(key) as CacheEntry<T> | undefined;
  const returnStaleOnError = options?.returnStaleOnError ?? true;

  if (cached && cached.expiresAt > now) {
    return cached.value;
  }

  try {
    const value = await loader();
    memoryCache.set(key, {
      value,
      expiresAt: now + ttlMs,
    });

    return value;
  } catch (error) {
    if (cached && returnStaleOnError) {
      return cached.value;
    }

    throw error;
  }
}

export function clearCacheByPrefix(prefix: string): void {
  for (const key of memoryCache.keys()) {
    if (key.startsWith(prefix)) {
      memoryCache.delete(key);
    }
  }
}
