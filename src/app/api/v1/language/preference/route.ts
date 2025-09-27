/**
 * Language Preference API
 *
 * Handles user language preference storage and retrieval
 */

import { NextRequest, NextResponse } from 'next/server';

interface LanguagePreferenceRequest {
  language: string;
  autoDetection?: boolean;
  customSettings?: {
    dateFormat?: string;
    timeFormat?: '12h' | '24h';
    numberFormat?: 'auto' | 'us' | 'eu';
  };
}

interface LanguagePreferenceResponse {
  language: string;
  autoDetection: boolean;
  customSettings?: {
    dateFormat?: string;
    timeFormat?: '12h' | '24h';
    numberFormat?: 'auto' | 'us' | 'eu';
  };
  lastUpdated: string;
  detectionHistory?: Array<{
    detectedLanguage: string;
    detectionMethod: string;
    confidence: number;
    timestamp: string;
  }>;
}

// Supported languages for validation
const SUPPORTED_LANGUAGES = ['en', 'es', 'fr', 'de', 'it'];

/**
 * GET /api/v1/language/preference
 * Retrieve user's language preference
 */
export async function GET(request: NextRequest) {
  try {
    // In a real implementation, this would get the user's stored preference
    // For now, we'll return a default or check localStorage via headers
    const userAgent = request.headers.get('user-agent') || '';

    // Default preference response
    const defaultPreference: LanguagePreferenceResponse = {
      language: 'en',
      autoDetection: true,
      lastUpdated: new Date().toISOString(),
      detectionHistory: []
    };

    return NextResponse.json(defaultPreference, {
      headers: {
        'Cache-Control': 'private, no-cache',
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('Language preference retrieval error:', error);

    return NextResponse.json(
      {
        error: 'preference_retrieval_failed',
        message: 'Failed to retrieve language preference',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/language/preference
 * Save user's language preference
 */
export async function POST(request: NextRequest) {
  try {
    const body: LanguagePreferenceRequest = await request.json();

    // Validate required fields
    if (!body.language) {
      return NextResponse.json(
        {
          error: 'missing_language',
          message: 'Language code is required',
          supportedLanguages: SUPPORTED_LANGUAGES
        },
        { status: 400 }
      );
    }

    // Validate language is supported
    if (!SUPPORTED_LANGUAGES.includes(body.language)) {
      return NextResponse.json(
        {
          error: 'unsupported_language',
          message: `Language '${body.language}' is not supported`,
          supportedLanguages: SUPPORTED_LANGUAGES
        },
        { status: 400 }
      );
    }

    // Validate time format if provided
    if (body.customSettings?.timeFormat && !['12h', '24h'].includes(body.customSettings.timeFormat)) {
      return NextResponse.json(
        {
          error: 'invalid_time_format',
          message: 'Time format must be "12h" or "24h"',
        },
        { status: 400 }
      );
    }

    // Validate number format if provided
    if (body.customSettings?.numberFormat && !['auto', 'us', 'eu'].includes(body.customSettings.numberFormat)) {
      return NextResponse.json(
        {
          error: 'invalid_number_format',
          message: 'Number format must be "auto", "us", or "eu"',
        },
        { status: 400 }
      );
    }

    // Create preference response
    const preference: LanguagePreferenceResponse = {
      language: body.language,
      autoDetection: body.autoDetection ?? true,
      customSettings: body.customSettings,
      lastUpdated: new Date().toISOString(),
      detectionHistory: [] // In real implementation, preserve existing history
    };

    // In a real implementation, this would save to database
    // For now, we'll just return the preference as confirmation

    return NextResponse.json(preference, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'private, no-cache'
      }
    });

  } catch (error) {
    console.error('Language preference save error:', error);

    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        {
          error: 'invalid_json',
          message: 'Request body must be valid JSON'
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: 'preference_save_failed',
        message: 'Failed to save language preference',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}