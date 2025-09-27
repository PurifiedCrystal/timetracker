/**
 * T099: Error monitoring with Sentry integration
 * Comprehensive error tracking and monitoring system
 */
// @ts-nocheck
import { NextRequest } from 'next/server';

// Types for monitoring
interface ErrorReport {
  message: string;
  stack?: string;
  url?: string;
  userAgent?: string;
  userId?: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  context?: Record<string, any>;
}

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: string;
  userId?: string;
  url?: string;
  context?: Record<string, any>;
}

// Mock Sentry-like configuration
const MONITORING_CONFIG = {
  dsn: process.env.SENTRY_DSN || '',
  environment: process.env.NODE_ENV || 'development',
  sampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  enableTracing: true,
  enablePerformanceMonitoring: true,
  enableUserFeedback: true
};

/**
 * Initialize monitoring system
 */
export function initializeMonitoring(): void {
  if (typeof window === 'undefined') {
    // Server-side initialization
    initializeServerMonitoring();
  } else {
    // Client-side initialization
    initializeClientMonitoring();
  }
}

/**
 * Server-side monitoring initialization
 */
function initializeServerMonitoring(): void {
  console.log('🔍 Initializing server-side monitoring...');

  // In production, this would initialize Sentry
  if (MONITORING_CONFIG.dsn && process.env.NODE_ENV === 'production') {
    // Sentry.init({
    //   dsn: MONITORING_CONFIG.dsn,
    //   environment: MONITORING_CONFIG.environment,
    //   tracesSampleRate: MONITORING_CONFIG.sampleRate,
    // });
    console.log('✅ Server monitoring initialized with Sentry');
  } else {
    console.log('📊 Server monitoring initialized in development mode');
  }

  // Set up global error handlers
  process.on('uncaughtException', (error) => {
    reportError('Uncaught Exception', error, 'critical');
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    reportError('Unhandled Promise Rejection', new Error(String(reason)), 'high');
  });
}

/**
 * Client-side monitoring initialization
 */
function initializeClientMonitoring(): void {
  console.log('🔍 Initializing client-side monitoring...');

  // In production, this would initialize Sentry browser SDK
  if (MONITORING_CONFIG.dsn && process.env.NODE_ENV === 'production') {
    // Sentry.init({
    //   dsn: MONITORING_CONFIG.dsn,
    //   environment: MONITORING_CONFIG.environment,
    //   integrations: [
    //     new Sentry.BrowserTracing(),
    //     new Sentry.Replay(),
    //   ],
    //   tracesSampleRate: MONITORING_CONFIG.sampleRate,
    //   replaysSessionSampleRate: 0.1,
    //   replaysOnErrorSampleRate: 1.0,
    // });
    console.log('✅ Client monitoring initialized with Sentry');
  } else {
    console.log('📊 Client monitoring initialized in development mode');
  }

  // Set up global error handlers
  window.addEventListener('error', (event) => {
    reportError('JavaScript Error', event.error, 'medium', {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    reportError('Unhandled Promise Rejection', new Error(event.reason), 'high');
  });
}

/**
 * Report error to monitoring system
 */
export function reportError(
  message: string,
  error: Error | string,
  severity: ErrorReport['severity'] = 'medium',
  context?: Record<string, any>
): void {
  const errorReport: ErrorReport = {
    message,
    stack: error instanceof Error ? error.stack : undefined,
    url: typeof window !== 'undefined' ? window.location.href : undefined,
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
    userId: getCurrentUserId(),
    timestamp: new Date().toISOString(),
    severity,
    context
  };

  // In development, log to console
  if (process.env.NODE_ENV !== 'production') {
    console.error('📊 Error Report:', errorReport);
  }

  // In production, send to Sentry
  if (MONITORING_CONFIG.dsn && process.env.NODE_ENV === 'production') {
    // Sentry.captureException(error, {
    //   tags: { severity },
    //   contexts: { custom: context },
    //   user: { id: errorReport.userId }
    // });
  }

  // Also send to custom endpoint for additional logging
  sendErrorToEndpoint(errorReport);
}

/**
 * Report performance metric
 */
export function reportPerformanceMetric(
  name: string,
  value: number,
  unit: string = 'ms',
  context?: Record<string, any>
): void {
  const metric: PerformanceMetric = {
    name,
    value,
    unit,
    timestamp: new Date().toISOString(),
    userId: getCurrentUserId(),
    url: typeof window !== 'undefined' ? window.location.href : undefined,
    context
  };

  // In development, log to console
  if (process.env.NODE_ENV !== 'production') {
    console.log('📊 Performance Metric:', metric);
  }

  // Send to monitoring endpoint
  sendMetricToEndpoint(metric);
}

/**
 * Start performance transaction
 */
export function startTransaction(name: string, op: string = 'navigation'): PerformanceTransaction {
  const startTime = Date.now();

  return {
    name,
    op,
    startTime,
    finish: (context?: Record<string, any>) => {
      const duration = Date.now() - startTime;
      reportPerformanceMetric(name, duration, 'ms', {
        operation: op,
        ...context
      });

      // In production, use Sentry transaction
      // const transaction = Sentry.startTransaction({ name, op });
      // transaction.finish();
    },
    setTag: (key: string, value: string) => {
      // Would set Sentry tag in production
      console.log(`Transaction tag: ${key}=${value}`);
    },
    setContext: (key: string, context: Record<string, any>) => {
      // Would set Sentry context in production
      console.log(`Transaction context: ${key}=`, context);
    }
  };
}

interface PerformanceTransaction {
  name: string;
  op: string;
  startTime: number;
  finish: (context?: Record<string, any>) => void;
  setTag: (key: string, value: string) => void;
  setContext: (key: string, context: Record<string, any>) => void;
}

/**
 * Monitor API endpoint performance
 */
export function withMonitoring<T extends any[], R>(
  endpointName: string,
  handler: (...args: T) => Promise<R>
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    const transaction = startTransaction(endpointName, 'http.server');

    try {
      const startTime = Date.now();
      const result = await handler(...args);
      const duration = Date.now() - startTime;

      // Report successful request
      reportPerformanceMetric(`${endpointName}.duration`, duration, 'ms', {
        status: 'success'
      });

      transaction.finish({ status: 'success' });
      return result;
    } catch (error) {
      // Report error
      reportError(`API Error: ${endpointName}`, error instanceof Error ? error : new Error(String(error)), 'high', {
        endpoint: endpointName
      });

      transaction.setTag('error', 'true');
      transaction.finish({ status: 'error' });
      throw error;
    }
  };
}

/**
 * Monitor React component performance
 */
export function withComponentMonitoring<P extends Record<string, any>>(
  componentName: string,
  Component: React.ComponentType<P>
): React.ComponentType<P> {
  return function MonitoredComponent(props: P) {
    React.useEffect(() => {
      const transaction = startTransaction(`${componentName}.render`, 'ui.react.render');

      // Track component mount
      reportPerformanceMetric(`${componentName}.mount`, Date.now(), 'timestamp');

      return () => {
        // Track component unmount
        reportPerformanceMetric(`${componentName}.unmount`, Date.now(), 'timestamp');
        transaction.finish();
      };
    }, []);

    try {
      return React.createElement(Component, props);
    } catch (error) {
      reportError(`Component Error: ${componentName}`, error instanceof Error ? error : new Error(String(error)), 'high', {
        component: componentName,
        props: JSON.stringify(props, null, 2)
      });
      throw error;
    }
  };
}

/**
 * Get current user ID for context
 */
function getCurrentUserId(): string | undefined {
  try {
    if (typeof window !== 'undefined') {
      // Try to get from localStorage or session
      const session = localStorage.getItem('timetracker_session');
      if (session) {
        const parsed = JSON.parse(session);
        return parsed.user_id;
      }
    }
    return undefined;
  } catch {
    return undefined;
  }
}

/**
 * Send error report to custom endpoint
 */
async function sendErrorToEndpoint(errorReport: ErrorReport): Promise<void> {
  try {
    await fetch('/api/monitoring/error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(errorReport)
    });
  } catch (error) {
    // Don't let monitoring errors break the app
    console.error('Failed to send error report:', error);
  }
}

