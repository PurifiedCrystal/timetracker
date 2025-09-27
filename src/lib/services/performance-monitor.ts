/**
 * Performance Monitor Service
 *
 * Monitors and tracks performance metrics for multi-language features
 */

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

interface PerformanceBenchmark {
  target: number;
  warning: number;
  critical: number;
}

interface PerformanceReport {
  metrics: PerformanceMetric[];
  summary: {
    averageDetectionTime: number;
    averageLoadTime: number;
    averageSwitchTime: number;
    cacheHitRate: number;
    errorRate: number;
  };
  benchmarks: {
    detection: 'pass' | 'warning' | 'critical';
    loading: 'pass' | 'warning' | 'critical';
    switching: 'pass' | 'warning' | 'critical';
  };
  timestamp: number;
}

export class PerformanceMonitorService {
  private metrics: PerformanceMetric[] = [];
  private readonly maxMetrics = 1000;
  private readonly benchmarks: Record<string, PerformanceBenchmark> = {
    languageDetection: { target: 200, warning: 500, critical: 1000 },
    translationLoading: { target: 1000, warning: 2000, critical: 5000 },
    languageSwitching: { target: 100, warning: 300, critical: 1000 }
  };

  /**
   * Start timing a performance operation
   */
  startTiming(operation: string): string {
    const id = `${operation}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    if (typeof window !== 'undefined' && 'performance' in window) {
      performance.mark(`${id}_start`);
    }

    return id;
  }

  /**
   * End timing and record metric
   */
  endTiming(
    timingId: string,
    metadata?: Record<string, any>
  ): number {
    const operation = timingId.split('_')[0];
    let duration = 0;

    if (typeof window !== 'undefined' && 'performance' in window) {
      try {
        performance.mark(`${timingId}_end`);
        performance.measure(timingId, `${timingId}_start`, `${timingId}_end`);

        const measure = performance.getEntriesByName(timingId)[0];
        duration = measure.duration;

        // Cleanup performance marks
        performance.clearMarks(`${timingId}_start`);
        performance.clearMarks(`${timingId}_end`);
        performance.clearMeasures(timingId);
      } catch (error) {
        console.warn('Performance measurement failed:', error);
        // Fallback to basic timing
        const startTime = parseInt(timingId.split('_')[1]);
        duration = Date.now() - startTime;
      }
    } else {
      // Fallback for server-side or older browsers
      const startTime = parseInt(timingId.split('_')[1]);
      duration = Date.now() - startTime;
    }

    this.recordMetric(operation, duration, metadata);
    return duration;
  }

  /**
   * Record a performance metric
   */
  recordMetric(
    name: string,
    value: number,
    metadata?: Record<string, any>
  ): void {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      metadata
    };

    this.metrics.push(metric);

    // Keep only the most recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Log warnings for performance issues
    this.checkBenchmarks(name, value, metadata);
  }

  /**
   * Get metrics for a specific operation
   */
  getMetrics(
    operation?: string,
    timeRange?: { start: number; end: number }
  ): PerformanceMetric[] {
    let filtered = this.metrics;

    if (operation) {
      filtered = filtered.filter(m => m.name === operation);
    }

    if (timeRange) {
      filtered = filtered.filter(m =>
        m.timestamp >= timeRange.start && m.timestamp <= timeRange.end
      );
    }

    return filtered;
  }

  /**
   * Generate performance report
   */
  generateReport(timeRange?: { start: number; end: number }): PerformanceReport {
    const metrics = this.getMetrics(undefined, timeRange);

    const detectionMetrics = metrics.filter(m => m.name === 'languageDetection');
    const loadingMetrics = metrics.filter(m => m.name === 'translationLoading');
    const switchingMetrics = metrics.filter(m => m.name === 'languageSwitching');
    const errorMetrics = metrics.filter(m => m.name === 'error');

    const averageDetectionTime = this.calculateAverage(detectionMetrics);
    const averageLoadTime = this.calculateAverage(loadingMetrics);
    const averageSwitchTime = this.calculateAverage(switchingMetrics);

    // Calculate cache hit rate from metadata
    const cacheMetrics = metrics.filter(m => m.metadata?.cacheHit !== undefined);
    const cacheHits = cacheMetrics.filter(m => m.metadata?.cacheHit === true).length;
    const cacheHitRate = cacheMetrics.length > 0 ? cacheHits / cacheMetrics.length : 0;

    // Calculate error rate
    const totalOperations = detectionMetrics.length + loadingMetrics.length + switchingMetrics.length;
    const errorRate = totalOperations > 0 ? errorMetrics.length / totalOperations : 0;

    return {
      metrics,
      summary: {
        averageDetectionTime,
        averageLoadTime,
        averageSwitchTime,
        cacheHitRate,
        errorRate
      },
      benchmarks: {
        detection: this.evaluateBenchmark('languageDetection', averageDetectionTime),
        loading: this.evaluateBenchmark('translationLoading', averageLoadTime),
        switching: this.evaluateBenchmark('languageSwitching', averageSwitchTime)
      },
      timestamp: Date.now()
    };
  }

  /**
   * Monitor language detection performance
   */
  async monitorDetection<T>(
    operation: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    const timingId = this.startTiming('languageDetection');

    try {
      const result = await operation();
      this.endTiming(timingId, { ...metadata, success: true });
      return result;
    } catch (error) {
      this.endTiming(timingId, { ...metadata, success: false, error: error instanceof Error ? error.message : 'Unknown error' });
      this.recordMetric('error', 1, { operation: 'languageDetection', error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }

  /**
   * Monitor translation loading performance
   */
  async monitorLoading<T>(
    operation: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    const timingId = this.startTiming('translationLoading');

    try {
      const result = await operation();
      this.endTiming(timingId, { ...metadata, success: true });
      return result;
    } catch (error) {
      this.endTiming(timingId, { ...metadata, success: false, error: error instanceof Error ? error.message : 'Unknown error' });
      this.recordMetric('error', 1, { operation: 'translationLoading', error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }

  /**
   * Monitor language switching performance
   */
  async monitorSwitching<T>(
    operation: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    const timingId = this.startTiming('languageSwitching');

    try {
      const result = await operation();
      this.endTiming(timingId, { ...metadata, success: true });
      return result;
    } catch (error) {
      this.endTiming(timingId, { ...metadata, success: false, error: error instanceof Error ? error.message : 'Unknown error' });
      this.recordMetric('error', 1, { operation: 'languageSwitching', error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }

  /**
   * Clear old metrics
   */
  cleanup(maxAge: number = 24 * 60 * 60 * 1000): void {
    const cutoff = Date.now() - maxAge;
    this.metrics = this.metrics.filter(m => m.timestamp > cutoff);
  }

  /**
   * Get current performance status
   */
  getStatus(): 'good' | 'degraded' | 'poor' {
    const recentMetrics = this.getMetrics(undefined, {
      start: Date.now() - 5 * 60 * 1000, // Last 5 minutes
      end: Date.now()
    });

    if (recentMetrics.length === 0) return 'good';

    const detectionMetrics = recentMetrics.filter(m => m.name === 'languageDetection');
    const loadingMetrics = recentMetrics.filter(m => m.name === 'translationLoading');
    const switchingMetrics = recentMetrics.filter(m => m.name === 'languageSwitching');

    const avgDetection = this.calculateAverage(detectionMetrics);
    const avgLoading = this.calculateAverage(loadingMetrics);
    const avgSwitching = this.calculateAverage(switchingMetrics);

    const detectionStatus = this.evaluateBenchmark('languageDetection', avgDetection);
    const loadingStatus = this.evaluateBenchmark('translationLoading', avgLoading);
    const switchingStatus = this.evaluateBenchmark('languageSwitching', avgSwitching);

    if (detectionStatus === 'critical' || loadingStatus === 'critical' || switchingStatus === 'critical') {
      return 'poor';
    }

    if (detectionStatus === 'warning' || loadingStatus === 'warning' || switchingStatus === 'warning') {
      return 'degraded';
    }

    return 'good';
  }

  /**
   * Private helper methods
   */
  private calculateAverage(metrics: PerformanceMetric[]): number {
    if (metrics.length === 0) return 0;
    return metrics.reduce((sum, m) => sum + m.value, 0) / metrics.length;
  }

  private evaluateBenchmark(operation: string, value: number): 'pass' | 'warning' | 'critical' {
    const benchmark = this.benchmarks[operation];
    if (!benchmark) return 'pass';

    if (value > benchmark.critical) return 'critical';
    if (value > benchmark.warning) return 'warning';
    return 'pass';
  }

  private checkBenchmarks(name: string, value: number, metadata?: Record<string, any>): void {
    const status = this.evaluateBenchmark(name, value);

    if (status === 'critical') {
      console.error(`Critical performance issue: ${name} took ${value}ms (target: ${this.benchmarks[name]?.target}ms)`, metadata);
    } else if (status === 'warning') {
      console.warn(`Performance warning: ${name} took ${value}ms (target: ${this.benchmarks[name]?.target}ms)`, metadata);
    }
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitorService();