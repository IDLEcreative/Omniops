#!/usr/bin/env npx tsx

/**
 * Test Execution Tracer - Asynchronous Functions
 * Validates async function tracing, Promise handling, and timing
 */

import { createExecutionTracer, traceFunction } from './lib/dev-tools';

// Async test functions
async function fetchUserData(userId: string): Promise<{ id: string; name: string; email: string }> {
  console.log(`Fetching user data for ${userId}...`);
  
  // Simulate API call
  await delay(100);
  
  const userData = await getUserFromDatabase(userId);
  const enrichedData = await enrichUserData(userData);
  
  return enrichedData;
}

async function getUserFromDatabase(userId: string): Promise<{ id: string; name: string }> {
  console.log(`Querying database for user ${userId}...`);
  
  // Simulate database query
  await delay(50);
  
  return {
    id: userId,
    name: `User ${userId}`
  };
}

async function enrichUserData(userData: { id: string; name: string }): Promise<{ id: string; name: string; email: string }> {
  console.log(`Enriching data for ${userData.name}...`);
  
  // Simulate enrichment service call
  await delay(30);
  
  return {
    ...userData,
    email: `${userData.name.toLowerCase().replace(' ', '.')}@example.com`
  };
}

async function processMultipleUsers(userIds: string[]): Promise<Array<{ id: string; name: string; email: string }>> {
  console.log(`Processing ${userIds.length} users...`);
  
  // Process users in parallel
  const userPromises = userIds.map(id => fetchUserData(id));
  const users = await Promise.all(userPromises);
  
  return users;
}

