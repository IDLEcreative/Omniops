/**
 * Query Builder with Automatic Batching
 * Batches multiple queries together for parallel execution
 */

/**
 * Optimized query builder with automatic batching
 * Collects queries for a short delay period and executes them in parallel
 */
export class QueryBuilder {
  private pendingQueries: Array<{
    resolve: (value: any) => void;
    reject: (error: any) => void;
    query: any;
  }> = [];
  private batchTimeout: NodeJS.Timeout | null = null;
  private batchDelay: number;

  constructor(batchDelayMs: number = 10) {
    this.batchDelay = batchDelayMs;
  }

  /**
   * Add query to batch
   * Queries are automatically executed after batchDelay milliseconds
   *
   * @param query - Promise or async function to execute
   * @returns Promise that resolves when query completes
   */
  addQuery<T>(query: any): Promise<T> {
    return new Promise((resolve, reject) => {
      this.pendingQueries.push({ resolve, reject, query });

      if (!this.batchTimeout) {
        this.batchTimeout = setTimeout(() => this.executeBatch(), this.batchDelay);
      }
    });
  }

  /**
   * Execute pending queries in parallel
   * Uses Promise.allSettled to handle individual failures gracefully
   */
  private async executeBatch(): Promise<void> {
    const queries = [...this.pendingQueries];
    this.pendingQueries = [];
    this.batchTimeout = null;

    if (queries.length === 0) return;

    try {
      // Execute all queries in parallel
      const results = await Promise.allSettled(
        queries.map(q => q.query)
      );

      results.forEach((result, index) => {
        const query = queries[index];
        if (!query) return;
        if (result.status === 'fulfilled') {
          query.resolve(result.value);
        } else {
          query.reject(result.reason);
        }
      });

    } catch (error) {
      queries.forEach(q => q.reject(error));
    }
  }

  /**
   * Force immediate execution of pending queries
   * Useful for graceful shutdown or when immediate execution is needed
   */
  async flush(): Promise<void> {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }
    await this.executeBatch();
  }

  /**
   * Get current batch statistics
   */
  getStats() {
    return {
      pendingQueries: this.pendingQueries.length,
      batchDelay: this.batchDelay,
    };
  }
}

export const queryBuilder = new QueryBuilder();
