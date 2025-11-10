/**
 * Report Generator
 *
 * Generates summary reports and saves results to files.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { testStats, colors } from './test-utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Generate Summary Report
 */
export function generateSummaryReport() {
  console.log('\n' + '='.repeat(80));
  console.log(`${colors.bold}📋 TEST SUMMARY REPORT${colors.reset}`);
  console.log('='.repeat(80));

  const duration = ((Date.now() - testStats.startTime) / 1000).toFixed(2);
  const passRate = ((testStats.passed / testStats.total) * 100).toFixed(1);

  console.log(`
  ${colors.bold}Test Results:${colors.reset}
  ${colors.green}✅ Passed: ${testStats.passed}${colors.reset}
  ${colors.red}❌ Failed: ${testStats.failed}${colors.reset}
  ${colors.yellow}⏭️  Skipped: ${testStats.skipped}${colors.reset}
  ${colors.cyan}📊 Total: ${testStats.total}${colors.reset}

  ${colors.bold}Statistics:${colors.reset}
  Pass Rate: ${passRate}%
  Duration: ${duration}s
  `);

  // Show failed tests
  if (testStats.failed > 0) {
    console.log(`${colors.red}${colors.bold}Failed Tests:${colors.reset}`);
    testStats.testResults
      .filter(t => t.status === 'fail')
      .forEach(t => {
        console.log(`  ${colors.red}• ${t.name}${colors.reset}`);
        if (t.details) {
          console.log(`    ${colors.gray}${t.details}${colors.reset}`);
        }
      });
  }

  // Show errors
  if (testStats.errors.length > 0) {
    console.log(`\n${colors.red}${colors.bold}Errors:${colors.reset}`);
    testStats.errors.forEach(error => {
      console.log(`  ${colors.red}• ${error}${colors.reset}`);
    });
  }

  // Save report to file
  const reportPath = path.join(__dirname, '..', '..', 'ARCHIVE', 'test-results', `test-report-${new Date().toISOString().split('T')[0]}.json`);
  const reportDir = path.dirname(reportPath);

  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  const report = {
    summary: {
      total: testStats.total,
      passed: testStats.passed,
      failed: testStats.failed,
      skipped: testStats.skipped,
      passRate: passRate,
      duration: duration
    },
    results: testStats.testResults,
    errors: testStats.errors,
    timestamp: new Date().toISOString()
  };

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n${colors.gray}Report saved to: ${reportPath}${colors.reset}`);

  return testStats.failed > 0 ? 1 : 0;
}
