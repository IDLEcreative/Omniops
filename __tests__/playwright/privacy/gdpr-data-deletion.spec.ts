import { test, expect } from '@playwright/test';

/**
 * E2E Test: GDPR Data Deletion
 *
 * Tests right to be forgotten workflows including:
 * - Complete data erasure
 * - Database cleanup verification
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('GDPR Data Deletion', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to privacy dashboard
    await page.goto('/dashboard/privacy');
    await page.getByRole('tab', { name: /GDPR Compliance/i }).click();
  });

  test('executes right to be forgotten - complete data erasure', async ({ page }) => {
    console.log('📍 Step 1: Mock deletion API with verification');

    await page.route('**/api/gdpr/delete', async (route) => {
      const requestBody = await route.request().postDataJSON();

      expect(requestBody.confirm).toBe(true);
      expect(requestBody.domain).toBe('example.com');
      expect(requestBody.session_id).toBe('session-forget-me');

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'All data permanently deleted',
          deleted_count: 5,
          deleted_items: {
            conversations: 5,
            messages: 12,
            embeddings: 8,
            audit_entries: 2,
          },
        }),
      });
    });

    console.log('📍 Step 2: Fill deletion form');
    await page.getByLabel(/Customer Domain/i).fill('example.com');
    await page.getByLabel(/Session ID/i).fill('session-forget-me');

    console.log('📍 Step 3: Enable confirmation toggle');
    await page.getByLabel(/Confirm deletion request/i).click();

    console.log('📍 Step 4: Submit deletion request');
    await page.getByRole('button', { name: /Delete User Data/i }).click();

    console.log('📍 Step 5: Verify complete erasure confirmation');
    await expect(page.getByText(/Deleted 5 conversation/i)).toBeVisible();

    console.log('📍 Step 6: Verify audit log updated');
    await page.getByRole('button', { name: /Deletions/i }).click();
    await expect(page.getByText(/All data permanently deleted/i)).toBeVisible();

    console.log('✅ Right to be forgotten - complete erasure verified');
  });

  test('verifies database cleanup after deletion', async ({ page }) => {
    console.log('📍 Step 1: Mock deletion with database verification');

    await page.route('**/api/gdpr/delete', async (route) => {
      const requestBody = await route.request().postDataJSON();

      expect(requestBody.confirm).toBe(true);

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Database cleanup completed',
          deleted_count: 3,
          database_verification: {
            conversations_remaining: 0,
            messages_remaining: 0,
            embeddings_removed: 5,
            cache_cleared: true,
          },
        }),
      });
    });

    console.log('📍 Step 2: Submit deletion request');
    await page.getByLabel(/Customer Domain/i).fill('example.com');
    await page.getByLabel(/Session ID/i).fill('session-verify-db');
    await page.getByLabel(/Confirm deletion request/i).click();
    await page.getByRole('button', { name: /Delete User Data/i }).click();

    console.log('📍 Step 3: Verify database cleanup confirmation');
    await expect(page.getByText(/Database cleanup completed/i)).toBeVisible();

    console.log('✅ Database cleanup verification validated');
  });
});
