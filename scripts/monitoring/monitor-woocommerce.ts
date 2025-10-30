/**
 * WooCommerce Integration Monitoring Dashboard
 * Comprehensive health check and performance monitoring
 */

import { generateReport } from './lib/monitoring/woocommerce/report-generator';
import { printReport } from './lib/monitoring/woocommerce/report-printer';

async function main() {
  try {
    const report = await generateReport();
    printReport(report);

    // Exit with appropriate code
    if (report.overallStatus === 'down') {
      process.exit(1);
    } else if (report.overallStatus === 'degraded') {
      process.exit(2);
    } else {
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ Monitoring failed:', error);
    process.exit(1);
  }
}

main();
