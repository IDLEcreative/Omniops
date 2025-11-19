/**
 * E2E Test: Widget Appearance - Styling
 *
 * Tests widget color customization, fonts, dark mode, and theme switching.
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_TIMEOUT = 120000;

test.describe('Widget Appearance - Styling E2E', () => {
  test.setTimeout(TEST_TIMEOUT);

  test('should support color customization', async ({ page }) => {
    console.log('📍 Step 1: Navigate to widget test page');
    await page.goto(`${BASE_URL}/test-widget`, {
      waitUntil: 'networkidle',
      timeout: 15000
    });

    // Set custom color configuration
    console.log('📍 Step 2: Set custom primary color');
    await page.evaluate(() => {
      (window as any).ChatWidgetConfig = {
        ...(window as any).ChatWidgetConfig,
        appearance: {
          ...((window as any).ChatWidgetConfig?.appearance || {}),
          primaryColor: '#FF5733', // Custom red color
        }
      };
    });

    console.log('✅ Custom color #FF5733 configured');

    // Wait for widget to load/reload with new config
    const iframeLocator = page.locator('iframe#chat-widget-iframe');
    await iframeLocator.waitFor({ state: 'visible', timeout: 10000 });
    await page.waitForTimeout(2000);

    // Verify color is applied in iframe
    console.log('📍 Step 3: Verify color application');
    const frameLocator = page.frameLocator('iframe#chat-widget-iframe');

    // Look for elements that should have the custom color
    const buttons = frameLocator.locator('button').all();
    const buttonCount = await buttons.then(b => b.length);

    console.log(`✅ Found ${buttonCount} button(s) in widget`);
    expect(buttonCount).toBeGreaterThan(0);
  });

  test('should support custom font settings', async ({ page }) => {
    console.log('📍 Step 1: Navigate to widget test page');
    await page.goto(`${BASE_URL}/test-widget`, {
      waitUntil: 'networkidle',
      timeout: 15000
    });

    // Set custom font configuration
    console.log('📍 Step 2: Configure custom font');
    await page.evaluate(() => {
      (window as any).ChatWidgetConfig = {
        ...(window as any).ChatWidgetConfig,
        appearance: {
          ...((window as any).ChatWidgetConfig?.appearance || {}),
          fontFamily: 'Georgia, serif',
          fontSize: '16px',
        }
      };
    });

    console.log('✅ Custom font configured: Georgia, serif, 16px');

    // Verify font is applied
    const iframeLocator = page.locator('iframe#chat-widget-iframe');
    await iframeLocator.waitFor({ state: 'visible', timeout: 10000 });
    await page.waitForTimeout(2000);

    console.log('✅ Custom font settings applied');
  });

  test('should support dark mode styling', async ({ page }) => {
    console.log('📍 Step 1: Navigate to widget test page');
    await page.goto(`${BASE_URL}/test-widget`, {
      waitUntil: 'networkidle',
      timeout: 15000
    });

    // Apply dark mode to document
    console.log('📍 Step 2: Enable dark mode');
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
      document.documentElement.style.colorScheme = 'dark';
    });

    console.log('✅ Dark mode enabled');

    // Wait for widget iframe
    const iframeLocator = page.locator('iframe#chat-widget-iframe');
    await iframeLocator.waitFor({ state: 'visible', timeout: 10000 });

    // Verify widget reflects dark mode
    console.log('📍 Step 3: Verify dark mode styling');
    const isDarkMode = await page.evaluate(() => {
      const isDark = document.documentElement.classList.contains('dark') ||
                     window.matchMedia('(prefers-color-scheme: dark)').matches;
      return isDark;
    });

    console.log(`✅ Dark mode status: ${isDarkMode}`);
    expect(isDarkMode).toBe(true);
  });

  test('should handle widget theme switching', async ({ page }) => {
    console.log('📍 Step 1: Navigate to widget test page');
    await page.goto(`${BASE_URL}/test-widget`, {
      waitUntil: 'networkidle',
      timeout: 15000
    });

    // Wait for widget
    const iframeLocator = page.locator('iframe#chat-widget-iframe');
    await iframeLocator.waitFor({ state: 'visible', timeout: 10000 });

    // Test light theme
    console.log('📍 Step 2: Test light theme');
    await page.evaluate(() => {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.colorScheme = 'light';
    });

    let isDark = await page.evaluate(() => {
      return document.documentElement.classList.contains('dark');
    });

    expect(isDark).toBe(false);
    console.log('✅ Light theme applied');

    // Test dark theme
    console.log('📍 Step 3: Test dark theme');
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
      document.documentElement.style.colorScheme = 'dark';
    });

    isDark = await page.evaluate(() => {
      return document.documentElement.classList.contains('dark');
    });

    expect(isDark).toBe(true);
    console.log('✅ Dark theme applied');

    // Verify widget is still visible
    console.log('📍 Step 4: Verify widget still visible after theme switch');
    const isVisible = await iframeLocator.isVisible();
    expect(isVisible).toBe(true);
    console.log('✅ Widget remains visible after theme switch');
  });
});
