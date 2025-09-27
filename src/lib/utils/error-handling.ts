/**
 * Error Handling Utilities for Multi-Language Features
 *
 * Provides comprehensive error handling, validation, and recovery mechanisms
 */

import { SupportedLanguage } from '../types/language-config';

// Error codes for different failure scenarios
export enum LanguageErrorCode {
  // Detection errors
  DETECTION_FAILED = 'DETECTION_FAILED',
  GEOLOCATION_DENIED = 'GEOLOCATION_DENIED',
  GEOLOCATION_TIMEOUT = 'GEOLOCATION_TIMEOUT',
  GEOLOCATION_UNAVAILABLE = 'GEOLOCATION_UNAVAILABLE',

  // Translation loading errors
  TRANSLATION_NOT_FOUND = 'TRANSLATION_NOT_FOUND',
  TRANSLATION_LOAD_FAILED = 'TRANSLATION_LOAD_FAILED',
  TRANSLATION_PARSE_ERROR = 'TRANSLATION_PARSE_ERROR',
  TRANSLATION_CACHE_ERROR = 'TRANSLATION_CACHE_ERROR',

  // Language switching errors
  LANGUAGE_NOT_SUPPORTED = 'LANGUAGE_NOT_SUPPORTED',
  LANGUAGE_SWITCH_FAILED = 'LANGUAGE_SWITCH_FAILED',

  // Network errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  SERVER_ERROR = 'SERVER_ERROR',

  // Validation errors
  INVALID_LANGUAGE_CODE = 'INVALID_LANGUAGE_CODE',
  INVALID_NAMESPACE = 'INVALID_NAMESPACE',
  INVALID_CONFIGURATION = 'INVALID_CONFIGURATION',

  // Performance errors
  PERFORMANCE_THRESHOLD_EXCEEDED = 'PERFORMANCE_THRESHOLD_EXCEEDED',
  MEMORY_LIMIT_EXCEEDED = 'MEMORY_LIMIT_EXCEEDED'
}

export interface LanguageError extends Error {
  code: LanguageErrorCode;
  context?: Record<string, any>;
  recoverable: boolean;
  timestamp: number;
  userMessage?: string;
}

export interface ErrorRecoveryStrategy {
  maxRetries: number;
  retryDelay: number;
  backoffMultiplier: number;
  fallbackAction?: () => Promise<any>;
}

export interface ValidationRule<T = any> {
  name: string;
  validate: (value: T) => boolean;
  message: string;
  severity: 'error' | 'warning';
}

