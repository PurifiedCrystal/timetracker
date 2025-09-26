/**
 * API endpoint for performance metrics monitoring
 * Receives performance metrics from the monitoring system
 */
import { NextRequest, NextResponse } from 'next/server';

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: string;
  userId?: string;
  url?: string;
  context?: Record<string, any>;
}

// In-memory storage for development (use time-series database in production)
const performanceMetrics: PerformanceMetric[] = [];
const MAX_STORED_METRICS = 10000;

// Aggregated statistics
const metricAggregations = new Map<string, {
  count: number;
  sum: number;
  min: number;
  max: number;
  avg: number;
  recent: number[];
}>();

export async function POST(request: NextRequest) {
  try {
    const metric: PerformanceMetric = await request.json();

    // Validate required fields
    if (!metric.name || typeof metric.value !== 'number' || !metric.timestamp) {
      return NextResponse.json(
        { error: 'Missing required fields: name, value, timestamp' },
        { status: 400 }
      );
    }

    // Add to storage
    performanceMetrics.unshift(metric);

    // Keep only the most recent metrics
    if (performanceMetrics.length > MAX_STORED_METRICS) {
      performanceMetrics.splice(MAX_STORED_METRICS);
    }

    // Update aggregations
    updateAggregations(metric);

    // Log important metrics
    if (shouldLogMetric(metric)) {
      console.log(`📊 Performance Metric: ${metric.name} = ${metric.value}${metric.unit}`, {
        url: metric.url,
        userId: metric.userId,
        context: metric.context
      });
    }

    return NextResponse.json({ success: true, id: Date.now().toString() });

  } catch (error) {
    console.error('Failed to process performance metric:', error);
    return NextResponse.json(
      { error: 'Failed to process performance metric' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const metricName = searchParams.get('metric');
    const userId = searchParams.get('userId');
    const timeRange = searchParams.get('timeRange') || '1h'; // 1h, 24h, 7d, 30d

    // Calculate time range
    const now = new Date();
    const timeRangeMs = parseTimeRange(timeRange);
    const startTime = new Date(now.getTime() - timeRangeMs);

    let filteredMetrics = performanceMetrics.filter(metric =>
      new Date(metric.timestamp) >= startTime
    );

    // Filter by metric name
    if (metricName) {
      filteredMetrics = filteredMetrics.filter(metric => metric.name === metricName);
    }

    // Filter by user ID
    if (userId) {
      filteredMetrics = filteredMetrics.filter(metric => metric.userId === userId);
    }

    // Limit results
    filteredMetrics = filteredMetrics.slice(0, limit);

    // Generate summary statistics
    const summary = generateMetricsSummary(filteredMetrics, timeRange);

    // Get top metrics by frequency
    const topMetrics = getTopMetrics(10);

    return NextResponse.json({
      metrics: filteredMetrics,
      summary,
      topMetrics,
      aggregations: Object.fromEntries(metricAggregations.entries())
    });

  } catch (error) {
    console.error('Failed to fetch performance metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch performance metrics' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const metricName = searchParams.get('metric');
    const olderThan = searchParams.get('olderThan');

    let removed = 0;

    if (metricName) {
      // Remove metrics by name
      for (let i = performanceMetrics.length - 1; i >= 0; i--) {
        if (performanceMetrics[i].name === metricName) {
          performanceMetrics.splice(i, 1);
          removed++;
        }
      }
    } else if (olderThan) {
      // Remove metrics older than specified date
      const cutoffDate = new Date(olderThan);
      for (let i = performanceMetrics.length - 1; i >= 0; i--) {
        if (new Date(performanceMetrics[i].timestamp) < cutoffDate) {
          performanceMetrics.splice(i, 1);
          removed++;
        }
      }
    } else {
      // Clear all metrics
      removed = performanceMetrics.length;
      performanceMetrics.splice(0);
      metricAggregations.clear();
    }

    return NextResponse.json({
      success: true,
      removed,
      remaining: performanceMetrics.length
    });

  } catch (error) {
    console.error('Failed to delete performance metrics:', error);
    return NextResponse.json(
      { error: 'Failed to delete performance metrics' },
      { status: 500 }
    );
  }
}

/**
 * Update metric aggregations
 */
function updateAggregations(metric: PerformanceMetric): void {
  const key = metric.name;
  const value = metric.value;

  if (!metricAggregations.has(key)) {
    metricAggregations.set(key, {
      count: 0,
      sum: 0,
      min: value,
      max: value,
      avg: 0,
      recent: []
    });
  }

  const agg = metricAggregations.get(key)!;
  agg.count++;
  agg.sum += value;
  agg.min = Math.min(agg.min, value);
  agg.max = Math.max(agg.max, value);
  agg.avg = agg.sum / agg.count;

  // Keep recent values for percentile calculations
  agg.recent.push(value);
  if (agg.recent.length > 1000) {
    agg.recent.shift();
  }
}

/**
 * Check if metric should be logged
 */
function shouldLogMetric(metric: PerformanceMetric): boolean {
  // Log slow operations
  if (metric.name.includes('duration') && metric.value > 1000) {
    return true;
  }

  // Log Core Web Vitals
  if (metric.name.startsWith('web-vitals')) {
    return true;
  }

  // Log critical metrics
  if (metric.name.includes('error') || metric.name.includes('critical')) {
    return true;
  }

  return false;
}

/**
 * Parse time range string to milliseconds
 */
function parseTimeRange(timeRange: string): number {
  const unit = timeRange.slice(-1);
  const value = parseInt(timeRange.slice(0, -1));

  switch (unit) {
    case 'h': return value * 60 * 60 * 1000;
    case 'd': return value * 24 * 60 * 60 * 1000;
    case 'm': return value * 60 * 1000;
    default: return 60 * 60 * 1000; // Default 1 hour
  }
}

/**
 * Generate metrics summary
 */
function generateMetricsSummary(metrics: PerformanceMetric[], timeRange: string) {
  const metricsByName = new Map<string, PerformanceMetric[]>();

  // Group metrics by name
  for (const metric of metrics) {
    if (!metricsByName.has(metric.name)) {
      metricsByName.set(metric.name, []);
    }
    metricsByName.get(metric.name)!.push(metric);
  }

  const summary: Record<string, any> = {
    totalMetrics: metrics.length,
    timeRange,
    uniqueMetrics: metricsByName.size,
    breakdown: {}
  };

  // Calculate statistics for each metric
  for (const [name, metricList] of metricsByName) {
    const values = metricList.map(m => m.value);
    values.sort((a, b) => a - b);

    summary.breakdown[name] = {
      count: values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      p50: values[Math.floor(values.length * 0.5)],
      p95: values[Math.floor(values.length * 0.95)],
      p99: values[Math.floor(values.length * 0.99)],
      unit: metricList[0]?.unit || 'unknown'
    };
  }

  return summary;
}

/**
 * Get top metrics by frequency
 */
function getTopMetrics(limit: number) {
  const metricCounts = new Map<string, number>();

  for (const metric of performanceMetrics) {
    metricCounts.set(metric.name, (metricCounts.get(metric.name) || 0) + 1);
  }

  return Array.from(metricCounts.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([name, count]) => ({ name, count }));
}