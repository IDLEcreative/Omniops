/**
 * Performance Benchmark for Query Inspector
 * Measures overhead and validates memory bounds
 */

import { createQueryInspector } from './lib/dev-tools';

// Mock high-performance database client
class HighPerformanceClient {
  async query(sql: string, params?: any[]): Promise<{ rows: any[]; rowCount: number }> {
    // Minimal delay to simulate fast database
    await new Promise(resolve => setTimeout(resolve, Math.random() * 5 + 1)); // 1-6ms
    
    return {
      rows: Array(10).fill({}).map((_, i) => ({ id: i + 1, data: `row_${i}` })),
      rowCount: 10
    };
  }

  async fastQuery(): Promise<any[]> {
    await new Promise(resolve => setTimeout(resolve, 1)); // 1ms
    return [{ id: 1, data: 'fast' }];
  }
}

async function benchmarkOverhead() {
  console.log('🏁 Query Inspector Performance Benchmark\n');

  const client = new HighPerformanceClient();
  const iterations = 1000;
  
  // Benchmark without inspector
  console.log(`1. Baseline Performance (${iterations} queries)...`);
  const baselineStart = performance.now();
  
  for (let i = 0; i < iterations; i++) {
    await client.query(`SELECT * FROM table_${i % 10} WHERE id = ${i}`);
  }
  
  const baselineTime = performance.now() - baselineStart;
  const avgBaselineTime = baselineTime / iterations;
  
  console.log(`   Total time: ${baselineTime.toFixed(2)}ms`);
  console.log(`   Avg per query: ${avgBaselineTime.toFixed(3)}ms`);

  // Benchmark with inspector
  console.log(`\n2. With Query Inspector (${iterations} queries)...`);
  
  const inspector = createQueryInspector({
    slowQueryThreshold: 50,
    enableNPlusOneDetection: true,
    enablePatternAnalysis: true,
    trackStackTrace: false, // Disable to reduce overhead
    maxHistorySize: iterations + 100
  });
  
  const wrappedClient = inspector.wrap(client, 'BenchmarkClient');
  
  const inspectorStart = performance.now();
  
  for (let i = 0; i < iterations; i++) {
    await wrappedClient.query(`SELECT * FROM table_${i % 10} WHERE id = ${i}`);
  }
  
  const inspectorTime = performance.now() - inspectorStart;
  const avgInspectorTime = inspectorTime / iterations;
  
  console.log(`   Total time: ${inspectorTime.toFixed(2)}ms`);
  console.log(`   Avg per query: ${avgInspectorTime.toFixed(3)}ms`);

  // Calculate overhead
  const overhead = inspectorTime - baselineTime;
  const overheadPercentage = (overhead / baselineTime) * 100;
  const overheadPerQuery = overhead / iterations;
  
  console.log(`\n📊 Performance Analysis:`);
  console.log(`   Total overhead: ${overhead.toFixed(2)}ms`);
  console.log(`   Overhead percentage: ${overheadPercentage.toFixed(2)}%`);
  console.log(`   Overhead per query: ${overheadPerQuery.toFixed(3)}ms`);
  
  // Memory usage analysis
  const memoryUsage = inspector.getMemoryUsage();
  console.log(`\n💾 Memory Usage:`);
  console.log(`   Query history: ${(memoryUsage.queries / 1024).toFixed(2)} KB`);
  console.log(`   Pattern cache: ${(memoryUsage.patterns / 1024).toFixed(2)} KB`);
  console.log(`   Total: ${(memoryUsage.total / 1024).toFixed(2)} KB`);
  
  // Stats generation performance
  const statsStart = performance.now();
  const stats = inspector.generateStats();
  const statsTime = performance.now() - statsStart;
  
  console.log(`\n📈 Stats Generation:`);
  console.log(`   Time to generate stats: ${statsTime.toFixed(2)}ms`);
  console.log(`   Total queries tracked: ${stats.totalQueries}`);
  console.log(`   Unique patterns: ${stats.patterns.length}`);
  console.log(`   N+1 issues detected: ${stats.nPlusOneIssues.length}`);
  
  // Export performance
  const exportStart = performance.now();
  const jsonExport = inspector.exportJSON();
  const csvExport = inspector.exportCSV();
  const exportTime = performance.now() - exportStart;
  
  console.log(`\n📄 Export Performance:`);
  console.log(`   Export time: ${exportTime.toFixed(2)}ms`);
  console.log(`   JSON size: ${(jsonExport.length / 1024).toFixed(2)} KB`);
  console.log(`   CSV lines: ${csvExport.split('\n').length}`);
  
  inspector.clear();
  
  return {
    baselineTime,
    inspectorTime,
    overhead,
    overheadPercentage,
    overheadPerQuery,
    memoryUsage,
    statsTime,
    exportTime
  };
}

