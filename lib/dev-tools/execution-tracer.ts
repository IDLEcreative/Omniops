/**
 * Execution Tracer - Zero-dependency function execution tracing
 * Provides comprehensive tracing capabilities for debugging and performance analysis
 */

import { performance } from 'perf_hooks';
import { EventEmitter } from 'events';
import { 
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
  TraceReport
} from './types';

/**
 * High-performance execution tracer with zero dependencies
 * 
 * Features:
 * - Function call tracing with entry/exit/error tracking
 * - Call stack management and visualization
 * - Async function support with proper timing
 * - Sequence diagram generation (Mermaid format)
 * - Call graphs with detailed statistics
 * - Chrome DevTools trace format export
 * - Memory usage tracking
 * - Auto-instrumentation for classes and modules
 * - Low overhead design for production use
 */
export class ExecutionTracer extends EventEmitter {
  private traces: TraceEntry[] = [];
  private callStack: string[] = [];
  private callStats: Map<string, CallStats> = new Map();
  private activeTraces: Map<string, TraceEntry> = new Map();
  private asyncTraces: Map<string, string> = new Map(); // asyncId -> callId
  private depth = 0;
  private maxDepthReached = 0;
  private callIdCounter = 0;
  private startTime = 0;
  private memoryUsage: number[] = [];
  
  private readonly options: Required<TracerOptions>;

  constructor(options: TracerOptions = {}) {
    super();
    
    this.options = {
      maxDepth: options.maxDepth ?? 100,
      maxHistory: options.maxHistory ?? 10000,
      trackArgs: options.trackArgs ?? false,
      trackReturnValues: options.trackReturnValues ?? false,
      trackMemory: options.trackMemory ?? true,
      trackStackTrace: options.trackStackTrace ?? true,
      excludePatterns: options.excludePatterns ?? [],
      includePatterns: options.includePatterns ?? [],
      asyncTracking: options.asyncTracking ?? true,
      memoryBounded: options.memoryBounded ?? true,
      memoryLimit: options.memoryLimit ?? 100 * 1024 * 1024, // 100MB
      enableSourceMap: options.enableSourceMap ?? false,
      sampleRate: options.sampleRate ?? 1.0
    };

    // Apply sampling rate
    if (this.options.sampleRate < 1.0) {
      this.shouldSample = () => Math.random() < this.options.sampleRate;
    }
  }

  /**
   * Determine if this call should be sampled (for performance)
   */
  private shouldSample(): boolean {
    return true; // Override this with sampling logic if needed
  }

  /**
   * Check if function should be traced based on patterns
   */
  private shouldTrace(functionName: string): boolean {
    // Check exclude patterns first
    if (this.options.excludePatterns.some(pattern => pattern.test(functionName))) {
      return false;
    }

    // If include patterns exist, only trace functions that match
    if (this.options.includePatterns.length > 0) {
      return this.options.includePatterns.some(pattern => pattern.test(functionName));
    }

    return true;
  }

  /**
   * Generate unique call ID
   */
  private generateCallId(): string {
    return `call_${++this.callIdCounter}`;
  }

  /**
   * Get memory usage if tracking is enabled
   */
  private getMemoryUsage() {
    if (!this.options.trackMemory) return undefined;
    
    const usage = process.memoryUsage();
    return {
      heapUsed: usage.heapUsed,
      heapTotal: usage.heapTotal,
      external: usage.external
    };
  }

  /**
   * Get stack trace if tracking is enabled
   */
  private getStackTrace(): string[] | undefined {
    if (!this.options.trackStackTrace) return undefined;

    const stack = new Error().stack;
    if (!stack) return undefined;

    return stack
      .split('\n')
      .slice(3) // Remove Error, getStackTrace, and calling function
      .map(line => line.trim())
      .filter(line => line.startsWith('at '));
  }

