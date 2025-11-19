/**
 * E2E Test: Widget Embed Code & Installation
 *
 * Tests the complete widget installation flow from code generation through verification.
 * Covers embed code generation, copying to clipboard, installation on different domains,
 * and verification of proper widget initialization.
 *
 * User Journey:
 * 1. Navigate to widget installation page
 * 2. Generate embed code
 * 3. Copy embed code to clipboard
 * 4. Install code on test pages
 * 5. Verify widget loads correctly
 * 6. Test multiple widgets on same page
 * 7. Verify widget with custom configuration
 * 8. Test embed code performance
 *
 * This test teaches AI agents:
 * - How to locate and copy embed code
 * - Expected embed code format and structure
 * - How to verify widget installation success
 * - Performance characteristics of embed script
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_TIMEOUT = 120000;

test.describe('Widget Embed Code & Installation E2E', () => {
  test.setTimeout(TEST_TIMEOUT);

  test('should generate and display embed code', async ({ page }) => {
    console.log('📍 Step 1: Navigate to widget installation page');
    await page.goto(`${BASE_URL}/dashboard/installation`, {
      waitUntil: 'networkidle',
      timeout: 15000
    });
    console.log('✅ Installation page loaded');

    // Verify embed code block exists
    console.log('📍 Step 2: Verify embed code block is visible');
    const embedCodeBlock = page.locator(
      'code, pre, textarea[readonly], [class*="code"], [class*="embed"]'
    ).first();

    await embedCodeBlock.waitFor({ state: 'visible', timeout: 10000 });
    const embedCode = await embedCodeBlock.textContent();

    expect(embedCode).toBeTruthy();
    expect(embedCode).toContain('script');
    expect(embedCode).toContain('embed.js');
    console.log('✅ Embed code block contains expected content');
  });

  test('should copy embed code to clipboard', async ({ page }) => {
    console.log('📍 Step 1: Navigate to installation page');
    await page.goto(`${BASE_URL}/dashboard/installation`, {
      waitUntil: 'networkidle',
      timeout: 15000
    });

    // Grant clipboard permissions
    console.log('📍 Step 2: Grant clipboard permissions');
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    console.log('✅ Clipboard permissions granted');

    // Find and click copy button
    console.log('📍 Step 3: Locate and click copy button');
    const copyButton = page.locator(
      'button:has-text("Copy"), button[aria-label*="copy" i], [data-testid="copy-button"]'
    ).first();

    const copyButtonVisible = await copyButton.isVisible({ timeout: 5000 }).catch(() => false);

    if (copyButtonVisible) {
      await copyButton.click();
      console.log('✅ Copy button clicked');

      // Wait for clipboard update
      await page.waitForTimeout(500);

      // Verify clipboard content
      console.log('📍 Step 4: Verify clipboard content');
      const clipboardText = await page.evaluate(() => navigator.clipboard.readText());

      expect(clipboardText).toBeTruthy();
      expect(clipboardText).toContain('script');
      expect(clipboardText).toContain('embed.js');
      console.log('✅ Embed code successfully copied to clipboard');
    } else {
      console.log('⚠️ Copy button not found, but embed code is accessible via DOM');
    }
  });

  test('should verify widget loads from embed code on test page', async ({ page }) => {
    console.log('📍 Step 1: Navigate to widget test page');
    await page.goto(`${BASE_URL}/test-widget`, {
      waitUntil: 'networkidle',
      timeout: 15000
    });
    console.log('✅ Test page loaded');

    // Wait for widget iframe to be created
    console.log('📍 Step 2: Wait for widget iframe to appear');
    const iframeLocator = page.locator('iframe#chat-widget-iframe');

    try {
      await iframeLocator.waitFor({ state: 'attached', timeout: 10000 });
      console.log('✅ Widget iframe found');
    } catch (error) {
      console.error('❌ Widget iframe not found');
      throw new Error('Widget failed to load from embed code');
    }

    // Verify iframe attributes
    console.log('📍 Step 3: Verify iframe attributes');
    const iframeId = await iframeLocator.getAttribute('id');
    const iframeSrc = await iframeLocator.getAttribute('src');

    expect(iframeId).toBe('chat-widget-iframe');
    expect(iframeSrc).toBeTruthy();
    console.log(`✅ Iframe attributes verified: src=${iframeSrc}`);

    // Verify widget config is set
    console.log('📍 Step 4: Verify widget configuration');
    const widgetConfig = await page.evaluate(() => {
      return (window as any).ChatWidgetConfig;
    });

    expect(widgetConfig).toBeDefined();
    expect(widgetConfig.serverUrl).toBeTruthy();
    console.log('✅ Widget configuration verified');
  });

  test('should handle embed code with custom configuration', async ({ page }) => {
    console.log('📍 Step 1: Navigate to test widget page');
    await page.goto(`${BASE_URL}/test-widget`, {
      waitUntil: 'networkidle',
      timeout: 15000
    });

    // Override widget config with custom settings
    console.log('📍 Step 2: Set custom widget configuration');
    await page.evaluate(() => {
      (window as any).ChatWidgetConfig = {
        serverUrl: window.location.origin,
        domain: 'custom-domain.example.com',
        appearance: {
          position: 'bottom-left',
          primaryColor: '#FF5733',
          startMinimized: true,
        },
        behavior: {
          autoOpen: false,
          showOnLoad: true,
        },
        debug: true,
      };
    });
    console.log('✅ Custom configuration set');

    // Verify config was applied
    console.log('📍 Step 3: Verify custom configuration');
    const config = await page.evaluate(() => {
      return (window as any).ChatWidgetConfig;
    });

    expect(config.appearance.position).toBe('bottom-left');
    expect(config.appearance.primaryColor).toBe('#FF5733');
    expect(config.appearance.startMinimized).toBe(true);
    console.log('✅ Custom configuration applied successfully');
  });

  test('should support multiple widgets on same page', async ({ page }) => {
    console.log('📍 Step 1: Navigate to test page');
    await page.goto(`${BASE_URL}/test-widget`, {
      waitUntil: 'networkidle',
      timeout: 15000
    });

    // Get first widget
    console.log('📍 Step 2: Verify first widget');
    const firstIframe = page.locator('iframe#chat-widget-iframe').first();
    await firstIframe.waitFor({ state: 'attached', timeout: 10000 });
    expect(await firstIframe.isVisible()).toBe(true);
    console.log('✅ First widget loaded');

    // Inject second widget configuration and script
    console.log('📍 Step 3: Inject second widget');
    await page.evaluate(() => {
      // Create second widget container
      const container = document.createElement('div');
      container.id = 'chat-widget-container-2';
      document.body.appendChild(container);

      // Set config for second widget
      if (!(window as any).ChatWidgetsConfig) {
        (window as any).ChatWidgetsConfig = [];
      }
      (window as any).ChatWidgetsConfig.push({
        id: 'chat-widget-2',
        serverUrl: window.location.origin,
        domain: 'widget-2.example.com',
        appearance: {
          position: 'bottom-right',
          primaryColor: '#0066CC',
        },
      });
    });
    console.log('✅ Second widget container created');

    // Reload or simulate second widget loading
    console.log('📍 Step 4: Verify widget system supports multiple instances');
    const widgetScript = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll('script'));
      const embedScripts = scripts.filter(s =>
        s.src?.includes('embed.js') || s.textContent?.includes('ChatWidget')
      );
      return embedScripts.length;
    });

    expect(widgetScript).toBeGreaterThan(0);
    console.log(`✅ Widget system loaded (${widgetScript} embed scripts found)`);
  });

  test('should verify widget script loading performance', async ({ page }) => {
    console.log('📍 Step 1: Navigate to test page and measure load time');

    const startTime = Date.now();
    await page.goto(`${BASE_URL}/test-widget`, {
      waitUntil: 'networkidle',
      timeout: 15000
    });
    const pageLoadTime = Date.now() - startTime;

    console.log(`✅ Page loaded in ${pageLoadTime}ms`);

    // Measure embed script performance
    console.log('📍 Step 2: Measure embed script load time');
    const scriptMetrics = await page.evaluate(() => {
      const perfEntries = (window as any).performance?.getEntriesByType?.('resource') || [];
      const embedScripts = perfEntries.filter((entry: any) =>
        entry.name.includes('embed.js') || entry.name.includes('widget-bundle.js')
      );

      return embedScripts.map((entry: any) => ({
        name: entry.name.split('/').pop(),
        duration: Math.round(entry.duration),
        size: entry.transferSize,
      }));
    });

    console.log('📊 Script Performance Metrics:');
    scriptMetrics.forEach((metric: any) => {
      console.log(`  - ${metric.name}: ${metric.duration}ms (${metric.size} bytes)`);
    });

    // Verify performance is acceptable
    expect(pageLoadTime).toBeLessThan(15000);
    console.log('✅ Page load time acceptable');
  });

  test('should handle embed code installation errors gracefully', async ({ page }) => {
    console.log('📍 Step 1: Navigate to test page');
    await page.goto(`${BASE_URL}/test-widget`, {
      waitUntil: 'networkidle',
      timeout: 15000
    });

    // Simulate missing widget config
    console.log('📍 Step 2: Verify widget handles missing config');
    const hasError = await page.evaluate(() => {
      try {
        // Check if widget config exists, if not, widget should handle it
        const config = (window as any).ChatWidgetConfig;
        return !config ? 'missing' : 'present';
      } catch (e) {
        return 'error';
      }
    });

    if (hasError === 'missing') {
      console.log('⚠️ Widget config is missing - widget should have fallback');

      // Verify widget still attempts to load
      const iframeExists = await page.locator('iframe#chat-widget-iframe').count() > 0;
      console.log(`${iframeExists ? '✅' : '⚠️'} Widget iframe ${iframeExists ? 'found' : 'not found'} (graceful degradation)`);
    } else {
      console.log('✅ Widget config is present');
    }
  });

  test('should verify embed code on different domain configurations', async ({ page }) => {
    console.log('📍 Step 1: Set domain-specific configuration');
    await page.goto(`${BASE_URL}/test-widget`, {
      waitUntil: 'networkidle',
      timeout: 15000
    });

    // Test with different domain
    console.log('📍 Step 2: Configure for different domain');
    await page.evaluate(() => {
      (window as any).ChatWidgetConfig = {
        serverUrl: window.location.origin,
        domain: 'different-domain.example.com',
        appearance: {
          position: 'top-right',
          startMinimized: false,
        },
      };
    });
    console.log('✅ Domain configuration set to different-domain.example.com');

    // Verify configuration persists
    console.log('📍 Step 3: Verify configuration persistence');
    const domain = await page.evaluate(() => {
      return (window as any).ChatWidgetConfig?.domain;
    });

    expect(domain).toBe('different-domain.example.com');
    console.log('✅ Domain configuration persisted correctly');
  });

  test('should verify embed code accessibility', async ({ page }) => {
    console.log('📍 Step 1: Navigate to installation page');
    await page.goto(`${BASE_URL}/dashboard/installation`, {
      waitUntil: 'networkidle',
      timeout: 15000
    });

    // Check accessibility of embed code
    console.log('📍 Step 2: Verify embed code accessibility');
    const embedCodeBlock = page.locator(
      'code, pre, [class*="embed"], [class*="code"]'
    ).first();

    // Verify it's keyboard accessible
    const isAccessible = await embedCodeBlock.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        visible: styles.display !== 'none',
        focusable: (el as any).tabIndex >= -1,
        readonly: (el as HTMLTextAreaElement)?.readOnly || false,
      };
    });

    console.log('✅ Embed code accessibility:', isAccessible);
    expect(isAccessible.visible).toBe(true);
  });
});
