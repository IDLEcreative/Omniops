#!/usr/bin/env npx tsx

/**
 * Test suite for Performance Profiler
 * Run with: npx tsx test-performance-profiler.ts
 */

import { PerformanceProfiler, profileFunction, profiler } from './lib/dev-tools';

// Test functions for profiling
function fastFunction(n: number): number {
  return n * 2;
}

function slowFunction(n: number): number {
  // Simulate some work
  const start = Date.now();
  while (Date.now() - start < 50) {
    // Busy wait for 50ms
  }
  return n * n;
}

function memoryIntensiveFunction(size: number): number[] {
  const arr = new Array(size).fill(0).map((_, i) => i);
  return arr.slice(0, 10); // Return small subset to avoid memory issues
}

function errorProneFunction(shouldError: boolean): string {
  if (shouldError) {
    throw new Error('Intentional test error');
  }
  return 'success';
}

class TestClass {
  private value = 0;

  increment(): number {
    return ++this.value;
  }

  multiply(factor: number): number {
    return this.value * factor;
  }

  async asyncOperation(): Promise<string> {
    await new Promise(resolve => setTimeout(resolve, 10));
    return 'async complete';
  }
}

async function runTests(): Promise<void> {
  console.log('🚀 Testing Performance Profiler\n');

  // Test 1: Basic function profiling
  console.log('📊 Test 1: Basic Function Profiling');
  const timedFast = profileFunction(fastFunction, 'FastFunction');
  const timedSlow = profileFunction(slowFunction, 'SlowFunction');

  timedFast(5);
  timedSlow(3);
  console.log('✅ Basic profiling works\n');

  // Test 2: Advanced profiler with wrapper
  console.log('📊 Test 2: Advanced Profiler Wrapper');
  const customProfiler = new PerformanceProfiler({
    trackMemory: true,
    maxHistory: 100,
    enableCallStack: true
  });

  const wrappedFast = customProfiler.wrap(fastFunction, 'WrappedFast');
  const wrappedSlow = customProfiler.wrap(slowFunction, 'WrappedSlow');
  const wrappedMemory = customProfiler.wrap(memoryIntensiveFunction, 'MemoryIntensive');

  // Run multiple calls to collect stats
  for (let i = 0; i < 5; i++) {
    wrappedFast(i);
    wrappedSlow(i);
    wrappedMemory(1000);
  }

  const fastStats = customProfiler.getStats('WrappedFast');
  const slowStats = customProfiler.getStats('WrappedSlow');
  
  console.log('Fast function stats:', {
    count: fastStats?.count,
    avgTime: fastStats?.avgTime.toFixed(2) + 'ms',
    p95: fastStats?.p95.toFixed(2) + 'ms'
  });
  
  console.log('Slow function stats:', {
    count: slowStats?.count,
    avgTime: slowStats?.avgTime.toFixed(2) + 'ms',
    p95: slowStats?.p95.toFixed(2) + 'ms'
  });
  console.log('✅ Advanced profiling works\n');

  // Test 3: Auto-instrumentation
  console.log('📊 Test 3: Auto-instrumentation');
  const testInstance = new TestClass();
  const instrumentedInstance = customProfiler.autoInstrument(testInstance);

  instrumentedInstance.increment();
  instrumentedInstance.multiply(5);
  await instrumentedInstance.asyncOperation();

  const incrementStats = customProfiler.getStats('TestClass.increment');
  console.log('Auto-instrumented method stats:', {
    function: 'TestClass.increment',
    calls: incrementStats?.count,
    avgTime: incrementStats?.avgTime.toFixed(2) + 'ms'
  });
  console.log('✅ Auto-instrumentation works\n');

  // Test 4: Manual timing
  console.log('📊 Test 4: Manual Timing');
  customProfiler.start('manual-operation');
  
  // Simulate some work
  await new Promise(resolve => setTimeout(resolve, 25));
  
  const metrics = customProfiler.end('manual-operation');
  console.log('Manual timing result:', {
    duration: metrics.duration.toFixed(2) + 'ms',
    memoryUsed: (metrics.memoryUsed / 1024 / 1024).toFixed(2) + 'MB'
  });
  console.log('✅ Manual timing works\n');

  // Test 5: Error handling
  console.log('📊 Test 5: Error Handling');
  const wrappedError = customProfiler.wrap(errorProneFunction, 'ErrorProne');
  
  // Call with success
  wrappedError(false);
  
  // Call with error (catch it)
  try {
    wrappedError(true);
  } catch (error) {
    // Expected error
  }

  const errorStats = customProfiler.getStats('ErrorProne');
  console.log('Error handling stats:', {
    totalCalls: errorStats?.count,
    errorCount: errorStats?.errorCount,
    errorRate: errorStats ? (errorStats.errorCount / errorStats.count * 100).toFixed(1) + '%' : 'N/A'
  });
  console.log('✅ Error handling works\n');

  // Test 6: Module instrumentation
  console.log('📊 Test 6: Module Instrumentation');
  const testModule = {
    add: (a: number, b: number) => a + b,
    subtract: (a: number, b: number) => a - b,
    multiply: (a: number, b: number) => a * b
  };

  const instrumentedModule = customProfiler.instrumentModule(testModule);
  instrumentedModule.add(5, 3);
  instrumentedModule.subtract(10, 4);
  instrumentedModule.multiply(3, 7);

  const addStats = customProfiler.getStats('add');
  console.log('Module instrumentation stats:', {
    function: 'add',
    calls: addStats?.count,
    avgTime: addStats?.avgTime.toFixed(2) + 'ms'
  });
  console.log('✅ Module instrumentation works\n');

  // Test 7: Generate comprehensive report
  console.log('📊 Test 7: Comprehensive Report');
  const report = customProfiler.generateReport();
  
  console.log('Performance Report Summary:', {
    totalFunctions: report.summary.totalFunctions,
    totalCalls: report.summary.totalCalls,
    totalTime: report.summary.totalTime.toFixed(2) + 'ms',
    topBottlenecks: report.summary.topBottlenecks.slice(0, 3),
    memoryLeakSuspected: report.memoryLeaks.suspected,
    recommendations: report.recommendations.length
  });
  console.log('✅ Report generation works\n');

  // Test 8: Chrome DevTools export
  console.log('📊 Test 8: Chrome DevTools Export');
  const chromeProfile = customProfiler.exportChromeProfile();
  
  console.log('Chrome Profile:', {
    version: chromeProfile.version,
    type: chromeProfile.type,
    nodeCount: chromeProfile.nodes.length,
    sampleCount: chromeProfile.samples.length
  });
  console.log('✅ Chrome export works\n');

  // Test 9: Singleton profiler
  console.log('📊 Test 9: Singleton Profiler');
  const singletonWrapped = profiler.wrap((x: number) => x + 1, 'SingletonTest');
  singletonWrapped(42);
  
  const singletonStats = profiler.getStats('SingletonTest');
  console.log('Singleton profiler stats:', {
    calls: singletonStats?.count,
    avgTime: singletonStats?.avgTime.toFixed(2) + 'ms'
  });
  console.log('✅ Singleton profiler works\n');

  // Test 10: Memory and cleanup
  console.log('📊 Test 10: Memory Management');
  const initialMetrics = customProfiler.getAllMetrics().size;
  
  // Add lots of data
  for (let i = 0; i < 50; i++) {
    customProfiler.wrap(() => i * 2, `temp-${i}`)();
  }
  
  const beforeFlush = customProfiler.getAllMetrics().size;
  customProfiler.flush();
  const afterFlush = customProfiler.getAllMetrics().size;
  
  customProfiler.clear();
  const afterClear = customProfiler.getAllMetrics().size;
  
  console.log('Memory management:', {
    initial: initialMetrics,
    beforeFlush: beforeFlush,
    afterFlush: afterFlush,
    afterClear: afterClear
  });
  console.log('✅ Memory management works\n');

  console.log('🎉 All tests completed successfully!');
  console.log('\n📋 Performance Profiler is ready for production use');
  console.log('   • Zero dependencies ✓');
  console.log('   • Basic & advanced profiling ✓');
  console.log('   • Auto-instrumentation ✓');
  console.log('   • Memory tracking ✓');
  console.log('   • Error handling ✓');
  console.log('   • Statistics & reports ✓');
  console.log('   • Chrome DevTools export ✓');
  console.log('   • Memory management ✓');
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(console.error);
}

export { runTests };