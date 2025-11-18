/**
 * WooCommerce Monitoring Report Printer
 * Console output formatting for monitoring reports
 */

import { MonitoringReport } from './types';

function getStatusEmoji(status: 'healthy' | 'degraded' | 'down'): string {
  switch (status) {
    case 'healthy':
      return '✅';
    case 'degraded':
      return '⚠️ ';
    case 'down':
      return '❌';
  }
}

export function printReport(report: MonitoringReport): void {
  // Overall status
  console.log('━'.repeat(70));
  console.log(
    `${getStatusEmoji(report.overallStatus)} ${report.overallStatus.toUpperCase()}`
  );

  // Module status
  console.log('━'.repeat(70));

  for (const check of report.checks) {
    const emoji = getStatusEmoji(check.status);
    const responseTime = check.responseTime ? ` (${check.responseTime}ms)` : '';


    if (check.details) {
    }

    if (check.error) {
    }
  }

  // Performance metrics
  console.log('━'.repeat(70));

  // Recommendations
  console.log('━'.repeat(70));
  for (const rec of report.recommendations) {
  }

  console.log('\n' + '━'.repeat(70));
  console.log('━'.repeat(70) + '\n');
}
