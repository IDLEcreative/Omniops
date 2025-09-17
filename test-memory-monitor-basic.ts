#!/usr/bin/env npx tsx

/**
 * Basic Memory Monitor Test
 * Tests core functionality of the memory monitoring system
 */

import { 
  createMemoryMonitor, 
  memoryMonitor, 
  quickMemoryCheck, 
  monitorMemory 
} from './lib/dev-tools';

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function createMemoryLoad(): number[] {
  // Create a large array to consume memory
  return new Array(100000).fill(0).map((_, i) => i);
}

async function runBasicTests(): Promise<void> {
  console.log('🧠 Memory Monitor Basic Tests\n');

  // Test 1: Quick memory check
  console.log('📊 Test 1: Quick Memory Check');
  const currentMemory = quickMemoryCheck();
  console.log(`Current heap usage: ${(currentMemory.heapUsed / 1024 / 1024).toFixed(2)} MB`);
  console.log(`RSS: ${(currentMemory.rss / 1024 / 1024).toFixed(2)} MB`);
  console.log(`External: ${(currentMemory.external / 1024).toFixed(2)} KB`);
  console.log(`Array buffers: ${(currentMemory.arrayBuffers / 1024).toFixed(2)} KB\n`);

  // Test 2: Basic monitor creation and snapshot
  console.log('📸 Test 2: Basic Monitor and Snapshots');
  const monitor = createMemoryMonitor({
    samplingInterval: 1000,
    historySize: 100,
    enableGCMonitoring: true,
    enableObjectTracking: false
  });

  // Take initial snapshot
  const initialSnapshot = monitor.takeSnapshot();
  console.log(`Initial snapshot: ${(initialSnapshot.usage.heapUsed / 1024 / 1024).toFixed(2)} MB`);

  // Create memory load
  const memoryLoad = createMemoryLoad();
  console.log('Created memory load...');

  // Take another snapshot
  const loadedSnapshot = monitor.takeSnapshot();
  console.log(`After load: ${(loadedSnapshot.usage.heapUsed / 1024 / 1024).toFixed(2)} MB`);

  // Compare snapshots
  const comparison = monitor.compareSnapshots(initialSnapshot, loadedSnapshot);
  console.log(`Memory difference: ${(comparison.diff.heapUsed / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Percentage change: ${comparison.percentageChange.heapUsed.toFixed(2)}%`);
  console.log(`Significant change: ${comparison.significant}\n`);

  // Test 3: Continuous monitoring
  console.log('⏰ Test 3: Continuous Monitoring');
  let snapshotCount = 0;
  let alertCount = 0;

  monitor.on('snapshot', (snapshot) => {
    snapshotCount++;
    if (snapshotCount <= 3) {
      console.log(`Snapshot ${snapshotCount}: ${(snapshot.usage.heapUsed / 1024 / 1024).toFixed(2)} MB`);
    }
  });

  monitor.on('alert', (alert) => {
    alertCount++;
    console.log(`Alert ${alertCount}: ${alert.message}`);
  });

  monitor.start();
  console.log('Monitor started, taking snapshots...');
  
  // Wait for a few snapshots
  await sleep(3500);
  
  monitor.stop();
  console.log(`Monitor stopped. Total snapshots: ${snapshotCount}\n`);

  // Test 4: Statistics and reporting
  console.log('📈 Test 4: Statistics and Reporting');
  
  // Take a few more snapshots for statistics
  for (let i = 0; i < 5; i++) {
    monitor.takeSnapshot();
    if (i % 2 === 0) {
      createMemoryLoad(); // Create some variance
    }
    await sleep(100);
  }

  const stats = monitor.getStatistics();
  console.log(`Total samples: ${stats.totalSamples}`);
  console.log(`Time span: ${(stats.timespan.duration / 1000).toFixed(2)} seconds`);
  console.log(`Current memory: ${(stats.usage.current.heapUsed / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Peak memory: ${(stats.usage.peak.heapUsed / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Average memory: ${(stats.usage.avg.heapUsed / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Memory trend: ${stats.trends.heapUsed.isIncreasing ? 'increasing' : 'stable'}`);
  console.log(`Growth rate: ${(stats.trends.heapUsed.growthRate / 1024).toFixed(2)} KB/s\n`);

  // Test 5: Function monitoring
  console.log('🔧 Test 5: Function Memory Monitoring');
  
  const expensiveFunction = (size: number) => {
    const data = new Array(size).fill(0).map((_, i) => ({ id: i, data: Math.random() }));
    return data.length;
  };

  const monitoredFunction = monitorMemory(expensiveFunction, {
    samplingInterval: 100,
    historySize: 50
  });

  console.log('Calling monitored function...');
  const result = monitoredFunction(50000);
  console.log(`Function result: ${result}`);

  // Get memory report for the function
  const memoryReport = monitoredFunction.getMemoryReport();
  console.log(`Function memory impact: ${memoryReport.summary.status}`);
  console.log(`Total snapshots during execution: ${memoryReport.statistics.totalSamples}\n`);

  // Test 6: Export functionality
  console.log('💾 Test 6: Data Export');
  
  const csvData = monitor.exportCSV();
  const jsonData = monitor.exportJSON();
  
  console.log(`CSV export length: ${csvData.length} characters`);
  console.log(`JSON export length: ${jsonData.length} characters`);
  console.log('CSV headers:', csvData.split('\n')[0]);
  
  // Test 7: Global monitor instance
  console.log('🌍 Test 7: Global Monitor Instance');
  
  const globalMonitor = memoryMonitor();
  const globalSnapshot = globalMonitor.takeSnapshot();
  console.log(`Global monitor snapshot: ${(globalSnapshot.usage.heapUsed / 1024 / 1024).toFixed(2)} MB`);

  // Test 8: Baseline comparison
  console.log('📏 Test 8: Baseline Comparison');
  
  monitor.setBaseline();
  console.log('Baseline set');
  
  // Create some memory load
  const moreData = createMemoryLoad();
  
  const currentSnapshot = monitor.getCurrentSnapshot();
  const baseline = monitor.getBaseline();
  
  if (baseline) {
    const baselineComparison = monitor.compareSnapshots(baseline, currentSnapshot);
    console.log(`Memory change since baseline: ${(baselineComparison.diff.heapUsed / 1024).toFixed(2)} KB`);
    console.log(`Percentage change: ${baselineComparison.percentageChange.heapUsed.toFixed(2)}%`);
    console.log(`Growth analysis: ${baselineComparison.analysis.isMemoryGrowing ? 'growing' : 'stable'}`);
  }

  // Clean up
  console.log('\n🧹 Cleanup');
  monitor.reset();
  console.log('Monitor reset completed');

  console.log('\n✅ All basic tests completed successfully!');
}

async function main(): Promise<void> {
  try {
    await runBasicTests();
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}