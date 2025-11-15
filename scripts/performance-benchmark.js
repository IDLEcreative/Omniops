#!/usr/bin/env node

/**
 * Performance Benchmark CLI
 * Tests database optimizations on real query performance
 */

import dotenv from 'dotenv';
import { PerformanceBenchmark } from '../lib/scripts/performance-benchmark/core.js';
import { printBenchmarkHeader, printReport, printReportSaved } from '../lib/scripts/performance-benchmark/formatters.js';
import { getSupabaseConfig, executeSQL as executeSQLHelper } from './supabase-config.js';

dotenv.config({ path: '.env.local' });

const config = getSupabaseConfig();
const TEST_DOMAIN = 'thompsonseparts.co.uk';
const TEST_ITERATIONS = 5;

async function executeSQL(sql) {
  return executeSQLHelper(config, sql);
}

async function main() {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('❌ Missing required environment variables');
    process.exit(1);
  }

  printBenchmarkHeader(TEST_DOMAIN, TEST_ITERATIONS);

  const benchmark = new PerformanceBenchmark(
    SUPABASE_URL,
    SUPABASE_SERVICE_KEY,
    executeSQL,
    TEST_DOMAIN
  );

  try {
    const domainId = await benchmark.getDomainId();

    if (!domainId) {
      console.log(`⚠️  Domain ${TEST_DOMAIN} not found in database`);
    }

    console.log('\n📊 Testing Embedding Search Performance...');
    await benchmark.benchmarkEmbeddingSearch(domainId);

    console.log('\n📊 Testing Bulk Operation Performance...');
    await benchmark.benchmarkBulkOperations();

    console.log('\n📊 Testing Chat API Performance...');
    await benchmark.benchmarkChatAPI(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000');

    console.log('\n📊 Analyzing Index Usage...');
    const indexUsage = await benchmark.checkIndexUsage();
    console.log(`  Found ${indexUsage.length} indexes`);

    console.log('\n📊 Analyzing Query Execution Plans...');
    const queryPlans = await benchmark.analyzeQueryPlans();
    console.log(`  Analyzed ${Object.keys(queryPlans).length} queries`);

    const metrics = benchmark.getMetrics();
    const summary = metrics.summary();
    const reportPath = benchmark.saveReport();

    printReport(summary, [], []);
    printReportSaved(reportPath);

  } catch (error) {
    console.error('❌ Benchmark failed:', error);
    process.exit(1);
  }
}

main().catch(console.error);

export { PerformanceBenchmark };
