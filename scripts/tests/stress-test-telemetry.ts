/**
 * Stress Test for Telemetry System
 *
 * Tests the telemetry system under high load with concurrent inserts and API requests.
 *
 * Usage: npx tsx scripts/tests/stress-test-telemetry.ts
 */

import { createServiceRoleClientSync } from '@/lib/supabase-server';

interface PerformanceMetrics {
  totalRecords: number;
  totalDuration: number;
  recordsPerSecond: number;
  batchSize: number;
  errors: number;
  apiMetrics?: {
    totalRequests: number;
    avgResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
    errorRate: number;
  };
}

interface TestFailure {
  query: string;
  query_type: 'sku' | 'product_name' | 'order_id' | 'unknown';
  error_type: 'not_found' | 'api_error' | 'timeout' | 'invalid_input';
  platform: string;
  suggestions?: string[];
}

function generateQuickSKU(): string {
  const prefix = ['BP', 'HP', 'ZF', 'RX'][Math.floor(Math.random() * 4)];
  const number = Math.floor(Math.random() * 9000) + 1000;
  return `${prefix}-${number}`;
}

function generateQuickProductName(): string {
  const products = ['Pump', 'Motor', 'Valve', 'Filter', 'Bearing', 'Seal'];
  return products[Math.floor(Math.random() * products.length)];
}

function generateBatch(size: number): TestFailure[] {
  const batch: TestFailure[] = [];

  for (let i = 0; i < size; i++) {
    const rand = Math.random();
    let queryType: TestFailure['query_type'];
    let query: string;

    if (rand < 0.70) {
      queryType = 'sku';
      query = generateQuickSKU();
    } else if (rand < 0.95) {
      queryType = 'product_name';
      query = generateQuickProductName();
    } else {
      queryType = 'order_id';
      query = `ORD-${Math.floor(Math.random() * 90000) + 10000}`;
    }

    const errorRand = Math.random();
    let errorType: TestFailure['error_type'];
    if (errorRand < 0.60) {
      errorType = 'not_found';
    } else if (errorRand < 0.90) {
      errorType = 'api_error';
    } else if (errorRand < 0.98) {
      errorType = 'timeout';
    } else {
      errorType = 'invalid_input';
    }

    const platformRand = Math.random();
    const platform = platformRand < 0.50 ? 'woocommerce' : platformRand < 0.80 ? 'shopify' : 'semantic';

    batch.push({
      query,
      query_type: queryType,
      error_type: errorType,
      platform,
      suggestions: errorType === 'not_found' && Math.random() < 0.3 ? [generateQuickSKU()] : undefined
    });
  }

  return batch;
}

async function insertBatch(batch: TestFailure[]): Promise<void> {
  const supabase = createServiceRoleClientSync();

  const { error } = await supabase
    .from('lookup_failures')
    .insert(
      batch.map(f => ({
        query: f.query,
        query_type: f.query_type,
        error_type: f.error_type,
        platform: f.platform,
        suggestions: f.suggestions || null
      }))
    );

  if (error) {
    throw new Error(`Batch insert failed: ${error.message}`);
  }
}

async function testInsertPerformance(): Promise<PerformanceMetrics> {
  console.log('📊 Testing insert performance...\n');

  const totalRecords = 10000;
  const batchSize = 100;
  const numBatches = totalRecords / batchSize;
  let errors = 0;

  const startTime = Date.now();

  // Process batches concurrently (10 at a time)
  const concurrentBatches = 10;

  for (let i = 0; i < numBatches; i += concurrentBatches) {
    const batchPromises: Promise<void>[] = [];

    for (let j = 0; j < concurrentBatches && i + j < numBatches; j++) {
      const batch = generateBatch(batchSize);
      batchPromises.push(
        insertBatch(batch).catch(err => {
          console.error(`Batch ${i + j} failed:`, err.message);
          errors++;
        })
      );
    }

    await Promise.all(batchPromises);

    const progress = ((i + concurrentBatches) / numBatches) * 100;
    process.stdout.write(`\rProgress: ${Math.min(progress, 100).toFixed(1)}%`);
  }

  console.log(); // New line

  const endTime = Date.now();
  const duration = (endTime - startTime) / 1000; // seconds
  const recordsPerSecond = totalRecords / duration;

  return {
    totalRecords,
    totalDuration: duration,
    recordsPerSecond,
    batchSize,
    errors
  };
}

