#!/usr/bin/env tsx

/**
 * Load Testing Simulator CLI
 *
 * Tests system performance under various load conditions.
 * Business logic extracted to lib/scripts/load-simulator/core.ts
 */

import { LoadTestOrchestrator, type LoadTestConfig } from '../../lib/scripts/load-simulator/core';

async function main() {
  const args = process.argv.slice(2);

  const config: LoadTestConfig = {
    users: 100,
    duration: 60,
    messagesPerUser: 5,
    scenario: 'sustained',
    apiUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    reportInterval: 10,
  };

  for (const arg of args) {
    const [key, value] = arg.split('=');

    switch (key) {
      case '--users':
        config.users = parseInt(value);
        break;
      case '--duration':
        config.duration = parseInt(value);
        break;
      case '--messages':
        config.messagesPerUser = parseInt(value);
        break;
      case '--scenario':
        config.scenario = value as LoadTestConfig['scenario'];
        break;
      case '--api-url':
        config.apiUrl = value;
        break;
      case '--help':
        console.log(`
Load Testing Simulator

Usage: npx tsx scripts/testing/load-simulator.ts [options]

Options:
  --users=N          Number of concurrent users (default: 100)
  --duration=N       Test duration in seconds (default: 60)
  --messages=N       Messages per user (default: 5)
  --scenario=TYPE    burst|sustained|ramp-up|memory-leak (default: sustained)
  --api-url=URL      API URL to test (default: http://localhost:3000)
  --help             Show this help message

Examples:
  npx tsx scripts/testing/load-simulator.ts --users=100 --duration=60
  npx tsx scripts/testing/load-simulator.ts --scenario=burst
  npx tsx scripts/testing/load-simulator.ts --scenario=memory-leak
        `);
        process.exit(0);
    }
  }

  const orchestrator = new LoadTestOrchestrator(config);
  const metrics = await orchestrator.run();
  orchestrator.printFinalReport(metrics);

  const successRate = metrics.successfulRequests / metrics.totalRequests;
  process.exit(successRate >= 0.99 ? 0 : 1);
}

if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Load test failed:', error);
    process.exit(1);
  });
}
