import { test, expect } from '@playwright/test';
import { TEST_TIMEOUT, CRON_SECRET } from './helpers/constants';
import { mockFollowUpAPIs } from './helpers/mock-service';
import { triggerCronJob, verifyAnalyticsUpdated } from './helpers/follow-up-actions';

test.describe('Automated Follow-ups Analytics', () => {
  test.setTimeout(TEST_TIMEOUT);

  test('tracks response metrics across channels', async ({ page }) => {
    const followUpService = await mockFollowUpAPIs(page);

    for (let i = 0; i < 3; i += 1) {
      followUpService.addPendingFollowUp({
        conversation_id: `conv_analytics_${i}`,
        channel: i % 2 === 0 ? 'email' : 'in_app',
      });
    }

    await triggerCronJob(page, CRON_SECRET);
    await verifyAnalyticsUpdated(page);

    const state = followUpService.getState();
    expect(state.sentFollowUps.length).toBeGreaterThanOrEqual(3);
  });
});