  /**
   * Parse function location from stack trace
   */
  private parseLocation(stackTrace?: string[]): { fileName?: string; lineNumber?: number; columnNumber?: number } {
    if (!stackTrace || stackTrace.length === 0) return {};

    const firstLine = stackTrace[0];
    const match = firstLine.match(/at .+ \((.+):(\d+):(\d+)\)/);
    
    if (match) {
      return {
        fileName: match[1],
        lineNumber: parseInt(match[2], 10),
        columnNumber: parseInt(match[3], 10)
      };
    }

    return {};
  }

  /**
   * Check memory bounds and clean up if needed
   */
  private checkMemoryBounds(): void {
    if (!this.options.memoryBounded) return;

    const currentMemory = process.memoryUsage().heapUsed;
    this.memoryUsage.push(currentMemory);

    // Keep only last 100 memory samples
    if (this.memoryUsage.length > 100) {
      this.memoryUsage = this.memoryUsage.slice(-50);
    }

    // If we're over the memory limit, trim traces
    if (currentMemory > this.options.memoryLimit) {
      const targetSize = Math.floor(this.traces.length * 0.5);
      this.traces = this.traces.slice(-targetSize);
      this.emit('memoryLimitReached', { currentMemory, targetSize });
    }
  }

  /**
   * Record a trace entry
   */
  private recordTrace(trace: TraceEntry): void {
    if (!this.shouldSample() || !this.shouldTrace(trace.functionName)) {
      return;
    }

    this.traces.push(trace);
    
    // Trim history if needed
    if (this.traces.length > this.options.maxHistory) {
      this.traces = this.traces.slice(-Math.floor(this.options.maxHistory * 0.8));
    }

    this.checkMemoryBounds();
    this.emit('trace', trace);
  }

  /**
   * Update call statistics
   */
  private updateStats(functionName: string, duration: number, isError: boolean, isAsync: boolean): void {
    const stats = this.callStats.get(functionName) || {
      count: 0,
      totalTime: 0,
      avgTime: 0,
      minTime: Infinity,
      maxTime: 0,
      errorCount: 0,
      lastCalled: 0,
      recursiveCount: 0,
      asyncCount: 0
    };

    stats.count++;
    stats.totalTime += duration;
    stats.avgTime = stats.totalTime / stats.count;
    stats.minTime = Math.min(stats.minTime, duration);
    stats.maxTime = Math.max(stats.maxTime, duration);
    stats.lastCalled = Date.now();

    if (isError) stats.errorCount++;
    if (isAsync) stats.asyncCount++;

    // Check for recursion
    const occurrences = this.callStack.filter(name => name === functionName).length;
    if (occurrences > 1) {
      stats.recursiveCount++;
    }

    this.callStats.set(functionName, stats);
  }

  /**
   * Start tracing a function call
   */
  private traceEntry(
    functionName: string,
    args: unknown[] = [],
    className?: string,
    isAsync = false
  ): string {
    if (this.depth >= this.options.maxDepth) {
      this.emit('maxDepthReached', { functionName, depth: this.depth });
      return '';
    }

    const callId = this.generateCallId();
    const timestamp = performance.now();
    const stackTrace = this.getStackTrace();
    const location = this.parseLocation(stackTrace);

    if (this.startTime === 0) {
      this.startTime = timestamp;
    }

    this.depth++;
    this.maxDepthReached = Math.max(this.maxDepthReached, this.depth);
    this.callStack.push(functionName);

    const trace: TraceEntry = {
      id: `${callId}_entry`,
      type: isAsync ? 'async_start' : 'entry',
      functionName,
      className,
      ...location,
      timestamp,
      depth: this.depth,
      callId,
      parentCallId: this.callStack.length > 1 ? this.activeTraces.get(this.callStack[this.callStack.length - 2])?.callId : undefined,
      args: this.options.trackArgs ? args : undefined,
      stackTrace,
      isAsync,
      memoryUsage: this.getMemoryUsage()
    };

    this.activeTraces.set(callId, trace);
    this.recordTrace(trace);

    return callId;
  }

