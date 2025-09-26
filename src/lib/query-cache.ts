/**
 * Query caching and optimization utilities
 */

interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
  key: string;
}

interface CacheConfig {
  ttl: number; // Default TTL in milliseconds
  maxSize: number; // Maximum number of entries
  cleanupInterval: number; // How often to clean up expired entries
}

// Default cache configuration
const DEFAULT_CACHE_CONFIG: CacheConfig = {
  ttl: 5 * 60 * 1000, // 5 minutes
  maxSize: 1000, // 1000 entries
  cleanupInterval: 10 * 60 * 1000 // 10 minutes
};

/**
 * In-memory cache implementation
 */
class MemoryCache {
  private cache = new Map<string, CacheEntry>();
  private config: CacheConfig;
  private cleanupTimer?: NodeJS.Timeout;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...DEFAULT_CACHE_CONFIG, ...config };
    this.startCleanup();
  }

  /**
   * Get value from cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set value in cache
   */
  set<T>(key: string, data: T, ttl?: number): void {
    const now = Date.now();
    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      ttl: ttl || this.config.ttl,
      key
    };

    // Check cache size limit
    if (this.cache.size >= this.config.maxSize) {
      // Remove oldest entries
      const entries = Array.from(this.cache.entries());
      entries.sort(([, a], [, b]) => a.timestamp - b.timestamp);

      const toRemove = Math.ceil(this.config.maxSize * 0.1); // Remove 10%
      for (let i = 0; i < toRemove; i++) {
        this.cache.delete(entries[i][0]);
      }
    }

    this.cache.set(key, entry);
  }

  /**
   * Delete entry from cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    expiredEntries: number;
  } {
    const now = Date.now();
    let expiredEntries = 0;
    let totalEntries = 0;

    for (const [, entry] of this.cache) {
      totalEntries++;
      if (now - entry.timestamp > entry.ttl) {
        expiredEntries++;
      }
    }

    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
      hitRate: 0, // Would need to track hits/misses for accurate rate
      expiredEntries
    };
  }

  /**
   * Start cleanup timer
   */
  private startCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache) {
      if (now - entry.timestamp > entry.ttl) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      this.cache.delete(key);
    }

    console.log(`Cache cleanup: removed ${keysToDelete.length} expired entries`);
  }

  /**
   * Destroy cache and cleanup timers
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    this.cache.clear();
  }
}

// Global cache instances
const queryCache = new MemoryCache({
  ttl: 5 * 60 * 1000, // 5 minutes for query results
  maxSize: 500
});

const sessionCache = new MemoryCache({
  ttl: 30 * 60 * 1000, // 30 minutes for user sessions
  maxSize: 1000
});

const configCache = new MemoryCache({
  ttl: 60 * 60 * 1000, // 1 hour for configuration data
  maxSize: 100
});

/**
 * Generate cache key from parameters
 */
export function generateCacheKey(prefix: string, ...params: any[]): string {
  const paramStr = params
    .map(p => {
      if (typeof p === 'object' && p !== null) {
        return JSON.stringify(p);
      }
      return String(p);
    })
    .join(':');

  return `${prefix}:${paramStr}`;
}

/**
 * Cached query wrapper
 */
export async function cachedQuery<T>(
  key: string,
  queryFn: () => Promise<T>,
  ttl?: number
): Promise<T> {
  // Try to get from cache first
  const cached = queryCache.get<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Execute query
  const result = await queryFn();

  // Cache the result
  queryCache.set(key, result, ttl);

  return result;
}

/**
 * Cached user session wrapper
 */
export async function cachedUserData<T>(
  userId: string,
  dataType: string,
  queryFn: () => Promise<T>,
  ttl?: number
): Promise<T> {
  const key = generateCacheKey('user', userId, dataType);

  const cached = sessionCache.get<T>(key);
  if (cached !== null) {
    return cached;
  }

  const result = await queryFn();
  sessionCache.set(key, result, ttl);

  return result;
}

/**
 * Invalidate user data cache
 */
