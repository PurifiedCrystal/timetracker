/**
 * Translation Management API
 *
 * Handles translation file retrieval and management
 */

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

interface TranslationResponse {
  language: string;
  namespaces: Record<string, any>;
  metadata: {
    version: string;
    lastUpdated: string;
    completeness: {
      total: number;
      translated: number;
      missing: number;
      percentage: number;
    };
    generationMethod: 'manual' | 'automated' | 'hybrid';
    quality?: {
      score: number;
      reviewed: boolean;
    };
  };
}

// Supported languages and namespaces
const SUPPORTED_LANGUAGES = ['en', 'es', 'fr', 'de', 'it'];
const AVAILABLE_NAMESPACES = ['common', 'dashboard', 'auth', 'settings', 'time', 'export'];

/**
 * GET /api/v1/translations/[language]
 * Retrieve translation files for a specific language
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { language: string } }
) {
  try {
    const { language } = params;
    const { searchParams } = new URL(request.url);
    const namespace = searchParams.get('namespace');
    const version = searchParams.get('version');

    // Validate language
    if (!SUPPORTED_LANGUAGES.includes(language)) {
      return NextResponse.json(
        {
          error: 'unsupported_language',
          message: `Language '${language}' is not supported`,
          supportedLanguages: SUPPORTED_LANGUAGES
        },
        { status: 404 }
      );
    }

    // If specific namespace requested, validate it
    if (namespace && !AVAILABLE_NAMESPACES.includes(namespace)) {
      return NextResponse.json(
        {
          error: 'invalid_namespace',
          message: `Namespace '${namespace}' is not available`,
          availableNamespaces: AVAILABLE_NAMESPACES
        },
        { status: 400 }
      );
    }

    const localesPath = path.join(process.cwd(), 'public', 'locales', language);

    // Check if language directory exists
    if (!fs.existsSync(localesPath)) {
      return NextResponse.json(
        {
          error: 'language_not_found',
          message: `Translation files for language '${language}' not found`,
          supportedLanguages: SUPPORTED_LANGUAGES
        },
        { status: 404 }
      );
    }

    const namespaces: Record<string, any> = {};
    const namespacesToLoad = namespace ? [namespace] : AVAILABLE_NAMESPACES;
    let totalKeys = 0;
    let translatedKeys = 0;

    // Load translation files
    for (const ns of namespacesToLoad) {
      const filePath = path.join(localesPath, `${ns}.json`);

      if (fs.existsSync(filePath)) {
        try {
          const content = fs.readFileSync(filePath, 'utf-8');
          const translations = JSON.parse(content);
          namespaces[ns] = translations;

          // Count keys for completeness calculation
          const keyCount = countKeys(translations);
          totalKeys += keyCount;
          translatedKeys += keyCount; // Assume all loaded keys are translated
        } catch (error) {
          console.error(`Failed to load ${ns} translations for ${language}:`, error);
          // Continue loading other namespaces
        }
      }
    }

    // Calculate completeness (compare with English as baseline)
    let completeness = {
      total: totalKeys,
      translated: translatedKeys,
      missing: 0,
      percentage: totalKeys > 0 ? 1.0 : 0
    };

    // If not English, compare with English for completeness
    if (language !== 'en') {
      try {
        const englishPath = path.join(process.cwd(), 'public', 'locales', 'en');
        let englishTotal = 0;

        for (const ns of namespacesToLoad) {
          const englishFilePath = path.join(englishPath, `${ns}.json`);
          if (fs.existsSync(englishFilePath)) {
            const englishContent = JSON.parse(fs.readFileSync(englishFilePath, 'utf-8'));
            englishTotal += countKeys(englishContent);
          }
        }

        completeness = {
          total: englishTotal,
          translated: translatedKeys,
          missing: Math.max(0, englishTotal - translatedKeys),
          percentage: englishTotal > 0 ? translatedKeys / englishTotal : 0
        };
      } catch (error) {
        console.error('Failed to calculate completeness against English:', error);
      }
    }

    // Determine generation method based on language
    const generationMethod = language === 'en' ? 'manual' : 'automated';

    const response: TranslationResponse = {
      language,
      namespaces,
      metadata: {
        version: version || '1.0.0',
        lastUpdated: new Date().toISOString(),
        completeness,
        generationMethod,
        quality: {
          score: language === 'en' ? 1.0 : 0.75, // Assume automated translations have lower quality
          reviewed: language === 'en'
        }
      }
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        'ETag': `"${language}-${version || '1.0.0'}"`,
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('Translation retrieval error:', error);

    return NextResponse.json(
      {
        error: 'translation_retrieval_failed',
        message: 'Failed to retrieve translation files',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Count total number of translation keys in nested object
 */
function countKeys(obj: any): number {
  let count = 0;

  for (const key in obj) {
    if (typeof obj[key] === 'string') {
      count++;
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      count += countKeys(obj[key]);
    }
  }

  return count;
}

/**
 * POST /api/v1/translations/[language]
 * Generate or update translations for a language
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { language: string } }
) {
  try {
    const { language } = params;

    // Validate language
    if (!SUPPORTED_LANGUAGES.includes(language)) {
      return NextResponse.json(
        {
          error: 'unsupported_language',
          message: `Language '${language}' is not supported`,
          supportedLanguages: SUPPORTED_LANGUAGES
        },
        { status: 400 }
      );
    }

    // Don't allow regenerating English (it's the source)
    if (language === 'en') {
      return NextResponse.json(
        {
          error: 'invalid_operation',
          message: 'Cannot generate translations for English (source language)'
        },
        { status: 400 }
      );
    }

    // In a real implementation, this would trigger translation generation
    // For now, return a placeholder response
    return NextResponse.json(
      {
        jobId: `translate-${language}-${Date.now()}`,
        status: 'queued',
        language,
        estimatedCompletion: new Date(Date.now() + 300000).toISOString(), // 5 minutes
        progress: {
          total: 0,
          completed: 0,
          errors: 0
        }
      },
      { status: 202 }
    );

  } catch (error) {
    console.error('Translation generation error:', error);

    return NextResponse.json(
      {
        error: 'translation_generation_failed',
        message: 'Failed to start translation generation',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}