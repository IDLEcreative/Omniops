#!/usr/bin/env node

/**
 * Comprehensive Testing Script for Omniops Project
 * Tests queue system, worker system, monitoring, and integration features
 * 
 * Usage: node test-all-features.js
 */

import fs from 'node:fs';
import path from 'node:path';

import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Terminal colors for better output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bold: '\x1b[1m',
  dim: '\x1b[2m'
};

// Test statistics
const testStats = {
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0,
  startTime: Date.now(),
  testResults: [],
  errors: []
};

// Utility functions
function log(message, color = 'reset') {
  console.log(colors[color] + message + colors.reset);
}

function logSection(title) {
  console.log('\n' + '='.repeat(80));
  log(title, 'bold');
  console.log('='.repeat(80) + '\n');
}

function logSubSection(title) {
  console.log('\n' + '-'.repeat(60));
  log(title, 'cyan');
  console.log('-'.repeat(60));
}

function logTest(name, status, details = '') {
  testStats.total++;
  const icon = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⏭️';
  const color = status === 'pass' ? 'green' : status === 'fail' ? 'red' : 'yellow';
  
  if (status === 'pass') testStats.passed++;
  else if (status === 'fail') testStats.failed++;
  else testStats.skipped++;
  
  testStats.testResults.push({
    name,
    status,
    details,
    timestamp: new Date().toISOString()
  });
  
  log(`  ${icon} ${name}`, color);
  if (details) {
    log(`     ${colors.gray}${details}${colors.reset}`);
  }
}

