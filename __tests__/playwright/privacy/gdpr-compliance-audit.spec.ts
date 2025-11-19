import { test, expect } from '@playwright/test';

/**
 * E2E Test: GDPR Compliance Audit
 *
 * Tests compliance audit workflows including:
 * - 30-day legal timeframe enforcement
 * - Comprehensive audit trail
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('GDPR Compliance Audit', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to privacy dashboard
    await page.goto('/dashboard/privacy');
    await page.getByRole('tab', { name: /GDPR Compliance/i }).click();
  });

  test('enforces 30-day legal timeframe for data requests', async ({ page }) => {
    console.log('📍 Step 1: Mock audit log with timeframe tracking');

    await page.route('**/api/gdpr/audit**', async (route) => {
      const entries = [
        {
          id: 'audit-1',
          domain: 'example.com',
          request_type: 'export',
          session_id: 'session-123',
          email: 'user@example.com',
          actor: 'user',
          status: 'pending',
          created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
          days_remaining: 28,
          message: 'Export request pending (28 days remaining)',
        },
        {
          id: 'audit-2',
          domain: 'example.com',
          request_type: 'delete',
          session_id: 'session-456',
          email: null,
          actor: 'user',
          status: 'overdue',
          created_at: new Date(Date.now() - 32 * 24 * 60 * 60 * 1000).toISOString(), // 32 days ago
          days_remaining: -2,
          message: 'Delete request overdue by 2 days',
        },
      ];

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ entries, count: entries.length }),
      });
    });

    console.log('📍 Step 2: View audit log');
    await page.waitForTimeout(500);

    console.log('📍 Step 3: Verify timeframe indicators present');
    await expect(page.getByText(/28 days remaining/i)).toBeVisible();
    await expect(page.getByText(/overdue by 2 days/i)).toBeVisible();

    console.log('📍 Step 4: Verify overdue request highlighted');
    const overdueRow = page.locator('tr:has-text("overdue by 2 days")');
    await expect(overdueRow).toHaveClass(/overdue|warning|error/);

    console.log('✅ 30-day legal timeframe tracking validated');
  });

  test('maintains comprehensive audit trail for compliance', async ({ page }) => {
    console.log('📍 Step 1: Mock detailed audit log');

    await page.route('**/api/gdpr/audit**', async (route) => {
      const entries = [
        {
          id: 'audit-1',
          domain: 'example.com',
          request_type: 'export',
          session_id: 'session-123',
          email: 'user@example.com',
          actor: 'dashboard',
          status: 'completed',
          created_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
          ip_address: '192.168.1.1',
          user_agent: 'Mozilla/5.0...',
          message: 'Export completed successfully',
        },
      ];

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ entries, count: entries.length }),
      });
    });

    console.log('📍 Step 2: View audit log');
    await page.waitForTimeout(500);

    console.log('📍 Step 3: Verify audit entry contains all required fields');
    await expect(page.getByText('example.com')).toBeVisible();
    await expect(page.getByText('session-123')).toBeVisible();
    await expect(page.getByText('user@example.com')).toBeVisible();
    await expect(page.getByText('dashboard')).toBeVisible();
    await expect(page.getByText('completed')).toBeVisible();

    console.log('📍 Step 4: Verify audit log is immutable (no edit buttons)');
    const editButton = page.getByRole('button', { name: /Edit|Modify|Delete/i });
    await expect(editButton).not.toBeVisible();

    console.log('✅ Comprehensive audit trail validated');
  });
});
