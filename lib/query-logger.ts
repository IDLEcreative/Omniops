/**
 * Query Performance Logger
 *
 * Helps identify slow queries and N+1 problems during development.
 * Disabled in production to avoid performance overhead.
 */

interface QueryLog {
  query: string;
  duration: number;
  timestamp: number;
}

/**
 * Query performance logger for development
 * Helps identify slow queries and N+1 problems
 *
 * Usage:
 * ```typescript
 * const logger = new QueryLogger();
 * const end = logger.start('getDashboardStats');
 * const result = await getDashboardStats(userId);
 * end();
 * console.log(logger.getSummary());
 * ```
 */
export class QueryLogger {
  private queries: QueryLog[] = [];
  private enabled: boolean;

  constructor() {
    // Only enable in development
    this.enabled = process.env.NODE_ENV === 'development';
  }

  /**
   * Start timing a query
   * Returns a function to call when the query completes
   *
   * @param queryName - Name of the query being executed
   * @returns Function to call when query completes
   */
  start(queryName: string): () => void {
    if (!this.enabled) {
      return () => {}; // No-op in production
    }

    const startTime = performance.now();
    const timestamp = Date.now();

    return () => {
      const duration = performance.now() - startTime;
      this.queries.push({ query: queryName, duration, timestamp });

      console.log(`[Query] ${queryName}: ${duration.toFixed(2)}ms`);
    };
  }

  /**
   * Get summary of all logged queries
   *
   * @returns Summary statistics
   */
  getSummary() {
    if (this.queries.length === 0) {
      return {
        totalQueries: 0,
        totalTime: 0,
        avgTime: 0,
        queries: [],
        slowest: null
      };
    }

    const totalTime = this.queries.reduce((sum, q) => sum + q.duration, 0);
    const avgTime = totalTime / this.queries.length;
    const slowest = [...this.queries].sort((a, b) => b.duration - a.duration)[0];

    return {
      totalQueries: this.queries.length,
      totalTime: totalTime.toFixed(2),
      avgTime: avgTime.toFixed(2),
      queries: this.queries.map(q => ({
        query: q.query,
        duration: `${q.duration.toFixed(2)}ms`
      })),
      slowest: slowest ? {
        query: slowest.query,
        duration: `${slowest.duration.toFixed(2)}ms`
      } : null
    };
  }

  /**
   * Reset the query log
   */
  reset() {
    this.queries = [];
  }

  /**
   * Get total number of queries executed
   *
   * @returns Number of queries
   */
  getQueryCount(): number {
    return this.queries.length;
  }

  /**
   * Get total execution time across all queries
   *
   * @returns Total time in milliseconds
   */
  getTotalTime(): number {
    return this.queries.reduce((sum, q) => sum + q.duration, 0);
  }

  /**
   * Check if query count exceeds threshold (indicates N+1 problem)
   *
   * @param threshold - Maximum acceptable query count
   * @returns True if count exceeds threshold
   */
  hasNPlusOneProblem(threshold: number = 5): boolean {
    return this.queries.length > threshold;
  }

  /**
   * Pretty print the query summary
   */
  printSummary() {
    const summary = this.getSummary();


    if (summary.slowest) {
      console.log(`Slowest Query: ${summary.slowest.query} (${summary.slowest.duration})`);
    }

    if (this.hasNPlusOneProblem()) {
      console.warn(`⚠️  N+1 Problem Detected: ${summary.totalQueries} queries executed`);
      console.warn('   Consider batching or using JOINs to reduce query count');
    }

    summary.queries.forEach((q, i) => {
    });
  }
}

/**
 * Singleton instance for global query logging
 */
let globalLogger: QueryLogger | null = null;

/**
 * Get the global query logger instance
 *
 * @returns Global QueryLogger instance
 */
export function getQueryLogger(): QueryLogger {
  if (!globalLogger) {
    globalLogger = new QueryLogger();
  }
  return globalLogger;
}

/**
 * Helper function to log a database query execution
 *
 * @param queryName - Name of the query
 * @param fn - Async function to execute
 * @returns Result of the function
 */
export async function logQuery<T>(
  queryName: string,
  fn: () => Promise<T>
): Promise<T> {
  const logger = getQueryLogger();
  const end = logger.start(queryName);

  try {
    const result = await fn();
    end();
    return result;
  } catch (error) {
    end();
    throw error;
  }
}
