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
  AlertAction
} from './types';

/**
 * Quick start utilities - Import these for immediate use
 */

// Re-export main utilities directly (no top-level await needed)
export { profileFunction as quickProfile, profiler as profile } from './performance-profiler';
export { createQueryInspector as quickQueryInspector, inspectQueries as quickInspect } from './query-inspector';
export { createLogAnalyzer as quickLogAnalyzer, analyzeLogFile as quickAnalyzeFile } from './log-analyzer';

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
 */