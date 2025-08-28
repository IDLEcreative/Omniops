#!/usr/bin/env node

/**
 * Simple Worker Service Startup Script
 * 
 * Starts a basic worker that connects to Redis and processes jobs.
 */

const { Worker } = require('bullmq');
const Redis = require('ioredis');

// Worker type from environment
const WORKER_TYPE = process.env.WORKER_TYPE || 'scraping';
const WORKER_CONCURRENCY = parseInt(process.env.WORKER_CONCURRENCY || '5');
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

console.log(`Starting ${WORKER_TYPE} worker with concurrency ${WORKER_CONCURRENCY}`);
console.log(`Connecting to Redis at ${REDIS_URL}`);

// Create Redis connection
const connection = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

connection.on('connect', () => {
  console.log('Connected to Redis successfully');
});

connection.on('error', (err) => {
  console.error('Redis error:', err);
});

// Simple job processor
async function processJob(job) {
  console.log(`Processing job ${job.id} of type ${job.name}`);
  
  try {
    // Simulate work
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log(`Job ${job.id} completed successfully`);
    return { success: true, processedAt: new Date() };
  } catch (error) {
    console.error(`Job ${job.id} failed:`, error);
    throw error;
  }
}

// Create worker based on type
let queueName;
switch (WORKER_TYPE) {
  case 'scraping':
    queueName = 'scraper-queue';
    break;
  case 'embeddings':
    queueName = 'embeddings-queue';
    break;
  case 'woocommerce':
    queueName = 'woocommerce-queue';
    break;
  default:
    queueName = 'default-queue';
}

const worker = new Worker(
  queueName,
  processJob,
  {
    connection,
    concurrency: WORKER_CONCURRENCY,
  }
);

worker.on('completed', (job) => {
  console.log(`Job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed:`, err);
});

worker.on('error', (err) => {
  console.error('Worker error:', err);
});

console.log(`Worker started for queue: ${queueName}`);

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  await worker.close();
  await connection.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Received SIGINT, shutting down gracefully...');
  await worker.close();
  await connection.disconnect();
  process.exit(0);
});

// Keep the process alive
process.stdin.resume();