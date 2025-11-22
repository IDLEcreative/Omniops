import { test, expect } from '@playwright/test';
import { waitForChatWidget, sendChatMessage } from '../../utils/playwright/chat-helpers';

/**
 * Minimal E2E Test: Browse Products Button Appearance
 *
 * PURPOSE: Isolate metadata flow issue by testing ONLY button appearance.
 * This test intentionally does NOT test shopping feed interactions.
 *
 * SCOPE:
 * 1. Load widget
 * 2. Send product query
 * 3. Wait for Browse Products button
 * 4. STOP (don't click button, don't test shopping feed)
 *
 * WHY THIS TEST EXISTS:
 * The full E2E test (mobile-shopping-core.spec.ts:42) is failing at line 98
 * waiting for the Browse Products button. We need to know if:
 * - Issue is in metadata flow (API → state → button render)
 * - Issue is in shopping feed interactions (after button click)
 *
 * IF THIS TEST:
 * ✅ PASSES → Issue is in shopping feed interactions (not metadata)
 * ❌ FAILS → Issue is in metadata flow (API/state/render)
 *
 * DEBUGGING AIDS:
 * - Captures all browser console logs
 * - Captures iframe console logs
 * - Captures network requests
 * - Takes screenshot on failure
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Isolated: Browse Products Button', () => {
  test('Browse Products button appears after product query', async ({ page }) => {
    console.log('=== MINIMAL TEST: Button Appearance Only ===');

    // Capture ALL browser console logs for debugging
    page.on('console', msg => {
      console.log(`[Browser ${msg.type()}] ${msg.text()}`);
    });
    page.on('pageerror', err => {
      console.error('[Page Error]', err.message);
    });
    page.on('requestfailed', request => {
      console.error('[Request Failed]', request.url(), request.failure()?.errorText);
    });

    // Track API responses
    page.on('response', async response => {
      if (response.url().includes('/api/chat')) {
        console.log(`[API Response] Status: ${response.status()}`);
        try {
          const contentType = response.headers()['content-type'];
          if (contentType?.includes('application/json')) {
            const body = await response.json();
            console.log('[API Response Body]', JSON.stringify({
              hasMessage: !!body.message,
              hasConversationId: !!body.conversation_id,
              hasShoppingMetadata: !!body.shoppingMetadata,
              productCount: body.shoppingMetadata?.products?.length || 0,
              shoppingMetadataKeys: body.shoppingMetadata ? Object.keys(body.shoppingMetadata) : []
            }, null, 2));
          }
        } catch (err) {
          console.error('[API Response] Could not parse JSON:', err);
        }
      }
    });

    console.log('📍 Step 1: Navigate to widget test page');
    await page.goto(`${BASE_URL}/widget-test`, { waitUntil: 'networkidle' });
    console.log('✅ Page loaded');

    console.log('📍 Step 2: Wait for chat widget iframe');
    const iframe = await waitForChatWidget(page);
    console.log('✅ Widget loaded');

    // Listen to iframe console logs
    const actualFrame = await page.frame({ url: /embed/ });
    if (actualFrame) {
      actualFrame.on('console', msg => {
        console.log(`[IFrame Console ${msg.type()}] ${msg.text()}`);
      });
    }

    console.log('📍 Step 3: Verify widget is open');
    const inputField = iframe.locator('textarea, input[type="text"]');
    await inputField.waitFor({ state: 'visible', timeout: 5000 });
    console.log('✅ Widget is open');

    console.log('📍 Step 4: Send product query (using real Thompson\'s API)');
    await sendChatMessage(iframe, 'Do you have any pumps in stock?');
    console.log('✅ Query sent');

    console.log('📍 Step 5: Wait for Browse Products button');
    console.log('⏳ This is the CRITICAL test - will button appear?');

    const browseButton = iframe.locator('[data-testid="browse-products-button"]');

    try {
      await browseButton.waitFor({ state: 'visible', timeout: 60000 });
      console.log('✅✅✅ SUCCESS: Browse Products button appeared!');
      console.log('🎯 CONCLUSION: Metadata flow works correctly (API → state → render)');
      console.log('💡 This means the issue in the full test is likely in shopping feed interactions');

      // Take success screenshot
      await page.screenshot({
        path: `test-results/screenshots/metadata-button-success-${Date.now()}.png`,
        fullPage: true,
      });

    } catch (error) {
      console.error('❌❌❌ FAILURE: Browse Products button did NOT appear');
      console.error('🎯 CONCLUSION: Metadata flow is broken somewhere');
      console.error('💡 Need to check: API response, sendMessage transformation, or state management');

      // Take failure screenshot
      await page.screenshot({
        path: `test-results/screenshots/metadata-button-failure-${Date.now()}.png`,
        fullPage: true,
      });

      // Get DOM snapshot for debugging
      const messages = await iframe.locator('article, .message').all();
      console.log(`📋 Found ${messages.length} message(s) in chat`);

      for (let i = 0; i < messages.length; i++) {
        const text = await messages[i].textContent();
        console.log(`  Message ${i + 1}: ${text?.substring(0, 100)}...`);
      }

      throw error;
    }

    console.log('📍 Step 6: Verify button is clickable (but don\'t click)');
    const isClickable = await browseButton.isEnabled();
    expect(isClickable).toBe(true);
    console.log('✅ Button is enabled');

    console.log('✅ MINIMAL TEST COMPLETE');
    console.log('🛑 Stopping here - NOT testing shopping feed interactions');
  });

  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status !== 'passed') {
      console.log(`❌ Test failed: ${testInfo.title}`);
      await page.screenshot({
        path: `test-results/screenshots/minimal-test-failure-${Date.now()}.png`,
        fullPage: true,
      });
      console.log('📸 Failure screenshot captured');
    }
  });
});
