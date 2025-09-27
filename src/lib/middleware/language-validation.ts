/**
 * Language Validation Middleware
 *
 * Provides validation middleware for API routes and request handling
 */

import { NextRequest, NextResponse } from 'next/server';
import { errorHandler, LanguageErrorCode, createLanguageError } from '../utils/error-handling';

export interface ValidationOptions {
  validateLanguage?: boolean;
  validateNamespace?: boolean;
  validateVersion?: boolean;
  allowedLanguages?: string[];
  allowedNamespaces?: string[];
  maxRequestSize?: number;
  rateLimitPerMinute?: number;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  sanitizedData?: any;
}

const DEFAULT_OPTIONS: ValidationOptions = {
  validateLanguage: true,
  validateNamespace: false,
  validateVersion: false,
  allowedLanguages: ['en', 'es', 'fr', 'de', 'it'],
  allowedNamespaces: ['common', 'dashboard', 'auth', 'settings', 'time', 'export'],
  maxRequestSize: 100000, // 100KB
  rateLimitPerMinute: 60
};

// Simple rate limiting store (replace with Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export class LanguageValidationMiddleware {
  private options: ValidationOptions;

  constructor(options: Partial<ValidationOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Validate incoming request for language-related endpoints
   */
  async validateRequest(request: NextRequest): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Rate limiting check
      if (this.options.rateLimitPerMinute) {
        const rateLimitResult = this.checkRateLimit(request);
        if (!rateLimitResult.allowed) {
          errors.push(`Rate limit exceeded: ${rateLimitResult.message}`);
          return { valid: false, errors, warnings };
        }
      }

      // Request size validation
      if (this.options.maxRequestSize) {
        const contentLength = parseInt(request.headers.get('content-length') || '0');
        if (contentLength > this.options.maxRequestSize) {
          errors.push(`Request too large: ${contentLength} bytes (max: ${this.options.maxRequestSize})`);
          return { valid: false, errors, warnings };
        }
      }

      // URL parameter validation
      const url = new URL(request.url);
      const pathValidation = this.validateUrlPath(url.pathname);
      if (!pathValidation.valid) {
        errors.push(...pathValidation.errors);
        warnings.push(...pathValidation.warnings);
      }

      // Query parameter validation
      const queryValidation = this.validateQueryParams(url.searchParams);
      if (!queryValidation.valid) {
        errors.push(...queryValidation.errors);
        warnings.push(...queryValidation.warnings);
      }

      // Content type validation for POST/PUT requests
      if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
        const contentType = request.headers.get('content-type');
        if (contentType && !contentType.includes('application/json')) {
          warnings.push('Content-Type should be application/json for optimal performance');
        }
      }

      return {
        valid: errors.length === 0,
        errors,
        warnings
      };

    } catch (error) {
      errors.push(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { valid: false, errors, warnings };
    }
  }

  /**
   * Validate request body for language configuration
   */
  async validateRequestBody(request: NextRequest): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      if (!['POST', 'PUT', 'PATCH'].includes(request.method)) {
        return { valid: true, errors, warnings };
      }

      const contentType = request.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        errors.push('Content-Type must be application/json');
        return { valid: false, errors, warnings };
      }

      let body: any;
      try {
        body = await request.json();
      } catch (parseError) {
        errors.push('Invalid JSON in request body');
        return { valid: false, errors, warnings };
      }

      // Validate language configuration if present
      if (body.language !== undefined) {
        const langValidation = errorHandler.validateLanguageConfig(body);
        if (!langValidation.valid) {
          errors.push(...langValidation.errors);
          warnings.push(...langValidation.warnings);
        }
      }

      // Validate translation data if present
      if (body.translations !== undefined) {
        const translationValidation = errorHandler.validateTranslationData(body.translations);
        if (!translationValidation.valid) {
          errors.push(...translationValidation.errors);
        }
      }

      // Sanitize data
      const sanitizedData = this.sanitizeRequestData(body);

      return {
        valid: errors.length === 0,
        errors,
        warnings,
        sanitizedData
      };

    } catch (error) {
      errors.push(`Body validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { valid: false, errors, warnings };
    }
  }

  /**
   * Create validation error response
   */
  createValidationErrorResponse(validation: ValidationResult): NextResponse {
    const statusCode = validation.errors.length > 0 ? 400 : 200;

    return NextResponse.json(
      {
        error: 'validation_failed',
        message: 'Request validation failed',
        details: {
          errors: validation.errors,
          warnings: validation.warnings
        }
      },
      { status: statusCode }
    );
  }

  /**
   * Middleware wrapper for Next.js API routes
   */
  middleware() {
    return async (request: NextRequest): Promise<NextResponse | null> => {
      const validation = await this.validateRequest(request);

      if (!validation.valid) {
        return this.createValidationErrorResponse(validation);
      }

      // Log warnings if any
      if (validation.warnings.length > 0) {
        console.warn('Request validation warnings:', validation.warnings);
      }

      return null; // Continue to next middleware/handler
    };
  }

  /**
   * Private helper methods
   */
  private validateUrlPath(pathname: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Extract language from path if it's a language-specific endpoint
    const languageMatch = pathname.match(/\/api\/v1\/(?:translations|language)\/([a-z]{2}(?:-[A-Z]{2})?)/);
    if (languageMatch && this.options.validateLanguage) {
      const language = languageMatch[1].split('-')[0]; // Extract base language code
      if (!this.options.allowedLanguages?.includes(language)) {
        errors.push(`Unsupported language: ${language}`);
      }
    }

    // Validate path structure
    if (pathname.includes('..') || pathname.includes('//')) {
      errors.push('Invalid path structure detected');
    }

    // Check for excessively long paths
    if (pathname.length > 200) {
      warnings.push('Request path is unusually long');
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  private validateQueryParams(searchParams: URLSearchParams): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate namespace parameter
    const namespace = searchParams.get('namespace');
    if (namespace && this.options.validateNamespace) {
      const namespaceValidation = errorHandler.validateNamespace(namespace);
      if (!namespaceValidation.valid) {
        errors.push(namespaceValidation.error!);
      } else if (!this.options.allowedNamespaces?.includes(namespace)) {
        errors.push(`Unsupported namespace: ${namespace}`);
      }
    }

    // Validate version parameter
    const version = searchParams.get('version');
    if (version && this.options.validateVersion) {
      if (!/^\d+\.\d+\.\d+$/.test(version)) {
        errors.push('Version must be in semver format (e.g., 1.0.0)');
      }
    }

    // Validate limit parameter
    const limit = searchParams.get('limit');
    if (limit) {
      const limitNum = parseInt(limit);
      if (isNaN(limitNum) || limitNum < 1 || limitNum > 1000) {
        errors.push('Limit must be between 1 and 1000');
      }
    }

    // Validate timestamp parameters
    const timeParams = ['startTime', 'endTime', 'timestamp'];
    for (const param of timeParams) {
      const value = searchParams.get(param);
      if (value) {
        const timestamp = parseInt(value);
        if (isNaN(timestamp) || timestamp < 0) {
          errors.push(`${param} must be a valid timestamp`);
        }
      }
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  private checkRateLimit(request: NextRequest): { allowed: boolean; message?: string } {
    const clientIp = this.getClientIp(request);
    const now = Date.now();
    const windowStart = now - 60000; // 1 minute window

    const key = `rate_limit:${clientIp}`;
    const existing = rateLimitStore.get(key);

    if (!existing || existing.resetTime < now) {
      // New window or expired
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + 60000
      });
      return { allowed: true };
    }

    if (existing.count >= (this.options.rateLimitPerMinute || 60)) {
      return {
        allowed: false,
        message: `Rate limit exceeded. Try again in ${Math.ceil((existing.resetTime - now) / 1000)} seconds`
      };
    }

    // Increment counter
    existing.count++;
    return { allowed: true };
  }

  private getClientIp(request: NextRequest): string {
    // Try various headers that might contain the real IP
    const headers = [
      'x-forwarded-for',
      'x-real-ip',
      'x-client-ip',
      'cf-connecting-ip'
    ];

    for (const header of headers) {
      const ip = request.headers.get(header);
      if (ip) {
        // Handle comma-separated IPs (take the first one)
        return ip.split(',')[0].trim();
      }
    }

    // Fallback to a generic identifier
    return 'unknown';
  }

  private sanitizeRequestData(data: any): any {
    if (typeof data !== 'object' || data === null) {
      return data;
    }

    const sanitized: any = {};

    for (const [key, value] of Object.entries(data)) {
      // Remove potentially dangerous keys
      if (key.startsWith('__') || key.includes('prototype')) {
        continue;
      }

      // Sanitize string values
      if (typeof value === 'string') {
        sanitized[key] = value.trim().slice(0, 10000); // Limit string length
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeRequestData(value);
      } else if (typeof value === 'number' || typeof value === 'boolean') {
        sanitized[key] = value;
      }
      // Skip other types (functions, symbols, etc.)
    }

    return sanitized;
  }

  /**
   * Clean up rate limit store (call periodically)
   */
  static cleanupRateLimit(): void {
    const now = Date.now();
    for (const [key, data] of rateLimitStore.entries()) {
      if (data.resetTime < now) {
        rateLimitStore.delete(key);
      }
    }
  }
}

// Export utilities
export const createLanguageValidator = (options?: Partial<ValidationOptions>): LanguageValidationMiddleware => {
  return new LanguageValidationMiddleware(options);
};

export const defaultValidator = new LanguageValidationMiddleware();

// Utility functions for common validations
export const validationUtils = {
  isValidLanguageCode: (code: string): boolean => {
    return /^[a-z]{2}(-[A-Z]{2})?$/.test(code);
  },

  isValidNamespace: (namespace: string): boolean => {
    return /^[a-z][a-z0-9-_]*$/.test(namespace) && namespace.length <= 50;
  },

  isValidVersion: (version: string): boolean => {
    return /^\d+\.\d+\.\d+(-[a-zA-Z0-9-.]+)?$/.test(version);
  },

  sanitizeLanguageCode: (code: string): string => {
    return code.toLowerCase().slice(0, 5).replace(/[^a-z-]/g, '');
  },

  sanitizeNamespace: (namespace: string): string => {
    return namespace.toLowerCase().slice(0, 50).replace(/[^a-z0-9-_]/g, '');
  }
};