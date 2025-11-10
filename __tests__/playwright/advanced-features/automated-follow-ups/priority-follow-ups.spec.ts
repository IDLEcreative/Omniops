import { test, expect } from '@playwright/test';
import { TEST_TIMEOUT, CRON_SECRET } from './helpers/constants';
import { mockFollowUpAPIs } from './helpers/mock-service';
import { triggerCronJob } from './helpers/follow-up-actions';

test.describe('Automated Follow-ups Priority Handling', () => {
  test.setTimeout(TEST_TIMEOUT);

  test('sends high-priority low-satisfaction follow-up', async ({ page }) => {
    const followUpService = await mockFollowUpAPIs(page);

    followUpService.addPendingFollowUp({
      reason: 'low_satisfaction',
      channel: 'email',
      content: 'We want to make things right. A specialist is ready to assist.',
    });

    await triggerCronJob(page, CRON_SECRET);

    const state = followUpService.getState();
    const satisfactionFollowUp = state.sentFollowUps.find((f) => f.reason === 'low_satisfaction');
    expect(satisfactionFollowUp).toBeDefined();
  });
});
