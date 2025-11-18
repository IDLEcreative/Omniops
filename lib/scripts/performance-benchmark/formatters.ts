export function printBenchmarkHeader(testDomain: string, iterations: number): void {
  console.log('='.repeat(80));
  console.log(`📅 Timestamp: ${new Date().toISOString()}`);
  console.log('='.repeat(80));
}

export function printEmbeddingSearchProgress(query: string, coldTime: number, warmTime: number): void {
  console.log(`  Query: "${query.substring(0, 30)}..." - Cold: ${coldTime.toFixed(2)}ms, Warm: ${warmTime.toFixed(2)}ms`);
}

export function printBulkOperationsProgress(size: number, singleTime: number, bulkTime: number): void {
  const improvement = ((singleTime - bulkTime) / singleTime * 100).toFixed(1);
  console.log(`  Batch size ${size}: Single: ${(singleTime / size).toFixed(2)}ms/item, Bulk: ${(bulkTime / size).toFixed(2)}ms/item (${improvement}% faster)`);
}

export function printChatAPIProgress(message: string, duration: number, sourceCount: number): void {
  console.log(`  "${message.substring(0, 30)}..." - ${duration.toFixed(2)}ms (${sourceCount} sources)`);
}

export function printIndexUsage(result: any[]): void {
  const unusedIndexes = result.filter(idx => idx.scans === 0);
  const heavilyUsed = result.filter(idx => idx.scans > 1000);

  console.log(`  Heavily used (>1000 scans): ${heavilyUsed.length}`);

  if (unusedIndexes.length > 0) {
    console.log('\n  ⚠️  Unused indexes (consider removing):');
    unusedIndexes.forEach(idx => {
      console.log(`    - ${idx.indexname} on ${idx.tablename} (${idx.size})`);
    });
  }

  result.slice(0, 5).forEach(idx => {
    console.log(`    - ${idx.indexname}: ${idx.scans} scans (${idx.size})`);
  });
}

export function printQueryPlans(results: Record<string, any>): void {
  for (const [name, data] of Object.entries(results)) {
    if (data.error) {
    } else {
      if (data.usesSeqScan) {
      } else {
      }
    }
  }
}

export function printReport(summary: Record<string, any>, improvements: any[], recommendations: string[]): void {
  console.log('\n' + '='.repeat(80));
  console.log('='.repeat(80));

  console.log('-'.repeat(80));

  improvements.forEach(imp => {
  });

  console.log('-'.repeat(80));

  for (const [name, stats] of Object.entries(summary)) {
    if (stats) {
      console.log(`\n  ${name.replace(/_/g, ' ').toUpperCase()}:`);
      console.log(`    Min: ${stats.min.toFixed(2)}ms`);
      console.log(`    Avg: ${stats.avg.toFixed(2)}ms`);
      console.log(`    Median: ${stats.median.toFixed(2)}ms`);
      console.log(`    P95: ${stats.p95.toFixed(2)}ms`);
      console.log(`    P99: ${stats.p99.toFixed(2)}ms`);
      console.log(`    Max: ${stats.max.toFixed(2)}ms`);
    }
  }

  console.log('-'.repeat(80));

  recommendations.forEach(rec => console.log(`  ${rec}`));
}

export function printReportSaved(reportPath: string): void {
}
