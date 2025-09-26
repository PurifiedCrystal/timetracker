/**
 * T100: Core Web Vitals monitoring implementation
 * Comprehensive performance monitoring for user experience metrics
 */
import { reportPerformanceMetric } from './monitoring';

// Core Web Vitals thresholds (Google recommendations)
const THRESHOLDS = {
  // Largest Contentful Paint (LCP)
  LCP: {
    good: 2500,    // <= 2.5s
    needs_improvement: 4000  // 2.5s - 4s (poor > 4s)
  },
  // First Input Delay (FID)
  FID: {
    good: 100,     // <= 100ms
    needs_improvement: 300   // 100ms - 300ms (poor > 300ms)
  },
  // Cumulative Layout Shift (CLS)
  CLS: {
    good: 0.1,     // <= 0.1
    needs_improvement: 0.25  // 0.1 - 0.25 (poor > 0.25)
  },
  // First Contentful Paint (FCP)
  FCP: {
    good: 1800,    // <= 1.8s
    needs_improvement: 3000  // 1.8s - 3s (poor > 3s)
  },
  // Time to First Byte (TTFB)
  TTFB: {
    good: 800,     // <= 0.8s
    needs_improvement: 1800  // 0.8s - 1.8s (poor > 1.8s)
  }
};

// Scoring functions
function getScore(value: number, thresholds: { good: number; needs_improvement: number }): 'good' | 'needs-improvement' | 'poor' {
  if (value <= thresholds.good) return 'good';
  if (value <= thresholds.needs_improvement) return 'needs-improvement';
  return 'poor';
}

/**
 * Initialize Core Web Vitals monitoring
 */
export function initializeCoreWebVitals(): void {
  if (typeof window === 'undefined') return;

  console.log('📊 Initializing Core Web Vitals monitoring...');

  // Monitor Largest Contentful Paint (LCP)
  monitorLCP();

  // Monitor First Input Delay (FID)
  monitorFID();

  // Monitor Cumulative Layout Shift (CLS)
  monitorCLS();

  // Monitor First Contentful Paint (FCP)
  monitorFCP();

  // Monitor Time to First Byte (TTFB)
  monitorTTFB();

  // Monitor custom performance metrics
  monitorCustomMetrics();

  // Monitor resource loading performance
  monitorResourcePerformance();

  console.log('✅ Core Web Vitals monitoring initialized');
}

/**
 * Monitor Largest Contentful Paint (LCP)
 */
function monitorLCP(): void {
  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1] as any;

      if (lastEntry) {
        const lcpValue = lastEntry.startTime;
        const score = getScore(lcpValue, THRESHOLDS.LCP);

        reportPerformanceMetric('web-vitals.lcp', lcpValue, 'ms', {
          score,
          element: lastEntry.element?.tagName || 'unknown',
          url: lastEntry.url || window.location.href
        });

        console.log(`📊 LCP: ${lcpValue.toFixed(2)}ms (${score})`);
      }
    });

    observer.observe({ type: 'largest-contentful-paint', buffered: true });
  } catch (error) {
    console.warn('LCP monitoring not supported in this browser');
  }
}

/**
 * Monitor First Input Delay (FID)
 */
function monitorFID(): void {
  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();

      for (const entry of entries) {
        const fidValue = (entry as any).processingStart - entry.startTime;
        const score = getScore(fidValue, THRESHOLDS.FID);

        reportPerformanceMetric('web-vitals.fid', fidValue, 'ms', {
          score,
          eventType: (entry as any).name,
          target: (entry as any).target?.tagName || 'unknown'
        });

        console.log(`📊 FID: ${fidValue.toFixed(2)}ms (${score})`);
      }
    });

    observer.observe({ type: 'first-input', buffered: true });
  } catch (error) {
    console.warn('FID monitoring not supported in this browser');
  }
}

/**
 * Monitor Cumulative Layout Shift (CLS)
 */
function monitorCLS(): void {
  try {
    let cumulativeScore = 0;
    let sessionValue = 0;
    let sessionEntries: any[] = [];

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        // Only count layout shifts without recent input
        if (!(entry as any).hadRecentInput) {
          const firstSessionEntry = sessionEntries[0];
          const lastSessionEntry = sessionEntries[sessionEntries.length - 1];

          // Check if this entry is part of the same session
          if (sessionValue &&
              entry.startTime - lastSessionEntry.startTime < 1000 &&
              entry.startTime - firstSessionEntry.startTime < 5000) {
            sessionValue += (entry as any).value;
            sessionEntries.push(entry);
          } else {
            sessionValue = (entry as any).value;
            sessionEntries = [entry];
          }

          // Update cumulative score with the worst session value
          if (sessionValue > cumulativeScore) {
            cumulativeScore = sessionValue;

            const score = getScore(cumulativeScore, THRESHOLDS.CLS);

            reportPerformanceMetric('web-vitals.cls', cumulativeScore, 'score', {
              score,
              sessionEntries: sessionEntries.length,
              affectedElements: sessionEntries.map(e => e.sources?.[0]?.node?.tagName).filter(Boolean)
            });

            console.log(`📊 CLS: ${cumulativeScore.toFixed(4)} (${score})`);
          }
        }
      }
    });

    observer.observe({ type: 'layout-shift', buffered: true });
  } catch (error) {
    console.warn('CLS monitoring not supported in this browser');
  }
}

/**
 * Monitor First Contentful Paint (FCP)
 */
