#!/usr/bin/env node

/**
 * Comprehensive Playwright Web Scraping Test CLI
 *
 * Tests all browser configurations and scraping capabilities.
 * Business logic extracted to lib/scripts/playwright-comprehensive-test/core.ts
 */

import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help')) {
    console.log(`
Playwright Comprehensive Test Suite

Usage: node scripts/playwright-comprehensive-test.js [options]

Options:
  --help    Show this help message

Tests:
  - Browser launching (Chromium, Firefox, WebKit)
  - Basic web scraping
  - Advanced scraping features
  - Performance optimizations
  - Stealth features

Results are saved to: ./test-results/playwright-comprehensive-test.json
    `);
    process.exit(0);
  }

  // Load config
  const { scrapingConfig } = await import(path.resolve(__dirname, '../playwright.config.js'));

  // Import and run tester
  const { PlaywrightTester } = await import('../lib/scripts/playwright-comprehensive-test/core.js');
  const tester = new PlaywrightTester(scrapingConfig);

  const results = await tester.runAllTests();

  const success = results.summary.browsersWorking > 0 && results.summary.errors === 0;
  console.log(success ? '\n🎉 All tests passed!' : '\n⚠️  Some tests failed - check the report for details');
  process.exit(success ? 0 : 1);
}

main().catch((error) => {
  console.error('❌ Test suite crashed:', error);
  process.exit(1);
});
