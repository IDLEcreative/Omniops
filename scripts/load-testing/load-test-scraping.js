/**
 * k6 Load Test: Scraping API Endpoint
 *
 * Simulates realistic scraping requests with concurrent users.
 * Tests scraping API performance and job queue capacity.
 *
 * Usage:
 *   k6 run scripts/load-testing/load-test-scraping.js
 *
 * Requirements:
 *   - k6 installed: https://k6.io/docs/getting-started/installation/
 *   - Dev server running: npm run dev
 *   - Redis running: docker-compose up redis
 *
 * See: docs/04-TESTING/GUIDE_LOAD_TESTING.md
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const scrapeJobsCreated = new Counter('scrape_jobs_created');
const scrapeResponseTime = new Trend('scrape_response_time');
const queueAcceptanceRate = new Rate('queue_acceptance_rate');

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 5 },   // Ramp up to 5 users
    { duration: '1m', target: 10 },   // Ramp up to 10 users
    { duration: '2m', target: 20 },   // Ramp up to 20 users
    { duration: '1m', target: 20 },   // Stay at 20 users
    { duration: '30s', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<5000'],    // 95% under 5s (scraping is slower)
    http_req_failed: ['rate<0.05'],       // Error rate under 5%
    errors: ['rate<0.10'],                // Custom error rate under 10%
    queue_acceptance_rate: ['rate>0.85'], // 85%+ jobs accepted
  },
};

// Base URL
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// Test domains (small sites for testing)
const TEST_DOMAINS = [
  'example.com',
  'example.org',
  'example.net',
];

/**
 * Main test scenario
 */
export default function () {
  // Pick random test domain
  const domain = TEST_DOMAINS[Math.floor(Math.random() * TEST_DOMAINS.length)];
  const testUrl = `https://${domain}`;

  // Prepare scrape request
  const payload = JSON.stringify({
    url: testUrl,
    domain: domain,
    maxDepth: 2,
    maxPages: 10,
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: '30s',
  };

  // Send scrape request
  const startTime = new Date().getTime();
  const response = http.post(`${BASE_URL}/api/scrape`, payload, params);
  const duration = new Date().getTime() - startTime;

  // Record custom metrics
  scrapeResponseTime.add(duration);

  // Check response
  const success = check(response, {
    'status is 200 or 202': (r) => r.status === 200 || r.status === 202,
    'has job ID': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.jobId !== undefined;
      } catch {
        return false;
      }
    },
    'response time < 10s': (r) => r.timings.duration < 10000,
  });

  // Check if job was accepted (not rate limited)
  const accepted = check(response, {
    'job accepted (not rate limited)': (r) => r.status !== 429,
  });

  // Record metrics
  errorRate.add(!success);
  queueAcceptanceRate.add(accepted);

  if (success) {
    scrapeJobsCreated.add(1);

    // Poll for job status (simulate checking progress)
    const body = JSON.parse(response.body);
    if (body.jobId) {
      pollJobStatus(body.jobId);
    }
  }

  // Wait longer between scrape requests (more resource intensive)
  sleep(Math.random() * 5 + 5);
}

/**
 * Poll job status to simulate realistic behavior
 */
function pollJobStatus(jobId) {
  const maxPolls = 3;
  let polls = 0;

  while (polls < maxPolls) {
    sleep(2); // Wait 2s between polls

    const response = http.get(
      `${BASE_URL}/api/scrape/status?jobId=${jobId}`,
      { timeout: '10s' }
    );

    const statusCheck = check(response, {
      'status check successful': (r) => r.status === 200,
      'has status field': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.status !== undefined;
        } catch {
          return false;
        }
      },
    });

    if (!statusCheck) {
      break;
    }

    try {
      const body = JSON.parse(response.body);
      if (body.status === 'completed' || body.status === 'failed') {
        break; // Job finished
      }
    } catch {
      break;
    }

    polls++;
  }
}

/**
 * Setup function - runs once before test
 */
export function setup() {
  console.log('🚀 Starting scraping load test...');
  console.log(`Target: ${BASE_URL}`);
  console.log(`Test domains: ${TEST_DOMAINS.join(', ')}`);
  console.log(`Concurrent users: 20`);
  console.log(`Duration: ~5 minutes`);

  // Verify server is reachable
  const response = http.get(BASE_URL);
  if (response.status !== 200) {
    throw new Error(`Server not reachable at ${BASE_URL}`);
  }

  // Verify Redis is running (scraping needs job queue)
  const redisCheck = http.get(`${BASE_URL}/api/health`);
  if (redisCheck.status !== 200) {
    console.warn('⚠️  Health check failed - Redis may not be running');
  }

  return { startTime: new Date().toISOString() };
}

/**
 * Teardown function - runs once after test
 */
export function teardown(data) {
  console.log('✅ Load test completed');
  console.log(`Started: ${data.startTime}`);
  console.log(`Ended: ${new Date().toISOString()}`);
}

/**
 * Handle summary - custom summary output
 */
export function handleSummary(data) {
  const summary = {
    'Test Summary': {
      'Total Requests': data.metrics.http_reqs.values.count,
      'Failed Requests': data.metrics.http_req_failed.values.count,
      'Request Rate': `${data.metrics.http_reqs.values.rate.toFixed(2)}/s`,
      'Error Rate': `${(data.metrics.errors.values.rate * 100).toFixed(2)}%`,
      'Jobs Created': data.metrics.scrape_jobs_created.values.count,
      'Queue Acceptance': `${(data.metrics.queue_acceptance_rate.values.rate * 100).toFixed(2)}%`,
    },
    'Response Times': {
      'Average': `${data.metrics.http_req_duration.values.avg.toFixed(2)}ms`,
      'P95': `${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms`,
      'P99': `${data.metrics.http_req_duration.values['p(99)'].toFixed(2)}ms`,
      'Max': `${data.metrics.http_req_duration.values.max.toFixed(2)}ms`,
    },
    'Scrape Performance': {
      'Avg Response Time': `${data.metrics.scrape_response_time.values.avg.toFixed(2)}ms`,
      'P95 Response Time': `${data.metrics.scrape_response_time.values['p(95)'].toFixed(2)}ms`,
    },
  };

  console.log('\n' + '='.repeat(60));
  console.log('LOAD TEST RESULTS - SCRAPING API');
  console.log('='.repeat(60) + '\n');

  for (const [section, metrics] of Object.entries(summary)) {
    console.log(`${section}:`);
    for (const [metric, value] of Object.entries(metrics)) {
      console.log(`  ${metric}: ${value}`);
    }
    console.log('');
  }

  // Determine pass/fail
  const passed = data.metrics.errors.values.rate < 0.10 &&
                 data.metrics.http_req_duration.values['p(95)'] < 5000 &&
                 data.metrics.queue_acceptance_rate.values.rate > 0.85;

  if (passed) {
    console.log('✅ PASSED: All thresholds met');
  } else {
    console.log('❌ FAILED: Some thresholds not met');

    if (data.metrics.queue_acceptance_rate.values.rate <= 0.85) {
      console.log('   - Queue acceptance rate too low (rate limiting)');
    }
    if (data.metrics.http_req_duration.values['p(95)'] >= 5000) {
      console.log('   - Response times too high');
    }
  }

  console.log('='.repeat(60) + '\n');

  return {
    'stdout': JSON.stringify(summary, null, 2),
    'load-test-scraping-results.json': JSON.stringify(data, null, 2),
  };
}
