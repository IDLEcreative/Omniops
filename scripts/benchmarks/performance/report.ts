import fs from 'fs';
import path from 'path';
import { PerformanceMetrics } from './metrics';

export function generateReport(metrics: PerformanceMetrics) {
  console.log('\n' + '='.repeat(80));
  console.log('📈 PERFORMANCE OPTIMIZATION REPORT');
  console.log('='.repeat(80));

  const summary = metrics.summary();
  const improvements: Array<{ metric: string; improvement: string; details: string }> = [];

  const cold = summary.embedding_search_cold;
  const warm = summary.embedding_search_warm;
  if (cold && warm) {
    const improvement = ((cold.avg - warm.avg) / cold.avg * 100).toFixed(1);
    improvements.push({
      metric: 'Cache Effectiveness',
      improvement: `${improvement}%`,
      details: `Cold ${cold.avg.toFixed(2)}ms → Warm ${warm.avg.toFixed(2)}ms`
    });
  }

  const single = summary.single_upsert;
  const bulk = summary.bulk_upsert;
  if (single && bulk) {
    const improvement = ((single.avg - bulk.avg) / single.avg * 100).toFixed(1);
    improvements.push({
      metric: 'Bulk Operations',
      improvement: `${improvement}%`,
      details: `Single ${single.avg.toFixed(2)}ms → Bulk ${bulk.avg.toFixed(2)}ms per item`
    });
  }

  improvements.forEach(imp => {
    console.log(`\n  ${imp.metric}:`);
    console.log(`    Improvement: ${imp.improvement}`);
    console.log(`    ${imp.details}`);
  });

  const reportPath = path.join(process.cwd(), 'performance-report.json');
  fs.writeFileSync(
    reportPath,
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        summary: improvements,
        metrics: summary
      },
      null,
      2
    )
  );

  console.log(`\n📄 Detailed report saved to: ${reportPath}`);
}
