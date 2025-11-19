import { test, expect } from '@playwright/test';

/**
 * E2E Test: User Rights - Data Rectification
 *
 * Tests data rectification request and status tracking.
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('User Rights - Data Rectification', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to user rights dashboard
    await page.goto('/dashboard/privacy');
    await page.getByRole('tab', { name: /User Rights/i }).click();
  });

  test('submits data rectification request', async ({ page }) => {
    console.log('📍 Step 1: Mock rectification API');

    await page.route('**/api/privacy/rectification', async (route) => {
      const requestBody = await route.request().postDataJSON();

      expect(requestBody.domain).toBe('example.com');
      expect(requestBody.email).toBe('user@example.com');
      expect(requestBody.corrections).toBeDefined();

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Rectification request submitted',
          request_id: 'rect-123',
          corrections_count: requestBody.corrections.length,
          status: 'pending_review',
        }),
      });
    });

    console.log('📍 Step 2: Fill rectification form');
    await page.getByLabel(/Customer Domain/i).fill('example.com');
    await page.getByLabel(/Email Address/i).fill('user@example.com');

    console.log('📍 Step 3: Specify data to correct');
    await page.getByLabel(/Field to Correct/i).fill('email');
    await page.getByLabel(/Current Value/i).fill('old@example.com');
    await page.getByLabel(/Correct Value/i).fill('user@example.com');

    console.log('📍 Step 4: Add reason for correction');
    await page.getByLabel(/Reason for Correction/i).fill('Email address was updated');

    console.log('📍 Step 5: Submit rectification request');
    await page.getByRole('button', { name: /Submit Rectification Request/i }).click();

    console.log('📍 Step 6: Verify request submitted');
    await expect(page.getByText(/Rectification request submitted/i)).toBeVisible();

    console.log('📍 Step 7: Verify request ID displayed');
    await expect(page.getByText(/Request ID: rect-123/i)).toBeVisible();

    console.log('✅ Data rectification request validated');
  });

  test('tracks rectification request status', async ({ page }) => {
    console.log('📍 Step 1: Mock rectification status API');

    await page.route('**/api/privacy/rectification/status', async (route) => {
      const url = new URL(route.request().url());
      const requestId = url.searchParams.get('request_id');

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          request_id: requestId,
          status: 'in_progress',
          submitted_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
          estimated_completion: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days from now
          corrections_applied: 2,
          corrections_pending: 1,
          timeline: [
            { date: '2025-11-13', status: 'submitted', description: 'Request received' },
            { date: '2025-11-15', status: 'in_progress', description: 'Review started' },
          ],
        }),
      });
    });

    console.log('📍 Step 2: Check rectification status');
    await page.getByLabel(/Request ID/i).fill('rect-123');
    await page.getByRole('button', { name: /Check Status/i }).click();

    console.log('📍 Step 3: Verify status displayed');
    await expect(page.getByText(/Status: In Progress/i)).toBeVisible();

    console.log('📍 Step 4: Verify progress indicators');
    await expect(page.getByText(/2 corrections applied/i)).toBeVisible();
    await expect(page.getByText(/1 correction pending/i)).toBeVisible();

    console.log('📍 Step 5: Verify timeline shown');
    await expect(page.getByText(/Request received/i)).toBeVisible();
    await expect(page.getByText(/Review started/i)).toBeVisible();

    console.log('✅ Rectification status tracking validated');
  });
});
