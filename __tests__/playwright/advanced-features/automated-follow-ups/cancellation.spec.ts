import { test } from '@playwright/test';
import { TEST_TIMEOUT } from './helpers/constants';
import { mockFollowUpAPIs } from './helpers/mock-service';
import { testFollowUpCancellation } from './helpers/cancellation';

test.describe('Automated Follow-ups Cancellation', () => {
  test.setTimeout(TEST_TIMEOUT);

  test('pending follow-up cancelled when user returns', async ({ page }) => {
    const followUpService = await mockFollowUpAPIs(page);
    await testFollowUpCancellation(page, followUpService);
  });
});
