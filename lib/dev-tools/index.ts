/**
 * Universal Developer Tools Toolkit
 * Zero-dependency performance and debugging utilities
 */

// Performance Profiler exports
export {
  PerformanceProfiler,
  profileFunction,
  profiler,
  time
} from './performance-profiler';

// Query Inspector exports
export {
  QueryInspector,
  createQueryInspector,
  inspectQueries
} from './query-inspector';

// Log Analyzer exports
export {
  LogAnalyzer,
  createLogAnalyzer,
  analyzeLogFile,
  analyzeLogText,
  createLogMonitor
} from './log-analyzer';

// Execution Tracer exports
export {
  ExecutionTracer,
  executionTracer,
  traceFunction,
  traceClass,
  createExecutionTracer
} from './execution-tracer';

// Memory Monitor exports
export {
  MemoryMonitor,
  createMemoryMonitor,
  memoryMonitor,
  quickMemoryCheck,
  monitorMemory
} from './memory-monitor';

// Load Tester exports
export {
  LoadTester,
  createLoadTester,
  loadTest,
  loadTester
} from './load-tester';

// Type exports
export type {
  PerformanceMetrics,
  FunctionCallInfo,
  ProfilerStats,
  MemorySnapshot,
  ChromeDevToolsProfile,
  ChromeProfileNode,
  ProfilerReport,
  AutoInstrumentOptions,
  ProfilerOptions,
  QueryExecution,
  QueryPattern,
  NPlusOneDetection,
  SlowQuery,
  QueryInspectorStats,
  QueryInspectorOptions,
  LogEntry,
  LogLevel,
  LogFormat,
  LogSeverity,
  LogCategory,
  LogPattern,
  ErrorGroup,
  TimelineBucket,
  LogStatistics,
  SecurityEvent,
  SecurityEventType,
  PerformanceIssue,
  PerformanceIssueType,
  LogAnalyzerOptions,
  LogAnalysisReport,
  LogStreamOptions,
  AlertCondition,
  Alert,
  AlertAction,
  TraceEntry,
  CallStats,
  CallGraph,
  CallGraphNode,
  CallGraphEdge,
  SequenceDiagram,
  SequenceInteraction,
  ChromeTraceEvent,
  ChromeTraceFormat,
  ExecutionTimeline,
  TracerOptions,
  AutoInstrumentTracerOptions,
  TraceReport,
  MemoryUsage,
  MemoryTrend,
  MemoryLeak,
  ObjectTracking,
  GCEvent,
  MemoryPressure,
  MemoryAlert,
  MemoryMonitorOptions,
  MemoryStatistics,
  MemoryReport,
  HeapDumpOptions,
  MemoryComparisonResult,
  LoadTestRequest,
  LoadTestPhase,
  LoadTestWorker,
  LoadTestMetrics,
  LoadTestConfig,
  LoadTestProgress,
  LoadTestResult,
  LoadTestOptions,
  LoadTestStats,
  ConnectionPoolStats
} from './types';

/**
 * Quick start utilities - Import these for immediate use
 */

// Re-export main utilities directly (no top-level await needed)
export { profileFunction as quickProfile, profiler as profile } from './performance-profiler';
export { createQueryInspector as quickQueryInspector, inspectQueries as quickInspect } from './query-inspector';
export { createLogAnalyzer as quickLogAnalyzer, analyzeLogFile as quickAnalyzeFile } from './log-analyzer';
export { traceFunction as quickTrace, executionTracer as tracer } from './execution-tracer';
export { createMemoryMonitor as quickMemoryMonitor, memoryMonitor as monitor, quickMemoryCheck as quickMemory } from './memory-monitor';
export { createLoadTester as quickLoadTester, loadTest as quickLoadTest, loadTester as tester } from './load-tester';