export function invalidateUserCache(userId: string, dataType?: string): void {
  if (dataType) {
    const key = generateCacheKey('user', userId, dataType);
    sessionCache.delete(key);
  } else {
    // Invalidate all cache entries for user
    const prefix = `user:${userId}:`;
    for (const [key] of sessionCache.cache) {
      if (key.startsWith(prefix)) {
        sessionCache.delete(key);
      }
    }
  }
}

/**
 * Cache for expensive computations
 */
export async function cachedComputation<T>(
  computationKey: string,
  computeFn: () => Promise<T>,
  ttl: number = 30 * 60 * 1000 // 30 minutes
): Promise<T> {
  const key = generateCacheKey('computation', computationKey);

  const cached = queryCache.get<T>(key);
  if (cached !== null) {
    return cached;
  }

  const result = await computeFn();
  queryCache.set(key, result, ttl);

  return result;
}

/**
 * Query optimization utilities
 */
export const QueryOptimizer = {
  /**
   * Batch multiple queries together
   */
  async batchQueries<T>(queries: (() => Promise<T>)[]): Promise<T[]> {
    return Promise.all(queries.map(query => query()));
  },

  /**
   * Debounced query execution
   */
  debounceQuery<T>(
    key: string,
    queryFn: () => Promise<T>,
    delay: number = 300
  ): () => Promise<T> {
    const debounceMap = new Map<string, NodeJS.Timeout>();

    return () => {
      return new Promise<T>((resolve, reject) => {
        // Clear existing timeout
        const existingTimeout = debounceMap.get(key);
        if (existingTimeout) {
          clearTimeout(existingTimeout);
        }

        // Set new timeout
        const timeout = setTimeout(async () => {
          try {
            const result = await queryFn();
            resolve(result);
          } catch (error) {
            reject(error);
          } finally {
            debounceMap.delete(key);
          }
        }, delay);

        debounceMap.set(key, timeout);
      });
    };
  },

  /**
   * Paginated query with caching
   */
  async paginatedQuery<T>(
    baseKey: string,
    page: number,
    pageSize: number,
    queryFn: (offset: number, limit: number) => Promise<{ data: T[]; total: number }>,
    ttl?: number
  ): Promise<{ data: T[]; total: number; page: number; pageSize: number }> {
    const key = generateCacheKey(baseKey, 'page', page, pageSize);
    const offset = (page - 1) * pageSize;

    return cachedQuery(
      key,
      async () => {
        const result = await queryFn(offset, pageSize);
        return {
          ...result,
          page,
          pageSize
        };
      },
      ttl
    );
  }
};

/**
 * Database connection pooling utilities
 */
export const ConnectionPool = {
  /**
   * Warm up database connections
   */
  async warmup(connectionFn: () => Promise<any>): Promise<void> {
    try {
      const connection = await connectionFn();
      // Perform a simple query to warm up the connection
      // This would depend on your database client
      console.log('Database connection warmed up');
    } catch (error) {
      console.error('Failed to warm up database connection:', error);
    }
  },

  /**
   * Health check for database connections
   */
  async healthCheck(connectionFn: () => Promise<any>): Promise<boolean> {
    try {
      const connection = await connectionFn();
      // Perform health check query
      return true;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }
};

/**
 * Export cache instances for direct use
 */
export const caches = {
  query: queryCache,
  session: sessionCache,
  config: configCache
};

/**
 * Get cache statistics
 */
export function getCacheStats() {
  return {
    query: queryCache.getStats(),
    session: sessionCache.getStats(),
    config: configCache.getStats()
  };
}

/**
 * Clear all caches
 */
export function clearAllCaches(): void {
  queryCache.clear();
  sessionCache.clear();
  configCache.clear();
}

// Cleanup on process exit
if (typeof process !== 'undefined') {
  process.on('exit', () => {
    queryCache.destroy();
    sessionCache.destroy();
    configCache.destroy();
  });
}

export default {
  cachedQuery,
  cachedUserData,
  cachedComputation,
  invalidateUserCache,
  generateCacheKey,
  QueryOptimizer,
  ConnectionPool,
  caches,
  getCacheStats,
  clearAllCaches
};