/**
 * Language Detection API Endpoint
 *
 * POST /api/v1/language/detect
 * Analyzes user context to determine optimal language preference
 */

import { NextRequest, NextResponse } from 'next/server';
import { LanguageDetectionService } from '@/lib/services/language-detection';
import {
  LanguageDetectionRequest,
  extractBrowserLanguageData
} from '@/lib/types/detection';
import { DEFAULT_LANGUAGE_CONFIG } from '@/lib/types/language-config';

// Rate limiting (simple in-memory store)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 20;

function getRateLimitKey(request: NextRequest): string {
  // Use IP address for rate limiting
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : request.ip || 'unknown';
  return `language-detect:${ip}`;
}

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const limit = rateLimitMap.get(key);

  if (!limit || now > limit.resetTime) {
    // Reset or initialize
    rateLimitMap.set(key, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW
    });
    return true;
  }

  if (limit.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false; // Rate limit exceeded
  }

  limit.count += 1;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting check
    const rateLimitKey = getRateLimitKey(request);
    if (!checkRateLimit(rateLimitKey)) {
      return NextResponse.json(
        {
          error: 'rate_limit_exceeded',
          message: 'Too many requests. Please try again later.',
        },
        { status: 429 }
      );
    }

    // Parse request body (optional)
    let requestData: LanguageDetectionRequest = {};

    try {
      const body = await request.text();
      if (body.trim()) {
        requestData = JSON.parse(body);
      }
    } catch (error) {
      // Ignore JSON parsing errors for optional request body
    }

    // Validate request data if provided
    if (requestData.browserLanguages && !Array.isArray(requestData.browserLanguages)) {
      return NextResponse.json(
        {
          error: 'invalid_request',
          message: 'browserLanguages must be an array of strings',
        },
        { status: 400 }
      );
    }

    if (requestData.timezone && typeof requestData.timezone !== 'string') {
      return NextResponse.json(
        {
          error: 'invalid_request',
          message: 'timezone must be a string',
        },
        { status: 400 }
      );
    }

    // Create detection service
    const detectionService = new LanguageDetectionService();

    // Perform language detection
    const detectionResult = await detectionService.detectLanguage();

    // Enhance with request data if provided
    if (requestData.browserLanguages) {
      detectionResult.browserLanguages = requestData.browserLanguages;
    }

    // Return detection result
    return NextResponse.json({
      detectedLanguage: detectionResult.detectedLanguage,
      detectionMethod: detectionResult.detectionMethod,
      confidence: detectionResult.confidence,
      geolocationData: detectionResult.geolocationData,
      browserLanguages: detectionResult.browserLanguages,
      fallbackReason: detectionResult.fallbackReason,
      supportedLanguages: DEFAULT_LANGUAGE_CONFIG.supportedLanguages.map(lang => ({
        code: lang.code,
        name: lang.name,
        englishName: lang.englishName,
        flag: lang.flag
      }))
    });

  } catch (error) {
    console.error('Language detection error:', error);

    // Return fallback detection result
    const browserData = extractBrowserLanguageData();

    return NextResponse.json({
      detectedLanguage: DEFAULT_LANGUAGE_CONFIG.defaultLanguage,
      detectionMethod: 'default',
      confidence: 0.5,
      browserLanguages: browserData.all,
      fallbackReason: 'Detection service error',
      supportedLanguages: DEFAULT_LANGUAGE_CONFIG.supportedLanguages.map(lang => ({
        code: lang.code,
        name: lang.name,
        englishName: lang.englishName,
        flag: lang.flag
      }))
    });
  }
}

// OPTIONS handler for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}