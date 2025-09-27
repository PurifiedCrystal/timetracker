/**
 * Language Detection Types
 *
 * Types for language detection, geolocation data, and detection results
 */

/** Geolocation data from IP or browser */
export interface GeolocationData {
  /** ISO country code (e.g., 'US', 'ES') */
  country: string;
  /** State or region if available */
  region?: string;
  /** City name if available */
  city?: string;
  /** Accuracy level of geolocation */
  accuracy: 'country' | 'region' | 'city';
  /** Anonymized IP address for logging */
  ipAddress?: string;
}

/** Detection method used */
export type DetectionMethod = 'storage' | 'geolocation' | 'browser' | 'default';

/** Language detection result */
export interface LanguageDetectionResult {
  /** Detected/recommended language code */
  detectedLanguage: string;
  /** Method used for detection */
  detectionMethod: DetectionMethod;
  /** Confidence score (0-1) */
  confidence: number;
  /** Geolocation data if available */
  geolocationData?: GeolocationData;
  /** Browser language preferences */
  browserLanguages: string[];
  /** Reason for fallback if applicable */
  fallbackReason?: string;
  /** When detection occurred */
  timestamp: string;
}

/** Request parameters for language detection API */
export interface LanguageDetectionRequest {
  /** Browser language preferences array */
  browserLanguages?: string[];
  /** Browser user agent string */
  userAgent?: string;
  /** User's timezone */
  timezone?: string;
  /** Previously selected language */
  previousLanguage?: string;
}

/** IP geolocation service response */
export interface IPGeolocationResponse {
  /** Country code */
  country_code: string;
  /** Country name */
  country_name: string;
  /** Region/state */
  region?: string;
  /** City */
  city?: string;
  /** Latitude */
  latitude?: number;
  /** Longitude */
  longitude?: number;
  /** Timezone */
  timezone?: string;
  /** ISP information */
  isp?: string;
}

/** Browser language detection data */
export interface BrowserLanguageData {
  /** Primary language from navigator.language */
  primary: string;
  /** All languages from navigator.languages */
  all: string[];
  /** Timezone from Intl.DateTimeFormat */
  timezone: string;
  /** Locale from various browser APIs */
  locale?: string;
}

/** Storage-based language preference */
export interface StoredLanguagePreference {
  /** Selected language code */
  language: string;
  /** When preference was set */
  timestamp: string;
  /** Whether auto-detection is enabled */
  autoDetection: boolean;
  /** Detection method used when preference was set */
  originalDetectionMethod: DetectionMethod;
}

/** Language detection configuration */
export interface DetectionConfig {
  /** Maximum confidence for geolocation detection */
  maxGeolocationConfidence: number;
  /** Maximum confidence for browser detection */
  maxBrowserConfidence: number;
  /** Minimum confidence for default fallback */
  minDefaultConfidence: number;
  /** Timeout for geolocation requests (ms) */
  geolocationTimeout: number;
  /** Whether to enable IP geolocation */
  enableGeolocation: boolean;
  /** Geolocation service URL */
  geolocationServiceUrl?: string;
}

/** Default detection configuration */
export const DEFAULT_DETECTION_CONFIG: DetectionConfig = {
  maxGeolocationConfidence: 0.9,
  maxBrowserConfidence: 0.7,
  minDefaultConfidence: 0.5,
  geolocationTimeout: 3000, // 3 seconds
  enableGeolocation: true,
  geolocationServiceUrl: 'https://ipapi.co/json/'
};

/** Detection error types */
export type DetectionError =
  | 'geolocation_failed'
  | 'geolocation_timeout'
  | 'browser_detection_failed'
  | 'storage_error'
  | 'network_error'
  | 'invalid_response';

/** Detection error information */
export interface DetectionErrorInfo {
  error: DetectionError;
  message: string;
  method: DetectionMethod;
  timestamp: string;
  retryable: boolean;
}

/** Helper function to calculate confidence based on detection method */
export function calculateDetectionConfidence(
  method: DetectionMethod,
  hasGeolocation: boolean = false,
  browserLanguagesCount: number = 0
): number {
  switch (method) {
    case 'storage':
      return 1.0; // Highest confidence - user explicitly chose
    case 'geolocation':
      return hasGeolocation ? DEFAULT_DETECTION_CONFIG.maxGeolocationConfidence : 0.0;
    case 'browser':
      return Math.min(
        DEFAULT_DETECTION_CONFIG.maxBrowserConfidence,
        0.3 + (browserLanguagesCount * 0.1) // More languages = higher confidence
      );
    case 'default':
      return DEFAULT_DETECTION_CONFIG.minDefaultConfidence;
    default:
      return 0.0;
  }
}

/** Helper function to normalize browser language code */
export function normalizeBrowserLanguage(language: string): string {
  // Convert 'en-US' to 'en', 'es-ES' to 'es', etc.
  return language.split('-')[0].toLowerCase();
}

/** Helper function to extract primary browser language */
export function extractBrowserLanguageData(): BrowserLanguageData {
  const navigator = typeof window !== 'undefined' ? window.navigator : null;

  if (!navigator) {
    return {
      primary: 'en',
      all: ['en'],
      timezone: 'UTC'
    };
  }

  const primary = navigator.language || 'en';
  const all = navigator.languages ? Array.from(navigator.languages) : [primary];
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

  return {
    primary: normalizeBrowserLanguage(primary),
    all: all.map(normalizeBrowserLanguage),
    timezone
  };
}