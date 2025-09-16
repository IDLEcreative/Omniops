/**
 * Universal Query Inspector
 * Wraps any database client to monitor query performance and detect issues
 * Zero dependencies - works with Supabase, Prisma, Knex, raw SQL, etc.
 */

import { performance } from 'perf_hooks';
import { EventEmitter } from 'events';

export interface QueryExecution {
  id: string;
  query: string;
  normalizedQuery: string;
  startTime: number;
  endTime: number;
  duration: number;
  rowCount?: number;
  affectedRows?: number;
  error?: Error;
  stackTrace: string[];
  timestamp: number;
  params?: unknown[];
  method?: string;
  table?: string;
}

export interface QueryPattern {
  normalizedQuery: string;
  count: number;
  totalTime: number;
  avgTime: number;
  minTime: number;
  maxTime: number;
  errorCount: number;
  lastSeen: number;
  tables: Set<string>;
  methods: Set<string>;
}

export interface NPlusOneDetection {
  pattern: string;
  occurrences: number;
  totalTime: number;
  queries: QueryExecution[];
  confidence: number; // 0-1, how confident we are it's N+1
}

export interface SlowQuery {
  execution: QueryExecution;
  reason: 'duration' | 'rows' | 'frequency';
  severity: 'warning' | 'critical';
}

export interface QueryInspectorStats {
  totalQueries: number;
  totalTime: number;
  avgTime: number;
  slowQueries: SlowQuery[];
  nPlusOneIssues: NPlusOneDetection[];
  errorRate: number;
  patterns: QueryPattern[];
  topTables: Array<{ table: string; count: number; time: number }>;
  recommendations: string[];
}

export interface QueryInspectorOptions {
  slowQueryThreshold?: number; // milliseconds
  maxHistorySize?: number;
  trackStackTrace?: boolean;
  enableNPlusOneDetection?: boolean;
  enablePatternAnalysis?: boolean;
  nPlusOneThreshold?: number; // minimum occurrences to flag as N+1
  nPlusOneTimeWindow?: number; // milliseconds to look for patterns
  autoReport?: boolean;
  reportInterval?: number; // milliseconds
}

export class QueryInspector extends EventEmitter {
  private executions: QueryExecution[] = [];
  private patterns: Map<string, QueryPattern> = new Map();
  private options: Required<QueryInspectorOptions>;
  private queryCounter = 0;
  private reportTimer?: NodeJS.Timeout;

  constructor(options: QueryInspectorOptions = {}) {
    super();
    
    this.options = {
      slowQueryThreshold: 1000, // 1 second
      maxHistorySize: 10000,
      trackStackTrace: true,
      enableNPlusOneDetection: true,
      enablePatternAnalysis: true,
      nPlusOneThreshold: 3,
      nPlusOneTimeWindow: 5000, // 5 seconds
      autoReport: false,
      reportInterval: 60000, // 1 minute
      ...options
    };

    if (this.options.autoReport) {
      this.startAutoReporting();
    }
  }

  /**
   * Wrap any database client with query monitoring
   */
  wrap<T extends object>(client: T, clientName: string = 'DatabaseClient'): T {
    return new Proxy(client, {
      get: (target, prop, receiver) => {
        const originalValue = Reflect.get(target, prop, receiver);
        
        if (typeof originalValue === 'function') {
          return this.wrapMethod(originalValue, String(prop), clientName);
        }
        
        return originalValue;
      }
    });
  }

