/**
 * Shared Test Helpers for Parallel Operations Tests
 *
 * Common utilities for testing parallel execution patterns.
 */

import { jest } from '@jest/globals';

/**
 * Creates a mock function with configurable delay
 */
export const createDelayedMock = (returnValue: any, delayMs: number) => {
  return jest.fn(() =>
    new Promise(resolve => setTimeout(() => resolve(returnValue), delayMs))
  );
};

/**
 * Creates a mock function that rejects after a delay
 */
export const createFailureMock = (errorMessage: string, delayMs: number) => {
  return jest.fn(() =>
    new Promise((_, reject) => setTimeout(() => reject(new Error(errorMessage)), delayMs))
  );
};

/**
 * Measures execution time of an async operation
 */
export const measureTime = async <T>(operation: () => Promise<T>): Promise<{ result: T; elapsed: number }> => {
  const start = Date.now();
  const result = await operation();
  const elapsed = Date.now() - start;
  return { result, elapsed };
};

/**
 * Tracks execution order of operations
 */
export class ExecutionTracker {
  private events: string[] = [];

  push(event: string) {
    this.events.push(event);
  }

  getEvents() {
    return [...this.events];
  }

  reset() {
    this.events = [];
  }

  indexOf(event: string) {
    return this.events.indexOf(event);
  }

  slice(start: number, end?: number) {
    return this.events.slice(start, end);
  }
}

/**
 * Standard test operation delays (in ms)
 */
export const TestDelays = {
  FAST: 5,
  SHORT: 25,
  MEDIUM: 50,
  LONG: 75,
  EXTRA_LONG: 100
} as const;

/**
 * Standard buffer for timing assertions (in ms)
 */
export const TIMING_BUFFER = 50;
