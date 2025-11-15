export function printBenchmarkHeader(testDomain, iterations) {
    console.log('🚀 Starting Comprehensive Performance Benchmark');
    console.log('='.repeat(80));
    console.log(`📅 Timestamp: ${new Date().toISOString()}`);
    console.log(`🌐 Test Domain: ${testDomain}`);
    console.log(`🔄 Iterations: ${iterations}`);
    console.log('='.repeat(80));
}
export function printEmbeddingSearchProgress(query, coldTime, warmTime) {
    console.log(`  Query: "${query.substring(0, 30)}..." - Cold: ${coldTime.toFixed(2)}ms, Warm: ${warmTime.toFixed(2)}ms`);
}
export function printBulkOperationsProgress(size, singleTime, bulkTime) {
    const improvement = ((singleTime - bulkTime) / singleTime * 100).toFixed(1);
    console.log(`  Batch size ${size}: Single: ${(singleTime / size).toFixed(2)}ms/item, Bulk: ${(bulkTime / size).toFixed(2)}ms/item (${improvement}% faster)`);
}
export function printChatAPIProgress(message, duration, sourceCount) {
    console.log(`  "${message.substring(0, 30)}..." - ${duration.toFixed(2)}ms (${sourceCount} sources)`);
}
export function printIndexUsage(result) {
    const unusedIndexes = result.filter(idx => idx.scans === 0);
    const heavilyUsed = result.filter(idx => idx.scans > 1000);
    console.log(`  Total indexes: ${result.length}`);
    console.log(`  Unused indexes: ${unusedIndexes.length}`);
    console.log(`  Heavily used (>1000 scans): ${heavilyUsed.length}`);
    if (unusedIndexes.length > 0) {
        console.log('\n  ⚠️  Unused indexes (consider removing):');
        unusedIndexes.forEach(idx => {
            console.log(`    - ${idx.indexname} on ${idx.tablename} (${idx.size})`);
        });
    }
    console.log('\n  📈 Most used indexes:');
    result.slice(0, 5).forEach(idx => {
        console.log(`    - ${idx.indexname}: ${idx.scans} scans (${idx.size})`);
    });
}
export function printQueryPlans(results) {
    for (const [name, data] of Object.entries(results)) {
        console.log(`\n  ${name}:`);
        if (data.error) {
            console.log(`    Error - ${data.error}`);
        }
        else {
            console.log(`    Execution time: ${data.executionTime || 'N/A'}ms`);
            if (data.usesSeqScan) {
                console.log('    ⚠️  Sequential scan detected - missing index?');
            }
            else {
                console.log('    ✅ Using index scan');
            }
        }
    }
}
export function printReport(summary, improvements, recommendations) {
    console.log('\n' + '='.repeat(80));
    console.log('📈 PERFORMANCE OPTIMIZATION REPORT');
    console.log('='.repeat(80));
    console.log('\n🎯 KEY METRICS SUMMARY:');
    console.log('-'.repeat(80));
    improvements.forEach(imp => {
        console.log(`\n  ${imp.metric}:`);
        console.log(`    Improvement: ${imp.improvement}`);
        console.log(`    ${imp.details}`);
    });
    console.log('\n📊 DETAILED METRICS:');
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
    console.log('\n🚀 OPTIMIZATION RECOMMENDATIONS:');
    console.log('-'.repeat(80));
    recommendations.forEach(rec => console.log(`  ${rec}`));
}
export function printReportSaved(reportPath) {
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
}
