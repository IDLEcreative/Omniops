/**
 * Parallel Operations - Performance & Real-World Patterns
 *
 * Tests performance improvements from parallelization and
 * validates real-world chat API execution patterns.
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  createDelayedMock,
  measureTime,
  TestDelays,
  TIMING_BUFFER
} from './parallel-test-helpers';

describe('Chat API Parallel Operations - Performance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Performance Measurement', () => {
    it('should demonstrate 50-70% latency reduction with parallelization', async () => {
      const operationDelayMs = TestDelays.EXTRA_LONG;
      const numOperations = 3;

      // Sequential execution
      const sequentialStart = Date.now();
      await createDelayedMock('result-1', operationDelayMs)();
      await createDelayedMock('result-2', operationDelayMs)();
      await createDelayedMock('result-3', operationDelayMs)();
      const sequentialTime = Date.now() - sequentialStart;

      // Parallel execution
      const parallelStart = Date.now();
      await Promise.all([
        createDelayedMock('result-1', operationDelayMs)(),
        createDelayedMock('result-2', operationDelayMs)(),
        createDelayedMock('result-3', operationDelayMs)()
      ]);
      const parallelTime = Date.now() - parallelStart;

      // Calculate improvement
      const expectedSequential = operationDelayMs * numOperations; // 300ms
      const expectedParallel = operationDelayMs; // 100ms
      const improvement = ((sequentialTime - parallelTime) / sequentialTime) * 100;

      console.log(`Sequential: ${sequentialTime}ms, Parallel: ${parallelTime}ms, Improvement: ${improvement.toFixed(1)}%`);

      // Verify sequential took sum of operations
      expect(sequentialTime).toBeGreaterThanOrEqual(expectedSequential);
      expect(sequentialTime).toBeLessThan(expectedSequential + 100);

      // Verify parallel took time of longest operation
      expect(parallelTime).toBeGreaterThanOrEqual(expectedParallel);
      expect(parallelTime).toBeLessThan(expectedParallel + 100);

      // Verify 50-70% improvement
      expect(improvement).toBeGreaterThan(50);
      expect(improvement).toBeLessThan(80);
    });

    it('should show minimal benefit when operations are too fast to parallelize', async () => {
      const fastOperationMs = TestDelays.FAST;

      // Sequential
      const sequentialStart = Date.now();
      await createDelayedMock('r1', fastOperationMs)();
      await createDelayedMock('r2', fastOperationMs)();
      const sequentialTime = Date.now() - sequentialStart;

      // Parallel
      const parallelStart = Date.now();
      await Promise.all([
        createDelayedMock('r1', fastOperationMs)(),
        createDelayedMock('r2', fastOperationMs)()
      ]);
      const parallelTime = Date.now() - parallelStart;

      const improvement = ((sequentialTime - parallelTime) / sequentialTime) * 100;

      console.log(`Fast operations - Sequential: ${sequentialTime}ms, Parallel: ${parallelTime}ms, Improvement: ${improvement.toFixed(1)}%`);

      // Very fast operations may not show significant improvement
      expect(parallelTime).toBeLessThanOrEqual(sequentialTime);
    });
  });

  describe('Real-World Chat API Pattern', () => {
    it('should simulate actual chat API parallelization pattern', async () => {
      // Simulate actual database operation timings
      const mockLookupDomain = createDelayedMock('domain-123', TestDelays.LONG);
      const mockLoadWidgetConfig = createDelayedMock({ theme: 'light' }, TestDelays.EXTRA_LONG);
      const mockGetOrCreateConversation = createDelayedMock('conv-456', 80);
      const mockSaveUserMessage = createDelayedMock(undefined, 60);
      const mockGetConversationHistory = createDelayedMock([{ role: 'user', content: 'hi' }], 90);
      const mockLoadMetadata = createDelayedMock({ turn: 1 }, TestDelays.LONG);

      const totalStart = Date.now();

      // Step 1: Domain lookup (must be first)
      const domainLookupStart = Date.now();
      const domainId = await mockLookupDomain();
      const domainLookupTime = Date.now() - domainLookupStart;

      // Step 2: Parallel ops that depend on domainId
      const parallel1Start = Date.now();
      const [widgetConfig, conversationId] = await Promise.all([
        mockLoadWidgetConfig(),
        mockGetOrCreateConversation()
      ]);
      const parallel1Time = Date.now() - parallel1Start;

      // Step 3: Parallel ops that depend on conversationId
      const parallel2Start = Date.now();
      const [, historyData, metadata] = await Promise.all([
        mockSaveUserMessage(),
        mockGetConversationHistory(),
        mockLoadMetadata()
      ]);
      const parallel2Time = Date.now() - parallel2Start;

      const totalTime = Date.now() - totalStart;

      console.log('Chat API Parallelization Breakdown:');
      console.log(`  Domain lookup: ${domainLookupTime}ms`);
      console.log(`  Parallel batch 1: ${parallel1Time}ms (config + conversation)`);
      console.log(`  Parallel batch 2: ${parallel2Time}ms (save + history + metadata)`);
      console.log(`  Total time: ${totalTime}ms`);

      // Calculate expected times
      const expectedSequential = 75 + 100 + 80 + 60 + 90 + 70; // 475ms
      const expectedParallel = 75 + 100 + 90; // 265ms

      console.log(`  Expected sequential: ${expectedSequential}ms`);
      console.log(`  Expected parallel: ${expectedParallel}ms`);
      console.log(`  Improvement: ${(((expectedSequential - totalTime) / expectedSequential) * 100).toFixed(1)}%`);

      // Verify parallel execution is faster
      expect(totalTime).toBeLessThan(expectedSequential * 0.7); // At least 30% improvement
      expect(totalTime).toBeGreaterThanOrEqual(expectedParallel - TIMING_BUFFER);

      // Verify all operations completed
      expect(domainId).toBe('domain-123');
      expect(widgetConfig).toEqual({ theme: 'light' });
      expect(conversationId).toBe('conv-456');
      expect(historyData).toEqual([{ role: 'user', content: 'hi' }]);
      expect(metadata).toEqual({ turn: 1 });
    });

    it('should handle multi-stage parallel execution efficiently', async () => {
      // Stage 1: Initial lookups
      const stage1 = measureTime(async () => {
        return await Promise.all([
          createDelayedMock('domain', TestDelays.MEDIUM)(),
          createDelayedMock('user', TestDelays.MEDIUM)()
        ]);
      });

      const { result: [domainId, userId], elapsed: stage1Time } = await stage1;

      // Stage 2: Domain-dependent operations
      const stage2 = measureTime(async () => {
        return await Promise.all([
          createDelayedMock({ config: 'data' }, TestDelays.LONG)(),
          createDelayedMock('conversation', TestDelays.LONG)()
        ]);
      });

      const { result: [config, conversationId], elapsed: stage2Time } = await stage2;

      // Stage 3: Final operations
      const stage3 = measureTime(async () => {
        return await Promise.all([
          createDelayedMock('message-saved', TestDelays.SHORT)(),
          createDelayedMock([], TestDelays.SHORT)(),
          createDelayedMock({ metadata: true }, TestDelays.SHORT)()
        ]);
      });

      const { elapsed: stage3Time } = await stage3;

      const totalTime = stage1Time + stage2Time + stage3Time;

      console.log('Multi-stage execution:');
      console.log(`  Stage 1: ${stage1Time}ms`);
      console.log(`  Stage 2: ${stage2Time}ms`);
      console.log(`  Stage 3: ${stage3Time}ms`);
      console.log(`  Total: ${totalTime}ms`);

      // Verify all data was retrieved
      expect(domainId).toBe('domain');
      expect(userId).toBe('user');
      expect(config).toEqual({ config: 'data' });
      expect(conversationId).toBe('conversation');

      // Each stage should be approximately the time of longest operation
      expect(stage1Time).toBeLessThan(TestDelays.MEDIUM + TIMING_BUFFER);
      expect(stage2Time).toBeLessThan(TestDelays.LONG + TIMING_BUFFER);
      expect(stage3Time).toBeLessThan(TestDelays.SHORT + TIMING_BUFFER);
    });
  });
});
