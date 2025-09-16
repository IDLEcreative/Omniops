#!/usr/bin/env npx tsx

/**
 * Test Execution Tracer - Synchronous Functions
 * Validates basic function tracing, call stacks, and statistics
 */

import { createExecutionTracer, traceFunction, traceClass } from './lib/dev-tools';

// Test classes and functions
class Calculator {
  add(a: number, b: number): number {
    return this.sum(a, b);
  }

  private sum(a: number, b: number): number {
    return a + b;
  }

  multiply(a: number, b: number): number {
    let result = 0;
    for (let i = 0; i < b; i++) {
      result = this.add(result, a);
    }
    return result;
  }

  fibonacci(n: number): number {
    if (n <= 1) return n;
    return this.fibonacci(n - 1) + this.fibonacci(n - 2);
  }
}

function performComplexOperation(data: number[]): number {
  console.log('Starting complex operation with', data.length, 'items');
  
  // Nested function calls
  const doubled = doubleArray(data);
  const summed = sumArray(doubled);
  const processed = processResult(summed);
  
  return processed;
}

function doubleArray(arr: number[]): number[] {
  return arr.map(x => x * 2);
}

function sumArray(arr: number[]): number {
  return arr.reduce((sum, val) => sum + val, 0);
}

function processResult(value: number): number {
  // Simulate some processing time
  let result = value;
  for (let i = 0; i < 1000; i++) {
    result = Math.sqrt(result * result + 1);
  }
  return Math.floor(result);
}

