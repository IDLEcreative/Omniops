/**
 * Performance Under Load Simulations
 *
 * Tests performance with concurrent sessions, burst traffic, and degradation.
 */

import { describe, it, expect } from '@jest/globals';
import { UserSimulator } from '../../utils/simulation/user-simulator';

describe('Performance Under Load', () => {
  it('should maintain performance with 1000 concurrent sessions', async () => {
    const users: UserSimulator[] = [];

    for (let i = 0; i < 1000; i++) {
      users.push(
        new UserSimulator(`load-user-${i}`, {
          persistence: true,
          multiTab: true,
          crossPage: true,
        })
      );
    }

    const startTime = Date.now();

    // Process in batches to simulate real-world concurrency
    const batchSize = 100;
    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);
      await Promise.all(batch.map(user => user.sendMessage('Load test')));
    }

    const duration = Date.now() - startTime;

    // Should process 1000 users in under 11 seconds (accounting for network simulation)
    expect(duration).toBeLessThan(11000);
    expect(users.every(u => u.getMessageCount() === 1)).toBe(true);
  }, 15000);

  it('should handle burst traffic (100 simultaneous requests)', async () => {
    const users: UserSimulator[] = [];

    for (let i = 0; i < 100; i++) {
      users.push(
        new UserSimulator(`burst-user-${i}`, {
          persistence: true,
          multiTab: false,
          crossPage: false,
        })
      );
    }

    const startTime = Date.now();

    // All users send messages at the exact same time
    await Promise.all(users.map(user => user.sendMessage('Burst test')));

    const duration = Date.now() - startTime;

    // Should handle burst in under 3 seconds
    expect(duration).toBeLessThan(3000);
  }, 5000);

  it('should not degrade performance over time', async () => {
    const user = new UserSimulator('performance-degradation-test', {
      persistence: true,
      multiTab: true,
      crossPage: true,
    });

    const measurements: number[] = [];

    // Measure 10 message cycles
    for (let i = 0; i < 10; i++) {
      const start = Date.now();
      await user.sendMessage(`Message ${i}`);
      await user.receiveResponse();
      const duration = Date.now() - start;
      measurements.push(duration);
    }

    // Last message should not be significantly slower than first
    const firstAvg = measurements.slice(0, 3).reduce((a, b) => a + b) / 3;
    const lastAvg = measurements.slice(-3).reduce((a, b) => a + b) / 3;

    expect(lastAvg).toBeLessThan(firstAvg * 1.5); // Max 50% degradation
  }, 30000);
});
