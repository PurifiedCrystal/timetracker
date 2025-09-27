/**
 * Language Detection Service
 *
 * Orchestrates language detection using multiple methods:
 * 1. Stored user preference (highest priority)
 * 2. IP geolocation
 * 3. Browser language settings
 * 4. Default fallback
 */

import {
  LanguageDetectionResult,
  DetectionMethod,
  BrowserLanguageData,
  calculateDetectionConfidence,
  extractBrowserLanguageData,
  DEFAULT_DETECTION_CONFIG
} from '../types/detection';
import {
  DEFAULT_LANGUAGE_CONFIG,
  getCountryDefaultLanguage,
  isLanguageSupported
} from '../types/language-config';
import {
  loadUserPreferenceFromStorage,
  createDetectionHistoryItem,
  updateDetectionHistory
} from '../types/preference';
import { getUserLocationWithFallback } from './geolocation';

/** Language detection service class */
export class LanguageDetectionService {
  private readonly config = DEFAULT_LANGUAGE_CONFIG;
  private readonly detectionConfig = DEFAULT_DETECTION_CONFIG;

  /**
   * Detect user's preferred language using configured detection order
   */
  async detectLanguage(): Promise<LanguageDetectionResult> {
    const browserData = extractBrowserLanguageData();

    for (const method of this.config.detectionOrder) {
      try {
        const result = await this.detectByMethod(method, browserData);
        if (result) {
          await this.saveDetectionHistory(result);
          return result;
        }
      } catch (error) {
        console.warn(`Language detection method '${method}' failed:`, error);
        continue;
      }
    }

    // Fallback to default if all methods fail
    return this.createDefaultResult(browserData);
  }

  /**
   * Detect language using a specific method
   */
  private async detectByMethod(
    method: DetectionMethod,
    browserData: BrowserLanguageData
  ): Promise<LanguageDetectionResult | null> {
    switch (method) {
      case 'storage':
        return this.detectFromStorage(browserData);

      case 'geolocation':
        return await this.detectFromGeolocation(browserData);

      case 'browser':
        return this.detectFromBrowser(browserData);

      case 'default':
        return this.createDefaultResult(browserData);

      default:
        return null;
    }
  }

