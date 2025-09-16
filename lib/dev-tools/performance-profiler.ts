/**
 * Universal Performance Profiler - Zero-dependency performance monitoring tool
 * Works in any Node.js project - just drop it in and start profiling
 */

import { performance } from 'perf_hooks';
import * as process from 'process';
import type {
  PerformanceMetrics,
  FunctionCallInfo,
  ProfilerStats,
  MemorySnapshot,
  ChromeDevToolsProfile,
  ProfilerReport,
  AutoInstrumentOptions,
  ProfilerOptions,
  ChromeProfileNode
} from './types';

/**
 * Basic profiling function - Simple timing utility (20 lines)
 */
export function profileFunction<T extends (...args: any[]) => any>(
  fn: T,
  name?: string
): T {
  return ((...args: Parameters<T>) => {
    const start = performance.now();
    const memBefore = process.memoryUsage().heapUsed;
    
    try {
      const result = fn(...args);
      const end = performance.now();
      const memAfter = process.memoryUsage().heapUsed;
      
      console.log(`⚡ ${name || fn.name || 'anonymous'}: ${(end - start).toFixed(2)}ms, Memory: ${((memAfter - memBefore) / 1024 / 1024).toFixed(2)}MB`);
      return result;
    } catch (error) {
      const end = performance.now();
      console.log(`❌ ${name || fn.name || 'anonymous'}: ${(end - start).toFixed(2)}ms (ERROR)`);
      throw error;
    }
  }) as T;
}

/**
 * Advanced Performance Profiler Class
 */
export class PerformanceProfiler {
  private metrics: Map<string, FunctionCallInfo[]> = new Map();
  private memorySnapshots: MemorySnapshot[] = [];
  private callStack: string[] = [];
  private nodeIdCounter = 0;
  private options: Required<ProfilerOptions>;

  constructor(options: ProfilerOptions = {}) {
    this.options = {
      trackMemory: options.trackMemory ?? true,
      maxHistory: options.maxHistory ?? 1000,
      autoFlush: options.autoFlush ?? false,
      flushInterval: options.flushInterval ?? 30000,
      enableCallStack: options.enableCallStack ?? true,
      maxCallStackDepth: options.maxCallStackDepth ?? 50
    };

    if (this.options.autoFlush) {
      setInterval(() => this.flush(), this.options.flushInterval);
    }
  }

  /**
   * Wrap a function with performance monitoring
   */
  wrap<T extends (...args: any[]) => any>(fn: T, name?: string): T {
    const funcName = name || fn.name || 'anonymous';
    
    return ((...args: Parameters<T>) => {
      const startTime = performance.now();
      const memoryBefore = this.options.trackMemory ? process.memoryUsage() : null;
      
      if (this.options.enableCallStack && this.callStack.length < this.options.maxCallStackDepth) {
        this.callStack.push(funcName);
      }

      try {
        const result = fn(...args);
        this.recordCall(funcName, startTime, args, result, null, memoryBefore);
        return result;
      } catch (error) {
        this.recordCall(funcName, startTime, args, undefined, error as Error, memoryBefore);
        throw error;
      } finally {
        if (this.options.enableCallStack) {
          this.callStack.pop();
        }
      }
    }) as T;
  }

  /**
   * Auto-instrument all methods in a class or object
   */
  autoInstrument<T extends object>(target: T, options: AutoInstrumentOptions = {}): T {
    const {
      includePrivate = false,
      excludePatterns = [/^_/, /^constructor$/],
      maxCallStackDepth = 50,
      trackMemory = true
    } = options;

    const instrumented = { ...target } as T;
    const prototype = Object.getPrototypeOf(target);
    const propertyNames = [
      ...Object.getOwnPropertyNames(target),
      ...Object.getOwnPropertyNames(prototype)
    ];

    for (const prop of propertyNames) {
      if (prop === 'constructor') continue;
      if (!includePrivate && prop.startsWith('_')) continue;
      if (excludePatterns.some(pattern => pattern.test(prop))) continue;

      try {
        const descriptor = Object.getOwnPropertyDescriptor(target, prop) || 
                          Object.getOwnPropertyDescriptor(prototype, prop);
        
        if (descriptor && typeof descriptor.value === 'function') {
          (instrumented as any)[prop] = this.wrap(descriptor.value.bind(target), `${target.constructor.name}.${prop}`);
        }
      } catch (error) {
        // Skip properties that can't be instrumented
        continue;
      }
    }

    return instrumented;
  }

  /**
   * Auto-instrument all exported functions in a module
   */
  instrumentModule<T extends Record<string, any>>(moduleExports: T): T {
    const instrumented = { ...moduleExports };
    
    for (const [key, value] of Object.entries(moduleExports)) {
      if (typeof value === 'function') {
        instrumented[key] = this.wrap(value, key);
      }
    }
    
    return instrumented;
  }

