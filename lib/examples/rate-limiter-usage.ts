/**
 * Usage examples for the enhanced rate limiting system
 * Demonstrates integration with scraper-api.ts
 *
 * This is the main entry point that aggregates and re-exports all examples.
 * - Basic examples: rate-limiter-usage-basic.ts
 * - Pattern examples: rate-limiter-usage-patterns.ts
 * - Integration examples: rate-limiter-usage-integration.ts
 */

// Re-export all basic examples
export {
  example1_basicSetup,
  example2_simpleScraping,
  example3_errorHandling,
} from './rate-limiter-usage-basic';

// Re-export all pattern examples
export {
  example4_adaptiveThrottling,
  example5_wrapperFunction,
} from './rate-limiter-usage-patterns';

// Re-export all integration examples
export {
  example6_actualScraperIntegration,
  example7_monitoring,
} from './rate-limiter-usage-integration';

// Import for main runner
import {
  example1_basicSetup,
  example2_simpleScraping,
  example3_errorHandling,
} from './rate-limiter-usage-basic';

import {
  example4_adaptiveThrottling,
  example5_wrapperFunction,
} from './rate-limiter-usage-patterns';

import {
  example6_actualScraperIntegration,
  example7_monitoring,
} from './rate-limiter-usage-integration';

// ============================================================================
// Helper Functions
// ============================================================================

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================================
// Main Runner
// ============================================================================

async function runExamples() {
  console.log('🚀 Enhanced Rate Limiter Usage Examples');
  console.log('=======================================\n');

  try {
    // Run examples sequentially
    await example1_basicSetup();
    await sleep(1000);

    await example2_simpleScraping();
    await sleep(1000);

    await example3_errorHandling();
    await sleep(1000);

    await example4_adaptiveThrottling();
    await sleep(1000);

    await example5_wrapperFunction();
    await sleep(1000);

    await example6_actualScraperIntegration();
    await sleep(1000);

    // await example7_monitoring(); // Requires Redis

    console.log('\n✅ All examples completed successfully!');

  } catch (error) {
    console.error('\n❌ Error running examples:', error);
  }
}

// Run if executed directly
if (require.main === module) {
  runExamples().then(() => process.exit(0));
}