  /**
   * End tracing a function call
   */
  private traceExit(
    callId: string,
    result?: unknown,
    error?: Error,
    isAsync = false
  ): void {
    const activeTrace = this.activeTraces.get(callId);
    if (!activeTrace) return;

    const timestamp = performance.now();
    const duration = timestamp - activeTrace.timestamp;

    this.depth--;
    this.callStack.pop();

    const trace: TraceEntry = {
      id: `${callId}_exit`,
      type: error ? 'error' : (isAsync ? 'async_end' : 'exit'),
      functionName: activeTrace.functionName,
      className: activeTrace.className,
      fileName: activeTrace.fileName,
      lineNumber: activeTrace.lineNumber,
      columnNumber: activeTrace.columnNumber,
      timestamp,
      duration,
      depth: this.depth + 1, // +1 because we already decremented
      callId,
      parentCallId: activeTrace.parentCallId,
      result: this.options.trackReturnValues ? result : undefined,
      error,
      stackTrace: error ? this.getStackTrace() : undefined,
      isAsync,
      memoryUsage: this.getMemoryUsage()
    };

    this.updateStats(activeTrace.functionName, duration, !!error, isAsync);
    this.activeTraces.delete(callId);
    this.recordTrace(trace);

    if (error) {
      this.emit('error', { trace, error });
    }
  }

  /**
   * Manually start tracing an operation
   */
  public start(operationName: string, args?: unknown[]): string {
    return this.traceEntry(operationName, args);
  }

  /**
   * Manually end tracing an operation
   */
  public end(callId: string, result?: unknown, error?: Error): void {
    this.traceExit(callId, result, error);
  }

  /**
   * Wrap a function with tracing
   */
  public wrap<T extends (...args: any[]) => any>(
    fn: T,
    functionName?: string,
    className?: string
  ): T {
    const name = functionName || fn.name || 'anonymous';
    
    const wrappedFn = (...args: Parameters<T>): ReturnType<T> => {
      const callId = this.traceEntry(name, args, className);
      
      try {
        const result = fn.apply(this, args);
        
        // Handle async functions
        if (result && typeof result.then === 'function') {
          return result
            .then((res: any) => {
              this.traceExit(callId, res, undefined, true);
              return res;
            })
            .catch((error: Error) => {
              this.traceExit(callId, undefined, error, true);
              throw error;
            }) as ReturnType<T>;
        }
        
        this.traceExit(callId, result);
        return result;
      } catch (error) {
        this.traceExit(callId, undefined, error as Error);
        throw error;
      }
    };

    // Preserve function properties
    Object.defineProperty(wrappedFn, 'name', { value: name });
    return wrappedFn as T;
  }

  /**
   * Auto-instrument a class with tracing
   */
  public autoInstrument<T extends Record<string, any>>(
    target: T,
    options: AutoInstrumentTracerOptions = {}
  ): T {
    const {
      includePrivate = false,
      includeGetters = false,
      includeSetters = false,
      excludeConstructor = true,
      excludePatterns = [],
      maxDepth = this.options.maxDepth,
      trackArgs = this.options.trackArgs,
      trackReturnValues = this.options.trackReturnValues
    } = options;

    const className = target.constructor.name;

    const propertyNames = Object.getOwnPropertyNames(target);
    const prototypeNames = target.constructor.prototype 
      ? Object.getOwnPropertyNames(target.constructor.prototype)
      : [];

    const allNames = [...new Set([...propertyNames, ...prototypeNames])];

    for (const propName of allNames) {
      // Skip constructor if excluded
      if (excludeConstructor && propName === 'constructor') continue;
      
      // Skip private methods if not included
      if (!includePrivate && propName.startsWith('_')) continue;

      // Check exclude patterns
      if (excludePatterns.some(pattern => pattern.test(propName))) continue;

      const descriptor = Object.getOwnPropertyDescriptor(target, propName) ||
                        Object.getOwnPropertyDescriptor(target.constructor.prototype, propName);
      
      if (!descriptor) continue;

      // Handle regular functions
      if (typeof descriptor.value === 'function') {
        const originalMethod = descriptor.value;
        const wrappedMethod = this.wrap(originalMethod.bind(target), propName, className);
        
        // Replace the method on the target object directly
        Object.defineProperty(target, propName, {
          value: wrappedMethod,
          writable: descriptor.writable,
          enumerable: descriptor.enumerable,
          configurable: descriptor.configurable
        });
      }
      
      // Handle getters
      if (includeGetters && descriptor.get) {
        const originalGetter = descriptor.get;
        descriptor.get = this.wrap(originalGetter.bind(target), `get_${propName}`, className);
        Object.defineProperty(target, propName, descriptor);
      }
      
      // Handle setters
      if (includeSetters && descriptor.set) {
        const originalSetter = descriptor.set;
        descriptor.set = this.wrap(originalSetter.bind(target), `set_${propName}`, className);
        Object.defineProperty(target, propName, descriptor);
      }
    }

    return target;
  }

