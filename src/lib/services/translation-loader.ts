/**
 * Translation Loading Service
 *
 * Handles dynamic loading, caching, and management of translation files
 * Supports namespace-based loading and browser caching
 */

import {
  TranslationFile,
  TranslationCache,
  TranslationCacheEntry,
  TranslationError,
  LoadingStatus,
  TranslationLoadingState,
  TranslationNamespace,
  TRANSLATION_NAMESPACES,
  isValidNamespace,
  createEmptyLoadingState
} from '../types/translation';
import { DEFAULT_LANGUAGE_CONFIG } from '../types/language-config';

/** Translation loading service class */
export class TranslationLoaderService {
  private loadingState: TranslationLoadingState;
  private readonly cacheSettings = DEFAULT_LANGUAGE_CONFIG.cacheSettings;

  constructor(initialLanguage: string = DEFAULT_LANGUAGE_CONFIG.defaultLanguage) {
    this.loadingState = createEmptyLoadingState(initialLanguage);
    this.loadCacheFromStorage();
  }

  /**
   * Load translation namespace for specific language
   */
  async loadNamespace(language: string, namespace: TranslationNamespace): Promise<Record<string, any>> {
    // Check cache first
    const cached = this.getCachedTranslation(language, namespace);
    if (cached) {
      this.updateLoadingStatus(namespace, 'loaded');
      return cached;
    }

    // Load from network
    this.updateLoadingStatus(namespace, 'loading');

    try {
      const translations = await this.fetchTranslation(language, namespace);
      this.cacheTranslation(language, namespace, translations);
      this.updateLoadingStatus(namespace, 'loaded');
      return translations;
    } catch (error) {
      this.handleLoadingError(language, namespace, error);
      this.updateLoadingStatus(namespace, 'error');

      // Try fallback language
      if (language !== DEFAULT_LANGUAGE_CONFIG.fallbackLanguage) {
        console.warn(`Loading ${language}/${namespace} failed, trying fallback language`);
        return await this.loadNamespace(DEFAULT_LANGUAGE_CONFIG.fallbackLanguage, namespace);
      }

      throw error;
    }
  }

  /**
   * Load multiple namespaces in parallel
   */
  async loadNamespaces(language: string, namespaces: TranslationNamespace[]): Promise<Record<string, Record<string, any>>> {
    const promises = namespaces.map(async (namespace) => {
      try {
        const translations = await this.loadNamespace(language, namespace);
        return { namespace, translations, error: null };
      } catch (error) {
        return { namespace, translations: {}, error };
      }
    });

    const results = await Promise.all(promises);
    const loadedTranslations: Record<string, Record<string, any>> = {};

    results.forEach(({ namespace, translations, error }) => {
      loadedTranslations[namespace] = translations;
      if (error) {
        console.warn(`Failed to load namespace ${namespace}:`, error);
      }
    });

    return loadedTranslations;
  }

  /**
   * Load all namespaces for a language
   */
  async loadAllNamespaces(language: string): Promise<Record<string, Record<string, any>>> {
    return this.loadNamespaces(language, [...TRANSLATION_NAMESPACES]);
  }

  /**
   * Switch to a different language
   */
  async switchLanguage(newLanguage: string): Promise<void> {
    const previousLanguage = this.loadingState.currentLanguage;
    this.loadingState.currentLanguage = newLanguage;

    try {
      // Load core namespaces immediately
      const coreNamespaces: TranslationNamespace[] = ['common', 'dashboard'];
      await this.loadNamespaces(newLanguage, coreNamespaces);

      // Preload other namespaces in background
      const remainingNamespaces = TRANSLATION_NAMESPACES.filter(ns => !coreNamespaces.includes(ns));
      this.preloadNamespaces(newLanguage, remainingNamespaces);

    } catch (error) {
      // Rollback on failure
      this.loadingState.currentLanguage = previousLanguage;
      throw new Error(`Failed to switch to language ${newLanguage}: ${error}`);
    }
  }

  /**
   * Preload namespaces in background (non-blocking)
   */
  private async preloadNamespaces(language: string, namespaces: TranslationNamespace[]): Promise<void> {
    try {
      await this.loadNamespaces(language, namespaces);
    } catch (error) {
      console.warn(`Background preload of namespaces failed:`, error);
    }
  }

  /**
   * Get current loading state
   */
  getLoadingState(): TranslationLoadingState {
    return { ...this.loadingState };
  }

  /**
   * Check if namespace is loaded for current language
   */
  isNamespaceLoaded(namespace: TranslationNamespace): boolean {
    const status = this.loadingState.loadingStates[namespace];
    return status?.status === 'loaded';
  }

