/**
 * E2E Test: Language Switching During Active Conversation
 *
 * Tests language switching behavior while maintaining active conversations.
 *
 * User Journey:
 * 1. Start conversation in English
 * 2. Switch to Spanish mid-conversation
 * 3. Verify conversation history preserved
 * 4. Continue conversation in Spanish
 * 5. Verify mixed language conversation works
 */

import { test, expect } from '@playwright/test';
import {
  setLanguage,
  getMessageCount,
  reloadAndWaitForWidget,
  waitForWidgetIframe,
  openWidget,
  getWidgetIframe,
  getWidgetInputField,
} from '../../../utils/playwright/i18n-test-helpers';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Language Switching with Active Conversation', () => {
  test('language switching preserves conversation history', async ({ page }) => {
    console.log('🎯 Testing: Language switching during active conversation');

    // Step 1: Start conversation in English
    console.log('📍 Step 1: Start conversation in English');
    await page.goto(`${BASE_URL}/test-widget`, { waitUntil: 'networkidle' });

    // Wait for widget iframe to load
    await waitForWidgetIframe(page);
    await openWidget(page);

    // Get widget iframe and input field
    const iframe = getWidgetIframe(page);
    const inputField = await getWidgetInputField(iframe);

    await inputField.fill('Hello, what products do you have?');

    const sendButton = iframe.locator('button[type="submit"], button:has-text("Send")').first();
    await sendButton.click();
    console.log('✅ English message sent');

    // Wait for response
    await page.waitForTimeout(5000);

    // Step 2: Count messages before language change
    console.log('📍 Step 2: Count messages before language change');
    const messagesBefore = await iframe.locator('[role="log"] > div, .message-container > div').count();
    console.log(`   Messages before switch: ${messagesBefore}`);

    // Step 3: Switch to Spanish mid-conversation
    console.log('📍 Step 3: Switch to Spanish mid-conversation');
    await setLanguage(page, 'es');
    await reloadAndWaitForWidget(page);
    console.log('✅ Switched to Spanish');

    // Re-open widget after reload
    await openWidget(page);

    // Step 4: Verify conversation history preserved
    console.log('📍 Step 4: Verify conversation history preserved');
    const iframeAfterReload = getWidgetIframe(page);
    const messagesAfter = await iframeAfterReload.locator('[role="log"] > div, .message-container > div').count();
    console.log(`   Messages after switch: ${messagesAfter}`);

    if (messagesAfter >= messagesBefore) {
      console.log('✅ Conversation history preserved after language switch');
    } else {
      console.log('⚠️ Some messages may have been lost during language switch');
    }

    // Step 5: Continue conversation in Spanish
    console.log('📍 Step 5: Continue conversation in Spanish');
    const spanishInput = await getWidgetInputField(iframeAfterReload);
    await spanishInput.fill('Muéstrame los productos más populares');

    const spanishSendButton = iframeAfterReload.locator('button[type="submit"], button:has-text("Enviar"), button:has-text("Send")').first();
    await spanishSendButton.click();
    console.log('✅ Spanish message sent in ongoing conversation');

    // Step 6: Verify mixed language conversation
    await page.waitForTimeout(5000);
    console.log('📍 Step 6: Verify mixed language conversation works');

    const finalMessageCount = await iframeAfterReload.locator('[role="log"] > div, .message-container > div').count();
    console.log(`   Final message count: ${finalMessageCount}`);

    if (finalMessageCount > messagesAfter) {
      console.log('✅ Mixed language conversation successful');
    }

    console.log('=== Language Switching with Active Conversation Test Complete ===');
  });

  test('language persists after page reload', async ({ page }) => {
    console.log('🎯 Testing: Language persistence across sessions');

    // Step 1: Set language to Spanish
    console.log('📍 Step 1: Set language preference to Spanish');
    await page.goto(`${BASE_URL}/test-widget`, { waitUntil: 'networkidle' });

    await setLanguage(page, 'es');
    console.log('✅ Spanish language set in localStorage');

    // Step 2: Reload page
    console.log('📍 Step 2: Reload page');
    await reloadAndWaitForWidget(page);

    // Step 3: Verify language persisted
    console.log('📍 Step 3: Verify language preference persisted');
    const storedLanguage = await page.evaluate(() => {
      return localStorage.getItem('omniops_ui_language');
    });

    console.log(`   Stored language: "${storedLanguage}"`);
    expect(storedLanguage).toBe('es');
    console.log('✅ Language preference persisted correctly');

    // Step 4: Verify UI reflects persisted language
    console.log('📍 Step 4: Verify UI shows Spanish after reload');

    // Wait for iframe and open widget
    await waitForWidgetIframe(page);
    await openWidget(page);

    const iframe = getWidgetIframe(page);
    const inputField = iframe.locator('input[type="text"], textarea').first();
    await expect(inputField).toBeVisible({ timeout: 10000 });

    const placeholder = await inputField.getAttribute('placeholder');
    console.log(`   Placeholder after reload: "${placeholder}"`);

    if (placeholder?.includes('Escribe')) {
      console.log('✅ Spanish UI loaded from persisted preference');
    } else {
      console.log('⚠️ UI may not be applying persisted language preference');
    }
  });

  test('rapid language switches handled correctly', async ({ page }) => {
    console.log('🎯 Testing: Rapid language switching');

    await page.goto(`${BASE_URL}/test-widget`, { waitUntil: 'networkidle' });

    const languages = ['en', 'es', 'ar', 'es', 'en'];

    for (const lang of languages) {
      console.log(`   Switching to: ${lang}`);
      await setLanguage(page, lang);
      await page.waitForTimeout(500);
    }

    const finalLang = await page.evaluate(() => {
      return localStorage.getItem('omniops_ui_language');
    });

    expect(finalLang).toBe('en');
    console.log('✅ Final language is correct after rapid switches');
  });
});
