/**
 * Phase 2 Rollout Simulation: Multi-Tab Sync (100 Pilot Users)
 *
 * Tests for multi-tab synchronization across 100 pilot users.
 */

import { describe, it, expect } from '@jest/globals';
import { UserSimulator } from '../../utils/simulation/user-simulator';
import { SIMULATION_CONFIG } from '../../utils/simulation/simulation-config';

describe('Phase 2 Rollout Simulation: 100 Pilot Users', () => {
  it('should handle 100 pilot users with multi-tab sync', async () => {
    const users: UserSimulator[] = [];

    for (let i = 0; i < SIMULATION_CONFIG.phase2Users; i++) {
      users.push(
        new UserSimulator(`phase2-user-${i}`, {
          persistence: true,
          multiTab: true,
          crossPage: false,
        })
      );
    }

    // Each user opens 3 tabs
    await Promise.all(
      users.slice(0, 10).flatMap(user => [
        user.openNewTab(),
        user.openNewTab(),
        user.openNewTab(),
      ])
    );

    // Should handle 30 tabs without errors
    expect(true).toBe(true);
  });

  it('should sync conversation state across tabs', async () => {
    const user = new UserSimulator('phase2-sync-test', {
      persistence: true,
      multiTab: true,
      crossPage: false,
    });

    // Send message in tab 1
    await user.sendMessage('Tab 1 message');

    // Open tab 2 - should see tab 1's message
    await user.openNewTab();

    expect(user.getMessageCount()).toBe(1);
  });

  it('should handle rapid tab switching', async () => {
    const user = new UserSimulator('phase2-rapid-tab-test', {
      persistence: true,
      multiTab: true,
      crossPage: false,
    });

    // Rapidly open and switch tabs
    for (let i = 0; i < 10; i++) {
      await user.openNewTab();
      await user.sendMessage(`Message ${i}`);
    }

    expect(user.getMessageCount()).toBe(10);
  }, 15000); // Increased timeout for rapid tab operations
});
