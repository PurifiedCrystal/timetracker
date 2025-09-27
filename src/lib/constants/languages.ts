/**
 * Language Constants
 *
 * Supported languages and country mapping configuration
 */

import { SupportedLanguage } from '../types/language-config';

/** Supported languages with full configuration */
export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  {
    code: 'en',
    name: 'English',
    englishName: 'English',
    flag: '🇺🇸',
    direction: 'ltr',
    dateFormat: 'MM/dd/yyyy',
    numberFormat: {
      decimal: '.',
      thousands: ','
    }
  },
  {
    code: 'es',
    name: 'Español',
    englishName: 'Spanish',
    flag: '🇪🇸',
    direction: 'ltr',
    dateFormat: 'dd/MM/yyyy',
    numberFormat: {
      decimal: ',',
      thousands: '.'
    }
  },
  {
    code: 'fr',
    name: 'Français',
    englishName: 'French',
    flag: '🇫🇷',
    direction: 'ltr',
    dateFormat: 'dd/MM/yyyy',
    numberFormat: {
      decimal: ',',
      thousands: ' '
    }
  },
  {
    code: 'de',
    name: 'Deutsch',
    englishName: 'German',
    flag: '🇩🇪',
    direction: 'ltr',
    dateFormat: 'dd.MM.yyyy',
    numberFormat: {
      decimal: ',',
      thousands: '.'
    }
  },
  {
    code: 'it',
    name: 'Italiano',
    englishName: 'Italian',
    flag: '🇮🇹',
    direction: 'ltr',
    dateFormat: 'dd/MM/yyyy',
    numberFormat: {
      decimal: ',',
      thousands: '.'
    }
  }
];

/** Country to language mapping */
export const COUNTRY_LANGUAGE_MAP: Record<string, string> = {
  // English-speaking countries
  'US': 'en',
  'GB': 'en',
  'CA': 'en',
  'AU': 'en',
  'NZ': 'en',
  'IE': 'en',
  'ZA': 'en',
  'IN': 'en',
  'SG': 'en',
  'PH': 'en',
  'MY': 'en',
  'HK': 'en',

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
  'CU': 'es',
  'BO': 'es',
  'DO': 'es',
  'HN': 'es',
  'PY': 'es',
  'SV': 'es',
  'NI': 'es',
  'CR': 'es',
  'PA': 'es',
  'UY': 'es',
  'PR': 'es',

  // French-speaking countries
  'FR': 'fr',
  'BE': 'fr', // Belgium (partially)
  'CH': 'fr', // Switzerland (partially)
  'LU': 'fr',
  'MC': 'fr',
  'SN': 'fr',
  'ML': 'fr',
  'BF': 'fr',
  'NE': 'fr',
  'CI': 'fr',
  'MG': 'fr',
  'CM': 'fr',
  'TG': 'fr',
  'BJ': 'fr',

  // German-speaking countries
  'DE': 'de',
  'AT': 'de',
  'CH': 'de', // Switzerland (partially)
  'LI': 'de',

  // Italian-speaking countries
  'IT': 'it',
  'SM': 'it',
  'VA': 'it',
  'CH': 'it' // Switzerland (partially)
};

/** Default application language */
export const DEFAULT_LANGUAGE = 'en';

/** Fallback language for missing translations */
export const FALLBACK_LANGUAGE = 'en';

/** Languages to preload for faster switching */
export const PRELOAD_LANGUAGES = ['en', 'es'];

/** Language detection order priority */
export const DETECTION_ORDER: Array<'storage' | 'geolocation' | 'browser' | 'default'> = [
  'storage',      // User's explicit choice (highest priority)
  'geolocation',  // IP-based location
  'browser',      // Browser language settings
  'default'       // Fallback to default
];

/** Translation namespaces */
export const NAMESPACES = [
  'common',
  'dashboard',
  'auth',
  'settings',
  'time',
  'export'
] as const;

/** Default namespace for translations */
export const DEFAULT_NAMESPACE = 'common';

/** Cache settings */
export const CACHE_SETTINGS = {
  /** Translation cache TTL (24 hours) */
  TRANSLATION_TTL: 24 * 60 * 60 * 1000,
  /** User preference cache TTL (30 days) */
  PREFERENCE_TTL: 30 * 24 * 60 * 60 * 1000,
  /** Detection history cache TTL (7 days) */
  DETECTION_HISTORY_TTL: 7 * 24 * 60 * 60 * 1000
};

/** Language detection confidence thresholds */
export const CONFIDENCE_THRESHOLDS = {
  /** Storage-based detection (user choice) */
  STORAGE: 1.0,
  /** Geolocation-based detection */
  GEOLOCATION: 0.9,
  /** Browser language detection */
  BROWSER: 0.7,
  /** Default fallback */
  DEFAULT: 0.5
};

/** Performance targets */
export const PERFORMANCE_TARGETS = {
  /** Maximum time for language detection (ms) */
  DETECTION_TIMEOUT: 200,
  /** Maximum time for translation loading (ms) */
  TRANSLATION_TIMEOUT: 1000,
  /** Maximum time for language switching (ms) */
  SWITCH_TIMEOUT: 100
};

/** Storage keys for localStorage */
export const STORAGE_KEYS = {
  LANGUAGE_PREFERENCE: 'timetracker-language-preference',
  TRANSLATION_CACHE: 'timetracker-translation-cache',
  DETECTION_HISTORY: 'timetracker-detection-history',
  LAST_DETECTION: 'timetracker-last-detection',
  GEOLOCATION_CACHE: 'timetracker-geolocation-cache'
} as const;

/** Helper functions */

/**
 * Get language by code
 */
export function getLanguageByCode(code: string): SupportedLanguage | undefined {
  return SUPPORTED_LANGUAGES.find(lang => lang.code === code);
}

/**
 * Check if language is supported
 */
export function isLanguageSupported(code: string): boolean {
  return SUPPORTED_LANGUAGES.some(lang => lang.code === code);
}

/**
 * Get country's default language
 */
export function getCountryLanguage(countryCode: string): string {
  return COUNTRY_LANGUAGE_MAP[countryCode.toUpperCase()] || DEFAULT_LANGUAGE;
}

/**
 * Get all supported language codes
 */
export function getSupportedLanguageCodes(): string[] {
  return SUPPORTED_LANGUAGES.map(lang => lang.code);
}

/**
 * Get language display name
 */
export function getLanguageDisplayName(code: string, useNativeName: boolean = true): string {
  const language = getLanguageByCode(code);
  if (!language) return code;
  return useNativeName ? language.name : language.englishName;
}