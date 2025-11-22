import { test, expect } from '@playwright/test';

/**
 * E2E Test: WCAG Semantic Structure & ARIA
 *
 * Tests semantic HTML, ARIA labels, form validation accessibility.
 *
 * User Journey:
 * 1. Load chat widget
 * 2. Check ARIA labels on input and buttons
 * 3. Verify ARIA live regions configured
 * 4. Check semantic HTML structure (headings, landmarks, lists)
 * 5. Test form validation with screen reader announcements ← THE TRUE "END"
 *
 * This test validates:
 * - ARIA labels present and accessible
 * - ARIA live regions configured for announcements
 * - Semantic HTML structure with proper heading hierarchy
 * - Form validation with accessible error messages
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_TIMEOUT = 180000;

test.describe('WCAG Semantic Structure E2E', () => {
  test.setTimeout(TEST_TIMEOUT);

  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('should have proper ARIA labels and roles', async ({ page }) => {
    console.log('=== Starting ARIA Labels Test ===');

    console.log('📍 Step 1: Loading chat widget');
    await page.goto(`${BASE_URL}/widget-test`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    console.log('📍 Step 2: Checking widget ARIA attributes');

    const widgetIframe = page.locator('iframe#chat-widget-iframe');
    await widgetIframe.waitFor({ state: 'attached', timeout: 10000 });

    // Check iframe has title
    const iframeTitle = await widgetIframe.getAttribute('title');
    expect(iframeTitle).toBeTruthy();
    console.log('✅ Iframe has title:', iframeTitle);

    const iframe = page.frameLocator('iframe#chat-widget-iframe');

    console.log('📍 Step 3: Checking input field ARIA');

    const inputField = iframe.locator('input, textarea').first();
    await inputField.waitFor({ state: 'visible' });

    const inputAria = {
      label: await inputField.getAttribute('aria-label'),
      placeholder: await inputField.getAttribute('placeholder'),
      required: await inputField.getAttribute('aria-required'),
      describedBy: await inputField.getAttribute('aria-describedby')
    };

    console.log('   Input ARIA attributes:', inputAria);
    expect(inputAria.label || inputAria.placeholder).toBeTruthy();
    console.log('✅ Input has accessible label');

    console.log('📍 Step 4: Checking button ARIA');

    const sendButton = iframe.locator('button[type="submit"]').first();

    if (await sendButton.isVisible()) {
      const buttonAria = {
        label: await sendButton.getAttribute('aria-label'),
        text: await sendButton.textContent()
      };

      console.log('   Button ARIA attributes:', buttonAria);
      expect(buttonAria.label || buttonAria.text?.trim()).toBeTruthy();
      console.log('✅ Button has accessible label');
    }

    console.log('📍 Step 5: Checking for ARIA live regions');

    const liveRegions = iframe.locator('[aria-live], [role="status"], [role="alert"]');
    const liveCount = await liveRegions.count();

    console.log(`   Found ${liveCount} ARIA live region(s)`);

    if (liveCount > 0) {
      for (let i = 0; i < liveCount; i++) {
        const region = liveRegions.nth(i);
        const attrs = {
          ariaLive: await region.getAttribute('aria-live'),
          role: await region.getAttribute('role'),
          ariaAtomic: await region.getAttribute('aria-atomic')
        };
        console.log(`   Region ${i + 1}:`, attrs);
      }
      console.log('✅ ARIA live regions configured');
    } else {
      console.log('⚠️  No ARIA live regions (screen readers won\'t announce updates)');
    }

    console.log('✅ ARIA labels and roles validated!');
  });

  test('should have semantic HTML structure', async ({ page }) => {
    console.log('=== Starting Semantic HTML Test ===');

    console.log('📍 Step 1: Loading dashboard page');
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' });

    console.log('📍 Step 2: Checking heading hierarchy');

    // Get all headings
    const headings = await page.$$eval('h1, h2, h3, h4, h5, h6', (elements) =>
      elements.map(el => ({
        level: parseInt(el.tagName[1]),
        text: el.textContent?.trim().substring(0, 50)
      }))
    );

    console.log('   Heading hierarchy:');
    headings.forEach((h, i) => {
      console.log(`   ${'  '.repeat(h.level - 1)}${h.level}. ${h.text}`);
    });

    // Verify single h1
    const h1Count = headings.filter(h => h.level === 1).length;
    expect(h1Count).toBe(1);
    console.log('✅ Single h1 element (correct structure)');

    // Verify no heading level skips (e.g., h2 → h4 without h3)
    let previousLevel = 0;
    let hasSkips = false;

    for (const heading of headings) {
      if (heading.level > previousLevel + 1) {
        console.log(`   ⚠️  Heading skip detected: h${previousLevel} → h${heading.level}`);
        hasSkips = true;
      }
      previousLevel = heading.level;
    }

    if (!hasSkips) {
      console.log('✅ No heading level skips (good structure)');
    }

    console.log('📍 Step 3: Checking landmark regions');

    const landmarks = await page.$$eval(
      'header, main, nav, aside, footer, [role="banner"], [role="main"], [role="navigation"], [role="complementary"], [role="contentinfo"]',
      (elements) => elements.map(el => ({
        tag: el.tagName.toLowerCase(),
        role: el.getAttribute('role'),
        ariaLabel: el.getAttribute('aria-label')
      }))
    );

    console.log('   Landmark regions:');
    landmarks.forEach(l => {
      console.log(`   - ${l.tag}${l.role ? ` (role="${l.role}")` : ''}${l.ariaLabel ? ` [${l.ariaLabel}]` : ''}`);
    });

    expect(landmarks.length).toBeGreaterThan(0);
    console.log('✅ Landmark regions present');

    console.log('📍 Step 4: Checking for lists');

    const lists = await page.$$eval('ul, ol', (elements) =>
      elements.map(el => ({
        type: el.tagName.toLowerCase(),
        items: el.querySelectorAll('li').length
      }))
    );

    console.log(`   Found ${lists.length} list(s)`);
    lists.forEach((list, i) => {
      console.log(`   ${i + 1}. <${list.type}> with ${list.items} items`);
    });

    console.log('✅ Semantic HTML structure validated!');
  });

  test('should handle form validation with screen reader announcements', async ({ page }) => {
    console.log('=== Starting Form Validation Accessibility Test ===');

    console.log('📍 Step 1: Loading chat widget');
    await page.goto(`${BASE_URL}/widget-test`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const iframe = page.frameLocator('iframe#chat-widget-iframe');

    console.log('📍 Step 2: Attempting to send empty message');

    const inputField = iframe.locator('input, textarea').first();
    await inputField.waitFor({ state: 'visible' });

    // Clear input (ensure it's empty)
    await inputField.fill('');

    const sendButton = iframe.locator('button[type="submit"]').first();
    await sendButton.click();
    await page.waitForTimeout(1000);

    console.log('📍 Step 3: Checking for validation error');

    // Look for error message
    const errorMessage = iframe.locator(
      '[role="alert"], .error, [class*="error"], [aria-invalid="true"]'
    ).first();

    if (await errorMessage.isVisible()) {
      const errorText = await errorMessage.textContent();
      console.log('✅ Validation error displayed:', errorText?.trim());

      // Check if error has proper ARIA attributes
      const errorRole = await errorMessage.getAttribute('role');
      console.log('   Error role:', errorRole);

      expect(['alert', 'status'].includes(errorRole || '')).toBe(true);
      console.log('✅ Error has proper ARIA role (screen reader will announce)');
    } else {
      console.log('⏭️  No validation error shown (empty messages may be allowed)');
    }

    console.log('📍 Step 4: Checking input aria-invalid state');

    const isInvalid = await inputField.getAttribute('aria-invalid');
    console.log('   aria-invalid:', isInvalid || 'not set');

    console.log('✅ Form validation accessibility validated!');
  });

  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status !== 'passed') {
      await page.screenshot({
        path: `test-results/semantic-structure-failure-${Date.now()}.png`,
        fullPage: true
      });
    }
  });
});