  /**
   * Wrap a specific database method
   */
  wrapMethod(method: Function, methodName: string, clientName: string): Function {
    return async (...args: unknown[]) => {
      const queryId = `${clientName}_${methodName}_${++this.queryCounter}`;
      const startTime = performance.now();
      const timestamp = Date.now();
      
      // Extract query string from various client formats
      const query = this.extractQuery(args, methodName, clientName);
      const normalizedQuery = this.normalizeQuery(query);
      
      // Capture stack trace if enabled
      const stackTrace = this.options.trackStackTrace ? 
        this.captureStackTrace() : [];

      let execution: QueryExecution;
      
      try {
        const result = await method.apply(this, args);
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        // Extract row information from result
        const { rowCount, affectedRows } = this.extractRowInfo(result, clientName);
        
        execution = {
          id: queryId,
          query,
          normalizedQuery,
          startTime,
          endTime,
          duration,
          rowCount,
          affectedRows,
          stackTrace,
          timestamp,
          params: this.sanitizeParams(args),
          method: methodName,
          table: this.extractTable(query)
        };
        
        this.recordExecution(execution);
        this.emit('query', execution);
        
        return result;
      } catch (error) {
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        execution = {
          id: queryId,
          query,
          normalizedQuery,
          startTime,
          endTime,
          duration,
          error: error as Error,
          stackTrace,
          timestamp,
          params: this.sanitizeParams(args),
          method: methodName,
          table: this.extractTable(query)
        };
        
        this.recordExecution(execution);
        this.emit('queryError', execution);
        
        throw error;
      }
    };
  }

  /**
   * Extract query string from different client argument formats
   */
  private extractQuery(args: unknown[], methodName: string, clientName: string): string {
    if (!args.length) return `${clientName}.${methodName}()`;
    
    const firstArg = args[0];
    
    // Raw SQL string
    if (typeof firstArg === 'string') {
      return firstArg;
    }
    
    // Supabase-style query builder
    if (firstArg && typeof firstArg === 'object' && 'toString' in firstArg) {
      try {
        return String(firstArg);
      } catch {
        // Fallback
      }
    }
    
    // Prisma-style query object
    if (firstArg && typeof firstArg === 'object') {
      try {
        return `${methodName}(${JSON.stringify(firstArg)})`;
      } catch {
        return `${methodName}([object])`;
      }
    }
    
    return `${clientName}.${methodName}(${args.length} args)`;
  }

  /**
   * Normalize query for pattern matching
   */
  private normalizeQuery(query: string): string {
    return query
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/\$\d+/g, '$?') // Replace numbered parameters
      .replace(/\?/g, '$?') // Normalize question mark parameters
      .replace(/(['"])[^'"]*\1/g, '$1$?$1') // Replace string literals
      .replace(/\b\d+\b/g, '$?') // Replace numeric literals
      .replace(/\bIN\s*\([^)]+\)/gi, 'IN ($?)') // Normalize IN clauses
      .replace(/\bVALUES\s*\([^)]+\)/gi, 'VALUES ($?)') // Normalize VALUES
      .trim()
      .toLowerCase();
  }

