#!/usr/bin/env node

/**
 * Worker Service Startup Script
 * 
 * This script initializes and starts the appropriate worker based on the WORKER_TYPE environment variable.
 * It handles graceful shutdown, memory monitoring, and health checks.
 */

const { getRedisClient, getJobManager, QUEUE_NAMESPACES } = require('../lib/redis-unified');

// Worker type from environment
const WORKER_TYPE = process.env.WORKER_TYPE || 'scraping';
const WORKER_CONCURRENCY = parseInt(process.env.WORKER_CONCURRENCY || '5');
const MAX_WORKER_MEMORY = parseInt(process.env.MAX_WORKER_MEMORY || '1024'); // MB

console.log(`Starting ${WORKER_TYPE} worker with concurrency ${WORKER_CONCURRENCY}`);

// Health status
let workerHealth = {
  status: 'starting',
  type: WORKER_TYPE,
  startedAt: new Date(),
  lastHeartbeat: new Date(),
  jobsProcessed: 0,
  jobsFailed: 0,
  memoryUsage: 0,
};

/**
 * Monitor memory usage and restart if necessary
 */
function monitorMemory() {
  const usage = process.memoryUsage();
  const heapUsedMB = Math.round(usage.heapUsed / 1024 / 1024);
  
  workerHealth.memoryUsage = heapUsedMB;
  workerHealth.lastHeartbeat = new Date();
  
  if (heapUsedMB > MAX_WORKER_MEMORY) {
    console.error(`Memory usage (${heapUsedMB}MB) exceeded limit (${MAX_WORKER_MEMORY}MB). Restarting...`);
    process.exit(1); // Docker will restart the container
  }
}

/**
 * Update worker health status in Redis
 */
async function updateHealthStatus() {
  try {
    const redis = getRedisClient();
    const healthKey = `worker:health:${WORKER_TYPE}:${process.pid}`;
    
    await redis.set(
      healthKey,
      JSON.stringify(workerHealth),
      300 // 5 minute TTL
    );
  } catch (error) {
    console.error('Failed to update health status:', error);
  }
}

/**
 * Start scraping worker
 */
async function startScrapingWorker() {
  const { createJobProcessor } = require('../lib/queue/job-processor');
  
  const processor = createJobProcessor(
    'scraper-queue',
    {
      maxConcurrency: WORKER_CONCURRENCY,
      stalledInterval: 30000,
      maxStalledCount: 2,
      retryProcessDelay: 5000,
      enableMetrics: true,
    }
  );
  
  // Track job metrics
  setInterval(() => {
    const metrics = processor.getMetrics();
    workerHealth.jobsProcessed = metrics.jobsProcessed;
    workerHealth.jobsFailed = metrics.jobsFailed;
  }, 10000);
  
  workerHealth.status = 'running';
  console.log('Scraping worker started successfully');
  
  return processor;
}

/**
 * Start embeddings worker
 */
async function startEmbeddingsWorker() {
  const { Worker } = require('bullmq');
  const redis = getRedisClient();
  
  const worker = new Worker(
    QUEUE_NAMESPACES.EMBEDDINGS.GENERATE,
    async (job) => {
      // Process embedding generation
      const { content, url, customerId } = job.data;
      
      try {
        // Import embedding generation logic
        const { generateEmbeddings } = require('../lib/embeddings');
        const embeddings = await generateEmbeddings(content, { url, customerId });
        
        workerHealth.jobsProcessed++;
        return { success: true, embeddings };
      } catch (error) {
        workerHealth.jobsFailed++;
        throw error;
      }
    },
    {
      connection: redis,
      concurrency: WORKER_CONCURRENCY,
    }
  );
  
  workerHealth.status = 'running';
  console.log('Embeddings worker started successfully');
  
  return worker;
}

/**
 * Start WooCommerce sync worker
 */