async function testSyncTracing() {
  console.log('🔍 Testing Synchronous Function Tracing');
  console.log('=====================================\n');

  // Create tracer with comprehensive options
  const tracer = createExecutionTracer({
    maxDepth: 50,
    maxHistory: 1000,
    trackArgs: true,
    trackReturnValues: true,
    trackMemory: true,
    trackStackTrace: true,
    asyncTracking: false // Focus on sync for this test
  });

  // Listen for events
  tracer.on('trace', (trace) => {
    if (trace.type === 'entry') {
      console.log(`📞 ${' '.repeat(trace.depth * 2)}→ ${trace.functionName}(${trace.args ? JSON.stringify(trace.args).slice(0, 50) : ''})`);
    } else if (trace.type === 'exit') {
      console.log(`📤 ${' '.repeat(trace.depth * 2)}← ${trace.functionName} [${trace.duration?.toFixed(2)}ms]`);
    }
  });

  tracer.on('error', ({ trace, error }) => {
    console.error(`❌ Error in ${trace.functionName}:`, error.message);
  });

  tracer.on('maxDepthReached', ({ functionName, depth }) => {
    console.warn(`⚠️  Max depth reached in ${functionName} at depth ${depth}`);
  });

  console.log('1. Testing basic function wrapping...');
  const tracedPerformComplexOperation = tracer.wrap(performComplexOperation, 'performComplexOperation');
  const tracedDoubleArray = tracer.wrap(doubleArray, 'doubleArray');
  const tracedSumArray = tracer.wrap(sumArray, 'sumArray');
  const tracedProcessResult = tracer.wrap(processResult, 'processResult');

  // Replace global functions with traced versions
  (global as any).doubleArray = tracedDoubleArray;
  (global as any).sumArray = tracedSumArray;
  (global as any).processResult = tracedProcessResult;

  const testData = [1, 2, 3, 4, 5];
  const result = tracedPerformComplexOperation(testData);
  console.log(`Result: ${result}\n`);

  console.log('2. Testing class auto-instrumentation...');
  const calc = new Calculator();
  const tracedCalc = tracer.autoInstrument(calc, {
    includePrivate: true,
    trackArgs: true,
    trackReturnValues: true
  });

  console.log('Testing addition:', tracedCalc.add(5, 3));
  console.log('Testing multiplication:', tracedCalc.multiply(4, 3));
  console.log('Testing fibonacci(8):', tracedCalc.fibonacci(8));
  console.log();

  console.log('3. Testing manual tracing...');
  const callId = tracer.start('manualOperation', ['arg1', 'arg2']);
  
  // Simulate some work
  let sum = 0;
  for (let i = 0; i < 1000; i++) {
    sum += Math.random();
  }
  
  tracer.end(callId, sum);
  console.log(`Manual operation result: ${sum}\n`);

  console.log('4. Generating execution timeline...');
  const timeline = tracer.getTimeline();
  console.log(`📊 Timeline Summary:`);
  console.log(`   Duration: ${timeline.duration.toFixed(2)}ms`);
  console.log(`   Total calls: ${timeline.totalCalls}`);
  console.log(`   Function calls: ${timeline.summary.functionCalls}`);
  console.log(`   Max depth: ${timeline.maxDepth}`);
  console.log(`   Unique functions: ${timeline.summary.uniqueFunctions}`);
  console.log(`   Errors: ${timeline.summary.errors}\n`);

  console.log('5. Generating call graph...');
  const callGraph = tracer.getCallGraph();
  console.log(`📈 Call Graph:`);
  console.log(`   Nodes: ${callGraph.nodes.length}`);
  console.log(`   Edges: ${callGraph.edges.length}`);
  
  console.log('\n   Top functions by call count:');
  callGraph.nodes
    .sort((a, b) => b.calls - a.calls)
    .slice(0, 5)
    .forEach(node => {
      console.log(`   • ${node.functionName}: ${node.calls} calls, ${node.totalTime.toFixed(2)}ms total`);
    });

  console.log('\n6. Generating sequence diagram...');
  const sequenceDiagram = tracer.getSequenceDiagram();
  console.log(`🔄 Sequence Diagram (${sequenceDiagram.participants.length} participants):`);
  console.log(`Participants: ${sequenceDiagram.participants.join(', ')}`);
  console.log(`Interactions: ${sequenceDiagram.interactions.length}`);
  
  console.log('\nMermaid code (first 10 lines):');
  const mermaidLines = sequenceDiagram.mermaidCode.split('\n').slice(0, 10);
  mermaidLines.forEach(line => console.log(`   ${line}`));
  if (sequenceDiagram.mermaidCode.split('\n').length > 10) {
    console.log('   ...(truncated)');
  }
  console.log();

  console.log('7. Analyzing call statistics...');
  const stats = tracer.getStats();
  console.log(`📈 Function Statistics:`);
  
  Object.entries(stats)
    .sort((a, b) => b[1].totalTime - a[1].totalTime)
    .slice(0, 5)
    .forEach(([functionName, stat]) => {
      console.log(`   ${functionName}:`);
      console.log(`     Calls: ${stat.count}`);
      console.log(`     Total time: ${stat.totalTime.toFixed(2)}ms`);
      console.log(`     Avg time: ${stat.avgTime.toFixed(2)}ms`);
      console.log(`     Min/Max: ${stat.minTime.toFixed(2)}ms / ${stat.maxTime.toFixed(2)}ms`);
      console.log(`     Errors: ${stat.errorCount}`);
      console.log(`     Recursive calls: ${stat.recursiveCount}`);
      console.log();
    });

  console.log('8. Generating comprehensive report...');
  const report = tracer.generateReport();
  console.log(`📋 Comprehensive Report:`);
  console.log(`   Total calls: ${report.summary.totalCalls}`);
  console.log(`   Total time: ${report.summary.totalTime.toFixed(2)}ms`);
  console.log(`   Max depth: ${report.summary.maxDepth}`);
  console.log(`   Error rate: ${(report.summary.errorRate * 100).toFixed(2)}%`);
  console.log(`   Async calls: ${report.summary.asyncCallsPercent.toFixed(1)}%`);
  
  console.log('\n   Top 3 functions by time:');
  report.summary.topFunctions.slice(0, 3).forEach(fn => {
    console.log(`     • ${fn.name}: ${fn.calls} calls, ${fn.time.toFixed(2)}ms`);
  });

  console.log('\n   Slowest 3 functions:');
  report.summary.slowestFunctions.slice(0, 3).forEach(fn => {
    console.log(`     • ${fn.name}: avg ${fn.avgTime.toFixed(2)}ms, max ${fn.maxTime.toFixed(2)}ms`);
  });

  if (report.performance.bottlenecks.length > 0) {
    console.log('\n   Performance bottlenecks:');
    report.performance.bottlenecks.slice(0, 3).forEach(bottleneck => {
      console.log(`     • ${bottleneck.function}: impact ${bottleneck.impact.toFixed(1)} - ${bottleneck.reason}`);
    });
  }

  if (report.performance.recursionIssues.length > 0) {
    console.log('\n   Recursion issues:');
    report.performance.recursionIssues.forEach(issue => {
      console.log(`     • ${issue.function}: max depth ${issue.maxDepth}, ${issue.calls} recursive calls`);
    });
  }

  if (report.recommendations.length > 0) {
    console.log('\n   Recommendations:');
    report.recommendations.forEach(rec => console.log(`     • ${rec}`));
  }

  console.log('\n9. Export formats...');
  console.log(`   Chrome trace events: ${report.exportFormats.chrome?.traceEvents.length || 0}`);
  console.log(`   CSV data: ${report.exportFormats.csv?.split('\n').length || 0} lines`);
  console.log(`   JSON data: ${report.exportFormats.json?.length || 0} characters`);
  console.log(`   Mermaid code: ${report.exportFormats.mermaid?.split('\n').length || 0} lines`);

  console.log('\n✅ Synchronous tracing test completed successfully!');
  console.log(`📊 Final stats: ${Object.keys(stats).length} functions traced, ${timeline.totalCalls} total calls`);
}

// Run the test
if (require.main === module) {
  testSyncTracing().catch(console.error);
}