import { test, expect } from '@playwright/test';
import { TEST_TIMEOUT, CRON_SECRET } from './helpers/constants';
import { mockFollowUpAPIs } from './helpers/mock-service';
import { startConversation, abandonConversation, respondToFollowUp } from './helpers/chat-session';
import {
  triggerFollowUpDetection,
  verifyFollowUpScheduled,
  triggerCronJob,
  verifyFollowUpNotification,
  verifyAnalyticsUpdated,
} from './helpers/follow-up-actions';

test.describe('Automated Follow-ups Workflow', () => {
  test.setTimeout(TEST_TIMEOUT);

  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('abandoned conversation → detection → schedule → send', async ({ page }) => {
    const followUpService = await mockFollowUpAPIs(page);
    const conversation = await startConversation(page);

    await abandonConversation(page, conversation);
    await triggerFollowUpDetection(page);
    await verifyFollowUpScheduled(page);

    await triggerCronJob(page, CRON_SECRET);
    await verifyFollowUpNotification(page);

    await respondToFollowUp(page);
    await verifyAnalyticsUpdated(page);

    const state = followUpService.getState();
    expect(state.sentFollowUps.length).toBeGreaterThan(0);
  });
});