async function startWooCommerceWorker() {
  const { Worker } = require('bullmq');
  const redis = getRedisClient();
  
  const worker = new Worker(
    QUEUE_NAMESPACES.WOOCOMMERCE.SYNC,
    async (job) => {
      // Process WooCommerce sync
      const { action, data } = job.data;
      
      try {
        // Import WooCommerce sync logic
        const { syncProducts, syncOrders } = require('../lib/woocommerce-sync');
        
        let result;
        switch (action) {
          case 'sync-products':
            result = await syncProducts(data);
            break;
          case 'sync-orders':
            result = await syncOrders(data);
            break;
          default:
            throw new Error(`Unknown action: ${action}`);
        }
        
        workerHealth.jobsProcessed++;
        return { success: true, result };
      } catch (error) {
        workerHealth.jobsFailed++;
        throw error;
      }
    },
    {
      connection: redis,
      concurrency: WORKER_CONCURRENCY,
    }
  );
  
  workerHealth.status = 'running';
  console.log('WooCommerce worker started successfully');
  
  return worker;
}

/**
 * Start maintenance worker
 */
async function startMaintenanceWorker() {
  const { Worker } = require('bullmq');
  const redis = getRedisClient();
  
  const worker = new Worker(
    QUEUE_NAMESPACES.MAINTENANCE.CLEANUP,
    async (job) => {
      // Process maintenance tasks
      const { task, params } = job.data;
      
      try {
        let result;
        switch (task) {
          case 'cleanup-old-data':
            // Clean up old scraped data
            const jobManager = getJobManager();
            const oldJobs = await redis.keys('crawl:job:*');
            let cleaned = 0;
            
            for (const key of oldJobs) {
              const data = await redis.get(key);
              if (data) {
                const job = JSON.parse(data);
                const age = Date.now() - new Date(job.createdAt).getTime();
                if (age > 7 * 24 * 60 * 60 * 1000) { // 7 days
                  await redis.del(key);
                  cleaned++;
                }
              }
            }
            
            result = { cleaned };
            break;
            
          case 'optimize-redis':
            // Optimize Redis memory
            await redis.keys('*').then(keys => {
              console.log(`Total keys in Redis: ${keys.length}`);
            });
            result = { optimized: true };
            break;
            
          default:
            throw new Error(`Unknown maintenance task: ${task}`);
        }
        
        workerHealth.jobsProcessed++;
        return { success: true, result };
      } catch (error) {
        workerHealth.jobsFailed++;
        throw error;
      }
    },
    {
      connection: redis,
      concurrency: 1, // Maintenance tasks run one at a time
    }
  );
  
  workerHealth.status = 'running';
  console.log('Maintenance worker started successfully');
  
  return worker;
}

/**
 * Main worker initialization
 */
async function initWorker() {
  let worker;
  
  try {
    // Start appropriate worker based on type
    switch (WORKER_TYPE) {
      case 'scraping':
        worker = await startScrapingWorker();
        break;
        
      case 'embeddings':
        worker = await startEmbeddingsWorker();
        break;
        
      case 'woocommerce':
        worker = await startWooCommerceWorker();
        break;
        
      case 'maintenance':
        worker = await startMaintenanceWorker();
        break;
        
      default:
        throw new Error(`Unknown worker type: ${WORKER_TYPE}`);
    }
    
    // Set up monitoring intervals
    setInterval(monitorMemory, 10000); // Check memory every 10 seconds
    setInterval(updateHealthStatus, 30000); // Update health every 30 seconds
    
    // Graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('Received SIGTERM, shutting down gracefully...');
      workerHealth.status = 'shutting-down';
      
      if (worker && worker.close) {
        await worker.close();
      }
      
      const redis = getRedisClient();
      await redis.disconnect();
      
      process.exit(0);
    });
    
    process.on('SIGINT', async () => {
      console.log('Received SIGINT, shutting down gracefully...');
      workerHealth.status = 'shutting-down';
      
      if (worker && worker.close) {
        await worker.close();
      }
      
      const redis = getRedisClient();
      await redis.disconnect();
      
      process.exit(0);
    });
    
    // Unhandled rejection handler
    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
      workerHealth.status = 'error';
    });
    
  } catch (error) {
    console.error('Failed to initialize worker:', error);
    process.exit(1);
  }
}

// Start the worker
initWorker();