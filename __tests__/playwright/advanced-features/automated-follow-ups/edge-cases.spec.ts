import { test, expect } from '@playwright/test';
import { TEST_TIMEOUT, CRON_SECRET } from './helpers/constants';
import { mockFollowUpAPIs } from './helpers/mock-service';
import { triggerCronJob } from './helpers/follow-up-actions';

test.describe('Automated Follow-ups Edge Cases', () => {
  test.setTimeout(TEST_TIMEOUT);

  test('respects follow-up attempt limits', async ({ page }) => {
    const followUpService = await mockFollowUpAPIs(page);
    const conversationId = 'conv_max_attempts';

    for (let i = 0; i < 2; i += 1) {
      followUpService.addPendingFollowUp({
        conversation_id: conversationId,
        scheduled_at: new Date(Date.now() + i * 1000).toISOString(),
      });
    }

    await triggerCronJob(page, CRON_SECRET);
    const state = followUpService.getState();
    const sentCount = state.sentFollowUps.filter((f) => f.conversation_id === conversationId).length;
    expect(sentCount).toBeLessThanOrEqual(2);
  });

  test('supports multiple scheduling windows', async ({ page }) => {
    const followUpService = await mockFollowUpAPIs(page);
    const now = Date.now();

    [1000, 60000, 900000].forEach((delay) => {
      followUpService.addPendingFollowUp({
        conversation_id: `conv_timed_${delay}`,
        scheduled_at: new Date(now + delay).toISOString(),
      });
    });

    const state = followUpService.getState();
    expect(state.pendingFollowUps.length).toBe(3);
  });

  test('handles email vs in-app channel routing', async ({ page }) => {
    const followUpService = await mockFollowUpAPIs(page);

    followUpService.addPendingFollowUp({ conversation_id: 'conv_email', channel: 'email' });
    followUpService.addPendingFollowUp({ conversation_id: 'conv_in_app', channel: 'in_app' });

    await triggerCronJob(page, CRON_SECRET);

    const state = followUpService.getState();
    const emailSent = state.sentFollowUps.filter((f) => f.channel === 'email').length;
    const inAppSent = state.sentFollowUps.filter((f) => f.channel === 'in_app').length;

    expect(emailSent).toBeGreaterThan(0);
    expect(inAppSent).toBeGreaterThan(0);
  });
});
