import { test, expect } from '@playwright/test';

/**
 * E2E Test: User Rights - Processing Restrictions
 *
 * Tests restriction of processing and objection to processing requests.
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('User Rights - Processing Restrictions', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to user rights dashboard
    await page.goto('/dashboard/privacy');
    await page.getByRole('tab', { name: /User Rights/i }).click();
  });

  test('submits restriction of processing request', async ({ page }) => {
    console.log('📍 Step 1: Mock restriction API');

    await page.route('**/api/privacy/restrict-processing', async (route) => {
      const requestBody = await route.request().postDataJSON();

      expect(requestBody.restriction_type).toBeDefined();
      expect(requestBody.email).toBe('user@example.com');

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Processing restriction applied',
          request_id: 'restrict-789',
          restrictions: {
            analytics: true,
            marketing: true,
            ai_training: true,
          },
          effective_date: new Date().toISOString(),
        }),
      });
    });

    console.log('📍 Step 2: Fill restriction request form');
    await page.getByLabel(/Email Address/i).fill('user@example.com');

    console.log('📍 Step 3: Select processing activities to restrict');
    await page.getByLabel(/Restrict Analytics/i).check();
    await page.getByLabel(/Restrict Marketing/i).check();
    await page.getByLabel(/Restrict AI Training/i).check();

    console.log('📍 Step 4: Provide reason for restriction');
    await page.getByLabel(/Reason/i).fill('Pending verification of data accuracy');

    console.log('📍 Step 5: Submit restriction request');
    await page.getByRole('button', { name: /Submit Restriction Request/i }).click();

    console.log('📍 Step 6: Verify restriction applied');
    await expect(page.getByText(/Processing restriction applied/i)).toBeVisible();

    console.log('📍 Step 7: Verify restricted activities listed');
    await expect(page.getByText(/Analytics: Restricted/i)).toBeVisible();
    await expect(page.getByText(/Marketing: Restricted/i)).toBeVisible();
    await expect(page.getByText(/AI Training: Restricted/i)).toBeVisible();

    console.log('✅ Restriction of processing validated');
  });

  test('objects to processing based on legitimate grounds', async ({ page }) => {
    console.log('📍 Step 1: Mock objection API');

    await page.route('**/api/privacy/object-to-processing', async (route) => {
      const requestBody = await route.request().postDataJSON();

      expect(requestBody.objection_grounds).toBeDefined();
      expect(requestBody.processing_type).toBeDefined();

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Objection to processing registered',
          request_id: 'object-321',
          objection_type: requestBody.processing_type,
          grounds: requestBody.objection_grounds,
          status: 'under_review',
          review_deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        }),
      });
    });

    console.log('📍 Step 2: Fill objection form');
    await page.getByLabel(/Email Address/i).fill('user@example.com');

    console.log('📍 Step 3: Select processing type to object to');
    await page.getByLabel(/Processing Type/i).selectOption('profiling');

    console.log('📍 Step 4: Provide legitimate grounds for objection');
    await page.getByLabel(/Grounds for Objection/i).fill(
      'I object to profiling for automated decision-making as it relates to my particular situation and fundamental rights.'
    );

    console.log('📍 Step 5: Submit objection');
    await page.getByRole('button', { name: /Submit Objection/i }).click();

    console.log('📍 Step 6: Verify objection registered');
    await expect(page.getByText(/Objection to processing registered/i)).toBeVisible();

    console.log('📍 Step 7: Verify review deadline shown');
    await expect(page.getByText(/30 days/i)).toBeVisible();

    console.log('📍 Step 8: Verify objection status');
    await expect(page.getByText(/Status: Under Review/i)).toBeVisible();

    console.log('✅ Object to processing validated');
  });
});
