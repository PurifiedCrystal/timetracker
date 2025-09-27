/**
 * LibreTranslate Integration Service
 *
 * Handles automated translation generation using LibreTranslate API
 * Supports batch translation and quality management
 */

import { TranslationJobStatus, TranslationJobProgress } from '../types/translation';
import { DEFAULT_LANGUAGE_CONFIG } from '../types/language-config';

/** LibreTranslate API response */
interface LibreTranslateResponse {
  translatedText: string;
  detectedLanguage?: string;
}

/** Batch translation request */
interface BatchTranslationRequest {
  texts: string[];
  targetLanguage: string;
  sourceLanguage?: string;
  quality?: 'fast' | 'balanced' | 'high';
}

/** Translation generation options */
interface TranslationGenerationOptions {
  overwrite?: boolean;
  quality?: 'fast' | 'balanced' | 'high';
  batchSize?: number;
}

/** LibreTranslate service class */
export class LibreTranslateService {
  private readonly baseUrl: string;
  private readonly apiKey?: string;
  private readonly timeout: number;

  constructor(
    baseUrl: string = 'https://libretranslate.com',
    apiKey?: string,
    timeout: number = 30000
  ) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.apiKey = apiKey;
    this.timeout = timeout;
  }

  /**
   * Check if LibreTranslate service is available
   */
  async isServiceAvailable(): Promise<boolean> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/languages`, {
        method: 'GET'
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Get supported languages from LibreTranslate
   */
  async getSupportedLanguages(): Promise<Array<{ code: string; name: string }>> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/languages`, {
        method: 'GET'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.warn('Failed to get supported languages from LibreTranslate:', error);
      // Return our supported languages as fallback
      return DEFAULT_LANGUAGE_CONFIG.supportedLanguages.map(lang => ({
        code: lang.code,
        name: lang.englishName
      }));
    }
  }

  /**
   * Translate a single text string
   */
  async translateText(
    text: string,
    targetLanguage: string,
    sourceLanguage: string = 'en'
  ): Promise<string> {
    const requestBody = {
      q: text,
      source: sourceLanguage,
      target: targetLanguage,
      format: 'text',
      ...(this.apiKey && { api_key: this.apiKey })
    };

    const response = await this.fetchWithTimeout(`${this.baseUrl}/translate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`Translation failed: HTTP ${response.status}`);
    }

    const result: LibreTranslateResponse = await response.json();
    return result.translatedText;
  }

  /**
   * Translate multiple texts in batch
   */
  async translateBatch(request: BatchTranslationRequest): Promise<string[]> {
    const { texts, targetLanguage, sourceLanguage = 'en' } = request;
    const batchSize = 10; // LibreTranslate recommended batch size

    const results: string[] = [];

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);

      try {
        const batchResults = await Promise.all(
          batch.map(text => this.translateText(text, targetLanguage, sourceLanguage))
        );
        results.push(...batchResults);
      } catch (error) {
        console.warn(`Batch translation failed for batch starting at index ${i}:`, error);
        // Add empty strings for failed translations
        results.push(...batch.map(() => ''));
      }
    }

    return results;
  }

  /**
   * Generate translations for namespace
   */
  async generateNamespaceTranslations(
    sourceData: Record<string, any>,
    targetLanguage: string,
    sourceLanguage: string = 'en',
    options: TranslationGenerationOptions = {}
  ): Promise<{ translations: Record<string, any>; statistics: TranslationJobProgress }> {
    const { quality = 'balanced', batchSize = 50 } = options;

    // Extract all text strings from nested object
    const extractedTexts = this.extractTextStrings(sourceData);
    const totalTexts = extractedTexts.length;

    if (totalTexts === 0) {
      return {
        translations: sourceData,
        statistics: {
          total: 0,
          completed: 0,
          failed: 0,
          percentage: 1.0
        }
      };
    }

    // Translate in batches
    const translatedTexts: string[] = [];
    let completedCount = 0;
    let failedCount = 0;

    for (let i = 0; i < extractedTexts.length; i += batchSize) {
      const batch = extractedTexts.slice(i, i + batchSize);

      try {
        const batchTranslations = await this.translateBatch({
          texts: batch,
          targetLanguage,
          sourceLanguage,
          quality
        });

        translatedTexts.push(...batchTranslations);
        completedCount += batchTranslations.filter(t => t.length > 0).length;
        failedCount += batchTranslations.filter(t => t.length === 0).length;

      } catch (error) {
        console.warn(`Failed to translate batch ${i}-${i + batch.length}:`, error);
        translatedTexts.push(...batch.map(() => '')); // Add empty strings for failed batch
        failedCount += batch.length;
      }
    }

    // Reconstruct translated object
    const translations = this.reconstructTranslatedObject(sourceData, translatedTexts);

    return {
      translations,
      statistics: {
        total: totalTexts,
        completed: completedCount,
        failed: failedCount,
        percentage: totalTexts > 0 ? completedCount / totalTexts : 1.0
      }
    };
  }

  /**
   * Extract all text strings from nested object
   */
  private extractTextStrings(obj: any, path: string = ''): string[] {
    const texts: string[] = [];

    if (typeof obj === 'string') {
      texts.push(obj);
    } else if (typeof obj === 'object' && obj !== null) {
      Object.keys(obj).forEach(key => {
        const currentPath = path ? `${path}.${key}` : key;
        texts.push(...this.extractTextStrings(obj[key], currentPath));
      });
    }

    return texts;
  }

  /**
   * Reconstruct object with translated strings
   */
  private reconstructTranslatedObject(sourceObj: any, translations: string[]): any {
    let translationIndex = 0;

    const reconstruct = (obj: any): any => {
      if (typeof obj === 'string') {
        const translation = translations[translationIndex++];
        return translation || obj; // Fallback to original if translation failed
      } else if (typeof obj === 'object' && obj !== null) {
        const result: any = {};
        Object.keys(obj).forEach(key => {
          result[key] = reconstruct(obj[key]);
        });
        return result;
      }
      return obj;
    };

    return reconstruct(sourceObj);
  }

  /**
   * Validate translation quality
   */
  validateTranslationQuality(
    original: string,
    translated: string,
    targetLanguage: string
  ): { score: number; issues: string[] } {
    const issues: string[] = [];
    let score = 1.0;

    // Basic validation checks
    if (!translated || translated.trim().length === 0) {
      issues.push('Empty translation');
      return { score: 0, issues };
    }

    if (translated === original) {
      issues.push('Translation identical to original');
      score -= 0.3;
    }

    // Check for common translation issues
    const originalPlaceholders = (original.match(/\{\{[^}]+\}\}/g) || []).length;
    const translatedPlaceholders = (translated.match(/\{\{[^}]+\}\}/g) || []).length;

    if (originalPlaceholders !== translatedPlaceholders) {
      issues.push('Placeholder count mismatch');
      score -= 0.4;
    }

    // Check length ratio (very short or very long translations might be suspicious)
    const lengthRatio = translated.length / original.length;
    if (lengthRatio < 0.3 || lengthRatio > 3.0) {
      issues.push('Unusual length ratio');
      score -= 0.2;
    }

    // Check for HTML content (shouldn't be in UI strings)
    if (translated.includes('<') && translated.includes('>')) {
      issues.push('Contains HTML tags');
      score -= 0.3;
    }

    return { score: Math.max(0, score), issues };
  }

  /**
   * Fetch with timeout support
   */
  private async fetchWithTimeout(url: string, options: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }
}

/** Default LibreTranslate service instance */
export const libreTranslateService = new LibreTranslateService();

/**
 * Generate translations for all supported languages
 */
export async function generateAllLanguageTranslations(
  sourceNamespace: Record<string, any>,
  sourceLanguage: string = 'en'
): Promise<Record<string, Record<string, any>>> {
  const results: Record<string, Record<string, any>> = {};
  const targetLanguages = DEFAULT_LANGUAGE_CONFIG.supportedLanguages
    .filter(lang => lang.code !== sourceLanguage)
    .map(lang => lang.code);

  for (const targetLang of targetLanguages) {
    try {
      console.log(`Generating translations for ${targetLang}...`);
      const result = await libreTranslateService.generateNamespaceTranslations(
        sourceNamespace,
        targetLang,
        sourceLanguage
      );
      results[targetLang] = result.translations;
      console.log(`✓ ${targetLang}: ${result.statistics.completed}/${result.statistics.total} strings translated`);
    } catch (error) {
      console.error(`Failed to generate translations for ${targetLang}:`, error);
      results[targetLang] = sourceNamespace; // Fallback to original
    }
  }

  return results;
}