  /**
   * Start profiling a named section
   */
  start(name: string): void {
    const startTime = performance.now();
    const memoryBefore = this.options.trackMemory ? process.memoryUsage() : null;
    
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    // Store start info temporarily
    (this as any)[`_start_${name}`] = { startTime, memoryBefore };
  }

  /**
   * End profiling a named section
   */
  end(name: string): PerformanceMetrics {
    const endTime = performance.now();
    const startInfo = (this as any)[`_start_${name}`];
    
    if (!startInfo) {
      throw new Error(`No start marker found for '${name}'. Call start('${name}') first.`);
    }

    const duration = endTime - startInfo.startTime;
    const memoryAfter = this.options.trackMemory ? process.memoryUsage() : null;
    const memoryUsed = memoryAfter && startInfo.memoryBefore 
      ? memoryAfter.heapUsed - startInfo.memoryBefore.heapUsed 
      : 0;

    const metrics: PerformanceMetrics = {
      duration,
      memoryUsed,
      timestamp: Date.now()
    };

    const callInfo: FunctionCallInfo = {
      name,
      startTime: startInfo.startTime,
      endTime,
      duration,
      memoryBefore: startInfo.memoryBefore?.heapUsed || 0,
      memoryAfter: memoryAfter?.heapUsed || 0,
      memoryDelta: memoryUsed,
      args: [],
      callStack: [...this.callStack]
    };

    this.addCallInfo(name, callInfo);
    delete (this as any)[`_start_${name}`];

    return metrics;
  }

  /**
   * Get statistics for a specific function
   */
  getStats(functionName: string): ProfilerStats | null {
    const calls = this.metrics.get(functionName);
    if (!calls || calls.length === 0) return null;

    const durations = calls.map(c => c.duration).sort((a, b) => a - b);
    const memories = calls.map(c => c.memoryDelta);
    const errorCount = calls.filter(c => c.error).length;

    return {
      count: calls.length,
      totalTime: durations.reduce((sum, d) => sum + d, 0),
      avgTime: durations.reduce((sum, d) => sum + d, 0) / durations.length,
      minTime: durations[0],
      maxTime: durations[durations.length - 1],
      p50: durations[Math.floor(durations.length * 0.5)],
      p95: durations[Math.floor(durations.length * 0.95)],
      p99: durations[Math.floor(durations.length * 0.99)],
      totalMemory: memories.reduce((sum, m) => sum + m, 0),
      avgMemory: memories.reduce((sum, m) => sum + m, 0) / memories.length,
      errorCount
    };
  }

  /**
   * Generate comprehensive performance report
   */
  generateReport(): ProfilerReport {
    const functions: Record<string, ProfilerStats> = {};
    const topBottlenecks: string[] = [];

    // Calculate stats for all functions
    for (const [name] of this.metrics) {
      const stats = this.getStats(name);
      if (stats) {
        functions[name] = stats;
      }
    }

    // Find top bottlenecks by total time
    const sortedByTime = Object.entries(functions)
      .sort(([, a], [, b]) => b.totalTime - a.totalTime)
      .slice(0, 5)
      .map(([name]) => name);

    topBottlenecks.push(...sortedByTime);

    // Memory leak detection
    const memoryLeaks = this.detectMemoryLeaks();

    // Generate recommendations
    const recommendations = this.generateRecommendations(functions, memoryLeaks);

    return {
      summary: {
        totalFunctions: this.metrics.size,
        totalCalls: Array.from(this.metrics.values()).reduce((sum, calls) => sum + calls.length, 0),
        totalTime: Object.values(functions).reduce((sum, stats) => sum + stats.totalTime, 0),
        totalMemory: Object.values(functions).reduce((sum, stats) => sum + stats.totalMemory, 0),
        topBottlenecks
      },
      functions,
      memoryLeaks,
      recommendations,
      timestamp: Date.now()
    };
  }

  /**
   * Export profile data in Chrome DevTools format
   */
  exportChromeProfile(): ChromeDevToolsProfile {
    const nodes: ChromeProfileNode[] = [];
    const samples: number[] = [];
    const timeDeltas: number[] = [];
    let nodeId = 0;

    // Create root node
    nodes.push({
      id: nodeId++,
      callFrame: {
        functionName: '(root)',
        scriptId: '0',
        url: '',
        lineNumber: 0,
        columnNumber: 0
      },
      hitCount: 0,
      children: []
    });

    // Process all function calls
    for (const [functionName, calls] of this.metrics) {
      const nodeIndex = nodeId++;
      nodes.push({
        id: nodeIndex,
        callFrame: {
          functionName,
          scriptId: '1',
          url: 'profiler://generated',
          lineNumber: 1,
          columnNumber: 1
        },
        hitCount: calls.length,
        children: []
      });

      nodes[0].children!.push(nodeIndex);

      // Add samples for this function
      for (const call of calls) {
        samples.push(nodeIndex);
        timeDeltas.push(Math.round(call.duration * 1000)); // Convert to microseconds
      }
    }

    return {
      version: '1.0.0',
      type: 'cpu',
      title: 'Performance Profile',
      nodes,
      startTime: Date.now() - 60000, // 1 minute ago
      endTime: Date.now(),
      samples,
      timeDeltas
    };
  }

