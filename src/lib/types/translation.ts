/**
 * Translation Types
 *
 * Defines types for translation files, loading states, and cache management
 */

/** Nested translation object supporting hierarchical keys */
export interface TranslationObject {
  [key: string]: string | TranslationObject;
}

/** Structure of a translation file namespace */
export interface TranslationFile {
  [namespace: string]: TranslationObject;
}

/** Metadata about translation files */
export interface TranslationMetadata {
  /** Version identifier for cache invalidation */
  version: string;
  /** When translations were last updated */
  lastUpdated: string;
  /** Translation completeness statistics */
  completeness: {
    /** Total number of translation keys */
    total: number;
    /** Number of translated keys */
    translated: number;
    /** Number of missing translations */
    missing: number;
    /** Completion percentage (0-1) */
    percentage: number;
  };
  /** How translations were created */
  generationMethod: 'manual' | 'automated' | 'hybrid';
  /** Quality metrics */
  quality: {
    /** Overall quality score (0-1) */
    score: number;
    /** Whether translations have been manually reviewed */
    reviewed: boolean;
  };
}

/** Loading status for individual namespaces */
export interface LoadingStatus {
  status: 'idle' | 'loading' | 'loaded' | 'error';
  /** When this namespace was last loaded */
  lastLoaded?: string;
  /** Number of retry attempts */
  retryCount: number;
}

/** Cache entry for translation data */
export interface TranslationCacheEntry {
  /** Actual translation data */
  data: Record<string, any>;
  /** Cache expiration timestamp */
  expires: number;
  /** Version for cache invalidation */
  version: string;
}

/** Translation cache organized by language and namespace */
export interface TranslationCache {
  [language: string]: {
    [namespace: string]: TranslationCacheEntry;
  };
}

/** Translation error information */
export interface TranslationError {
  /** Language code where error occurred */
  language: string;
  /** Namespace where error occurred */
  namespace: string;
  /** Error message */
  error: string;
  /** When error occurred */
  timestamp: string;
  /** Whether this error can be retried */
  retryable: boolean;
}

/** Overall translation loading state */
export interface TranslationLoadingState {
  /** Currently active language */
  currentLanguage: string;
  /** Loading states per namespace */
  loadingStates: Record<string, LoadingStatus>;
  /** Translation cache */
  cache: TranslationCache;
  /** Recorded errors */
  errors: TranslationError[];
}

/** Translation validation error */
export interface ValidationError {
  /** Namespace where error occurred */
  namespace: string;
  /** Translation key with error */
  key: string;
  /** Type of validation error */
  error: 'missing_key' | 'invalid_format' | 'too_long' | 'invalid_interpolation' | 'html_content';
  /** Human-readable error description */
  message: string;
  /** Error severity level */
  severity: 'error' | 'warning';
}

/** Translation validation warning */
export interface ValidationWarning {
  namespace: string;
  key: string;
  warning: 'length_mismatch' | 'capitalization' | 'punctuation' | 'placeholder_count';
  message: string;
  /** Suggested improvement */
  suggestion: string;
}

/** Result of translation validation */
export interface ValidationResult {
  /** Overall validation success */
  isValid: boolean;
  /** Validation errors found */
  errors: ValidationError[];
  /** Validation warnings */
  warnings: ValidationWarning[];
  /** Validation statistics */
  statistics: {
    totalKeys: number;
    missingKeys: number;
    invalidKeys: number;
    completeness: number;
  };
}

/** Translation generation job progress */
export interface TranslationJobProgress {
  /** Total strings to translate */
  total: number;
  /** Strings already translated */
  completed: number;
  /** Translation failures */
  failed: number;
  /** Progress percentage (0-1) */
  percentage: number;
}

/** Translation generation job status */
export interface TranslationJobStatus {
  /** Unique job identifier */
  jobId: string;
  /** Current job status */
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
  /** Target language being translated */
  language: string;
  /** Job progress information */
  progress: TranslationJobProgress;
  /** When job started */
  startedAt: string;
  /** When job completed (if finished) */
  completedAt?: string;
  /** Job errors */
  errors: Array<{
    key: string;
    error: string;
    timestamp: string;
  }>;
  /** Job result (if completed) */
  result?: {
    translatedKeys: number;
    skippedKeys: number;
    qualityScore: number;
    downloadUrl?: string;
  };
}

/** Supported translation namespaces */
export const TRANSLATION_NAMESPACES = [
  'common',
  'dashboard',
  'auth',
  'settings',
  'time',
  'export'
] as const;

export type TranslationNamespace = typeof TRANSLATION_NAMESPACES[number];

/** Helper function to validate namespace */
export function isValidNamespace(namespace: string): namespace is TranslationNamespace {
  return TRANSLATION_NAMESPACES.includes(namespace as TranslationNamespace);
}

/** Helper function to create empty loading state */
export function createEmptyLoadingState(language: string): TranslationLoadingState {
  const loadingStates: Record<string, LoadingStatus> = {};

  TRANSLATION_NAMESPACES.forEach(namespace => {
    loadingStates[namespace] = {
      status: 'idle',
      retryCount: 0
    };
  });

  return {
    currentLanguage: language,
    loadingStates,
    cache: {},
    errors: []
  };
}