  /**
   * Generate execution timeline
   */
  public getTimeline(): ExecutionTimeline {
    const endTime = this.traces.length > 0 
      ? Math.max(...this.traces.map(t => t.timestamp))
      : performance.now();

    const functionCalls = this.traces.filter(t => t.type === 'entry' || t.type === 'async_start').length;
    const asyncCalls = this.traces.filter(t => t.isAsync).length;
    const errors = this.traces.filter(t => t.type === 'error').length;
    const uniqueFunctions = new Set(this.traces.map(t => t.functionName)).size;

    return {
      startTime: this.startTime,
      endTime,
      duration: endTime - this.startTime,
      totalCalls: this.traces.length,
      maxDepth: this.maxDepthReached,
      entries: [...this.traces],
      summary: {
        functionCalls,
        asyncCalls,
        errors,
        uniqueFunctions,
        deepestCall: this.maxDepthReached
      }
    };
  }

  /**
   * Generate call graph
   */
  public getCallGraph(): CallGraph {
    const nodes: CallGraphNode[] = [];
    const edges: CallGraphEdge[] = [];
    const nodeMap = new Map<string, CallGraphNode>();
    const edgeMap = new Map<string, CallGraphEdge>();

    // Create nodes from call stats
    for (const [functionName, stats] of this.callStats.entries()) {
      const node: CallGraphNode = {
        id: functionName,
        functionName,
        calls: stats.count,
        selfTime: stats.totalTime,
        totalTime: stats.totalTime,
        errors: stats.errorCount,
        isAsync: stats.asyncCount > 0
      };
      nodes.push(node);
      nodeMap.set(functionName, node);
    }

    // Create edges from trace entries
    for (const trace of this.traces) {
      if (trace.type === 'entry' || trace.type === 'async_start') {
        const parentTrace = trace.parentCallId 
          ? this.traces.find(t => t.callId === trace.parentCallId)
          : null;
        
        if (parentTrace) {
          const edgeKey = `${parentTrace.functionName}->${trace.functionName}`;
          const existing = edgeMap.get(edgeKey);
          
          if (existing) {
            existing.calls++;
          } else {
            const edge: CallGraphEdge = {
              from: parentTrace.functionName,
              to: trace.functionName,
              calls: 1,
              totalTime: trace.duration || 0
            };
            edges.push(edge);
            edgeMap.set(edgeKey, edge);
          }
        }
      }
    }

    const stats: Record<string, CallStats> = {};
    for (const [name, stat] of this.callStats.entries()) {
      stats[name] = { ...stat };
    }

    return { nodes, edges, stats };
  }