async function testAPILoad(): Promise<PerformanceMetrics['apiMetrics']> {
  console.log('\n🌐 Testing API load...\n');

  const numRequests = 100;
  const responseTimes: number[] = [];
  let errors = 0;
  let firstError: string | null = null;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const endpoint = `${appUrl}/api/telemetry/lookup-insights`;

  // Test if server is reachable first
  try {
    const testResponse = await fetch(endpoint, { method: 'GET' });
    if (!testResponse.ok && !firstError) {
      firstError = `HTTP ${testResponse.status}: ${await testResponse.text()}`;
    }
  } catch (error) {
    throw new Error(`Server unreachable at ${endpoint}: ${error instanceof Error ? error.message : String(error)}`);
  }

  const requests = Array.from({ length: numRequests }, async () => {
    const startTime = Date.now();

    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const responseTime = Date.now() - startTime;
      responseTimes.push(responseTime);

      if (!response.ok) {
        errors++;
        if (!firstError) {
          firstError = `HTTP ${response.status}: ${await response.text().catch(() => 'Unknown error')}`;
        }
      }

      process.stdout.write(`\rCompleted: ${responseTimes.length}/${numRequests}`);
    } catch (error) {
      const responseTime = Date.now() - startTime;
      responseTimes.push(responseTime);
      errors++;
      if (!firstError) {
        firstError = error instanceof Error ? error.message : String(error);
      }
      process.stdout.write(`\rCompleted: ${responseTimes.length}/${numRequests}`);
    }
  });

  await Promise.all(requests);
  console.log(); // New line

  if (errors > 0 && firstError) {
    console.log(`⚠️  First error encountered: ${firstError.substring(0, 200)}`);
  }

  // Calculate metrics
  responseTimes.sort((a, b) => a - b);
  const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
  const p95Index = Math.floor(responseTimes.length * 0.95);
  const p99Index = Math.floor(responseTimes.length * 0.99);

  return {
    totalRequests: numRequests,
    avgResponseTime: Math.round(avgResponseTime),
    p95ResponseTime: responseTimes[p95Index],
    p99ResponseTime: responseTimes[p99Index],
    errorRate: (errors / numRequests) * 100
  };
}

function assessPerformance(metrics: PerformanceMetrics): {
  insertRate: 'MEETS TARGET' | 'BELOW TARGET';
  apiResponse: 'MEETS TARGET' | 'SLOW' | 'N/A';
  errorHandling: 'ROBUST' | 'ISSUES FOUND';
} {
  const insertRate = metrics.recordsPerSecond >= 100 ? 'MEETS TARGET' : 'BELOW TARGET';

  let apiResponse: 'MEETS TARGET' | 'SLOW' | 'N/A' = 'N/A';
  if (metrics.apiMetrics) {
    apiResponse = metrics.apiMetrics.p95ResponseTime < 200 ? 'MEETS TARGET' : 'SLOW';
  }

  const errorHandling = metrics.errors === 0 && (metrics.apiMetrics?.errorRate || 0) < 5
    ? 'ROBUST'
    : 'ISSUES FOUND';

  return { insertRate, apiResponse, errorHandling };
}

async function main() {
  console.log('🚀 Starting Telemetry Stress Test\n');
  console.log('=' .repeat(60));

  // Test insert performance
  const insertMetrics = await testInsertPerformance();

  console.log('\n✅ Insert performance test complete');
  console.log(`   Records: ${insertMetrics.totalRecords}`);
  console.log(`   Duration: ${insertMetrics.totalDuration.toFixed(2)}s`);
  console.log(`   Rate: ${insertMetrics.recordsPerSecond.toFixed(2)} records/second`);
  console.log(`   Errors: ${insertMetrics.errors}`);

  // Test API load
  let apiMetrics: PerformanceMetrics['apiMetrics'] | undefined;
  try {
    apiMetrics = await testAPILoad();

    console.log('\n✅ API load test complete');
    console.log(`   Total requests: ${apiMetrics.totalRequests}`);
    console.log(`   Avg response time: ${apiMetrics.avgResponseTime}ms`);
    console.log(`   p95 response time: ${apiMetrics.p95ResponseTime}ms`);
    console.log(`   p99 response time: ${apiMetrics.p99ResponseTime}ms`);
    console.log(`   Error rate: ${apiMetrics.errorRate.toFixed(2)}%`);
  } catch (error) {
    console.log('\n⚠️  API load test skipped (server may not be running)');
  }

  // Performance assessment
  const fullMetrics: PerformanceMetrics = {
    ...insertMetrics,
    apiMetrics
  };

  const assessment = assessPerformance(fullMetrics);

  console.log('\n' + '='.repeat(60));
  console.log('\n📈 Performance Assessment:');
  console.log(`   Insert rate: ${assessment.insertRate === 'MEETS TARGET' ? '✅' : '⚠️'} ${assessment.insertRate}`);
  console.log(`   API response: ${assessment.apiResponse === 'MEETS TARGET' ? '✅' : assessment.apiResponse === 'SLOW' ? '⚠️' : '➖'} ${assessment.apiResponse}`);
  console.log(`   Error handling: ${assessment.errorHandling === 'ROBUST' ? '✅' : '⚠️'} ${assessment.errorHandling}`);

  // Issues found
  const issues: string[] = [];
  if (assessment.insertRate === 'BELOW TARGET') {
    issues.push('Insert rate below 100 records/second target');
  }
  if (assessment.apiResponse === 'SLOW') {
    issues.push('API p95 response time above 200ms target');
  }
  if (assessment.errorHandling === 'ISSUES FOUND') {
    issues.push('Errors encountered during load testing');
  }

  if (issues.length > 0) {
    console.log('\n⚠️  Issues Found:');
    issues.forEach(issue => console.log(`   - ${issue}`));
  } else {
    console.log('\n✨ All performance targets met!');
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n✅ Stress test complete!');
}

main().catch(console.error);
