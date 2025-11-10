#!/usr/bin/env tsx
/**
 * E2E Test File Watcher
 *
 * Automatically runs E2E tests when source files change.
 * This provides immediate feedback to AI agents when code changes break workflows.
 *
 * Usage:
 *   npm run test:e2e:watch-files
 *   # or directly:
 *   npx tsx scripts/watch-e2e.ts
 *
 * Features:
 * - Watches app/, lib/, components/ for changes
 * - Runs critical E2E tests (core journeys) on change
 * - Debounces test execution (waits 2s after last change)
 * - Shows clear feedback about which workflows broke
 */

import { exec } from 'child_process';
import { watch } from 'fs';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

// Directories to watch for changes
const WATCH_DIRS = [
  'app',
  'lib',
  'components',
  'public'
];

// Debounce delay (ms) - wait this long after last change before running tests
const DEBOUNCE_DELAY = 2000;

let debounceTimer: NodeJS.Timeout | null = null;
let isRunningTests = false;

/**
 * Run E2E tests and report results
 */
async function runE2ETests(): Promise<void> {
  if (isRunningTests) {
    console.log('⏳ Tests already running, skipping...');
    return;
  }

  isRunningTests = true;
  console.log('\n🎭 Running E2E tests...\n');

  // Quick environment check (non-blocking)
  try {
    const { stdout: envCheck } = await execAsync('bash scripts/check-test-environment.sh');
    console.log(envCheck);
  } catch (error: any) {
    console.error('⚠️  Environment check failed, but continuing...\n');
  }

  const startTime = Date.now();

  try {
    const { stdout, stderr } = await execAsync('npm run test:e2e:critical');
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(stdout);
    if (stderr && !stderr.includes('npm WARN')) {
      console.error(stderr);
    }

    console.log(`\n✅ All E2E tests passed! (${duration}s)`);
    console.log('✅ AI agents can execute workflows successfully\n');

  } catch (error: any) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(error.stdout || '');
    console.error(error.stderr || '');

    console.log(`\n❌ E2E tests failed! (${duration}s)`);
    console.log('❌ Core user journeys are broken - AI agents will fail\n');
    console.log('💡 Tip: Run with --headed to see what broke:');
    console.log('   npm run test:e2e:headed\n');

  } finally {
    isRunningTests = false;
  }
}

/**
 * Debounced test execution - waits for changes to settle
 */
function scheduleTests(changedFile: string): void {
  console.log(`📝 File changed: ${changedFile}`);

  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  debounceTimer = setTimeout(() => {
    runE2ETests();
  }, DEBOUNCE_DELAY);
}

/**
 * Start watching directories for changes
 */
function startWatching(): void {
  console.log('👀 E2E Test File Watcher Started');
  console.log('━'.repeat(60));
  console.log(`Watching: ${WATCH_DIRS.join(', ')}`);
  console.log(`Debounce: ${DEBOUNCE_DELAY}ms`);
  console.log('Tests: Critical E2E tests (core journeys)');
  console.log('━'.repeat(60));
  console.log('\n✅ Watching for changes... (Ctrl+C to stop)\n');

  WATCH_DIRS.forEach(dir => {
    const dirPath = path.resolve(process.cwd(), dir);

    try {
      watch(dirPath, { recursive: true }, (eventType, filename) => {
        if (!filename) return;

        // Ignore certain files
        if (filename.includes('node_modules')) return;
        if (filename.includes('.next')) return;
        if (filename.endsWith('.test.ts')) return;
        if (filename.endsWith('.spec.ts')) return;

        // Only watch relevant file types
        const ext = path.extname(filename);
        const relevantExts = ['.ts', '.tsx', '.js', '.jsx', '.css'];

        if (relevantExts.includes(ext)) {
          const relativePath = path.join(dir, filename);
          scheduleTests(relativePath);
        }
      });

      console.log(`✓ Watching ${dir}/`);

    } catch (error) {
      console.error(`✗ Failed to watch ${dir}/:`, error);
    }
  });
}

/**
 * Handle shutdown gracefully
 */
process.on('SIGINT', () => {
  console.log('\n\n👋 Stopping E2E test watcher...');
  process.exit(0);
});

// Start watching
startWatching();
