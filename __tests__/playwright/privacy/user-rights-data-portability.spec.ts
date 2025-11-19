import { test, expect } from '@playwright/test';

/**
 * E2E Test: User Rights - Data Portability
 *
 * Tests data portability request workflows including machine-readable formats
 * and third-party data inclusion.
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('User Rights - Data Portability', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to user rights dashboard
    await page.goto('/dashboard/privacy');
    await page.getByRole('tab', { name: /User Rights/i }).click();
  });

  test('submits data portability request with machine-readable format', async ({ page }) => {
    console.log('📍 Step 1: Mock data portability API');

    await page.route('**/api/privacy/portability', async (route) => {
      const requestBody = await route.request().postDataJSON();

      expect(requestBody.format).toBe('json');
      expect(requestBody.domain).toBe('example.com');

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: {
          'Content-Disposition': 'attachment; filename="data-portability-export.json"',
        },
        body: JSON.stringify({
          export_format: 'machine_readable_json',
          export_date: new Date().toISOString(),
          user_data: {
            profile: {
              email: 'user@example.com',
              created_at: '2025-01-01T00:00:00Z',
            },
            conversations: [
              {
                id: 'conv-1',
                messages: [
                  { role: 'user', content: 'Hello', timestamp: '2025-11-18T10:00:00Z' },
                ],
              },
            ],
            preferences: {
              language: 'en',
              notifications: true,
            },
          },
          metadata: {
            total_records: 150,
            categories: ['profile', 'conversations', 'preferences'],
          },
        }),
      });
    });

    console.log('📍 Step 2: Fill portability request form');
    await page.getByLabel(/Customer Domain/i).fill('example.com');
    await page.getByLabel(/Email Address/i).fill('user@example.com');

    console.log('📍 Step 3: Select machine-readable format');
    await page.getByLabel(/Export Format/i).selectOption('json');

    console.log('📍 Step 4: Submit portability request');
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: /Request Data Portability/i }).click();

    console.log('📍 Step 5: Verify download initiated');
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/data-portability-export\.json/);

    console.log('📍 Step 6: Verify success message');
    await expect(page.getByText(/Data portability export started/i)).toBeVisible();

    console.log('✅ Data portability request validated');
  });

  test('verifies data portability includes third-party data', async ({ page }) => {
    console.log('📍 Step 1: Mock portability with third-party data');

    await page.route('**/api/privacy/portability', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: {
          'Content-Disposition': 'attachment; filename="complete-data-export.json"',
        },
        body: JSON.stringify({
          export_date: new Date().toISOString(),
          user_data: {
            profile: { email: 'user@example.com' },
            conversations: [],
          },
          third_party_data: {
            woocommerce: {
              orders: [
                { id: 'order-1', total: 49.99, date: '2025-11-01' },
              ],
              products_viewed: ['product-a', 'product-b'],
            },
            analytics: {
              sessions: 25,
              page_views: 150,
            },
          },
          metadata: {
            includes_third_party_data: true,
            third_party_sources: ['woocommerce', 'analytics'],
          },
        }),
      });
    });

    console.log('📍 Step 2: Request data portability');
    await page.getByLabel(/Email Address/i).fill('user@example.com');
    await page.getByLabel(/Include Third-Party Data/i).check();

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: /Request Data Portability/i }).click();

    await downloadPromise;

    console.log('📍 Step 3: Verify third-party data inclusion notice');
    await expect(page.getByText(/Export includes data from 2 third-party sources/i)).toBeVisible();

    console.log('✅ Third-party data portability validated');
  });
});
