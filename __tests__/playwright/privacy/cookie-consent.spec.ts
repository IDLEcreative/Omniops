import { test, expect } from '@playwright/test';

/**
 * E2E Test: Cookie Consent Management
 *
 * Tests cookie consent workflows including:
 * - Cookie banner display on first visit
 * - Accept all cookies
 * - Reject all cookies
 * - Customize cookie preferences
 * - Cookie consent persistence
 * - Cookie consent withdrawal
 * - Cookie policy link verification
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Cookie Consent Management', () => {
  test.beforeEach(async ({ context }) => {
    // Clear cookies before each test to simulate first visit
    await context.clearCookies();
  });

  test('displays cookie banner on first visit', async ({ page }) => {
    console.log('📍 Step 1: Navigate to site without consent cookie');
    await page.goto(BASE_URL);

    console.log('📍 Step 2: Verify cookie banner appears');
    const cookieBanner = page.locator('[data-testid="cookie-banner"], .cookie-consent-banner, #cookie-consent');
    await expect(cookieBanner).toBeVisible();

    console.log('📍 Step 3: Verify banner contains required elements');
    await expect(page.getByText(/We use cookies/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Accept|Allow/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Reject|Decline/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Cookie Policy|Learn More/i })).toBeVisible();

    console.log('✅ Cookie banner display validated');
  });

  test('accepts all cookies and persists consent', async ({ page, context }) => {
    console.log('📍 Step 1: Navigate to site');
    await page.goto(BASE_URL);

    console.log('📍 Step 2: Click Accept All button');
    await page.getByRole('button', { name: /Accept All|Accept/i }).click();

    console.log('📍 Step 3: Verify banner dismissed');
    const cookieBanner = page.locator('[data-testid="cookie-banner"], .cookie-consent-banner, #cookie-consent');
    await expect(cookieBanner).not.toBeVisible();

    console.log('📍 Step 4: Verify consent cookie set');
    const cookies = await context.cookies();
    const consentCookie = cookies.find(c => c.name === 'cookie_consent' || c.name === 'cookies_accepted');
    expect(consentCookie).toBeDefined();
    expect(consentCookie?.value).toMatch(/accepted|true|all/i);

    console.log('📍 Step 5: Reload page and verify banner stays hidden');
    await page.reload();
    await expect(cookieBanner).not.toBeVisible();

    console.log('✅ Accept all cookies workflow validated');
  });

  test('rejects all cookies and limits functionality', async ({ page, context }) => {
    console.log('📍 Step 1: Navigate to site');
    await page.goto(BASE_URL);

    console.log('📍 Step 2: Click Reject All button');
    await page.getByRole('button', { name: /Reject All|Decline|Reject/i }).click();

    console.log('📍 Step 3: Verify banner dismissed');
    const cookieBanner = page.locator('[data-testid="cookie-banner"], .cookie-consent-banner, #cookie-consent');
    await expect(cookieBanner).not.toBeVisible();

    console.log('📍 Step 4: Verify rejection cookie set');
    const cookies = await context.cookies();
    const consentCookie = cookies.find(c => c.name === 'cookie_consent' || c.name === 'cookies_accepted');
    expect(consentCookie).toBeDefined();
    expect(consentCookie?.value).toMatch(/rejected|false|essential-only/i);

    console.log('📍 Step 5: Verify analytics cookies NOT set');
    const analyticsCookies = cookies.filter(c =>
      c.name.includes('_ga') || c.name.includes('_gid') || c.name.includes('analytics')
    );
    expect(analyticsCookies.length).toBe(0);

    console.log('📍 Step 6: Reload page and verify banner stays hidden');
    await page.reload();
    await expect(cookieBanner).not.toBeVisible();

    console.log('✅ Reject all cookies workflow validated');
  });

  test('customizes cookie preferences', async ({ page, context }) => {
    console.log('📍 Step 1: Navigate to site');
    await page.goto(BASE_URL);

    console.log('📍 Step 2: Click Customize/Settings button');
    await page.getByRole('button', { name: /Customize|Settings|Manage/i }).click();

    console.log('📍 Step 3: Verify cookie categories displayed');
    await expect(page.getByText(/Essential Cookies/i)).toBeVisible();
    await expect(page.getByText(/Analytics Cookies/i)).toBeVisible();
    await expect(page.getByText(/Marketing Cookies/i)).toBeVisible();
    await expect(page.getByText(/Functional Cookies/i)).toBeVisible();

    console.log('📍 Step 4: Verify essential cookies cannot be disabled');
    const essentialToggle = page.getByLabel(/Essential Cookies/i);
    await expect(essentialToggle).toBeDisabled();

    console.log('📍 Step 5: Enable only analytics cookies');
    const analyticsToggle = page.getByLabel(/Analytics Cookies/i);
    await analyticsToggle.check();

    const marketingToggle = page.getByLabel(/Marketing Cookies/i);
    if (await marketingToggle.isChecked()) {
      await marketingToggle.uncheck();
    }

    console.log('📍 Step 6: Save preferences');
    await page.getByRole('button', { name: /Save Preferences|Confirm/i }).click();

    console.log('📍 Step 7: Verify banner dismissed');
    const cookieBanner = page.locator('[data-testid="cookie-banner"], .cookie-consent-banner, #cookie-consent');
    await expect(cookieBanner).not.toBeVisible();

    console.log('📍 Step 8: Verify custom preferences saved in cookie');
    const cookies = await context.cookies();
    const consentCookie = cookies.find(c => c.name === 'cookie_consent' || c.name === 'cookie_preferences');
    expect(consentCookie).toBeDefined();

    // Parse cookie value (might be JSON)
    const cookieValue = consentCookie?.value;
    if (cookieValue) {
      try {
        const preferences = JSON.parse(decodeURIComponent(cookieValue));
        expect(preferences.analytics).toBe(true);
        expect(preferences.marketing).toBe(false);
      } catch {
        // If not JSON, check for string representation
        expect(cookieValue).toContain('analytics');
      }
    }

    console.log('✅ Customize cookie preferences validated');
  });

  test('persists cookie consent across sessions', async ({ page, context }) => {
    console.log('📍 Step 1: Navigate and accept cookies');
    await page.goto(BASE_URL);
    await page.getByRole('button', { name: /Accept All/i }).click();

    console.log('📍 Step 2: Get consent cookie value');
    const cookies = await context.cookies();
    const consentCookie = cookies.find(c => c.name === 'cookie_consent' || c.name === 'cookies_accepted');
    expect(consentCookie).toBeDefined();

    console.log('📍 Step 3: Close and reopen page (simulate new session)');
    await page.close();
    const newPage = await context.newPage();
    await newPage.goto(BASE_URL);

    console.log('📍 Step 4: Verify banner does not appear');
    const cookieBanner = newPage.locator('[data-testid="cookie-banner"], .cookie-consent-banner, #cookie-consent');
    await expect(cookieBanner).not.toBeVisible();

    console.log('📍 Step 5: Verify consent cookie still present');
    const newCookies = await context.cookies();
    const persistedCookie = newCookies.find(c => c.name === 'cookie_consent' || c.name === 'cookies_accepted');
    expect(persistedCookie).toBeDefined();
    expect(persistedCookie?.value).toBe(consentCookie?.value);

    console.log('✅ Cookie consent persistence validated');
  });

  test('withdraws cookie consent', async ({ page, context }) => {
    console.log('📍 Step 1: Navigate and accept cookies');
    await page.goto(BASE_URL);
    await page.getByRole('button', { name: /Accept All/i }).click();

    console.log('📍 Step 2: Navigate to privacy settings');
    await page.goto(`${BASE_URL}/privacy-settings`);

    console.log('📍 Step 3: Click withdraw consent button');
    await page.getByRole('button', { name: /Withdraw Consent|Revoke|Reset/i }).click();

    console.log('📍 Step 4: Confirm withdrawal in dialog');
    await page.getByRole('button', { name: /Confirm/i }).click();

    console.log('📍 Step 5: Verify consent cookie removed');
    const cookies = await context.cookies();
    const consentCookie = cookies.find(c => c.name === 'cookie_consent' || c.name === 'cookies_accepted');
    // Cookie should be removed or set to 'withdrawn'
    if (consentCookie) {
      expect(consentCookie.value).toMatch(/withdrawn|false|rejected/i);
    }

    console.log('📍 Step 6: Navigate to homepage and verify banner reappears');
    await page.goto(BASE_URL);
    const cookieBanner = page.locator('[data-testid="cookie-banner"], .cookie-consent-banner, #cookie-consent');
    await expect(cookieBanner).toBeVisible();

    console.log('✅ Cookie consent withdrawal validated');
  });

  test('links to cookie policy page', async ({ page }) => {
    console.log('📍 Step 1: Navigate to site');
    await page.goto(BASE_URL);

    console.log('📍 Step 2: Click cookie policy link in banner');
    const cookiePolicyLink = page.getByRole('link', { name: /Cookie Policy|Learn More|Privacy Policy/i });
    await expect(cookiePolicyLink).toBeVisible();

    const [policyPage] = await Promise.all([
      page.waitForEvent('popup'),
      cookiePolicyLink.click(),
    ]);

    console.log('📍 Step 3: Verify cookie policy page loaded');
    await policyPage.waitForLoadState();
    const url = policyPage.url();
    expect(url).toMatch(/cookie-policy|privacy-policy|cookies/i);

    console.log('📍 Step 4: Verify policy content present');
    await expect(policyPage.getByText(/Cookie Policy|How We Use Cookies/i)).toBeVisible();
    await expect(policyPage.getByText(/Essential Cookies/i)).toBeVisible();

    console.log('✅ Cookie policy link validated');
  });

  test('respects Do Not Track browser setting', async ({ page, context }) => {
    console.log('📍 Step 1: Set Do Not Track header');
    await page.setExtraHTTPHeaders({
      'DNT': '1',
    });

    console.log('📍 Step 2: Navigate to site');
    await page.goto(BASE_URL);

    console.log('📍 Step 3: Verify DNT notice displayed in banner');
    await expect(page.getByText(/Do Not Track detected|respecting your tracking preferences/i)).toBeVisible();

    console.log('📍 Step 4: Accept cookies');
    await page.getByRole('button', { name: /Accept/i }).click();

    console.log('📍 Step 5: Verify analytics cookies NOT set despite acceptance');
    const cookies = await context.cookies();
    const analyticsCookies = cookies.filter(c =>
      c.name.includes('_ga') || c.name.includes('_gid') || c.name.includes('analytics')
    );
    expect(analyticsCookies.length).toBe(0);

    console.log('✅ Do Not Track respect validated');
  });

  test('provides cookie details in preferences modal', async ({ page }) => {
    console.log('📍 Step 1: Navigate to site');
    await page.goto(BASE_URL);

    console.log('📍 Step 2: Open cookie settings');
    await page.getByRole('button', { name: /Customize|Settings/i }).click();

    console.log('📍 Step 3: Verify detailed cookie information');
    // Essential cookies
    await expect(page.getByText(/Session management|Authentication|Security/i)).toBeVisible();

    // Analytics cookies
    const analyticsSection = page.locator('[data-cookie-category="analytics"]');
    await expect(analyticsSection.getByText(/Google Analytics|Usage statistics|Performance tracking/i)).toBeVisible();

    // Marketing cookies
    const marketingSection = page.locator('[data-cookie-category="marketing"]');
    await expect(marketingSection.getByText(/Advertising|Retargeting|Social media/i)).toBeVisible();

    console.log('📍 Step 4: Verify cookie lifespan information');
    await expect(page.getByText(/Session|1 year|2 years|30 days/i)).toBeVisible();

    console.log('✅ Cookie details in preferences validated');
  });

  test('handles consent banner on mobile viewport', async ({ page }) => {
    console.log('📍 Step 1: Set mobile viewport');
    await page.setViewportSize({ width: 375, height: 667 });

    console.log('📍 Step 2: Navigate to site');
    await page.goto(BASE_URL);

    console.log('📍 Step 3: Verify banner is visible and responsive');
    const cookieBanner = page.locator('[data-testid="cookie-banner"], .cookie-consent-banner, #cookie-consent');
    await expect(cookieBanner).toBeVisible();

    console.log('📍 Step 4: Verify buttons are stacked vertically (mobile layout)');
    const acceptButton = page.getByRole('button', { name: /Accept/i });
    const rejectButton = page.getByRole('button', { name: /Reject/i });

    const acceptBox = await acceptButton.boundingBox();
    const rejectBox = await rejectButton.boundingBox();

    // On mobile, buttons should be stacked (accept button should be above reject button)
    if (acceptBox && rejectBox) {
      expect(acceptBox.y).toBeLessThan(rejectBox.y);
    }

    console.log('📍 Step 5: Accept cookies on mobile');
    await acceptButton.click();

    console.log('📍 Step 6: Verify banner dismissed');
    await expect(cookieBanner).not.toBeVisible();

    console.log('✅ Mobile cookie consent validated');
  });
});
