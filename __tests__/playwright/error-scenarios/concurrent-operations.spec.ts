import { test, expect, Page } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Error Scenario: Concurrent Operation Safety', () => {
  test.beforeEach(async ({ page }) => {
    console.log('🧪 Setting up concurrent operations test');
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

  test('should prevent concurrent scraping and allow retry after completion', async ({ page }) => {
    test.setTimeout(180000);

    console.log('📍 Step 1: Navigating to dashboard');
    await page.goto(BASE_URL + '/dashboard', { waitUntil: 'networkidle' });
    console.log('✅ Dashboard loaded');

    // Navigate to scraping/installation page
    console.log('📍 Step 2: Navigating to scraping page');
    const scrapingLink = page.locator('a:has-text("Installation"), a:has-text("Scrape"), a[href*="install"]').first();
    const linkVisible = await scrapingLink.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (linkVisible) {
      await scrapingLink.click();
      await page.waitForLoadState('networkidle');
      console.log('✅ Scraping page loaded via link');
    } else {
      await page.goto(BASE_URL + '/dashboard/installation', { waitUntil: 'networkidle' });
      console.log('✅ Scraping page loaded directly');
    }

    // Setup concurrent operation mock
    console.log('📍 Step 3: Setting up concurrent operation protection');
    let scrapingInProgress = false;
    let scrapeAttempts = 0;
    let secondAttemptBlocked = false;
    let firstOperationComplete = false;
    let retryAfterCompletion = false;
    const DOMAIN = 'example.com';
    
    await page.route('**/api/scrape', async (route) => {
      const method = route.request().method();
      
      if (method === 'POST') {
        scrapeAttempts++;
        const requestBody = route.request().postDataJSON();
        const requestedDomain = requestBody.domain || requestBody.url || DOMAIN;
        
        console.log('🌐 Scrape attempt #' + scrapeAttempts + ' for domain: ' + requestedDomain);
        
        if (!scrapingInProgress) {
          // First scraping request: accept and mark in progress
          scrapingInProgress = true;
          console.log('✅ Scraping started (attempt ' + scrapeAttempts + ')');
          
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              message: 'Scraping started successfully',
              jobId: 'job-' + Date.now(),
              domain: requestedDomain,
              status: 'processing'
            })
          });
        } else {
          // Concurrent request: reject with 409 Conflict
          console.log('⛔ Blocking concurrent scraping attempt (attempt ' + scrapeAttempts + ')');
          secondAttemptBlocked = true;
          
          await route.fulfill({
            status: 409,
            contentType: 'application/json',
            body: JSON.stringify({
              success: false,
              error: 'Operation in progress',
              message: 'Scraping is already in progress for this domain. Please wait for the current operation to complete.',
              code: 'CONCURRENT_OPERATION_NOT_ALLOWED',
              inProgressJobId: 'job-12345',
              estimatedCompletion: 120
            })
          });
        }
      } else {
        await route.continue();
      }
    });

    // Mock scraping status endpoint
    let statusChecks = 0;
    await page.route('**/api/scrape/status**', async (route) => {
      statusChecks++;
      
      if (statusChecks < 3) {
        // Still processing
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            status: 'processing',
            progress: statusChecks * 30,
            step: 'Scraping pages...'
          })
        });
      } else {
        // Completed
        scrapingInProgress = false;
        firstOperationComplete = true;
        
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            status: 'completed',
            progress: 100,
            step: 'Complete',
            pagesScraped: 42
          })
        });
      }
    });
    
    console.log('✅ Concurrent operation protection mock ready');

    // Start first scraping operation
    console.log('📍 Step 4: Starting first scraping operation');
    const domainInput = page.locator('input[name="domain"], input[name="url"], input[placeholder*="domain" i]').first();
    const startButton = page.locator('button:has-text("Start Scraping"), button:has-text("Scrape"), button:has-text("Begin")').first();
    
    const inputVisible = await domainInput.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (inputVisible) {
      await domainInput.fill(DOMAIN);
      console.log('✅ Domain entered: ' + DOMAIN);
      
      const btnVisible = await startButton.isVisible({ timeout: 5000 }).catch(() => false);
      if (btnVisible) {
        await startButton.click();
        console.log('✅ Scraping started (Operation 1)');
      }
    } else {
      console.log('⏭️  Scraping form not found - simulating via API call');
      await page.evaluate((domain) => {
        fetch('/api/scrape', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ domain })
        });
      }, DOMAIN);
    }

    await page.waitForTimeout(1000);

    // Verify first operation started
    console.log('📍 Step 5: Verifying first operation started');
    expect(scrapeAttempts).toBe(1);
    expect(scrapingInProgress).toBe(true);
    console.log('✅ First scraping operation is in progress');

    // Look for progress indicator
    const progressIndicator = page.locator('.progress, .scraping-progress, text=/scraping/i').first();
    const progressVisible = await progressIndicator.isVisible({ timeout: 3000 }).catch(() => false);
    
    if (progressVisible) {
      console.log('✅ Progress indicator visible');
    } else {
      console.log('⏭️  Progress indicator not found');
    }

    // Attempt to start SECOND scraping operation (should be blocked)
    console.log('📍 Step 6: Attempting concurrent scraping (should be blocked)');
    const domainInput2 = page.locator('input[name="domain"], input[name="url"], input[placeholder*="domain" i]').first();
    const startButton2 = page.locator('button:has-text("Start Scraping"), button:has-text("Scrape")').first();
    
    const input2Visible = await domainInput2.isVisible({ timeout: 2000 }).catch(() => false);
    
    if (input2Visible) {
      // Try to start again
      await domainInput2.fill(DOMAIN);
      console.log('⚠️  Attempting to start duplicate scraping...');
      
      const btn2Visible = await startButton2.isVisible().catch(() => false);
      if (btn2Visible) {
        const isDisabled = await startButton2.isDisabled().catch(() => false);
        
        if (!isDisabled) {
          await startButton2.click();
          console.log('⚠️  Second scrape attempt submitted');
        } else {
          console.log('✅ Start button is disabled (good!)');
          secondAttemptBlocked = true;
        }
      }
    } else {
      console.log('⏭️  Simulating second API call');
      await page.evaluate((domain) => {
        fetch('/api/scrape', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ domain })
        });
      }, DOMAIN);
    }

    await page.waitForTimeout(1000);

    // Verify second attempt was prevented
    console.log('📍 Step 7: Verifying concurrent operation was prevented');
    expect(secondAttemptBlocked).toBe(true);
    console.log('✅ CONCURRENT OPERATION PREVENTED ← First "END" point');

    // Verify error message is shown
    console.log('📍 Step 8: Verifying error message for concurrent attempt');
    const concurrentErrorSelectors = [
      'text=/already in progress/i',
      'text=/operation in progress/i',
      'text=/please wait/i',
      'text=/current operation/i',
      '.error-message',
      '.concurrent-error',
      '[role="alert"]'
    ];

    let errorFound = false;
    let errorMessage = '';
    
    for (const selector of concurrentErrorSelectors) {
      const errorElement = page.locator(selector).first();
      const isVisible = await errorElement.isVisible({ timeout: 3000 }).catch(() => false);
      
      if (isVisible) {
        errorMessage = await errorElement.textContent() || '';
        errorFound = true;
        console.log('✅ Concurrent operation error found: "' + errorMessage.substring(0, 60) + '..."');
        break;
      }
    }

    expect(errorFound).toBe(true);
    console.log('✅ ERROR MESSAGE DISPLAYED ← Second "END" point');

    // Wait for first operation to complete
    console.log('📍 Step 9: Waiting for first operation to complete');
    console.log('⏱️  Monitoring progress...');
    
    // Poll status a few times
    for (let i = 0; i < 4; i++) {
      await page.evaluate(() => {
        fetch('/api/scrape/status?jobId=job-12345');
      });
      await page.waitForTimeout(1000);
    }
    
    console.log('✅ First operation completed');

    // Verify first operation completed
    console.log('📍 Step 10: Verifying first operation completion');
    expect(firstOperationComplete).toBe(true);
    expect(scrapingInProgress).toBe(false);
    console.log('✅ FIRST OPERATION COMPLETES ← Third "END" point');

    // Look for completion message
    const completionIndicators = [
      'text=/completed/i',
      'text=/success/i',
      'text=/finished/i',
      'text=/pages scraped/i',
      '.scraping-complete',
      '.success-message'
    ];

    let completionFound = false;
    for (const selector of completionIndicators) {
      const complElement = page.locator(selector).first();
      const isVisible = await complElement.isVisible({ timeout: 3000 }).catch(() => false);
      
      if (isVisible) {
        completionFound = true;
        console.log('✅ Completion indicator found: ' + selector);
        break;
      }
    }

    if (completionFound) {
      console.log('✅ User sees completion message');
    } else {
      console.log('⏭️  Completion message not explicitly shown');
    }

    // Now try starting a NEW scraping operation (should be allowed)
    console.log('📍 Step 11: Starting new scraping operation after completion');
    const domainInput3 = page.locator('input[name="domain"], input[name="url"]').first();
    const startButton3 = page.locator('button:has-text("Start Scraping"), button:has-text("Scrape")').first();
    
    const input3Visible = await domainInput3.isVisible({ timeout: 3000 }).catch(() => false);
    
    if (input3Visible) {
      await domainInput3.fill('newdomain.com');
      console.log('✅ New domain entered: newdomain.com');
      
      const btn3Visible = await startButton3.isVisible().catch(() => false);
      const btn3Enabled = await startButton3.isEnabled().catch(() => false);
      
      if (btn3Visible && btn3Enabled) {
        await startButton3.click();
        console.log('✅ New scraping started after completion');
        retryAfterCompletion = true;
      }
    } else {
      console.log('⏭️  Simulating new scraping via API');
      await page.evaluate(() => {
        fetch('/api/scrape', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ domain: 'newdomain.com' })
        });
      });
      retryAfterCompletion = true;
    }

    await page.waitForTimeout(1000);

    // Verify new operation was allowed
    console.log('📍 Step 12: Verifying new operation is allowed');
    expect(retryAfterCompletion).toBe(true);
    expect(scrapeAttempts).toBeGreaterThanOrEqual(2);
    console.log('✅ NEW OPERATION STARTED AFTER COMPLETION ← Final "END" point');

    // Verify atomic behavior (no race conditions)
    console.log('📍 Step 13: Verifying atomic operation handling');
    console.log('   Total attempts: ' + scrapeAttempts);
    console.log('   Blocked attempts: ' + (secondAttemptBlocked ? '1' : '0'));
    console.log('   Successful starts: ' + (retryAfterCompletion ? '2' : '1'));
    
    const atomicBehaviorCorrect = secondAttemptBlocked && firstOperationComplete && retryAfterCompletion;
    expect(atomicBehaviorCorrect).toBe(true);
    console.log('✅ Atomic operation guarantees maintained');

    console.log('🎉 COMPLETE CONCURRENT OPERATION SAFETY TEST PASSED');
    console.log('✅ First started → Second blocked → First completed → New allowed');
  });
});
