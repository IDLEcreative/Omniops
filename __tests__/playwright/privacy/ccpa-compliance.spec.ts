import { test, expect } from '@playwright/test';

/**
 * E2E Test: CCPA Compliance
 *
 * Tests California Consumer Privacy Act (CCPA) workflows including:
 * - Do Not Sell My Personal Information requests
 * - Do Not Sell confirmation and verification
 * - Data disclosure requests
 * - Data disclosure delivery
 * - California consumer rights verification
 * - Opt-out verification and enforcement
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('CCPA Compliance', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to privacy dashboard (CCPA tab)
    await page.goto('/dashboard/privacy');
    await page.getByRole('tab', { name: /CCPA Compliance/i }).click();
  });

  test('submits Do Not Sell request', async ({ page }) => {
    console.log('📍 Step 1: Mock Do Not Sell API');

    await page.route('**/api/privacy/ccpa/do-not-sell', async (route) => {
      const requestBody = await route.request().postDataJSON();

      expect(requestBody.domain).toBe('california-business.com');
      expect(requestBody.user_identifier).toBeDefined();

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Do Not Sell request submitted',
          request_id: 'dns-123',
          timestamp: new Date().toISOString(),
          confirmation_sent: true,
        }),
      });
    });

    console.log('📍 Step 2: Fill Do Not Sell form');
    await page.getByLabel(/Customer Domain/i).fill('california-business.com');
    await page.getByLabel(/Email Address|Session ID/i).fill('user@california.com');

    console.log('📍 Step 3: Submit Do Not Sell request');
    await page.getByRole('button', { name: /Submit Do Not Sell Request/i }).click();

    console.log('📍 Step 4: Verify request submitted');
    await expect(page.getByText(/Do Not Sell request submitted/i)).toBeVisible();

    console.log('📍 Step 5: Verify confirmation sent');
    await expect(page.getByText(/confirmation sent/i)).toBeVisible();

    console.log('✅ Do Not Sell request validated');
  });

  test('confirms Do Not Sell opt-out status', async ({ page }) => {
    console.log('📍 Step 1: Mock Do Not Sell status check');

    await page.route('**/api/privacy/ccpa/do-not-sell/status', async (route) => {
      const url = new URL(route.request().url());
      const email = url.searchParams.get('email');

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          opted_out: true,
          email,
          opt_out_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
          status: 'active',
          message: 'Your Do Not Sell request is active',
        }),
      });
    });

    console.log('📍 Step 2: Check Do Not Sell status');
    await page.getByLabel(/Email Address/i).fill('user@california.com');
    await page.getByRole('button', { name: /Check Status/i }).click();

    console.log('📍 Step 3: Verify opt-out status displayed');
    await expect(page.getByText(/Your Do Not Sell request is active/i)).toBeVisible();
    await expect(page.getByText(/Status: active/i)).toBeVisible();

    console.log('✅ Do Not Sell status confirmation validated');
  });

  test('submits data disclosure request', async ({ page }) => {
    console.log('📍 Step 1: Mock data disclosure API');

    await page.route('**/api/privacy/ccpa/disclosure', async (route) => {
      const requestBody = await route.request().postDataJSON();

      expect(requestBody.domain).toBe('california-business.com');
      expect(requestBody.email).toBe('user@california.com');
      expect(requestBody.disclosure_categories).toBeDefined();

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Data disclosure request submitted',
          request_id: 'disclosure-456',
          estimated_delivery: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(), // 45 days from now
          disclosure_categories: [
            'personal_information',
            'commercial_information',
            'internet_activity',
          ],
        }),
      });
    });

    console.log('📍 Step 2: Fill disclosure request form');
    await page.getByLabel(/Customer Domain/i).fill('california-business.com');
    await page.getByLabel(/Email Address/i).fill('user@california.com');

    console.log('📍 Step 3: Select disclosure categories');
    await page.getByLabel(/Personal Information/i).check();
    await page.getByLabel(/Commercial Information/i).check();
    await page.getByLabel(/Internet Activity/i).check();

    console.log('📍 Step 4: Submit disclosure request');
    await page.getByRole('button', { name: /Request Data Disclosure/i }).click();

    console.log('📍 Step 5: Verify request submitted');
    await expect(page.getByText(/Data disclosure request submitted/i)).toBeVisible();

    console.log('📍 Step 6: Verify estimated delivery time shown');
    await expect(page.getByText(/45 days/i)).toBeVisible();

    console.log('✅ Data disclosure request validated');
  });

  test('delivers data disclosure report', async ({ page }) => {
    console.log('📍 Step 1: Mock disclosure report delivery');

    await page.route('**/api/privacy/ccpa/disclosure/download', async (route) => {
      const disclosureReport = {
        disclosure_date: new Date().toISOString(),
        consumer_email: 'user@california.com',
        categories_disclosed: {
          personal_information: {
            name: 'John Doe',
            email: 'user@california.com',
            ip_address: '192.168.1.1',
          },
          commercial_information: {
            purchase_history: [
              { date: '2025-11-01', amount: 49.99, product: 'Widget A' },
              { date: '2025-11-10', amount: 29.99, product: 'Widget B' },
            ],
          },
          internet_activity: {
            page_views: 45,
            chat_sessions: 3,
            last_visit: '2025-11-18T10:00:00Z',
          },
        },
        third_party_sharing: {
          shared: false,
          partners: [],
        },
        retention_period: '24 months',
      };

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: {
          'Content-Disposition': `attachment; filename="ccpa-disclosure-${Date.now()}.json"`,
        },
        body: JSON.stringify(disclosureReport),
      });
    });

    console.log('📍 Step 2: Navigate to disclosure download');
    await page.getByLabel(/Request ID/i).fill('disclosure-456');

    console.log('📍 Step 3: Download disclosure report');
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: /Download Disclosure Report/i }).click();

    console.log('📍 Step 4: Verify download initiated');
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/ccpa-disclosure-\d+\.json/);

    console.log('✅ Data disclosure delivery validated');
  });

  test('verifies California consumer rights information displayed', async ({ page }) => {
    console.log('📍 Step 1: Navigate to CCPA compliance tab');
    // Already navigated in beforeEach

    console.log('📍 Step 2: Verify consumer rights header present');
    await expect(page.getByText(/California Consumer Rights/i)).toBeVisible();

    console.log('📍 Step 3: Verify right to know');
    await expect(page.getByText(/Right to Know/i)).toBeVisible();
    await expect(page.getByText(/You have the right to request disclosure/i)).toBeVisible();

    console.log('📍 Step 4: Verify right to delete');
    await expect(page.getByText(/Right to Delete/i)).toBeVisible();

    console.log('📍 Step 5: Verify right to opt-out of sale');
    await expect(page.getByText(/Right to Opt-Out of Sale/i)).toBeVisible();

    console.log('📍 Step 6: Verify non-discrimination notice');
    await expect(page.getByText(/Right to Non-Discrimination/i)).toBeVisible();
    await expect(page.getByText(/We will not discriminate against you/i)).toBeVisible();

    console.log('✅ California consumer rights information validated');
  });

  test('enforces Do Not Sell opt-out in chat widget', async ({ page }) => {
    console.log('📍 Step 1: Set Do Not Sell opt-out status');

    // Mock the Do Not Sell check in chat API
    await page.route('**/api/chat', async (route) => {
      const requestBody = await route.request().postDataJSON();

      // Verify that chat API respects Do Not Sell status
      expect(requestBody.do_not_sell).toBe(true);

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          response: 'Hello! How can I help you today?',
          tracking_disabled: true, // CCPA opt-out enforced
          analytics_disabled: true,
        }),
      });
    });

    console.log('📍 Step 2: Load chat widget with Do Not Sell cookie');
    await page.context().addCookies([
      {
        name: 'ccpa_do_not_sell',
        value: 'true',
        domain: 'localhost',
        path: '/',
      },
    ]);

    await page.goto(`${BASE_URL}/widget-test`);
    const iframe = page.frameLocator('iframe#chat-widget-iframe');

    console.log('📍 Step 3: Send chat message');
    await iframe.locator('input[type="text"]').fill('Hello');
    await iframe.locator('button[type="submit"]').click();

    console.log('📍 Step 4: Verify Do Not Sell indicator in chat');
    await expect(iframe.locator('text=/Do Not Sell Active|Tracking Disabled/i')).toBeVisible();

    console.log('✅ Do Not Sell enforcement in chat validated');
  });

  test('handles Do Not Sell request with verification', async ({ page }) => {
    console.log('📍 Step 1: Submit Do Not Sell request requiring verification');

    await page.route('**/api/privacy/ccpa/do-not-sell', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Verification email sent',
          request_id: 'dns-789',
          verification_required: true,
          verification_expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        }),
      });
    });

    console.log('📍 Step 2: Fill form and submit');
    await page.getByLabel(/Customer Domain/i).fill('california-business.com');
    await page.getByLabel(/Email Address/i).fill('user@california.com');
    await page.getByRole('button', { name: /Submit Do Not Sell Request/i }).click();

    console.log('📍 Step 3: Verify verification email notice');
    await expect(page.getByText(/Verification email sent/i)).toBeVisible();
    await expect(page.getByText(/Please check your email to verify/i)).toBeVisible();

    console.log('📍 Step 4: Mock verification link click');
    await page.route('**/api/privacy/ccpa/do-not-sell/verify', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Do Not Sell request verified and activated',
          request_id: 'dns-789',
        }),
      });
    });

    await page.goto(`${BASE_URL}/privacy/verify?token=verification-token-123`);

    console.log('📍 Step 5: Verify request activated');
    await expect(page.getByText(/Do Not Sell request verified and activated/i)).toBeVisible();

    console.log('✅ Do Not Sell verification workflow validated');
  });

  test('tracks third-party data sharing disclosures', async ({ page }) => {
    console.log('📍 Step 1: Request third-party sharing disclosure');

    await page.route('**/api/privacy/ccpa/third-party-sharing', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          third_party_sharing: {
            enabled: true,
            partners: [
              {
                name: 'Analytics Provider Inc.',
                categories_shared: ['internet_activity'],
                purpose: 'Website analytics',
                opt_out_available: true,
              },
              {
                name: 'Email Marketing Service',
                categories_shared: ['personal_information'],
                purpose: 'Marketing communications',
                opt_out_available: true,
              },
            ],
            last_updated: new Date().toISOString(),
          },
        }),
      });
    });

    console.log('📍 Step 2: View third-party sharing disclosures');
    await page.getByRole('button', { name: /View Third-Party Sharing/i }).click();

    console.log('📍 Step 3: Verify sharing partners listed');
    await expect(page.getByText(/Analytics Provider Inc\./i)).toBeVisible();
    await expect(page.getByText(/Email Marketing Service/i)).toBeVisible();

    console.log('📍 Step 4: Verify categories and purposes shown');
    await expect(page.getByText(/internet_activity/i)).toBeVisible();
    await expect(page.getByText(/Website analytics/i)).toBeVisible();

    console.log('✅ Third-party sharing disclosure validated');
  });
});
