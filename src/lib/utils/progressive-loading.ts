/**
 * Progressive Loading Utilities
 *
 * Implements progressive loading strategies for translation files and assets
 */

import { SupportedLanguage } from '../types/language-config';
import { translationCache } from '../services/translation-cache';
import { performanceMonitor } from '../services/performance-monitor';

interface LoadingPriority {
  namespace: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  estimatedSize: number;
}

interface LoadingStrategy {
  immediate: string[];
  afterInteraction: string[];
  background: string[];
  onDemand: string[];
}

interface ProgressiveLoadingOptions {
  strategy?: 'conservative' | 'balanced' | 'aggressive';
  maxConcurrent?: number;
  chunkSize?: number;
  delayBetweenChunks?: number;
}

export class ProgressiveLoadingService {
  private readonly defaultPriorities: LoadingPriority[] = [
    { namespace: 'common', priority: 'critical', estimatedSize: 5000 },
    { namespace: 'auth', priority: 'critical', estimatedSize: 3000 },
    { namespace: 'dashboard', priority: 'high', estimatedSize: 8000 },
    { namespace: 'time', priority: 'high', estimatedSize: 6000 },
    { namespace: 'settings', priority: 'medium', estimatedSize: 4000 },
    { namespace: 'export', priority: 'low', estimatedSize: 3000 }
  ];

  private readonly strategies: Record<string, LoadingStrategy> = {
    conservative: {
      immediate: ['common', 'auth'],
      afterInteraction: ['dashboard'],
      background: ['time', 'settings'],
      onDemand: ['export']
    },
    balanced: {
      immediate: ['common', 'auth', 'dashboard'],
      afterInteraction: ['time'],
      background: ['settings'],
      onDemand: ['export']
    },
    aggressive: {
      immediate: ['common', 'auth', 'dashboard', 'time'],
      afterInteraction: ['settings', 'export'],
      background: [],
      onDemand: []
    }
  };

  private loadingState = new Map<string, 'pending' | 'loading' | 'loaded' | 'error'>();
  private loadingPromises = new Map<string, Promise<any>>();

  /**
   * Load translations progressively based on strategy
   */
  async loadProgressively(
    language: SupportedLanguage,
    options: ProgressiveLoadingOptions = {}
  ): Promise<void> {
    const {
      strategy = 'balanced',
      maxConcurrent = 3,
      chunkSize = 2,
      delayBetweenChunks = 100
    } = options;

    const loadingStrategy = this.strategies[strategy];
    if (!loadingStrategy) {
      throw new Error(`Unknown loading strategy: ${strategy}`);
    }

    try {
      // Phase 1: Load critical resources immediately
      await this.loadNamespaceChunk(
        language,
        loadingStrategy.immediate,
        { concurrent: Math.min(maxConcurrent, loadingStrategy.immediate.length) }
      );

      // Phase 2: Load after user interaction (with small delay)
      if (loadingStrategy.afterInteraction.length > 0) {
        setTimeout(() => {
          this.loadNamespaceChunk(
            language,
            loadingStrategy.afterInteraction,
            { concurrent: maxConcurrent, chunk: chunkSize, delay: delayBetweenChunks }
          );
        }, 50);
      }

      // Phase 3: Load in background
      if (loadingStrategy.background.length > 0) {
        setTimeout(() => {
          this.loadNamespaceChunk(
            language,
            loadingStrategy.background,
            { concurrent: Math.min(2, maxConcurrent), chunk: chunkSize, delay: delayBetweenChunks * 2 }
          );
        }, 500);
      }

      // Phase 4: On-demand loading is handled by getNamespace method

    } catch (error) {
      console.error('Progressive loading failed:', error);
      throw error;
    }
  }

  /**
   * Get namespace data with progressive loading fallback
   */
  async getNamespace(
    language: SupportedLanguage,
    namespace: string,
    version: string = '1.0.0'
  ): Promise<Record<string, any>> {
    const cacheKey = `${language}:${namespace}:${version}`;

    // Check if already loaded or in cache
    const cached = await translationCache.get(language, namespace, version);
    if (cached) {
      return cached;
    }

    // Check if currently loading
    if (this.loadingPromises.has(cacheKey)) {
      return await this.loadingPromises.get(cacheKey)!;
    }

    // Start loading
    const loadingPromise = this.loadSingleNamespace(language, namespace, version);
    this.loadingPromises.set(cacheKey, loadingPromise);

    try {
      const result = await loadingPromise;
      this.loadingState.set(cacheKey, 'loaded');
      return result;
    } catch (error) {
      this.loadingState.set(cacheKey, 'error');
      throw error;
    } finally {
      this.loadingPromises.delete(cacheKey);
    }
  }

  /**
   * Preload translations for likely next languages
   */
  async preloadAdjacentLanguages(
    currentLanguage: SupportedLanguage,
    priority: string[] = ['common', 'dashboard']
  ): Promise<void> {
    const adjacentLanguages = this.getAdjacentLanguages(currentLanguage);

    const preloadPromises = adjacentLanguages.map(async (language) => {
      for (const namespace of priority) {
        try {
          const cached = await translationCache.get(language, namespace);
          if (!cached) {
            await this.loadSingleNamespace(language, namespace, '1.0.0');
          }
        } catch (error) {
          // Ignore preload errors
          console.debug(`Preload failed for ${language}:${namespace}:`, error);
        }
      }
    });

    try {
      await Promise.allSettled(preloadPromises);
    } catch (error) {
      console.warn('Adjacent language preloading failed:', error);
    }
  }

