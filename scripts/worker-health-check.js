#!/usr/bin/env node

/**
 * Worker Health Check Script
 * 
 * Used by Docker health checks to verify worker status
 */

const { getRedisClient } = require('../lib/redis-unified');

async function checkWorkerHealth() {
  const workerType = process.env.WORKER_TYPE || 'scraping';
  const pid = process.pid;
  
  try {
    const redis = getRedisClient();
    
    // Check if Redis is accessible
    const redisPing = await redis.ping();
    if (!redisPing) {
      console.error('Redis is not accessible');
      process.exit(1);
    }
    
    // Check worker health status
    const healthKeys = await redis.keys(`worker:health:${workerType}:*`);
    
    if (healthKeys.length === 0) {
      console.error('No worker health status found');
      process.exit(1);
    }
    
    // Check at least one worker is healthy
    let healthyWorkers = 0;
    for (const key of healthKeys) {
      const healthData = await redis.get(key);
      if (healthData) {
        const health = JSON.parse(healthData);
        
        // Check if heartbeat is recent (within 2 minutes)
        const lastHeartbeat = new Date(health.lastHeartbeat);
        const timeSinceHeartbeat = Date.now() - lastHeartbeat.getTime();
        
        if (timeSinceHeartbeat < 120000 && health.status === 'running') {
          healthyWorkers++;
        }
      }
    }
    
    if (healthyWorkers === 0) {
      console.error('No healthy workers found');
      process.exit(1);
    }
    
    console.log(`Worker health check passed: ${healthyWorkers} healthy worker(s)`);
    process.exit(0);
    
  } catch (error) {
    console.error('Health check failed:', error.message);
    process.exit(1);
  }
}

// Run health check
checkWorkerHealth();