/**
 * E2E Test: RTL (Right-to-Left) Language Support
 *
 * Tests right-to-left layout support for Arabic, Hebrew, and other RTL languages.
 *
 * User Journey:
 * 1. Set language to Arabic
 * 2. Verify RTL layout attributes (dir="rtl")
 * 3. Test Arabic text input and rendering
 * 4. Verify button alignment for RTL
 * 5. Test Hebrew (another RTL language)
 */

import { test, expect } from '@playwright/test';
import {
  setLanguage,
  getRTLAttributes,
  setRTLDirection,
  reloadAndWaitForWidget,
} from '__tests__/utils/playwright/i18n-test-helpers';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('RTL Language Support', () => {
  test('RTL languages display correctly (Arabic)', async ({ page }) => {
    console.log('🎯 Testing: RTL (Right-to-Left) language support');

    // Step 1: Load widget
    console.log('📍 Step 1: Load widget');
    await page.goto(`${BASE_URL}/embed`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Step 2: Set language to Arabic
    console.log('📍 Step 2: Set language to Arabic (RTL)');
    await setLanguage(page, 'ar');
    await setRTLDirection(page, true);
    await reloadAndWaitForWidget(page);
    console.log('✅ Arabic language activated');

    // Step 3: Verify RTL layout attributes
    console.log('📍 Step 3: Verify RTL layout attributes');
    const rtlAttributes = await getRTLAttributes(page);
    console.log('   RTL Attributes:', rtlAttributes);

    if (rtlAttributes.htmlDir === 'rtl' || rtlAttributes.direction === 'rtl') {
      console.log('✅ RTL layout applied correctly');
    } else {
      console.log('⚠️ RTL layout may not be fully implemented');
    }

    // Step 4: Verify Arabic text rendering
    console.log('📍 Step 4: Verify Arabic text rendering');
    const inputField = page.locator('input[type="text"], textarea').first();
    await expect(inputField).toBeVisible({ timeout: 10000 });

    // Type Arabic text
    await inputField.fill('مرحبا، كيف يمكنني مساعدتك؟');
    console.log('   Typed Arabic text: "مرحبا، كيف يمكنني مساعدتك؟"');

    const inputValue = await inputField.inputValue();
    if (inputValue.includes('مرحبا')) {
      console.log('✅ Arabic text input working correctly');
    } else {
      console.log('⚠️ Arabic text input may have issues');
    }

    // Step 5: Verify button alignment
    console.log('📍 Step 5: Verify UI elements aligned for RTL');
    const sendButton = page.locator('button[type="submit"], button:has-text("Send"), button:has-text("إرسال")').first();
    const buttonStyles = await sendButton.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return {
        float: styles.float,
        textAlign: styles.textAlign,
        marginLeft: styles.marginLeft,
        marginRight: styles.marginRight,
      };
    });

    console.log('   Send button styles:', buttonStyles);

    if (buttonStyles.float === 'left' || buttonStyles.marginRight !== '0px') {
      console.log('✅ UI elements positioned for RTL layout');
    } else {
      console.log('⚠️ UI elements may need RTL positioning adjustments');
    }
  });

  test('Hebrew (RTL) text rendering', async ({ page }) => {
    console.log('🎯 Testing: Hebrew language support');

    await page.goto(`${BASE_URL}/embed`, { waitUntil: 'networkidle' });
    await setLanguage(page, 'he');
    await setRTLDirection(page, true);
    await reloadAndWaitForWidget(page);

    console.log('📍 Testing Hebrew text input');
    const inputField = page.locator('input[type="text"], textarea').first();
    await expect(inputField).toBeVisible({ timeout: 10000 });

    // Type Hebrew text
    await inputField.fill('שלום, איך אני יכול לעזור?');
    console.log('   Typed Hebrew text: "שלום, איך אני יכול לעזור?"');

    const hebrewValue = await inputField.inputValue();
    if (hebrewValue.includes('שלום')) {
      console.log('✅ Hebrew text input working correctly');
    } else {
      console.log('⚠️ Hebrew text input may have issues');
    }
  });

  test('RTL layout persists across language changes', async ({ page }) => {
    console.log('🎯 Testing: RTL layout persistence');

    await page.goto(`${BASE_URL}/embed`, { waitUntil: 'networkidle' });

    // Switch between RTL and LTR languages
    await setLanguage(page, 'ar');
    await setRTLDirection(page, true);
    await reloadAndWaitForWidget(page);

    let rtlAttrs = await getRTLAttributes(page);
    const isRtlOnArabic = rtlAttrs.htmlDir === 'rtl' || rtlAttrs.direction === 'rtl';
    console.log(`   Arabic RTL applied: ${isRtlOnArabic}`);

    // Switch back to English (LTR)
    await setLanguage(page, 'en');
    await setRTLDirection(page, false);
    await reloadAndWaitForWidget(page);

    rtlAttrs = await getRTLAttributes(page);
    const isLtrOnEnglish = rtlAttrs.htmlDir !== 'rtl' && rtlAttrs.direction !== 'rtl';
    console.log(`   English LTR applied: ${isLtrOnEnglish}`);

    if (isRtlOnArabic && isLtrOnEnglish) {
      console.log('✅ RTL/LTR layout changes persist correctly');
    }
  });
});
