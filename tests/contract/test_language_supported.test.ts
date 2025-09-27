import { describe, it, expect } from '@jest/globals';

/**
 * Contract Test: GET /api/v1/language/supported
 *
 * Tests the supported languages endpoint against its OpenAPI specification.
 * This test MUST FAIL until the endpoint is implemented.
 */
describe('GET /api/v1/language/supported', () => {
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  const endpoint = `${API_BASE}/api/v1/language/supported`;

  it('should return list of supported languages', async () => {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Contract: Should return 200 OK
    expect(response.status).toBe(200);

    const data = await response.json();

    // Contract: Response must include required fields
    expect(data).toHaveProperty('languages');
    expect(data).toHaveProperty('defaultLanguage');

    // Contract: languages must be array with at least 5 languages
    expect(Array.isArray(data.languages)).toBe(true);
    expect(data.languages.length).toBeGreaterThanOrEqual(5);

    // Contract: Validate each supported language structure
    data.languages.forEach((lang: any) => {
      expect(lang).toHaveProperty('code');
      expect(lang).toHaveProperty('name');
      expect(lang).toHaveProperty('englishName');
      expect(lang).toHaveProperty('direction');

      // Contract: code must be ISO 639-1 format
      expect(typeof lang.code).toBe('string');
      expect(lang.code).toMatch(/^[a-z]{2}$/);

      // Contract: names must be strings
      expect(typeof lang.name).toBe('string');
      expect(typeof lang.englishName).toBe('string');

      // Contract: direction must be ltr or rtl
      expect(['ltr', 'rtl']).toContain(lang.direction);

      // Contract: Optional fields validation
      if (lang.flag) {
        expect(typeof lang.flag).toBe('string');
      }

      if (lang.dateFormat) {
        expect(typeof lang.dateFormat).toBe('string');
      }

      if (lang.numberFormat) {
        expect(lang.numberFormat).toHaveProperty('decimal');
        expect(lang.numberFormat).toHaveProperty('thousands');
        expect(typeof lang.numberFormat.decimal).toBe('string');
        expect(typeof lang.numberFormat.thousands).toBe('string');
      }
    });

    // Contract: defaultLanguage must be valid and in supported list
    expect(typeof data.defaultLanguage).toBe('string');
    expect(data.defaultLanguage).toMatch(/^[a-z]{2}$/);

    const languageCodes = data.languages.map((lang: any) => lang.code);
    expect(languageCodes).toContain(data.defaultLanguage);

    // Contract: Must include expected languages
    expect(languageCodes).toContain('en');
    expect(languageCodes).toContain('es');
    expect(languageCodes).toContain('fr');
    expect(languageCodes).toContain('de');
    expect(languageCodes).toContain('it');

    // Contract: countryLanguageMap is optional but if present, validate
    if (data.countryLanguageMap) {
      expect(typeof data.countryLanguageMap).toBe('object');

      // Validate mapping structure
      Object.entries(data.countryLanguageMap).forEach(([country, language]) => {
        expect(typeof country).toBe('string');
        expect(country).toMatch(/^[A-Z]{2}$/); // ISO country code
        expect(typeof language).toBe('string');
        expect(language).toMatch(/^[a-z]{2}$/); // ISO language code
        expect(languageCodes).toContain(language); // Language must be supported
      });

      // Contract: Should include expected country mappings
      expect(data.countryLanguageMap.ES).toBe('es');
      expect(data.countryLanguageMap.FR).toBe('fr');
      expect(data.countryLanguageMap.DE).toBe('de');
      expect(data.countryLanguageMap.IT).toBe('it');
      expect(['en']).toContain(data.countryLanguageMap.US);
    }
  });

  it('should be accessible without authentication', async () => {
    // This endpoint should be public
    const response = await fetch(endpoint, {
      method: 'GET',
      // No authentication headers
    });

    // Contract: Should not require authentication
    expect(response.status).toBe(200);
  });

  it('should have consistent language data', async () => {
    const response = await fetch(endpoint);
    const data = await response.json();

    // Contract: Each language should have consistent data
    data.languages.forEach((lang: any) => {
      // English language validation
      if (lang.code === 'en') {
        expect(lang.englishName).toBe('English');
        expect(lang.direction).toBe('ltr');
      }

      // Spanish language validation
      if (lang.code === 'es') {
        expect(lang.name).toBe('Español');
        expect(lang.englishName).toBe('Spanish');
        expect(lang.direction).toBe('ltr');
      }

      // French language validation
      if (lang.code === 'fr') {
        expect(lang.name).toBe('Français');
        expect(lang.englishName).toBe('French');
        expect(lang.direction).toBe('ltr');
      }

      // German language validation
      if (lang.code === 'de') {
        expect(lang.name).toBe('Deutsch');
        expect(lang.englishName).toBe('German');
        expect(lang.direction).toBe('ltr');
      }

      // Italian language validation
      if (lang.code === 'it') {
        expect(lang.name).toBe('Italiano');
        expect(lang.englishName).toBe('Italian');
        expect(lang.direction).toBe('ltr');
      }
    });
  });
});