async function benchmarkMemoryBounds() {
  console.log('\n🧠 Memory Bounds Testing...\n');
  
  const inspector = createQueryInspector({
    maxHistorySize: 100, // Small limit for testing
    enableNPlusOneDetection: true,
    enablePatternAnalysis: true
  });
  
  const client = new HighPerformanceClient();
  const wrappedClient = inspector.wrap(client, 'MemoryTest');
  
  // Generate many queries to test memory bounds
  const queryCount = 500; // More than maxHistorySize
  
  console.log(`Executing ${queryCount} queries with maxHistorySize=100...`);
  
  for (let i = 0; i < queryCount; i++) {
    await wrappedClient.query(`SELECT * FROM test_table WHERE id = ${i}`);
    
    // Check memory every 100 queries
    if (i % 100 === 0) {
      const memory = inspector.getMemoryUsage();
      const stats = inspector.generateStats();
      console.log(`   Query ${i}: ${stats.totalQueries} tracked, ${(memory.total / 1024).toFixed(2)} KB`);
    }
  }
  
  const finalStats = inspector.generateStats();
  const finalMemory = inspector.getMemoryUsage();
  
  console.log(`\n✅ Memory bounds verified:`);
  console.log(`   Executed: ${queryCount} queries`);
  console.log(`   Tracked: ${finalStats.totalQueries} queries (max: 100)`);
  console.log(`   Memory: ${(finalMemory.total / 1024).toFixed(2)} KB`);
  console.log(`   Bound respected: ${finalStats.totalQueries <= 100 ? '✅' : '❌'}`);
  
  inspector.clear();
  
  return {
    executed: queryCount,
    tracked: finalStats.totalQueries,
    memoryUsed: finalMemory.total,
    boundRespected: finalStats.totalQueries <= 100
  };
}

async function benchmarkCleanup() {
  console.log('\n🧹 Cleanup Performance Testing...\n');
  
  const inspector = createQueryInspector({
    maxHistorySize: 1000,
    enableNPlusOneDetection: true,
    enablePatternAnalysis: true
  });
  
  const client = new HighPerformanceClient();
  const wrappedClient = inspector.wrap(client, 'CleanupTest');
  
  // Generate queries with timestamps spread over time
  console.log('Generating queries with various timestamps...');
  
  for (let i = 0; i < 200; i++) {
    await wrappedClient.query(`SELECT * FROM cleanup_test WHERE id = ${i}`);
  }
  
  const beforeCleanup = inspector.getMemoryUsage();
  console.log(`Before cleanup: ${(beforeCleanup.total / 1024).toFixed(2)} KB`);
  
  // Test cleanup
  const cleanupStart = performance.now();
  inspector.cleanup(100); // Remove data older than 100ms
  const cleanupTime = performance.now() - cleanupStart;
  
  const afterCleanup = inspector.getMemoryUsage();
  console.log(`After cleanup: ${(afterCleanup.total / 1024).toFixed(2)} KB`);
  console.log(`Cleanup time: ${cleanupTime.toFixed(2)}ms`);
  
  const memoryReduction = beforeCleanup.total - afterCleanup.total;
  console.log(`Memory freed: ${(memoryReduction / 1024).toFixed(2)} KB`);
  
  inspector.clear();
  
  return {
    cleanupTime,
    memoryBefore: beforeCleanup.total,
    memoryAfter: afterCleanup.total,
    memoryFreed: memoryReduction
  };
}