export class LanguageErrorHandler {
  private static instance: LanguageErrorHandler;
  private errorLog: LanguageError[] = [];
  private readonly maxLogSize = 100;
  private readonly defaultRecoveryStrategies: Record<LanguageErrorCode, ErrorRecoveryStrategy> = {
    [LanguageErrorCode.DETECTION_FAILED]: {
      maxRetries: 2,
      retryDelay: 1000,
      backoffMultiplier: 2,
      fallbackAction: () => this.fallbackToDefaultLanguage()
    },
    [LanguageErrorCode.GEOLOCATION_TIMEOUT]: {
      maxRetries: 1,
      retryDelay: 500,
      backoffMultiplier: 1,
      fallbackAction: () => this.fallbackToBrowserLanguage()
    },
    [LanguageErrorCode.TRANSLATION_LOAD_FAILED]: {
      maxRetries: 3,
      retryDelay: 2000,
      backoffMultiplier: 1.5,
      fallbackAction: () => this.fallbackToEnglish()
    },
    [LanguageErrorCode.NETWORK_ERROR]: {
      maxRetries: 5,
      retryDelay: 1000,
      backoffMultiplier: 2
    },
    [LanguageErrorCode.RATE_LIMIT_EXCEEDED]: {
      maxRetries: 3,
      retryDelay: 5000,
      backoffMultiplier: 2
    },
    [LanguageErrorCode.LANGUAGE_NOT_SUPPORTED]: {
      maxRetries: 0,
      retryDelay: 0,
      backoffMultiplier: 1,
      fallbackAction: () => this.fallbackToDefaultLanguage()
    },
    [LanguageErrorCode.TRANSLATION_NOT_FOUND]: {
      maxRetries: 1,
      retryDelay: 1000,
      backoffMultiplier: 1,
      fallbackAction: () => this.fallbackToEnglish()
    },
    [LanguageErrorCode.TRANSLATION_PARSE_ERROR]: {
      maxRetries: 0,
      retryDelay: 0,
      backoffMultiplier: 1,
      fallbackAction: () => this.fallbackToEnglish()
    },
    [LanguageErrorCode.LANGUAGE_SWITCH_FAILED]: {
      maxRetries: 2,
      retryDelay: 500,
      backoffMultiplier: 2
    },
    [LanguageErrorCode.GEOLOCATION_DENIED]: {
      maxRetries: 0,
      retryDelay: 0,
      backoffMultiplier: 1,
      fallbackAction: () => this.fallbackToBrowserLanguage()
    },
    [LanguageErrorCode.GEOLOCATION_UNAVAILABLE]: {
      maxRetries: 0,
      retryDelay: 0,
      backoffMultiplier: 1,
      fallbackAction: () => this.fallbackToBrowserLanguage()
    },
    [LanguageErrorCode.TRANSLATION_CACHE_ERROR]: {
      maxRetries: 1,
      retryDelay: 500,
      backoffMultiplier: 1
    },
    [LanguageErrorCode.SERVER_ERROR]: {
      maxRetries: 3,
      retryDelay: 2000,
      backoffMultiplier: 2
    },
    [LanguageErrorCode.INVALID_LANGUAGE_CODE]: {
      maxRetries: 0,
      retryDelay: 0,
      backoffMultiplier: 1,
      fallbackAction: () => this.fallbackToDefaultLanguage()
    },
    [LanguageErrorCode.INVALID_NAMESPACE]: {
      maxRetries: 0,
      retryDelay: 0,
      backoffMultiplier: 1
    },
    [LanguageErrorCode.INVALID_CONFIGURATION]: {
      maxRetries: 0,
      retryDelay: 0,
      backoffMultiplier: 1
    },
    [LanguageErrorCode.PERFORMANCE_THRESHOLD_EXCEEDED]: {
      maxRetries: 0,
      retryDelay: 0,
      backoffMultiplier: 1
    },
    [LanguageErrorCode.MEMORY_LIMIT_EXCEEDED]: {
      maxRetries: 0,
      retryDelay: 0,
      backoffMultiplier: 1
    }
  };

  public static getInstance(): LanguageErrorHandler {
    if (!LanguageErrorHandler.instance) {
      LanguageErrorHandler.instance = new LanguageErrorHandler();
    }
    return LanguageErrorHandler.instance;
  }

  /**
   * Create a standardized language error
   */
  createError(
    code: LanguageErrorCode,
    message: string,
    context?: Record<string, any>,
    userMessage?: string
  ): LanguageError {
    const error = new Error(message) as LanguageError;
    error.code = code;
    error.context = context;
    error.recoverable = this.isRecoverable(code);
    error.timestamp = Date.now();
    error.userMessage = userMessage || this.getDefaultUserMessage(code);

    this.logError(error);
    return error;
  }

  /**
   * Handle error with automatic recovery
   */
  async handleError<T>(
    error: LanguageError,
    operation: () => Promise<T>,
    customStrategy?: Partial<ErrorRecoveryStrategy>
  ): Promise<T> {
    const strategy = {
      ...this.defaultRecoveryStrategies[error.code],
      ...customStrategy
    };

    if (!error.recoverable || strategy.maxRetries === 0) {
      if (strategy.fallbackAction) {
        try {
          return await strategy.fallbackAction();
        } catch (fallbackError) {
          console.error('Fallback action failed:', fallbackError);
          throw error;
        }
      }
      throw error;
    }

    return await this.retryWithBackoff(operation, strategy);
  }

