#!/usr/bin/env node

/**
 * Test script for queue and monitoring systems
 */

const { Queue, Worker, QueueEvents } = require('bullmq');
const Redis = require('ioredis');

async function testQueueSystem() {
  console.log('====================================');
  console.log('QUEUE AND MONITORING SYSTEM TEST');
  console.log('====================================\n');
  
  const results = {
    redis: { status: 'unknown', details: {} },
    queue: { status: 'unknown', details: {} },
    worker: { status: 'unknown', details: {} },
    monitoring: { status: 'unknown', details: {} },
    api: { status: 'unknown', details: {} }
  };

  // Test 1: Redis Connection
  console.log('1. Testing Redis connection...');
  try {
    const redis = new Redis('redis://localhost:6379');
    await redis.ping();
    const info = await redis.info('memory');
    const usedMemory = info.match(/used_memory_human:(.+)/)?.[1] || 'unknown';
    
    results.redis.status = 'working';
    results.redis.details = {
      connected: true,
      memory: usedMemory,
      host: 'localhost:6379'
    };
    console.log('✅ Redis is connected and responsive');
    console.log(`   Memory usage: ${usedMemory}`);
    
    await redis.quit();
  } catch (error) {
    results.redis.status = 'failed';
    results.redis.details = { error: error.message };
    console.log('❌ Redis connection failed:', error.message);
  }

  // Test 2: Queue Creation and Operations
  console.log('\n2. Testing Queue operations...');
  let queue, queueEvents;
  try {
    queue = new Queue('test-queue', {
      connection: {
        host: 'localhost',
        port: 6379
      }
    });
    
    queueEvents = new QueueEvents('test-queue', {
      connection: {
        host: 'localhost',
        port: 6379
      }
    });

    // Add a test job
    const job = await queue.add('test-job', {
      test: true,
      timestamp: Date.now()
    });

    // Get queue stats
    const waiting = await queue.getWaitingCount();
    const active = await queue.getActiveCount();
    const completed = await queue.getCompletedCount();
    const failed = await queue.getFailedCount();

    results.queue.status = 'working';
    results.queue.details = {
      jobAdded: job.id,
      stats: { waiting, active, completed, failed }
    };
    
    console.log('✅ Queue operations successful');
    console.log(`   Job added: ${job.id}`);
    console.log(`   Queue stats - Waiting: ${waiting}, Active: ${active}, Completed: ${completed}, Failed: ${failed}`);

    // Clean up test job
    await job.remove();
  } catch (error) {
    results.queue.status = 'failed';
    results.queue.details = { error: error.message };
    console.log('❌ Queue operations failed:', error.message);
  }

  // Test 3: Worker Processing
  console.log('\n3. Testing Worker processing...');
  let worker;
  try {
    let jobProcessed = false;
    let processingResult = null;
    
    worker = new Worker('test-queue', async (job) => {
      jobProcessed = true;
      processingResult = { processed: true, jobId: job.id };
      return processingResult;
    }, {
      connection: {
        host: 'localhost',
        port: 6379
      }
    });

    // Add a job and wait for it to be processed
    const testJob = await queue.add('process-test', {
      action: 'test-processing'
    });

    // Wait for processing (with timeout)
    await new Promise((resolve) => setTimeout(resolve, 1000));

    if (jobProcessed) {
      results.worker.status = 'working';
      results.worker.details = {
        processed: true,
        result: processingResult
      };
      console.log('✅ Worker processing successful');
      console.log(`   Job processed: ${processingResult?.jobId}`);
    } else {
      results.worker.status = 'partial';
      results.worker.details = { processed: false };
      console.log('⚠️  Worker created but job not processed in time');
    }
  } catch (error) {
    results.worker.status = 'failed';
    results.worker.details = { error: error.message };
    console.log('❌ Worker processing failed:', error.message);
  }

  // Test 4: API Endpoints
  console.log('\n4. Testing API endpoints...');
  try {
    const http = require('http');
    
    // Test health endpoint
    const healthData = await new Promise((resolve, reject) => {
      http.get('http://localhost:3000/api/health', (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(e);
          }
        });
      }).on('error', reject);
    });
    
    // Test monitoring endpoint
    const monitoringData = await new Promise((resolve, reject) => {
      http.get('http://localhost:3000/api/monitoring/scraping', (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(e);
          }
        });
      }).on('error', reject);
    });
    
    results.api.status = 'working';
    results.api.details = {
      health: healthData.status,
      monitoring: monitoringData.success ? 'available' : 'error'
    };
    
    console.log('✅ API endpoints responding');
    console.log(`   Health status: ${healthData.status}`);
    console.log(`   Monitoring: ${monitoringData.success ? 'available' : 'error'}`);
  } catch (error) {
    results.api.status = 'failed';
    results.api.details = { error: error.message };
    console.log('❌ API endpoint test failed:', error.message);
  }

  // Cleanup
  console.log('\n5. Cleaning up...');
  try {
    if (worker) await worker.close();
    if (queue) await queue.close();
    if (queueEvents) await queueEvents.close();
    console.log('✅ Cleanup complete');
  } catch (error) {
    console.log('⚠️  Cleanup error:', error.message);
  }

  // Summary Report
  console.log('\n====================================');
  console.log('TEST SUMMARY REPORT');
  console.log('====================================');
  
  const statusEmoji = {
    working: '✅',
    partial: '⚠️',
    failed: '❌',
    unknown: '❓'
  };

  console.log('\nComponent Status:');
  Object.entries(results).forEach(([component, data]) => {
    console.log(`${statusEmoji[data.status]} ${component.toUpperCase()}: ${data.status}`);
    if (data.details.error) {
      console.log(`   Error: ${data.details.error}`);
    } else {
      Object.entries(data.details).forEach(([key, value]) => {
        if (typeof value === 'object') {
          console.log(`   ${key}: ${JSON.stringify(value)}`);
        } else {
          console.log(`   ${key}: ${value}`);
        }
      });
    }
  });

  // Overall Assessment
  console.log('\n====================================');
  console.log('OVERALL ASSESSMENT');
  console.log('====================================');
  
  const workingCount = Object.values(results).filter(r => r.status === 'working').length;
  const totalCount = Object.keys(results).length;
  
  if (workingCount === totalCount) {
    console.log('🎉 All systems operational!');
  } else if (workingCount >= totalCount * 0.6) {
    console.log('⚠️  System partially operational - some components need attention');
  } else {
    console.log('🚨 System has critical issues - immediate attention required');
  }

  // Recommendations
  console.log('\nRECOMMENDATIONS:');
  if (results.redis.status !== 'working') {
    console.log('• Start Redis server: npm run redis:start');
  }
  if (results.queue.status !== 'working') {
    console.log('• Check queue configuration and Redis connection');
  }
  if (results.worker.status !== 'working') {
    console.log('• Verify worker service configuration');
    console.log('• Start worker service: npm run worker:start');
  }
  if (results.api.status !== 'working') {
    console.log('• Ensure Next.js dev server is running: npm run dev');
    console.log('• Check API route implementations');
  }

  process.exit(workingCount === totalCount ? 0 : 1);
}

// Run the test
testQueueSystem().catch(console.error);