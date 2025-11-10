import { test, expect, Page } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';
const TEST_TIMEOUT = 60000;

test.describe('Session Metadata Tracking E2E', () => {
  test.setTimeout(TEST_TIMEOUT);

  test('should track session metadata across page navigation', async ({ page }) => {
    console.log('=== Starting E2E Session Metadata Test ===');

    // Step 1: Navigate to home page
    console.log('📍 Step 1: Navigating to home page');
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    console.log('✅ Home page loaded');

    // Step 2: Navigate to pricing
    console.log('📍 Step 2: Navigating to pricing page');
    await page.goto(`${BASE_URL}/pricing`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    console.log('✅ Pricing page loaded');

    // Step 3: Navigate to test-widget page (has embedded ChatWidget)
    console.log('📍 Step 3: Navigating to test-widget page');
    await page.goto(`${BASE_URL}/test-widget`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000); // Extra time for widget to mount
    console.log('✅ Test-widget page loaded');

    // Step 4: Verify session metadata in localStorage
    console.log('📍 Step 4: Checking localStorage for session metadata');
    const sessionData = await page.evaluate(() => {
      const data = localStorage.getItem('omniops-session-metadata');
      return data ? JSON.parse(data) : null;
    });

    console.log('💾 Session data from localStorage:', JSON.stringify(sessionData, null, 2));

    // Assertions for session metadata structure
    expect(sessionData).toBeDefined();
    expect(sessionData).not.toBeNull();
    expect(sessionData.session_id).toBeTruthy();
    expect(sessionData.session_id).toMatch(/^session-\d+-[a-z0-9]+$/); // SessionTracker format: session-{timestamp}-{random}
    expect(sessionData.page_views).toBeInstanceOf(Array);
    expect(sessionData.page_views.length).toBeGreaterThanOrEqual(3);

    console.log(`✅ Session tracking verified: ${sessionData.page_views.length} page views recorded`);

    // Verify page view entries contain expected URLs/paths
    const pageViewUrls = sessionData.page_views.map((pv: any) => pv.url);
    const hasHomePage = pageViewUrls.some((url: string) => url === '/' || url?.includes('localhost:3000/') && !url.includes('/pricing') && !url.includes('/login'));
    const hasPricing = pageViewUrls.some((url: string) => url?.includes('/pricing'));
    expect(hasHomePage).toBe(true);
    expect(hasPricing).toBe(true);

    console.log('✅ All expected pages tracked:', pageViewUrls.slice(0, 5).join(', '));

    console.log('=== ✅ Session Tracking Test Completed Successfully ===');
  });

  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status !== 'passed') {
      console.log('❌ Test failed, taking screenshot');
      await page.screenshot({
        path: `e2e-failure-${Date.now()}.png`,
        fullPage: true
      });
    }
  });
});
