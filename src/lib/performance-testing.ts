/**
 * T102: Performance testing with 1000+ concurrent users
 * Load testing and stress testing utilities
 */
import { reportPerformanceMetric } from './monitoring';

interface LoadTestConfig {
  baseUrl: string;
  concurrent: number;
  duration: number; // seconds
  rampUpTime: number; // seconds
  scenarios: LoadTestScenario[];
}

interface LoadTestScenario {
  name: string;
  weight: number; // percentage of users
  endpoints: EndpointTest[];
}

interface EndpointTest {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  headers?: Record<string, string>;
  body?: any;
  expectedStatus?: number[];
  timeout?: number;
}

interface LoadTestResult {
  timestamp: string;
  config: LoadTestConfig;
  duration: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  requestsPerSecond: number;
  errorRate: number;
  scenarios: ScenarioResult[];
  errors: ErrorSummary[];
}

interface ScenarioResult {
  name: string;
  requests: number;
  averageTime: number;
  successRate: number;
  errors: string[];
}

interface ErrorSummary {
  error: string;
  count: number;
  percentage: number;
}

/**
 * Main performance testing function
 */
export async function performLoadTest(config: LoadTestConfig): Promise<LoadTestResult> {
  console.log(`🚀 Starting load test with ${config.concurrent} concurrent users for ${config.duration}s`);

  const startTime = Date.now();
  const results: LoadTestResult = {
    timestamp: new Date().toISOString(),
    config,
    duration: 0,
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageResponseTime: 0,
    minResponseTime: Infinity,
    maxResponseTime: 0,
    requestsPerSecond: 0,
    errorRate: 0,
    scenarios: [],
    errors: []
  };

  const allRequestResults: RequestResult[] = [];
  const workers: Promise<RequestResult[]>[] = [];

  // Create worker promises for concurrent users
  for (let i = 0; i < config.concurrent; i++) {
    const worker = createUserWorker(i, config, startTime);
    workers.push(worker);
  }

  // Wait for all workers to complete
  try {
    const workerResults = await Promise.all(workers);
    workerResults.forEach(results => {
      allRequestResults.push(...results);
    });
  } catch (error) {
    console.error('Load test failed:', error);
  }

  // Calculate results
  calculateResults(allRequestResults, results);

  const totalDuration = (Date.now() - startTime) / 1000;
  results.duration = totalDuration;

  console.log(`🏁 Load test completed in ${totalDuration.toFixed(2)}s`);
  console.log(`📊 ${results.totalRequests} requests, ${results.successfulRequests} successful (${(results.successRate * 100).toFixed(1)}%)`);
  console.log(`⏱️ Average response time: ${results.averageResponseTime.toFixed(2)}ms`);
  console.log(`🔥 Requests per second: ${results.requestsPerSecond.toFixed(2)}`);

  return results;
}

interface RequestResult {
  scenario: string;
  endpoint: string;
  method: string;
  status: number;
  responseTime: number;
  success: boolean;
  error?: string;
  timestamp: number;
}

/**
 * Create a user worker that simulates user behavior
 */
async function createUserWorker(workerId: number, config: LoadTestConfig, startTime: number): Promise<RequestResult[]> {
  const results: RequestResult[] = [];
  const endTime = startTime + (config.duration * 1000);
  const rampUpDelay = (config.rampUpTime * 1000 / config.concurrent) * workerId;

  // Wait for ramp-up
  if (rampUpDelay > 0) {
    await new Promise(resolve => setTimeout(resolve, rampUpDelay));
  }

  while (Date.now() < endTime) {
    // Select a scenario based on weight
    const scenario = selectScenario(config.scenarios);

    // Execute scenario
    for (const endpointTest of scenario.endpoints) {
      if (Date.now() >= endTime) break;

      const result = await executeRequest(scenario.name, endpointTest, config.baseUrl);
      results.push(result);

      // Add small delay between requests to simulate real user behavior
      await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));
    }

    // Add think time between scenarios
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
  }

  return results;
}

/**
 * Select scenario based on weight
 */
function selectScenario(scenarios: LoadTestScenario[]): LoadTestScenario {
  const random = Math.random() * 100;
  let cumulative = 0;

  for (const scenario of scenarios) {
    cumulative += scenario.weight;
    if (random <= cumulative) {
      return scenario;
    }
  }

  return scenarios[scenarios.length - 1];
}

/**
 * Execute a single request
 */
