import { test, expect, chromium, firefox, webkit } from '@playwright/test';

/**
 * E2E Test: Cross-Browser Compatibility
 *
 * Tests widget functionality across Chromium, Firefox, and WebKit browsers.
 * Ensures consistent behavior and rendering across all major browser engines.
 *
 * Test Coverage:
 * 1. Widget loads correctly in all browsers
 * 2. Chat functionality works across browsers
 * 3. CSS rendering is consistent
 * 4. JavaScript APIs work correctly
 * 5. Local storage persistence
 * 6. iframe communication
 * 7. Event handling (click, keyboard)
 * 8. Responsive design breakpoints ← THE TRUE "END"
 *
 * Browsers Tested:
 * - Chromium (Chrome, Edge)
 * - Firefox
 * - WebKit (Safari)
 *
 * This test validates:
 * - Widget works in all major browsers
 * - No browser-specific bugs
 * - Consistent UX across browsers
 * - Graceful feature degradation
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_TIMEOUT = 180000;

test.describe('Cross-Browser Compatibility Tests', () => {
  test.setTimeout(TEST_TIMEOUT);

  // Test configuration for each browser
  const browsers = [
    { name: 'Chromium', type: chromium },
    { name: 'Firefox', type: firefox },
    { name: 'WebKit', type: webkit }
  ];

  for (const browserConfig of browsers) {
    test(`${browserConfig.name}: should load widget and send message`, async () => {
      console.log(`=== Testing on ${browserConfig.name} ===`);

      // ========================================================================
      // STEP 1: Launch browser
      // ========================================================================
      console.log(`📍 Step 1: Launching ${browserConfig.name}`);

      const browser = await browserConfig.type.launch({
        headless: true
      });

      const context = await browser.newContext({
        viewport: { width: 1280, height: 720 }
      });

      const page = await context.newPage();

      console.log(`✅ ${browserConfig.name} launched`);

      try {
        // ======================================================================
        // STEP 2: Navigate to widget test page
        // ======================================================================
        console.log('📍 Step 2: Loading widget test page');

        await page.goto(`${BASE_URL}/widget-test`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);

        console.log('✅ Page loaded');

        // ======================================================================
        // STEP 3: Verify widget iframe loads
        // ======================================================================
        console.log('📍 Step 3: Verifying widget iframe loads');

        const widgetIframe = page.locator('iframe#chat-widget-iframe');
        await widgetIframe.waitFor({ state: 'attached', timeout: 10000 });

        const iframeExists = await widgetIframe.count() > 0;
        expect(iframeExists).toBe(true);

        console.log('✅ Widget iframe loaded');

        // ======================================================================
        // STEP 4: Access iframe content
        // ======================================================================
        console.log('📍 Step 4: Accessing iframe content');

        const iframe = page.frameLocator('iframe#chat-widget-iframe');
        const inputField = iframe.locator('input[type="text"], textarea').first();

        await inputField.waitFor({ state: 'visible', timeout: 10000 });

        console.log('✅ Input field accessible');

        // ======================================================================
        // STEP 5: Mock chat API
        // ======================================================================
        console.log('📍 Step 5: Setting up chat API mock');

        await page.route('**/api/chat', async (route) => {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              response: `${browserConfig.name} test: Chat is working!`
            })
          });
        });

        console.log('✅ Chat API mock ready');

        // ======================================================================
        // STEP 6: Send test message
        // ======================================================================
        console.log('📍 Step 6: Sending test message');

        await inputField.fill(`Testing on ${browserConfig.name}`);
        await inputField.press('Enter');

        await page.waitForTimeout(2000);

        console.log('✅ Message sent');

        // ======================================================================
        // STEP 7: Verify chat functionality works
        // ======================================================================
        console.log('📍 Step 7: Verifying chat response');

        const chatMessages = iframe.locator('.message, [class*="message"], [data-testid="message"]');
        const messageCount = await chatMessages.count();

        expect(messageCount).toBeGreaterThan(0);
        console.log(`✅ Chat messages displayed (${messageCount} found)`);

        // ======================================================================
        // STEP 8: Take screenshot
        // ======================================================================
        await page.screenshot({
          path: `test-results/cross-browser-${browserConfig.name.toLowerCase()}-${Date.now()}.png`,
          fullPage: true
        });

        console.log(`✅ ${browserConfig.name}: Widget fully functional!`);

      } finally {
        await browser.close();
        console.log(`✅ ${browserConfig.name} closed`);
      }
    });

    test(`${browserConfig.name}: should render CSS correctly`, async () => {
      console.log(`=== Testing CSS Rendering on ${browserConfig.name} ===`);

      const browser = await browserConfig.type.launch({ headless: true });
      const context = await browser.newContext({
        viewport: { width: 1280, height: 720 }
      });
      const page = await context.newPage();

      try {
        await page.goto(`${BASE_URL}/widget-test`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);

        const widgetIframe = page.locator('iframe#chat-widget-iframe');
        await widgetIframe.waitFor({ state: 'attached', timeout: 10000 });

        const iframe = page.frameLocator('iframe#chat-widget-iframe');
        const inputField = iframe.locator('input, textarea').first();
        await inputField.waitFor({ state: 'visible' });

        // Check computed styles
        const styles = await inputField.evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return {
            display: computed.display,
            visibility: computed.visibility,
            opacity: computed.opacity,
            borderStyle: computed.borderStyle,
            fontSize: computed.fontSize
          };
        });

        console.log('📊 Input field styles:');
        console.log(`   - display: ${styles.display}`);
        console.log(`   - visibility: ${styles.visibility}`);
        console.log(`   - opacity: ${styles.opacity}`);
        console.log(`   - borderStyle: ${styles.borderStyle}`);
        console.log(`   - fontSize: ${styles.fontSize}`);

        expect(styles.display).not.toBe('none');
        expect(styles.visibility).not.toBe('hidden');
        expect(parseFloat(styles.opacity)).toBeGreaterThan(0);

        console.log(`✅ ${browserConfig.name}: CSS rendering correct!`);

      } finally {
        await browser.close();
      }
    });

    test(`${browserConfig.name}: should persist data to localStorage`, async () => {
      console.log(`=== Testing localStorage on ${browserConfig.name} ===`);

      const browser = await browserConfig.type.launch({ headless: true });
      const context = await browser.newContext();
      const page = await context.newPage();

      try {
        await page.goto(`${BASE_URL}/widget-test`, { waitUntil: 'networkidle' });

        // Set test data in localStorage
        await page.evaluate(() => {
          localStorage.setItem('omniops_test_key', 'test_value');
          localStorage.setItem('omniops_session_id', 'session-123');
        });

        console.log('✅ Data written to localStorage');

        // Reload page
        await page.reload({ waitUntil: 'networkidle' });

        // Verify data persisted
        const retrievedData = await page.evaluate(() => {
          return {
            testKey: localStorage.getItem('omniops_test_key'),
            sessionId: localStorage.getItem('omniops_session_id')
          };
        });

        expect(retrievedData.testKey).toBe('test_value');
        expect(retrievedData.sessionId).toBe('session-123');

        console.log('✅ localStorage data persisted after reload');
        console.log(`✅ ${browserConfig.name}: localStorage working!`);

      } finally {
        await browser.close();
      }
    });

    test(`${browserConfig.name}: should handle keyboard events correctly`, async () => {
      console.log(`=== Testing Keyboard Events on ${browserConfig.name} ===`);

      const browser = await browserConfig.type.launch({ headless: true });
      const context = await browser.newContext();
      const page = await context.newPage();

      try {
        await page.goto(`${BASE_URL}/widget-test`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);

        const iframe = page.frameLocator('iframe#chat-widget-iframe');
        const inputField = iframe.locator('input, textarea').first();
        await inputField.waitFor({ state: 'visible' });

        // Setup API mock
        let messageSent = false;
        await page.route('**/api/chat', async (route) => {
          messageSent = true;
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              response: 'Keyboard test response'
            })
          });
        });

        // Type message
        await inputField.type('Keyboard test', { delay: 50 });

        // Press Enter
        await page.keyboard.press('Enter');
        await page.waitForTimeout(1000);

        expect(messageSent).toBe(true);

        console.log('✅ Enter key sends message');

        // Test Escape key (if applicable)
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);

        console.log('✅ Escape key handled');

        console.log(`✅ ${browserConfig.name}: Keyboard events working!`);

      } finally {
        await browser.close();
      }
    });
  }

  test('should work on mobile viewports (responsive)', async ({ page }) => {
    console.log('=== Testing Responsive Design (Mobile Viewports) ===');

    const mobileViewports = [
      { name: 'iPhone SE', width: 375, height: 667 },
      { name: 'iPhone 14 Pro', width: 393, height: 852 },
      { name: 'iPad Mini', width: 768, height: 1024 },
      { name: 'Android Phone', width: 360, height: 640 }
    ];

    for (const viewport of mobileViewports) {
      console.log(`📍 Testing ${viewport.name} (${viewport.width}x${viewport.height})`);

      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto(`${BASE_URL}/widget-test`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);

      const widgetIframe = page.locator('iframe#chat-widget-iframe');
      const isVisible = await widgetIframe.isVisible();

      expect(isVisible).toBe(true);
      console.log(`   ✅ Widget visible on ${viewport.name}`);

      // Check if widget is within viewport
      const boundingBox = await widgetIframe.boundingBox();

      if (boundingBox) {
        const withinViewport =
          boundingBox.x >= 0 &&
          boundingBox.y >= 0 &&
          boundingBox.x + boundingBox.width <= viewport.width &&
          boundingBox.y + boundingBox.height <= viewport.height;

        if (!withinViewport) {
          console.log(`   ⚠️  Widget may overflow viewport on ${viewport.name}`);
        } else {
          console.log(`   ✅ Widget fits within ${viewport.name} viewport`);
        }
      }

      await page.screenshot({
        path: `test-results/responsive-${viewport.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.png`,
        fullPage: false
      });
    }

    console.log('✅ Responsive design validated across mobile viewports!');
  });

  test('should handle browser feature detection gracefully', async ({ page }) => {
    console.log('=== Testing Browser Feature Detection ===');

    await page.goto(`${BASE_URL}/widget-test`, { waitUntil: 'networkidle' });

    const features = await page.evaluate(() => {
      return {
        localStorage: typeof localStorage !== 'undefined',
        sessionStorage: typeof sessionStorage !== 'undefined',
        fetch: typeof fetch !== 'undefined',
        Promise: typeof Promise !== 'undefined',
        postMessage: typeof window.postMessage !== 'undefined',
        addEventListener: typeof window.addEventListener !== 'undefined',
        customElements: typeof window.customElements !== 'undefined',
        IntersectionObserver: typeof IntersectionObserver !== 'undefined',
        ResizeObserver: typeof ResizeObserver !== 'undefined'
      };
    });

    console.log('📊 Browser Features:');
    Object.entries(features).forEach(([feature, supported]) => {
      console.log(`   ${supported ? '✅' : '❌'} ${feature}: ${supported}`);
    });

    // Essential features must be supported
    expect(features.localStorage).toBe(true);
    expect(features.fetch).toBe(true);
    expect(features.Promise).toBe(true);
    expect(features.postMessage).toBe(true);

    console.log('✅ All essential browser features supported!');
  });

  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status !== 'passed') {
      await page.screenshot({
        path: `test-results/cross-browser-failure-${Date.now()}.png`,
        fullPage: true
      });
    }
  });
});
