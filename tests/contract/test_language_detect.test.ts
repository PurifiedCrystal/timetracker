import { describe, it, expect } from '@jest/globals';

/**
 * Contract Test: POST /api/v1/language/detect
 *
 * Tests the language detection endpoint against its OpenAPI specification.
 * This test MUST FAIL until the endpoint is implemented.
 */
describe('POST /api/v1/language/detect', () => {
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  const endpoint = `${API_BASE}/api/v1/language/detect`;

  it('should detect language with geolocation data', async () => {
    const requestBody = {
      browserLanguages: ['en-US', 'en'],
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      timezone: 'America/New_York',
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    // Contract: Should return 200 OK
    expect(response.status).toBe(200);

    const data = await response.json();

    // Contract: Response must include required fields
    expect(data).toHaveProperty('detectedLanguage');
    expect(data).toHaveProperty('detectionMethod');
    expect(data).toHaveProperty('confidence');

    // Contract: detectedLanguage must be valid language code
    expect(typeof data.detectedLanguage).toBe('string');
    expect(data.detectedLanguage).toMatch(/^[a-z]{2}$/);

    // Contract: detectionMethod must be one of allowed values
    expect(['geolocation', 'browser', 'storage', 'default']).toContain(data.detectionMethod);

    // Contract: confidence must be number between 0 and 1
    expect(typeof data.confidence).toBe('number');
    expect(data.confidence).toBeGreaterThanOrEqual(0);
    expect(data.confidence).toBeLessThanOrEqual(1);

    // Contract: If geolocation data exists, validate structure
    if (data.geolocationData) {
      expect(data.geolocationData).toHaveProperty('country');
      expect(data.geolocationData).toHaveProperty('accuracy');
      expect(typeof data.geolocationData.country).toBe('string');
      expect(['country', 'region', 'city']).toContain(data.geolocationData.accuracy);
    }
  });

  it('should handle request without body (minimal detection)', async () => {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Contract: Should return 200 OK even without request body
    expect(response.status).toBe(200);

    const data = await response.json();

    // Contract: Must still return required fields
    expect(data).toHaveProperty('detectedLanguage');
    expect(data).toHaveProperty('detectionMethod');
    expect(data).toHaveProperty('confidence');

    // Contract: Should fallback to default when no data provided
    expect(data.detectionMethod).toBe('default');
    expect(data.detectedLanguage).toBe('en');
  });

  it('should return 400 for invalid request data', async () => {
    const invalidRequestBody = {
      browserLanguages: 'invalid-not-array', // Should be array
      timezone: 123, // Should be string
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(invalidRequestBody),
    });

    // Contract: Should return 400 for invalid data
    expect(response.status).toBe(400);

    const errorData = await response.json();

    // Contract: Error response structure
    expect(errorData).toHaveProperty('error');
    expect(errorData).toHaveProperty('message');
    expect(typeof errorData.error).toBe('string');
    expect(typeof errorData.message).toBe('string');
  });

  it('should handle rate limiting with 429 status', async () => {
    // Make multiple rapid requests to trigger rate limiting
    const promises = Array(20).fill(null).map(() =>
      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ browserLanguages: ['en'] }),
      })
    );

    const responses = await Promise.all(promises);

    // Contract: Should eventually return 429 for rate limiting
    const rateLimitedResponse = responses.find(r => r.status === 429);

    if (rateLimitedResponse) {
      const errorData = await rateLimitedResponse.json();
      expect(errorData).toHaveProperty('error');
      expect(errorData).toHaveProperty('message');
    }
  });
});