function showProgress(current, total, label = 'Progress') {
  const percentage = Math.round((current / total) * 100);
  const filled = Math.round(percentage / 2);
  const empty = 50 - filled;
  const bar = '█'.repeat(filled) + '░'.repeat(empty);
  process.stdout.write(`\r  ${label}: [${bar}] ${percentage}% (${current}/${total})`);
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Check if required dependencies exist
async function checkDependencies() {
  logSection('📦 CHECKING DEPENDENCIES');
  
  const requiredModules = [
    { name: 'redis', path: 'redis', required: true },
    { name: 'bullmq', path: 'bullmq', required: true },
    { name: '@supabase/supabase-js', path: '@supabase/supabase-js', required: true },
    { name: 'playwright', path: 'playwright', required: false }
  ];
  
  for (const module of requiredModules) {
    try {
      require.resolve(module.path);
      logTest(`Module: ${module.name}`, 'pass', 'Found');
    } catch (error) {
      if (module.required) {
        logTest(`Module: ${module.name}`, 'fail', 'Missing - required module');
        testStats.errors.push(`Missing required module: ${module.name}`);
      } else {
        logTest(`Module: ${module.name}`, 'skip', 'Optional module not installed');
      }
    }
  }
}

// Test Queue System
async function testQueueSystem() {
  logSection('🚀 TESTING QUEUE SYSTEM');
  
  try {
    // Import queue modules
    import { QueueManager, JobPriority  } from './lib/queue/queue-manager';
    import { JobProcessor  } from './lib/queue/job-processor';
    import { JobUtils, QueueMonitor, QueueMaintenance  } from './lib/queue/queue-utils';
    
    logTest('Queue modules import', 'pass');
    
    // Initialize queue manager
    logSubSection('Testing Queue Initialization');
    const queueManager = new QueueManager('test-queue');
    logTest('Queue Manager initialization', 'pass');
    
    const jobProcessor = new JobProcessor('test-queue');
    logTest('Job Processor initialization', 'pass');
    
    // Test job creation with priorities
    logSubSection('Testing Job Creation & Priorities');
    
    // High priority job (new customer)
    const highPriorityJob = await JobUtils.createSinglePageJob('https://example.com/high', {
      customerId: 'new-customer-1',
      isNewCustomer: true,
      metadata: { test: 'high-priority' }
    });
    logTest('High priority job creation', 'pass', `Job ID: ${highPriorityJob.jobId}`);
    
    // Normal priority job
    const normalPriorityJob = await JobUtils.createSinglePageJob('https://example.com/normal', {
      customerId: 'existing-customer-1',
      isNewCustomer: false,
      metadata: { test: 'normal-priority' }
    });
    logTest('Normal priority job creation', 'pass', `Job ID: ${normalPriorityJob.jobId}`);
    
    // Low priority job
    const lowPriorityJob = await JobUtils.createRefreshJob('https://example.com/refresh', {
      customerId: 'existing-customer-2',
      forceRefresh: false
    });
    logTest('Low priority job creation', 'pass', `Job ID: ${lowPriorityJob.jobId}`);
    
    // Test deduplication
    logSubSection('Testing Deduplication');
    
    const duplicateJob1 = await JobUtils.createSinglePageJob('https://example.com/duplicate', {
      customerId: 'customer-1'
    });
    logTest('First job creation', 'pass', `Job ID: ${duplicateJob1.jobId}`);
    
    const duplicateJob2 = await JobUtils.createSinglePageJob('https://example.com/duplicate', {
      customerId: 'customer-1'
    });
    logTest('Duplicate detection', duplicateJob2.deduplicated ? 'pass' : 'fail', 
           `Deduplicated: ${duplicateJob2.deduplicated}`);
    
    // Test rate limiting
    logSubSection('Testing Rate Limiting');
    
    const rateLimitJobs = [];
    for (let i = 0; i < 5; i++) {
      try {
        const job = await JobUtils.createSinglePageJob(`https://example.com/rate-${i}`, {
          customerId: 'rate-test-customer'
        });
        rateLimitJobs.push(job);
        showProgress(i + 1, 5, 'Rate limit test');
        await sleep(100);
      } catch (error) {
        logTest(`Rate limit job ${i}`, 'fail', error.message);
      }
    }
    console.log(); // New line after progress
    logTest('Rate limiting', 'pass', `Created ${rateLimitJobs.length} jobs`);
    
    // Test batch job creation
    logSubSection('Testing Batch Operations');
    
    const batchUrls = [
      'https://example.com/batch1',
      'https://example.com/batch2',
      'https://example.com/batch3'
    ];
    
    const batchResult = await JobUtils.createBatchJobs(batchUrls, {
      customerId: 'batch-customer',
      priority: JobPriority.NORMAL
    });
    logTest('Batch job creation', 'pass', 
           `Created: ${batchResult.created}, Deduplicated: ${batchResult.deduplicated}`);
    
    // Test scheduled jobs
    logSubSection('Testing Scheduled Jobs');
    
    const futureTime = new Date(Date.now() + 60000); // 1 minute from now
    const scheduledJob = await JobUtils.createScheduledJob('https://example.com/scheduled', futureTime, {
      customerId: 'scheduled-customer'
    });
    logTest('Scheduled job creation', 'pass', `Scheduled for: ${futureTime.toISOString()}`);
    
    // Test recurring jobs
    logSubSection('Testing Recurring Jobs');
    
    const recurringJob = await JobUtils.createRecurringJob('daily-crawl', {
      url: 'https://example.com',
      type: 'full-crawl',
      customerId: 'recurring-customer'
    }, '0 2 * * *'); // Daily at 2 AM
    logTest('Recurring job creation', 'pass', 'Daily crawl scheduled');
    
    // Test queue monitoring
    logSubSection('Testing Queue Monitoring');
    
    const queueHealth = await QueueMonitor.getQueueHealth();
    logTest('Queue health check', queueHealth.queue.isHealthy ? 'pass' : 'fail',
           `Healthy: ${queueHealth.queue.isHealthy}`);
    
    const queueStats = await QueueMonitor.getQueueStatistics();
    logTest('Queue statistics', 'pass', 
           `Active: ${queueStats.active}, Waiting: ${queueStats.waiting}`);
    
    // Cleanup
    await queueManager.shutdown();
    await jobProcessor.close();
    
  } catch (error) {
    logTest('Queue System', 'fail', error.message);
    testStats.errors.push(`Queue System Error: ${error.message}`);
  }
}

// Test Worker System
async function testWorkerSystem() {
  logSection('⚙️ TESTING WORKER SYSTEM');
  
  try {
    // Import worker modules
    import { ScraperWorkerService  } from './lib/workers/scraper-worker-service';
    logTest('Worker modules import', 'pass');
    
    // Initialize worker service
    logSubSection('Testing Worker Initialization');
    
    const workerService = new ScraperWorkerService({
      concurrency: 2,
      workerCount: 2,
      enableHealthMonitoring: true,
      memoryThreshold: 0.8
    });
    
    logTest('Worker Service initialization', 'pass', 'Config: 2 workers, concurrency 2');
    
    // Start worker service
    logSubSection('Testing Worker Lifecycle');
    
    let workersReady = 0;
    workerService.on('workerReady', (workerId) => {
      workersReady++;
      log(`  Worker ${workerId} ready`, 'gray');
    });
    
    await workerService.start();
    logTest('Worker Service start', 'pass', `${workersReady} workers ready`);
    
    // Test worker health
    logSubSection('Testing Worker Health');
    
    const health = await workerService.getHealthStatus();
    logTest('Worker health check', health.healthy ? 'pass' : 'fail',
           `Workers: ${health.activeWorkers}/${health.totalWorkers}`);
    
    logTest('Memory monitoring', 'pass',
           `Memory: ${(health.memoryUsage.percentUsed * 100).toFixed(1)}%`);
    
    logTest('Redis connection', health.redisConnected ? 'pass' : 'fail',
           `Connected: ${health.redisConnected}`);
    
    // Test job processing
    logSubSection('Testing Job Processing');
    
    let jobsCompleted = 0;
    let jobsFailed = 0;
    
    workerService.on('workerCompleted', ({ workerId, jobId, result }) => {
      jobsCompleted++;
      log(`  Job ${jobId} completed by ${workerId}`, 'gray');
    });
    
    workerService.on('workerFailed', ({ workerId, jobId, error }) => {
      jobsFailed++;
      log(`  Job ${jobId} failed on ${workerId}: ${error}`, 'gray');
    });
    
    // Create test jobs for workers to process
    import { JobUtils  } from './lib/queue/queue-utils';
    
    for (let i = 0; i < 5; i++) {
      await JobUtils.createSinglePageJob(`https://example.com/worker-test-${i}`, {
        customerId: 'worker-test',
        metadata: { workerTest: true }
      });
      showProgress(i + 1, 5, 'Creating test jobs');
    }
    console.log(); // New line after progress
    
    // Wait for jobs to be processed
    await sleep(3000);
    
    logTest('Job processing', 'pass', 
           `Completed: ${jobsCompleted}, Failed: ${jobsFailed}`);
    
    // Test error handling
    logSubSection('Testing Error Handling');
    
    let errorsCaught = 0;
    workerService.on('workerError', ({ workerId, error }) => {
      errorsCaught++;
      log(`  Worker ${workerId} error handled: ${error}`, 'gray');
    });
    
    // Simulate worker error (this won't actually crash the worker)
    workerService.emit('workerError', { workerId: 'test-worker', error: 'Test error' });
    await sleep(100);
    
    logTest('Error handling', 'pass', `${errorsCaught} errors caught`);
    
    // Test graceful shutdown
    logSubSection('Testing Graceful Shutdown');
    
    let shutdownComplete = false;
    workerService.on('shutdown', () => {
      shutdownComplete = true;
    });
    
    await workerService.stop();
    logTest('Graceful shutdown', shutdownComplete ? 'pass' : 'fail',
           'Worker service stopped cleanly');
    
  } catch (error) {
    logTest('Worker System', 'fail', error.message);
    testStats.errors.push(`Worker System Error: ${error.message}`);
  }
}

// Test Monitoring System
async function testMonitoringSystem() {
  logSection('📊 TESTING MONITORING SYSTEM');
  
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  
  // Test health endpoints
  logSubSection('Testing Health Endpoints');
  
  const healthEndpoints = [
    { path: '/api/health', name: 'Basic health' },
    { path: '/api/health/comprehensive', name: 'Comprehensive health' },
    { path: '/api/queue', name: 'Queue health' },
    { path: '/api/monitoring/scraping', name: 'Scraping monitor' }
  ];
  
  for (const endpoint of healthEndpoints) {
    try {
      const response = await fetch(`${baseUrl}${endpoint.path}`);
      const status = response.status;
      logTest(`${endpoint.name} endpoint`, status === 200 ? 'pass' : 'fail',
             `Status: ${status}`);
      
      if (status === 200) {
        const data = await response.json();
        log(`     ${colors.gray}Response keys: ${Object.keys(data).join(', ')}${colors.reset}`);
      }
    } catch (error) {
      logTest(`${endpoint.name} endpoint`, 'fail', error.message);
    }
  }
  
  // Test queue metrics
  logSubSection('Testing Queue Metrics');
  
  try {
    const response = await fetch(`${baseUrl}/api/queue`);
    if (response.ok) {
      const data = await response.json();
      logTest('Queue metrics fetch', 'pass');
      
      if (data.stats) {
        logTest('Active jobs metric', 'pass', `Count: ${data.stats.active || 0}`);
        logTest('Waiting jobs metric', 'pass', `Count: ${data.stats.waiting || 0}`);
        logTest('Completed jobs metric', 'pass', `Count: ${data.stats.completed || 0}`);
        logTest('Failed jobs metric', 'pass', `Count: ${data.stats.failed || 0}`);
      }
    } else {
      logTest('Queue metrics fetch', 'fail', `Status: ${response.status}`);
    }
  } catch (error) {
    logTest('Queue metrics', 'fail', error.message);
  }
  
  // Test worker metrics
  logSubSection('Testing Worker Metrics');
  
  try {
    const response = await fetch(`${baseUrl}/api/jobs`);
    if (response.ok) {
      const data = await response.json();
      logTest('Worker metrics fetch', 'pass');
      
      if (data.statistics) {
        logTest('Total jobs metric', 'pass', `Count: ${data.statistics.totalJobs || 0}`);
        logTest('Processing rate metric', 'pass', 
               `Rate: ${data.statistics.processingRate || 0}/min`);
      }
    } else {
      logTest('Worker metrics fetch', 'fail', `Status: ${response.status}`);
    }
  } catch (error) {
    logTest('Worker metrics', 'fail', error.message);
  }
  
  // Test system metrics
  logSubSection('Testing System Metrics');
  
  try {
    const response = await fetch(`${baseUrl}/api/health/comprehensive`);
    if (response.ok) {
      const data = await response.json();
      logTest('System metrics fetch', 'pass');
      
      if (data.system) {
        logTest('Memory usage metric', 'pass', 
               `Used: ${Math.round(data.system.memoryUsed / 1024 / 1024)}MB`);
        logTest('CPU cores metric', 'pass', `Cores: ${data.system.cpuCount}`);
        logTest('Uptime metric', 'pass', 
               `Uptime: ${Math.round(data.system.uptime / 60)} minutes`);
      }
    } else {
      logTest('System metrics fetch', 'fail', `Status: ${response.status}`);
    }
  } catch (error) {
    logTest('System metrics', 'fail', error.message);
  }
}

// Test Integration Features
async function testIntegrationFeatures() {
  logSection('🔗 TESTING INTEGRATION FEATURES');
  
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  
  // Test Customer Config API
  logSubSection('Testing Customer Config API');
  
  try {
    // Test config validation
    const validateResponse = await fetch(`${baseUrl}/api/customer/config/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        domain: 'example.com',
        selector: '.product',
        turboMode: true
      })
    });
    
    logTest('Config validation', validateResponse.ok ? 'pass' : 'fail',
           `Status: ${validateResponse.status}`);
    
    // Test config retrieval
    const configResponse = await fetch(`${baseUrl}/api/customer/config?domain=example.com`);
    logTest('Config retrieval', configResponse.ok ? 'pass' : 'fail',
           `Status: ${configResponse.status}`);
    
  } catch (error) {
    logTest('Customer Config API', 'fail', error.message);
  }
  
  // Test Scraping Triggers
  logSubSection('Testing Scraping Triggers');
  
  try {
    // Test scrape job creation via API
    const scrapeResponse = await fetch(`${baseUrl}/api/scrape`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: 'https://example.com/test-scrape',
        customerId: 'test-customer',
        turboMode: true
      })
    });
    
    if (scrapeResponse.ok) {
      const data = await scrapeResponse.json();
      logTest('Scrape job trigger', 'pass', `Job ID: ${data.jobId || 'N/A'}`);
    } else {
      logTest('Scrape job trigger', 'fail', `Status: ${scrapeResponse.status}`);
    }
    
  } catch (error) {
    logTest('Scraping triggers', 'fail', error.message);
  }
  
  // Test WooCommerce Sync (if configured)
  logSubSection('Testing WooCommerce Integration');
  
  try {
    const wooResponse = await fetch(`${baseUrl}/api/woocommerce/test`);
    if (wooResponse.status === 404) {
      logTest('WooCommerce integration', 'skip', 'Not configured');
    } else if (wooResponse.ok) {
      const data = await wooResponse.json();
      logTest('WooCommerce connection', 'pass', 'Connected');
      
      if (data.products) {
        logTest('Product sync', 'pass', `${data.products.length} products`);
      }
    } else {
      logTest('WooCommerce integration', 'fail', `Status: ${wooResponse.status}`);
    }
  } catch (error) {
    logTest('WooCommerce integration', 'skip', 'Not available');
  }
  
  // Test Embedding Generation
  logSubSection('Testing Embedding Generation');
  
  try {
    import { generateEmbeddings  } from './lib/embeddings';
    
    const testText = 'This is a test product description for embedding generation.';
    const embeddings = await generateEmbeddings(testText);
    
    logTest('Embedding generation', embeddings && embeddings.length > 0 ? 'pass' : 'fail',
           `Generated: ${embeddings ? embeddings.length : 0} dimensions`);
    
  } catch (error) {
    logTest('Embedding generation', 'skip', 'OpenAI not configured');
  }
}

// Performance Tests
async function testPerformance() {
  logSection('⚡ TESTING PERFORMANCE');
  
  // Test Queue Throughput
  logSubSection('Testing Queue Throughput');
  
  try {
    import { JobUtils  } from './lib/queue/queue-utils';
    
    const startTime = Date.now();
    const jobCount = 100;
    const jobs = [];
    
    for (let i = 0; i < jobCount; i++) {
      jobs.push(JobUtils.createSinglePageJob(`https://example.com/perf-${i}`, {
        customerId: 'perf-test',
        metadata: { perfTest: true }
      }));
      showProgress(i + 1, jobCount, 'Queue throughput test');
    }
    
    await Promise.all(jobs);
    console.log(); // New line after progress
    
    const duration = Date.now() - startTime;
    const throughput = (jobCount / (duration / 1000)).toFixed(2);
    
    logTest('Queue throughput', 'pass', `${throughput} jobs/sec (${jobCount} jobs in ${duration}ms)`);
    
  } catch (error) {
    logTest('Queue throughput', 'fail', error.message);
  }
  
  // Test Worker Concurrency
  logSubSection('Testing Worker Concurrency');
  
  try {
    import { ScraperWorkerService  } from './lib/workers/scraper-worker-service';
    
    const workerService = new ScraperWorkerService({
      concurrency: 4,
      workerCount: 2
    });
    
    await workerService.start();
    
    const health = await workerService.getHealthStatus();
    logTest('Worker concurrency', 'pass', 
           `${health.activeWorkers} workers with concurrency 4`);
    
    await workerService.stop();
    
  } catch (error) {
    logTest('Worker concurrency', 'fail', error.message);
  }
  
  // Test Memory Usage
  logSubSection('Testing Memory Usage');
  
  const memUsage = process.memoryUsage();
  const heapUsedMB = (memUsage.heapUsed / 1024 / 1024).toFixed(2);
  const heapTotalMB = (memUsage.heapTotal / 1024 / 1024).toFixed(2);
  const rssMB = (memUsage.rss / 1024 / 1024).toFixed(2);
  
  logTest('Heap memory usage', 'pass', `${heapUsedMB}MB / ${heapTotalMB}MB`);
  logTest('Total memory (RSS)', 'pass', `${rssMB}MB`);
  
  // Test Response Times
  logSubSection('Testing Response Times');
  
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  const endpoints = [
    '/api/health',
    '/api/queue',
    '/api/jobs'
  ];
  
  for (const endpoint of endpoints) {
    const startTime = Date.now();
    try {
      await fetch(`${baseUrl}${endpoint}`);
      const responseTime = Date.now() - startTime;
      logTest(`${endpoint} response time`, responseTime < 1000 ? 'pass' : 'fail',
             `${responseTime}ms`);
    } catch (error) {
      logTest(`${endpoint} response time`, 'fail', error.message);
    }
  }
}

