/**
 * Parallel Operations - Execution Patterns
 *
 * Tests basic parallelization patterns, dependency handling,
 * and error scenarios for database operations.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  createDelayedMock,
  createFailureMock,
  ExecutionTracker,
  TestDelays,
  TIMING_BUFFER
} from './parallel-test-helpers';

describe('Chat API Parallel Operations - Patterns', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Independent Operations Parallelization', () => {
    it('should execute domain lookup and user lookup in parallel when independent', async () => {
      const startTime = Date.now();

      // Each operation takes 100ms
      const mockDomainLookup = createDelayedMock('domain-id-123', TestDelays.EXTRA_LONG);
      const mockUserLookup = createDelayedMock('user-id-456', TestDelays.EXTRA_LONG);

      // Parallel execution
      const [domainId, userId] = await Promise.all([
        mockDomainLookup(),
        mockUserLookup()
      ]);

      const elapsed = Date.now() - startTime;

      // Sequential would take 200ms, parallel should be ~100ms
      expect(elapsed).toBeLessThan(TestDelays.EXTRA_LONG + TIMING_BUFFER);
      // Allow 5ms tolerance for timing variations
      expect(elapsed).toBeGreaterThanOrEqual(TestDelays.EXTRA_LONG - 5);
      expect(domainId).toBe('domain-id-123');
      expect(userId).toBe('user-id-456');
      expect(mockDomainLookup).toHaveBeenCalledTimes(1);
      expect(mockUserLookup).toHaveBeenCalledTimes(1);
    });

    it('should handle parallel operations with different execution times', async () => {
      const startTime = Date.now();

      // Different execution times: 50ms, 100ms, 75ms
      const mockOp1 = createDelayedMock('result-1', TestDelays.MEDIUM);
      const mockOp2 = createDelayedMock('result-2', TestDelays.EXTRA_LONG);
      const mockOp3 = createDelayedMock('result-3', TestDelays.LONG);

      const [result1, result2, result3] = await Promise.all([
        mockOp1(),
        mockOp2(),
        mockOp3()
      ]);

      const elapsed = Date.now() - startTime;

      // Should take time of longest operation (100ms), not sum (225ms)
      expect(elapsed).toBeLessThan(TestDelays.EXTRA_LONG + TIMING_BUFFER);
      // Allow 5ms tolerance for timing variations
      expect(elapsed).toBeGreaterThanOrEqual(TestDelays.EXTRA_LONG - 5);
      expect([result1, result2, result3]).toEqual(['result-1', 'result-2', 'result-3']);
    });
  });

  describe('Dependent Operations Sequencing', () => {
    it('should maintain correct order for dependent operations', async () => {
      const tracker = new ExecutionTracker();

      // Step 1: Domain lookup (must be first)
      const mockDomainLookup = jest.fn(async () => {
        tracker.push('domain-lookup-start');
        await new Promise(resolve => setTimeout(resolve, TestDelays.MEDIUM));
        tracker.push('domain-lookup-end');
        return 'domain-id';
      });

      // Step 2: Operations that depend on domain (can be parallel)
      const mockWidgetConfig = jest.fn(async (domainId: string) => {
        expect(domainId).toBe('domain-id');
        tracker.push('widget-config-start');
        await new Promise(resolve => setTimeout(resolve, TestDelays.MEDIUM));
        tracker.push('widget-config-end');
        return { theme: 'dark' };
      });

      const mockConversation = jest.fn(async (domainId: string) => {
        expect(domainId).toBe('domain-id');
        tracker.push('conversation-start');
        await new Promise(resolve => setTimeout(resolve, TestDelays.MEDIUM));
        tracker.push('conversation-end');
        return 'conv-id';
      });

      // Step 3: Operations that depend on conversation
      const mockSaveMessage = jest.fn(async (conversationId: string) => {
        expect(conversationId).toBe('conv-id');
        tracker.push('save-message');
        await new Promise(resolve => setTimeout(resolve, TestDelays.SHORT));
      });

      // Execute in correct order
      const domainId = await mockDomainLookup();

      const [widgetConfig, conversationId] = await Promise.all([
        mockWidgetConfig(domainId),
        mockConversation(domainId)
      ]);

      await mockSaveMessage(conversationId);

      // Verify execution order
      const events = tracker.getEvents();
      expect(events[0]).toBe('domain-lookup-start');
      expect(events[1]).toBe('domain-lookup-end');

      // Widget and conversation should start in parallel (order may vary)
      const parallelStarts = tracker.slice(2, 4);
      expect(parallelStarts).toContain('widget-config-start');
      expect(parallelStarts).toContain('conversation-start');

      // Save message must come after conversation completes
      expect(tracker.indexOf('save-message')).toBeGreaterThan(tracker.indexOf('conversation-end'));
    });

    it('should not parallelize operations with direct dependencies', async () => {
      let conversationId: string | undefined = undefined;

      const mockCreateConversation = jest.fn(async () => {
        await new Promise(resolve => setTimeout(resolve, TestDelays.MEDIUM));
        conversationId = 'conv-123';
        return conversationId;
      });

      const mockSaveMessage = jest.fn(async (id: string) => {
        expect(id).toBeDefined();
        expect(id).toBe('conv-123');
        await new Promise(resolve => setTimeout(resolve, TestDelays.SHORT));
      });

      // CORRECT: Sequential execution for dependent operations
      const newConvId = await mockCreateConversation();
      await mockSaveMessage(newConvId);

      expect(mockCreateConversation).toHaveBeenCalledTimes(1);
      expect(mockSaveMessage).toHaveBeenCalledTimes(1);
      expect(mockSaveMessage).toHaveBeenCalledWith('conv-123');
    });
  });

  describe('Error Handling in Parallel Operations', () => {
    it('should handle errors in one parallel operation without blocking others', async () => {
      const mockSuccessOp = createDelayedMock('success', TestDelays.MEDIUM);
      const mockFailureOp = createFailureMock('Operation failed', TestDelays.MEDIUM);

      // Use allSettled to handle partial failures
      const results = await Promise.allSettled([
        mockSuccessOp(),
        mockFailureOp()
      ]);

      expect(results[0].status).toBe('fulfilled');
      expect((results[0] as PromiseFulfilledResult<string>).value).toBe('success');
      expect(results[1].status).toBe('rejected');
      expect((results[1] as PromiseRejectedResult).reason.message).toBe('Operation failed');
    });

    it('should fail fast with Promise.all when any operation fails', async () => {
      const mockOp1 = createDelayedMock('result-1', TestDelays.EXTRA_LONG);
      const mockOp2 = createFailureMock('Early failure', 30);
      const mockOp3 = createDelayedMock('result-3', TestDelays.EXTRA_LONG);

      await expect(Promise.all([
        mockOp1(),
        mockOp2(),
        mockOp3()
      ])).rejects.toThrow('Early failure');
    });
  });

  describe('Race Conditions and Data Consistency', () => {
    it('should not introduce race conditions in parallel writes', async () => {
      const sharedState: string[] = [];

      const mockOp1 = jest.fn(async () => {
        await new Promise(resolve => setTimeout(resolve, TestDelays.MEDIUM));
        sharedState.push('op1');
      });

      const mockOp2 = jest.fn(async () => {
        await new Promise(resolve => setTimeout(resolve, 30));
        sharedState.push('op2');
      });

      const mockOp3 = jest.fn(async () => {
        await new Promise(resolve => setTimeout(resolve, 40));
        sharedState.push('op3');
      });

      // Execute in parallel
      await Promise.all([mockOp1(), mockOp2(), mockOp3()]);

      // All operations should complete
      expect(sharedState).toHaveLength(3);
      expect(sharedState).toContain('op1');
      expect(sharedState).toContain('op2');
      expect(sharedState).toContain('op3');
    });

    it('should ensure conversation ID is available before dependent operations', async () => {
      let conversationId: string | undefined;

      const mockGetOrCreateConversation = jest.fn(async () => {
        await new Promise(resolve => setTimeout(resolve, TestDelays.MEDIUM));
        conversationId = 'conv-789';
        return conversationId;
      });

      const mockSaveMessage = jest.fn(async (id: string) => {
        expect(id).toBeDefined();
        expect(id).toBe('conv-789');
      });

      // Correct pattern: Sequential
      const newConvId = await mockGetOrCreateConversation();
      await mockSaveMessage(newConvId);

      expect(mockSaveMessage).toHaveBeenCalledWith('conv-789');
    });
  });
});
