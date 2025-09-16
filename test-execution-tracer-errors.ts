#!/usr/bin/env npx tsx

/**
 * Test Execution Tracer - Error Scenarios
 * Validates error handling, stack traces, and error reporting
 */

import { createExecutionTracer, traceFunction } from './lib/dev-tools';

// Error-prone functions for testing
function riskyOperation(shouldFail: boolean, errorType: string = 'generic'): string {
  console.log(`Performing risky operation (shouldFail: ${shouldFail}, type: ${errorType})...`);
  
  if (shouldFail) {
    switch (errorType) {
      case 'reference':
        // @ts-ignore - Intentional error
        return undefinedVariable.toString();
      case 'type':
        // @ts-ignore - Intentional error
        return null.toString();
      case 'range':
        const arr = [1, 2, 3];
        return arr[100].toString();
      case 'custom':
        throw new Error('Custom error thrown intentionally');
      case 'async_rejection':
        throw new Error('Async operation failed');
      default:
        throw new Error('Generic error occurred');
    }
  }
  
  return 'Success!';
}

function nestedErrorFunction(depth: number, shouldFail: boolean): string {
  console.log(`Nested function at depth ${depth}`);
  
  if (depth <= 0) {
    return riskyOperation(shouldFail, 'custom');
  }
  
  return nestedErrorFunction(depth - 1, shouldFail);
}

async function asyncErrorFunction(shouldFail: boolean): Promise<string> {
  console.log(`Async function starting (shouldFail: ${shouldFail})...`);
  
  await new Promise(resolve => setTimeout(resolve, 50));
  
  if (shouldFail) {
    throw new Error('Async error occurred');
  }
  
  return 'Async success!';
}

async function promiseChainWithErrors(): Promise<string> {
  console.log('Starting promise chain...');
  
  return Promise.resolve('initial')
    .then(value => {
      console.log(`Step 1: ${value}`);
      return `${value} -> step1`;
    })
    .then(value => {
      console.log(`Step 2: ${value}`);
      // This will cause an error
      throw new Error('Promise chain error');
    })
    .then(value => {
      console.log(`Step 3: ${value}`);
      return `${value} -> step3`;
    });
}

class ErrorProneClass {
  private data: number[] = [1, 2, 3, 4, 5];

  processData(shouldError: boolean = false): number[] {
    console.log('Processing data...');
    
    if (shouldError) {
      throw new Error('Data processing failed');
    }
    
    return this.data.map(x => this.transform(x, shouldError));
  }

  private transform(value: number, shouldError: boolean): number {
    if (shouldError && value > 3) {
      throw new Error(`Transform failed for value ${value}`);
    }
    
    return value * 2;
  }

  async asyncProcess(shouldError: boolean = false): Promise<number[]> {
    console.log('Async processing...');
    
    await new Promise(resolve => setTimeout(resolve, 30));
    
    if (shouldError) {
      throw new Error('Async processing failed');
    }
    
    return this.processData(false);
  }

  recursiveError(depth: number): number {
    if (depth <= 0) {
      throw new Error('Recursion base case error');
    }
    
    if (depth === 3) {
      throw new Error('Recursion middle error');
    }
    
    return 1 + this.recursiveError(depth - 1);
  }
}

