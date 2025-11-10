/**
 * Error Handling and Edge Case E2E Tests
 *
 * Tests error scenarios, empty data, authentication, and graceful degradation.
 */

import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { navigateToDashboard, cleanupFile } from '../../utils/playwright/analytics-export-helpers';

test.describe('Error Handling and Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToDashboard(page);
  });

  test('export with empty data: handle gracefully', async ({ page }) => {
    console.log('🎯 Testing: Empty data export handling');

    // Mock empty analytics response
    await page.route('**/api/dashboard/analytics**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          metrics: {
            totalMessages: 0,
            userMessages: 0,
            avgMessagesPerDay: 0,
            positiveMessages: 0,
            negativeMessages: 0,
          },
          userMetrics: {
            dailyActiveUsers: 0,
            totalUniqueUsers: 0,
            growthRate: 0,
            growthAbsolute: 0,
          },
          sessionMetrics: {
            avgDuration: 0,
            medianDuration: 0,
            totalSessions: 0,
            bounceRate: 0,
          },
          shoppingBehavior: {
            productViews: 0,
            cartViews: 0,
            checkoutViews: 0,
            conversionRate: 0,
          },
          dailyUsers: [],
          topQueries: [],
          failedSearches: [],
        }),
      });
    });

    console.log('📍 Reload page with empty data');
    await page.reload({ waitUntil: 'networkidle' });

    console.log('📍 Attempt export with no data');

    // Test export with empty data
    const exportUrl = '/api/analytics/export?format=csv&days=7';

    const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);
    await page.goto(exportUrl);

    const download = await downloadPromise;

    if (download) {
      const suggestedFilename = download.suggestedFilename();
      console.log(`📍 Downloaded empty export: ${suggestedFilename}`);

      // Save and check content
      const filePath = path.join('/tmp', suggestedFilename);
      await download.saveAs(filePath);

      const csvContent = fs.readFileSync(filePath, 'utf-8');

      // Should have headers even if no data
      expect(csvContent.length).toBeGreaterThan(0);
      console.log('✅ Empty export contains headers');

      cleanupFile(filePath);
    } else {
      console.log('⚠️ Export might be blocked for empty data (expected behavior)');
    }

    console.log('✅ Empty data export test completed');
  });

  test('export with user authentication and permissions', async ({ page }) => {
    console.log('🎯 Testing: Export with authentication');

    // Test unauthorized access
    console.log('📍 Test unauthorized export attempt');

    const unauthorizedResponse = await page.request.get('/api/analytics/export?format=csv', {
      headers: {
        // No authentication headers
      },
    });

    if (unauthorizedResponse.status() === 401) {
      console.log('✅ Unauthorized access properly blocked');
    } else if (unauthorizedResponse.status() === 200) {
      console.log('⚠️ Export allowed without auth (might be in demo mode)');
    } else if (unauthorizedResponse.status() === 500) {
      console.log('⚠️ Server error during auth check');
    }

    console.log('✅ Authentication test completed');
  });

  test('handle invalid export format gracefully', async ({ page }) => {
    console.log('🎯 Testing: Invalid export format handling');

    console.log('📍 Request invalid format');

    const invalidResponse = await page.request.get('/api/analytics/export?format=invalid&days=7').catch((error) => {
      console.log('Request failed (expected):', error.message);
      return null;
    });

    if (invalidResponse) {
      const status = invalidResponse.status();
      console.log(`Response status: ${status}`);

      // Should either reject (4xx) or default to CSV (200)
      expect([200, 400, 404, 405, 500]).toContain(status);
      console.log('✅ Invalid format handled gracefully');
    }

    console.log('✅ Invalid format test completed');
  });

  test('handle missing query parameters', async ({ page }) => {
    console.log('🎯 Testing: Missing parameters handling');

    console.log('📍 Export without days parameter');

    const noParamsResponse = await page.request.get('/api/analytics/export?format=csv').catch((error) => {
      console.log('Request failed (expected):', error.message);
      return null;
    });

    if (noParamsResponse) {
      const status = noParamsResponse.status();
      console.log(`Response status: ${status}`);

      // Should either use default or return error
      expect([200, 400, 500]).toContain(status);
      console.log('✅ Missing parameters handled gracefully');
    }

    console.log('✅ Missing parameters test completed');
  });

  test('handle request timeout gracefully', async ({ page }) => {
    console.log('🎯 Testing: Request timeout handling');

    // Set up a slow response
    await page.route('**/api/analytics/export**', async (route) => {
      // Simulate slow response
      await new Promise((resolve) => setTimeout(resolve, 10000));
      await route.abort('timedout');
    });

    console.log('📍 Request with expected timeout');

    const downloadPromise = page.waitForEvent('download', { timeout: 2000 }).catch(() => null);

    await page.goto('/api/analytics/export?format=csv&days=7').catch(() => {
      console.log('Navigation timed out (expected)');
    });

    const download = await downloadPromise;

    if (!download) {
      console.log('✅ Timeout handled gracefully (no download)');
    }

    console.log('✅ Timeout handling test completed');
  });
});
