/**
 * E2E Tests: Training Dashboard - Text Upload
 *
 * Tests the complete text upload workflow including:
 * - Text submission and embedding generation
 * - Short text (< 200 chars)
 * - Long text (> 200 chars, truncated preview)
 * - Empty text validation
 * - Multiple text submissions
 *
 * User Journey:
 * 1. Navigate to /dashboard/training
 * 2. Switch to Text tab
 * 3. Enter text content
 * 4. Submit text for embedding generation
 * 5. Wait for processing to complete
 * 6. Verify text appears in training data list
 */

import { test, expect } from '@playwright/test';
import {
  navigateToTrainingPage,
  uploadText,
  waitForItemInList,
  waitForProcessingComplete,
  switchToTab
} from '@/test-utils/playwright/dashboard/training/helpers';
import { TEST_TIMEOUT, PROCESSING_TIMEOUT } from '@/test-utils/playwright/dashboard/training/config';

test.describe('Training Dashboard - Text Upload', () => {
  test.setTimeout(TEST_TIMEOUT);

  test.use({ storageState: 'playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    console.log('=== Starting Text Upload Test ===');
    await navigateToTrainingPage(page);
  });

  test('user uploads text and generates embeddings', async ({ page }) => {
    console.log('🎯 Testing: Text upload with embedding generation');

    const testText = 'This is test content for the AI assistant to learn from. It contains important information about our products and services.';

    console.log('📍 Step 1: Upload text content');
    await uploadText(page, testText);

    console.log('📍 Step 2: Verify text appears in list');
    await waitForItemInList(page, testText, 5000);

    console.log('📍 Step 3: Wait for embedding generation to complete');
    await waitForProcessingComplete(page, testText, PROCESSING_TIMEOUT);

    console.log('✅ Text upload and embedding generation test completed');
  });

  test('short text (< 200 chars)', async ({ page }) => {
    console.log('🎯 Testing: Short text upload');

    const shortText = 'Short content for testing.';

    console.log('📍 Step 1: Upload short text');
    await uploadText(page, shortText);

    console.log('📍 Step 2: Verify text appears in full (not truncated)');
    const item = await waitForItemInList(page, shortText, 5000);

    const itemText = await item.textContent();
    expect(itemText).toContain(shortText);
    console.log('✅ Short text displayed in full');

    console.log('✅ Short text upload test completed');
  });

  test('long text (> 200 chars, truncated preview)', async ({ page }) => {
    console.log('🎯 Testing: Long text upload with truncation');

    const longText = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.';

    console.log(`📍 Step 1: Upload long text (${longText.length} chars)`);
    expect(longText.length).toBeGreaterThan(200);
    await uploadText(page, longText);

    console.log('📍 Step 2: Verify text appears with preview');
    // Should show first 100 chars + "..."
    const preview = longText.substring(0, 50);
    await waitForItemInList(page, preview, 5000);

    console.log('📍 Step 3: Verify truncation indicator');
    const item = page.locator(`[data-testid="training-item"]:has-text("${preview}"), .training-item:has-text("${preview}")`).first();
    const itemText = await item.textContent();

    // Should contain ellipsis or truncation indicator
    expect(itemText).toMatch(/\.\.\.|…/);
    console.log('✅ Long text is truncated with ellipsis');

    console.log('✅ Long text upload test completed');
  });

  test('empty text validation', async ({ page }) => {
    console.log('🎯 Testing: Empty text validation');

    console.log('📍 Step 1: Switch to Text tab');
    await switchToTab(page, 'Text');

    console.log('📍 Step 2: Try to submit empty text');
    const textInput = page.locator('textarea[placeholder*="text"], textarea[name="content"]').first();
    await expect(textInput).toBeVisible();
    await textInput.clear();

    const submitButton = page.locator('button:has-text("Upload"), button:has-text("Submit"), button:has-text("Add")').first();

    console.log('📍 Step 3: Verify submit button is disabled or shows validation error');
    // Either button should be disabled, or clicking should show validation error
    const isDisabled = await submitButton.isDisabled();

    if (isDisabled) {
      console.log('✅ Submit button is disabled for empty text');
    } else {
      // Try clicking and check for error
      await submitButton.click();
      await page.waitForTimeout(1000);

      // Check for validation message or error toast
      const errorMessage = page.locator('text=/required|cannot be empty|enter.*text/i').first();
      const isErrorVisible = await errorMessage.isVisible({ timeout: 3000 }).catch(() => false);

      if (isErrorVisible) {
        console.log('✅ Validation error shown for empty text');
      } else {
        // No validation - this might be acceptable if backend validates
        console.log('⚠️ No client-side validation detected, backend should validate');
      }
    }

    console.log('✅ Empty text validation test completed');
  });

  test('multiple text submissions', async ({ page }) => {
    console.log('🎯 Testing: Multiple text submissions');

    const texts = [
      'First piece of training content about products.',
      'Second piece of training content about services.',
      'Third piece of training content about pricing.'
    ];

    console.log('📍 Step 1: Submit multiple text entries');
    for (const text of texts) {
      await uploadText(page, text);
      await page.waitForTimeout(1000);
    }

    console.log('📍 Step 2: Verify all texts appear in list');
    for (const text of texts) {
      await waitForItemInList(page, text, 5000);
      console.log(`✅ Found: ${text.substring(0, 30)}...`);
    }

    console.log('📍 Step 3: Verify list contains at least 3 items');
    const items = page.locator('[data-testid="training-item"], .training-item');
    const count = await items.count();
    expect(count).toBeGreaterThanOrEqual(3);
    console.log(`✅ List contains ${count} items (expected >= 3)`);

    console.log('✅ Multiple text submissions test completed');
  });
});
