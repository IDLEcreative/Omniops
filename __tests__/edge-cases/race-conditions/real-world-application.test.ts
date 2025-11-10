/**
 * Real-World Application Tests
 *
 * **Purpose:** Integration tests combining multiple concurrency patterns
 * **Critical:** Validates production-like scenarios
 */

import { describe, it, expect } from '@jest/globals';
import { delay } from '../../utils/race-conditions/concurrency-helpers';

interface Order {
  id: string;
  status: string;
  version: number;
}

describe('Real-World Application Tests', () => {
  it('should handle concurrent order status updates with locking', async () => {
    let order: Order = { id: 'ORD-123', status: 'pending', version: 1 };

    const updateOrderStatus = async (newStatus: string, expectedVersion: number) => {
      await delay(10);

      if (order.version !== expectedVersion) {
        throw new Error(`Version mismatch: expected ${expectedVersion}, got ${order.version}`);
      }

      order = {
        ...order,
        status: newStatus,
        version: order.version + 1,
      };

      return order;
    };

    const updates = [updateOrderStatus('processing', 1), updateOrderStatus('canceled', 1)];

    const results = await Promise.allSettled(updates);

    const successes = results.filter((r) => r.status === 'fulfilled');
    const failures = results.filter((r) => r.status === 'rejected');

    expect(successes.length).toBe(1);
    expect(failures.length).toBe(1);
    expect(order.version).toBe(2);
  });

  it('should coordinate cache updates across instances', async () => {
    const sharedCache: Record<string, { data: any; version: number }> = {};

    const updateCache = async (key: string, data: any) => {
      const current = sharedCache[key];
      const currentVersion = current?.version || 0;

      await delay(10);

      if (sharedCache[key]?.version && sharedCache[key].version > currentVersion) {
        return sharedCache[key];
      }

      sharedCache[key] = {
        data,
        version: currentVersion + 1,
      };

      return sharedCache[key];
    };

    const results = await Promise.all(
      Array(10)
        .fill(null)
        .map((_, i) => updateCache('key-1', `data-${i}`))
    );

    expect(sharedCache['key-1'].version).toBeGreaterThan(0);
    expect(sharedCache['key-1'].version).toBeLessThanOrEqual(10);
  });
});