async function runPerformanceValidation() {
  console.log('🚀 Query Inspector Performance Validation Suite\n');
  console.log('='.repeat(80));
  
  // Run all benchmarks
  const overheadResults = await benchmarkOverhead();
  const memoryResults = await benchmarkMemoryBounds();
  const cleanupResults = await benchmarkCleanup();
  
  console.log('\n' + '='.repeat(80));
  console.log('📊 PERFORMANCE VALIDATION SUMMARY');
  console.log('='.repeat(80));
  
  // Performance Assessment
  console.log('\n🏎️  Performance Overhead:');
  const isLowOverhead = overheadResults.overheadPercentage < 15; // Less than 15% overhead
  console.log(`   Per-query overhead: ${overheadResults.overheadPerQuery.toFixed(3)}ms`);
  console.log(`   Total overhead: ${overheadResults.overheadPercentage.toFixed(2)}%`);
  console.log(`   Assessment: ${isLowOverhead ? '✅ Acceptable' : '⚠️  High'}`);
  
  // Memory Assessment
  console.log('\n💾 Memory Management:');
  const isMemoryEfficient = memoryResults.memoryUsed < 1024 * 1024; // Less than 1MB
  console.log(`   Memory bounds respected: ${memoryResults.boundRespected ? '✅' : '❌'}`);
  console.log(`   Memory usage: ${(memoryResults.memoryUsed / 1024).toFixed(2)} KB`);
  console.log(`   Assessment: ${isMemoryEfficient ? '✅ Efficient' : '⚠️  High'}`);
  
  // Cleanup Assessment
  console.log('\n🧹 Cleanup Efficiency:');
  const isCleanupFast = cleanupResults.cleanupTime < 10; // Less than 10ms
  const isCleanupEffective = cleanupResults.memoryFreed > 0;
  console.log(`   Cleanup speed: ${cleanupResults.cleanupTime.toFixed(2)}ms`);
  console.log(`   Memory freed: ${(cleanupResults.memoryFreed / 1024).toFixed(2)} KB`);
  console.log(`   Assessment: ${isCleanupFast && isCleanupEffective ? '✅ Efficient' : '⚠️  Needs improvement'}`);
  
  // Overall Assessment
  const allGood = isLowOverhead && isMemoryEfficient && isCleanupFast && isCleanupEffective;
  
  console.log('\n🎯 Production Readiness:');
  console.log(`   Performance overhead: ${isLowOverhead ? '✅' : '❌'}`);
  console.log(`   Memory efficiency: ${isMemoryEfficient ? '✅' : '❌'}`);
  console.log(`   Cleanup effectiveness: ${isCleanupFast && isCleanupEffective ? '✅' : '❌'}`);
  console.log(`   Memory bounds compliance: ${memoryResults.boundRespected ? '✅' : '❌'}`);
  
  console.log('\n' + '='.repeat(80));
  console.log(`🏆 Overall Assessment: ${allGood ? '✅ READY FOR PRODUCTION' : '⚠️  NEEDS OPTIMIZATION'}`);
  console.log('='.repeat(80));
  
  return {
    overhead: overheadResults,
    memory: memoryResults,
    cleanup: cleanupResults,
    productionReady: allGood
  };
}

// Run if executed directly
if (require.main === module) {
  runPerformanceValidation().catch(console.error);
}

export { runPerformanceValidation, benchmarkOverhead, benchmarkMemoryBounds, benchmarkCleanup };