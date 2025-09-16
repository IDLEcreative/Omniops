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
  QueryInspectorOptions
} from './types';

/**
 * Quick start utilities - Import these for immediate use
 */

// Re-export main utilities directly (no top-level await needed)
export { profileFunction as quickProfile, profiler as profile } from './performance-profiler';
export { createQueryInspector as quickQueryInspector, inspectQueries as quickInspect } from './query-inspector';

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
 */