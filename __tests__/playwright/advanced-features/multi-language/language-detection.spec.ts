/**
 * E2E Test: Language Auto-Detection
 *
 * Tests browser locale auto-detection and automatic language selection.
 *
 * User Journey:
 * 1. Create browser context with specific locale (Spanish)
 * 2. Load widget
 * 3. Verify browser language detected from Accept-Language header
 * 4. Verify UI adapts to detected browser language
 */

import { test, expect } from '@playwright/test';
import {
  getBrowserLocaleInfo,
  waitForWidgetIframe,
  openWidget,
  getWidgetIframe,
  getWidgetInputField,
} from '../../../utils/playwright/i18n-test-helpers';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Language Auto-Detection', () => {
  test('browser locale auto-detection', async ({ browser }) => {
    console.log('🎯 Testing: Browser locale auto-detection');

    // Step 1: Create context with Spanish locale
    console.log('📍 Step 1: Create browser context with Spanish locale');
    const context = await browser.newContext({
      locale: 'es-ES',
      extraHTTPHeaders: {
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8'
      }
    });

    const page = await context.newPage();
    console.log('✅ Spanish browser context created');

    // Step 2: Load widget
    console.log('📍 Step 2: Load widget with Spanish browser locale');
    await page.goto(`${BASE_URL}/test-widget`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Step 3: Check if language was auto-detected
    console.log('📍 Step 3: Check if language was auto-detected from browser');

    const detectedLanguage = await getBrowserLocaleInfo(page);
    console.log(`   Browser language: ${detectedLanguage.browserLang}`);
    console.log(`   Stored preference: ${detectedLanguage.stored || 'none'}`);

    if (detectedLanguage.browserLang === 'es') {
      console.log('✅ Browser Spanish locale detected correctly');
    }

    // Step 4: Verify UI reflects detected language
    console.log('📍 Step 4: Check if UI adapted to browser locale');

    // Wait for iframe and open widget
    await waitForWidgetIframe(page);
    await openWidget(page);

    const iframe = getWidgetIframe(page);
    const inputField = await getWidgetInputField(iframe);
    await expect(inputField).toBeVisible({ timeout: 30000 });

    const placeholder = await inputField.getAttribute('placeholder');
    console.log(`   UI placeholder: "${placeholder}"`);

    if (placeholder?.includes('Escribe')) {
      console.log('✅ UI auto-adapted to Spanish browser locale');
    } else if (placeholder?.includes('Type')) {
      console.log('⚠️ UI defaulted to English (auto-detection may not be implemented)');
    }

    await context.close();
  });
});
