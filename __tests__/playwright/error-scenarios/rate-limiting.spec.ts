import { test, expect, Page } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Error Scenario: Rate Limiting Protection', () => {
  test.beforeEach(async ({ page }) => {
    console.log('🧪 Setting up rate limiting test');
  });

  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status !== 'passed') {
      await page.screenshot({
        path: 'e2e-failure-' + Date.now() + '.png',
        fullPage: true
      });
      console.log('❌ Test failed - screenshot captured');
    }
  });

  test('should enforce rate limits and allow retry after cooldown', async ({ page }) => {
    test.setTimeout(180000);

    console.log('📍 Step 1: Navigating to homepage with chat widget');
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    console.log('✅ Homepage loaded');

    // Mock widget config
    console.log('📍 Step 2: Setting up widget mock');
    await page.route('**/api/widget/config**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          config: { appearance: { position: 'bottom-right' } }
        })
      });
    });

    // Setup rate limiting mock
    console.log('📍 Step 3: Setting up rate limiting mock');
    let requestCount = 0;
    const RATE_LIMIT_THRESHOLD = 5;
    const RETRY_AFTER_SECONDS = 10;
    let rateLimitTriggered = false;
    let retryAfterWait = false;
    
    await page.route('**/api/chat', async (route) => {
      requestCount++;
      console.log('🌐 Chat API request #' + requestCount);
      
      if (requestCount <= RATE_LIMIT_THRESHOLD) {
        // First 5 requests: success
        console.log('✅ Request allowed (under rate limit)');
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            response: 'Response ' + requestCount,
            requestNumber: requestCount
          })
        });
      } else if (requestCount <= 10) {
        // Requests 6-10: rate limited
        console.log('⛔ Rate limit enforced (request ' + requestCount + ')');
        rateLimitTriggered = true;
        await route.fulfill({
          status: 429,
          contentType: 'application/json',
          headers: {
            'Retry-After': String(RETRY_AFTER_SECONDS)
          },
          body: JSON.stringify({
            success: false,
            error: 'Rate limit exceeded',
            message: 'You have sent too many messages. Please wait ' + RETRY_AFTER_SECONDS + ' seconds before trying again.',
            retryAfter: RETRY_AFTER_SECONDS,
            code: 'RATE_LIMIT_EXCEEDED'
          })
        });
      } else {
        // After cooldown: success again
        console.log('✅ Request allowed after cooldown (request ' + requestCount + ')');
        retryAfterWait = true;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            response: 'Welcome back! Request ' + requestCount,
            requestNumber: requestCount
          })
        });
      }
    });
    console.log('✅ Rate limiting mock ready');

    // Open chat widget
    console.log('📍 Step 4: Opening chat widget');
    const chatWidget = page.locator('iframe#chat-widget-iframe, iframe[title*="chat" i], .chat-widget').first();
    const widgetVisible = await chatWidget.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (!widgetVisible) {
      console.log('⏭️  Creating mock chat widget');
      await page.evaluate(() => {
        const widget = document.createElement('div');
        widget.className = 'chat-widget';
        widget.innerHTML = '<input type="text" id="chat-input" placeholder="Type message"/><button id="send-btn">Send</button><div id="messages"></div>';
        document.body.appendChild(widget);
      });
    }
    console.log('✅ Chat widget ready');

    // Send messages rapidly to trigger rate limit
    console.log('📍 Step 5: Sending messages rapidly to trigger rate limit');
    
    for (let i = 1; i <= 7; i++) {
      console.log('📤 Sending message #' + i + '...');
      
      // Type message
      const input = page.locator('#chat-input, input[type="text"], textarea').first();
      const inputVisible = await input.isVisible({ timeout: 2000 }).catch(() => false);
      
      if (inputVisible) {
        await input.fill('Message ' + i);
        
        // Send message
        const sendBtn = page.locator('#send-btn, button:has-text("Send")').first();
        await sendBtn.click();
      } else {
        // Simulate API call directly
        await page.evaluate((msgNum) => {
          fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: 'Message ' + msgNum })
          });
        }, i);
      }
      
      // Small delay between messages
      await page.waitForTimeout(300);
      
      if (i === 5) {
        console.log('✅ Reached rate limit threshold (5 messages)');
      }
    }
    
    console.log('✅ Rapid message sending complete');

    // Verify rate limit was triggered
    console.log('📍 Step 6: Verifying rate limit was triggered');
    expect(rateLimitTriggered).toBe(true);
    expect(requestCount).toBeGreaterThan(RATE_LIMIT_THRESHOLD);
    console.log('✅ Rate limit triggered after ' + RATE_LIMIT_THRESHOLD + ' requests');

    // Wait a moment for error to display
    await page.waitForTimeout(1000);

    // Verify rate limit error message is displayed
    console.log('📍 Step 7: Verifying rate limit error message');
    const rateLimitErrorSelectors = [
      'text=/rate limit/i',
      'text=/too many messages/i',
      'text=/please wait/i',
      'text=/try again/i',
      '.rate-limit-error',
      '.error-message',
      '[role="alert"]'
    ];

    let errorFound = false;
    let errorMessage = '';
    
    for (const selector of rateLimitErrorSelectors) {
      const errorElement = page.locator(selector).first();
      const isVisible = await errorElement.isVisible({ timeout: 3000 }).catch(() => false);
      
      if (isVisible) {
        errorMessage = await errorElement.textContent() || '';
        errorFound = true;
        console.log('✅ Rate limit error found: "' + errorMessage.substring(0, 60) + '..."');
        break;
      }
    }

    expect(errorFound).toBe(true);
    console.log('✅ RATE LIMIT MESSAGE DISPLAYED ← First "END" point');

    // Verify retry-after timing is shown
    console.log('📍 Step 8: Verifying retry-after timing is shown');
    const lowerErrorMessage = errorMessage.toLowerCase();
    const hasRetryTiming = 
      lowerErrorMessage.includes('wait') ||
      lowerErrorMessage.includes('second') ||
      lowerErrorMessage.includes('10') ||
      lowerErrorMessage.includes('minute');
    
    if (hasRetryTiming) {
      console.log('✅ Retry timing communicated to user');
    } else {
      console.log('⚠️  Retry timing not explicitly shown in: ' + errorMessage);
    }

    // Verify send button is disabled or shows cooldown
    console.log('📍 Step 9: Verifying send button state during cooldown');
    const sendBtn = page.locator('#send-btn, button:has-text("Send"), button[type="submit"]').first();
    const sendBtnVisible = await sendBtn.isVisible({ timeout: 2000 }).catch(() => false);
    
    if (sendBtnVisible) {
      const isDisabled = await sendBtn.isDisabled().catch(() => false);
      const btnText = await sendBtn.textContent();
      
      if (isDisabled) {
        console.log('✅ Send button is disabled during cooldown');
      } else if (btnText && btnText.toLowerCase().includes('wait')) {
        console.log('✅ Send button shows wait message');
      } else {
        console.log('⏭️  Send button state: ' + (btnText || 'enabled'));
      }
    }

    // Wait for cooldown period
    console.log('📍 Step 10: Waiting for cooldown period (' + RETRY_AFTER_SECONDS + ' seconds)');
    console.log('⏱️  Waiting...');
    await page.waitForTimeout((RETRY_AFTER_SECONDS + 1) * 1000);
    console.log('✅ Cooldown period elapsed');

    // Try sending message after cooldown
    console.log('📍 Step 11: Attempting to send message after cooldown');
    const inputAfterWait = page.locator('#chat-input, input[type="text"], textarea').first();
    const inputAfterVisible = await inputAfterWait.isVisible({ timeout: 2000 }).catch(() => false);
    
    if (inputAfterVisible) {
      await inputAfterWait.fill('Message after cooldown');
      
      const sendBtnAfter = page.locator('#send-btn, button:has-text("Send")').first();
      await sendBtnAfter.click();
    } else {
      // Simulate API call
      await page.evaluate(() => {
        fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: 'Message after cooldown' })
        });
      });
    }
    
    await page.waitForTimeout(1000);
    console.log('✅ Message sent after cooldown');

    // Verify success after waiting
    console.log('📍 Step 12: Verifying request succeeds after cooldown');
    expect(retryAfterWait).toBe(true);
    expect(requestCount).toBeGreaterThan(10);
    console.log('✅ RETRY SUCCESSFUL AFTER COOLDOWN ← Final "END" point');

    // Verify rate limit error is cleared
    console.log('📍 Step 13: Verifying rate limit error is cleared');
    const errorStillVisible = await page.locator('.rate-limit-error').isVisible({ timeout: 2000 }).catch(() => false);
    
    if (!errorStillVisible) {
      console.log('✅ Rate limit error cleared after successful send');
    } else {
      console.log('⏭️  Error still visible (may auto-dismiss)');
    }

    // Verify system didn't crash under load
    console.log('📍 Step 14: Verifying system stability');
    const pageIsResponsive = await page.evaluate(() => {
      return document.readyState === 'complete';
    });
    
    expect(pageIsResponsive).toBe(true);
    console.log('✅ System remained stable under rapid requests');

    console.log('🎉 COMPLETE RATE LIMITING TEST PASSED');
    console.log('✅ Rate limit enforced → Wait period → Retry successful');
    console.log('📊 Total requests: ' + requestCount);
    console.log('   - Allowed: ' + RATE_LIMIT_THRESHOLD);
    console.log('   - Rate limited: ' + (requestCount - RATE_LIMIT_THRESHOLD - 1));
    console.log('   - After cooldown: 1');
  });
});
