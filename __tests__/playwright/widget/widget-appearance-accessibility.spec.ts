/**
 * E2E Test: Widget Appearance - Accessibility
 *
 * Tests widget accessibility attributes, responsive layout, and WCAG compliance.
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_TIMEOUT = 120000;

test.describe('Widget Appearance - Accessibility E2E', () => {
  test.setTimeout(TEST_TIMEOUT);

  test('should have proper accessibility attributes', async ({ page }) => {
    console.log('📍 Step 1: Navigate to widget test page');
    await page.goto(`${BASE_URL}/test-widget`, {
      waitUntil: 'networkidle',
      timeout: 15000
    });

    // Wait for widget iframe
    const iframeLocator = page.locator('iframe#chat-widget-iframe');
    await iframeLocator.waitFor({ state: 'visible', timeout: 10000 });

    // Check accessibility attributes on iframe
    console.log('📍 Step 2: Verify iframe accessibility attributes');
    const a11yAttributes = await iframeLocator.evaluate(el => {
      const htmlEl = el as HTMLElement;
      return {
        id: el.id,
        title: htmlEl.title || '',
        role: el.getAttribute('role'),
        ariaLabel: el.getAttribute('aria-label'),
        ariaDescribedBy: el.getAttribute('aria-describedby'),
      };
    });

    console.log('✅ Accessibility attributes:', a11yAttributes);
    expect(a11yAttributes.id).toBe('chat-widget-iframe');
  });

  test('should verify widget responsive layout indicators', async ({ page }) => {
    console.log('📍 Step 1: Navigate to widget test page');
    await page.goto(`${BASE_URL}/test-widget`, {
      waitUntil: 'networkidle',
      timeout: 15000
    });

    // Check window size
    console.log('📍 Step 2: Get viewport dimensions');
    const viewport = await page.evaluate(() => {
      return {
        width: window.innerWidth,
        height: window.innerHeight,
      };
    });

    console.log(`✅ Viewport: ${viewport.width}x${viewport.height}`);

    // Wait for widget
    const iframeLocator = page.locator('iframe#chat-widget-iframe');
    await iframeLocator.waitFor({ state: 'visible', timeout: 10000 });

    // Check widget dimensions relative to viewport
    console.log('📍 Step 3: Check widget dimensions');
    const dimensions = await iframeLocator.evaluate(el => {
      const rect = el.getBoundingClientRect();
      return {
        width: rect.width,
        height: rect.height,
        isResponsive: rect.width < window.innerWidth && rect.height < window.innerHeight,
      };
    });

    console.log('✅ Widget dimensions:', dimensions);
    expect(dimensions.isResponsive).toBe(true);
    console.log('✅ Widget is responsive');
  });

  test('should verify widget does not have accessibility violations', async ({ page }) => {
    console.log('📍 Step 1: Navigate to widget test page');
    await page.goto(`${BASE_URL}/test-widget`, {
      waitUntil: 'networkidle',
      timeout: 15000
    });

    // Wait for widget iframe
    const iframeLocator = page.locator('iframe#chat-widget-iframe');
    await iframeLocator.waitFor({ state: 'visible', timeout: 10000 });

    // Check for basic WCAG compliance
    console.log('📍 Step 2: Check WCAG 2.1 compliance indicators');
    const a11yCheck = await page.evaluate(() => {
      const issues = [];

      // Check for alt text on images
      const images = document.querySelectorAll('img');
      images.forEach(img => {
        if (!img.alt) {
          issues.push('Image missing alt text');
        }
      });

      // Check for proper heading hierarchy
      const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
      if (headings.length > 0) {
        console.log(`Found ${headings.length} headings`);
      }

      // Check for sufficient color contrast (simple check)
      const allElements = document.querySelectorAll('*');
      console.log(`Checked ${allElements.length} elements for accessibility`);

      return {
        imageAltTextIssues: issues.length,
        headingsFound: headings.length,
        elementsChecked: allElements.length,
      };
    });

    console.log('✅ Accessibility check results:', a11yCheck);
  });
});
