#!/usr/bin/env node

require('dotenv').config();
const Redis = require('ioredis');

async function checkRedisStatus() {
  const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  
  try {
    console.log('Checking Redis status...');
    
    // Check if Redis is connected
    const info = await redis.info();
    console.log('✅ Redis connected successfully');
    
    // Check scrape queue
    const queueLength = await redis.llen('scrape:queue');
    console.log('Scrape queue length:', queueLength);
    
    // Check recent crawl jobs
    const keys = await redis.keys('crawl:*');
    console.log('Found', keys.length, 'crawl jobs in Redis');
    
    // Check the most recent jobs
    if (keys.length > 0) {
      const recentKeys = keys.slice(-3); // Last 3 jobs
      for (const key of recentKeys) {
        const jobData = await redis.hgetall(key);
        console.log(`\n--- Job: ${key} ---`);
        console.log('Status:', jobData.status);
        console.log('URL:', jobData.url);
        console.log('Created:', jobData.createdAt);
        if (jobData.error) {
          console.log('Error:', jobData.error);
        }
      }
    }
    
    // Check if there are items in the queue
    if (queueLength > 0) {
      console.log('\n--- Queue Items ---');
      const queueItems = await redis.lrange('scrape:queue', 0, 2); // Get first 3 items
      queueItems.forEach((item, index) => {
        try {
          const parsed = JSON.parse(item);
          console.log(`Queue item ${index + 1}:`, {
            jobId: parsed.jobId,
            url: parsed.url,
            createdAt: parsed.createdAt
          });
        } catch (e) {
          console.log(`Queue item ${index + 1}: Invalid JSON`);
        }
      });
    }
    
    await redis.quit();
  } catch (error) {
    console.error('Redis error:', error);
    await redis.quit();
  }
}

checkRedisStatus();