/**
 * Translation Cache Service
 *
 * Provides memory and localStorage caching for translation files and metadata
 */

import { SupportedLanguage } from '../types/language-config';

interface CachedTranslation {
  data: Record<string, any>;
  timestamp: number;
  version: string;
  etag?: string;
}

interface CacheMetadata {
  size: number;
  entries: number;
  lastCleanup: number;
  hitRate: number;
  totalRequests: number;
  cacheHits: number;
}

export class TranslationCacheService {
  private memoryCache = new Map<string, CachedTranslation>();
  private readonly maxMemoryEntries = 50;
  private readonly maxAge = 24 * 60 * 60 * 1000; // 24 hours
  private readonly localStoragePrefix = 'timetracker_translations_';
  private stats: CacheMetadata = {
    size: 0,
    entries: 0,
    lastCleanup: Date.now(),
    hitRate: 0,
    totalRequests: 0,
    cacheHits: 0
  };

  /**
   * Get cached translation data
   */
  async get(
    language: SupportedLanguage,
    namespace?: string,
    version: string = '1.0.0'
  ): Promise<Record<string, any> | null> {
    this.stats.totalRequests++;

    const cacheKey = this.getCacheKey(language, namespace, version);

    // Try memory cache first
    const memoryEntry = this.memoryCache.get(cacheKey);
    if (memoryEntry && this.isValidEntry(memoryEntry)) {
      this.stats.cacheHits++;
      this.updateHitRate();
      return memoryEntry.data;
    }

    // Try localStorage
    try {
      const localEntry = this.getFromLocalStorage(cacheKey);
      if (localEntry && this.isValidEntry(localEntry)) {
        // Move to memory cache for faster access
        this.memoryCache.set(cacheKey, localEntry);
        this.cleanupMemoryCache();

        this.stats.cacheHits++;
        this.updateHitRate();
        return localEntry.data;
      }
    } catch (error) {
      console.warn('Failed to read from localStorage cache:', error);
    }

    this.updateHitRate();
    return null;
  }

  /**
   * Store translation data in cache
   */
  async set(
    language: SupportedLanguage,
    data: Record<string, any>,
    namespace?: string,
    version: string = '1.0.0',
    etag?: string
  ): Promise<void> {
    const cacheKey = this.getCacheKey(language, namespace, version);
    const entry: CachedTranslation = {
      data,
      timestamp: Date.now(),
      version,
      etag
    };

    // Store in memory cache
    this.memoryCache.set(cacheKey, entry);
    this.cleanupMemoryCache();

    // Store in localStorage
    try {
      this.setToLocalStorage(cacheKey, entry);
    } catch (error) {
      console.warn('Failed to write to localStorage cache:', error);
      // If localStorage fails, continue with memory cache only
    }

    this.updateStats();
  }

  /**
   * Check if cached data is still valid based on ETag
   */
  isStale(
    language: SupportedLanguage,
    etag: string,
    namespace?: string,
    version: string = '1.0.0'
  ): boolean {
    const cacheKey = this.getCacheKey(language, namespace, version);
    const entry = this.memoryCache.get(cacheKey) || this.getFromLocalStorage(cacheKey);

    if (!entry || !this.isValidEntry(entry)) {
      return true;
    }

    return entry.etag !== etag;
  }

  /**
   * Preload multiple languages for better performance
   */
  async preloadLanguages(
    languages: SupportedLanguage[],
    namespaces: string[] = ['common', 'dashboard'],
    version: string = '1.0.0'
  ): Promise<void> {
    const preloadPromises = [];

    for (const language of languages) {
      for (const namespace of namespaces) {
        // Only preload if not already cached
        const cached = await this.get(language, namespace, version);
        if (!cached) {
          preloadPromises.push(this.fetchAndCache(language, namespace, version));
        }
      }
    }

    try {
      await Promise.allSettled(preloadPromises);
    } catch (error) {
      console.warn('Some preload operations failed:', error);
    }
  }

