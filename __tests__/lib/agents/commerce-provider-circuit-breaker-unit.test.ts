/**
 * Circuit Breaker Unit Tests
 *
 * Tests the circuit breaker implementation in isolation from the provider resolution logic.
 * These tests verify the circuit breaker state machine works correctly.
 */

import { CircuitBreaker, CircuitBreakerError, createCircuitBreaker } from '@/lib/circuit-breaker';

describe('Circuit Breaker Unit Tests', () => {
  let circuitBreaker: CircuitBreaker;

  beforeEach(() => {
    circuitBreaker = createCircuitBreaker('TestCircuit', {
      threshold: 3,
      timeout: 1000, // 1 second for faster tests
    });
  });

  describe('State Transitions', () => {
    it('should start in closed state', () => {
      const stats = circuitBreaker.getStats();
      expect(stats.state).toBe('closed');
      expect(stats.failures).toBe(0);
    });

    it('should open after threshold failures', async () => {
      const failingFn = jest.fn().mockRejectedValue(new Error('Service down'));

      // Execute 3 times to reach threshold
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(failingFn);
        } catch (error) {
          // Expected to fail
        }
      }

      const stats = circuitBreaker.getStats();
      expect(stats.state).toBe('open');
      expect(stats.failures).toBeGreaterThanOrEqual(3);
    });

    it('should reject requests when open', async () => {
      // Open the circuit
      const failingFn = jest.fn().mockRejectedValue(new Error('Service down'));
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(failingFn);
        } catch (error) {
          // Expected
        }
      }

      expect(circuitBreaker.getState()).toBe('open');

      // Try to execute again - should be rejected immediately
      await expect(circuitBreaker.execute(jest.fn())).rejects.toThrow(CircuitBreakerError);
    });

    it('should transition to half-open after timeout', async () => {
      // Open the circuit
      const failingFn = jest.fn().mockRejectedValue(new Error('Service down'));
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(failingFn);
        } catch (error) {
          // Expected
        }
      }

      expect(circuitBreaker.getState()).toBe('open');

      // Wait for timeout
      await new Promise((resolve) => setTimeout(resolve, 1100));

      // Next execution should transition to half-open
      // We need to actually execute to trigger the transition
      const successFn = jest.fn().mockResolvedValue('success');
      const result = await circuitBreaker.execute(successFn);

      expect(result).toBe('success');
      expect(circuitBreaker.getState()).toBe('closed'); // Success in half-open closes it
    }, 3000);

    it('should close after successful request in half-open state', async () => {
      // Open the circuit
      const failingFn = jest.fn().mockRejectedValue(new Error('Service down'));
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(failingFn);
        } catch (error) {
          // Expected
        }
      }

      // Wait for timeout
      await new Promise((resolve) => setTimeout(resolve, 1100));

      // Successful execution should close circuit
      const successFn = jest.fn().mockResolvedValue('success');
      await circuitBreaker.execute(successFn);

      const stats = circuitBreaker.getStats();
      expect(stats.state).toBe('closed');
      expect(stats.failures).toBe(0);
    }, 3000);

    it('should reopen if request fails in half-open state', async () => {
      // Open the circuit
      const failingFn = jest.fn().mockRejectedValue(new Error('Service down'));
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(failingFn);
        } catch (error) {
          // Expected
        }
      }

      // Wait for timeout
      await new Promise((resolve) => setTimeout(resolve, 1100));

      // Failed execution in half-open should reopen circuit
      try {
        await circuitBreaker.execute(failingFn);
      } catch (error) {
        // Expected
      }

      const stats = circuitBreaker.getStats();
      expect(stats.state).toBe('open');
    }, 3000);
  });

  describe('Statistics', () => {
    it('should track total executions', async () => {
      const fn = jest.fn().mockResolvedValue('success');

      const initialStats = circuitBreaker.getStats();
      const initialExecutions = initialStats.totalExecutions;

      await circuitBreaker.execute(fn);
      await circuitBreaker.execute(fn);

      const stats = circuitBreaker.getStats();
      expect(stats.totalExecutions).toBe(initialExecutions + 2);
    });

    it('should track failures', async () => {
      const failingFn = jest.fn().mockRejectedValue(new Error('Failure'));

      const initialStats = circuitBreaker.getStats();
      const initialFailures = initialStats.totalFailures;

      try {
        await circuitBreaker.execute(failingFn);
      } catch (error) {
        // Expected
      }

      const stats = circuitBreaker.getStats();
      expect(stats.totalFailures).toBe(initialFailures + 1);
    });

    it('should track successes', async () => {
      const successFn = jest.fn().mockResolvedValue('success');

      const initialStats = circuitBreaker.getStats();
      const initialSuccesses = initialStats.totalSuccesses;

      await circuitBreaker.execute(successFn);

      const stats = circuitBreaker.getStats();
      expect(stats.totalSuccesses).toBe(initialSuccesses + 1);
    });
  });

  describe('Manual Control', () => {
    it('should allow manual open', () => {
      circuitBreaker.forceOpen();
      expect(circuitBreaker.getState()).toBe('open');
    });

    it('should allow manual close', async () => {
      // Open the circuit
      const failingFn = jest.fn().mockRejectedValue(new Error('Service down'));
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(failingFn);
        } catch (error) {
          // Expected
        }
      }

      expect(circuitBreaker.getState()).toBe('open');

      // Manually close
      circuitBreaker.forceClose();

      const stats = circuitBreaker.getStats();
      expect(stats.state).toBe('closed');
      expect(stats.failures).toBe(0);
    });
  });

  describe('Partial Recovery', () => {
    it('should reduce failure count on success in closed state', async () => {
      // Cause 2 failures (not enough to open)
      const failingFn = jest.fn().mockRejectedValue(new Error('Failure'));
      for (let i = 0; i < 2; i++) {
        try {
          await circuitBreaker.execute(failingFn);
        } catch (error) {
          // Expected
        }
      }

      let stats = circuitBreaker.getStats();
      expect(stats.failures).toBe(2);
      expect(stats.state).toBe('closed');

      // Successful execution should reduce failure count
      const successFn = jest.fn().mockResolvedValue('success');
      await circuitBreaker.execute(successFn);

      stats = circuitBreaker.getStats();
      expect(stats.failures).toBe(1); // Reduced by 1
      expect(stats.state).toBe('closed'); // Still closed
    });
  });
});
