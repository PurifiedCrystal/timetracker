# Technical Research: Multi-Language Support with Automatic Translation

**Feature**: Multi-Language Support with Automatic Translation
**Branch**: `008-i-also-want`
**Date**: 2025-09-26
**Status**: Research Complete

## Overview

Research findings for implementing internationalization (i18n) and automatic translation in the Next.js time tracking application. This document resolves technical implementation approaches for language detection, translation file management, and user experience optimization.

## 1. IP Geolocation for Language Detection

### Decision
Use free IP geolocation service with fallback to browser language detection (navigator.language).

### Rationale
- Geographic location provides better cultural context than browser settings alone
- Many users don't configure browser language settings properly
- IP-based detection works without requiring user permissions
- Free services like ipapi.co or ipgeolocation.io provide sufficient accuracy for country-level detection

### Alternatives Considered
- **Browser language only**: Rejected due to poor user configuration and English-bias in many regions
- **Paid geolocation services**: Rejected due to cost and overkill for basic country detection
- **Manual user selection only**: Rejected due to poor user experience and adoption barriers

### Implementation Approach
```typescript
// Language detection priority:
// 1. User manual override (localStorage)
// 2. IP geolocation → country → default language mapping
// 3. Browser navigator.language fallback
// 4. Default to English

const COUNTRY_LANGUAGE_MAP = {
  'ES': 'es', // Spain → Spanish
  'FR': 'fr', // France → French
  'DE': 'de', // Germany → German
  'IT': 'it', // Italy → Italian
  // Add neighboring countries for broader coverage
  'MX': 'es', 'AR': 'es', 'CO': 'es', // Spanish-speaking countries
  'CH': 'de', 'AT': 'de', // German-speaking countries
};
```

## 2. LibreTranslate Integration

### Decision
Use LibreTranslate API for initial automated translation generation with local file caching.

### Rationale
- Open source and free to use (self-hosted or public instance)
- Supports all target languages (Spanish, French, German, Italian)
- No API key requirements for public instances
- Reasonable quality for UI text (short strings)
- Aligns with cost-conscious approach

### Alternatives Considered
- **Google Translate API**: Rejected due to cost ($20/1M chars) and API key management
- **Microsoft Translator**: Rejected due to similar cost structure
- **Amazon Translate**: Rejected due to AWS complexity for simple use case

### Implementation Strategy
```typescript
// Translation generation workflow:
// 1. Extract all UI strings to base English JSON
// 2. Batch translate via LibreTranslate API
// 3. Generate language-specific JSON files
// 4. Manual review and correction opportunities (future phase)

const translateBatch = async (texts: string[], targetLang: string) => {
  const response = await fetch('https://libretranslate.com/translate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      q: texts,
      source: 'en',
      target: targetLang,
      format: 'text'
    })
  });
  return response.json();
};
```

## 3. Translation File Structure and Management

### Decision
Implement hierarchical JSON structure with namespace organization for scalability.

### Rationale
- Hierarchical structure prevents key collisions and improves organization
- Namespace approach allows for component-specific translations
- JSON format is developer-friendly and easily editable by freelancers
- Supports lazy loading of translation chunks for performance

### Alternatives Considered
- **Flat key structure**: Rejected due to key collision risks and poor organization
- **YAML format**: Rejected due to parsing complexity and error-prone indentation
- **Database storage**: Rejected due to deployment complexity and caching overhead

### File Organization
```
public/locales/
├── en/
│   ├── common.json      # Shared UI elements
│   ├── dashboard.json   # Dashboard-specific
│   ├── auth.json        # Authentication
│   └── settings.json    # Settings page
├── es/
│   ├── common.json
│   ├── dashboard.json
│   ├── auth.json
│   └── settings.json
├── fr/ [same structure]
├── de/ [same structure]
└── it/ [same structure]

Example structure (common.json):
{
  "buttons": {
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete"
  },
  "navigation": {
    "dashboard": "Dashboard",
    "settings": "Settings",
    "logout": "Log Out"
  },
  "time": {
    "clockIn": "Clock In",
    "clockOut": "Clock Out",
    "duration": "Duration"
  }
}
```

## 4. React Internationalization Library

### Decision
Use React-i18next for translation management with dynamic loading capabilities.

### Rationale
- Industry standard for React applications
- Supports namespace organization and lazy loading
- Built-in pluralization and interpolation
- TypeScript support for type-safe translations
- Extensive documentation and community support

