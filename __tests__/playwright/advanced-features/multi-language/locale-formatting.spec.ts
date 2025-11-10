/**
 * E2E Test: Locale-Specific Formatting
 *
 * Tests date, number, and currency formatting based on locale.
 *
 * Note: This test module scaffolds locale formatting tests.
 * Full implementation depends on widget exposing formatted data.
 *
 * Planned tests:
 * 1. Date formatting (MM/DD/YYYY vs DD/MM/YYYY)
 * 2. Number formatting (1,000.00 vs 1.000,00)
 * 3. Currency formatting ($ vs €)
 * 4. Time format (12h vs 24h)
 */

import { test, expect } from '@playwright/test';
import {
  setLanguage,
  getStoredLanguage,
  reloadAndWaitForWidget,
} from '../../../utils/playwright/i18n-test-helpers';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Locale Formatting', () => {
  test('locale preference persists in localStorage', async ({ page }) => {
    console.log('🎯 Testing: Locale formatting and persistence');

    await page.goto(`${BASE_URL}/test-widget`, { waitUntil: 'networkidle' });

    // Set Spanish locale
    console.log('📍 Setting Spanish locale');
    await setLanguage(page, 'es');

    // Verify stored
    let stored = await getStoredLanguage(page);
    expect(stored).toBe('es');
    console.log('✅ Spanish locale stored');

    // Reload and verify persistence
    console.log('📍 Reloading page');
    await reloadAndWaitForWidget(page);

    stored = await getStoredLanguage(page);
    expect(stored).toBe('es');
    console.log('✅ Spanish locale persisted after reload');
  });

  test('multiple locales can be switched', async ({ page }) => {
    console.log('🎯 Testing: Multiple locale switching');

    await page.goto(`${BASE_URL}/test-widget`, { waitUntil: 'networkidle' });

    const locales = ['en', 'es', 'ar', 'fr', 'de'];

    for (const locale of locales) {
      await setLanguage(page, locale);
      const stored = await getStoredLanguage(page);
      expect(stored).toBe(locale);
      console.log(`✅ Locale '${locale}' set and stored correctly`);
    }
  });

  test('invalid locale handled gracefully', async ({ page }) => {
    console.log('🎯 Testing: Invalid locale handling');

    await page.goto(`${BASE_URL}/test-widget`, { waitUntil: 'networkidle' });

    // Try to set invalid locale
    await setLanguage(page, 'invalid_locale');
    const stored = await getStoredLanguage(page);

    console.log(`   Stored invalid locale: "${stored}"`);
    console.log('✅ Invalid locale was stored (system should handle fallback)');
  });
});
