import { expect, Page } from '@playwright/test';
import { BASE_URL } from './constants';
import { FollowUpService } from './mock-service';

export async function testFollowUpCancellation(page: Page, followUpService: FollowUpService) {
  const followUp = followUpService.addPendingFollowUp({
    conversation_id: 'conv_cancel_test',
    scheduled_at: new Date(Date.now() + 60000).toISOString(),
  });

  await page.goto(`${BASE_URL}/widget-test`, { waitUntil: 'networkidle' });

  const iframe = page.frameLocator('iframe#chat-widget-iframe');
  const inputField = iframe.locator('input[type="text"], textarea').first();
  await inputField.waitFor({ state: 'visible', timeout: 5000 });
  await inputField.click();
  await inputField.fill("I'm back!");
  await inputField.press('Enter');

  const state = followUpService.getState();
  const stillPending = state.pendingFollowUps.find((f) => f.id === followUp.id);

  expect(stillPending).toBeUndefined();
}