  /**
   * Generate sequence diagram in Mermaid format
   */
  public getSequenceDiagram(): SequenceDiagram {
    const participants = new Set<string>();
    const interactions: SequenceInteraction[] = [];

    // Extract participants and interactions
    for (let i = 0; i < this.traces.length; i++) {
      const trace = this.traces[i];
      
      if (trace.type === 'entry' || trace.type === 'async_start') {
        const exitTrace = this.traces.find(t => 
          t.callId === trace.callId && (t.type === 'exit' || t.type === 'async_end' || t.type === 'error')
        );

        const from = trace.parentCallId 
          ? this.traces.find(t => t.callId === trace.parentCallId)?.functionName || 'main'
          : 'main';
        
        const to = trace.functionName;
        
        participants.add(from);
        participants.add(to);

        // Call interaction
        interactions.push({
          from,
          to,
          message: trace.functionName,
          type: 'call',
          timestamp: trace.timestamp,
          isAsync: trace.isAsync
        });

        // Return interaction
        if (exitTrace) {
          interactions.push({
            from: to,
            to: from,
            message: exitTrace.type === 'error' ? 'error' : 'return',
            type: exitTrace.type === 'error' ? 'error' : 'return',
            timestamp: exitTrace.timestamp,
            duration: exitTrace.duration,
            isAsync: exitTrace.isAsync
          });
        }
      }
    }

    // Generate Mermaid code
    const participantList = Array.from(participants);
    let mermaidCode = 'sequenceDiagram\n';
    
    participantList.forEach(p => {
      mermaidCode += `    participant ${p}\n`;
    });
    
    interactions.forEach(interaction => {
      const arrow = interaction.type === 'error' ? '-x' : 
                   interaction.type === 'return' ? '-->' : 
                   interaction.isAsync ? '->>+' : '->>';
      
      mermaidCode += `    ${interaction.from}${arrow}${interaction.to}: ${interaction.message}\n`;
    });

    return {
      participants: participantList,
      interactions,
      mermaidCode
    };
  }

  /**
   * Export to Chrome DevTools trace format
   */
  public exportChromeTrace(): ChromeTraceFormat {
    const events: ChromeTraceEvent[] = [];
    const pid = 1;
    const tid = 1;

    for (const trace of this.traces) {
      if (trace.type === 'entry' || trace.type === 'async_start') {
        events.push({
          name: trace.functionName,
          cat: trace.className || 'function',
          ph: 'B', // Begin
          ts: Math.floor(trace.timestamp * 1000), // Convert to microseconds
          pid,
          tid,
          args: {
            functionName: trace.functionName,
            className: trace.className,
            depth: trace.depth,
            callId: trace.callId,
            args: trace.args
          },
          stack: trace.stackTrace
        });
      } else if (trace.type === 'exit' || trace.type === 'async_end' || trace.type === 'error') {
        events.push({
          name: trace.functionName,
          cat: trace.className || 'function',
          ph: 'E', // End
          ts: Math.floor(trace.timestamp * 1000),
          pid,
          tid,
          args: {
            result: trace.result,
            error: trace.error?.message,
            duration: trace.duration
          }
        });
      }
    }

    return {
      traceEvents: events,
      displayTimeUnit: 'ms',
      otherData: {
        version: '1.0.0',
        generatedBy: 'ExecutionTracer'
      }
    };
  }

  /**
   * Generate comprehensive trace report
   */
  public generateReport(): TraceReport {
    const timeline = this.getTimeline();
    const callGraph = this.getCallGraph();
    const sequenceDiagram = this.getSequenceDiagram();

    // Calculate top functions
    const functionStats = Array.from(this.callStats.entries());
    const topFunctions = functionStats
      .sort((a, b) => b[1].totalTime - a[1].totalTime)
      .slice(0, 10)
      .map(([name, stats]) => ({ name, calls: stats.count, time: stats.totalTime }));

    const slowestFunctions = functionStats
      .sort((a, b) => b[1].avgTime - a[1].avgTime)
      .slice(0, 10)
      .map(([name, stats]) => ({ name, avgTime: stats.avgTime, maxTime: stats.maxTime }));

    const mostCalledFunctions = functionStats
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10)
      .map(([name, stats]) => ({ name, calls: stats.count, totalTime: stats.totalTime }));

    // Performance analysis
    const memoryLeaks = this.detectMemoryLeaks();
    const bottlenecks = this.detectBottlenecks();
    const recursionIssues = this.detectRecursionIssues();

