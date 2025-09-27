/**
 * Supported Languages API Endpoint
 *
 * GET /api/v1/language/supported
 * Returns list of all supported languages with metadata
 */

import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_LANGUAGE_CONFIG } from '@/lib/types/language-config';

export async function GET(request: NextRequest) {
  try {
    const response = {
      languages: DEFAULT_LANGUAGE_CONFIG.supportedLanguages.map(lang => ({
        code: lang.code,
        name: lang.name,
        englishName: lang.englishName,
        flag: lang.flag,
        direction: lang.direction,
        dateFormat: lang.dateFormat,
        numberFormat: {
          decimal: lang.numberFormat.decimal,
          thousands: lang.numberFormat.thousands
        }
      })),
      defaultLanguage: DEFAULT_LANGUAGE_CONFIG.defaultLanguage,
      countryLanguageMap: DEFAULT_LANGUAGE_CONFIG.countryLanguageMap
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('Error fetching supported languages:', error);

    return NextResponse.json(
      {
        error: 'internal_error',
        message: 'Failed to fetch supported languages'
      },
      { status: 500 }
    );
  }
}

// OPTIONS handler for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}