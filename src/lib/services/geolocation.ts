/**
 * Geolocation Service
 *
 * Handles IP-based geolocation for language detection
 * Uses free geolocation services with fallback options
 */

import { GeolocationData, IPGeolocationResponse, DetectionErrorInfo } from '../types/detection';
import { DEFAULT_DETECTION_CONFIG } from '../types/detection';

/** Geolocation service class */
export class GeolocationService {
  private readonly timeout: number;
  private readonly serviceUrl: string;

  constructor(
    timeout: number = DEFAULT_DETECTION_CONFIG.geolocationTimeout,
    serviceUrl: string = DEFAULT_DETECTION_CONFIG.geolocationServiceUrl || 'https://ipapi.co/json/'
  ) {
    this.timeout = timeout;
    this.serviceUrl = serviceUrl;
  }

  /**
   * Get user's location based on IP address
   */
  async getUserLocation(): Promise<GeolocationData | DetectionErrorInfo> {
    try {
      const response = await this.fetchWithTimeout(this.serviceUrl, this.timeout);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: IPGeolocationResponse = await response.json();

      if (!data.country_code) {
        throw new Error('No country code in geolocation response');
      }

      return this.transformGeolocationData(data);
    } catch (error) {
      return this.handleGeolocationError(error);
    }
  }

  /**
   * Check if geolocation is available and working
   */
  async isGeolocationAvailable(): Promise<boolean> {
    try {
      const result = await this.getUserLocation();
      return 'country' in result; // Success if we got GeolocationData
    } catch {
      return false;
    }
  }

  /**
   * Get cached location if available
   */
  getCachedLocation(): GeolocationData | null {
    if (typeof window === 'undefined') return null;

    try {
      const cached = localStorage.getItem('timetracker-geolocation-cache');
      if (!cached) return null;

      const { data, expires } = JSON.parse(cached);

      if (Date.now() > expires) {
        localStorage.removeItem('timetracker-geolocation-cache');
        return null;
      }

      return data as GeolocationData;
    } catch {
      return null;
    }
  }

  /**
   * Cache location data for future use
   */
  cacheLocation(data: GeolocationData, ttl: number = 60 * 60 * 1000): void {
    if (typeof window === 'undefined') return;

    try {
      const cacheEntry = {
        data,
        expires: Date.now() + ttl
      };

      localStorage.setItem('timetracker-geolocation-cache', JSON.stringify(cacheEntry));
    } catch (error) {
      console.warn('Failed to cache geolocation data:', error);
    }
  }

  /**
   * Transform external API response to our GeolocationData format
   */
  private transformGeolocationData(response: IPGeolocationResponse): GeolocationData {
    const data: GeolocationData = {
      country: response.country_code.toUpperCase(),
      accuracy: 'country'
    };

    // Add region if available
    if (response.region) {
      data.region = response.region;
      data.accuracy = 'region';
    }

    // Add city if available
    if (response.city) {
      data.city = response.city;
      data.accuracy = 'city';
    }

    // Anonymize IP for privacy (show only first 3 octets)
    if (typeof window !== 'undefined') {
      // In browser, we can't get real IP, so we'll use a placeholder
      data.ipAddress = 'xxx.xxx.xxx.xxx';
    }

    return data;
  }

  /**
   * Handle geolocation errors and return appropriate error info
   */
  private handleGeolocationError(error: any): DetectionErrorInfo {
    const baseError: DetectionErrorInfo = {
      error: 'geolocation_failed',
      message: 'Failed to get user location',
      method: 'geolocation',
      timestamp: new Date().toISOString(),
      retryable: true
    };

    if (error.name === 'AbortError' || error.message?.includes('timeout')) {
      return {
        ...baseError,
        error: 'geolocation_timeout',
        message: `Geolocation request timed out after ${this.timeout}ms`,
        retryable: true
      };
    }

    if (error.message?.includes('HTTP')) {
      return {
        ...baseError,
        error: 'network_error',
        message: `Network error: ${error.message}`,
        retryable: true
      };
    }

    if (error.message?.includes('country_code')) {
      return {
        ...baseError,
        error: 'invalid_response',
        message: 'Invalid response from geolocation service',
        retryable: false
      };
    }

    return {
      ...baseError,
      message: error.message || 'Unknown geolocation error',
      retryable: false
    };
  }

  /**
   * Fetch with timeout support
   */
  private async fetchWithTimeout(url: string, timeout: number): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'TimeTracker-App/1.0'
        }
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }
}

/** Default geolocation service instance */
export const geolocationService = new GeolocationService();

/** Alternative geolocation services for fallback */
const FALLBACK_SERVICES = [
  'https://ipapi.co/json/',
  'https://ipinfo.io/json',
  'https://ip-api.com/json'
];

/**
 * Get user location with fallback to multiple services
 */
export async function getUserLocationWithFallback(): Promise<GeolocationData | DetectionErrorInfo> {
  // Try cached location first
  const cached = geolocationService.getCachedLocation();
  if (cached) {
    return cached;
  }

  // Try primary service
  let result = await geolocationService.getUserLocation();

  if ('country' in result) {
    geolocationService.cacheLocation(result);
    return result;
  }

  // Try fallback services
  for (const serviceUrl of FALLBACK_SERVICES) {
    if (serviceUrl === DEFAULT_DETECTION_CONFIG.geolocationServiceUrl) {
      continue; // Skip the one we already tried
    }

    try {
      const fallbackService = new GeolocationService(
        DEFAULT_DETECTION_CONFIG.geolocationTimeout,
        serviceUrl
      );

      result = await fallbackService.getUserLocation();

      if ('country' in result) {
        geolocationService.cacheLocation(result);
        return result;
      }
    } catch (error) {
      console.warn(`Fallback geolocation service ${serviceUrl} failed:`, error);
      continue;
    }
  }

  // All services failed
  return result as DetectionErrorInfo;
}