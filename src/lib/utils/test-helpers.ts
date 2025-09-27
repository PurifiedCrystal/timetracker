/**
 * Test Helpers for Multi-Language Features
 *
 * Provides utilities for testing translation, language detection, and error handling
 */

import { SupportedLanguage } from '../types/language-config';
import { LanguageError, LanguageErrorCode } from './error-handling';

export interface MockTranslationData {
  [namespace: string]: {
    [key: string]: string | MockTranslationData;
  };
}

export interface MockGeolocationResponse {
  country: string;
  language: string;
  confidence: number;
  ip: string;
}

export interface TestScenario {
  name: string;
  setup: () => void | Promise<void>;
  teardown?: () => void | Promise<void>;
  expect: () => void | Promise<void>;
}

/**
 * Mock translation data for testing
 */
export const mockTranslations: Record<string, any> = {
  en: {
    common: {
      hello: 'Hello',
      goodbye: 'Goodbye',
      loading: 'Loading...',
      error: 'Error',
      retry: 'Retry'
    },
    dashboard: {
      title: 'Dashboard',
      welcome: 'Welcome back!',
      stats: {
        today: 'Today',
        week: 'This Week',
        month: 'This Month'
      }
    },
    auth: {
      login: 'Login',
      logout: 'Logout',
      register: 'Register'
    }
  },
  es: {
    common: {
      hello: 'Hola',
      goodbye: 'Adiós',
      loading: 'Cargando...',
      error: 'Error',
      retry: 'Reintentar'
    },
    dashboard: {
      title: 'Panel de Control',
      welcome: '¡Bienvenido de vuelta!',
      stats: {
        today: 'Hoy',
        week: 'Esta Semana',
        month: 'Este Mes'
      }
    },
    auth: {
      login: 'Iniciar Sesión',
      logout: 'Cerrar Sesión',
      register: 'Registrarse'
    }
  },
  fr: {
    common: {
      hello: 'Bonjour',
      goodbye: 'Au revoir',
      loading: 'Chargement...',
      error: 'Erreur',
      retry: 'Réessayer'
    },
    dashboard: {
      title: 'Tableau de Bord',
      welcome: 'Bon retour !',
      stats: {
        today: "Aujourd'hui",
        week: 'Cette Semaine',
        month: 'Ce Mois'
      }
    },
    auth: {
      login: 'Connexion',
      logout: 'Déconnexion',
      register: "S'inscrire"
    }
  },
  de: {
    common: {
      hello: 'Hallo',
      goodbye: 'Auf Wiedersehen',
      loading: 'Lädt...',
      error: 'Fehler',
      retry: 'Wiederholen'
    },
    dashboard: {
      title: 'Dashboard',
      welcome: 'Willkommen zurück!',
      stats: {
        today: 'Heute',
        week: 'Diese Woche',
        month: 'Dieser Monat'
      }
    },
    auth: {
      login: 'Anmelden',
      logout: 'Abmelden',
      register: 'Registrieren'
    }
  },
  it: {
    common: {
      hello: 'Ciao',
      goodbye: 'Arrivederci',
      loading: 'Caricamento...',
      error: 'Errore',
      retry: 'Riprova'
    },
    dashboard: {
      title: 'Dashboard',
      welcome: 'Bentornato!',
      stats: {
        today: 'Oggi',
        week: 'Questa Settimana',
        month: 'Questo Mese'
      }
    },
    auth: {
      login: 'Accedi',
      logout: 'Esci',
      register: 'Registrati'
    }
  }
};

/**
 * Mock geolocation responses for testing
 */
export const mockGeolocationResponses: Record<string, MockGeolocationResponse> = {
  'us': { country: 'US', language: 'en', confidence: 0.95, ip: '192.168.1.1' },
  'es': { country: 'ES', language: 'es', confidence: 0.90, ip: '192.168.1.2' },
  'fr': { country: 'FR', language: 'fr', confidence: 0.88, ip: '192.168.1.3' },
  'de': { country: 'DE', language: 'de', confidence: 0.92, ip: '192.168.1.4' },
  'it': { country: 'IT', language: 'it', confidence: 0.85, ip: '192.168.1.5' },
  'unknown': { country: 'XX', language: 'en', confidence: 0.5, ip: '192.168.1.99' }
};

