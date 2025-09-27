/**
 * Language Configuration Types
 *
 * Defines types for language configuration, supported languages, and related settings
 * Used throughout the i18n system for consistent language handling
 */

export interface SupportedLanguage {
  /** ISO 639-1 language code (e.g., 'en', 'es', 'fr') */
  code: string;
  /** Native language name (e.g., 'English', 'Español') */
  name: string;
  /** English name for admin interfaces */
  englishName: string;
  /** Flag emoji or icon identifier */
  flag: string;
  /** Text direction for proper rendering */
  direction: 'ltr' | 'rtl';
  /** Default date format for this locale */
  dateFormat: string;
  /** Number formatting preferences */
  numberFormat: {
    /** Decimal separator (e.g., '.' or ',') */
    decimal: string;
    /** Thousands separator (e.g., ',' or '.') */
    thousands: string;
  };
}

export interface CacheSettings {
  /** Translation cache time-to-live in milliseconds (default: 24 hours) */
  translationTTL: number;
  /** User preference cache time-to-live in milliseconds (default: 30 days) */
  preferenceTTL: number;
  /** Languages to preload for faster switching */
  preloadLanguages: string[];
}

export interface LanguageConfiguration {
  /** List of all supported languages */
  supportedLanguages: SupportedLanguage[];
  /** Default language code when no preference is set */
  defaultLanguage: string;
  /** Fallback language when translation is missing */
  fallbackLanguage: string;
  /** Order of detection methods to try */
  detectionOrder: ('storage' | 'geolocation' | 'browser' | 'default')[];
  /** Caching configuration */
  cacheSettings: CacheSettings;
  /** Mapping of country codes to default languages */
  countryLanguageMap: Record<string, string>;
}

/** Default language configuration */
export const DEFAULT_LANGUAGE_CONFIG: LanguageConfiguration = {
  supportedLanguages: [
    {
      code: 'en',
      name: 'English',
      englishName: 'English',
      flag: '🇬🇧',
      direction: 'ltr',
      dateFormat: 'MM/dd/yyyy',
      numberFormat: { decimal: '.', thousands: ',' }
    },
    {
      code: 'es',
      name: 'Español',
      englishName: 'Spanish',
      flag: '🇪🇸',
      direction: 'ltr',
      dateFormat: 'dd/MM/yyyy',
      numberFormat: { decimal: ',', thousands: '.' }
    },
    {
      code: 'fr',
      name: 'Français',
      englishName: 'French',
      flag: '🇫🇷',
      direction: 'ltr',
      dateFormat: 'dd/MM/yyyy',
      numberFormat: { decimal: ',', thousands: ' ' }
    },
    {
      code: 'de',
      name: 'Deutsch',
      englishName: 'German',
      flag: '🇩🇪',
      direction: 'ltr',
      dateFormat: 'dd.MM.yyyy',
      numberFormat: { decimal: ',', thousands: '.' }
    },
    {
      code: 'it',
      name: 'Italiano',
      englishName: 'Italian',
      flag: '🇮🇹',
      direction: 'ltr',
      dateFormat: 'dd/MM/yyyy',
      numberFormat: { decimal: ',', thousands: '.' }
    }
  ],
  defaultLanguage: 'en',
  fallbackLanguage: 'en',
  detectionOrder: ['storage', 'geolocation', 'browser', 'default'],
  cacheSettings: {
    translationTTL: 24 * 60 * 60 * 1000, // 24 hours
    preferenceTTL: 30 * 24 * 60 * 60 * 1000, // 30 days
    preloadLanguages: ['en', 'es'] // Most common alternatives
  },
  countryLanguageMap: {
    // English-speaking countries
    'US': 'en',
    'GB': 'en',
    'CA': 'en',
    'AU': 'en',
    'NZ': 'en',
    'IE': 'en',
    // Spanish-speaking countries
    'ES': 'es',
    'MX': 'es',
    'AR': 'es',
    'CO': 'es',
    'CL': 'es',
    'PE': 'es',
    'VE': 'es',
    'EC': 'es',
    'GT': 'es',
    'UY': 'es',
    'BO': 'es',
    'HN': 'es',
    'PY': 'es',
    'SV': 'es',
    'NI': 'es',
    'CR': 'es',
    'PA': 'es',
    'DO': 'es',
    // French-speaking countries
    'FR': 'fr',
    'BE': 'fr',
    'CH': 'fr',
    'LU': 'fr',
    'MC': 'fr',
    // German-speaking countries
    'DE': 'de',
    'AT': 'de',
    'LI': 'de',
    // Italian-speaking countries
    'IT': 'it',
    'SM': 'it',
    'VA': 'it'
  }
};

/** Helper function to get supported language by code */
export function getSupportedLanguage(code: string): SupportedLanguage | undefined {
  return DEFAULT_LANGUAGE_CONFIG.supportedLanguages.find(lang => lang.code === code);
}

/** Helper function to check if language is supported */
export function isLanguageSupported(code: string): boolean {
  return DEFAULT_LANGUAGE_CONFIG.supportedLanguages.some(lang => lang.code === code);
}

/** Helper function to get country's default language */
export function getCountryDefaultLanguage(countryCode: string): string {
  return DEFAULT_LANGUAGE_CONFIG.countryLanguageMap[countryCode] || DEFAULT_LANGUAGE_CONFIG.defaultLanguage;
}