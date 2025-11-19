import { test, expect } from '@playwright/test';

/**
 * E2E Test: User Rights - Data Access
 *
 * Tests personal data access requests including scenarios with no data found.
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('User Rights - Data Access', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to user rights dashboard
    await page.goto('/dashboard/privacy');
    await page.getByRole('tab', { name: /User Rights/i }).click();
  });

  test('views personal data via access request', async ({ page }) => {
    console.log('📍 Step 1: Mock access request API');

    await page.route('**/api/privacy/access', async (route) => {
      const url = new URL(route.request().url());
      const email = url.searchParams.get('email');

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          personal_data: {
            profile: {
              email,
              user_id: 'user-456',
              created_at: '2025-01-01T00:00:00Z',
              last_login: '2025-11-18T08:00:00Z',
            },
            conversations: {
              total: 12,
              last_conversation: '2025-11-17T15:30:00Z',
            },
            preferences: {
              language: 'en',
              timezone: 'America/Los_Angeles',
              notifications_enabled: true,
            },
            data_sources: ['chat_widget', 'dashboard', 'api'],
          },
        }),
      });
    });

    console.log('📍 Step 2: Submit access request');
    await page.getByLabel(/Email Address/i).fill('user@example.com');
    await page.getByRole('button', { name: /View My Data/i }).click();

    console.log('📍 Step 3: Verify personal data displayed');
    await expect(page.getByText(/user@example\.com/i)).toBeVisible();
    await expect(page.getByText(/user-456/i)).toBeVisible();

    console.log('📍 Step 4: Verify conversation data shown');
    await expect(page.getByText(/Total: 12/i)).toBeVisible();

    console.log('📍 Step 5: Verify preferences displayed');
    await expect(page.getByText(/Language: en/i)).toBeVisible();
    await expect(page.getByText(/Notifications: Enabled/i)).toBeVisible();

    console.log('📍 Step 6: Verify data sources listed');
    await expect(page.getByText(/chat_widget/i)).toBeVisible();
    await expect(page.getByText(/dashboard/i)).toBeVisible();

    console.log('✅ Personal data access validated');
  });

  test('handles access request with no data found', async ({ page }) => {
    console.log('📍 Step 1: Mock access request with no data');

    await page.route('**/api/privacy/access', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          personal_data: null,
          message: 'No personal data found for this identifier',
        }),
      });
    });

    console.log('📍 Step 2: Submit access request');
    await page.getByLabel(/Email Address/i).fill('nonexistent@example.com');
    await page.getByRole('button', { name: /View My Data/i }).click();

    console.log('📍 Step 3: Verify no data message');
    await expect(page.getByText(/No personal data found/i)).toBeVisible();

    console.log('✅ Access request with no data validated');
  });
});