### Alternatives Considered
- **react-intl (FormatJS)**: Rejected due to ICU message format complexity for simple use case
- **Custom solution**: Rejected due to reinventing well-tested functionality
- **next-i18next**: Considered but react-i18next provides more flexibility for our SPA approach

### Configuration Approach
```typescript
// i18n.ts configuration
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-http-backend';

i18n
  .use(Backend) // Load translations via HTTP
  .use(initReactI18next)
  .init({
    lng: 'en', // Default language
    fallbackLng: 'en',
    ns: ['common', 'dashboard', 'auth', 'settings'],
    defaultNS: 'common',
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json'
    },
    interpolation: {
      escapeValue: false // React already escapes
    }
  });
```

## 5. Date, Time, and Number Localization

### Decision
Use JavaScript Intl API for formatting with locale-specific rules.

### Rationale
- Built into modern browsers, no additional dependencies
- Comprehensive support for dates, times, numbers, and currencies
- Automatically handles regional variations (date formats, decimal separators)
- Consistent with web standards and future-proof

### Alternatives Considered
- **date-fns with locale**: Rejected due to bundle size for date-only formatting
- **moment.js**: Rejected due to deprecated status and bundle size
- **Custom formatting**: Rejected due to complexity of regional rules

### Implementation Examples
```typescript
// Locale-aware formatting utilities
const formatters = {
  date: (date: Date, locale: string) =>
    new Intl.DateTimeFormat(locale).format(date),

  time: (date: Date, locale: string) =>
    new Intl.DateTimeFormat(locale, {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date),

  duration: (minutes: number, locale: string) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`; // Can be localized further
  },

  number: (value: number, locale: string) =>
    new Intl.NumberFormat(locale).format(value)
};
```

## 6. Performance Optimization Strategies

### Decision
Implement progressive loading with caching and preemptive translation fetching.

### Rationale
- Critical path optimization keeps initial page load fast
- Background loading improves perceived performance
- Browser caching reduces repeat translation file fetches
- Preemptive loading anticipates user language switches

### Implementation Strategy
```typescript
// Performance optimization approach:
// 1. Load current language immediately (critical path)
// 2. Preload common alternative languages (background)
// 3. Cache in localStorage with expiration
// 4. Lazy load page-specific namespaces

const translationCache = {
  set: (key: string, data: any, ttl = 24 * 60 * 60 * 1000) => {
    localStorage.setItem(key, JSON.stringify({
      data,
      expires: Date.now() + ttl
    }));
  },

  get: (key: string) => {
    const cached = localStorage.getItem(key);
    if (!cached) return null;

    const { data, expires } = JSON.parse(cached);
    if (Date.now() > expires) {
      localStorage.removeItem(key);
      return null;
    }
    return data;
  }
};
```

## 7. Language Switching User Experience

### Decision
Implement instant language switching with state persistence and visual feedback.

### Rationale
- Immediate feedback improves user confidence
- State persistence prevents language reset on page reload
- Visual loading states prevent confusion during transitions
- Graceful fallback maintains usability during failures

### User Experience Flow
```typescript
// Language switching workflow:
// 1. User selects language from dropdown/settings
// 2. Show loading indicator
// 3. Load translation files (from cache or network)
// 4. Update React context and re-render
// 5. Persist choice to localStorage
// 6. Update URL locale parameter (optional)

const switchLanguage = async (newLang: string) => {
  setLoading(true);
  try {
    await i18n.changeLanguage(newLang);
    localStorage.setItem('preferred-language', newLang);
    // Update any date/number formatters
    setCurrentLocale(newLang);
  } catch (error) {
    // Fallback to current language, show error
    console.error('Language switch failed:', error);
  } finally {
    setLoading(false);
  }
};
```

## Implementation Readiness

All technical approaches have been researched and decisions made:

1. ✅ **IP Geolocation**: Free service with browser fallback
2. ✅ **Translation Service**: LibreTranslate for automated generation
3. ✅ **File Structure**: Hierarchical JSON with namespaces
4. ✅ **React Integration**: react-i18next with dynamic loading
5. ✅ **Localization**: JavaScript Intl API for dates/numbers
6. ✅ **Performance**: Progressive loading with caching
7. ✅ **UX**: Instant switching with persistence

## Next Phase

Ready to proceed to Phase 1: Design data model, API contracts, and quickstart documentation based on these research findings.