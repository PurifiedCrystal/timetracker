/**
 * Performance Metrics API
 *
 * Provides endpoints for monitoring multi-language feature performance
 */

import { NextRequest, NextResponse } from 'next/server';

interface MetricSubmission {
  operation: string;
  value: number;
  metadata?: Record<string, any>;
  timestamp?: number;
}

interface MetricsQuery {
  operation?: string;
  startTime?: number;
  endTime?: number;
  limit?: number;
}

interface PerformanceMetricsResponse {
  metrics: Array<{
    operation: string;
    value: number;
    timestamp: number;
    metadata?: Record<string, any>;
  }>;
  summary: {
    totalMetrics: number;
    operations: string[];
    timeRange: {
      start: number;
      end: number;
    };
    averages: Record<string, number>;
  };
  benchmarks: {
    languageDetection: {
      target: number;
      current: number;
      status: 'pass' | 'warning' | 'critical';
    };
    translationLoading: {
      target: number;
      current: number;
      status: 'pass' | 'warning' | 'critical';
    };
    languageSwitching: {
      target: number;
      current: number;
      status: 'pass' | 'warning' | 'critical';
    };
  };
}

// In-memory storage for demo (replace with proper database in production)
let metricsStore: Array<{
  operation: string;
  value: number;
  timestamp: number;
  metadata?: Record<string, any>;
}> = [];

const BENCHMARKS = {
  languageDetection: { target: 200, warning: 500, critical: 1000 },
  translationLoading: { target: 1000, warning: 2000, critical: 5000 },
  languageSwitching: { target: 100, warning: 300, critical: 1000 }
};

const MAX_METRICS = 10000; // Keep only latest 10k metrics

/**
 * GET /api/v1/performance/metrics
 * Retrieve performance metrics
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const operation = searchParams.get('operation');
    const startTime = searchParams.get('startTime');
    const endTime = searchParams.get('endTime');
    const limit = searchParams.get('limit');

    // Parse query parameters
    const query: MetricsQuery = {};
    if (operation) query.operation = operation;
    if (startTime) query.startTime = parseInt(startTime);
    if (endTime) query.endTime = parseInt(endTime);
    if (limit) query.limit = Math.min(parseInt(limit), 1000); // Max 1000 metrics

    // Filter metrics based on query
    let filteredMetrics = [...metricsStore];

    if (query.operation) {
      filteredMetrics = filteredMetrics.filter(m => m.operation === query.operation);
    }

    if (query.startTime || query.endTime) {
      const start = query.startTime || 0;
      const end = query.endTime || Date.now();
      filteredMetrics = filteredMetrics.filter(m => m.timestamp >= start && m.timestamp <= end);
    }

    // Apply limit
    if (query.limit) {
      filteredMetrics = filteredMetrics.slice(-query.limit);
    }

    // Calculate summary statistics
    const operations = [...new Set(filteredMetrics.map(m => m.operation))];
    const averages: Record<string, number> = {};

    for (const op of operations) {
      const opMetrics = filteredMetrics.filter(m => m.operation === op);
      if (opMetrics.length > 0) {
        averages[op] = opMetrics.reduce((sum, m) => sum + m.value, 0) / opMetrics.length;
      }
    }

    // Evaluate benchmarks
    const benchmarks = {
      languageDetection: {
        target: BENCHMARKS.languageDetection.target,
        current: averages.languageDetection || 0,
        status: evaluateBenchmark('languageDetection', averages.languageDetection || 0)
      },
      translationLoading: {
        target: BENCHMARKS.translationLoading.target,
        current: averages.translationLoading || 0,
        status: evaluateBenchmark('translationLoading', averages.translationLoading || 0)
      },
      languageSwitching: {
        target: BENCHMARKS.languageSwitching.target,
        current: averages.languageSwitching || 0,
        status: evaluateBenchmark('languageSwitching', averages.languageSwitching || 0)
      }
    };

    const response: PerformanceMetricsResponse = {
      metrics: filteredMetrics,
      summary: {
        totalMetrics: filteredMetrics.length,
        operations,
        timeRange: {
          start: filteredMetrics.length > 0 ? Math.min(...filteredMetrics.map(m => m.timestamp)) : 0,
          end: filteredMetrics.length > 0 ? Math.max(...filteredMetrics.map(m => m.timestamp)) : 0
        },
        averages
      },
      benchmarks
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'private, max-age=60', // Cache for 1 minute
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('Performance metrics retrieval error:', error);

    return NextResponse.json(
      {
        error: 'metrics_retrieval_failed',
        message: 'Failed to retrieve performance metrics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/performance/metrics
 * Submit performance metrics
 */
export async function POST(request: NextRequest) {
  try {
    const body: MetricSubmission | MetricSubmission[] = await request.json();
    const submissions = Array.isArray(body) ? body : [body];

    // Validate submissions
    for (const submission of submissions) {
      if (!submission.operation || typeof submission.value !== 'number') {
        return NextResponse.json(
          {
            error: 'invalid_submission',
            message: 'Each metric must have operation (string) and value (number)',
          },
          { status: 400 }
        );
      }

      if (submission.value < 0) {
        return NextResponse.json(
          {
            error: 'invalid_value',
            message: 'Metric value cannot be negative',
          },
          { status: 400 }
        );
      }
    }

    // Store metrics
    const timestamp = Date.now();
    for (const submission of submissions) {
      metricsStore.push({
        operation: submission.operation,
        value: submission.value,
        timestamp: submission.timestamp || timestamp,
        metadata: submission.metadata
      });
    }

    // Cleanup old metrics if store is getting too large
    if (metricsStore.length > MAX_METRICS) {
      metricsStore = metricsStore.slice(-MAX_METRICS);
    }

    return NextResponse.json(
      {
        message: 'Metrics submitted successfully',
        count: submissions.length,
        timestamp
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Performance metrics submission error:', error);

    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        {
          error: 'invalid_json',
          message: 'Request body must be valid JSON'
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: 'metrics_submission_failed',
        message: 'Failed to submit performance metrics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/v1/performance/metrics
 * Clear performance metrics (for testing/maintenance)
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const operation = searchParams.get('operation');
    const olderThan = searchParams.get('olderThan');

    let clearedCount = 0;

    if (operation) {
      // Clear specific operation
      const initialLength = metricsStore.length;
      metricsStore = metricsStore.filter(m => m.operation !== operation);
      clearedCount = initialLength - metricsStore.length;
    } else if (olderThan) {
      // Clear metrics older than specified timestamp
      const cutoff = parseInt(olderThan);
      const initialLength = metricsStore.length;
      metricsStore = metricsStore.filter(m => m.timestamp >= cutoff);
      clearedCount = initialLength - metricsStore.length;
    } else {
      // Clear all metrics
      clearedCount = metricsStore.length;
      metricsStore = [];
    }

    return NextResponse.json({
      message: 'Metrics cleared successfully',
      clearedCount,
      remainingCount: metricsStore.length
    });

  } catch (error) {
    console.error('Performance metrics deletion error:', error);

    return NextResponse.json(
      {
        error: 'metrics_deletion_failed',
        message: 'Failed to clear performance metrics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Helper function to evaluate benchmark status
 */
function evaluateBenchmark(operation: string, value: number): 'pass' | 'warning' | 'critical' {
  const benchmark = BENCHMARKS[operation as keyof typeof BENCHMARKS];
  if (!benchmark) return 'pass';

  if (value > benchmark.critical) return 'critical';
  if (value > benchmark.warning) return 'warning';
  return 'pass';
}