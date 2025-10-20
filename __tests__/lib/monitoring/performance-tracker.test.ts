import { PerformanceTracker } from '@/lib/monitoring/performance-tracker';

describe('PerformanceTracker', () => {
  let tracker: PerformanceTracker;

  beforeEach(() => {
    tracker = PerformanceTracker.getInstance();
    // Clear any previous metrics
    (tracker as any).metrics.clear();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = PerformanceTracker.getInstance();
      const instance2 = PerformanceTracker.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Metric Tracking', () => {
    it('should track successful operations', () => {
      tracker.track('test-operation', 100, true);
      tracker.track('test-operation', 200, true);
      tracker.track('test-operation', 150, true);

      const aggregated = tracker.getAggregatedMetrics();
      const metric = aggregated.find(m => m.operation === 'test-operation');

      expect(metric).toBeDefined();
      expect(metric?.count).toBe(3);
      expect(metric?.successRate).toBe(1.0);
      expect(metric?.avgDuration).toBe(150);
    });

    it('should track failed operations', () => {
      tracker.track('test-operation', 100, true);
      tracker.track('test-operation', 200, false);
      tracker.track('test-operation', 150, false);

      const aggregated = tracker.getAggregatedMetrics();
      const metric = aggregated.find(m => m.operation === 'test-operation');

      expect(metric?.successRate).toBeCloseTo(0.333, 2);
    });

    it('should track operations with metadata', () => {
      tracker.track('api-call', 250, true, {
        endpoint: '/api/test',
        statusCode: 200
      });

      const aggregated = tracker.getAggregatedMetrics();
      const metric = aggregated.find(m => m.operation === 'api-call');

      expect(metric).toBeDefined();
      expect(metric?.avgDuration).toBe(250);
    });
  });

  describe('Percentile Calculations', () => {
    it('should calculate correct percentiles', () => {
      // Add 100 samples with predictable distribution
      for (let i = 1; i <= 100; i++) {
        tracker.track('percentile-test', i * 10, true);
      }

      const aggregated = tracker.getAggregatedMetrics();
      const metric = aggregated.find(m => m.operation === 'percentile-test');

      expect(metric?.p50).toBe(500); // 50th value * 10
      expect(metric?.p95).toBe(950); // 95th value * 10
      expect(metric?.p99).toBe(990); // 99th value * 10
    });

    it('should handle edge cases for percentiles', () => {
      tracker.track('single-value', 100, true);

      const aggregated = tracker.getAggregatedMetrics();
      const metric = aggregated.find(m => m.operation === 'single-value');

      expect(metric?.p50).toBe(100);
      expect(metric?.p95).toBe(100);
      expect(metric?.p99).toBe(100);
    });
  });

  describe('Async Tracking', () => {
    it('should track async operations', async () => {
      const result = await tracker.trackAsync(
        'async-operation',
        async () => {
          await new Promise(resolve => setTimeout(resolve, 50));
          return 'success';
        }
      );

      expect(result).toBe('success');

      const aggregated = tracker.getAggregatedMetrics();
      const metric = aggregated.find(m => m.operation === 'async-operation');

      expect(metric).toBeDefined();
      expect(metric?.count).toBe(1);
      expect(metric?.successRate).toBe(1.0);
      expect(metric?.avgDuration).toBeGreaterThanOrEqual(50);
    });

    it('should track failed async operations', async () => {
      const testError = new Error('Test error');

      await expect(
        tracker.trackAsync(
          'async-failure',
          async () => {
            throw testError;
          }
        )
      ).rejects.toThrow('Test error');

      const aggregated = tracker.getAggregatedMetrics();
      const metric = aggregated.find(m => m.operation === 'async-failure');

      expect(metric?.successRate).toBe(0);
    });

    it('should pass metadata for async operations', async () => {
      await tracker.trackAsync(
        'async-with-metadata',
        async () => 'result',
        { userId: '123' }
      );

      const aggregated = tracker.getAggregatedMetrics();
      const metric = aggregated.find(m => m.operation === 'async-with-metadata');

      expect(metric).toBeDefined();
      expect(metric?.count).toBe(1);
    });
  });

  describe('Throughput Calculation', () => {
    it('should calculate throughput correctly', () => {
      const now = Date.now();

      // Simulate operations over time
      for (let i = 0; i < 10; i++) {
        (tracker as any).metrics.set(`test-throughput-${i}`, {
          operation: 'throughput-test',
          duration: 100,
          timestamp: now - (i * 100), // 100ms apart
          success: true
        });
      }

      const aggregated = tracker.getAggregatedMetrics();
      const metric = aggregated.find(m => m.operation === 'throughput-test');

      expect(metric?.throughput).toBeGreaterThan(0);
    });
  });

  describe('Prometheus Export', () => {
    it('should export metrics in Prometheus format', () => {
      tracker.track('export-test', 100, true);
      tracker.track('export-test', 200, true);
      tracker.track('export-test', 300, false);

      const prometheus = tracker.exportPrometheus();

      expect(prometheus).toContain('# HELP');
      expect(prometheus).toContain('# TYPE');
      expect(prometheus).toContain('api_request_duration_ms');
      expect(prometheus).toContain('api_request_total');
      expect(prometheus).toContain('api_request_success_rate');
      expect(prometheus).toContain('operation="export-test"');
    });

    it('should handle empty metrics gracefully', () => {
      const prometheus = tracker.exportPrometheus();

      expect(prometheus).toContain('# HELP');
      expect(prometheus).toContain('# TYPE');
    });
  });

  describe('Metric Cleanup', () => {
    it('should clear old metrics', () => {
      const now = Date.now();
      const oldTimestamp = now - (2 * 60 * 60 * 1000); // 2 hours ago

      (tracker as any).metrics.set('old-metric', {
        operation: 'old-operation',
        duration: 100,
        timestamp: oldTimestamp,
        success: true
      });

      tracker.track('recent-metric', 100, true);

      tracker.clearOldMetrics(60 * 60 * 1000); // Clear older than 1 hour

      const aggregated = tracker.getAggregatedMetrics();
      expect(aggregated.find(m => m.operation === 'old-operation')).toBeUndefined();
      expect(aggregated.find(m => m.operation === 'recent-metric')).toBeDefined();
    });
  });

  describe('Operation Filtering', () => {
    it('should filter metrics by operation name', () => {
      tracker.track('api-users', 100, true);
      tracker.track('api-posts', 200, true);
      tracker.track('db-query', 50, true);

      const apiMetrics = tracker.getAggregatedMetrics('api-');
      expect(apiMetrics).toHaveLength(2);
      expect(apiMetrics.every(m => m.operation.startsWith('api-'))).toBe(true);
    });

    it('should return all metrics when no filter provided', () => {
      tracker.track('operation-1', 100, true);
      tracker.track('operation-2', 200, true);

      const allMetrics = tracker.getAggregatedMetrics();
      expect(allMetrics.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid duration values', () => {
      expect(() => tracker.track('test', -100, true)).not.toThrow();
      expect(() => tracker.track('test', NaN, true)).not.toThrow();
      expect(() => tracker.track('test', Infinity, true)).not.toThrow();

      const aggregated = tracker.getAggregatedMetrics();
      const metric = aggregated.find(m => m.operation === 'test');

      // Invalid durations should be filtered out or set to 0
      expect(metric?.avgDuration).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle concurrent tracking correctly', async () => {
      const operations = Array(10).fill(null).map((_, i) =>
        tracker.trackAsync(
          'concurrent-test',
          async () => {
            await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
            return i;
          }
        )
      );

      await Promise.all(operations);

      const aggregated = tracker.getAggregatedMetrics();
      const metric = aggregated.find(m => m.operation === 'concurrent-test');

      expect(metric?.count).toBe(10);
      expect(metric?.successRate).toBe(1.0);
    });
  });
});