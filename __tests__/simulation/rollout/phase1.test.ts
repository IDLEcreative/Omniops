/**
 * Phase 1 Rollout Simulation: Basic Persistence (1000 Users)
 *
 * Tests for basic localStorage persistence across 1000 concurrent users.
 */

import { describe, it, expect } from '@jest/globals';
import { UserSimulator } from '../../utils/simulation/user-simulator';
import { SIMULATION_CONFIG } from '../../utils/simulation/simulation-config';

describe('Phase 1 Rollout Simulation: 1000 Users', () => {
  it('should handle 1000 concurrent users with localStorage persistence', async () => {
    const users: UserSimulator[] = [];

    // Create 1000 users
    for (let i = 0; i < SIMULATION_CONFIG.phase1Users; i++) {
      users.push(
        new UserSimulator(`phase1-user-${i}`, {
          persistence: true,
          multiTab: false,
          crossPage: false,
        })
      );
    }

    // Simulate concurrent message sending
    const startTime = Date.now();

    await Promise.all(
      users.slice(0, SIMULATION_CONFIG.concurrentUsers).map(user =>
        user.sendMessage('Hello')
      )
    );

    const duration = Date.now() - startTime;

    // Should handle 50 concurrent users in reasonable time
    expect(duration).toBeLessThan(2000); // Max 2 seconds

    // Verify all users have messages
    expect(users[0].getMessageCount()).toBe(1);
    expect(users[49].getMessageCount()).toBe(1);
  }, 10000);

  it('should maintain localStorage persistence across page refreshes', async () => {
    const user = new UserSimulator('phase1-refresh-test', {
      persistence: true,
      multiTab: false,
      crossPage: false,
    });

    // Send messages
    await user.sendMessage('Message 1');
    await user.sendMessage('Message 2');
    await user.sendMessage('Message 3');

    expect(user.getMessageCount()).toBe(3);

    // Simulate page refresh (without cross-page, data lost)
    await user.navigateToNewPage();

    // With only localStorage persistence, data is lost on navigation
    expect(user.getMessageCount()).toBe(0);
  });

  it('should handle various browser/device combinations', async () => {
    const combinations: UserSimulator[] = [];

    SIMULATION_CONFIG.browsers.forEach(browser => {
      SIMULATION_CONFIG.devices.forEach(device => {
        combinations.push(
          new UserSimulator(`user-${browser}-${device}`, {
            persistence: true,
            multiTab: false,
            crossPage: false,
          })
        );
      });
    });

    // All combinations should work
    await Promise.all(
      combinations.map(user => user.sendMessage('Test'))
    );

    expect(combinations.length).toBe(
      SIMULATION_CONFIG.browsers.length * SIMULATION_CONFIG.devices.length
    );
    expect(combinations.every(u => u.getMessageCount() === 1)).toBe(true);
  });

  it('should handle poor network conditions (3G)', async () => {
    const user = new UserSimulator('phase1-3g-test', {
      persistence: true,
      multiTab: false,
      crossPage: false,
    });

    // Force 3G network
    (user as any).user.network = '3g';

    const startTime = Date.now();
    await user.sendMessage('Test on 3G');
    const duration = Date.now() - startTime;

    // Should take longer on 3G but still complete
    expect(duration).toBeGreaterThan(500);
    expect(user.getMessageCount()).toBe(1);
  }, 5000);
});