async function sequentialProcessing(userIds: string[]): Promise<Array<{ id: string; name: string; email: string }>> {
  console.log(`Processing ${userIds.length} users sequentially...`);
  
  const users = [];
  for (const userId of userIds) {
    const user = await fetchUserData(userId);
    users.push(user);
  }
  
  return users;
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Async class for testing
class AsyncDataProcessor {
  async processData(data: string[]): Promise<string[]> {
    console.log(`Processing ${data.length} data items...`);
    
    const processed = [];
    for (const item of data) {
      const result = await this.processItem(item);
      processed.push(result);
    }
    
    return processed;
  }

  private async processItem(item: string): Promise<string> {
    await delay(10);
    return item.toUpperCase();
  }

  async batchProcess(data: string[]): Promise<string[]> {
    console.log(`Batch processing ${data.length} items...`);
    
    const batches = this.createBatches(data, 3);
    const results = [];
    
    for (const batch of batches) {
      const batchResults = await Promise.all(
        batch.map(item => this.processItem(item))
      );
      results.push(...batchResults);
    }
    
    return results;
  }

  private createBatches<T>(array: T[], batchSize: number): T[][] {
    const batches = [];
    for (let i = 0; i < array.length; i += batchSize) {
      batches.push(array.slice(i, i + batchSize));
    }
    return batches;
  }
}

async function testAsyncTracing() {
  console.log('🔍 Testing Asynchronous Function Tracing');
  console.log('=======================================\n');

  // Create tracer with async tracking enabled
  const tracer = createExecutionTracer({
    maxDepth: 50,
    maxHistory: 2000,
    trackArgs: true,
    trackReturnValues: true,
    trackMemory: true,
    trackStackTrace: true,
    asyncTracking: true // Enable async tracking
  });

  let traceCount = 0;

  // Listen for events
  tracer.on('trace', (trace) => {
    traceCount++;
    const asyncMarker = trace.isAsync ? '⚡' : '🔄';
    const typeMarker = trace.type === 'async_start' ? '⏯️ ' : 
                      trace.type === 'async_end' ? '⏹️ ' : 
                      trace.type === 'entry' ? '📞 ' : '📤 ';
    
    if (trace.type === 'entry' || trace.type === 'async_start') {
      console.log(`${typeMarker}${asyncMarker} ${' '.repeat(trace.depth * 2)}→ ${trace.functionName}(${trace.args ? JSON.stringify(trace.args).slice(0, 30) : ''}...)`);
    } else if (trace.type === 'exit' || trace.type === 'async_end') {
      console.log(`${typeMarker}${asyncMarker} ${' '.repeat(trace.depth * 2)}← ${trace.functionName} [${trace.duration?.toFixed(2)}ms]`);
    }
  });

  tracer.on('error', ({ trace, error }) => {
    console.error(`❌ Error in ${trace.functionName}:`, error.message);
  });

  console.log('1. Testing basic async function wrapping...');
  const tracedFetchUserData = tracer.wrap(fetchUserData, 'fetchUserData');
  const tracedGetUserFromDatabase = tracer.wrap(getUserFromDatabase, 'getUserFromDatabase');
  const tracedEnrichUserData = tracer.wrap(enrichUserData, 'enrichUserData');

  // Replace global functions
  (global as any).getUserFromDatabase = tracedGetUserFromDatabase;
  (global as any).enrichUserData = tracedEnrichUserData;

  const userData = await tracedFetchUserData('user123');
  console.log(`Single user result:`, userData);
  console.log(`Trace count so far: ${traceCount}\n`);

  console.log('2. Testing parallel async processing...');
  const tracedProcessMultipleUsers = tracer.wrap(processMultipleUsers, 'processMultipleUsers');
  
  const userIds = ['user1', 'user2', 'user3', 'user4'];
  const parallelResults = await tracedProcessMultipleUsers(userIds);
  console.log(`Parallel results: ${parallelResults.length} users processed`);
  console.log(`Trace count so far: ${traceCount}\n`);

  console.log('3. Testing sequential async processing...');
  const tracedSequentialProcessing = tracer.wrap(sequentialProcessing, 'sequentialProcessing');
  
  const sequentialResults = await tracedSequentialProcessing(['user5', 'user6']);
  console.log(`Sequential results: ${sequentialResults.length} users processed`);
  console.log(`Trace count so far: ${traceCount}\n`);

  console.log('4. Testing async class auto-instrumentation...');
  const processor = new AsyncDataProcessor();
  const tracedProcessor = tracer.autoInstrument(processor, {
    includePrivate: true,
    trackArgs: true,
    trackReturnValues: true
  });

  const testData = ['hello', 'world', 'async', 'tracing', 'test'];
  
  console.log('Sequential processing:');
  const sequentialData = await tracedProcessor.processData(testData);
  console.log(`Result:`, sequentialData);

  console.log('\nBatch processing:');
  const batchData = await tracedProcessor.batchProcess(testData);
  console.log(`Result:`, batchData);
  console.log(`Trace count so far: ${traceCount}\n`);

  console.log('5. Testing manual async tracing...');
  const callId = tracer.start('manualAsyncOperation', ['async', 'manual']);
  
  try {
    // Simulate async work
    await delay(50);
    const result = await Promise.resolve('async result');
    tracer.end(callId, result);
    console.log(`Manual async result: ${result}`);
  } catch (error) {
    tracer.end(callId, undefined, error as Error);
  }
  console.log();

  console.log('6. Analyzing async execution timeline...');
  const timeline = tracer.getTimeline();
  console.log(`📊 Async Timeline Summary:`);
  console.log(`   Duration: ${timeline.duration.toFixed(2)}ms`);
  console.log(`   Total calls: ${timeline.totalCalls}`);
  console.log(`   Function calls: ${timeline.summary.functionCalls}`);
  console.log(`   Async calls: ${timeline.summary.asyncCalls}`);
  console.log(`   Async percentage: ${((timeline.summary.asyncCalls / timeline.summary.functionCalls) * 100).toFixed(1)}%`);
  console.log(`   Max depth: ${timeline.maxDepth}`);
  console.log(`   Errors: ${timeline.summary.errors}\n`);

  console.log('7. Analyzing async call patterns...');
  const stats = tracer.getStats();
  console.log(`📈 Async Function Statistics:`);
  
  const asyncFunctions = Object.entries(stats)
    .filter(([_, stat]) => stat.asyncCount > 0)
    .sort((a, b) => b[1].asyncCount - a[1].asyncCount);
  
  asyncFunctions.slice(0, 5).forEach(([functionName, stat]) => {
    console.log(`   ${functionName}:`);
    console.log(`     Total calls: ${stat.count}`);
    console.log(`     Async calls: ${stat.asyncCount} (${((stat.asyncCount / stat.count) * 100).toFixed(1)}%)`);
    console.log(`     Avg time: ${stat.avgTime.toFixed(2)}ms`);
    console.log(`     Min/Max: ${stat.minTime.toFixed(2)}ms / ${stat.maxTime.toFixed(2)}ms`);
    console.log();
  });

  console.log('8. Generating async call graph...');
  const callGraph = tracer.getCallGraph();
  console.log(`📈 Async Call Graph:`);
  console.log(`   Nodes: ${callGraph.nodes.length}`);
  console.log(`   Edges: ${callGraph.edges.length}`);
  
  const asyncNodes = callGraph.nodes.filter(node => node.isAsync);
  console.log(`   Async nodes: ${asyncNodes.length}`);
  
  console.log('\n   Top async functions by time:');
  asyncNodes
    .sort((a, b) => b.totalTime - a.totalTime)
    .slice(0, 3)
    .forEach(node => {
      console.log(`   • ${node.functionName}: ${node.calls} calls, ${node.totalTime.toFixed(2)}ms total`);
    });

  console.log('\n9. Generating async sequence diagram...');
  const sequenceDiagram = tracer.getSequenceDiagram();
  const asyncInteractions = sequenceDiagram.interactions.filter(i => i.isAsync);
  
  console.log(`🔄 Async Sequence Analysis:`);
  console.log(`   Total interactions: ${sequenceDiagram.interactions.length}`);
  console.log(`   Async interactions: ${asyncInteractions.length} (${((asyncInteractions.length / sequenceDiagram.interactions.length) * 100).toFixed(1)}%)`);
  
  console.log('\n   Async interaction sample:');
  asyncInteractions.slice(0, 5).forEach(interaction => {
    console.log(`     ${interaction.from} ${interaction.type === 'call' ? '→' : '←'} ${interaction.to}: ${interaction.message} ${interaction.duration ? `[${interaction.duration.toFixed(2)}ms]` : ''}`);
  });
  console.log();

  console.log('10. Generating comprehensive async report...');
  const report = tracer.generateReport();
  console.log(`📋 Async Execution Report:`);
  console.log(`   Total execution time: ${report.summary.totalTime.toFixed(2)}ms`);
  console.log(`   Async call percentage: ${report.summary.asyncCallsPercent.toFixed(1)}%`);
  console.log(`   Concurrent operations detected: ${report.callGraph.edges.length > report.callGraph.nodes.length ? 'Yes' : 'No'}`);
  
  if (report.performance.bottlenecks.length > 0) {
    console.log('\n   Async performance bottlenecks:');
    report.performance.bottlenecks
      .filter(b => stats[b.function]?.asyncCount > 0)
      .slice(0, 3)
      .forEach(bottleneck => {
        console.log(`     • ${bottleneck.function}: impact ${bottleneck.impact.toFixed(1)} - ${bottleneck.reason}`);
      });
  }

  if (report.recommendations.length > 0) {
    console.log('\n   Async-specific recommendations:');
    report.recommendations
      .filter(rec => rec.toLowerCase().includes('async') || rec.toLowerCase().includes('parallel'))
      .forEach(rec => console.log(`     • ${rec}`));
  }

  console.log('\n11. Chrome DevTools async trace...');
  const chromeTrace = tracer.exportChromeTrace();
  const asyncEvents = chromeTrace.traceEvents.filter(event => 
    event.args && 'isAsync' in event.args || event.name.toLowerCase().includes('async')
  );
  
  console.log(`   Total trace events: ${chromeTrace.traceEvents.length}`);
  console.log(`   Async-related events: ${asyncEvents.length}`);
  console.log(`   Event types: ${[...new Set(chromeTrace.traceEvents.map(e => e.ph))].join(', ')}`);

  console.log('\n✅ Asynchronous tracing test completed successfully!');
  console.log(`📊 Final async stats: ${asyncFunctions.length} async functions, ${timeline.summary.asyncCalls} async calls`);
  console.log(`⚡ Async efficiency: ${(timeline.summary.asyncCalls / timeline.totalCalls * 100).toFixed(1)}% of total calls were async`);
}

// Run the test
if (require.main === module) {
  testAsyncTracing().catch(console.error);
}