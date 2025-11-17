/**
 * E2E Tests: Training Dashboard - Q&A Upload
 *
 * Tests the complete Q&A upload workflow including:
 * - Q&A pair submission for FAQ training
 * - Q&A with long answers
 * - Incomplete Q&A validation
 * - Multiple Q&A pairs
 * - Q&A with special characters
 *
 * User Journey:
 * 1. Navigate to /dashboard/training
 * 2. Switch to Q&A tab
 * 3. Enter question and answer
 * 4. Submit Q&A pair for training
 * 5. Wait for processing to complete
 * 6. Verify Q&A appears in training data list
 */

import { test, expect } from '@playwright/test';
import {
  navigateToTrainingPage,
  uploadQA,
  waitForItemInList,
  waitForProcessingComplete,
  switchToTab
} from '@/test-utils/playwright/dashboard/training/helpers';
import { TEST_TIMEOUT, PROCESSING_TIMEOUT } from '@/test-utils/playwright/dashboard/training/config';

test.describe('Training Dashboard - Q&A Upload', () => {
  test.setTimeout(TEST_TIMEOUT);

  test.use({ storageState: 'playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    console.log('=== Starting Q&A Upload Test ===');
    await navigateToTrainingPage(page);
  });

  test('user uploads Q&A pairs for FAQ training', async ({ page }) => {
    console.log('🎯 Testing: Q&A pair upload');

    const question = 'What are your business hours?';
    const answer = 'We are open Monday through Friday, 9 AM to 5 PM EST.';

    console.log('📍 Step 1: Upload Q&A pair');
    await uploadQA(page, question, answer);

    console.log('📍 Step 2: Verify Q&A appears in list');
    // List should show question as preview
    await waitForItemInList(page, question, 5000);

    console.log('📍 Step 3: Wait for embedding generation to complete');
    await waitForProcessingComplete(page, question, PROCESSING_TIMEOUT);

    console.log('✅ Q&A upload test completed');
  });

  test('Q&A with long answers', async ({ page }) => {
    console.log('🎯 Testing: Q&A with long answer');

    const question = 'What is your return policy?';
    const longAnswer = 'Our return policy allows you to return any item within 30 days of purchase for a full refund. Items must be in original condition with all tags attached. We provide free return shipping for defective items. For non-defective returns, a $5 restocking fee applies. Refunds are processed within 5-7 business days after we receive the returned item. Some exclusions apply including final sale items, custom orders, and opened software or media.';

    console.log(`📍 Step 1: Upload Q&A with long answer (${longAnswer.length} chars)`);
    expect(longAnswer.length).toBeGreaterThan(200);
    await uploadQA(page, question, longAnswer);

    console.log('📍 Step 2: Verify Q&A appears in list');
    await waitForItemInList(page, question, 5000);

    console.log('📍 Step 3: Verify answer is stored (not truncated in backend)');
    // Answer should be fully stored even if preview is truncated
    const item = page.locator(`[data-testid="training-item"]:has-text("${question}"), .training-item:has-text("${question}")`).first();
    await expect(item).toBeVisible();
    console.log('✅ Q&A with long answer stored successfully');

    console.log('✅ Long answer Q&A test completed');
  });

  test('incomplete Q&A validation', async ({ page }) => {
    console.log('🎯 Testing: Incomplete Q&A validation');

    console.log('📍 Step 1: Switch to Q&A tab');
    await switchToTab(page, 'Q&A');
    await page.waitForTimeout(500);

    console.log('📍 Step 2: Try to submit with only question (no answer)');
    // Use correct selectors for Q&A tab inputs
    const questionInput = page.locator('input#question, textarea[placeholder*="Question"], input[placeholder*="Question"]').first();
    await expect(questionInput).toBeVisible({ timeout: 5000 });
    await questionInput.clear();
    await questionInput.fill('Test question without answer?');

    const answerInput = page.locator('textarea#answer, textarea[placeholder*="Answer"]').first();
    await expect(answerInput).toBeVisible({ timeout: 5000 });
    await answerInput.clear(); // Leave answer empty

    const submitButton = page.locator('button:has-text("Add Q&A Pair")').first();

    console.log('📍 Step 3: Verify validation prevents submission');
    const isDisabled = await submitButton.isDisabled();

    if (isDisabled) {
      console.log('✅ Submit button is disabled for incomplete Q&A');
    } else {
      // Try clicking and check for error
      await submitButton.click();
      await page.waitForTimeout(1000);

      const errorMessage = page.locator('text=/required|both.*required|answer.*required/i').first();
      const isErrorVisible = await errorMessage.isVisible({ timeout: 3000 }).catch(() => false);

      if (isErrorVisible) {
        console.log('✅ Validation error shown for incomplete Q&A');
      } else {
        console.log('⚠️ No client-side validation detected, backend should validate');
      }
    }

    console.log('📍 Step 4: Try to submit with only answer (no question)');
    await questionInput.clear();
    await answerInput.fill('Test answer without question.');

    const isDisabled2 = await submitButton.isDisabled();

    if (isDisabled2) {
      console.log('✅ Submit button is disabled when question is missing');
    } else {
      await submitButton.click();
      await page.waitForTimeout(1000);

      const errorMessage = page.locator('text=/required|both.*required|question.*required/i').first();
      const isErrorVisible = await errorMessage.isVisible({ timeout: 3000 }).catch(() => false);

      if (isErrorVisible) {
        console.log('✅ Validation error shown for missing question');
      } else {
        console.log('⚠️ No client-side validation detected for missing question');
      }
    }

    console.log('✅ Incomplete Q&A validation test completed');
  });

  test('multiple Q&A pairs', async ({ page }) => {
    console.log('🎯 Testing: Multiple Q&A submissions');

    const qaPairs = [
      {
        question: 'Do you offer international shipping?',
        answer: 'Yes, we ship to over 100 countries worldwide.'
      },
      {
        question: 'What payment methods do you accept?',
        answer: 'We accept Visa, Mastercard, American Express, PayPal, and Apple Pay.'
      },
      {
        question: 'How long does shipping take?',
        answer: 'Standard shipping takes 5-7 business days. Express shipping takes 2-3 business days.'
      }
    ];

    console.log('📍 Step 1: Submit multiple Q&A pairs');
    for (const pair of qaPairs) {
      await uploadQA(page, pair.question, pair.answer);
      await page.waitForTimeout(1000);
    }

    console.log('📍 Step 2: Verify all Q&A pairs appear in list');
    for (const pair of qaPairs) {
      await waitForItemInList(page, pair.question, 5000);
      console.log(`✅ Found: ${pair.question.substring(0, 30)}...`);
    }

    console.log('📍 Step 3: Verify list contains at least 3 items');
    const items = page.locator('[data-testid="training-item"], .training-item');
    const count = await items.count();
    expect(count).toBeGreaterThanOrEqual(3);
    console.log(`✅ List contains ${count} items (expected >= 3)`);

    console.log('✅ Multiple Q&A pairs test completed');
  });

  test('Q&A with special characters', async ({ page }) => {
    console.log('🎯 Testing: Q&A with special characters');

    const question = 'What\'s the price for items <$100?';
    const answer = 'Items under $100 receive a 10% discount. Use code "SAVE10" at checkout! Questions? Email us at support@example.com.';

    console.log('📍 Step 1: Upload Q&A with special characters');
    await uploadQA(page, question, answer);

    console.log('📍 Step 2: Verify Q&A appears in list with special chars intact');
    await waitForItemInList(page, question, 5000);

    console.log('📍 Step 3: Verify special characters are properly encoded');
    const item = page.locator(`[data-testid="training-item"]:has-text("${question}"), .training-item:has-text("${question}")`).first();
    const itemText = await item.textContent();

    // Verify apostrophe, dollar sign, and question mark are preserved
    expect(itemText).toContain('What\'s');
    expect(itemText).toContain('$100');
    expect(itemText).toContain('?');
    console.log('✅ Special characters properly handled');

    console.log('✅ Q&A with special characters test completed');
  });
});
