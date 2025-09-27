import { describe, it, expect } from '@jest/globals';

/**
 * Contract Test: POST /api/v1/language/preference
 *
 * Tests the language preference saving endpoint against its OpenAPI specification.
 * This test MUST FAIL until the endpoint is implemented.
 */
describe('POST /api/v1/language/preference', () => {
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  const endpoint = `${API_BASE}/api/v1/language/preference`;

  it('should save language preference with valid data', async () => {
    const requestBody = {
      language: 'es',
      autoDetection: true,
      customSettings: {
        dateFormat: 'dd/MM/yyyy',
        timeFormat: '24h',
        numberFormat: 'eu',
      },
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer valid-token',
      },
      body: JSON.stringify(requestBody),
    });

    // Contract: Should return 200 OK
    expect(response.status).toBe(200);

    const data = await response.json();

    // Contract: Response must include required fields
    expect(data).toHaveProperty('language');
    expect(data).toHaveProperty('autoDetection');
    expect(data).toHaveProperty('lastUpdated');

    // Contract: Returned data should match request
    expect(data.language).toBe(requestBody.language);
    expect(data.autoDetection).toBe(requestBody.autoDetection);

    // Contract: lastUpdated should be recent timestamp
    expect(typeof data.lastUpdated).toBe('string');
    const lastUpdated = new Date(data.lastUpdated);
    const now = new Date();
    const timeDiff = now.getTime() - lastUpdated.getTime();
    expect(timeDiff).toBeLessThan(5000); // Within 5 seconds

    // Contract: Custom settings should be preserved
    if (data.customSettings) {
      expect(data.customSettings.dateFormat).toBe(requestBody.customSettings.dateFormat);
      expect(data.customSettings.timeFormat).toBe(requestBody.customSettings.timeFormat);
      expect(data.customSettings.numberFormat).toBe(requestBody.customSettings.numberFormat);
    }
  });

  it('should save minimal preference (language only)', async () => {
    const requestBody = {
      language: 'fr',
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer valid-token',
      },
      body: JSON.stringify(requestBody),
    });

    // Contract: Should return 200 OK
    expect(response.status).toBe(200);

    const data = await response.json();

    // Contract: Required fields must be present
    expect(data).toHaveProperty('language');
    expect(data).toHaveProperty('autoDetection');
    expect(data).toHaveProperty('lastUpdated');

    // Contract: Language should match request
    expect(data.language).toBe(requestBody.language);

    // Contract: autoDetection should have default value when not provided
    expect(typeof data.autoDetection).toBe('boolean');
  });

  it('should return 400 for invalid language code', async () => {
    const requestBody = {
      language: 'invalid-lang', // Invalid language code
      autoDetection: true,
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer valid-token',
      },
      body: JSON.stringify(requestBody),
    });

    // Contract: Should return 400 for invalid language
    expect(response.status).toBe(400);

    const errorData = await response.json();

    // Contract: Error response structure
    expect(errorData).toHaveProperty('error');
    expect(errorData).toHaveProperty('message');
    expect(typeof errorData.error).toBe('string');
    expect(typeof errorData.message).toBe('string');

    // Contract: Should include supported languages in error
    if (errorData.supportedLanguages) {
      expect(Array.isArray(errorData.supportedLanguages)).toBe(true);
      expect(errorData.supportedLanguages.length).toBeGreaterThan(0);
    }
  });

  it('should return 400 for missing required fields', async () => {
    const requestBody = {
      // Missing required 'language' field
      autoDetection: true,
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer valid-token',
      },
      body: JSON.stringify(requestBody),
    });

    // Contract: Should return 400 for missing required field
    expect(response.status).toBe(400);

    const errorData = await response.json();
    expect(errorData).toHaveProperty('error');
    expect(errorData).toHaveProperty('message');
  });

  it('should return 400 for invalid custom settings', async () => {
    const requestBody = {
      language: 'de',
      autoDetection: false,
      customSettings: {
        timeFormat: 'invalid', // Should be '12h' or '24h'
        numberFormat: 'bad-format', // Should be 'auto', 'us', or 'eu'
      },
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer valid-token',
      },
      body: JSON.stringify(requestBody),
    });

    // Contract: Should return 400 for invalid custom settings
    expect(response.status).toBe(400);

    const errorData = await response.json();
    expect(errorData).toHaveProperty('error');
    expect(errorData).toHaveProperty('message');
  });

  it('should require authentication', async () => {
    const requestBody = {
      language: 'it',
      autoDetection: true,
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // No authorization header
      },
      body: JSON.stringify(requestBody),
    });

    // Contract: Should require authentication
    expect([401, 403]).toContain(response.status);

    if (response.status === 401 || response.status === 403) {
      const errorData = await response.json();
      expect(errorData).toHaveProperty('error');
      expect(errorData).toHaveProperty('message');
    }
  });
});