  /**
   * Detect language from stored user preference
   */
  private detectFromStorage(browserData: BrowserLanguageData): LanguageDetectionResult | null {
    const preference = loadUserPreferenceFromStorage();

    if (!preference || !preference.autoDetection) {
      return null;
    }

    if (!isLanguageSupported(preference.selectedLanguage)) {
      console.warn('Stored language preference is no longer supported:', preference.selectedLanguage);
      return null;
    }

    return {
      detectedLanguage: preference.selectedLanguage,
      detectionMethod: 'storage',
      confidence: calculateDetectionConfidence('storage'),
      browserLanguages: browserData.all,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Detect language from IP geolocation
   */
  private async detectFromGeolocation(browserData: BrowserLanguageData): Promise<LanguageDetectionResult | null> {
    if (!this.detectionConfig.enableGeolocation) {
      return null;
    }

    const locationResult = await getUserLocationWithFallback();

    if ('error' in locationResult) {
      return null; // Geolocation failed
    }

    const detectedLanguage = getCountryDefaultLanguage(locationResult.country);

    if (!isLanguageSupported(detectedLanguage)) {
      return null;
    }

    const confidence = calculateDetectionConfidence('geolocation', true);

    return {
      detectedLanguage,
      detectionMethod: 'geolocation',
      confidence,
      geolocationData: locationResult,
      browserLanguages: browserData.all,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Detect language from browser settings
   */
  private detectFromBrowser(browserData: BrowserLanguageData): LanguageDetectionResult | null {
    // Try primary browser language first
    if (isLanguageSupported(browserData.primary)) {
      const confidence = calculateDetectionConfidence('browser', false, browserData.all.length);

      return {
        detectedLanguage: browserData.primary,
        detectionMethod: 'browser',
        confidence,
        browserLanguages: browserData.all,
        timestamp: new Date().toISOString()
      };
    }

    // Try other browser languages
    for (const language of browserData.all) {
      if (isLanguageSupported(language)) {
        const confidence = calculateDetectionConfidence('browser', false, browserData.all.length);

        return {
          detectedLanguage: language,
          detectionMethod: 'browser',
          confidence,
          browserLanguages: browserData.all,
          fallbackReason: `Primary language '${browserData.primary}' not supported`,
          timestamp: new Date().toISOString()
        };
      }
    }

    return null; // No supported browser languages found
  }

  /**
   * Create default detection result
   */
  private createDefaultResult(browserData: BrowserLanguageData): LanguageDetectionResult {
    return {
      detectedLanguage: this.config.defaultLanguage,
      detectionMethod: 'default',
      confidence: calculateDetectionConfidence('default'),
      browserLanguages: browserData.all,
      fallbackReason: 'No other detection methods succeeded',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Save detection result to history
   */
  private async saveDetectionHistory(result: LanguageDetectionResult): Promise<void> {
    try {
      const preference = loadUserPreferenceFromStorage();

      if (!preference) {
        return; // No existing preference to update
      }

      const historyItem = createDetectionHistoryItem(result);
      const updatedHistory = updateDetectionHistory(preference.detectionHistory, historyItem);

      const updatedPreference = {
        ...preference,
        detectionHistory: updatedHistory
      };

      // Save updated preference with new history
      if (typeof window !== 'undefined') {
        localStorage.setItem(
          'timetracker-language-preference',
          JSON.stringify(updatedPreference)
        );
      }
    } catch (error) {
      console.warn('Failed to save detection history:', error);
    }
  }

  /**
   * Force re-detection ignoring storage
   */
  async forceRedetection(): Promise<LanguageDetectionResult> {
    const browserData = extractBrowserLanguageData();

    // Skip storage detection for forced re-detection
    const methodsToTry = this.config.detectionOrder.filter(method => method !== 'storage');

    for (const method of methodsToTry) {
      try {
        const result = await this.detectByMethod(method, browserData);
        if (result) {
          await this.saveDetectionHistory(result);
          return result;
        }
      } catch (error) {
        console.warn(`Language detection method '${method}' failed:`, error);
        continue;
      }
    }

    return this.createDefaultResult(browserData);
  }

  /**
   * Get detection confidence for a specific language
   */
  async getLanguageConfidence(languageCode: string): Promise<number> {
    if (!isLanguageSupported(languageCode)) {
      return 0;
    }

    const browserData = extractBrowserLanguageData();

    // Check if it's the stored preference
    const preference = loadUserPreferenceFromStorage();
    if (preference?.selectedLanguage === languageCode) {
      return calculateDetectionConfidence('storage');
    }

    // Check geolocation confidence
    try {
      const locationResult = await getUserLocationWithFallback();
      if ('country' in locationResult) {
        const geoLanguage = getCountryDefaultLanguage(locationResult.country);
        if (geoLanguage === languageCode) {
          return calculateDetectionConfidence('geolocation', true);
        }
      }
    } catch (error) {
      // Ignore geolocation errors for confidence calculation
    }

    // Check browser language confidence
    if (browserData.all.includes(languageCode)) {
      return calculateDetectionConfidence('browser', false, browserData.all.length);
    }

    // Default confidence if it's the default language
    if (languageCode === this.config.defaultLanguage) {
      return calculateDetectionConfidence('default');
    }

    return 0;
  }
}

/** Default language detection service instance */
export const languageDetectionService = new LanguageDetectionService();

/**
 * Quick detection function for immediate use
 */
export async function detectUserLanguage(): Promise<LanguageDetectionResult> {
  return languageDetectionService.detectLanguage();
}

/**
 * Force language re-detection (ignoring stored preferences)
 */
export async function forceLanguageRedetection(): Promise<LanguageDetectionResult> {
  return languageDetectionService.forceRedetection();
}