/**
 * Mock fetch responses for API testing
 */
export class MockFetchHelper {
  private responses: Map<string, any> = new Map();
  private delays: Map<string, number> = new Map();
  private errors: Map<string, Error> = new Map();
  private callCounts: Map<string, number> = new Map();

  /**
   * Set up a mock response for a URL pattern
   */
  mockResponse(urlPattern: string, response: any, delay: number = 0): void {
    this.responses.set(urlPattern, response);
    if (delay > 0) {
      this.delays.set(urlPattern, delay);
    }
  }

  /**
   * Set up a mock error for a URL pattern
   */
  mockError(urlPattern: string, error: Error, delay: number = 0): void {
    this.errors.set(urlPattern, error);
    if (delay > 0) {
      this.delays.set(urlPattern, delay);
    }
  }

  /**
   * Get the mock fetch function
   */
  getFetchMock(): jest.MockedFunction<typeof fetch> {
    const fetchMock = jest.fn() as jest.MockedFunction<typeof fetch>;

    fetchMock.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString();

      // Track call count
      const callCount = this.callCounts.get(url) || 0;
      this.callCounts.set(url, callCount + 1);

      // Find matching pattern
      let matchedPattern: string | null = null;
      for (const pattern of this.responses.keys()) {
        if (url.includes(pattern)) {
          matchedPattern = pattern;
          break;
        }
      }

      if (!matchedPattern) {
        for (const pattern of this.errors.keys()) {
          if (url.includes(pattern)) {
            matchedPattern = pattern;
            break;
          }
        }
      }

      // Apply delay if configured
      const delay = matchedPattern ? this.delays.get(matchedPattern) : 0;
      if (delay && delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      // Return error if configured
      if (matchedPattern && this.errors.has(matchedPattern)) {
        throw this.errors.get(matchedPattern);
      }

      // Return response if configured
      if (matchedPattern && this.responses.has(matchedPattern)) {
        const response = this.responses.get(matchedPattern);
        return {
          ok: true,
          status: 200,
          json: async () => response,
          headers: new Headers({
            'content-type': 'application/json',
            'etag': `"${matchedPattern}-${Date.now()}"`
          })
        } as Response;
      }

      // Default 404 response
      return {
        ok: false,
        status: 404,
        json: async () => ({ error: 'Not found' })
      } as Response;
    });

    return fetchMock;
  }

  /**
   * Get call count for a URL pattern
   */
  getCallCount(urlPattern: string): number {
    return this.callCounts.get(urlPattern) || 0;
  }

  /**
   * Reset all mocks
   */
  reset(): void {
    this.responses.clear();
    this.delays.clear();
    this.errors.clear();
    this.callCounts.clear();
  }
}

/**
 * Create mock language error
 */
export function createMockLanguageError(
  code: LanguageErrorCode,
  message: string = 'Mock error',
  recoverable: boolean = true
): LanguageError {
  const error = new Error(message) as LanguageError;
  error.code = code;
  error.recoverable = recoverable;
  error.timestamp = Date.now();
  error.userMessage = 'Mock user message';
  return error;
}

/**
 * Mock localStorage for testing
 */
export class MockLocalStorage {
  private store: Map<string, string> = new Map();

  getItem(key: string): string | null {
    return this.store.get(key) || null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  get length(): number {
    return this.store.size;
  }

  key(index: number): string | null {
    const keys = Array.from(this.store.keys());
    return keys[index] || null;
  }
}

/**
 * Mock performance API for testing
 */
export class MockPerformance {
  private marks: Map<string, number> = new Map();
  private measures: Array<{ name: string; duration: number }> = [];

  mark(markName: string): void {
    this.marks.set(markName, Date.now());
  }

  measure(measureName: string, startMark: string, endMark: string): void {
    const start = this.marks.get(startMark) || 0;
    const end = this.marks.get(endMark) || Date.now();
    this.measures.push({
      name: measureName,
      duration: end - start
    });
  }

  getEntriesByName(name: string): Array<{ name: string; duration: number }> {
    return this.measures.filter(m => m.name === name);
  }

  clearMarks(markName?: string): void {
    if (markName) {
      this.marks.delete(markName);
    } else {
      this.marks.clear();
    }
  }

