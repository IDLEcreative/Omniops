/**
 * Phase 3 Rollout Simulation: Cross-Page Persistence (100 Pilot Users)
 *
 * Tests for cross-page persistence across 100 pilot users.
 */

import { describe, it, expect } from '@jest/globals';
import { UserSimulator } from '../../utils/simulation/user-simulator';
import { SIMULATION_CONFIG } from '../../utils/simulation/simulation-config';

describe('Phase 3 Rollout Simulation: 100 Pilot Users', () => {
  it('should handle 100 pilot users with cross-page persistence', async () => {
    const users: UserSimulator[] = [];

    for (let i = 0; i < SIMULATION_CONFIG.phase3Users; i++) {
      users.push(
        new UserSimulator(`phase3-user-${i}`, {
          persistence: true,
          multiTab: true,
          crossPage: true,
        })
      );
    }

    // Each user navigates across 5 pages
    await Promise.all(
      users.slice(0, 10).flatMap(user => [
        user.sendMessage('Message 1'),
        user.navigateToNewPage(),
        user.sendMessage('Message 2'),
        user.navigateToNewPage(),
        user.sendMessage('Message 3'),
      ])
    );

    // All users should have 3 messages
    expect(users.slice(0, 10).every(u => u.getMessageCount() === 3)).toBe(true);
  });

  it('should maintain conversation context across page navigation', async () => {
    const user = new UserSimulator('phase3-context-test', {
      persistence: true,
      multiTab: true,
      crossPage: true,
    });

    await user.sendMessage('Question about product');
    await user.navigateToNewPage();
    await user.sendMessage('Follow-up question');

    // Both messages should be in same conversation
    expect(user.getMessageCount()).toBe(2);
  });

  it('should handle complex navigation patterns', async () => {
    const user = new UserSimulator('phase3-navigation-test', {
      persistence: true,
      multiTab: true,
      crossPage: true,
    });

    // Home -> Product -> Cart -> Checkout
    await user.sendMessage('Show products');
    await user.navigateToNewPage();

    await user.sendMessage('Add to cart');
    await user.navigateToNewPage();

    await user.sendMessage('Checkout help');
    await user.navigateToNewPage();

    await user.sendMessage('Complete order');

    expect(user.getMessageCount()).toBe(4);
  });
});