  /**
   * Clear cache for specific language or all
   */
  clear(language?: SupportedLanguage, namespace?: string): void {
    if (language) {
      const pattern = this.getCacheKey(language, namespace);

      // Clear from memory
      for (const key of this.memoryCache.keys()) {
        if (key.startsWith(pattern)) {
          this.memoryCache.delete(key);
        }
      }

      // Clear from localStorage
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key?.startsWith(this.localStoragePrefix + pattern)) {
            localStorage.removeItem(key);
          }
        }
      } catch (error) {
        console.warn('Failed to clear localStorage cache:', error);
      }
    } else {
      // Clear all
      this.memoryCache.clear();
      try {
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const key = localStorage.key(i);
          if (key?.startsWith(this.localStoragePrefix)) {
            localStorage.removeItem(key);
          }
        }
      } catch (error) {
        console.warn('Failed to clear localStorage cache:', error);
      }
    }

    this.updateStats();
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheMetadata {
    return { ...this.stats };
  }

  /**
   * Perform cache maintenance
   */
  cleanup(): void {
    const now = Date.now();

    // Cleanup memory cache
    for (const [key, entry] of this.memoryCache.entries()) {
      if (!this.isValidEntry(entry)) {
        this.memoryCache.delete(key);
      }
    }

    // Cleanup localStorage
    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key?.startsWith(this.localStoragePrefix)) {
          const entry = this.getFromLocalStorage(key.replace(this.localStoragePrefix, ''));
          if (entry && !this.isValidEntry(entry)) {
            localStorage.removeItem(key);
          }
        }
      }
    } catch (error) {
      console.warn('Failed to cleanup localStorage cache:', error);
    }

    this.stats.lastCleanup = now;
    this.updateStats();
  }

  /**
   * Private helper methods
   */
  private getCacheKey(language: SupportedLanguage, namespace?: string, version?: string): string {
    const parts: string[] = [language as string];
    if (namespace) parts.push(namespace);
    if (version) parts.push(version);
    return parts.join(':');
  }

  private isValidEntry(entry: CachedTranslation): boolean {
    return (Date.now() - entry.timestamp) < this.maxAge;
  }

  private getFromLocalStorage(cacheKey: string): CachedTranslation | null {
    try {
      const stored = localStorage.getItem(this.localStoragePrefix + cacheKey);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      return null;
    }
  }

  private setToLocalStorage(cacheKey: string, entry: CachedTranslation): void {
    try {
      localStorage.setItem(this.localStoragePrefix + cacheKey, JSON.stringify(entry));
    } catch (error) {
      // Handle localStorage quota exceeded
      this.clearOldestLocalStorageEntries();
      localStorage.setItem(this.localStoragePrefix + cacheKey, JSON.stringify(entry));
    }
  }

  private clearOldestLocalStorageEntries(): void {
    try {
      const entries: Array<{ key: string; timestamp: number }> = [];

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(this.localStoragePrefix)) {
          const entry = this.getFromLocalStorage(key.replace(this.localStoragePrefix, ''));
          if (entry) {
            entries.push({ key, timestamp: entry.timestamp });
          }
        }
      }

      // Sort by timestamp and remove oldest 25%
      entries.sort((a, b) => a.timestamp - b.timestamp);
      const toRemove = Math.ceil(entries.length * 0.25);

      for (let i = 0; i < toRemove; i++) {
        localStorage.removeItem(entries[i].key);
      }
    } catch (error) {
      console.warn('Failed to clear oldest localStorage entries:', error);
    }
  }

  private cleanupMemoryCache(): void {
    if (this.memoryCache.size > this.maxMemoryEntries) {
      // Remove oldest entries
      const entries = Array.from(this.memoryCache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);

      const toRemove = this.memoryCache.size - this.maxMemoryEntries;
      for (let i = 0; i < toRemove; i++) {
        this.memoryCache.delete(entries[i][0]);
      }
    }
  }

  private updateHitRate(): void {
    if (this.stats.totalRequests > 0) {
      this.stats.hitRate = this.stats.cacheHits / this.stats.totalRequests;
    }
  }

  private updateStats(): void {
    this.stats.entries = this.memoryCache.size;
    this.stats.size = this.calculateCacheSize();
  }

  private calculateCacheSize(): number {
    let size = 0;
    for (const entry of this.memoryCache.values()) {
      size += JSON.stringify(entry).length;
    }
    return size;
  }

  private async fetchAndCache(
    language: SupportedLanguage,
    namespace: string,
    version: string
  ): Promise<void> {
    try {
      const response = await fetch(`/api/v1/translations/${language}?namespace=${namespace}&version=${version}`);
      if (response.ok) {
        const data = await response.json();
        const etag = response.headers.get('etag') || undefined;
        await this.set(language, data.namespaces[namespace] || {}, namespace, version, etag);
      }
    } catch (error) {
      console.warn(`Failed to preload ${language}:${namespace}:`, error);
    }
  }
}

// Export singleton instance
export const translationCache = new TranslationCacheService();