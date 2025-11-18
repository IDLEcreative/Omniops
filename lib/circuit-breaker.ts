/**
 * Circuit Breaker Pattern Implementation
 *
 * Prevents cascading failures by tracking errors and temporarily blocking
 * requests when a threshold is reached. Implements three states:
 * - closed: Normal operation, requests pass through
 * - open: Threshold reached, requests are rejected
 * - half-open: Testing if service recovered, single request allowed
 *
 * @module lib/circuit-breaker
 */

export type CircuitBreakerState = 'closed' | 'open' | 'half-open';

export interface CircuitBreakerStats {
  state: CircuitBreakerState;
  failures: number;
  lastFailure: number;
  totalExecutions: number;
  totalFailures: number;
  totalSuccesses: number;
}

export class CircuitBreakerError extends Error {
  constructor(
    message: string,
    public readonly state: CircuitBreakerState,
    public readonly cooldownRemaining: number
  ) {
    super(message);
    this.name = 'CircuitBreakerError';
  }
}

export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: CircuitBreakerState = 'closed';

  // Statistics tracking
  private totalExecutions = 0;
  private totalFailures = 0;
  private totalSuccesses = 0;

  constructor(
    private threshold: number = 3,
    private timeout: number = 30000, // 30 seconds
    private name: string = 'CircuitBreaker'
  ) {
    this.log(`Initialized with threshold=${threshold}, timeout=${timeout}ms`);
  }

  /**
   * Execute a function with circuit breaker protection
   * @param fn Function to execute
   * @returns Result of the function
   * @throws CircuitBreakerError if circuit is open
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    this.totalExecutions++;

    // Check current state and handle accordingly
    if (this.state === 'open') {
      const cooldownRemaining = this.getCooldownRemaining();

      if (cooldownRemaining <= 0) {
        // Timeout elapsed, transition to half-open
        this.transitionState('open', 'half-open', 'timeout elapsed');
      } else {
        // Still in cooldown period
        this.log(
          `Circuit is open, rejecting execution (cooldown: ${Math.ceil(cooldownRemaining / 1000)}s remaining)`
        );
        throw new CircuitBreakerError(
          `Circuit breaker [${this.name}] is open`,
          'open',
          cooldownRemaining
        );
      }
    }

    try {
      // Execute the function
      const result = await fn();

      // Success handling
      this.recordSuccess();

      return result;
    } catch (error) {
      // Failure handling
      this.recordFailure();
      throw error;
    }
  }

  /**
   * Record a successful execution
   */
  private recordSuccess(): void {
    this.totalSuccesses++;

    if (this.state === 'half-open') {
      // Success in half-open state means service recovered
      this.transitionState('half-open', 'closed', 'reset');
      this.reset();
    } else if (this.state === 'closed' && this.failures > 0) {
      // Partial recovery in closed state
      this.failures = Math.max(0, this.failures - 1);
      this.log(`Partial recovery: failures reduced to ${this.failures}`);
    }
  }

  /**
   * Record a failed execution
   */
  private recordFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
    this.totalFailures++;

    this.log(`Failure recorded: ${this.failures}/${this.threshold}`);

    if (this.state === 'half-open') {
      // Failure in half-open state means service still unhealthy
      this.transitionState('half-open', 'open', 'half-open test failed');
    } else if (this.state === 'closed' && this.failures >= this.threshold) {
      // Threshold reached, open the circuit
      this.transitionState('closed', 'open', `threshold reached: ${this.failures} failures`);
    }
  }

  /**
   * Reset the circuit breaker to initial state
   */
  private reset(): void {
    this.failures = 0;
    this.lastFailureTime = 0;
    this.log('Circuit reset: failures cleared');
  }

  /**
   * Reset all statistics (for testing purposes)
   */
  private resetStats(): void {
    this.totalExecutions = 0;
    this.totalFailures = 0;
    this.totalSuccesses = 0;
    this.log('Statistics reset');
  }

  /**
   * Transition between states with logging
   */
  private transitionState(
    from: CircuitBreakerState,
    to: CircuitBreakerState,
    reason: string
  ): void {
    this.state = to;
    this.log(`State transition: ${from} → ${to} (${reason})`);
  }

  /**
   * Get remaining cooldown time in milliseconds
   */
  private getCooldownRemaining(): number {
    if (this.lastFailureTime === 0) return 0;
    const elapsed = Date.now() - this.lastFailureTime;
    return Math.max(0, this.timeout - elapsed);
  }

  /**
   * Get current circuit breaker statistics
   */
  getStats(): CircuitBreakerStats {
    return {
      state: this.state,
      failures: this.failures,
      lastFailure: this.lastFailureTime,
      totalExecutions: this.totalExecutions,
      totalFailures: this.totalFailures,
      totalSuccesses: this.totalSuccesses
    };
  }

  /**
   * Get current state
   */
  getState(): CircuitBreakerState {
    return this.state;
  }

  /**
   * Force circuit to open (for testing or manual intervention)
   */
  forceOpen(): void {
    this.transitionState(this.state, 'open', 'forced open');
    this.lastFailureTime = Date.now();
  }

  /**
   * Force circuit to close (for testing or manual intervention)
   */
  forceClose(): void {
    this.transitionState(this.state, 'closed', 'forced close');
    this.reset();
    this.resetStats();
  }

  /**
   * Centralized logging with circuit breaker name prefix
   */
  private log(message: string): void {
  }
}

/**
 * Factory function for creating circuit breakers with consistent configuration
 */
export function createCircuitBreaker(
  name: string,
  options?: {
    threshold?: number;
    timeout?: number;
  }
): CircuitBreaker {
  return new CircuitBreaker(
    options?.threshold ?? 3,
    options?.timeout ?? 30000,
    name
  );
}
