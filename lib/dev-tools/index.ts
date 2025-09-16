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
  ProfilerOptions
} from './types';

/**
 * Quick start utilities - Import these for immediate use
 */

// Re-export main utilities directly (no top-level await needed)
export { profileFunction as quickProfile, profiler as profile } from './performance-profiler';

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
 */