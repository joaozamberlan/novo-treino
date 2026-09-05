// Cache em memória com suporte a Stale-While-Revalidate (SWR)
// Permite renderização instantânea (0ms) ao navegar entre telas

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class MemoryCache {
  private store = new Map<string, CacheEntry<any>>();

  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    return entry.data as T;
  }

  isFresh(key: string, ttlMs = 60 * 1000): boolean {
    const entry = this.store.get(key);
    if (!entry) return false;
    return Date.now() - entry.timestamp < ttlMs;
  }

  set<T>(key: string, data: T): void {
    this.store.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  invalidate(keyPrefix: string): void {
    for (const key of this.store.keys()) {
      if (key.startsWith(keyPrefix)) {
        this.store.delete(key);
      }
    }
  }

  clear(): void {
    this.store.clear();
  }
}

export const memoryCache = new MemoryCache();