  /**
   * Extract table name from query
   */
  private extractTable(query: string): string | undefined {
    const tablePatterns = [
      /(?:FROM|UPDATE|INTO|JOIN)\s+([`"']?)(\w+)\1/i,
      /(?:TABLE)\s+([`"']?)(\w+)\1/i
    ];
    
    for (const pattern of tablePatterns) {
      const match = query.match(pattern);
      if (match && match[2]) {
        return match[2].toLowerCase();
      }
    }
    
    return undefined;
  }

  /**
   * Extract row count information from result
   */
  private extractRowInfo(result: unknown, clientName: string): { rowCount?: number; affectedRows?: number } {
    if (!result || typeof result !== 'object') {
      return {};
    }
    
    const r = result as any;
    
    // Common patterns for different clients
    if (Array.isArray(r)) {
      return { rowCount: r.length };
    }
    
    // Supabase/PostgREST style
    if ('data' in r && Array.isArray(r.data)) {
      return { rowCount: r.data.length };
    }
    
    // Raw database driver results
    if ('rowCount' in r) {
      return { rowCount: r.rowCount };
    }
    
    if ('affectedRows' in r) {
      return { affectedRows: r.affectedRows };
    }
    
    // Prisma count results
    if ('count' in r && typeof r.count === 'number') {
      return { rowCount: r.count };
    }
    
    return {};
  }

  /**
   * Sanitize parameters for logging (remove sensitive data)
   */
  private sanitizeParams(params: unknown[]): unknown[] {
    return params.map(param => {
      if (typeof param === 'string' && param.length > 100) {
        return `${param.substring(0, 100)}...`;
      }
      
      if (typeof param === 'object' && param !== null) {
        const obj = param as Record<string, unknown>;
        const sanitized: Record<string, unknown> = {};
        
        for (const [key, value] of Object.entries(obj)) {
          // Skip sensitive-looking keys
          if (/password|secret|token|key|auth/i.test(key)) {
            sanitized[key] = '[REDACTED]';
          } else {
            sanitized[key] = value;
          }
        }
        
        return sanitized;
      }
      
      return param;
    });
  }

  /**
   * Capture stack trace
   */
  private captureStackTrace(): string[] {
    const stack = new Error().stack || '';
    return stack
      .split('\n')
      .slice(1) // Remove "Error" line
      .map(line => line.trim())
      .filter(line => !line.includes('query-inspector.ts'))
      .slice(0, 10); // Limit stack depth
  }

  /**
   * Record query execution and update patterns
   */
  private recordExecution(execution: QueryExecution): void {
    // Add to history with size limit
    this.executions.push(execution);
    if (this.executions.length > this.options.maxHistorySize) {
      this.executions.shift();
    }
    
    // Update pattern analysis
    if (this.options.enablePatternAnalysis) {
      this.updatePatterns(execution);
    }
    
    // Check for slow queries
    if (execution.duration > this.options.slowQueryThreshold) {
      const slowQuery: SlowQuery = {
        execution,
        reason: 'duration',
        severity: execution.duration > this.options.slowQueryThreshold * 3 ? 'critical' : 'warning'
      };
      
      this.emit('slowQuery', slowQuery);
    }
    
    // Detect N+1 queries
    if (this.options.enableNPlusOneDetection) {
      const nPlusOne = this.detectNPlusOne();
      if (nPlusOne.length > 0) {
        this.emit('nPlusOne', nPlusOne);
      }
    }
  }

  /**
   * Update query patterns
   */
  private updatePatterns(execution: QueryExecution): void {
    const pattern = this.patterns.get(execution.normalizedQuery);
    
    if (pattern) {
      pattern.count++;
      pattern.totalTime += execution.duration;
      pattern.avgTime = pattern.totalTime / pattern.count;
      pattern.minTime = Math.min(pattern.minTime, execution.duration);
      pattern.maxTime = Math.max(pattern.maxTime, execution.duration);
      pattern.lastSeen = execution.timestamp;
      
      if (execution.error) {
        pattern.errorCount++;
      }
      
      if (execution.table) {
        pattern.tables.add(execution.table);
      }
      
      if (execution.method) {
        pattern.methods.add(execution.method);
      }
    } else {
      this.patterns.set(execution.normalizedQuery, {
        normalizedQuery: execution.normalizedQuery,
        count: 1,
        totalTime: execution.duration,
        avgTime: execution.duration,
        minTime: execution.duration,
        maxTime: execution.duration,
        errorCount: execution.error ? 1 : 0,
        lastSeen: execution.timestamp,
        tables: new Set(execution.table ? [execution.table] : []),
        methods: new Set(execution.method ? [execution.method] : [])
      });
    }
  }

  /**
   * Detect N+1 query problems
   */
  private detectNPlusOne(): NPlusOneDetection[] {
    const now = Date.now();
    const windowStart = now - this.options.nPlusOneTimeWindow;
    
    // Get recent executions within time window
    const recentExecutions = this.executions.filter(
      exec => exec.timestamp >= windowStart
    );
    
    // Group by normalized query
    const queryGroups = new Map<string, QueryExecution[]>();
    
    for (const execution of recentExecutions) {
      const group = queryGroups.get(execution.normalizedQuery) || [];
      group.push(execution);
      queryGroups.set(execution.normalizedQuery, group);
    }
    
    const nPlusOnes: NPlusOneDetection[] = [];
    
    queryGroups.forEach((executions, normalizedQuery) => {
      if (executions.length >= this.options.nPlusOneThreshold) {
        // Calculate confidence based on:
        // 1. Frequency (more executions = higher confidence)
        // 2. Time clustering (closer together = higher confidence)
        // 3. Stack trace similarity
        
        const frequency = executions.length / this.options.nPlusOneThreshold;
        const timeSpread = Math.max(...executions.map(e => e.timestamp)) - 
                          Math.min(...executions.map(e => e.timestamp));
        const timeClustering = 1 - (timeSpread / this.options.nPlusOneTimeWindow);
        
        // Simple confidence calculation
        const confidence = Math.min(
          (frequency * 0.4) + (timeClustering * 0.6),
          1.0
        );
        
        if (confidence > 0.5) { // Only report if confidence > 50%
          nPlusOnes.push({
            pattern: normalizedQuery,
            occurrences: executions.length,
            totalTime: executions.reduce((sum, e) => sum + e.duration, 0),
            queries: executions,
            confidence
          });
        }
      }
    });
    
    return nPlusOnes.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Generate comprehensive statistics
   */
  generateStats(): QueryInspectorStats {
    const totalQueries = this.executions.length;
    const totalTime = this.executions.reduce((sum, e) => sum + e.duration, 0);
    const avgTime = totalQueries > 0 ? totalTime / totalQueries : 0;
    const errorCount = this.executions.filter(e => e.error).length;
    const errorRate = totalQueries > 0 ? errorCount / totalQueries : 0;
    
    // Find slow queries
    const slowQueries: SlowQuery[] = this.executions
      .filter(e => e.duration > this.options.slowQueryThreshold)
      .map(execution => ({
        execution,
        reason: 'duration' as const,
        severity: execution.duration > this.options.slowQueryThreshold * 3 ? 'critical' as const : 'warning' as const
      }))
      .sort((a, b) => b.execution.duration - a.execution.duration);
    
    // Get N+1 issues
    const nPlusOneIssues = this.detectNPlusOne();
    
    // Convert patterns to array and sort
    const patterns = Array.from(this.patterns.values())
      .sort((a, b) => b.totalTime - a.totalTime);
    
    // Calculate top tables
    const tableStats = new Map<string, { count: number; time: number }>();
    
    for (const execution of this.executions) {
      if (execution.table) {
        const stats = tableStats.get(execution.table) || { count: 0, time: 0 };
        stats.count++;
        stats.time += execution.duration;
        tableStats.set(execution.table, stats);
      }
    }
    
    const topTables = Array.from(tableStats.entries())
      .map(([table, stats]) => ({ table, ...stats }))
      .sort((a, b) => b.time - a.time)
      .slice(0, 10);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(slowQueries, nPlusOneIssues, patterns);
    
    return {
      totalQueries,
      totalTime,
      avgTime,
      slowQueries,
      nPlusOneIssues,
      errorRate,
      patterns,
      topTables,
      recommendations
    };
  }

  /**
   * Generate performance recommendations
   */
  private generateRecommendations(
    slowQueries: SlowQuery[],
    nPlusOneIssues: NPlusOneDetection[],
    patterns: QueryPattern[]
  ): string[] {
    const recommendations: string[] = [];
    
    if (slowQueries.length > 0) {
      recommendations.push(
        `Found ${slowQueries.length} slow queries. Consider adding indexes or optimizing query structure.`
      );
    }
    
    if (nPlusOneIssues.length > 0) {
      recommendations.push(
        `Detected ${nPlusOneIssues.length} potential N+1 query problems. Use eager loading or batch queries.`
      );
    }
    
    const frequentPatterns = patterns.filter(p => p.count > 10);
    if (frequentPatterns.length > 0) {
      recommendations.push(
        `${frequentPatterns.length} query patterns executed frequently. Consider caching results.`
      );
    }
    
    const highErrorPatterns = patterns.filter(p => p.errorCount / p.count > 0.1);
    if (highErrorPatterns.length > 0) {
      recommendations.push(
        `${highErrorPatterns.length} query patterns have high error rates. Review error handling.`
      );
    }
    
    return recommendations;
  }

  /**
   * Export data in JSON format
   */
  exportJSON(): string {
    return JSON.stringify({
      stats: this.generateStats(),
      executions: this.executions,
      patterns: Array.from(this.patterns.values()),
      options: this.options,
      exportTimestamp: Date.now()
    }, null, 2);
  }

  /**
   * Export data in CSV format
   */
  exportCSV(): string {
    const headers = [
      'id', 'query', 'duration', 'rowCount', 'error', 'table', 'method', 'timestamp'
    ];
    
    const rows = this.executions.map(exec => [
      exec.id,
      `"${exec.query.replace(/"/g, '""')}"`, // Escape quotes
      exec.duration.toFixed(2),
      exec.rowCount || '',
      exec.error ? `"${exec.error.message.replace(/"/g, '""')}"` : '',
      exec.table || '',
      exec.method || '',
      new Date(exec.timestamp).toISOString()
    ]);
    
    return [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
  }

  /**
   * Start automatic reporting
   */
  private startAutoReporting(): void {
    this.reportTimer = setInterval(() => {
      const stats = this.generateStats();
      this.emit('report', stats);
    }, this.options.reportInterval);
  }

  /**
   * Stop automatic reporting
   */
  stopAutoReporting(): void {
    if (this.reportTimer) {
      clearInterval(this.reportTimer);
      this.reportTimer = undefined;
    }
  }

  /**
   * Clear all recorded data
   */
  clear(): void {
    this.executions.length = 0;
    this.patterns.clear();
    this.queryCounter = 0;
  }

  /**
   * Get current memory usage
   */
  getMemoryUsage(): { queries: number; patterns: number; total: number } {
    const queriesMemory = this.executions.length * 1024; // Rough estimate
    const patternsMemory = this.patterns.size * 512; // Rough estimate
    
    return {
      queries: queriesMemory,
      patterns: patternsMemory,
      total: queriesMemory + patternsMemory
    };
  }

  /**
   * Cleanup old data to prevent memory leaks
   */
  cleanup(olderThanMs: number = 3600000): void { // Default: 1 hour
    const cutoff = Date.now() - olderThanMs;
    
    // Remove old executions
    this.executions = this.executions.filter(exec => exec.timestamp > cutoff);
    
    // Remove old patterns that haven't been seen recently
    this.patterns.forEach((pattern, key) => {
      if (pattern.lastSeen < cutoff) {
        this.patterns.delete(key);
      }
    });
  }

  /**
   * Get real-time monitoring data
   */
  getRealTimeData() {
    const recent = this.executions.slice(-100); // Last 100 queries
    const currentStats = this.generateStats();
    
    return {
      recentQueries: recent,
      currentStats,
      memoryUsage: this.getMemoryUsage(),
      timestamp: Date.now()
    };
  }
}

/**
 * Convenience function to create and configure a query inspector
 */
export function createQueryInspector(options?: QueryInspectorOptions): QueryInspector {
  return new QueryInspector(options);
}

/**
 * Quick wrapper for any database client
 */
export function inspectQueries<T extends object>(
  client: T, 
  options?: QueryInspectorOptions
): { client: T; inspector: QueryInspector } {
  const inspector = new QueryInspector(options);
  const wrappedClient = inspector.wrap(client);
  
  return { client: wrappedClient, inspector };
}