async function testErrorTracing() {
  console.log('🔍 Testing Error Handling in Execution Tracer');
  console.log('============================================\n');

  // Create tracer with error tracking
  const tracer = createExecutionTracer({
    maxDepth: 50,
    maxHistory: 2000,
    trackArgs: true,
    trackReturnValues: true,
    trackMemory: true,
    trackStackTrace: true,
    asyncTracking: true
  });

  let errorCount = 0;
  let traceCount = 0;

  // Listen for events
  tracer.on('trace', (trace) => {
    traceCount++;
    const errorMarker = trace.type === 'error' ? '❌' : trace.isAsync ? '⚡' : '🔄';
    
    if (trace.type === 'entry' || trace.type === 'async_start') {
      console.log(`📞 ${errorMarker} ${' '.repeat(trace.depth * 2)}→ ${trace.functionName}(${trace.args ? JSON.stringify(trace.args).slice(0, 30) : ''}...)`);
    } else if (trace.type === 'exit' || trace.type === 'async_end') {
      console.log(`📤 ${errorMarker} ${' '.repeat(trace.depth * 2)}← ${trace.functionName} [${trace.duration?.toFixed(2)}ms]`);
    } else if (trace.type === 'error') {
      console.log(`❌ ${errorMarker} ${' '.repeat(trace.depth * 2)}✗ ${trace.functionName} ERROR: ${trace.error?.message} [${trace.duration?.toFixed(2)}ms]`);
    }
  });

  tracer.on('error', ({ trace, error }) => {
    errorCount++;
    console.error(`🚨 Error captured in ${trace.functionName}:`);
    console.error(`   Message: ${error.message}`);
    console.error(`   Type: ${error.constructor.name}`);
    if (trace.stackTrace) {
      console.error(`   Stack trace (first 3 lines):`);
      trace.stackTrace.slice(0, 3).forEach(line => console.error(`     ${line}`));
    }
    console.error();
  });

  console.log('1. Testing basic error handling...');
  const tracedRiskyOperation = tracer.wrap(riskyOperation, 'riskyOperation');

  // Test successful operation
  try {
    const result = tracedRiskyOperation(false);
    console.log(`Success result: ${result}`);
  } catch (error) {
    console.error(`Unexpected error: ${error}`);
  }

  // Test various error types
  const errorTypes = ['generic', 'reference', 'type', 'range', 'custom'];
  
  for (const errorType of errorTypes) {
    console.log(`\nTesting ${errorType} error:`);
    try {
      tracedRiskyOperation(true, errorType);
    } catch (error) {
      console.log(`✓ Caught ${errorType} error: ${(error as Error).message}`);
    }
  }
  
  console.log(`\nError count so far: ${errorCount}\n`);

  console.log('2. Testing nested error propagation...');
  const tracedNestedErrorFunction = tracer.wrap(nestedErrorFunction, 'nestedErrorFunction');

  try {
    tracedNestedErrorFunction(3, false);
    console.log('Nested operation succeeded');
  } catch (error) {
    console.log(`Nested operation failed: ${(error as Error).message}`);
  }

  try {
    tracedNestedErrorFunction(3, true);
  } catch (error) {
    console.log(`✓ Caught nested error: ${(error as Error).message}`);
  }

  console.log(`Error count so far: ${errorCount}\n`);

  console.log('3. Testing async error handling...');
  const tracedAsyncErrorFunction = tracer.wrap(asyncErrorFunction, 'asyncErrorFunction');

  try {
    const result = await tracedAsyncErrorFunction(false);
    console.log(`Async success: ${result}`);
  } catch (error) {
    console.error(`Unexpected async error: ${error}`);
  }

  try {
    await tracedAsyncErrorFunction(true);
  } catch (error) {
    console.log(`✓ Caught async error: ${(error as Error).message}`);
  }

  console.log(`Error count so far: ${errorCount}\n`);

  console.log('4. Testing promise chain errors...');
  const tracedPromiseChainWithErrors = tracer.wrap(promiseChainWithErrors, 'promiseChainWithErrors');

  try {
    await tracedPromiseChainWithErrors();
  } catch (error) {
    console.log(`✓ Caught promise chain error: ${(error as Error).message}`);
  }

  console.log(`Error count so far: ${errorCount}\n`);

  console.log('5. Testing class method errors...');
  const errorProneInstance = new ErrorProneClass();
  const tracedInstance = tracer.autoInstrument(errorProneInstance, {
    includePrivate: true,
    trackArgs: true,
    trackReturnValues: true
  });

  // Test successful class method
  try {
    const result = tracedInstance.processData(false);
    console.log(`Class method success: ${result}`);
  } catch (error) {
    console.error(`Unexpected class error: ${error}`);
  }

  // Test class method error
  try {
    tracedInstance.processData(true);
  } catch (error) {
    console.log(`✓ Caught class method error: ${(error as Error).message}`);
  }

  // Test async class method error
  try {
    await tracedInstance.asyncProcess(true);
  } catch (error) {
    console.log(`✓ Caught async class method error: ${(error as Error).message}`);
  }

  // Test recursive error
  try {
    tracedInstance.recursiveError(5);
  } catch (error) {
    console.log(`✓ Caught recursive error: ${(error as Error).message}`);
  }

  console.log(`Error count so far: ${errorCount}\n`);

  console.log('6. Analyzing error statistics...');
  const timeline = tracer.getTimeline();
  console.log(`📊 Error Timeline Summary:`);
  console.log(`   Duration: ${timeline.duration.toFixed(2)}ms`);
  console.log(`   Total calls: ${timeline.totalCalls}`);
  console.log(`   Errors: ${timeline.summary.errors}`);
  console.log(`   Error rate: ${((timeline.summary.errors / timeline.summary.functionCalls) * 100).toFixed(2)}%`);
  console.log(`   Events captured: ${errorCount}\n`);

  console.log('7. Analyzing function error rates...');
  const stats = tracer.getStats();
  console.log(`📈 Function Error Statistics:`);
  
  const functionsWithErrors = Object.entries(stats)
    .filter(([_, stat]) => stat.errorCount > 0)
    .sort((a, b) => b[1].errorCount - a[1].errorCount);
  
  functionsWithErrors.forEach(([functionName, stat]) => {
    const errorRate = (stat.errorCount / stat.count) * 100;
    console.log(`   ${functionName}:`);
    console.log(`     Total calls: ${stat.count}`);
    console.log(`     Errors: ${stat.errorCount}`);
    console.log(`     Error rate: ${errorRate.toFixed(1)}%`);
    console.log(`     Avg time: ${stat.avgTime.toFixed(2)}ms`);
    console.log();
  });

  console.log('8. Examining error traces...');
  const errorTraces = timeline.entries.filter(entry => entry.type === 'error');
  console.log(`📋 Error Trace Analysis:`);
  console.log(`   Total error traces: ${errorTraces.length}`);
  
  errorTraces.slice(0, 3).forEach((trace, index) => {
    console.log(`\n   Error ${index + 1}:`);
    console.log(`     Function: ${trace.functionName}`);
    console.log(`     Error: ${trace.error?.message}`);
    console.log(`     Duration: ${trace.duration?.toFixed(2)}ms`);
    console.log(`     Depth: ${trace.depth}`);
    console.log(`     Async: ${trace.isAsync ? 'Yes' : 'No'}`);
    if (trace.stackTrace && trace.stackTrace.length > 0) {
      console.log(`     Stack (first line): ${trace.stackTrace[0]}`);
    }
  });

  console.log('\n9. Generating error-focused call graph...');
  const callGraph = tracer.getCallGraph();
  const nodesWithErrors = callGraph.nodes.filter(node => node.errors > 0);
  
  console.log(`📈 Error Call Graph:`);
  console.log(`   Total nodes: ${callGraph.nodes.length}`);
  console.log(`   Nodes with errors: ${nodesWithErrors.length}`);
  console.log(`   Error-prone functions:`);
  
  nodesWithErrors
    .sort((a, b) => b.errors - a.errors)
    .slice(0, 5)
    .forEach(node => {
      const errorRate = (node.errors / node.calls) * 100;
      console.log(`     • ${node.functionName}: ${node.errors}/${node.calls} calls failed (${errorRate.toFixed(1)}%)`);
    });

  console.log('\n10. Generating comprehensive error report...');
  const report = tracer.generateReport();
  console.log(`📋 Error Execution Report:`);
  console.log(`   Total execution time: ${report.summary.totalTime.toFixed(2)}ms`);
  console.log(`   Error rate: ${(report.summary.errorRate * 100).toFixed(2)}%`);
  console.log(`   Functions with errors: ${functionsWithErrors.length}`);
  
  if (report.performance.bottlenecks.length > 0) {
    console.log('\n   Error-related bottlenecks:');
    report.performance.bottlenecks
      .filter(b => stats[b.function]?.errorCount > 0)
      .slice(0, 3)
      .forEach(bottleneck => {
        const errorRate = (stats[bottleneck.function].errorCount / stats[bottleneck.function].count) * 100;
        console.log(`     • ${bottleneck.function}: impact ${bottleneck.impact.toFixed(1)}, ${errorRate.toFixed(1)}% error rate - ${bottleneck.reason}`);
      });
  }

  if (report.recommendations.length > 0) {
    console.log('\n   Error-handling recommendations:');
    report.recommendations
      .filter(rec => rec.toLowerCase().includes('error') || rec.toLowerCase().includes('fail'))
      .forEach(rec => console.log(`     • ${rec}`));
  }

  console.log('\n11. Error recovery patterns...');
  const errorEntries = timeline.entries.filter(e => e.type === 'error');
  const recoveryPatterns = new Map<string, number>();
  
  errorEntries.forEach(errorEntry => {
    const nextEntries = timeline.entries.filter(e => 
      e.timestamp > errorEntry.timestamp && 
      e.timestamp < errorEntry.timestamp + 100 // Within 100ms
    );
    
    if (nextEntries.length > 0) {
      const pattern = `${errorEntry.functionName} -> ${nextEntries[0].functionName}`;
      recoveryPatterns.set(pattern, (recoveryPatterns.get(pattern) || 0) + 1);
    }
  });
  
  console.log(`🔄 Error Recovery Patterns:`);
  if (recoveryPatterns.size > 0) {
    Array.from(recoveryPatterns.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .forEach(([pattern, count]) => {
        console.log(`     • ${pattern}: ${count} occurrences`);
      });
  } else {
    console.log(`     No recovery patterns detected`);
  }

  console.log('\n12. Memory usage during errors...');
  const errorTracesWithMemory = errorTraces.filter(trace => trace.memoryUsage);
  if (errorTracesWithMemory.length > 0) {
    const avgMemoryDuringErrors = errorTracesWithMemory.reduce((sum, trace) => 
      sum + (trace.memoryUsage?.heapUsed || 0), 0) / errorTracesWithMemory.length;
    
    console.log(`💾 Memory During Errors:`);
    console.log(`     Average heap usage during errors: ${(avgMemoryDuringErrors / 1024 / 1024).toFixed(2)}MB`);
    
    const memoryGrowthErrors = errorTracesWithMemory.filter((trace, index) => {
      if (index === 0) return false;
      const prevTrace = errorTracesWithMemory[index - 1];
      return (trace.memoryUsage?.heapUsed || 0) > (prevTrace.memoryUsage?.heapUsed || 0) * 1.1; // 10% growth
    });
    
    console.log(`     Errors with significant memory growth: ${memoryGrowthErrors.length}`);
  }

  console.log('\n✅ Error handling test completed successfully!');
  console.log(`📊 Final error stats: ${errorCount} errors captured, ${functionsWithErrors.length} functions had errors`);
  console.log(`🎯 Error detection rate: ${((errorCount / timeline.summary.errors) * 100).toFixed(1)}% of errors were properly traced`);
}

// Run the test
if (require.main === module) {
  testErrorTracing().catch(console.error);
}