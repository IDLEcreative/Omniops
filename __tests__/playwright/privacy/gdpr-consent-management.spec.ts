import { test, expect } from '@playwright/test';

/**
 * E2E Test: GDPR Consent Management
 *
 * Tests consent management workflows including:
 * - User opts in to data collection
 * - User opts out of data collection
 * - Consent withdrawal
 * - Automated decision-making opt-out
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('GDPR Consent Management', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to privacy dashboard
    await page.goto('/dashboard/privacy');
    await page.getByRole('tab', { name: /GDPR Compliance/i }).click();
  });

  test('manages consent - user opts in to data collection', async ({ page }) => {
    console.log('📍 Step 1: Navigate to consent management');

    await page.route('**/api/privacy/consent', async (route) => {
      const requestBody = await route.request().postDataJSON();

      expect(requestBody.consent_given).toBe(true);
      expect(requestBody.consent_type).toBe('data_collection');

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Consent preferences updated',
          consent_id: 'consent-123',
          timestamp: new Date().toISOString(),
        }),
      });
    });

    console.log('📍 Step 2: Enable data collection consent');
    const consentToggle = page.getByLabel(/Allow data collection/i);
    await consentToggle.click();

    console.log('📍 Step 3: Save consent preferences');
    await page.getByRole('button', { name: /Save Preferences/i }).click();

    console.log('📍 Step 4: Verify consent saved');
    await expect(page.getByText(/Consent preferences updated/i)).toBeVisible();

    console.log('✅ Consent opt-in workflow validated');
  });

  test('manages consent - user opts out of data collection', async ({ page }) => {
    console.log('📍 Step 1: Navigate to consent management');

    await page.route('**/api/privacy/consent', async (route) => {
      const requestBody = await route.request().postDataJSON();

      expect(requestBody.consent_given).toBe(false);
      expect(requestBody.consent_type).toBe('data_collection');

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Data collection disabled',
          consent_id: 'consent-124',
          timestamp: new Date().toISOString(),
        }),
      });
    });

    console.log('📍 Step 2: Disable data collection consent');
    const consentToggle = page.getByLabel(/Allow data collection/i);
    // Ensure it's unchecked
    if (await consentToggle.isChecked()) {
      await consentToggle.click();
    }

    console.log('📍 Step 3: Save consent preferences');
    await page.getByRole('button', { name: /Save Preferences/i }).click();

    console.log('📍 Step 4: Verify consent opt-out saved');
    await expect(page.getByText(/Data collection disabled/i)).toBeVisible();

    console.log('✅ Consent opt-out workflow validated');
  });

  test('withdraws consent - user revokes all consent', async ({ page }) => {
    console.log('📍 Step 1: Navigate to consent withdrawal');

    await page.route('**/api/privacy/consent/withdraw', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'All consent withdrawn',
          withdrawn_consents: ['data_collection', 'marketing', 'analytics'],
          timestamp: new Date().toISOString(),
        }),
      });
    });

    console.log('📍 Step 2: Click withdraw all consent button');
    await page.getByRole('button', { name: /Withdraw All Consent/i }).click();

    console.log('📍 Step 3: Confirm withdrawal in dialog');
    await page.getByRole('button', { name: /Confirm Withdrawal/i }).click();

    console.log('📍 Step 4: Verify all consent withdrawn');
    await expect(page.getByText(/All consent withdrawn/i)).toBeVisible();

    console.log('✅ Consent withdrawal workflow validated');
  });

  test('opts out of automated decision-making', async ({ page }) => {
    console.log('📍 Step 1: Navigate to automated decision-making settings');

    await page.route('**/api/privacy/automated-decisions/opt-out', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Opted out of automated decision-making',
          opt_out_id: 'opt-out-123',
          timestamp: new Date().toISOString(),
        }),
      });
    });

    console.log('📍 Step 2: Enable opt-out toggle');
    const optOutToggle = page.getByLabel(/Opt out of automated decision-making/i);
    await optOutToggle.click();

    console.log('📍 Step 3: Save preferences');
    await page.getByRole('button', { name: /Save Preferences/i }).click();

    console.log('📍 Step 4: Verify opt-out confirmed');
    await expect(page.getByText(/Opted out of automated decision-making/i)).toBeVisible();

    console.log('✅ Automated decision-making opt-out validated');
  });
});