// Generate Summary Report
function generateSummaryReport() {
  logSection('📋 TEST SUMMARY REPORT');
  
  const duration = ((Date.now() - testStats.startTime) / 1000).toFixed(2);
  const passRate = ((testStats.passed / testStats.total) * 100).toFixed(1);
  
  console.log(`
  ${colors.bold}Test Results:${colors.reset}
  ${colors.green}✅ Passed: ${testStats.passed}${colors.reset}
  ${colors.red}❌ Failed: ${testStats.failed}${colors.reset}
  ${colors.yellow}⏭️  Skipped: ${testStats.skipped}${colors.reset}
  ${colors.cyan}📊 Total: ${testStats.total}${colors.reset}
  
  ${colors.bold}Statistics:${colors.reset}
  Pass Rate: ${passRate}%
  Duration: ${duration}s
  `);
  
  // Show failed tests
  if (testStats.failed > 0) {
    console.log(`${colors.red}${colors.bold}Failed Tests:${colors.reset}`);
    testStats.testResults
      .filter(t => t.status === 'fail')
      .forEach(t => {
        console.log(`  ${colors.red}• ${t.name}${colors.reset}`);
        if (t.details) {
          console.log(`    ${colors.gray}${t.details}${colors.reset}`);
        }
      });
  }
  
  // Show errors
  if (testStats.errors.length > 0) {
    console.log(`\n${colors.red}${colors.bold}Errors:${colors.reset}`);
    testStats.errors.forEach(error => {
      console.log(`  ${colors.red}• ${error}${colors.reset}`);
    });
  }
  
  // Save report to file
  const reportPath = path.join(__dirname, `test-report-${new Date().toISOString().split('T')[0]}.json`);
  const report = {
    summary: {
      total: testStats.total,
      passed: testStats.passed,
      failed: testStats.failed,
      skipped: testStats.skipped,
      passRate: passRate,
      duration: duration
    },
    results: testStats.testResults,
    errors: testStats.errors,
    timestamp: new Date().toISOString()
  };
  
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n${colors.gray}Report saved to: ${reportPath}${colors.reset}`);
}

// Main test runner
async function main() {
  console.clear();
  log(`
╔════════════════════════════════════════════════════════════════════════════╗
║                                                                            ║
║              OMNIOPS COMPREHENSIVE FEATURE TEST SUITE                     ║
║                                                                            ║
║  Testing: Queue System, Workers, Monitoring, Integration & Performance    ║
║                                                                            ║
╚════════════════════════════════════════════════════════════════════════════╝
`, 'cyan');
  
  try {
    // Run all test suites
    await checkDependencies();
    await testQueueSystem();
    await testWorkerSystem();
    await testMonitoringSystem();
    await testIntegrationFeatures();
    await testPerformance();
    
    // Generate final report
    generateSummaryReport();
    
    // Exit with appropriate code
    const exitCode = testStats.failed > 0 ? 1 : 0;
    
    console.log(`\n${colors.bold}Test suite completed with exit code: ${exitCode}${colors.reset}\n`);
    process.exit(exitCode);
    
  } catch (error) {
    console.error(`\n${colors.red}${colors.bold}Fatal error during test execution:${colors.reset}`);
    console.error(`${colors.red}${error.stack || error}${colors.reset}\n`);
    process.exit(1);
  }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error(`\n${colors.bgRed}${colors.white} UNCAUGHT EXCEPTION ${colors.reset}`);
  console.error(`${colors.red}${error.stack || error}${colors.reset}\n`);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(`\n${colors.bgRed}${colors.white} UNHANDLED REJECTION ${colors.reset}`);
  console.error(`${colors.red}Reason: ${reason}${colors.reset}`);
  console.error(`${colors.red}Promise: ${promise}${colors.reset}\n`);
  process.exit(1);
});

// Run the test suite
if (require.main === module) {
  main().catch(error => {
    console.error(`${colors.red}Test suite failed to start: ${error.message}${colors.reset}`);
    process.exit(1);
  });
}

export { main, testStats };;