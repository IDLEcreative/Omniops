/**
 * E2E Tests: Training Dashboard - Delete Data
 *
 * Tests the complete data deletion workflow including:
 * - Delete items with persistence verification
 * - Delete multiple items sequentially
 * - Delete items while processing
 * - List integrity after deletion
 * - Empty state when all items deleted
 *
 * User Journey:
 * 1. Navigate to /dashboard/training
 * 2. Create test data items
 * 3. Delete items one by one
 * 4. Verify items are removed from list
 * 5. Reload page to verify deletion persists
 * 6. Verify empty state when no items remain
 */

import { test, expect } from '@playwright/test';
import {
  navigateToTrainingPage,
  uploadText,
  waitForItemInList,
  deleteItem,
  verifyItemNotInList,
  getTrainingItemCount,
  verifyEmptyState,
  reloadAndWaitForList
} from '@/test-utils/playwright/dashboard/training/helpers';
import { TEST_TIMEOUT } from '@/test-utils/playwright/dashboard/training/config';

test.describe('Training Dashboard - Delete Data', () => {
  test.setTimeout(TEST_TIMEOUT);

  test.use({ storageState: 'playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    console.log('=== Starting Delete Data Test ===');
    await navigateToTrainingPage(page);
  });

  test('delete items with persistence verification', async ({ page }) => {
    console.log('🎯 Testing: Delete with persistence');

    const testText = 'Test item for deletion persistence - ' + Date.now();

    console.log('📍 Step 1: Create test item');
    await uploadText(page, testText);
    await waitForItemInList(page, testText, 5000);

    console.log('📍 Step 2: Delete the item');
    await deleteItem(page, testText);

    console.log('📍 Step 3: Verify item is removed from list');
    await verifyItemNotInList(page, testText);

    console.log('📍 Step 4: Reload page to verify deletion persists');
    await reloadAndWaitForList(page);

    console.log('📍 Step 5: Confirm item is still not in list after reload');
    await verifyItemNotInList(page, testText);
    console.log('✅ Deletion persisted across page reload');

    console.log('✅ Delete persistence test completed');
  });

  test('delete multiple items sequentially', async ({ page }) => {
    console.log('🎯 Testing: Delete multiple items');

    const items = [
      'Delete test item 1 - ' + Date.now(),
      'Delete test item 2 - ' + Date.now(),
      'Delete test item 3 - ' + Date.now()
    ];

    console.log('📍 Step 1: Create multiple test items');
    for (const item of items) {
      await uploadText(page, item);
      await page.waitForTimeout(500);
    }

    console.log('📍 Step 2: Verify all items appear');
    for (const item of items) {
      await waitForItemInList(page, item, 5000);
    }

    const initialCount = await getTrainingItemCount(page);
    console.log(`📊 Initial count: ${initialCount} items`);

    console.log('📍 Step 3: Delete items one by one');
    for (const item of items) {
      await deleteItem(page, item);
      await page.waitForTimeout(500);
    }

    console.log('📍 Step 4: Verify all items are deleted');
    for (const item of items) {
      await verifyItemNotInList(page, item);
    }

    const finalCount = await getTrainingItemCount(page);
    console.log(`📊 Final count: ${finalCount} items`);
    expect(finalCount).toBeLessThan(initialCount);
    console.log('✅ All items successfully deleted');

    console.log('✅ Multiple deletions test completed');
  });

  test('delete items while processing', async ({ page }) => {
    console.log('🎯 Testing: Delete during processing');

    const testText = 'Processing item to delete - ' + Date.now();

    console.log('📍 Step 1: Create item that will be processing');
    await uploadText(page, testText);
    await waitForItemInList(page, testText, 5000);

    console.log('📍 Step 2: Delete item immediately (may still be processing)');
    // Don't wait for processing to complete, delete right away
    await page.waitForTimeout(1000);
    await deleteItem(page, testText);

    console.log('📍 Step 3: Verify item is removed from list');
    await verifyItemNotInList(page, testText);

    console.log('📍 Step 4: Verify no orphaned data after reload');
    await reloadAndWaitForList(page);
    await verifyItemNotInList(page, testText);
    console.log('✅ Item deleted successfully even during processing');

    console.log('✅ Delete during processing test completed');
  });

  test('list integrity after deletion', async ({ page }) => {
    console.log('🎯 Testing: List integrity after deletion');

    const keepItems = [
      'Keep item 1 - ' + Date.now(),
      'Keep item 2 - ' + Date.now()
    ];
    const deleteItem = 'Delete this item - ' + Date.now();

    console.log('📍 Step 1: Create items to keep and one to delete');
    for (const item of keepItems) {
      await uploadText(page, item);
      await page.waitForTimeout(500);
    }
    await uploadText(page, deleteItem);
    await page.waitForTimeout(500);

    console.log('📍 Step 2: Verify all items appear');
    for (const item of keepItems) {
      await waitForItemInList(page, item, 5000);
    }
    await waitForItemInList(page, deleteItem, 5000);

    const beforeCount = await getTrainingItemCount(page);
    console.log(`📊 Before deletion: ${beforeCount} items`);

    console.log('📍 Step 3: Delete one item');
    await deleteItem(page, deleteItem);

    console.log('📍 Step 4: Verify deleted item is gone');
    await verifyItemNotInList(page, deleteItem);

    console.log('📍 Step 5: Verify other items remain intact');
    for (const item of keepItems) {
      await waitForItemInList(page, item, 5000);
      console.log(`✅ Kept: ${item.substring(0, 30)}...`);
    }

    const afterCount = await getTrainingItemCount(page);
    console.log(`📊 After deletion: ${afterCount} items`);
    expect(afterCount).toBe(beforeCount - 1);
    console.log('✅ List integrity maintained');

    console.log('✅ List integrity test completed');
  });

  test('empty state when all items deleted', async ({ page }) => {
    console.log('🎯 Testing: Empty state after deleting all items');

    console.log('📍 Step 1: Check if any items exist');
    let itemCount = await getTrainingItemCount(page);
    console.log(`📊 Current item count: ${itemCount}`);

    if (itemCount === 0) {
      console.log('📍 Step 2: Create some test items to delete');
      const testItems = [
        'Temp item 1 - ' + Date.now(),
        'Temp item 2 - ' + Date.now()
      ];

      for (const item of testItems) {
        await uploadText(page, item);
        await page.waitForTimeout(500);
      }

      itemCount = await getTrainingItemCount(page);
      console.log(`📊 Created ${itemCount} test items`);
    }

    console.log('📍 Step 3: Delete all items');
    const items = page.locator('[data-testid="training-item"], .training-item');
    const count = await items.count();

    for (let i = 0; i < count; i++) {
      // Always delete the first item (since list updates after each deletion)
      const firstItem = items.first();
      const itemText = await firstItem.textContent();
      const preview = itemText?.substring(0, 50) || 'item';

      console.log(`Deleting item ${i + 1}/${count}: ${preview}...`);

      const deleteButton = firstItem.locator('button[aria-label*="delete"], button:has-text("Delete"), button[data-action="delete"]').first();
      await deleteButton.click();

      const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Yes"), button:has-text("Delete")').last();
      if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await confirmButton.click();
      }

      await page.waitForTimeout(1000);
    }

    console.log('📍 Step 4: Verify empty state is displayed');
    await verifyEmptyState(page);

    console.log('📍 Step 5: Verify item count is 0');
    const finalCount = await getTrainingItemCount(page);
    expect(finalCount).toBe(0);
    console.log('✅ All items deleted, empty state displayed');

    console.log('✅ Empty state test completed');
  });

  test('delete confirmation dialog', async ({ page }) => {
    console.log('🎯 Testing: Delete confirmation dialog');

    const testText = 'Item for confirmation test - ' + Date.now();

    console.log('📍 Step 1: Create test item');
    await uploadText(page, testText);
    await waitForItemInList(page, testText, 5000);

    console.log('📍 Step 2: Click delete button');
    const item = page.locator(`[data-testid="training-item"]:has-text("${testText}"), .training-item:has-text("${testText}")`).first();
    const deleteButton = item.locator('button[aria-label*="delete"], button:has-text("Delete"), button[data-action="delete"]').first();
    await deleteButton.click();

    console.log('📍 Step 3: Check if confirmation dialog appears');
    const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Yes"), dialog button:has-text("Delete")').last();
    const cancelButton = page.locator('button:has-text("Cancel"), button:has-text("No")').last();

    const hasConfirmDialog = await confirmButton.isVisible({ timeout: 2000 }).catch(() => false);

    if (hasConfirmDialog) {
      console.log('✅ Confirmation dialog appeared');

      console.log('📍 Step 4: Click cancel');
      if (await cancelButton.isVisible().catch(() => false)) {
        await cancelButton.click();
        await page.waitForTimeout(1000);

        console.log('📍 Step 5: Verify item is still in list');
        await waitForItemInList(page, testText, 5000);
        console.log('✅ Item still present after cancel');

        console.log('📍 Step 6: Delete again and confirm');
        await deleteButton.click();
        await confirmButton.click();
      } else {
        await confirmButton.click();
      }
    } else {
      console.log('⚠️ No confirmation dialog - deletion is immediate');
    }

    console.log('📍 Step 7: Verify item is deleted');
    await verifyItemNotInList(page, testText);
    console.log('✅ Item successfully deleted');

    console.log('✅ Delete confirmation test completed');
  });
});