  /**
   * Validate language configuration
   */
  validateLanguageConfig(config: any): { valid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    const rules: ValidationRule[] = [
      {
        name: 'language_required',
        validate: (c) => c && typeof c.language === 'string',
        message: 'Language code is required',
        severity: 'error'
      },
      {
        name: 'language_supported',
        validate: (c) => this.isValidLanguageCode(c.language),
        message: 'Language code is not supported',
        severity: 'error'
      },
      {
        name: 'auto_detection_boolean',
        validate: (c) => c.autoDetection === undefined || typeof c.autoDetection === 'boolean',
        message: 'autoDetection must be boolean',
        severity: 'error'
      },
      {
        name: 'time_format_valid',
        validate: (c) => !c.customSettings?.timeFormat || ['12h', '24h'].includes(c.customSettings.timeFormat),
        message: 'timeFormat must be "12h" or "24h"',
        severity: 'error'
      },
      {
        name: 'number_format_valid',
        validate: (c) => !c.customSettings?.numberFormat || ['auto', 'us', 'eu'].includes(c.customSettings.numberFormat),
        message: 'numberFormat must be "auto", "us", or "eu"',
        severity: 'error'
      },
      {
        name: 'date_format_string',
        validate: (c) => !c.customSettings?.dateFormat || typeof c.customSettings.dateFormat === 'string',
        message: 'dateFormat must be a string',
        severity: 'warning'
      }
    ];

    for (const rule of rules) {
      if (!rule.validate(config)) {
        if (rule.severity === 'error') {
          errors.push(rule.message);
        } else {
          warnings.push(rule.message);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate namespace name
   */
  validateNamespace(namespace: string): { valid: boolean; error?: string } {
    if (!namespace || typeof namespace !== 'string') {
      return { valid: false, error: 'Namespace must be a non-empty string' };
    }

    if (!/^[a-z][a-z0-9-_]*$/.test(namespace)) {
      return { valid: false, error: 'Namespace must start with a letter and contain only lowercase letters, numbers, hyphens, and underscores' };
    }

    if (namespace.length > 50) {
      return { valid: false, error: 'Namespace must be 50 characters or less' };
    }

    return { valid: true };
  }

  /**
   * Validate translation data structure
   */
  validateTranslationData(data: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data || typeof data !== 'object') {
      errors.push('Translation data must be an object');
      return { valid: false, errors };
    }

    // Check for circular references
    try {
      JSON.stringify(data);
    } catch (error) {
      errors.push('Translation data contains circular references');
    }

    // Validate structure recursively
    this.validateTranslationStructure(data, '', errors);

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get error statistics
   */
  getErrorStats(): {
    totalErrors: number;
    errorsByCode: Record<LanguageErrorCode, number>;
    recoverableErrors: number;
    recentErrors: LanguageError[];
  } {
    const errorsByCode = {} as Record<LanguageErrorCode, number>;
    let recoverableErrors = 0;

    for (const error of this.errorLog) {
      errorsByCode[error.code] = (errorsByCode[error.code] || 0) + 1;
      if (error.recoverable) {
        recoverableErrors++;
      }
    }

    const recentErrors = this.errorLog
      .filter(e => e.timestamp > Date.now() - 60000) // Last minute
      .slice(-10); // Last 10 errors

    return {
      totalErrors: this.errorLog.length,
      errorsByCode,
      recoverableErrors,
      recentErrors
    };
  }

  /**
   * Clear error log
   */
  clearErrorLog(): void {
    this.errorLog = [];
  }

  /**
   * Private helper methods
   */
  private logError(error: LanguageError): void {
    this.errorLog.push(error);

    // Keep log size manageable
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(-this.maxLogSize);
    }

    // Log to console based on severity
    if (error.recoverable) {
      console.warn(`Recoverable language error [${error.code}]:`, error.message, error.context);
    } else {
      console.error(`Critical language error [${error.code}]:`, error.message, error.context);
    }
  }

  private isRecoverable(code: LanguageErrorCode): boolean {
    const nonRecoverableErrors = [
      LanguageErrorCode.INVALID_LANGUAGE_CODE,
      LanguageErrorCode.INVALID_NAMESPACE,
      LanguageErrorCode.INVALID_CONFIGURATION,
      LanguageErrorCode.TRANSLATION_PARSE_ERROR
    ];

    return !nonRecoverableErrors.includes(code);
  }

  private getDefaultUserMessage(code: LanguageErrorCode): string {
    const messages: Record<LanguageErrorCode, string> = {
      [LanguageErrorCode.DETECTION_FAILED]: 'Unable to detect your language. Using default language.',
      [LanguageErrorCode.GEOLOCATION_DENIED]: 'Location access denied. Using browser language.',
      [LanguageErrorCode.GEOLOCATION_TIMEOUT]: 'Location detection timed out. Using browser language.',
      [LanguageErrorCode.GEOLOCATION_UNAVAILABLE]: 'Location services unavailable. Using browser language.',
      [LanguageErrorCode.TRANSLATION_NOT_FOUND]: 'Translation not available. Using English.',
      [LanguageErrorCode.TRANSLATION_LOAD_FAILED]: 'Failed to load translations. Using English.',
      [LanguageErrorCode.TRANSLATION_PARSE_ERROR]: 'Translation data is corrupted. Using English.',
      [LanguageErrorCode.TRANSLATION_CACHE_ERROR]: 'Translation cache error. Reloading translations.',
      [LanguageErrorCode.LANGUAGE_NOT_SUPPORTED]: 'This language is not supported. Using default language.',
      [LanguageErrorCode.LANGUAGE_SWITCH_FAILED]: 'Failed to switch language. Please try again.',
      [LanguageErrorCode.NETWORK_ERROR]: 'Network error. Please check your connection.',
      [LanguageErrorCode.RATE_LIMIT_EXCEEDED]: 'Too many requests. Please wait a moment.',
      [LanguageErrorCode.SERVER_ERROR]: 'Server error. Please try again later.',
      [LanguageErrorCode.INVALID_LANGUAGE_CODE]: 'Invalid language code provided.',
      [LanguageErrorCode.INVALID_NAMESPACE]: 'Invalid translation namespace.',
      [LanguageErrorCode.INVALID_CONFIGURATION]: 'Invalid language configuration.',
      [LanguageErrorCode.PERFORMANCE_THRESHOLD_EXCEEDED]: 'Language feature is running slowly.',
      [LanguageErrorCode.MEMORY_LIMIT_EXCEEDED]: 'Memory limit exceeded. Clearing cache.'
    };

    return messages[code] || 'An unexpected error occurred.';
  }

  private isValidLanguageCode(code: string): boolean {
    const supportedLanguages = ['en', 'es', 'fr', 'de', 'it'];
    return supportedLanguages.includes(code);
  }

  private async retryWithBackoff<T>(
    operation: () => Promise<T>,
    strategy: ErrorRecoveryStrategy
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= strategy.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        if (attempt < strategy.maxRetries) {
          const delay = strategy.retryDelay * Math.pow(strategy.backoffMultiplier, attempt - 1);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // If all retries failed, try fallback
    if (strategy.fallbackAction) {
      try {
        return await strategy.fallbackAction();
      } catch (fallbackError) {
        console.error('Fallback action failed:', fallbackError);
      }
    }

    throw lastError!;
  }

  private validateTranslationStructure(obj: any, path: string, errors: string[]): void {
    for (const [key, value] of Object.entries(obj)) {
      const currentPath = path ? `${path}.${key}` : key;

      if (typeof value === 'string') {
        // Valid translation string
        if (value.length > 10000) {
          errors.push(`Translation string too long at ${currentPath} (max 10000 characters)`);
        }
      } else if (typeof value === 'object' && value !== null) {
        // Nested object - recurse
        if (currentPath.split('.').length > 10) {
          errors.push(`Translation nesting too deep at ${currentPath} (max 10 levels)`);
        } else {
          this.validateTranslationStructure(value, currentPath, errors);
        }
      } else {
        errors.push(`Invalid translation value type at ${currentPath} (must be string or object)`);
      }

      // Validate key format
      if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(key)) {
        errors.push(`Invalid translation key format at ${currentPath} (must start with letter, contain only letters, numbers, hyphens, underscores)`);
      }
    }
  }

  private async fallbackToDefaultLanguage(): Promise<'en'> {
    return 'en';
  }

  private async fallbackToBrowserLanguage(): Promise<string> {
    if (typeof navigator !== 'undefined' && navigator.language) {
      const browserLang = navigator.language.split('-')[0];
      return this.isValidLanguageCode(browserLang) ? browserLang : 'en';
    }
    return 'en';
  }

  private async fallbackToEnglish(): Promise<any> {
    // Return minimal English fallback translations
    return {
      common: {
        error: 'Error',
        loading: 'Loading...',
        retry: 'Retry'
      }
    };
  }
}

// Export singleton instance and utilities
export const errorHandler = LanguageErrorHandler.getInstance();

export const createLanguageError = (
  code: LanguageErrorCode,
  message: string,
  context?: Record<string, any>,
  userMessage?: string
): LanguageError => {
  return errorHandler.createError(code, message, context, userMessage);
};

export const handleLanguageError = async <T>(
  error: LanguageError,
  operation: () => Promise<T>,
  customStrategy?: Partial<ErrorRecoveryStrategy>
): Promise<T> => {
  return errorHandler.handleError(error, operation, customStrategy);
};