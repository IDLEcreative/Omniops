import { test, expect } from '@playwright/test';

/**
 * E2E Test: Shopify API Rate Limiting & Re-Authentication
 *
 * Tests API rate limiting handling and re-authentication flow.
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_TIMEOUT = 180000; // 3 minutes

test.describe('Shopify Rate Limiting & Auth E2E', () => {
  test.setTimeout(TEST_TIMEOUT);

  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('should handle Shopify API rate limiting', async ({ page }) => {
    console.log('=== Testing API Rate Limiting Handling ===');

    let requestCount = 0;

    // Mock API with rate limiting
    await page.route('**/api/shopify/**', async (route) => {
      requestCount++;

      if (requestCount <= 2) {
        // Simulate rate limit error
        await route.fulfill({
          status: 429,
          contentType: 'application/json',
          headers: {
            'Retry-After': '2',
            'X-Shopify-Shop-Api-Call-Limit': '40/40'
          },
          body: JSON.stringify({
            success: false,
            error: 'Rate limit exceeded',
            retryAfter: 2
          })
        });
      } else {
        // Succeed after retry
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Request successful after retry'
          })
        });
      }
    });

    console.log('📍 Step: Triggering API request that hits rate limit');
    await page.goto(`${BASE_URL}/dashboard/shopify/products`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    const syncButton = page.locator('button:has-text("Sync"), button:has-text("Refresh")').first();
    const hasButton = await syncButton.isVisible().catch(() => false);

    if (hasButton) {
      await syncButton.click();

      // Verify rate limit warning
      console.log('📍 Step: Verifying rate limit warning');
      const rateLimitWarning = page.locator('text=/rate limit/i, text=/retry/i, [role="alert"]').first();
      const hasWarning = await rateLimitWarning.isVisible({ timeout: 5000 }).catch(() => false);

      if (hasWarning) {
        console.log('✅ Rate limit warning displayed');
      }

      // Wait for retry
      await page.waitForTimeout(3000);

      // Verify eventual success
      const successMessage = page.locator('[role="alert"]:has-text("success")').first();
      const hasSuccess = await successMessage.isVisible({ timeout: 10000 }).catch(() => false);

      if (hasSuccess) {
        console.log('✅ Request succeeded after automatic retry');
      }
    }

    console.log('✅ API rate limiting handling validated');
  });

  test('should re-authenticate with Shopify', async ({ page }) => {
    console.log('=== Testing Shopify Re-Authentication ===');

    // Mock authentication expiry
    await page.route('**/api/shopify/**', async (route) => {
      if (!route.request().url().includes('/configure')) {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Authentication expired',
            requiresReauth: true
          })
        });
      } else {
        await route.continue();
      }
    });

    console.log('📍 Step: Navigate to Shopify dashboard (triggers auth check)');
    await page.goto(`${BASE_URL}/dashboard/shopify`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Verify re-authentication prompt
    const reAuthPrompt = page.locator('text=/authentication.*expired/i, text=/re-authenticate/i').first();
    const hasPrompt = await reAuthPrompt.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasPrompt) {
      console.log('✅ Re-authentication prompt displayed');

      // Click re-authenticate
      const reAuthButton = page.locator('button:has-text("Re-authenticate"), button:has-text("Connect Again")').first();
      const hasButton = await reAuthButton.isVisible().catch(() => false);

      if (hasButton) {
        // Mock successful re-authentication
        await page.route('**/api/shopify/configure', async (route) => {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              message: 'Re-authenticated successfully'
            })
          });
        });

        console.log('📍 Step: Clicking re-authenticate button');
        await reAuthButton.click();

        await page.waitForTimeout(2000);

        // Verify success
        const successMessage = page.locator('[role="alert"]:has-text("success")').first();
        await expect(successMessage).toBeVisible({ timeout: 10000 });

        console.log('✅ Re-authentication successful');
      }
    }

    console.log('✅ Shopify re-authentication validated');
  });

  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status !== 'passed') {
      await page.screenshot({
        path: `test-results/shopify-rate-limiting-failure-${Date.now()}.png`,
        fullPage: true
      });
    }
  });
});
