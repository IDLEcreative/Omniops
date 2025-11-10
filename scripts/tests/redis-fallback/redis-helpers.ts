import { createClient } from 'redis';
import { REDIS_TIMEOUT_MS } from './config';

export async function simulateRedisUnavailable() {
  try {
    const client = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: { connectTimeout: REDIS_TIMEOUT_MS }
    });

    await client.connect();
    await client.disconnect();
  } catch {
    console.log('Redis is already unavailable (expected for this test)');
  }
}

export async function stopRedisContainer() {
  try {
    const { execSync } = require('child_process');
    console.log('Attempting to stop Redis container...');
    execSync('docker stop omniops-redis 2>/dev/null || true', { stdio: 'inherit' });
    await new Promise(resolve => setTimeout(resolve, 500));
  } catch {
    console.log('Could not stop Redis container (may not be running)');
  }
}

export async function startRedisContainer() {
  try {
    const { execSync } = require('child_process');
    console.log('Attempting to start Redis container...');
    execSync('docker start omniops-redis 2>/dev/null || true', { stdio: 'inherit' });
    await new Promise(resolve => setTimeout(resolve, 1000));
  } catch {
    console.log('Could not start Redis container');
  }
}
