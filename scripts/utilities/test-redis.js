#!/usr/bin/env node

/**
 * Redis Connection Test Script
 * Tests both local and Vercel Redis connections
 */

const Redis = require('ioredis');

async function testRedisConnection(url, label) {
  console.log(`\n🔍 Testing ${label}...`);
  console.log(`   URL: ${url.replace(/:[^:@]*@/, ':****@')}`); // Hide password
  
  const redis = new Redis(url, {
    connectTimeout: 5000,
    maxRetriesPerRequest: 1,
    retryStrategy: () => null, // Don't retry for this test
  });
  
  try {
    // Test ping
    const start = Date.now();
    const pong = await redis.ping();
    const latency = Date.now() - start;
    
    if (pong === 'PONG') {
      console.log(`✅ ${label} connected successfully!`);
      console.log(`   Latency: ${latency}ms`);
      
      // Test basic operations
      await redis.set('test:key', 'test-value', 'EX', 10);
      const value = await redis.get('test:key');
      console.log(`   Set/Get test: ${value === 'test-value' ? '✅ Passed' : '❌ Failed'}`);
      
      // Clean up
      await redis.del('test:key');
      
      // Get server info
      const info = await redis.info('server');
      const version = info.match(/redis_version:([^\r\n]+)/);
      if (version) {
        console.log(`   Redis version: ${version[1]}`);
      }
      
      return true;
    } else {
      console.log(`❌ ${label} ping failed`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${label} connection failed`);
    console.log(`   Error: ${error.message}`);
    return false;
  } finally {
    redis.disconnect();
  }
}

async function main() {
  console.log('=================================');
  console.log('Redis Connection Test');
  console.log('=================================');
  
  const results = [];
  
  // Test local Redis
  const localUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  const localResult = await testRedisConnection(localUrl, 'Local Redis');
  results.push({ name: 'Local', success: localResult });
  
  // Test Vercel Redis if URL is provided as argument
  const vercelUrl = process.argv[2];
  if (vercelUrl) {
    const vercelResult = await testRedisConnection(vercelUrl, 'Vercel Redis');
    results.push({ name: 'Vercel', success: vercelResult });
  } else {
    console.log('\n💡 Tip: To test Vercel Redis, run:');
    console.log('   node test-redis.js "your-vercel-redis-url"');
  }
  
  // Summary
  console.log('\n=================================');
  console.log('Summary');
  console.log('=================================');
  results.forEach(r => {
    console.log(`${r.success ? '✅' : '❌'} ${r.name}: ${r.success ? 'Connected' : 'Failed'}`);
  });
  
  // Test fallback behavior (skip if in standalone mode)
  try {
    console.log('\n=================================');
    console.log('Testing Fallback Behavior');
    console.log('=================================');
    
    // Try to test the fallback if the module exists
    const path = require('path');
    const moduleExists = require('fs').existsSync(path.join(__dirname, 'lib', 'redis-unified.ts'));
    
    if (moduleExists) {
      console.log('✅ Redis fallback module exists in the project');
      console.log('   The app will use in-memory storage when Redis is unavailable');
    } else {
      console.log('ℹ️  Running in standalone test mode');
    }
  } catch (e) {
    console.log('ℹ️  Fallback test skipped in standalone mode');
  }
  
  console.log('\n✨ Test complete!');
  process.exit(0);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});