  /**
   * Get cached translation if available
   */
  private getCachedTranslation(language: string, namespace: string): Record<string, any> | null {
    const languageCache = this.loadingState.cache[language];
    if (!languageCache) return null;

    const namespaceCache = languageCache[namespace];
    if (!namespaceCache) return null;

    // Check expiration
    if (Date.now() > namespaceCache.expires) {
      this.removeCachedTranslation(language, namespace);
      return null;
    }

    return namespaceCache.data;
  }

  /**
   * Cache translation data
   */
  private cacheTranslation(language: string, namespace: string, data: Record<string, any>): void {
    if (!this.loadingState.cache[language]) {
      this.loadingState.cache[language] = {};
    }

    const cacheEntry: TranslationCacheEntry = {
      data,
      expires: Date.now() + this.cacheSettings.translationTTL,
      version: this.generateCacheVersion(language, namespace)
    };

    this.loadingState.cache[language][namespace] = cacheEntry;
    this.saveCacheToStorage();
  }

  /**
   * Remove cached translation
   */
  private removeCachedTranslation(language: string, namespace: string): void {
    if (this.loadingState.cache[language]) {
      delete this.loadingState.cache[language][namespace];
    }
  }

  /**
   * Fetch translation from network
   */
  private async fetchTranslation(language: string, namespace: string): Promise<Record<string, any>> {
    const url = `/locales/${language}/${namespace}.json`;

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const translations = await response.json();

    if (!translations || typeof translations !== 'object') {
      throw new Error('Invalid translation file format');
    }

    return translations;
  }

  /**
   * Update loading status for namespace
   */
  private updateLoadingStatus(namespace: string, status: LoadingStatus['status']): void {
    if (!this.loadingState.loadingStates[namespace]) {
      this.loadingState.loadingStates[namespace] = {
        status: 'idle',
        retryCount: 0
      };
    }

    const currentStatus = this.loadingState.loadingStates[namespace];
    currentStatus.status = status;

    if (status === 'loaded') {
      currentStatus.lastLoaded = new Date().toISOString();
      currentStatus.retryCount = 0;
    } else if (status === 'error') {
      currentStatus.retryCount += 1;
    }
  }

  /**
   * Handle loading errors
   */
  private handleLoadingError(language: string, namespace: string, error: any): void {
    const translationError: TranslationError = {
      language,
      namespace,
      error: error.message || 'Unknown error',
      timestamp: new Date().toISOString(),
      retryable: this.isRetryableError(error)
    };

    this.loadingState.errors.push(translationError);

    // Keep only recent errors (max 10)
    if (this.loadingState.errors.length > 10) {
      this.loadingState.errors = this.loadingState.errors.slice(-10);
    }
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: any): boolean {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return true; // Network error
    }

    if (error.message?.includes('HTTP 5')) {
      return true; // Server error
    }

    if (error.message?.includes('timeout')) {
      return true; // Timeout error
    }

    return false;
  }

  /**
   * Generate cache version for invalidation
   */
  private generateCacheVersion(language: string, namespace: string): string {
    return `${language}-${namespace}-${Date.now()}`;
  }

  /**
   * Load cache from localStorage
   */
  private loadCacheFromStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const cached = localStorage.getItem('timetracker-translation-cache');
      if (cached) {
        const parsedCache = JSON.parse(cached);
        this.loadingState.cache = parsedCache;
      }
    } catch (error) {
      console.warn('Failed to load translation cache from storage:', error);
    }
  }

  /**
   * Save cache to localStorage
   */
  private saveCacheToStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(
        'timetracker-translation-cache',
        JSON.stringify(this.loadingState.cache)
      );
    } catch (error) {
      console.warn('Failed to save translation cache to storage:', error);
    }
  }

  /**
   * Clear all cached translations
   */
  clearCache(): void {
    this.loadingState.cache = {};
    if (typeof window !== 'undefined') {
      localStorage.removeItem('timetracker-translation-cache');
    }
  }

  /**
   * Retry failed namespace loading
   */
  async retryFailedNamespace(namespace: TranslationNamespace): Promise<void> {
    const status = this.loadingState.loadingStates[namespace];
    if (status?.status !== 'error') {
      return; // Nothing to retry
    }

    if (status.retryCount >= 3) {
      throw new Error(`Maximum retries exceeded for namespace ${namespace}`);
    }

    await this.loadNamespace(this.loadingState.currentLanguage, namespace);
  }
}

/** Default translation loader service instance */
export const translationLoaderService = new TranslationLoaderService();

/**
 * Load translation namespace (convenience function)
 */
export async function loadTranslationNamespace(
  language: string,
  namespace: TranslationNamespace
): Promise<Record<string, any>> {
  return translationLoaderService.loadNamespace(language, namespace);
}

/**
 * Switch application language
 */
export async function switchApplicationLanguage(language: string): Promise<void> {
  return translationLoaderService.switchLanguage(language);
}