  /**
   * Clear all collected data
   */
  clear(): void {
    this.metrics.clear();
    this.memorySnapshots = [];
    this.callStack = [];
  }

  /**
   * Flush old data to keep memory usage bounded
   */
  flush(): void {
    for (const [name, calls] of this.metrics) {
      if (calls.length > this.options.maxHistory) {
        this.metrics.set(name, calls.slice(-this.options.maxHistory));
      }
    }

    if (this.memorySnapshots.length > this.options.maxHistory) {
      this.memorySnapshots = this.memorySnapshots.slice(-this.options.maxHistory);
    }
  }

  /**
   * Get all collected metrics
   */
  getAllMetrics(): Map<string, FunctionCallInfo[]> {
    return new Map(this.metrics);
  }

  // Private helper methods

  private recordCall(
    name: string,
    startTime: number,
    args: unknown[],
    result: unknown,
    error: Error | null,
    memoryBefore: NodeJS.MemoryUsage | null
  ): void {
    const endTime = performance.now();
    const memoryAfter = this.options.trackMemory ? process.memoryUsage() : null;

    const callInfo: FunctionCallInfo = {
      name,
      startTime,
      endTime,
      duration: endTime - startTime,
      memoryBefore: memoryBefore?.heapUsed || 0,
      memoryAfter: memoryAfter?.heapUsed || 0,
      memoryDelta: memoryAfter && memoryBefore ? memoryAfter.heapUsed - memoryBefore.heapUsed : 0,
      args: args.slice(0, 3), // Limit args to prevent memory bloat
      result: typeof result === 'object' ? '[Object]' : result,
      error: error || undefined,
      callStack: [...this.callStack]
    };

    this.addCallInfo(name, callInfo);

    // Take memory snapshot periodically
    if (this.options.trackMemory && this.memorySnapshots.length % 100 === 0) {
      this.takeMemorySnapshot();
    }
  }

  private addCallInfo(name: string, callInfo: FunctionCallInfo): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const calls = this.metrics.get(name)!;
    calls.push(callInfo);

    // Keep bounded history
    if (calls.length > this.options.maxHistory) {
      calls.shift();
    }
  }

  private takeMemorySnapshot(): void {
    const usage = process.memoryUsage();
    this.memorySnapshots.push({
      used: usage.heapUsed,
      total: usage.heapTotal,
      external: usage.external,
      timestamp: Date.now(),
      heapUsed: usage.heapUsed,
      heapTotal: usage.heapTotal
    });
  }

  private detectMemoryLeaks(): { suspected: boolean; growthRate: number; snapshots: MemorySnapshot[] } {
    if (this.memorySnapshots.length < 10) {
      return { suspected: false, growthRate: 0, snapshots: this.memorySnapshots };
    }

    const recent = this.memorySnapshots.slice(-10);
    const growthRates = [];

    for (let i = 1; i < recent.length; i++) {
      const growth = (recent[i].used - recent[i - 1].used) / recent[i - 1].used;
      growthRates.push(growth);
    }

    const avgGrowthRate = growthRates.reduce((sum, rate) => sum + rate, 0) / growthRates.length;
    const suspected = avgGrowthRate > 0.05; // 5% consistent growth indicates potential leak

    return { suspected, growthRate: avgGrowthRate, snapshots: this.memorySnapshots };
  }

  private generateRecommendations(functions: Record<string, ProfilerStats>, memoryLeaks: any): string[] {
    const recommendations: string[] = [];

    // Performance recommendations
    const slowFunctions = Object.entries(functions)
      .filter(([, stats]) => stats.avgTime > 100)
      .map(([name]) => name);

    if (slowFunctions.length > 0) {
      recommendations.push(`Optimize slow functions: ${slowFunctions.slice(0, 3).join(', ')}`);
    }

    // Memory recommendations
    if (memoryLeaks.suspected) {
      recommendations.push('Potential memory leak detected - investigate object retention');
    }

    const memoryHeavy = Object.entries(functions)
      .filter(([, stats]) => stats.avgMemory > 1024 * 1024) // 1MB
      .map(([name]) => name);

    if (memoryHeavy.length > 0) {
      recommendations.push(`Review memory usage in: ${memoryHeavy.slice(0, 3).join(', ')}`);
    }

    // Error rate recommendations
    const errorProne = Object.entries(functions)
      .filter(([, stats]) => stats.errorCount / stats.count > 0.05)
      .map(([name]) => name);

    if (errorProne.length > 0) {
      recommendations.push(`High error rates in: ${errorProne.slice(0, 3).join(', ')}`);
    }

    return recommendations;
  }
}

// Singleton instance for convenience
export const profiler = new PerformanceProfiler();

// Export a simple timing utility
export const time = profiler.wrap.bind(profiler);