async function executeRequest(scenarioName: string, test: EndpointTest, baseUrl: string): Promise<RequestResult> {
  const startTime = Date.now();
  const url = `${baseUrl}${test.path}`;

  try {
    const response = await fetch(url, {
      method: test.method,
      headers: {
        'Content-Type': 'application/json',
        ...test.headers
      },
      body: test.body ? JSON.stringify(test.body) : undefined,
      signal: AbortSignal.timeout(test.timeout || 30000)
    });

    const responseTime = Date.now() - startTime;
    const expectedStatuses = test.expectedStatus || [200, 201, 202, 204];
    const success = expectedStatuses.includes(response.status);

    return {
      scenario: scenarioName,
      endpoint: test.path,
      method: test.method,
      status: response.status,
      responseTime,
      success,
      error: success ? undefined : `Unexpected status: ${response.status}`,
      timestamp: startTime
    };

  } catch (error) {
    const responseTime = Date.now() - startTime;

    return {
      scenario: scenarioName,
      endpoint: test.path,
      method: test.method,
      status: 0,
      responseTime,
      success: false,
      error: error instanceof Error ? error.message : String(error),
      timestamp: startTime
    };
  }
}

/**
 * Calculate test results
 */
function calculateResults(requestResults: RequestResult[], results: LoadTestResult): void {
  results.totalRequests = requestResults.length;
  results.successfulRequests = requestResults.filter(r => r.success).length;
  results.failedRequests = results.totalRequests - results.successfulRequests;

  if (requestResults.length > 0) {
    const responseTimes = requestResults.map(r => r.responseTime);
    results.averageResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    results.minResponseTime = Math.min(...responseTimes);
    results.maxResponseTime = Math.max(...responseTimes);
    results.requestsPerSecond = results.totalRequests / (results.duration || 1);
    results.errorRate = results.failedRequests / results.totalRequests;
  }

  // Calculate scenario results
  const scenarioMap = new Map<string, RequestResult[]>();
  requestResults.forEach(result => {
    if (!scenarioMap.has(result.scenario)) {
      scenarioMap.set(result.scenario, []);
    }
    scenarioMap.get(result.scenario)!.push(result);
  });

  results.scenarios = Array.from(scenarioMap.entries()).map(([name, scenarioResults]) => {
    const successful = scenarioResults.filter(r => r.success).length;
    const avgTime = scenarioResults.reduce((sum, r) => sum + r.responseTime, 0) / scenarioResults.length;
    const errors = scenarioResults.filter(r => !r.success).map(r => r.error || 'Unknown error');

    return {
      name,
      requests: scenarioResults.length,
      averageTime: avgTime,
      successRate: successful / scenarioResults.length,
      errors: [...new Set(errors)]
    };
  });

  // Calculate error summary
  const errorMap = new Map<string, number>();
  requestResults.filter(r => !r.success).forEach(result => {
    const error = result.error || 'Unknown error';
    errorMap.set(error, (errorMap.get(error) || 0) + 1);
  });

  results.errors = Array.from(errorMap.entries()).map(([error, count]) => ({
    error,
    count,
    percentage: (count / results.totalRequests) * 100
  }));
}

/**
 * Predefined load test configurations
 */
