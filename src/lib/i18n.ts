/**
 * i18n Configuration
 *
 * Initializes react-i18next with translation loading and language detection
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-http-backend';
import { DEFAULT_LANGUAGE_CONFIG } from './types/language-config';
import { TRANSLATION_NAMESPACES } from './types/translation';

// Initialize i18next
i18n
  .use(Backend) // Load translations via HTTP
  .use(initReactI18next) // Initialize react-i18next
  .init({
    // Language settings
    lng: DEFAULT_LANGUAGE_CONFIG.defaultLanguage,
    fallbackLng: DEFAULT_LANGUAGE_CONFIG.fallbackLanguage,
    supportedLngs: DEFAULT_LANGUAGE_CONFIG.supportedLanguages.map(lang => lang.code),

    // Namespace settings
    ns: TRANSLATION_NAMESPACES,
    defaultNS: 'common',

    // Backend configuration
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',

      // Request options
      requestOptions: {
        mode: 'cors',
        credentials: 'same-origin',
        cache: 'default'
      },

      // Custom headers
      customHeaders: {
        'Accept': 'application/json'
      },

      // Parse function to handle loading errors gracefully
      parse: function(data: string, url: string) {
        try {
          return JSON.parse(data);
        } catch (error) {
          console.warn(`Failed to parse translation file: ${url}`, error);
          return {}; // Return empty object on parse error
        }
      },

      // Handle loading errors
      loadError: function(lng: string, ns: string, msg: string) {
        console.warn(`Failed to load translation: ${lng}/${ns}`, msg);
      }
    },

    // Interpolation settings
    interpolation: {
      escapeValue: false, // React already escapes values
      formatSeparator: ',',
      format: function(value: any, format?: string, lng?: string) {
        if (format === 'uppercase') return value.toUpperCase();
        if (format === 'lowercase') return value.toLowerCase();
        if (format === 'capitalize') return value.charAt(0).toUpperCase() + value.slice(1);
        return value;
      }
    },

    // React specific options
    react: {
      useSuspense: false, // We'll handle loading states manually
      bindI18n: 'languageChanged loaded',
      bindI18nStore: 'added removed',
      transEmptyNodeValue: '', // Return empty string for missing translations
      transSupportBasicHtmlNodes: true,
      transKeepBasicHtmlNodesFor: ['br', 'strong', 'i', 'em']
    },

    // Debug in development
    debug: process.env.NODE_ENV === 'development',

    // Key separator and nesting
    keySeparator: '.',
    nsSeparator: ':',

    // Pluralization
    pluralSeparator: '_',
    contextSeparator: '_',

    // Detection options (we handle this manually)
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'timetracker-language',
      checkWhitelist: true
    },

    // Return null for missing keys in development
    returnNull: process.env.NODE_ENV === 'development',
    returnEmptyString: process.env.NODE_ENV !== 'development'
  });

// Language change handler
i18n.on('languageChanged', (lng: string) => {
  console.log(`Language changed to: ${lng}`);

  // Update document language attribute
  if (typeof document !== 'undefined') {
    document.documentElement.lang = lng;
  }

  // Save to localStorage
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('timetracker-language', lng);
    } catch (error) {
      console.warn('Failed to save language to localStorage:', error);
    }
  }
});

// Loading state handlers
i18n.on('loaded', (loaded: any) => {
  console.log('Translations loaded:', Object.keys(loaded));
});

i18n.on('failedLoading', (lng: string, ns: string, msg: string) => {
  console.warn(`Failed loading translation: ${lng}/${ns}`, msg);
});

// Error handlers
i18n.on('missingKey', (lng: string, namespace: string, key: string, fallbackValue: string) => {
  if (process.env.NODE_ENV === 'development') {
    console.warn(`Missing translation key: ${lng}:${namespace}.${key}`, {
      fallbackValue
    });
  }
});

/**
 * Change language dynamically
 */
export async function changeLanguage(language: string): Promise<void> {
  try {
    await i18n.changeLanguage(language);
    console.log(`Successfully changed language to: ${language}`);
  } catch (error) {
    console.error('Failed to change language:', error);
    throw error;
  }
}

/**
 * Load additional namespace
 */
export async function loadNamespace(namespace: string, language?: string): Promise<void> {
  try {
    await i18n.loadNamespaces(namespace);
    console.log(`Successfully loaded namespace: ${namespace}`);
  } catch (error) {
    console.error('Failed to load namespace:', error);
    throw error;
  }
}

/**
 * Check if translation exists
 */
export function hasTranslation(key: string, namespace?: string): boolean {
  return i18n.exists(key, { ns: namespace });
}

/**
 * Get current language
 */
export function getCurrentLanguage(): string {
  return i18n.language || DEFAULT_LANGUAGE_CONFIG.defaultLanguage;
}

/**
 * Get loaded languages
 */
export function getLoadedLanguages(): string[] {
  return i18n.languages || [DEFAULT_LANGUAGE_CONFIG.defaultLanguage];
}

/**
 * Preload languages for faster switching
 */
export async function preloadLanguages(languages: string[]): Promise<void> {
  try {
    await Promise.all(
      languages.map(async (lang) => {
        if (!i18n.hasResourceBundle(lang, 'common')) {
          await i18n.loadLanguages(lang);
        }
      })
    );
    console.log('Successfully preloaded languages:', languages);
  } catch (error) {
    console.warn('Failed to preload some languages:', error);
  }
}

export default i18n;