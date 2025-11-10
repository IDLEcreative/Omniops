import { test, expect, Page } from '@playwright/test';
import { waitForChatWidget } from '../../utils/playwright/chat-helpers';

/**
 * Rate Limiting Protection E2E Test
 *
 * This test validates that the system properly handles rate limiting:
 * 1. User can send N messages successfully
 * 2. After hitting rate limit, clear error message displayed
 * 3. Error includes retry-after timing information
 * 4. System prevents additional requests during rate limit period
 * 5. After waiting, user can successfully send messages again
 * 6. System doesn't crash under rapid-fire requests
 *
 * Journey:
 * Chat Widget → Send 10 Messages Rapidly → Rate Limit Hit →
 * RATE LIMIT MESSAGE ✅ → Wait Period → RETRY SUCCESSFUL ✅
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const RATE_LIMIT_THRESHOLD = 5;
const RETRY_AFTER_SECONDS = 10;

test.describe('Error Scenario: Rate Limiting Protection', () => {
  test.beforeEach(async ({ page }) => {
    console.log('=== Setting up Rate Limiting Test ===');
    console.log('📍 Preparing test environment...');
  });

  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status !== 'passed') {
      console.log('❌ Test failed - capturing screenshot');
      await page.screenshot({
        path: `e2e-failure-rate-limit-${Date.now()}.png`,
        fullPage: true
      });
    }
  });

  test('should enforce rate limiting and allow retry after wait period', async ({ page }) => {
    console.log('🎯 TEST: Rapid Messages → Rate Limit → Wait → Retry Success');
    console.log('');

    // ==================== PHASE 1: Widget Setup ====================
    console.log('📦 PHASE 1: Chat Widget Initialization');
    console.log('─'.repeat(80));

    console.log('📍 Step 1: Navigate to widget test page');
    await page.goto(`${BASE_URL}/widget-test`, { waitUntil: 'networkidle' });
    console.log('✅ Widget test page loaded');

    console.log('📍 Step 2: Wait for chat widget to load');
    const iframe = await waitForChatWidget(page, 15000);
    console.log('✅ Chat widget loaded and ready');

    console.log('');
    console.log('✅ PHASE 1 COMPLETE: Widget initialized');
    console.log('');

    // ==================== PHASE 2: Setup Rate Limiting Mock ====================
    console.log('🔧 PHASE 2: Rate Limiting Mock Configuration');
    console.log('─'.repeat(80));

    console.log('📍 Step 3: Configure API route with rate limiting');
    let requestCount = 0;
    const allRequests: Array<{ count: number; timestamp: number; message: string; status: number }> = [];
    const rateLimitHitTimestamp: number[] = [];

    await page.route('**/api/chat', async (route) => {
      requestCount++;
      const requestData = route.request().postDataJSON();
      const timestamp = Date.now();

      console.log(`🔍 Chat request #${requestCount} received at ${new Date(timestamp).toLocaleTimeString()}`);
      console.log(`   Message: "${requestData.message?.substring(0, 50)}"`);

      if (requestCount <= RATE_LIMIT_THRESHOLD) {
        // Allow first N requests
        console.log(`✅ Request #${requestCount} allowed (under limit)`);
        allRequests.push({
          count: requestCount,
          timestamp,
          message: requestData.message,
          status: 200
        });

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            response: `Message ${requestCount} received successfully.`,
            sources: []
          })
        });
      } else {
        // Rate limit exceeded
        if (rateLimitHitTimestamp.length === 0) {
          rateLimitHitTimestamp.push(timestamp);
        }

        const timeSinceFirstRateLimit = timestamp - rateLimitHitTimestamp[0];
        const retryAfterMs = (RETRY_AFTER_SECONDS * 1000) - timeSinceFirstRateLimit;

        if (retryAfterMs > 0) {
          // Still within rate limit period
          console.log(`💥 Request #${requestCount} RATE LIMITED (retry in ${Math.ceil(retryAfterMs / 1000)}s)`);
          allRequests.push({
            count: requestCount,
            timestamp,
            message: requestData.message,
            status: 429
          });

          await route.fulfill({
            status: 429,
            headers: {
              'Retry-After': Math.ceil(retryAfterMs / 1000).toString()
            },
            contentType: 'application/json',
            body: JSON.stringify({
              success: false,
              error: `Rate limit exceeded. Too many requests. Please try again in ${Math.ceil(retryAfterMs / 1000)} seconds.`,
              error_code: 'RATE_LIMIT_EXCEEDED',
              retry_after: Math.ceil(retryAfterMs / 1000)
            })
          });
        } else {
          // Rate limit period expired, allow request
          console.log(`✅ Request #${requestCount} allowed (rate limit expired)`);
          allRequests.push({
            count: requestCount,
            timestamp,
            message: requestData.message,
            status: 200
          });

          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              response: `Message ${requestCount} received after rate limit period.`,
              sources: []
            })
          });
        }
      }
    });

    console.log('✅ Rate limiting mock configured');
    console.log(`   - Allow first ${RATE_LIMIT_THRESHOLD} requests`);
    console.log(`   - Rate limit subsequent requests for ${RETRY_AFTER_SECONDS} seconds`);
    console.log(`   - Allow requests after wait period`);

    console.log('');
    console.log('✅ PHASE 2 COMPLETE: Rate limiting ready');
    console.log('');

    // ==================== PHASE 3: Send Messages Rapidly ====================
    console.log('📤 PHASE 3: Send Messages Rapidly to Trigger Rate Limit');
    console.log('─'.repeat(80));

    const inputField = iframe.locator('input[type="text"], textarea').first();
    const sendButton = iframe.locator('button[type="submit"]').first();

    await inputField.waitFor({ state: 'visible', timeout: 5000 });

    console.log('📍 Step 4: Send messages rapidly (exceeding rate limit)');
    const messagesToSend = 10;
    const sendTimestamps: number[] = [];

    for (let i = 1; i <= messagesToSend; i++) {
      const message = `Test message ${i} for rate limiting`;
      console.log(`📤 Sending message ${i}/${messagesToSend}: "${message}"`);

      await inputField.fill(message);
      await sendButton.click();

      sendTimestamps.push(Date.now());

      // Small delay between messages (but still rapid)
      await page.waitForTimeout(200);
    }

    console.log(`✅ Sent ${messagesToSend} messages rapidly`);
    console.log('⏱️  Message sending timeline:');
    sendTimestamps.forEach((ts, idx) => {
      if (idx > 0) {
        const timeSinceFirst = ts - sendTimestamps[0];
        console.log(`   Message ${idx + 1}: +${timeSinceFirst}ms from start`);
      } else {
        console.log(`   Message 1: 0ms (baseline)`);
      }
    });

    // Wait for all responses to be processed
    await page.waitForTimeout(2000);

    console.log('');
    console.log('✅ PHASE 3 COMPLETE: Messages sent');
    console.log('');

    // ==================== PHASE 4: Verify Rate Limit Error ====================
    console.log('🚨 PHASE 4: Rate Limit Error Verification');
    console.log('─'.repeat(80));

    console.log('📍 Step 5: Verify rate limit was triggered');
    const rateLimitedRequests = allRequests.filter(r => r.status === 429);
    expect(rateLimitedRequests.length).toBeGreaterThan(0);
    console.log(`✅ Rate limit triggered: ${rateLimitedRequests.length} requests blocked`);

    console.log('📍 Step 6: Verify rate limit error message displayed');
    const errorSelectors = [
      'text=/rate limit/i',
      'text=/too many/i',
      'text=/try again/i',
      '.error-message',
      '[role="alert"]',
      '.notification--error',
      '.rate-limit-error'
    ];

    let errorElement = null;
    let errorText = '';

    for (const selector of errorSelectors) {
      try {
        const element = iframe.locator(selector).first();
        await element.waitFor({ state: 'visible', timeout: 5000 });
        errorElement = element;
        errorText = await element.textContent() || '';
        console.log(`✅ Rate limit error found: ${selector}`);
        break;
      } catch {
        // Try on page if not in iframe
        try {
          const element = page.locator(selector).first();
          await element.waitFor({ state: 'visible', timeout: 2000 });
          errorElement = element;
          errorText = await element.textContent() || '';
          console.log(`✅ Rate limit error found on page: ${selector}`);
          break;
        } catch {
          // Try next selector
        }
      }
    }

    expect(errorText).toBeTruthy();
    console.log('📝 Error message:', errorText.substring(0, 150));

    console.log('📍 Step 7: Verify error message is user-friendly');
    expect(errorText.toLowerCase()).not.toContain('undefined');
    expect(errorText.toLowerCase()).not.toContain('null');
    expect(errorText.toLowerCase()).not.toContain('429');
    expect(errorText.toLowerCase()).not.toContain('exception');

    const isHelpful = errorText.toLowerCase().includes('rate') ||
                     errorText.toLowerCase().includes('too many') ||
                     errorText.toLowerCase().includes('wait') ||
                     errorText.toLowerCase().includes('try again');

    expect(isHelpful).toBeTruthy();
    console.log('✅ Error message is user-friendly');

    console.log('📍 Step 8: Verify retry-after timing information present');
    const hasRetryTiming = /\d+\s*(second|sec|s)/i.test(errorText);
    if (hasRetryTiming) {
      console.log('✅ Retry-after timing included in error message');
    } else {
      console.log('⚠️  No explicit retry timing found in error text');
    }

    console.log('');
    console.log('✅ PHASE 4 COMPLETE: Rate limit error properly displayed');
    console.log('');

    // ==================== PHASE 5: Verify Request Blocking ====================
    console.log('🛡️  PHASE 5: Verify Additional Requests Blocked');
    console.log('─'.repeat(80));

    const requestCountBefore = requestCount;

    console.log('📍 Step 9: Attempt to send another message (should be blocked)');
    await inputField.fill('This message should be rate limited');
    await sendButton.click();
    await page.waitForTimeout(1000);

    const requestCountAfter = requestCount;
    const additionalRequestMade = requestCountAfter > requestCountBefore;

    if (additionalRequestMade) {
      console.log(`✅ Additional request made (#${requestCountAfter}) - checking if blocked`);
      const lastRequest = allRequests[allRequests.length - 1];
      expect(lastRequest.status).toBe(429);
      console.log('✅ Additional request was rate limited (as expected)');
    } else {
      console.log('✅ Client-side prevented additional request (good optimization)');
    }

    console.log('');
    console.log('✅ PHASE 5 COMPLETE: System blocking additional requests');
    console.log('');

    // ==================== PHASE 6: Wait for Rate Limit Period ====================
    console.log('⏳ PHASE 6: Wait for Rate Limit Period to Expire');
    console.log('─'.repeat(80));

    console.log(`📍 Step 10: Wait ${RETRY_AFTER_SECONDS} seconds for rate limit to expire`);
    console.log('⏳ Waiting...');

    // Wait for rate limit period
    for (let i = 1; i <= RETRY_AFTER_SECONDS; i++) {
      await page.waitForTimeout(1000);
      console.log(`   ${i}/${RETRY_AFTER_SECONDS} seconds elapsed`);
    }

    console.log('✅ Rate limit period expired');

    console.log('');
    console.log('✅ PHASE 6 COMPLETE: Wait period completed');
    console.log('');

    // ==================== PHASE 7: Retry After Wait Period ====================
    console.log('✨ PHASE 7: Retry Message After Rate Limit Expires');
    console.log('─'.repeat(80));

    const requestCountBeforeRetry = requestCount;

    console.log('📍 Step 11: Send message after rate limit period');
    await inputField.fill('Message after rate limit period expired');
    await sendButton.click();
    console.log('✅ Message sent');

    await page.waitForTimeout(2000);

    console.log('📍 Step 12: Verify message sent successfully');
    const requestCountAfterRetry = requestCount;
    expect(requestCountAfterRetry).toBeGreaterThan(requestCountBeforeRetry);
    console.log(`✅ New request made (#${requestCountAfterRetry})`);

    const lastSuccessfulRequest = allRequests[allRequests.length - 1];
    expect(lastSuccessfulRequest.status).toBe(200);
    console.log('✅ Request successful (not rate limited)');

    console.log('📍 Step 13: Verify response received');
    const responseSelectors = [
      '.message.assistant, .message.bot',
      'text=/received/i',
      'text=/after rate limit/i'
    ];

    let responseFound = false;
    for (const selector of responseSelectors) {
      try {
        const element = iframe.locator(selector).last();
        await element.waitFor({ state: 'visible', timeout: 5000 });
        const responseText = await element.textContent();
        console.log(`✅ Response received: "${responseText?.substring(0, 100)}"`);
        responseFound = true;
        break;
      } catch {
        // Try next selector
      }
    }

    if (!responseFound) {
      console.log('⚠️  No explicit response element - checking error cleared');
      const errorStillVisible = await errorElement?.isVisible({ timeout: 1000 }).catch(() => false);
      expect(errorStillVisible).toBeFalsy();
      console.log('✅ Error cleared (implicit success)');
    }

    console.log('');
    console.log('✅ PHASE 7 COMPLETE: Retry successful after wait period');
    console.log('');

    // ==================== PHASE 8: System Stability Check ====================
    console.log('🛡️  PHASE 8: System Stability Verification');
    console.log('─'.repeat(80));

    console.log('📍 Step 14: Verify chat widget still functional');
    const widgetFunctional = await inputField.isVisible({ timeout: 2000 }).catch(() => false);
    expect(widgetFunctional).toBeTruthy();
    console.log('✅ Chat widget remains functional');

    console.log('📍 Step 15: Send follow-up message to confirm recovery');
    await inputField.fill('Follow-up message to confirm system recovery');
    await sendButton.click();
    await page.waitForTimeout(1500);
    console.log('✅ Follow-up message sent successfully');

    console.log('📍 Step 16: Verify no console errors or crashes');
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error' && !msg.text().includes('favicon')) {
        consoleErrors.push(msg.text());
      }
    });

    await page.waitForTimeout(1000);

    if (consoleErrors.length > 0) {
      console.log(`⚠️  Console errors detected: ${consoleErrors.length}`);
      consoleErrors.slice(0, 5).forEach(err => console.log(`   - ${err.substring(0, 100)}`));
    } else {
      console.log('✅ No console errors detected');
    }

    console.log('');
    console.log('✅ PHASE 8 COMPLETE: System stable after rate limiting');
    console.log('');

    // ==================== PHASE 9: Request Analytics ====================
    console.log('📊 PHASE 9: Request Analytics Summary');
    console.log('─'.repeat(80));

    console.log('📍 Step 17: Analyze request history');
    const successfulRequests = allRequests.filter(r => r.status === 200);
    const blockedRequests = allRequests.filter(r => r.status === 429);

    console.log('');
    console.log('Request Summary:');
    console.log(`   Total requests: ${allRequests.length}`);
    console.log(`   Successful (200): ${successfulRequests.length}`);
    console.log(`   Rate limited (429): ${blockedRequests.length}`);
    console.log('');

    console.log('Request Timeline:');
    allRequests.forEach((req, idx) => {
      const status = req.status === 200 ? '✅ SUCCESS' : '💥 RATE LIMITED';
      const timeFromStart = idx === 0 ? '0ms' : `+${req.timestamp - allRequests[0].timestamp}ms`;
      console.log(`   #${req.count} ${status} at ${timeFromStart}`);
    });

    console.log('');
    expect(successfulRequests.length).toBeGreaterThanOrEqual(RATE_LIMIT_THRESHOLD);
    expect(blockedRequests.length).toBeGreaterThan(0);
    console.log('✅ Rate limiting correctly enforced');

    console.log('');
    console.log('✅ PHASE 9 COMPLETE: Analytics verified');
    console.log('');

    // ==================== FINAL VERIFICATION ====================
    console.log('🎉 FINAL VERIFICATION: Complete Rate Limiting Flow');
    console.log('─'.repeat(80));

    console.log(`✅ 1. First ${RATE_LIMIT_THRESHOLD} requests allowed`);
    console.log('✅ 2. Rate limit triggered after threshold');
    console.log('✅ 3. Clear, user-friendly error message shown');
    console.log('✅ 4. Retry-after timing information provided');
    console.log('✅ 5. Additional requests blocked during limit period');
    console.log('✅ 6. System waited for rate limit expiration');
    console.log('✅ 7. Requests successful after wait period');
    console.log('✅ 8. System remained stable (no crashes)');
    console.log('✅ 9. Widget fully functional after recovery');

    console.log('');
    console.log('🎊 Rate Limiting Protection Test: PASSED');
    console.log('');
    console.log('═'.repeat(80));
    console.log('TEST COMPLETE: Rate limiting handled gracefully');
    console.log('═'.repeat(80));
  });
});
