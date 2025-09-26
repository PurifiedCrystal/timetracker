/**
 * Rate limiting middleware for API routes
 */
import { NextRequest, NextResponse } from 'next/server';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  message?: string; // Custom error message
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  skipFailedRequests?: boolean; // Don't count failed requests
}

interface RateLimitStore {
  [key: string]: {
    requests: number;
    windowStart: number;
  };
}

// In-memory store for rate limiting (use Redis in production)
const rateLimitStore: RateLimitStore = {};

// Default configurations for different endpoints
export const RATE_LIMIT_CONFIGS = {
  // Authentication endpoints - stricter limits
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 attempts per 15 minutes
    message: 'Too many authentication attempts. Please try again later.'
  },

  // Time entry operations - moderate limits
  timeEntries: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30, // 30 requests per minute
    message: 'Too many requests. Please slow down.'
  },

  // Export generation - very strict limits
  exports: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 3, // 3 exports per minute
    message: 'Export limit exceeded. Please wait before generating another report.'
  },

  // Profile updates - moderate limits
  profile: {
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 10, // 10 updates per 5 minutes
    message: 'Too many profile updates. Please try again later.'
  },

  // Subscription operations - strict limits
  subscription: {
    windowMs: 10 * 60 * 1000, // 10 minutes
    maxRequests: 5, // 5 operations per 10 minutes
    message: 'Subscription operation limit exceeded. Please try again later.'
  },

  // General API - lenient limits
  general: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100, // 100 requests per minute
    message: 'Rate limit exceeded. Please try again later.'
  }
};

/**
 * Get client identifier from request
 */
function getClientId(request: NextRequest): string {
  // Try to get user ID from session/token
  const authHeader = request.headers.get('authorization');
  if (authHeader) {
    try {
      // Parse JWT or session token to get user ID
      // For now, use a simple hash of the token
      return `user:${Buffer.from(authHeader).toString('base64').slice(0, 16)}`;
    } catch {
      // Fall back to IP-based identification
    }
  }

  // Use IP address as fallback
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0] ?? request.ip ?? 'unknown';
  return `ip:${ip}`;
}

/**
 * Check if request should be rate limited
 */
export function isRateLimited(clientId: string, config: RateLimitConfig): boolean {
  const now = Date.now();
  const key = `${clientId}:${config.windowMs}:${config.maxRequests}`;

  // Get or initialize client data
  let clientData = rateLimitStore[key];

  if (!clientData || now - clientData.windowStart > config.windowMs) {
    // Start new window
    clientData = {
      requests: 1,
      windowStart: now
    };
    rateLimitStore[key] = clientData;
    return false;
  }

  // Within existing window
  if (clientData.requests >= config.maxRequests) {
    return true; // Rate limited
  }

  // Increment request count
  clientData.requests++;
  return false;
}

/**
 * Rate limiting middleware factory
 */
export function createRateLimiter(config: RateLimitConfig) {
  return function rateLimitMiddleware(request: NextRequest) {
    const clientId = getClientId(request);

    if (isRateLimited(clientId, config)) {
      return NextResponse.json(
        {
          error: config.message || 'Rate limit exceeded',
          retryAfter: Math.ceil(config.windowMs / 1000)
        },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil(config.windowMs / 1000).toString(),
            'X-RateLimit-Limit': config.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(Date.now() + config.windowMs).toISOString()
          }
        }
      );
    }

    return null; // Continue processing
  };
}

/**
 * Apply rate limiting to API route
 */
export function withRateLimit(handler: Function, configKey: keyof typeof RATE_LIMIT_CONFIGS = 'general') {
  const config = RATE_LIMIT_CONFIGS[configKey];
  const rateLimiter = createRateLimiter(config);

  return async function rateLimitedHandler(request: NextRequest) {
    // Check rate limit
    const rateLimitResponse = rateLimiter(request);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Continue with original handler
    try {
      return await handler(request);
    } catch (error) {
      // If this is a failed request and we're configured to skip failed requests,
      // we could decrement the counter here
      throw error;
    }
  };
}

/**
 * Clean up old entries from rate limit store (call periodically)
 */
export function cleanupRateLimitStore(): void {
  const now = Date.now();
  const keys = Object.keys(rateLimitStore);

  for (const key of keys) {
    const clientData = rateLimitStore[key];

    // Extract window duration from key (format: clientId:windowMs:maxRequests)
    const parts = key.split(':');
    const windowMs = parseInt(parts[parts.length - 2], 10);

    if (now - clientData.windowStart > windowMs * 2) {
      // Remove entries that are twice the window age
      delete rateLimitStore[key];
    }
  }
}

/**
 * Get rate limit status for a client
 */
export function getRateLimitStatus(clientId: string, config: RateLimitConfig): {
  limited: boolean;
  remaining: number;
  resetTime: Date;
  windowStart: Date;
} {
  const now = Date.now();
  const key = `${clientId}:${config.windowMs}:${config.maxRequests}`;
  const clientData = rateLimitStore[key];

  if (!clientData || now - clientData.windowStart > config.windowMs) {
    // No data or expired window
    return {
      limited: false,
      remaining: config.maxRequests - 1,
      resetTime: new Date(now + config.windowMs),
      windowStart: new Date(now)
    };
  }

  const remaining = Math.max(0, config.maxRequests - clientData.requests);
  const resetTime = new Date(clientData.windowStart + config.windowMs);

  return {
    limited: remaining === 0,
    remaining,
    resetTime,
    windowStart: new Date(clientData.windowStart)
  };
}

/**
 * Express-style middleware adapter for Next.js API routes
 */
export function apiRateLimit(configKey: keyof typeof RATE_LIMIT_CONFIGS = 'general') {
  const config = RATE_LIMIT_CONFIGS[configKey];

  return function middleware(req: any, res: any, next: Function) {
    // Convert to NextRequest-like object
    const request = {
      headers: {
        get: (name: string) => req.headers[name.toLowerCase()]
      },
      ip: req.socket?.remoteAddress || req.connection?.remoteAddress
    } as NextRequest;

    const clientId = getClientId(request);

    if (isRateLimited(clientId, config)) {
      const status = getRateLimitStatus(clientId, config);

      res.status(429);
      res.setHeader('Retry-After', Math.ceil(config.windowMs / 1000));
      res.setHeader('X-RateLimit-Limit', config.maxRequests);
      res.setHeader('X-RateLimit-Remaining', status.remaining);
      res.setHeader('X-RateLimit-Reset', status.resetTime.toISOString());

      return res.json({
        error: config.message || 'Rate limit exceeded',
        retryAfter: Math.ceil(config.windowMs / 1000)
      });
    }

    // Add rate limit headers to successful responses
    const status = getRateLimitStatus(clientId, config);
    res.setHeader('X-RateLimit-Limit', config.maxRequests);
    res.setHeader('X-RateLimit-Remaining', status.remaining);
    res.setHeader('X-RateLimit-Reset', status.resetTime.toISOString());

    return next();
  };
}

// Start cleanup interval (run every 10 minutes)
if (typeof window === 'undefined') {
  // Only run on server side
  setInterval(cleanupRateLimitStore, 10 * 60 * 1000);
}

export default {
  withRateLimit,
  createRateLimiter,
  apiRateLimit,
  RATE_LIMIT_CONFIGS,
  isRateLimited,
  getRateLimitStatus,
  cleanupRateLimitStore
};