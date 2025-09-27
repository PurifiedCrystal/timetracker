/**
 * User Language Preference Types
 *
 * Types for managing user language preferences and settings
 */

import { LanguageDetectionResult, DetectionMethod } from './detection';

/** User's custom formatting preferences */
export interface CustomFormatSettings {
  /** Custom date format override */
  dateFormat?: string;
  /** Time display preference */
  timeFormat?: '12h' | '24h';
  /** Number format preference */
  numberFormat?: 'auto' | 'us' | 'eu';
}

/** Historical detection record */
export interface DetectionHistoryItem {
  /** Detected language */
  detectedLanguage: string;
  /** Detection method used */
  detectionMethod: DetectionMethod;
  /** Confidence score */
  confidence: number;
  /** When detection occurred */
  timestamp: string;
}

/** Complete user language preference */
export interface UserLanguagePreference {
  /** User's selected language */
  selectedLanguage: string;
  /** Whether to use automatic detection */
  autoDetection: boolean;
  /** When preference was last updated */
  lastUpdated: string;
  /** Recent detection history (max 5 items) */
  detectionHistory: DetectionHistoryItem[];
  /** Custom formatting overrides */
  customOverrides?: CustomFormatSettings;
}

/** Request to save language preference */
export interface LanguagePreferenceRequest {
  /** Language to save */
  language: string;
  /** Auto-detection setting */
  autoDetection?: boolean;
  /** Custom settings */
  customSettings?: CustomFormatSettings;
}

/** Response from language preference API */
export interface LanguagePreferenceResponse {
  /** Current language preference */
  language: string;
  /** Auto-detection setting */
  autoDetection: boolean;
  /** Custom formatting settings */
  customSettings?: CustomFormatSettings;
  /** When preference was last updated */
  lastUpdated: string;
  /** Recent detection history */
  detectionHistory?: DetectionHistoryItem[];
}

/** Storage keys for localStorage */
export const STORAGE_KEYS = {
  /** User's language preference */
  LANGUAGE_PREFERENCE: 'timetracker-language-preference',
  /** Detection history */
  DETECTION_HISTORY: 'timetracker-detection-history',
  /** Custom format settings */
  CUSTOM_SETTINGS: 'timetracker-custom-format-settings',
  /** Last detection result */
  LAST_DETECTION: 'timetracker-last-detection'
} as const;

/** Default custom format settings */
export const DEFAULT_CUSTOM_SETTINGS: CustomFormatSettings = {
  timeFormat: '24h',
  numberFormat: 'auto'
};

/** Maximum number of detection history items to keep */
export const MAX_DETECTION_HISTORY = 5;

/** Preference validation error */
export interface PreferenceValidationError {
  field: string;
  error: string;
  value: any;
}

/** Helper function to create detection history item */
export function createDetectionHistoryItem(result: LanguageDetectionResult): DetectionHistoryItem {
  return {
    detectedLanguage: result.detectedLanguage,
    detectionMethod: result.detectionMethod,
    confidence: result.confidence,
    timestamp: result.timestamp
  };
}

/** Helper function to update detection history */
export function updateDetectionHistory(
  history: DetectionHistoryItem[],
  newItem: DetectionHistoryItem
): DetectionHistoryItem[] {
  const updated = [newItem, ...history];
  return updated.slice(0, MAX_DETECTION_HISTORY);
}

/** Helper function to validate language preference request */
export function validateLanguagePreferenceRequest(
  request: LanguagePreferenceRequest,
  supportedLanguages: string[]
): PreferenceValidationError[] {
  const errors: PreferenceValidationError[] = [];

  // Validate language code
  if (!request.language) {
    errors.push({
      field: 'language',
      error: 'Language is required',
      value: request.language
    });
  } else if (!supportedLanguages.includes(request.language)) {
    errors.push({
      field: 'language',
      error: `Language '${request.language}' is not supported`,
      value: request.language
    });
  }

  // Validate custom settings
  if (request.customSettings) {
    const { timeFormat, numberFormat } = request.customSettings;

    if (timeFormat && !['12h', '24h'].includes(timeFormat)) {
      errors.push({
        field: 'customSettings.timeFormat',
        error: 'Time format must be "12h" or "24h"',
        value: timeFormat
      });
    }

    if (numberFormat && !['auto', 'us', 'eu'].includes(numberFormat)) {
      errors.push({
        field: 'customSettings.numberFormat',
        error: 'Number format must be "auto", "us", or "eu"',
        value: numberFormat
      });
    }
  }

  return errors;
}

/** Helper function to load user preference from localStorage */
export function loadUserPreferenceFromStorage(): UserLanguagePreference | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(STORAGE_KEYS.LANGUAGE_PREFERENCE);
    if (!stored) return null;

    const preference: UserLanguagePreference = JSON.parse(stored);

    // Validate structure
    if (!preference.selectedLanguage || typeof preference.autoDetection !== 'boolean') {
      return null;
    }

    return preference;
  } catch (error) {
    console.warn('Failed to load language preference from storage:', error);
    return null;
  }
}

/** Helper function to save user preference to localStorage */
export function saveUserPreferenceToStorage(preference: UserLanguagePreference): boolean {
  if (typeof window === 'undefined') return false;

  try {
    localStorage.setItem(STORAGE_KEYS.LANGUAGE_PREFERENCE, JSON.stringify(preference));
    return true;
  } catch (error) {
    console.warn('Failed to save language preference to storage:', error);
    return false;
  }
}

/** Helper function to clear all preference data from storage */
export function clearPreferenceStorage(): void {
  if (typeof window === 'undefined') return;

  Object.values(STORAGE_KEYS).forEach(key => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn(`Failed to remove ${key} from storage:`, error);
    }
  });
}