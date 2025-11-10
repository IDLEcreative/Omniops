/**
 * Testing Utilities
 *
 * Common utilities for test execution, logging, and statistics.
 */

// Terminal colors for better output
export const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bold: '\x1b[1m',
  dim: '\x1b[2m'
};

// Test statistics
export const testStats = {
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0,
  startTime: Date.now(),
  testResults: [],
  errors: []
};

/**
 * Log message with color
 */
export function log(message, color = 'reset') {
  console.log(colors[color] + message + colors.reset);
}

/**
 * Log section header
 */
export function logSection(title) {
  console.log('\n' + '='.repeat(80));
  log(title, 'bold');
  console.log('='.repeat(80) + '\n');
}

/**
 * Log subsection header
 */
export function logSubSection(title) {
  console.log('\n' + '-'.repeat(60));
  log(title, 'cyan');
  console.log('-'.repeat(60));
}

/**
 * Log test result
 */
export function logTest(name, status, details = '') {
  testStats.total++;
  const icon = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⏭️';
  const color = status === 'pass' ? 'green' : status === 'fail' ? 'red' : 'yellow';

  if (status === 'pass') testStats.passed++;
  else if (status === 'fail') testStats.failed++;
  else testStats.skipped++;

  testStats.testResults.push({
    name,
    status,
    details,
    timestamp: new Date().toISOString()
  });

  log(`  ${icon} ${name}`, color);
  if (details) {
    log(`     ${colors.gray}${details}${colors.reset}`);
  }
}

/**
 * Show progress bar
 */
export function showProgress(current, total, label = 'Progress') {
  const percentage = Math.round((current / total) * 100);
  const filled = Math.round(percentage / 2);
  const empty = 50 - filled;
  const bar = '█'.repeat(filled) + '░'.repeat(empty);
  process.stdout.write(`\r  ${label}: [${bar}] ${percentage}% (${current}/${total})`);
}

/**
 * Sleep utility
 */
export async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Reset test stats
 */
export function resetStats() {
  testStats.total = 0;
  testStats.passed = 0;
  testStats.failed = 0;
  testStats.skipped = 0;
  testStats.startTime = Date.now();
  testStats.testResults = [];
  testStats.errors = [];
}
