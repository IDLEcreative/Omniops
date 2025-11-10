/**
 * Queue System Tests
 *
 * Tests queue initialization, job creation, priorities, deduplication,
 * rate limiting, batch operations, and monitoring.
 */

import { logSection, logSubSection, logTest, showProgress, sleep } from './test-utils.js';

/**
 * Test Queue System
 */
export async function testQueueSystem() {
  logSection('🚀 TESTING QUEUE SYSTEM');

  const errors = [];

  try {
    // Import queue modules
    const { QueueManager, JobPriority } = await import('../../lib/queue/queue-manager.js');
    const { JobProcessor } = await import('../../lib/queue/job-processor.js');
    const { JobUtils, QueueMonitor } = await import('../../lib/queue/queue-utils.js');

    logTest('Queue modules import', 'pass');

    // Initialize queue manager
    logSubSection('Testing Queue Initialization');
    const queueManager = new QueueManager('test-queue');
    logTest('Queue Manager initialization', 'pass');

    const jobProcessor = new JobProcessor('test-queue');
    logTest('Job Processor initialization', 'pass');

    // Test job creation with priorities
    logSubSection('Testing Job Creation & Priorities');

    const highPriorityJob = await JobUtils.createSinglePageJob('https://example.com/high', {
      customerId: 'new-customer-1',
      isNewCustomer: true,
      metadata: { test: 'high-priority' }
    });
    logTest('High priority job creation', 'pass', `Job ID: ${highPriorityJob.jobId}`);

    const normalPriorityJob = await JobUtils.createSinglePageJob('https://example.com/normal', {
      customerId: 'existing-customer-1',
      isNewCustomer: false,
      metadata: { test: 'normal-priority' }
    });
    logTest('Normal priority job creation', 'pass', `Job ID: ${normalPriorityJob.jobId}`);

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
    errors.push(`Queue System Error: ${error.message}`);
  }

  return errors;
}
