/**
 * Accessibility Tests using axe-core
 *
 * Tests WCAG 2.1 AA compliance for critical pages and components.
 * See docs/04-TESTING/GUIDE_ACCESSIBILITY_TESTING.md for full guide.
 *
 * @requires @axe-core/playwright (install: npm install --save-dev @axe-core/playwright)
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Tests - WCAG 2.1 AA', () => {
  // Set consistent viewport
  test.use({ viewport: { width: 1280, height: 720 } });

  test('homepage should not have accessibility violations', async ({ page }) => {
    await page.goto('http://localhost:3000');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    logViolations('Homepage', accessibilityScanResults.violations);
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('chat widget should be accessible', async ({ page }) => {
    await page.goto('http://localhost:3000/widget-test');

    // Wait for widget to fully load
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('#chat-widget-iframe', { timeout: 10000 });

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    logViolations('Chat Widget', accessibilityScanResults.violations);
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('chat widget iframe content should be accessible', async ({ page }) => {
    await page.goto('http://localhost:3000/widget-test');
    await page.waitForSelector('#chat-widget-iframe');

    // Get iframe context
    const iframeElement = await page.frameLocator('#chat-widget-iframe');
    const iframePage = iframeElement.owner();

    if (iframePage) {
      const accessibilityScanResults = await new AxeBuilder({ page: iframePage })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      logViolations('Chat Widget Iframe', accessibilityScanResults.violations);
      expect(accessibilityScanResults.violations).toEqual([]);
    }
  });

  test('dashboard should be accessible', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    logViolations('Dashboard', accessibilityScanResults.violations);
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('settings page should be accessible', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard/settings');
    await page.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    logViolations('Settings Page', accessibilityScanResults.violations);
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test.describe('Color Contrast', () => {
    test('all text should meet contrast requirements', async ({ page }) => {
      await page.goto('http://localhost:3000');

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withRules(['color-contrast'])
        .analyze();

      logViolations('Color Contrast', accessibilityScanResults.violations);
      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('buttons should have sufficient contrast', async ({ page }) => {
      await page.goto('http://localhost:3000/widget-test');

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withRules(['color-contrast'])
        .include('button')
        .analyze();

      logViolations('Button Contrast', accessibilityScanResults.violations);
      expect(accessibilityScanResults.violations).toEqual([]);
    });
  });

  test.describe('Form Accessibility', () => {
    test('all form inputs should have labels', async ({ page }) => {
      await page.goto('http://localhost:3000/dashboard/settings');

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withRules(['label', 'label-title-only'])
        .analyze();

      logViolations('Form Labels', accessibilityScanResults.violations);
      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('form validation errors should be accessible', async ({ page }) => {
      await page.goto('http://localhost:3000/dashboard/settings');

      // Trigger validation errors
      const saveButton = page.locator('button:has-text("Save")').first();
      if (await saveButton.isVisible()) {
        await saveButton.click();
        await page.waitForTimeout(500);

        const accessibilityScanResults = await new AxeBuilder({ page })
          .withRules(['aria-valid-attr', 'aria-required-attr'])
          .analyze();

        logViolations('Form Errors', accessibilityScanResults.violations);
        expect(accessibilityScanResults.violations).toEqual([]);
      }
    });
  });

  test.describe('Semantic Structure', () => {
    test('headings should be properly nested', async ({ page }) => {
      await page.goto('http://localhost:3000/dashboard');

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withRules(['heading-order'])
        .analyze();

      logViolations('Heading Structure', accessibilityScanResults.violations);
      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('page should have landmark roles', async ({ page }) => {
      await page.goto('http://localhost:3000/dashboard');

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withRules(['region', 'landmark-one-main'])
        .analyze();

      logViolations('Landmark Roles', accessibilityScanResults.violations);
      expect(accessibilityScanResults.violations).toEqual([]);
    });
  });

  test.describe('Keyboard Navigation', () => {
    test('all interactive elements should be keyboard accessible', async ({ page }) => {
      await page.goto('http://localhost:3000/widget-test');

      // Check for keyboard traps and focusable elements
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withRules(['focusable-element', 'tabindex'])
        .analyze();

      logViolations('Keyboard Navigation', accessibilityScanResults.violations);
      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('focus indicators should be visible', async ({ page }) => {
      await page.goto('http://localhost:3000');

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withRules(['focus-order-semantics'])
        .analyze();

      logViolations('Focus Indicators', accessibilityScanResults.violations);
      expect(accessibilityScanResults.violations).toEqual([]);
    });
  });

  test.describe('Images and Media', () => {
    test('all images should have alt text', async ({ page }) => {
      await page.goto('http://localhost:3000');

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withRules(['image-alt', 'image-redundant-alt'])
        .analyze();

      logViolations('Image Alt Text', accessibilityScanResults.violations);
      expect(accessibilityScanResults.violations).toEqual([]);
    });
  });

  test.describe('ARIA', () => {
    test('ARIA attributes should be valid', async ({ page }) => {
      await page.goto('http://localhost:3000/dashboard');

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withRules([
          'aria-valid-attr',
          'aria-valid-attr-value',
          'aria-required-attr',
          'aria-roles',
        ])
        .analyze();

      logViolations('ARIA Attributes', accessibilityScanResults.violations);
      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('ARIA labels should be meaningful', async ({ page }) => {
      await page.goto('http://localhost:3000/dashboard');

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withRules(['aria-command-name', 'aria-input-field-name'])
        .analyze();

      logViolations('ARIA Labels', accessibilityScanResults.violations);
      expect(accessibilityScanResults.violations).toEqual([]);
    });
  });

  test.describe('Mobile Accessibility', () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test('mobile view should be accessible', async ({ page }) => {
      await page.goto('http://localhost:3000');

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      logViolations('Mobile View', accessibilityScanResults.violations);
      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('mobile chat widget should be accessible', async ({ page }) => {
      await page.goto('http://localhost:3000/widget-test');
      await page.waitForSelector('#chat-widget-iframe');

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      logViolations('Mobile Chat Widget', accessibilityScanResults.violations);
      expect(accessibilityScanResults.violations).toEqual([]);
    });
  });
});

/**
 * Helper function to log accessibility violations with detailed information
 */
function logViolations(context: string, violations: any[]) {
  if (violations.length === 0) {
    console.log(`✅ ${context}: No accessibility violations found`);
    return;
  }

  console.log(`\n❌ ${context}: ${violations.length} accessibility violation(s) found\n`);

  violations.forEach((violation, index) => {
    console.log(`${index + 1}. ${violation.id}`);
    console.log(`   Impact: ${violation.impact}`);
    console.log(`   Description: ${violation.description}`);
    console.log(`   Help: ${violation.help}`);
    console.log(`   Help URL: ${violation.helpUrl}`);
    console.log(`   Affected elements: ${violation.nodes.length}`);

    violation.nodes.forEach((node: any, nodeIndex: number) => {
      console.log(`\n   Element ${nodeIndex + 1}:`);
      console.log(`   HTML: ${node.html.substring(0, 100)}...`);
      console.log(`   Failure: ${node.failureSummary}`);

      if (node.target && node.target.length > 0) {
        console.log(`   Selector: ${node.target.join(' ')}`);
      }
    });
    console.log('\n');
  });
}
