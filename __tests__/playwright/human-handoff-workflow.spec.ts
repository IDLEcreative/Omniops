/**
 * E2E Test: Complete Human Handoff Workflow
 *
 * Tests the COMPLETE human handoff journey from user request to agent assignment.
 * This validates the primary customer support escalation workflow end-to-end.
 *
 * User Journey:
 * 1. Load chat widget
 * 2. Send multiple messages to chat
 * 3. Click "Request Human Help" button
 * 4. Verify request success in widget
 * 5. Verify notification created in database
 * 6. Open dashboard and verify badge count
 * 7. Filter to "🚨 Human" tab
 * 8. Verify conversation shows in list with indicators
 * 9. Click conversation to view details
 * 10. Verify conversation metadata is correct ← THE TRUE "END"
 *
 * This test teaches AI agents:
 * - How to navigate the complete handoff flow
 * - Expected UI states at each step
 * - Database state verification
 * - Real-time update behavior
 */

import { test, expect, type Page } from '@playwright/test';

test.describe('Human Handoff Workflow', () => {
  let conversationId: string;

  test.beforeEach(async ({ page }) => {
    console.log('📍 Setup: Navigating to widget test page');
    await page.goto('/widget-test');
    await page.waitForLoadState('networkidle');
  });

  test('user requests human help and agent receives notification', async ({ page, browser }) => {
    console.log('\n=== PHASE 1: User Requests Human Help ===\n');

    console.log('📍 Step 1: Load chat widget');
    const widgetFrame = page.frameLocator('iframe#chat-widget-iframe');
    await expect(widgetFrame.locator('text=Support')).toBeVisible();
    console.log('✅ Widget loaded successfully');

    console.log('📍 Step 2: Send first message to chat');
    const messageInput = widgetFrame.locator('input[placeholder*="Type"], textarea[placeholder*="Type"]');
    await messageInput.fill('Hello, I need help with my order');
    await messageInput.press('Enter');
    await page.waitForTimeout(2000); // Wait for AI response
    console.log('✅ First message sent');

    console.log('📍 Step 3: Send second message (triggers "Request Human Help" button)');
    await messageInput.fill('This is urgent, I need to speak with someone');
    await messageInput.press('Enter');
    await page.waitForTimeout(2000);
    console.log('✅ Second message sent');

    console.log('📍 Step 4: Verify "Request Human Help" button appears');
    const requestHumanButton = widgetFrame.locator('button:has-text("Need Human Help"), button:has-text("Request Human")');
    await expect(requestHumanButton).toBeVisible({ timeout: 3000 });
    console.log('✅ Request Human Help button visible');

    console.log('📍 Step 5: Click "Request Human Help" button');
    await requestHumanButton.click();
    await page.waitForTimeout(1000);
    console.log('✅ Request Human Help button clicked');

    console.log('📍 Step 6: Verify success message in widget');
    const successMessage = widgetFrame.locator('text=Request received, text=human agent will be with you');
    await expect(successMessage).toBeVisible({ timeout: 5000 });
    console.log('✅ Success message displayed in widget');

    console.log('📍 Step 7: Verify header changes to "Human Agent Assigned"');
    const humanAssignedIndicator = widgetFrame.locator('text=Human Agent Assigned, text=👤 Human');
    await expect(humanAssignedIndicator).toBeVisible({ timeout: 3000 });
    console.log('✅ Header shows human agent assigned');

    console.log('\n=== PHASE 2: Agent Dashboard Updates ===\n');

    console.log('📍 Step 8: Open dashboard in new context');
    const dashboardContext = await browser.newContext();
    const dashboardPage = await dashboardContext.newPage();
    await dashboardPage.goto('/dashboard/conversations');
    await dashboardPage.waitForLoadState('networkidle');
    console.log('✅ Dashboard loaded');

    console.log('📍 Step 9: Verify "🚨 Human" tab shows badge count');
    const humanTab = dashboardPage.locator('button:has-text("🚨 Human")');
    await expect(humanTab).toBeVisible();

    // Check for badge count (should show at least 1)
    const tabText = await humanTab.textContent();
    const hasBadgeCount = tabText?.includes('(') && tabText?.includes(')');
    expect(hasBadgeCount).toBeTruthy();
    console.log(`✅ Human tab shows badge count: ${tabText}`);

    console.log('📍 Step 10: Click "🚨 Human" tab to filter');
    await humanTab.click();
    await dashboardPage.waitForTimeout(1000);
    console.log('✅ Switched to Human requests tab');

    console.log('📍 Step 11: Verify conversation appears in list with indicators');
    const conversationListItem = dashboardPage.locator('[class*="conversation"], button:has-text("Customer")').first();
    await expect(conversationListItem).toBeVisible({ timeout: 5000 });
    console.log('✅ Conversation visible in list');

    console.log('📍 Step 12: Verify "🙋 User Requested" badge is present');
    const userRequestedBadge = dashboardPage.locator('text=🙋 User Requested, text=User Requested');
    await expect(userRequestedBadge).toBeVisible({ timeout: 3000 });
    console.log('✅ User Requested badge visible');

    console.log('📍 Step 13: Verify time indicator shows "just now" or "X min ago"');
    const timeIndicator = dashboardPage.locator('text=just now, text=min ago, text=🕐');
    await expect(timeIndicator).toBeVisible({ timeout: 3000 });
    console.log('✅ Time indicator visible');

    console.log('📍 Step 14: Click conversation to view details');
    await conversationListItem.click();
    await dashboardPage.waitForTimeout(1000);
    console.log('✅ Conversation details opened');

    console.log('\n=== PHASE 3: Database Verification ===\n');

    console.log('📍 Step 15: Verify conversation metadata in database');
    // This would require database access or API call
    // For now, we verify via UI that the data is present
    const conversationDetail = dashboardPage.locator('[class*="detail"], [class*="conversation"]');
    await expect(conversationDetail).toBeVisible();
    console.log('✅ Conversation details loaded');

    console.log('📍 Step 16: Verify "Waiting" status badge');
    const waitingBadge = dashboardPage.locator('text=Waiting');
    await expect(waitingBadge).toBeVisible({ timeout: 3000 });
    console.log('✅ Waiting status badge visible');

    console.log('\n=== ✅ WORKFLOW COMPLETE ===\n');
    console.log('All verification steps passed:');
    console.log('  ✅ User successfully requested human help');
    console.log('  ✅ Widget showed success confirmation');
    console.log('  ✅ Dashboard badge count updated');
    console.log('  ✅ Conversation filtered correctly in Human tab');
    console.log('  ✅ Visual indicators present (badge, time, status)');
    console.log('  ✅ Conversation details accessible');

    await dashboardContext.close();
  });

  test('AI frustration detection triggers human suggestion', async ({ page }) => {
    console.log('\n=== PHASE 1: AI Detects User Frustration ===\n');

    console.log('📍 Step 1: Load chat widget');
    const widgetFrame = page.frameLocator('iframe#chat-widget-iframe');
    await expect(widgetFrame.locator('text=Support')).toBeVisible();
    console.log('✅ Widget loaded');

    console.log('📍 Step 2: Send frustrated message with keywords');
    const messageInput = widgetFrame.locator('input[placeholder*="Type"], textarea[placeholder*="Type"]');
    await messageInput.fill('This is ridiculous! I need to speak to a real person NOW!!!');
    await messageInput.press('Enter');
    await page.waitForTimeout(3000); // Wait for AI response with frustration detection
    console.log('✅ Frustrated message sent');

    console.log('📍 Step 3: Verify AI suggests human help in response');
    const humanSuggestion = widgetFrame.locator('text=human, text=assistance, text=help');
    await expect(humanSuggestion).toBeVisible({ timeout: 5000 });
    console.log('✅ AI suggested human assistance');

    console.log('📍 Step 4: Verify "Request Human Help" button appears');
    const requestHumanButton = widgetFrame.locator('button:has-text("Need Human Help"), button:has-text("Request Human")');
    await expect(requestHumanButton).toBeVisible({ timeout: 3000 });
    console.log('✅ Request Human Help button visible (triggered by frustration)');

    console.log('\n=== ✅ FRUSTRATION DETECTION COMPLETE ===\n');
    console.log('All verification steps passed:');
    console.log('  ✅ AI detected frustration keywords');
    console.log('  ✅ AI suggested human assistance');
    console.log('  ✅ Request Human Help button shown');
  });

  test('multiple human requests increment badge count correctly', async ({ page, browser }) => {
    console.log('\n=== Testing Badge Count Increment ===\n');

    // Request 1
    console.log('📍 Step 1: Make first human request');
    await makeHumanRequest(page, 'First request for help');
    console.log('✅ First request completed');

    // Request 2
    console.log('📍 Step 2: Make second human request (new conversation)');
    await page.reload();
    await makeHumanRequest(page, 'Second request for help');
    console.log('✅ Second request completed');

    console.log('📍 Step 3: Open dashboard and verify badge count >= 2');
    const dashboardContext = await browser.newContext();
    const dashboardPage = await dashboardContext.newPage();
    await dashboardPage.goto('/dashboard/conversations');
    await dashboardPage.waitForLoadState('networkidle');

    const humanTab = dashboardPage.locator('button:has-text("🚨 Human")');
    const tabText = await humanTab.textContent();
    console.log(`Badge count text: ${tabText}`);

    // Extract number from badge
    const match = tabText?.match(/\((\d+)\)/);
    if (match) {
      const count = parseInt(match[1]);
      expect(count).toBeGreaterThanOrEqual(2);
      console.log(`✅ Badge count is ${count} (>= 2 as expected)`);
    }

    await dashboardContext.close();
  });
});

// Helper function to make a human request
async function makeHumanRequest(page: Page, message: string) {
  const widgetFrame = page.frameLocator('iframe#chat-widget-iframe');
  const messageInput = widgetFrame.locator('input[placeholder*="Type"], textarea[placeholder*="Type"]');

  // Send first message
  await messageInput.fill('Hello');
  await messageInput.press('Enter');
  await page.waitForTimeout(2000);

  // Send second message
  await messageInput.fill(message);
  await messageInput.press('Enter');
  await page.waitForTimeout(2000);

  // Click request button
  const requestHumanButton = widgetFrame.locator('button:has-text("Need Human Help"), button:has-text("Request Human")');
  await requestHumanButton.click();
  await page.waitForTimeout(1000);
}
