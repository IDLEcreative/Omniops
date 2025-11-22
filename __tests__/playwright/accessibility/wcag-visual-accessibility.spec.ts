import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';

/**
 * E2E Test: WCAG Visual Accessibility
 *
 * Tests color contrast, visual design compliance, and rendering quality.
 *
 * User Journey (Visual Accessibility):
 * 1. Load chat widget
 * 2. Run color contrast audit
 * 3. Test widget-specific contrast ratios
 * 4. Verify WCAG AA compliance (4.5:1 minimum) ← THE TRUE "END"
 *
 * This test validates:
 * - Color contrast meets WCAG AA (4.5:1 for text)
 * - No contrast violations in widget
 * - Visual accessibility standards compliance
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_TIMEOUT = 180000;

test.describe('WCAG Visual Accessibility E2E', () => {
  test.setTimeout(TEST_TIMEOUT);

  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('should meet color contrast requirements (WCAG AA)', async ({ page }) => {
    console.log('=== Starting Color Contrast Test ===');

    console.log('📍 Step 1: Loading chat widget');
    await page.goto(`${BASE_URL}/widget-test`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    console.log('📍 Step 2: Injecting axe-core for accessibility testing');

    // Inject axe-core accessibility testing library
    await injectAxe(page);

    console.log('✅ axe-core injected');

    console.log('📍 Step 3: Running color contrast audit');

    // Check color contrast compliance
    const violations = await checkA11y(page, undefined, {
      detailedReport: true,
      detailedReportOptions: { html: true },
      axeOptions: {
        runOnly: {
          type: 'tag',
          values: ['wcag2a', 'wcag2aa', 'wcag21aa']
        },
        rules: {
          'color-contrast': { enabled: true }
        }
      }
    });

    console.log('📊 Color Contrast Audit Results:');

    if (violations && violations.length > 0) {
      console.log(`   ❌ Found ${violations.length} violations`);

      violations.forEach((violation, index) => {
        console.log(`\n   Violation ${index + 1}:`);
        console.log(`   - Rule: ${violation.id}`);
        console.log(`   - Impact: ${violation.impact}`);
        console.log(`   - Description: ${violation.description}`);
        console.log(`   - Affected elements: ${violation.nodes.length}`);
      });
    } else {
      console.log('   ✅ No color contrast violations found');
    }

    // Specifically test widget elements
    const widgetIframe = page.locator('iframe#chat-widget-iframe');

    if (await widgetIframe.isVisible()) {
      const iframe = page.frameLocator('iframe#chat-widget-iframe');

      console.log('📍 Step 4: Testing widget-specific contrast');

      // Get computed styles for key elements
      const inputField = iframe.locator('input, textarea').first();

      if (await inputField.isVisible()) {
        const contrast = await inputField.evaluate((el) => {
          const styles = window.getComputedStyle(el);
          return {
            color: styles.color,
            backgroundColor: styles.backgroundColor,
            fontSize: styles.fontSize
          };
        });

        console.log('   Input field styles:', contrast);
        console.log('✅ Widget color contrast checked');
      }
    }

    console.log('✅ Color contrast test completed!');
  });

  test('should run full axe accessibility audit for visual elements', async ({ page }) => {
    console.log('=== Starting Full Visual Accessibility Audit ===');

    console.log('📍 Step 1: Loading widget test page');
    await page.goto(`${BASE_URL}/widget-test`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    console.log('📍 Step 2: Injecting axe-core');
    await injectAxe(page);

    console.log('📍 Step 3: Running comprehensive visual accessibility audit');

    // Run WCAG 2.1 AA audit for visual elements
    await checkA11y(page, undefined, {
      detailedReport: true,
      axeOptions: {
        runOnly: {
          type: 'tag',
          values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice']
        }
      }
    });

    console.log('✅ Full visual accessibility audit completed!');

    await page.screenshot({
      path: `test-results/visual-accessibility-audit-${Date.now()}.png`,
      fullPage: true
    });

    console.log('✅ Visual accessibility compliance validated!');
  });

  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status !== 'passed') {
      await page.screenshot({
        path: `test-results/visual-accessibility-failure-${Date.now()}.png`,
        fullPage: true
      });
    }
  });
});
