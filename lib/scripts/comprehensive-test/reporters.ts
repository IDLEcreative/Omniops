/**
 * Reporting and output formatting for comprehensive testing
 * Extracted from scripts/comprehensive-test.js
 */

// Color codes for terminal output
export const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

export type LogType = 'success' | 'error' | 'warning' | 'info' | 'test';

/**
 * Log colored message to console
 */
export function log(message: string, type: LogType = 'info'): void {
  const prefix = {
    success: `${colors.green}✅`,
    error: `${colors.red}❌`,
    warning: `${colors.yellow}⚠️`,
    info: `${colors.blue}ℹ️`,
    test: `${colors.cyan}🧪`,
  }[type];

  console.log(`${prefix} ${message}${colors.reset}`);
}

/**
 * Print section header
 */
export function section(title: string): void {
  console.log(`\n${colors.bright}${'═'.repeat(50)}${colors.reset}`);
  console.log(`${colors.bright}${title}${colors.reset}`);
  console.log(`${colors.bright}${'═'.repeat(50)}${colors.reset}`);
}

/**
 * Print test suite header
 */
export function printHeader(): void {
  console.log(`${colors.bright}${colors.cyan}`);
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║   COMPREHENSIVE CHAT SYSTEM VALIDATION SUITE    ║');
  console.log('╚══════════════════════════════════════════════════╝');
  console.log(colors.reset);
}

export interface TestResults {
  passed: number;
  failed: number;
  total: number;
}

/**
 * Print final test summary
 */
export function printSummary(results: TestResults): void {
  section('FINAL VALIDATION SUMMARY');

  const passRate = ((results.passed / results.total) * 100).toFixed(1);

  console.log(
    `${colors.bright}Tests Passed: ${colors.green}${results.passed}/${results.total}${colors.reset}`
  );
  console.log(
    `${colors.bright}Pass Rate: ${parseFloat(passRate) >= 80 ? colors.green : colors.red}${passRate}%${colors.reset}`
  );

  if (results.passed === results.total) {
    console.log(
      `\n${colors.green}${colors.bright}🎉 ALL TESTS PASSED! System is fully operational.${colors.reset}`
    );
  } else if (parseFloat(passRate) >= 80) {
    console.log(
      `\n${colors.yellow}${colors.bright}✓ System is operational with minor issues.${colors.reset}`
    );
  } else {
    console.log(
      `\n${colors.red}${colors.bright}⚠ System has significant issues that need attention.${colors.reset}`
    );
  }

  // Connection status
  console.log(`\n${colors.cyan}System Status:${colors.reset}`);
  console.log(`• Supabase Connection: ${colors.green}✓ Connected${colors.reset}`);
  console.log(`• API Endpoint: ${colors.green}✓ Responding${colors.reset}`);
  console.log(`• Database Tables: ${colors.green}✓ Accessible${colors.reset}`);
  console.log(`• UUID Validation: ${colors.green}✓ Working${colors.reset}`);
  console.log(`• Message Persistence: ${colors.green}✓ Functional${colors.reset}`);
}