  /**
   * Get loading status for debugging
   */
  getLoadingStatus(): Record<string, any> {
    const status: Record<string, any> = {};

    for (const [key, state] of this.loadingState.entries()) {
      status[key] = {
        state,
        isLoading: this.loadingPromises.has(key)
      };
    }

    return status;
  }

  /**
   * Prefetch critical namespaces for faster switching
   */
  async prefetchCritical(languages: SupportedLanguage[]): Promise<void> {
    const criticalNamespaces = this.defaultPriorities
      .filter(p => p.priority === 'critical')
      .map(p => p.namespace);

    const prefetchPromises = [];

    for (const language of languages) {
      for (const namespace of criticalNamespaces) {
        prefetchPromises.push(
          this.getNamespace(language, namespace).catch(() => {
            // Ignore prefetch errors
          })
        );
      }
    }

    try {
      await Promise.allSettled(prefetchPromises);
    } catch (error) {
      console.warn('Critical prefetch failed:', error);
    }
  }

  /**
   * Load with retry logic
   */
  async loadWithRetry(
    language: SupportedLanguage,
    namespace: string,
    version: string = '1.0.0',
    maxRetries: number = 3
  ): Promise<Record<string, any>> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.loadSingleNamespace(language, namespace, version);
      } catch (error) {
        lastError = error as Error;

        if (attempt < maxRetries) {
          // Exponential backoff
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }

  /**
   * Private helper methods
   */
  private async loadNamespaceChunk(
    language: SupportedLanguage,
    namespaces: string[],
    options: {
      concurrent?: number;
      chunk?: number;
      delay?: number;
    } = {}
  ): Promise<void> {
    const { concurrent = 2, chunk = namespaces.length, delay = 0 } = options;

    // Process in chunks if specified
    if (chunk < namespaces.length) {
      for (let i = 0; i < namespaces.length; i += chunk) {
        const chunkNamespaces = namespaces.slice(i, i + chunk);
        await this.loadConcurrent(language, chunkNamespaces, concurrent);

        if (delay > 0 && i + chunk < namespaces.length) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    } else {
      await this.loadConcurrent(language, namespaces, concurrent);
    }
  }

  private async loadConcurrent(
    language: SupportedLanguage,
    namespaces: string[],
    maxConcurrent: number
  ): Promise<void> {
    const semaphore = new Array(maxConcurrent).fill(null);
    let index = 0;

    const loadNext = async (): Promise<void> => {
      while (index < namespaces.length) {
        const currentIndex = index++;
        const namespace = namespaces[currentIndex];

        try {
          await this.loadSingleNamespace(language, namespace, '1.0.0');
        } catch (error) {
          console.warn(`Failed to load ${namespace} for ${language}:`, error);
        }
      }
    };

    await Promise.all(semaphore.map(() => loadNext()));
  }

  private async loadSingleNamespace(
    language: SupportedLanguage,
    namespace: string,
    version: string
  ): Promise<Record<string, any>> {
    const cacheKey = `${language}:${namespace}:${version}`;
    this.loadingState.set(cacheKey, 'loading');

    return await performanceMonitor.monitorLoading(async () => {
      const response = await fetch(
        `/api/v1/translations/${language}?namespace=${namespace}&version=${version}`,
        {
          headers: {
            'Accept': 'application/json',
            'Cache-Control': 'max-age=3600'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to load ${namespace} for ${language}: ${response.status}`);
      }

      const data = await response.json();
      const namespaceData = data.namespaces[namespace] || {};

      // Cache the result
      const etag = response.headers.get('etag') || undefined;
      await translationCache.set(language, namespaceData, namespace, version, etag);

      return namespaceData;
    }, {
      language,
      namespace,
      version,
      cacheHit: false
    });
  }

  private getAdjacentLanguages(currentLanguage: SupportedLanguage): SupportedLanguage[] {
    // Define language proximity for intelligent preloading
    const languageGroups: Record<string, SupportedLanguage[]> = {
      'en': ['es' as unknown as SupportedLanguage, 'fr' as unknown as SupportedLanguage],
      'es': ['en' as unknown as SupportedLanguage, 'fr' as unknown as SupportedLanguage, 'it' as unknown as SupportedLanguage],
      'fr': ['en' as unknown as SupportedLanguage, 'es' as unknown as SupportedLanguage, 'it' as unknown as SupportedLanguage],
      'de': ['en' as unknown as SupportedLanguage, 'fr' as unknown as SupportedLanguage],
      'it': ['es' as unknown as SupportedLanguage, 'fr' as unknown as SupportedLanguage, 'en' as unknown as SupportedLanguage]
    };

    return languageGroups[currentLanguage as unknown as string] || ['en' as unknown as SupportedLanguage];
  }
}

// Export singleton instance
export const progressiveLoader = new ProgressiveLoadingService();

// Utility functions for component use
export const loadingUtils = {
  /**
   * Load namespace with loading state management
   */
  useProgressiveNamespace: async (
    language: SupportedLanguage,
    namespace: string,
    onLoading?: (loading: boolean) => void,
    onError?: (error: Error) => void
  ): Promise<Record<string, any> | null> => {
    try {
      onLoading?.(true);
      const data = await progressiveLoader.getNamespace(language, namespace);
      onLoading?.(false);
      return data;
    } catch (error) {
      onLoading?.(false);
      onError?.(error as Error);
      return null;
    }
  },

  /**
   * Preload in the background without blocking
   */
  backgroundPreload: (languages: SupportedLanguage[]): void => {
    // Use requestIdleCallback if available
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      (window as any).requestIdleCallback(() => {
        progressiveLoader.prefetchCritical(languages);
      });
    } else {
      // Fallback to setTimeout
      setTimeout(() => {
        progressiveLoader.prefetchCritical(languages);
      }, 1000);
    }
  }
};