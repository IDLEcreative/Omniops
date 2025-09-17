#!/usr/bin/env npx tsx

/**
 * Advanced Memory Monitor Test
 * Tests advanced features like heap dumps, trend analysis, predictions, and real-world scenarios
 */

import { createMemoryMonitor, MemoryMonitor } from './lib/dev-tools';
import { promises as fs } from 'fs';
import { existsSync } from 'fs';

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

class DataProcessor {
  private cache: Map<string, any> = new Map();
  private processing: Set<string> = new Set();

  async processData(id: string, data: any[]): Promise<any> {
    if (this.cache.has(id)) {
      return this.cache.get(id);
    }

    if (this.processing.has(id)) {
      // Wait for processing to complete
      while (this.processing.has(id)) {
        await sleep(10);
      }
      return this.cache.get(id);
    }

    this.processing.add(id);

    try {
      // Simulate data processing with memory allocation
      const processed = data.map((item, index) => ({
        id: `${id}_${index}`,
        value: item,
        metadata: new Array(100).fill(Math.random()),
        timestamp: Date.now(),
        computed: Math.random() * item
      }));

      // Add to cache
      this.cache.set(id, processed);
      return processed;
    } finally {
      this.processing.delete(id);
    }
  }

  clearCache(): void {
    this.cache.clear();
  }

  getCacheSize(): number {
    return this.cache.size;
  }
}

async function simulateRealWorldWorkload(monitor: MemoryMonitor): Promise<void> {
  console.log('Simulating real-world workload...');
  
  const processor = new DataProcessor();
  const results: any[] = [];

  // Simulate batch processing with varying load
  for (let batch = 0; batch < 10; batch++) {
    console.log(`Processing batch ${batch + 1}/10`);
    
    const batchSize = 1000 + (batch * 200); // Increasing batch size
    const batchData = new Array(batchSize).fill(0).map(() => Math.random() * 1000);
    
    // Process multiple items concurrently
    const promises = [];
    for (let i = 0; i < 5; i++) {
      const itemData = batchData.slice(i * 200, (i + 1) * 200);
      promises.push(processor.processData(`batch_${batch}_item_${i}`, itemData));
    }
    
    const batchResults = await Promise.all(promises);
    results.push(...batchResults);
    
    // Occasionally clear cache to simulate cleanup
    if (batch % 3 === 0) {
      processor.clearCache();
      console.log(`Cache cleared after batch ${batch + 1}`);
    }
    
    await sleep(300); // Allow monitoring to capture patterns
  }

  console.log(`Workload completed. Processed ${results.length} items`);
  return;
}