export const LOAD_TEST_CONFIGS = {
  // Basic functionality test
  smoke: {
    baseUrl: 'http://localhost:3000',
    concurrent: 10,
    duration: 30,
    rampUpTime: 5,
    scenarios: [
      {
        name: 'Basic User Journey',
        weight: 100,
        endpoints: [
          { method: 'GET' as const, path: '/api/v1/auth/session' },
          { method: 'GET' as const, path: '/api/v1/time-entries' },
          { method: 'GET' as const, path: '/api/v1/user/profile' }
        ]
      }
    ]
  },

  // Normal load test
  load: {
    baseUrl: 'http://localhost:3000',
    concurrent: 100,
    duration: 300, // 5 minutes
    rampUpTime: 60,
    scenarios: [
      {
        name: 'Time Tracking',
        weight: 60,
        endpoints: [
          { method: 'POST' as const, path: '/api/v1/time-entries', body: { metadata: { test: true } } },
          { method: 'GET' as const, path: '/api/v1/time-entries/active' },
          { method: 'PATCH' as const, path: '/api/v1/time-entries/1', body: { clock_out: new Date().toISOString() } }
        ]
      },
      {
        name: 'Profile Management',
        weight: 30,
        endpoints: [
          { method: 'GET' as const, path: '/api/v1/user/profile' },
          { method: 'PATCH' as const, path: '/api/v1/user/profile', body: { full_name: 'Test User' } }
        ]
      },
      {
        name: 'Export Generation',
        weight: 10,
        endpoints: [
          { method: 'POST' as const, path: '/api/v1/exports/generate', body: { format: 'csv', period: 'week' } }
        ]
      }
    ]
  },

  // Stress test with high load
  stress: {
    baseUrl: 'http://localhost:3000',
    concurrent: 500,
    duration: 600, // 10 minutes
    rampUpTime: 120,
    scenarios: [
      {
        name: 'Heavy Time Tracking',
        weight: 70,
        endpoints: [
          { method: 'POST' as const, path: '/api/v1/time-entries', body: { metadata: { stress: true } } },
          { method: 'GET' as const, path: '/api/v1/time-entries' },
          { method: 'GET' as const, path: '/api/v1/time-entries/active' }
        ]
      },
      {
        name: 'Concurrent Profile Access',
        weight: 20,
        endpoints: [
          { method: 'GET' as const, path: '/api/v1/user/profile' },
          { method: 'GET' as const, path: '/api/v1/auth/session' }
        ]
      },
      {
        name: 'Heavy Export Load',
        weight: 10,
        endpoints: [
          { method: 'POST' as const, path: '/api/v1/exports/generate', body: { format: 'pdf', period: 'month' } }
        ]
      }
    ]
  },

  // Spike test
  spike: {
    baseUrl: 'http://localhost:3000',
    concurrent: 1000,
    duration: 180, // 3 minutes
    rampUpTime: 10, // Very quick ramp-up
    scenarios: [
      {
        name: 'Spike Load',
        weight: 100,
        endpoints: [
          { method: 'GET' as const, path: '/api/v1/auth/session' },
          { method: 'GET' as const, path: '/api/v1/time-entries' }
        ]
      }
    ]
  }
};

/**
 * Run comprehensive performance test suite
 */
export async function runPerformanceTestSuite(): Promise<any> {
  console.log('🧪 Starting comprehensive performance test suite...');

  const results = {
    timestamp: new Date().toISOString(),
    tests: []
  };

  // Run each test configuration
  for (const [name, config] of Object.entries(LOAD_TEST_CONFIGS)) {
    console.log(`\n🚀 Running ${name} test...`);

    try {
      const result = await performLoadTest(config);
      results.tests.push({
        name,
        ...result
      });

      // Report metrics to monitoring system
      reportPerformanceMetric(`load-test.${name}.requests-per-second`, result.requestsPerSecond, 'rps');
      reportPerformanceMetric(`load-test.${name}.average-response-time`, result.averageResponseTime, 'ms');
      reportPerformanceMetric(`load-test.${name}.error-rate`, result.errorRate * 100, 'percent');

      // Brief pause between tests
      await new Promise(resolve => setTimeout(resolve, 5000));

    } catch (error) {
      console.error(`❌ ${name} test failed:`, error);
      results.tests.push({
        name,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  console.log('\n✅ Performance test suite completed');
  return results;
}

/**
 * Monitor system resources during load test
 */
export async function monitorSystemResources(): Promise<void> {
  if (typeof window === 'undefined') return;

  const monitoringInterval = setInterval(() => {
    // Monitor memory usage
    if ((performance as any).memory) {
      const memory = (performance as any).memory;
      reportPerformanceMetric('system.memory.used', memory.usedJSHeapSize, 'bytes');
      reportPerformanceMetric('system.memory.total', memory.totalJSHeapSize, 'bytes');
    }

    // Monitor connection quality
    if ((navigator as any).connection) {
      const connection = (navigator as any).connection;
      reportPerformanceMetric('system.connection.downlink', connection.downlink, 'mbps');
      reportPerformanceMetric('system.connection.rtt', connection.rtt, 'ms');
    }

    // Monitor frame rate (approximate)
    let frameCount = 0;
    const startTime = Date.now();

    const countFrames = () => {
      frameCount++;
      if (Date.now() - startTime < 1000) {
        requestAnimationFrame(countFrames);
      } else {
        reportPerformanceMetric('system.frame-rate', frameCount, 'fps');
      }
    };

    requestAnimationFrame(countFrames);
  }, 5000);

  // Stop monitoring after 30 seconds
  setTimeout(() => {
    clearInterval(monitoringInterval);
  }, 30000);
}

export default {
  performLoadTest,
  runPerformanceTestSuite,
  monitorSystemResources,
  LOAD_TEST_CONFIGS
};