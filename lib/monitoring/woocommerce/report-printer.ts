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
  console.log('\n📊 OVERALL STATUS');
  console.log('━'.repeat(70));
  console.log(
    `${getStatusEmoji(report.overallStatus)} ${report.overallStatus.toUpperCase()}`
  );

  // Module status
  console.log('\n🔧 MODULE HEALTH');
  console.log('━'.repeat(70));

  for (const check of report.checks) {
    const emoji = getStatusEmoji(check.status);
    const responseTime = check.responseTime ? ` (${check.responseTime}ms)` : '';

    console.log(`\n${emoji} ${check.component}${responseTime}`);
    console.log(`   Status: ${check.status}`);

    if (check.details) {
      console.log(`   Details: ${check.details}`);
    }

    if (check.error) {
      console.log(`   Error: ${check.error}`);
    }
  }

  // Performance metrics
  console.log('\n📈 PERFORMANCE METRICS');
  console.log('━'.repeat(70));
  console.log(`API Response Time: ${report.metrics.apiResponseTime}ms`);
  console.log(`Database Response Time: ${report.metrics.databaseResponseTime}ms`);

  // Recommendations
  console.log('\n💡 RECOMMENDATIONS');
  console.log('━'.repeat(70));
  for (const rec of report.recommendations) {
    console.log(rec);
  }

  console.log('\n' + '━'.repeat(70));
  console.log(`Report generated: ${report.timestamp}`);
  console.log('━'.repeat(70) + '\n');
}
