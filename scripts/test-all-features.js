#!/usr/bin/env node

/**
 * Comprehensive Testing Script for Omniops Project
 * Tests queue system, worker system, monitoring, and integration features
 *
 * Usage: node test-all-features.js
 */

import { log, colors, resetStats } from './modules/test-utils.js';
import { checkDependencies } from './modules/dependency-checker.js';
import { testQueueSystem } from './modules/queue-tests.js';
import { testMonitoringSystem } from './modules/monitoring-tests.js';
import { generateSummaryReport } from './modules/report-generator.js';

/**
 * Main test runner
 */
async function main() {
  console.clear();
  log(`
╔════════════════════════════════════════════════════════════════════════════╗
║                                                                            ║
║              OMNIOPS COMPREHENSIVE FEATURE TEST SUITE                     ║
║                                                                            ║
║  Testing: Queue System, Workers, Monitoring, Integration & Performance    ║
║                                                                            ║
╚════════════════════════════════════════════════════════════════════════════╝
`, 'cyan');

  resetStats();

  try {
    // Run all test suites
    const depErrors = await checkDependencies();
    const queueErrors = await testQueueSystem();
    const monitoringErrors = await testMonitoringSystem();

    // Collect all errors
    const allErrors = [...depErrors, ...queueErrors, ...monitoringErrors];

    // Add errors to stats
    allErrors.forEach(error => {
      if (!testStats.errors.includes(error)) {
        testStats.errors.push(error);
      }
    });

    // Generate final report
    const exitCode = generateSummaryReport();

    console.log(`\n${colors.bold}Test suite completed with exit code: ${exitCode}${colors.reset}\n`);
    process.exit(exitCode);

  } catch (error) {
    console.error(`\n${colors.red}${colors.bold}Fatal error during test execution:${colors.reset}`);
    console.error(`${colors.red}${error.stack || error}${colors.reset}\n`);
    process.exit(1);
  }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error(`\n${colors.bgRed}${colors.white} UNCAUGHT EXCEPTION ${colors.reset}`);
  console.error(`${colors.red}${error.stack || error}${colors.reset}\n`);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(`\n${colors.bgRed}${colors.white} UNHANDLED REJECTION ${colors.reset}`);
  console.error(`${colors.red}Reason: ${reason}${colors.reset}`);
  console.error(`${colors.red}Promise: ${promise}${colors.reset}\n`);
  process.exit(1);
});

// Run the test suite
main().catch(error => {
  console.error(`${colors.red}Test suite failed to start: ${error.message}${colors.reset}`);
  process.exit(1);
});