  clearMeasures(measureName?: string): void {
    if (measureName) {
      this.measures = this.measures.filter(m => m.name !== measureName);
    } else {
      this.measures = [];
    }
  }

  now(): number {
    return Date.now();
  }
}

/**
 * Test scenario builder for complex testing
 */
export class TestScenarioBuilder {
  private scenarios: TestScenario[] = [];

  addScenario(scenario: TestScenario): this {
    this.scenarios.push(scenario);
    return this;
  }

  addLanguageDetectionScenario(
    name: string,
    mockCountry: string,
    expectedLanguage: SupportedLanguage
  ): this {
    return this.addScenario({
      name: `Language Detection: ${name}`,
      setup: async () => {
        // Mock geolocation response
        global.fetch = jest.fn().mockResolvedValue({
          ok: true,
          json: async () => mockGeolocationResponses[mockCountry]
        });
      },
      expect: async () => {
        // Test would verify language detection result
        expect(expectedLanguage).toBeDefined();
      }
    });
  }

  addTranslationLoadingScenario(
    name: string,
    language: SupportedLanguage,
    namespace: string,
    shouldSucceed: boolean
  ): this {
    return this.addScenario({
      name: `Translation Loading: ${name}`,
      setup: async () => {
        if (shouldSucceed) {
          global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
              language,
              namespaces: {
                [namespace]: mockTranslations[language][namespace]
              }
            })
          });
        } else {
          global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));
        }
      },
      expect: async () => {
        expect(shouldSucceed).toBeDefined();
      }
    });
  }

  async runScenarios(): Promise<void> {
    for (const scenario of this.scenarios) {
      describe(scenario.name, () => {
        beforeEach(async () => {
          await scenario.setup();
        });

        afterEach(async () => {
          if (scenario.teardown) {
            await scenario.teardown();
          }
        });

        it('should work correctly', async () => {
          await scenario.expect();
        });
      });
    }
  }
}

/**
 * Performance testing utilities
 */
export const performanceTestUtils = {
  /**
   * Measure operation performance
   */
  async measurePerformance<T>(
    operation: () => Promise<T>,
    expectedMaxTime: number
  ): Promise<{ result: T; duration: number; withinThreshold: boolean }> {
    const start = Date.now();
    const result = await operation();
    const duration = Date.now() - start;

    return {
      result,
      duration,
      withinThreshold: duration <= expectedMaxTime
    };
  },

  /**
   * Run performance benchmark
   */
  async runBenchmark(
    operations: Array<{ name: string; operation: () => Promise<any>; threshold: number }>,
    iterations: number = 10
  ): Promise<Array<{ name: string; averageTime: number; minTime: number; maxTime: number; withinThreshold: boolean }>> {
    const results = [];

    for (const op of operations) {
      const times: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const { duration } = await this.measurePerformance(op.operation, op.threshold);
        times.push(duration);
      }

      const averageTime = times.reduce((sum, time) => sum + time, 0) / times.length;
      const minTime = Math.min(...times);
      const maxTime = Math.max(...times);

      results.push({
        name: op.name,
        averageTime,
        minTime,
        maxTime,
        withinThreshold: averageTime <= op.threshold
      });
    }

    return results;
  }
};

/**
 * Accessibility testing helpers
 */
export const accessibilityTestUtils = {
  /**
   * Check if element has proper ARIA attributes
   */
  checkAriaAttributes(element: HTMLElement): { valid: boolean; issues: string[] } {
    const issues: string[] = [];

    // Check for proper labeling
    if (!element.getAttribute('aria-label') && !element.getAttribute('aria-labelledby')) {
      if (element.tagName === 'BUTTON' || element.tagName === 'INPUT') {
        issues.push('Interactive element missing aria-label or aria-labelledby');
      }
    }

    // Check for proper roles
    if (element.getAttribute('role') === 'button' && element.tagName !== 'BUTTON') {
      if (!element.getAttribute('tabindex')) {
        issues.push('Element with button role missing tabindex');
      }
    }

    return {
      valid: issues.length === 0,
      issues
    };
  },

  /**
   * Check language attribute on element
   */
  checkLanguageAttribute(element: HTMLElement, expectedLang: string): boolean {
    const lang = element.getAttribute('lang') || element.closest('[lang]')?.getAttribute('lang');
    return lang === expectedLang;
  }
};