function monitorFCP(): void {
  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === 'first-contentful-paint') {
          const fcpValue = entry.startTime;
          const score = getScore(fcpValue, THRESHOLDS.FCP);

          reportPerformanceMetric('web-vitals.fcp', fcpValue, 'ms', {
            score,
            navigationStart: performance.timeOrigin
          });

          console.log(`📊 FCP: ${fcpValue.toFixed(2)}ms (${score})`);
        }
      }
    });

    observer.observe({ type: 'paint', buffered: true });
  } catch (error) {
    console.warn('FCP monitoring not supported in this browser');
  }
}

/**
 * Monitor Time to First Byte (TTFB)
 */
function monitorTTFB(): void {
  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const navEntry = entry as PerformanceNavigationTiming;
        const ttfbValue = navEntry.responseStart - navEntry.requestStart;
        const score = getScore(ttfbValue, THRESHOLDS.TTFB);

        reportPerformanceMetric('web-vitals.ttfb', ttfbValue, 'ms', {
          score,
          connectionType: (navigator as any).connection?.effectiveType || 'unknown',
          navigationType: navEntry.type
        });

        console.log(`📊 TTFB: ${ttfbValue.toFixed(2)}ms (${score})`);
      }
    });

    observer.observe({ type: 'navigation', buffered: true });
  } catch (error) {
    console.warn('TTFB monitoring not supported in this browser');
  }
}

/**
 * Monitor custom performance metrics
 */
function monitorCustomMetrics(): void {
  // Monitor page load complete
  window.addEventListener('load', () => {
    const loadTime = performance.now();
    reportPerformanceMetric('custom.page-load-complete', loadTime, 'ms', {
      url: window.location.href
    });
  });

  // Monitor DOM content loaded
  document.addEventListener('DOMContentLoaded', () => {
    const domLoadTime = performance.now();
    reportPerformanceMetric('custom.dom-content-loaded', domLoadTime, 'ms');
  });

  // Monitor time to interactive (TTI) approximation
  setTimeout(() => {
    const ttiApprox = performance.now();
    reportPerformanceMetric('custom.time-to-interactive-approx', ttiApprox, 'ms');
  }, 0);
}

/**
 * Monitor resource loading performance
 */
function monitorResourcePerformance(): void {
  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const resource = entry as PerformanceResourceTiming;

        // Skip data URLs and very small resources
        if (resource.name.startsWith('data:') || resource.transferSize < 1024) {
          continue;
        }

        const resourceType = getResourceType(resource.name);
        const loadTime = resource.responseEnd - resource.requestStart;

        reportPerformanceMetric(`resource.${resourceType}.load-time`, loadTime, 'ms', {
          url: resource.name,
          size: resource.transferSize,
          cached: resource.transferSize === 0
        });

        // Report slow resources
        if (loadTime > 1000) {
          reportPerformanceMetric('resource.slow-load', loadTime, 'ms', {
            url: resource.name,
            type: resourceType,
            size: resource.transferSize
          });
        }
      }
    });

    observer.observe({ type: 'resource', buffered: true });
  } catch (error) {
    console.warn('Resource performance monitoring not supported in this browser');
  }
}

/**
 * Get resource type from URL
 */
function getResourceType(url: string): string {
  if (url.match(/\.(js|jsx|ts|tsx)$/)) return 'script';
  if (url.match(/\.(css)$/)) return 'stylesheet';
  if (url.match(/\.(png|jpg|jpeg|gif|webp|svg)$/)) return 'image';
  if (url.match(/\.(woff|woff2|ttf|eot)$/)) return 'font';
  if (url.includes('/api/')) return 'api';
  return 'other';
}

/**
 * Monitor user interaction performance
 */
export function monitorUserInteractions(): void {
  if (typeof window === 'undefined') return;

  const interactions = ['click', 'input', 'scroll'];

  interactions.forEach(eventType => {
    document.addEventListener(eventType, (event) => {
      const startTime = performance.now();

      // Monitor interaction responsiveness
      requestAnimationFrame(() => {
        const responseTime = performance.now() - startTime;

        if (responseTime > 16) { // Slower than 60fps
          reportPerformanceMetric('interaction.response-time', responseTime, 'ms', {
            eventType,
            target: (event.target as Element)?.tagName || 'unknown',
            slow: responseTime > 100
          });
        }
      });
    }, { passive: true });
  });
}

/**
 * Monitor memory usage
 */
export function monitorMemoryUsage(): void {
  if (typeof window === 'undefined' || !(performance as any).memory) return;

  const reportMemoryUsage = () => {
    const memory = (performance as any).memory;

    reportPerformanceMetric('memory.used-js-heap', memory.usedJSHeapSize, 'bytes');
    reportPerformanceMetric('memory.total-js-heap', memory.totalJSHeapSize, 'bytes');
    reportPerformanceMetric('memory.js-heap-limit', memory.jsHeapSizeLimit, 'bytes');

    // Calculate memory pressure
    const memoryPressure = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
    reportPerformanceMetric('memory.pressure', memoryPressure * 100, 'percent', {
      warning: memoryPressure > 0.8
    });
  };

  // Report memory usage periodically
  setInterval(reportMemoryUsage, 30000); // Every 30 seconds

  // Report memory usage on page visibility change
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      reportMemoryUsage();
    }
  });
}

/**
 * Generate Web Vitals report
 */
export function generateWebVitalsReport(): Promise<any> {
  return new Promise((resolve) => {
    // Collect current metrics
    const report = {
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      connection: (navigator as any).connection?.effectiveType || 'unknown',
      metrics: {}
    };

    // This would aggregate the metrics from the monitoring system
    // For now, return the basic report structure
    setTimeout(() => {
      resolve(report);
    }, 100);
  });
}

export default {
  initializeCoreWebVitals,
  monitorUserInteractions,
  monitorMemoryUsage,
  generateWebVitalsReport,
  THRESHOLDS
};