/**
 * Usage Examples:
 * 
 * // Basic timing
 * import { profileFunction } from './lib/dev-tools';
 * const timedFunction = profileFunction(myFunction, 'MyFunction');
 * 
 * // Advanced profiling
 * import { profiler } from './lib/dev-tools';
 * const wrappedFn = profiler.wrap(myFunction);
 * const instrumentedClass = profiler.autoInstrument(myClass);
 * 
 * // Manual timing
 * profiler.start('operation');
 * // ... do work
 * const metrics = profiler.end('operation');
 * 
 * // Generate reports
 * const report = profiler.generateReport();
 * const chromeProfile = profiler.exportChromeProfile();
 * 
 * // Query inspection
 * import { createQueryInspector, inspectQueries } from './lib/dev-tools';
 * 
 * // Quick wrapper
 * const { client, inspector } = inspectQueries(supabaseClient);
 * 
 * // Manual setup
 * const queryInspector = createQueryInspector({
 *   slowQueryThreshold: 500,
 *   enableNPlusOneDetection: true
 * });
 * const wrappedClient = queryInspector.wrap(dbClient);
 * 
 * // Listen for events
 * queryInspector.on('slowQuery', (query) => console.warn('Slow query detected:', query));
 * queryInspector.on('nPlusOne', (issues) => console.error('N+1 detected:', issues));
 * 
 * // Generate reports
 * const stats = queryInspector.generateStats();
 * const json = queryInspector.exportJSON();
 * const csv = queryInspector.exportCSV();
 * 
 * // Log Analysis
 * import { createLogAnalyzer, analyzeLogFile } from './lib/dev-tools';
 * 
 * // Quick file analysis
 * const report = await analyzeLogFile('/path/to/app.log');
 * console.log(`Analyzed ${report.summary.totalEntries} log entries`);
 * console.log(`Error rate: ${(report.summary.errorRate * 100).toFixed(2)}%`);
 * 
 * // Advanced analyzer setup
 * const analyzer = createLogAnalyzer({
 *   enablePatternMatching: true,
 *   enableSecurityDetection: true,
 *   enablePerformanceAnalysis: true,
 *   realTimeAlerts: true,
 *   customPatterns: [
 *     {
 *       id: 'my-pattern',
 *       name: 'Custom Error Pattern',
 *       pattern: /CUSTOM_ERROR_\d+/,
 *       severity: 'critical',
 *       category: 'error',
 *       description: 'Custom application error',
 *       enabled: true
 *     }
 *   ]
 * });
 * 
 * // Parse logs from various sources
 * await analyzer.parseFile('/var/log/application.log', 'json');
 * await analyzer.parseFile('/var/log/nginx/access.log', 'nginx');
 * await analyzer.parseFile('/var/log/apache2/access.log', 'apache');
 * 
 * // Real-time monitoring
 * import { createReadStream } from 'fs';
 * const { analyzer, stream } = createLogMonitor(
 *   createReadStream('/var/log/app.log'),
 *   { parseLines: true, skipEmpty: true }
 * );
 * 
 * // Listen for events
 * analyzer.on('securityEvent', (event) => {
 *   console.warn('Security threat detected:', event.type);
 * });
 * analyzer.on('performanceIssue', (issue) => {
 *   console.warn('Performance issue:', issue.type);
 * });
 * analyzer.on('alert', (alert) => {
 *   console.error('Alert triggered:', alert.message);
 * });
 * 
 * // Generate comprehensive reports
 * const logReport = analyzer.generateReport();
 * const html = analyzer.exportHTML();
 * const csv = analyzer.exportCSV();
 * const json = analyzer.exportJSON();
 * 
 * // Execution Tracing
 * import { createExecutionTracer, traceFunction, traceClass } from './lib/dev-tools';
 * 
 * // Quick function tracing
 * const tracedFunction = traceFunction(myFunction, 'MyFunction');
 * const result = tracedFunction(args);
 * 
 * // Manual tracing
 * import { executionTracer } from './lib/dev-tools';
 * const callId = executionTracer.start('operation');
 * // ... do work
 * executionTracer.end(callId, result);
 * 
 * // Auto-instrument classes
 * const TracedClass = traceClass(MyClass, {
 *   includePrivate: false,
 *   excludePatterns: [/^_internal/],
 *   trackArgs: true,
 *   trackReturnValues: true
 * });
 * 
 * // Advanced tracer setup
 * const tracer = createExecutionTracer({
 *   maxDepth: 50,
 *   maxHistory: 5000,
 *   trackArgs: true,
 *   trackReturnValues: true,
 *   trackMemory: true,
 *   asyncTracking: true,
 *   excludePatterns: [/^_/, /^test/],
 *   sampleRate: 0.8 // 80% sampling for performance
 * });
 * 
 * // Wrap functions and classes
 * const wrappedFn = tracer.wrap(myFunction, 'MyFunction');
 * const instrumentedClass = tracer.autoInstrument(myClass);
 * 
 * // Listen for events
 * tracer.on('trace', (trace) => console.log('Function called:', trace.functionName));
 * tracer.on('error', ({ trace, error }) => console.error('Error in:', trace.functionName, error));
 * tracer.on('maxDepthReached', ({ functionName, depth }) => 
 *   console.warn('Max depth reached:', functionName, depth));
 * 
 * // Generate comprehensive reports
 * const report = tracer.generateReport();
 * console.log(`Traced ${report.summary.totalCalls} function calls`);
 * console.log(`Max call depth: ${report.summary.maxDepth}`);
 * console.log(`Error rate: ${(report.summary.errorRate * 100).toFixed(2)}%`);
 * 
 * // Get execution timeline
 * const timeline = tracer.getTimeline();
 * console.log(`Execution took ${timeline.duration.toFixed(2)}ms`);
 * 
 * // Generate call graph
 * const callGraph = tracer.getCallGraph();
 * console.log(`Call graph has ${callGraph.nodes.length} nodes and ${callGraph.edges.length} edges`);
 * 
 * // Generate sequence diagram (Mermaid format)
 * const sequenceDiagram = tracer.getSequenceDiagram();
 * console.log('Mermaid sequence diagram:');
 * console.log(sequenceDiagram.mermaidCode);
 * 
 * // Export to various formats
 * const chromeTrace = tracer.exportChromeTrace(); // Chrome DevTools format
 * const csv = tracer.exportCSV();
 * const json = JSON.stringify(tracer.getTimeline(), null, 2);
 * 
 * // Performance analysis
 * const stats = tracer.getStats();
 * Object.entries(stats).forEach(([functionName, stat]) => {
 *   console.log(`${functionName}: ${stat.count} calls, avg ${stat.avgTime.toFixed(2)}ms`);
 * });
 * 
 * // Reset tracer state
 * tracer.reset();
 * 
 * // Memory Monitoring
 * import { createMemoryMonitor, memoryMonitor, quickMemoryCheck, monitorMemory } from './lib/dev-tools';
 * 
 * // Quick memory check
 * const currentMemory = quickMemoryCheck();
 * console.log(`Current heap usage: ${(currentMemory.heapUsed / 1024 / 1024).toFixed(2)} MB`);
 * 
 * // Basic memory monitoring
 * const monitor = createMemoryMonitor({
 *   samplingInterval: 5000,     // Sample every 5 seconds
 *   historySize: 500,           // Keep 500 snapshots
 *   enableGCMonitoring: true,   // Monitor garbage collection
 *   enableObjectTracking: true, // Track specific objects
 *   leakDetectionThreshold: 1024 * 1024, // 1MB/s growth = leak
 *   pressureThresholds: {
 *     heapUsed: 80,             // Alert at 80% heap usage
 *     rss: 85,                  // Alert at 85% RSS usage
 *     external: 75              // Alert at 75% external memory
 *   }
 * });
 * 
 * // Start monitoring
 * monitor.start();
 * 
 * // Listen for events
 * monitor.on('leakDetected', (leak) => {
 *   console.error('Memory leak detected:', leak.growthRate / 1024 / 1024, 'MB/s');
 * });
 * monitor.on('memoryPressure', (pressure) => {
 *   console.warn('Memory pressure level:', pressure.level);
 * });
 * monitor.on('alert', (alert) => {
 *   console.log('Memory alert:', alert.message);
 * });
 * 
 * // Global monitor instance
 * const globalMonitor = memoryMonitor();
 * globalMonitor.start();
 * 
 * // Monitor specific function memory usage
 * const memoryMonitoredFunction = monitorMemory(myExpensiveFunction, {
 *   samplingInterval: 1000,
 *   enableObjectTracking: true
 * });
 * 
 * const result = memoryMonitoredFunction(args);
 * const memoryReport = memoryMonitoredFunction.getMemoryReport();
 * console.log('Function memory impact:', memoryReport.summary);
 * 
 * // Take manual snapshots
 * const beforeSnapshot = monitor.takeSnapshot();
 * // ... do memory-intensive work
 * const afterSnapshot = monitor.takeSnapshot();
 * 
 * // Compare snapshots
 * const comparison = monitor.compareSnapshots(beforeSnapshot, afterSnapshot);
 * if (comparison.significant) {
 *   console.log('Significant memory change detected:');
 *   console.log(`Heap usage changed by ${comparison.percentageChange.heapUsed.toFixed(2)}%`);
 * }
 * 
 * // Track specific objects for leak detection
 * const myObject = { data: new Array(1000000) };
 * const trackingId = monitor.trackObject(myObject, {
 *   location: { function: 'createLargeObject', file: 'app.js', line: 42 }
 * });
 * 
 * // Force garbage collection
 * if (monitor.forceGC()) {
 *   console.log('Garbage collection forced successfully');
 * }
 * 
 * // Generate heap dump (if enabled and v8 available)
 * const heapDumpFile = monitor.generateHeapDump({
 *   filename: 'memory-analysis.heapsnapshot',
 *   format: 'heapsnapshot'
 * });
 * if (heapDumpFile) {
 *   console.log('Heap dump saved to:', heapDumpFile);
 * }
 * 
 * // Get comprehensive statistics
 * const stats = monitor.getStatistics();
 * console.log(`Memory monitoring summary:`);
 * console.log(`- Total samples: ${stats.totalSamples}`);
 * console.log(`- Peak memory: ${(stats.usage.peak.heapUsed / 1024 / 1024).toFixed(2)} MB`);
 * console.log(`- Current trend: ${stats.trends.heapUsed.isIncreasing ? 'increasing' : 'stable'}`);
 * console.log(`- Growth rate: ${(stats.trends.heapUsed.growthRate / 1024).toFixed(2)} KB/s`);
 * console.log(`- Leaks detected: ${stats.leaks.detected.length}`);
 * console.log(`- GC events: ${stats.gc.totalEvents}`);
 * 
 * // Generate comprehensive report
 * const report = monitor.generateReport();
 * console.log(`Memory health status: ${report.summary.status}`);
 * console.log(`Total issues: ${report.summary.totalIssues}`);
 * 
 * if (report.summary.recommendations.length > 0) {
 *   console.log('Immediate recommendations:');
 *   report.summary.recommendations.forEach(rec => console.log(`- ${rec}`));
 * }
 * 
 * // Export data for analysis
 * const csvData = monitor.exportCSV();
 * const jsonData = monitor.exportJSON();
 * 
 * // Set baseline for future comparisons
 * monitor.setBaseline(); // Use current snapshot as baseline
 * 
 * // Later, compare against baseline
 * const currentSnapshot = monitor.getCurrentSnapshot();
 * const baselineComparison = monitor.compareSnapshots(
 *   monitor.getBaseline()!,
 *   currentSnapshot
 * );
 * 
 * if (baselineComparison.analysis.isMemoryGrowing) {
 *   console.log('Memory has grown since baseline by:', 
 *     (baselineComparison.diff.heapUsed / 1024 / 1024).toFixed(2), 'MB');
 * }
 * 
 * // Clean up
 * monitor.stop();
 * 
 * // Load Testing
 * import { createLoadTester, loadTest, LoadTester } from './lib/dev-tools';
 * 
 * // Quick load test
 * const result = await loadTest('https://api.example.com/endpoint', 50, 60000);
 * console.log(`Peak RPS: ${result.summary.peakRPS.toFixed(2)}`);
 * console.log(`Average response time: ${result.overallMetrics.averageResponseTime.toFixed(2)}ms`);
 * console.log(`Error rate: ${(result.overallMetrics.errorRate * 100).toFixed(2)}%`);
 * console.log(`Overall grade: ${result.summary.grade}`);
 * 
 * // Advanced load testing setup
 * const loadTester = createLoadTester({
 *   url: 'https://api.example.com/heavy-endpoint',
 *   method: 'POST',
 *   headers: {
 *     'Content-Type': 'application/json',
 *     'Authorization': 'Bearer token123'
 *   },
 *   body: JSON.stringify({ test: 'data', size: 'large' }),
 *   timeout: 30000,
 *   retries: 2,
 *   
 *   // Load characteristics
 *   concurrency: 100,              // 100 concurrent users
 *   requestsPerSecond: 500,        // Target 500 RPS
 *   totalRequests: 50000,          // Send 50k total requests
 *   
 *   // Test phases
 *   warmupDuration: 30000,         // 30s warmup
 *   rampupDuration: 120000,        // 2min rampup
 *   rampupTarget: 200,             // Ramp to 200 concurrent users
 *   sustainedDuration: 300000,     // 5min sustained load
 *   cooldownDuration: 60000,       // 1min cooldown
 *   
 *   // Stress testing
 *   enableStressTesting: true,
 *   stressMaxConcurrency: 500,     // Push to 500 concurrent users
 *   stressRampupStep: 25,          // Increase by 25 each step
 *   stressStepDuration: 30000,     // 30s per stress step
 *   
 *   // Connection settings
 *   keepAlive: true,
 *   maxSockets: 1000,
 *   maxSocketsPerHost: 200,
 *   
 *   // Stop conditions
 *   maxErrors: 5000,               // Stop if 5000+ errors
 *   maxErrorRate: 0.1,             // Stop if >10% error rate
 *   targetResponseTime: 5000,      // Stop if response time > 5s consistently
 * }, {
 *   // Options
 *   enableMetricsCollection: true,
 *   enableRequestSampling: true,
 *   requestSampleRate: 0.05,       // Sample 5% of requests
 *   enableErrorSampling: true,
 *   errorSampleRate: 1.0,          // Sample all errors
 *   maxStoredRequests: 50000,
 *   maxStoredErrors: 5000,
 *   enableJitter: true,            // Add randomness to timing
 *   jitterPercent: 15,             // ±15% jitter
 *   validateResponse: (response) => {
 *     return response.statusCode === 200 && response.headers['content-type']?.includes('json');
 *   },
 *   customErrorClassifier: (error) => {
 *     if (error.code === 'ECONNRESET') return 'connection_reset';
 *     if (error.code === 'ETIMEDOUT') return 'timeout';
 *     return error.name;
 *   },
 *   enableResourceMonitoring: true,
 *   gracefulShutdown: true,
 *   shutdownTimeout: 60000
 * });
 * 
 * // Listen for real-time events
 * loadTester.on('start', ({ timestamp, config }) => {
 *   console.log('Load test started:', new Date(timestamp).toISOString());
 *   console.log('Target URL:', config.url);
 * });
 * 
 * loadTester.on('phaseStart', ({ phase, timestamp }) => {
 *   console.log(`Phase ${phase} started at ${new Date(timestamp).toISOString()}`);
 * });
 * 
 * loadTester.on('progress', (progress) => {
 *   console.log(`Phase: ${progress.phase}, Progress: ${(progress.progress * 100).toFixed(1)}%`);
 *   console.log(`Current RPS: ${progress.currentMetrics.requestsPerSecond.toFixed(2)}`);
 *   console.log(`Avg Response Time: ${progress.currentMetrics.averageResponseTime.toFixed(2)}ms`);
 *   console.log(`Error Rate: ${(progress.currentMetrics.errorRate * 100).toFixed(2)}%`);
 *   console.log(`Active Connections: ${progress.currentConcurrency}`);
 *   
 *   if (!progress.isStable) {
 *     console.warn('Performance metrics are unstable');
 *   }
 *   
 *   if (progress.recommendations.length > 0) {
 *     console.log('Recommendations:', progress.recommendations.join(', '));
 *   }
 * });
 * 
 * loadTester.on('requestComplete', (request) => {
 *   if (request.duration! > 10000) {
 *     console.warn(`Slow request detected: ${request.duration}ms for ${request.url}`);
 *   }
 * });
 * 
 * loadTester.on('requestError', ({ request, error }) => {
 *   console.error(`Request failed: ${error.message} for ${request.url}`);
 * });
 * 
 * loadTester.on('breakingPoint', ({ concurrency, metrics }) => {
 *   console.warn(`Breaking point reached at ${concurrency} concurrent users:`);
 *   console.warn(`Error rate: ${(metrics.errorRate * 100).toFixed(2)}%`);
 *   console.warn(`Avg response time: ${metrics.averageResponseTime.toFixed(2)}ms`);
 * });
 * 
 * loadTester.on('maxErrorsReached', ({ errorCount }) => {
 *   console.error(`Test stopped: Maximum errors reached (${errorCount})`);
 * });
 * 
 * // Start the load test
 * console.log('Starting comprehensive load test...');
 * const testResult = await loadTester.start();
 * 
 * // Analyze results
 * console.log('\\n=== LOAD TEST RESULTS ===');
 * console.log(`Status: ${testResult.summary.status}`);
 * console.log(`Duration: ${(testResult.summary.duration / 1000).toFixed(2)}s`);
 * console.log(`Overall Grade: ${testResult.summary.grade} (${testResult.summary.overallScore}/100)`);
 * console.log(`Peak RPS: ${testResult.summary.peakRPS.toFixed(2)}`);
 * console.log(`Average RPS: ${testResult.summary.averageRPS.toFixed(2)}`);
 * console.log(`Total Data Transferred: ${testResult.summary.totalDataTransferred}`);
 * 
 * console.log('\\n=== OVERALL METRICS ===');
 * const overall = testResult.overallMetrics;
 * console.log(`Total Requests: ${overall.totalRequests}`);
 * console.log(`Successful: ${overall.completedRequests} (${(overall.successRate * 100).toFixed(2)}%)`);
 * console.log(`Failed: ${overall.failedRequests} (${(overall.errorRate * 100).toFixed(2)}%)`);
 * console.log(`Average Response Time: ${overall.averageResponseTime.toFixed(2)}ms`);
 * console.log(`P50 Response Time: ${overall.p50ResponseTime.toFixed(2)}ms`);
 * console.log(`P95 Response Time: ${overall.p95ResponseTime.toFixed(2)}ms`);
 * console.log(`P99 Response Time: ${overall.p99ResponseTime.toFixed(2)}ms`);
 * console.log(`Max Concurrent Requests: ${overall.maxConcurrentRequests}`);
 * 
 * console.log('\\n=== PHASE BREAKDOWN ===');
 * Object.entries(testResult.phases).forEach(([phase, metrics]) => {
 *   if (metrics.totalRequests > 0) {
 *     console.log(`${phase.toUpperCase()}:`);
 *     console.log(`  RPS: ${metrics.requestsPerSecond.toFixed(2)}`);
 *     console.log(`  Avg Response Time: ${metrics.averageResponseTime.toFixed(2)}ms`);
 *     console.log(`  P95 Response Time: ${metrics.p95ResponseTime.toFixed(2)}ms`);
 *     console.log(`  Success Rate: ${(metrics.successRate * 100).toFixed(2)}%`);
 *     console.log(`  Requests: ${metrics.totalRequests}`);
 *   }
 * });
 * 
 * console.log('\\n=== PERFORMANCE ANALYSIS ===');
 * if (testResult.performance.bottlenecks.length > 0) {
 *   console.log('Bottlenecks detected:');
 *   testResult.performance.bottlenecks.forEach(bottleneck => {
 *     console.log(`- ${bottleneck.type}: ${bottleneck.description} (${bottleneck.severity})`);
 *     console.log(`  Impact: ${bottleneck.impact}`);
 *     console.log(`  Suggestions: ${bottleneck.suggestions.join(', ')}`);
 *   });
 * }
 * 
 * console.log('\\nScalability:');
 * console.log(`- Max Stable RPS: ${testResult.performance.scalability.maxStableRPS.toFixed(2)}`);
 * console.log(`- Max Stable Concurrency: ${testResult.performance.scalability.maxStableConcurrency}`);
 * console.log(`- Scalability Factor: ${testResult.performance.scalability.scalabilityFactor.toFixed(2)}`);
 * 
 * console.log('\\nReliability:');
 * console.log(`- MTBF: ${(testResult.performance.reliability.meanTimeBetweenFailures / 1000).toFixed(2)}s`);
 * console.log(`- Stability Score: ${(testResult.performance.reliability.stabilityScore * 100).toFixed(2)}%`);
 * console.log(`- Error Clusters: ${testResult.performance.reliability.errorClusters.length}`);
 * 
 * console.log('\\n=== RECOMMENDATIONS ===');
 * if (testResult.recommendations.immediate.length > 0) {
 *   console.log('Immediate Actions:');
 *   testResult.recommendations.immediate.forEach(rec => console.log(`- ${rec}`));
 * }
 * 
 * if (testResult.recommendations.capacity.length > 0) {
 *   console.log('\\nCapacity Planning:');
 *   testResult.recommendations.capacity.forEach(rec => console.log(`- ${rec}`));
 * }
 * 
 * if (testResult.recommendations.optimization.length > 0) {
 *   console.log('\\nOptimization:');
 *   testResult.recommendations.optimization.forEach(rec => console.log(`- ${rec}`));
 * }
 * 
 * if (testResult.recommendations.monitoring.length > 0) {
 *   console.log('\\nMonitoring:');
 *   testResult.recommendations.monitoring.forEach(rec => console.log(`- ${rec}`));
 * }
 * 
 * // Export results for further analysis
 * if (testResult.exportData) {
 *   console.log('\\n=== EXPORT OPTIONS ===');
 *   console.log('JSON report available in testResult.exportData.json');
 *   console.log('CSV data available in testResult.exportData.csv');
 *   console.log('HTML report available in testResult.exportData.html');
 *   
 *   // Save to files (example)
 *   // require('fs').writeFileSync('load-test-report.json', testResult.exportData.json);
 *   // require('fs').writeFileSync('load-test-data.csv', testResult.exportData.csv);
 *   // require('fs').writeFileSync('load-test-report.html', testResult.exportData.html);
 * }
 * 
 * // Real-time monitoring during test
 * const realtimeLoadTester = createLoadTester({
 *   url: 'https://api.example.com/monitor',
 *   concurrency: 10,
 *   sustainedDuration: 300000, // 5 minutes
 *   enableRealTimeStats: true,
 *   reportingInterval: 2000     // Report every 2 seconds
 * });
 * 
 * realtimeLoadTester.on('progress', (progress) => {
 *   // Real-time dashboard data
 *   const dashboardData = {
 *     timestamp: Date.now(),
 *     phase: progress.phase,
 *     progress: progress.progress,
 *     rps: progress.currentMetrics.requestsPerSecond,
 *     responseTime: progress.currentMetrics.averageResponseTime,
 *     errorRate: progress.currentMetrics.errorRate,
 *     activeConnections: progress.currentConcurrency,
 *     isStable: progress.isStable
 *   };
 *   
 *   // Send to monitoring system or display in real-time UI
 *   console.log('Dashboard Update:', JSON.stringify(dashboardData, null, 2));
 * });
 * 
 * // Start monitoring
 * console.log('Starting real-time monitoring load test...');
 * realtimeLoadTester.start();
 * 
 * // Pause/resume functionality
 * setTimeout(() => {
 *   console.log('Pausing load test...');
 *   realtimeLoadTester.pause();
 *   
 *   setTimeout(() => {
 *     console.log('Resuming load test...');
 *     realtimeLoadTester.resume();
 *   }, 10000); // Pause for 10 seconds
 * }, 60000); // Pause after 1 minute
 * 
 * // Stop test early if needed
 * setTimeout(() => {
 *   console.log('Stopping load test early...');
 *   realtimeLoadTester.stop();
 * }, 240000); // Stop after 4 minutes instead of 5
 * 
 * // Get current statistics during test
 * const currentStats = realtimeLoadTester.getStats();
 * console.log('Current test statistics:', currentStats.overallMetrics);
 * 
 * // Get current progress
 * const currentProgress = realtimeLoadTester.getProgress();
 * console.log('Current progress:', currentProgress.progress * 100, '%');
 */