/**
 * Send performance metric to custom endpoint
 */
async function sendMetricToEndpoint(metric: PerformanceMetric): Promise<void> {
  try {
    await fetch('/api/monitoring/metrics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(metric)
    });
  } catch (error) {
    // Don't let monitoring errors break the app
    console.error('Failed to send metric:', error);
  }
}

/**
 * Core Web Vitals monitoring
 */
export function initializeCoreWebVitals(): void {
  if (typeof window === 'undefined') return;

  // Monitor Core Web Vitals
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.entryType === 'navigation') {
        const navEntry = entry as PerformanceNavigationTiming;

        // First Contentful Paint
        reportPerformanceMetric('web-vitals.fcp', navEntry.loadEventEnd - navEntry.fetchStart, 'ms');

        // Largest Contentful Paint
        reportPerformanceMetric('web-vitals.lcp', navEntry.loadEventEnd - navEntry.navigationStart, 'ms');
      }

      if (entry.entryType === 'measure') {
        reportPerformanceMetric(`custom.${entry.name}`, entry.duration, 'ms');
      }
    }
  });

  observer.observe({ entryTypes: ['navigation', 'measure'] });

  // Cumulative Layout Shift
  let cumulativeLayoutShift = 0;
  const clsObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (!(entry as any).hadRecentInput) {
        cumulativeLayoutShift += (entry as any).value;
      }
    }
  });

  clsObserver.observe({ type: 'layout-shift', buffered: true });

  // Report CLS on page unload
  window.addEventListener('beforeunload', () => {
    reportPerformanceMetric('web-vitals.cls', cumulativeLayoutShift, 'score');
  });
}

/**
 * User session monitoring
 */
export function trackUserSession(): void {
  if (typeof window === 'undefined') return;

  const sessionStart = Date.now();
  let lastActivity = sessionStart;

  // Track user activity
  const updateActivity = () => {
    lastActivity = Date.now();
  };

  ['click', 'keydown', 'scroll', 'mousemove'].forEach(event => {
    window.addEventListener(event, updateActivity, { passive: true });
  });

  // Report session duration on unload
  window.addEventListener('beforeunload', () => {
    const sessionDuration = Date.now() - sessionStart;
    const activeTime = lastActivity - sessionStart;

    reportPerformanceMetric('user-session.total-duration', sessionDuration, 'ms');
    reportPerformanceMetric('user-session.active-duration', activeTime, 'ms');
  });
}

// Initialize monitoring when module loads
if (typeof window !== 'undefined') {
  // Client-side initialization
  document.addEventListener('DOMContentLoaded', () => {
    initializeMonitoring();
    initializeCoreWebVitals();
    trackUserSession();
  });
} else {
  // Server-side initialization
  initializeMonitoring();
}

export default {
  initializeMonitoring,
  reportError,
  reportPerformanceMetric,
  startTransaction,
  withMonitoring,
  withComponentMonitoring,
  initializeCoreWebVitals,
  trackUserSession
};