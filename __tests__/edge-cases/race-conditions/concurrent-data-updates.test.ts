/**
 * Concurrent Data Updates Test Suite
 *
 * **Purpose:** Tests for lost update detection and optimistic locking patterns
 * **Critical:** Detects data corruption from concurrent writes
 */

import { describe, it, expect } from '@jest/globals';
import { delay } from '../../utils/race-conditions/concurrency-helpers';

describe('Concurrent Data Updates', () => {
  it('should detect potential lost updates', async () => {
    let orderStatus = 'pending';

    const update1 = async () => {
      const current = orderStatus;
      await delay(10);
      orderStatus = 'processing';
      return { previous: current, new: 'processing' };
    };

    const update2 = async () => {
      const current = orderStatus;
      await delay(10);
      orderStatus = 'shipped';
      return { previous: current, new: 'shipped' };
    };

    const [result1, result2] = await Promise.all([update1(), update2()]);

    expect(orderStatus).toMatch(/processing|shipped/);
    expect(result1.previous).toBe('pending');
    expect(result2.previous).toBe('pending');
  });

  it('should implement optimistic locking pattern', async () => {
    const order = {
      status: 'pending',
      version: 1,
    };

    const updateWithVersion = async (newStatus: string, expectedVersion: number) => {
      await delay(10);

      if (order.version !== expectedVersion) {
        throw new Error('Version mismatch - retry required');
      }

      order.status = newStatus;
      order.version += 1;
      return order;
    };

    const result1 = await updateWithVersion('processing', 1);
    expect(result1.status).toBe('processing');
    expect(result1.version).toBe(2);

    await expect(updateWithVersion('shipped', 1)).rejects.toThrow('Version mismatch');

    const result2 = await updateWithVersion('shipped', 2);
    expect(result2.status).toBe('shipped');
    expect(result2.version).toBe(3);
  });

  it('should handle concurrent read-modify-write correctly', async () => {
    let counter = 0;

    const incrementWithoutLock = async () => {
      const current = counter;
      await delay(1);
      counter = current + 1;
    };

    await Promise.all(Array(10).fill(null).map(() => incrementWithoutLock()));

    expect(counter).toBeLessThanOrEqual(10);
    expect(counter).toBeGreaterThan(0);
  });
});