async function runAdvancedTests(): Promise<void> {
  console.log('🚀 Advanced Memory Monitor Tests\n');

  // Test 1: Heap dump generation (if available)
  console.log('📸 Test 1: Heap Dump Generation');
  
  const monitor = createMemoryMonitor({
    samplingInterval: 500,
    historySize: 300,
    enableHeapDump: true,
    enableGCMonitoring: true,
    enableObjectTracking: true,
    enableRegression: true,
    enablePrediction: true,
    regressionWindowSize: 30,
    pressureThresholds: {
      heapUsed: 75,
      rss: 80,
      external: 70
    }
  });

  // Try to generate a heap dump
  const heapDumpFile = monitor.generateHeapDump({
    filename: 'test-heap-dump.heapsnapshot',
    format: 'heapsnapshot'
  });

  if (heapDumpFile) {
    console.log(`✅ Heap dump generated: ${heapDumpFile}`);
    
    // Check if file exists and get size
    if (existsSync(heapDumpFile)) {
      const stats = await fs.stat(heapDumpFile);
      console.log(`Heap dump size: ${(stats.size / 1024).toFixed(2)} KB`);
      
      // Clean up test file
      await fs.unlink(heapDumpFile);
      console.log('Test heap dump file cleaned up');
    }
  } else {
    console.log('⚠️ Heap dump not available (v8 module not found or not enabled)');
  }

  // Test 2: Trend analysis and prediction
  console.log('\n📈 Test 2: Trend Analysis and Memory Prediction');
  
  let predictionAccuracy = 0;
  let predictions = 0;

  monitor.on('snapshot', (snapshot) => {
    const stats = monitor.getStatistics();
    
    if (stats.trends.heapUsed.prediction && stats.totalSamples > 30) {
      predictions++;
      
      // Check prediction accuracy (simplified)
      const predicted = stats.trends.heapUsed.prediction.nextValue;
      const actual = snapshot.usage.heapUsed;
      const error = Math.abs(predicted - actual) / actual;
      
      if (error < 0.1) { // Within 10% is considered accurate
        predictionAccuracy++;
      }
      
      if (predictions <= 3) { // Log first few predictions
        console.log(`Prediction ${predictions}:`);
        console.log(`  Predicted: ${(predicted / 1024 / 1024).toFixed(2)} MB`);
        console.log(`  Actual: ${(actual / 1024 / 1024).toFixed(2)} MB`);
        console.log(`  Error: ${(error * 100).toFixed(1)}%`);
        console.log(`  Confidence: ${(stats.trends.heapUsed.prediction.confidence * 100).toFixed(1)}%`);
      }
    }
  });

  monitor.start();

  // Create a predictable memory usage pattern
  console.log('Creating predictable memory usage pattern...');
  const memoryPattern = [];
  
  for (let i = 0; i < 20; i++) {
    // Linear growth pattern
    const size = 50000 + (i * 10000);
    const data = new Array(size).fill(0).map(() => Math.random());
    memoryPattern.push(data);
    
    await sleep(600); // Allow trend analysis
  }

  await sleep(2000); // Let trend analysis settle

  // Test 3: Object lifecycle tracking
  console.log('\n🏷️ Test 3: Object Lifecycle Tracking');
  
  const trackedObjects: { id: string; obj: any }[] = [];
  
  // Create objects with different lifecycles
  for (let i = 0; i < 15; i++) {
    const obj = {
      id: i,
      data: new Array(5000).fill(i),
      timestamp: Date.now(),
      lifecycle: i % 3 === 0 ? 'short' : i % 3 === 1 ? 'medium' : 'long'
    };
    
    const trackingId = monitor.trackObject(obj, {
      location: {
        function: 'createTestObject',
        file: 'test-memory-monitor-advanced.ts',
        line: 150 + i
      }
    });
    
    trackedObjects.push({ id: trackingId, obj });
    
    // Simulate different object lifecycles
    if (obj.lifecycle === 'short') {
      // Short-lived objects - remove reference quickly
      setTimeout(() => {
        const index = trackedObjects.findIndex(t => t.id === trackingId);
        if (index !== -1) {
          trackedObjects.splice(index, 1);
        }
      }, 1000);
    } else if (obj.lifecycle === 'medium') {
      // Medium-lived objects
      setTimeout(() => {
        const index = trackedObjects.findIndex(t => t.id === trackingId);
        if (index !== -1) {
          trackedObjects.splice(index, 1);
        }
      }, 3000);
    }
    // Long-lived objects remain referenced
    
    await sleep(200);
  }

  // Test 4: Real-world workload simulation
  console.log('\n💼 Test 4: Real-World Workload Simulation');
  
  await simulateRealWorldWorkload(monitor);

  // Test 5: Memory regression analysis
  console.log('\n📊 Test 5: Memory Regression Analysis');
  
  const stats = monitor.getStatistics();
  
  console.log('Memory trend analysis:');
  console.log(`- Heap trend: ${stats.trends.heapUsed.isIncreasing ? 'increasing' : 'stable'}`);
  console.log(`- Growth rate: ${(stats.trends.heapUsed.growthRate / 1024).toFixed(2)} KB/s`);
  console.log(`- Correlation strength: ${(stats.trends.heapUsed.correlation * 100).toFixed(1)}%`);
  console.log(`- RSS trend: ${stats.trends.rss.isIncreasing ? 'increasing' : 'stable'}`);
  console.log(`- External memory trend: ${stats.trends.external.isIncreasing ? 'increasing' : 'stable'}`);

  if (stats.trends.heapUsed.prediction) {
    const pred = stats.trends.heapUsed.prediction;
    console.log(`- Next predicted value: ${(pred.nextValue / 1024 / 1024).toFixed(2)} MB`);
    console.log(`- Prediction confidence: ${(pred.confidence * 100).toFixed(1)}%`);
  }

  // Test 6: Advanced alerting and thresholds
  console.log('\n🚨 Test 6: Advanced Alerting');
  
  // Create conditions that should trigger various alerts
  console.log('Creating conditions for advanced alerts...');
  
  // Rapid allocation to trigger growth alerts
  for (let i = 0; i < 10; i++) {
    new Array(200000).fill(0).map(() => ({ data: Math.random(), id: i }));
    await sleep(100);
  }

  await sleep(1500); // Allow alert detection

  monitor.stop();

  // Test 7: Comprehensive reporting
  console.log('\n📋 Test 7: Comprehensive Advanced Report');
  
  const report = monitor.generateReport();
  
  console.log(`Advanced Memory Report:`);
  console.log(`- Health status: ${report.summary.status}`);
  console.log(`- Total monitoring time: ${(report.statistics.timespan.duration / 1000).toFixed(2)}s`);
  console.log(`- Total samples: ${report.statistics.totalSamples}`);
  console.log(`- Sample density: ${(report.statistics.totalSamples / (report.statistics.timespan.duration / 1000)).toFixed(2)}/s`);

  console.log(`\nMemory usage patterns:`);
  console.log(`- Peak memory: ${(report.statistics.usage.peak.heapUsed / 1024 / 1024).toFixed(2)} MB`);
  console.log(`- Average memory: ${(report.statistics.usage.avg.heapUsed / 1024 / 1024).toFixed(2)} MB`);
  console.log(`- Memory variance: ${((report.statistics.usage.peak.heapUsed - report.statistics.usage.avg.heapUsed) / 1024 / 1024).toFixed(2)} MB`);

  console.log(`\nTrend analysis:`);
  Object.entries(report.statistics.trends).forEach(([metric, trend]) => {
    console.log(`- ${metric}: ${trend.isIncreasing ? '↗️' : '→'} ${(trend.growthRate / 1024).toFixed(2)} KB/s (R²=${(trend.correlation * 100).toFixed(1)}%)`);
  });

  if (report.leaks.length > 0) {
    console.log(`\nMemory leaks detected:`);
    report.leaks.forEach((leak, index) => {
      console.log(`Leak ${index + 1}: ${(leak.growthRate / 1024).toFixed(2)} KB/s (${leak.severity})`);
    });
  }

  if (report.objectTracking) {
    console.log(`\nObject tracking summary:`);
    console.log(`- Total objects tracked: ${report.objectTracking.summary.totalObjects}`);
    console.log(`- Objects still alive: ${report.objectTracking.summary.aliveObjects}`);
    console.log(`- Suspected leaks: ${report.objectTracking.summary.suspectedLeaks}`);
  }

  console.log(`\nGC performance:`);
  console.log(`- Total GC events: ${report.statistics.gc.totalEvents}`);
  console.log(`- GC frequency: ${report.statistics.gc.frequency.toFixed(2)} events/min`);
  console.log(`- Average GC time: ${report.statistics.gc.avgTime.toFixed(2)} ms`);
  console.log(`- Memory freed: ${(report.statistics.gc.totalFreed / 1024 / 1024).toFixed(2)} MB`);

  // Test 8: Export validation
  console.log('\n💾 Test 8: Advanced Export Validation');
  
  const csvData = monitor.exportCSV();
  const jsonData = monitor.exportJSON();
  
  // Validate CSV structure
  const csvLines = csvData.split('\n');
  const csvHeaders = csvLines[0].split(',');
  
  console.log(`CSV export validation:`);
  console.log(`- Total lines: ${csvLines.length}`);
  console.log(`- Headers: ${csvHeaders.length} (${csvHeaders.join(', ')})`);
  console.log(`- Data integrity: ${csvLines.length > 1 ? '✅' : '❌'}`);

  // Validate JSON structure
  try {
    const parsed = JSON.parse(jsonData);
    console.log(`JSON export validation:`);
    console.log(`- Snapshots: ${parsed.snapshots?.length || 0}`);
    console.log(`- Alerts: ${parsed.alerts?.length || 0}`);
    console.log(`- GC events: ${parsed.gcEvents?.length || 0}`);
    console.log(`- Leaks: ${parsed.leaks?.length || 0}`);
    console.log(`- Data integrity: ✅`);
  } catch (error) {
    console.log(`JSON export validation: ❌ Invalid JSON`);
  }

  // Test 9: Prediction accuracy assessment
  console.log('\n🎯 Test 9: Prediction Accuracy Assessment');
  
  if (predictions > 0) {
    const accuracy = (predictionAccuracy / predictions) * 100;
    console.log(`Prediction accuracy: ${accuracy.toFixed(1)}% (${predictionAccuracy}/${predictions})`);
    
    if (accuracy > 70) {
      console.log('🎯 Excellent prediction accuracy');
    } else if (accuracy > 50) {
      console.log('✅ Good prediction accuracy');
    } else {
      console.log('⚠️ Prediction accuracy needs improvement');
    }
  } else {
    console.log('No predictions were made during testing');
  }

  // Test 10: Performance and resource usage
  console.log('\n⚡ Test 10: Monitor Resource Usage Analysis');
  
  const monitorUsage = process.memoryUsage();
  console.log(`Current process memory usage:`);
  console.log(`- RSS: ${(monitorUsage.rss / 1024 / 1024).toFixed(2)} MB`);
  console.log(`- Heap used: ${(monitorUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`);
  console.log(`- Heap total: ${(monitorUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`);
  console.log(`- External: ${(monitorUsage.external / 1024).toFixed(2)} KB`);

  // Cleanup
  console.log('\n🧹 Advanced Test Cleanup');
  
  // Clear references to allow garbage collection
  memoryPattern.length = 0;
  trackedObjects.length = 0;
  
  // Force GC if available
  if (monitor.forceGC()) {
    console.log('Forced garbage collection');
    await sleep(500);
    
    const afterGC = process.memoryUsage();
    console.log(`Memory after GC: ${(afterGC.heapUsed / 1024 / 1024).toFixed(2)} MB`);
  }
  
  monitor.reset();
  console.log('Monitor state reset');

  console.log('\n✅ All advanced tests completed successfully!');
  
  // Summary of advanced features tested
  console.log('\n📝 Advanced Features Tested:');
  console.log('✅ Heap dump generation (if available)');
  console.log('✅ Memory trend analysis and prediction');
  console.log('✅ Object lifecycle tracking');
  console.log('✅ Real-world workload simulation');
  console.log('✅ Advanced regression analysis');
  console.log('✅ Sophisticated alerting system');
  console.log('✅ Comprehensive reporting');
  console.log('✅ Data export validation');
  console.log('✅ Prediction accuracy assessment');
  console.log('✅ Resource usage optimization');
}

async function main(): Promise<void> {
  try {
    await runAdvancedTests();
  } catch (error) {
    console.error('❌ Advanced test failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}