    // Generate recommendations
    const recommendations = this.generateRecommendations(callGraph, timeline);

    const errorCount = timeline.summary.errors;
    const totalCalls = timeline.summary.functionCalls;

    return {
      summary: {
        totalCalls,
        totalTime: timeline.duration,
        maxDepth: timeline.maxDepth,
        errorRate: totalCalls > 0 ? errorCount / totalCalls : 0,
        asyncCallsPercent: totalCalls > 0 ? (timeline.summary.asyncCalls / totalCalls) * 100 : 0,
        topFunctions,
        slowestFunctions,
        mostCalledFunctions
      },
      callGraph,
      timeline,
      sequenceDiagram,
      performance: {
        memoryLeaks,
        bottlenecks,
        recursionIssues
      },
      recommendations,
      exportFormats: {
        chrome: this.exportChromeTrace(),
        mermaid: sequenceDiagram.mermaidCode,
        json: JSON.stringify(timeline, null, 2),
        csv: this.exportCSV()
      },
      generatedAt: Date.now()
    };
  }

  /**
   * Detect potential memory leaks
   */
  private detectMemoryLeaks(): Array<{ function: string; growthRate: number }> {
    const leaks: Array<{ function: string; growthRate: number }> = [];
    
    if (this.memoryUsage.length < 10) return leaks;

    const growthRate = (this.memoryUsage[this.memoryUsage.length - 1] - this.memoryUsage[0]) / this.memoryUsage.length;
    
    if (growthRate > 1024 * 1024) { // 1MB growth per sample
      // Find functions that correlate with memory growth
      for (const [functionName, stats] of this.callStats.entries()) {
        if (stats.count > 10 && stats.totalTime > 100) {
          leaks.push({
            function: functionName,
            growthRate: growthRate / (1024 * 1024) // Convert to MB
          });
        }
      }
    }

    return leaks;
  }

  /**
   * Detect performance bottlenecks
   */
  private detectBottlenecks(): Array<{ function: string; impact: number; reason: string }> {
    const bottlenecks: Array<{ function: string; impact: number; reason: string }> = [];
    
    for (const [functionName, stats] of this.callStats.entries()) {
      let impact = 0;
      let reason = '';

      // High total time
      if (stats.totalTime > 1000) {
        impact += stats.totalTime / 1000;
        reason += 'High total execution time. ';
      }

      // High average time
      if (stats.avgTime > 100) {
        impact += stats.avgTime / 100;
        reason += 'Slow individual calls. ';
      }

      // High call count
      if (stats.count > 100) {
        impact += stats.count / 100;
        reason += 'Called frequently. ';
      }

      // High error rate
      if (stats.errorCount > 0 && (stats.errorCount / stats.count) > 0.1) {
        impact += (stats.errorCount / stats.count) * 10;
        reason += 'High error rate. ';
      }

      if (impact > 2) {
        bottlenecks.push({
          function: functionName,
          impact,
          reason: reason.trim()
        });
      }
    }

    return bottlenecks.sort((a, b) => b.impact - a.impact);
  }

  /**
   * Detect recursion issues
   */
  private detectRecursionIssues(): Array<{ function: string; maxDepth: number; calls: number }> {
    const issues: Array<{ function: string; maxDepth: number; calls: number }> = [];
    
    for (const [functionName, stats] of this.callStats.entries()) {
      if (stats.recursiveCount > 0) {
        // Find max depth for this function
        const maxDepth = Math.max(...this.traces
          .filter(t => t.functionName === functionName)
          .map(t => t.depth));

        if (maxDepth > 10 || stats.recursiveCount > 50) {
          issues.push({
            function: functionName,
            maxDepth,
            calls: stats.recursiveCount
          });
        }
      }
    }

    return issues;
  }

  /**
   * Generate performance recommendations
   */
  private generateRecommendations(callGraph: CallGraph, timeline: ExecutionTimeline): string[] {
    const recommendations: string[] = [];

    // High error rate
    if (timeline.summary.errors > 0) {
      const errorRate = timeline.summary.errors / timeline.summary.functionCalls;
      if (errorRate > 0.1) {
        recommendations.push(`High error rate detected (${(errorRate * 100).toFixed(1)}%). Consider improving error handling.`);
      }
    }

    // Deep call stacks
    if (timeline.maxDepth > 20) {
      recommendations.push(`Very deep call stack detected (${timeline.maxDepth} levels). Consider refactoring to reduce complexity.`);
    }

    // Slow functions
    const slowFunctions = Array.from(this.callStats.entries())
      .filter(([_, stats]) => stats.avgTime > 100)
      .length;
    
    if (slowFunctions > 0) {
      recommendations.push(`${slowFunctions} functions have slow average execution times. Consider optimization.`);
    }

    // Memory usage
    if (this.memoryUsage.length > 0) {
      const memoryGrowth = this.memoryUsage[this.memoryUsage.length - 1] - this.memoryUsage[0];
      if (memoryGrowth > 10 * 1024 * 1024) { // 10MB
        recommendations.push(`Significant memory growth detected (${(memoryGrowth / (1024 * 1024)).toFixed(1)}MB). Check for memory leaks.`);
      }
    }

    // Async usage
    const asyncPercent = (timeline.summary.asyncCalls / timeline.summary.functionCalls) * 100;
    if (asyncPercent > 50) {
      recommendations.push(`High async function usage (${asyncPercent.toFixed(1)}%). Ensure proper error handling and avoid callback hell.`);
    }

    return recommendations;
  }

  /**
   * Export trace data as CSV
   */
  public exportCSV(): string {
    const headers = [
      'Timestamp',
      'Type',
      'Function',
      'Class',
      'Duration',
      'Depth',
      'Is Async',
      'Error',
      'Memory Used'
    ];

    const rows = this.traces.map(trace => [
      trace.timestamp.toFixed(3),
      trace.type,
      trace.functionName,
      trace.className || '',
      trace.duration?.toFixed(3) || '',
      trace.depth.toString(),
      trace.isAsync ? 'Yes' : 'No',
      trace.error?.message || '',
      trace.memoryUsage ? trace.memoryUsage.heapUsed.toString() : ''
    ]);

    return [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
  }

  /**
   * Clear all traces and reset state
   */
  public reset(): void {
    this.traces = [];
    this.callStack = [];
    this.callStats.clear();
    this.activeTraces.clear();
    this.asyncTraces.clear();
    this.depth = 0;
    this.maxDepthReached = 0;
    this.callIdCounter = 0;
    this.startTime = 0;
    this.memoryUsage = [];
  }

  /**
   * Get current statistics
   */
  public getStats(): Record<string, CallStats> {
    const stats: Record<string, CallStats> = {};
    for (const [name, stat] of this.callStats.entries()) {
      stats[name] = { ...stat };
    }
    return stats;
  }

  /**
   * Enable/disable tracing
   */
  public setEnabled(enabled: boolean): void {
    if (enabled) {
      this.shouldSample = () => Math.random() < this.options.sampleRate;
    } else {
      this.shouldSample = () => false;
    }
  }
}

/**
 * Global execution tracer instance
 */
export const executionTracer = new ExecutionTracer();

/**
 * Quick trace function wrapper
 */
export function traceFunction<T extends (...args: any[]) => any>(
  fn: T,
  functionName?: string,
  options?: TracerOptions
): T {
  const tracer = options ? new ExecutionTracer(options) : executionTracer;
  return tracer.wrap(fn, functionName);
}

/**
 * Quick class instrumentation
 */
export function traceClass<T extends Record<string, any>>(
  target: T,
  options?: AutoInstrumentTracerOptions
): T {
  return executionTracer.autoInstrument(target, options);
}

/**
 * Create a new execution tracer instance
 */
export function createExecutionTracer(options?: TracerOptions): ExecutionTracer {
  return new ExecutionTracer(options);
}