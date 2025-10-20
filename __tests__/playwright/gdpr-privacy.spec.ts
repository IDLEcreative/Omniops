import { test, expect } from '@playwright/test';

test.describe('GDPR Privacy Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/gdpr/audit**', async (route) => {
      const url = new URL(route.request().url());
      const type = url.searchParams.get('request_type');
      const entries = [
        {
          id: 'audit-1',
          domain: 'acme.com',
          request_type: type ?? 'export',
          session_id: 'session-123',
          email: 'user@acme.com',
          actor: 'dashboard',
          status: 'completed',
          deleted_count: type === 'delete' ? 2 : null,
          message: type === 'delete' ? 'Deleted 2 conversations.' : 'Export generated.',
          created_at: new Date().toISOString(),
        },
      ];

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ entries, count: entries.length }),
      });
    });

    await page.goto('/dashboard/privacy');
    await page.getByRole('tab', { name: /GDPR Compliance/i }).click();
  });

  test('exports user data by session ID with download', async ({ page }) => {
    await page.route('**/api/gdpr/export', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: {
          'Content-Disposition': 'attachment; filename="chat-export-1234567890.json"',
        },
        body: JSON.stringify({
          export_date: '2025-10-20T12:00:00.000Z',
          domain: 'acme.com',
          user_identifier: 'session-abc-123',
          conversations: [
            {
              id: 'conv-1',
              created_at: '2025-10-20T10:00:00Z',
              messages: [
                { role: 'user', content: 'Hello', created_at: '2025-10-20T10:00:01Z' },
                { role: 'assistant', content: 'Hi!', created_at: '2025-10-20T10:00:02Z' },
              ],
            },
          ],
          metadata: {
            total_conversations: 1,
            total_messages: 2,
          },
        }),
      });
    });

    const downloadPromise = page.waitForEvent('download');

    await page.getByLabel(/Customer Domain/i).fill('acme.com');
    await page.getByLabel(/Session ID/i).fill('session-abc-123');

    await page.getByRole('button', { name: /Export User Data/i }).click();

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/chat-export-\d+\.json/);

    await expect(page.getByText(/Export started\. A JSON file will download shortly\./i)).toBeVisible();
    await expect(page.getByText(/Export generated\./i)).toBeVisible();
    await page.getByRole('button', { name: /exports/i }).click();
    await expect(page.getByText(/Export generated\./i)).toBeVisible();
  });

  test('exports user data by email', async ({ page }) => {
    await page.route('**/api/gdpr/export', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: {
          'Content-Disposition': 'attachment; filename="chat-export-1234567890.json"',
        },
        body: JSON.stringify({
          export_date: '2025-10-20T12:00:00.000Z',
          domain: 'acme.com',
          user_identifier: 'user@acme.com',
          conversations: [],
          metadata: {
            total_conversations: 0,
            total_messages: 0,
          },
        }),
      });
    });

    const downloadPromise = page.waitForEvent('download');

    await page.getByLabel(/Customer Domain/i).fill('acme.com');
    await page.getByLabel(/Email Address/i).fill('user@acme.com');

    await page.getByRole('button', { name: /Export User Data/i }).click();

    await downloadPromise;
    await expect(page.getByText(/Export started/i)).toBeVisible();
    await page.getByRole('button', { name: /exports/i }).click();
    await expect(page.getByText(/Export generated\./i)).toBeVisible();
  });

  test('shows validation error when exporting without identifiers', async ({ page }) => {
    await page.getByLabel(/Customer Domain/i).fill('acme.com');
    // Don't fill session ID or email

    await page.getByRole('button', { name: /Export User Data/i }).click();

    // Hook should show inline validation error
    await expect(page.getByText(/Domain and either session ID or email are required/i)).toBeVisible();
  });

  test('shows API error when export fails', async ({ page }) => {
    await page.route('**/api/gdpr/export', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Failed to export data',
        }),
      });
    });

    await page.getByLabel(/Customer Domain/i).fill('acme.com');
    await page.getByLabel(/Session ID/i).fill('session-123');

    await page.getByRole('button', { name: /Export User Data/i }).click();

    await expect(page.getByText(/Failed to export data/i)).toBeVisible();
  });

  test('deletes user data with confirmation toggle', async ({ page }) => {
    await page.route('**/api/gdpr/delete', async (route) => {
      const requestBody = await route.request().postDataJSON();

      // Verify confirmation was sent
      expect(requestBody.confirm).toBe(true);
      expect(requestBody.domain).toBe('acme.com');
      expect(requestBody.session_id).toBe('session-xyz-789');

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Data successfully deleted',
          deleted_count: 3,
        }),
      });
    });

    await page.getByLabel(/Customer Domain/i).fill('acme.com');
    await page.getByLabel(/Session ID/i).fill('session-xyz-789');

    // Toggle confirmation switch ON
    await page.getByLabel(/Confirm deletion request/i).click();

    await page.getByRole('button', { name: /Delete User Data/i }).click();

    // Verify success message
    await expect(page.getByText(/Deleted 3 conversations for the requested user\./i)).toBeVisible();
    await page.getByRole('button', { name: /Deletions/i }).click();
    await expect(page.getByText(/Deleted 2 conversations\./i)).toBeVisible();

    // Verify deleted count displayed at bottom
    await expect(page.getByText(/Last deletion removed 3 conversation/i)).toBeVisible();
  });

  test('deletes user data by email with confirmation', async ({ page }) => {
    await page.route('**/api/gdpr/delete', async (route) => {
      const requestBody = await route.request().postDataJSON();

      expect(requestBody.confirm).toBe(true);
      expect(requestBody.email).toBe('user@acme.com');

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Data successfully deleted',
          deleted_count: 1,
        }),
      });
    });

    await page.getByLabel(/Customer Domain/i).fill('acme.com');
    await page.getByLabel(/Email Address/i).fill('user@acme.com');

    await page.getByLabel(/Confirm deletion request/i).click();

    await page.getByRole('button', { name: /Delete User Data/i }).click();

    await expect(page.getByText(/Deleted 1 conversation for the requested user\./i)).toBeVisible();
    await page.getByRole('button', { name: /Deletions/i }).click();
    await expect(page.getByText(/Deleted 2 conversations\./i)).toBeVisible();
  });

  test('shows message when no data found to delete', async ({ page }) => {
    await page.route('**/api/gdpr/delete', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'No data found to delete',
          deleted_count: 0,
        }),
      });
    });

    await page.getByLabel(/Customer Domain/i).fill('acme.com');
    await page.getByLabel(/Session ID/i).fill('nonexistent-session');

    await page.getByLabel(/Confirm deletion request/i).click();

    await page.getByRole('button', { name: /Delete User Data/i }).click();

    await expect(page.getByText(/No conversations matched the deletion request\./i)).toBeVisible();
  });

  test('prevents deletion without confirmation', async ({ page }) => {
    await page.getByLabel(/Customer Domain/i).fill('acme.com');
    await page.getByLabel(/Session ID/i).fill('session-123');

    // Do NOT toggle confirmation - it should default to OFF

    await page.getByRole('button', { name: /Delete User Data/i }).click();

    // Hook validation should prevent API call and show error
    await expect(page.getByText(/Please confirm the deletion request\./i)).toBeVisible();
  });

  test('shows API error when deletion fails', async ({ page }) => {
    await page.route('**/api/gdpr/delete', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Failed to delete data',
        }),
      });
    });

    await page.getByLabel(/Customer Domain/i).fill('acme.com');
    await page.getByLabel(/Session ID/i).fill('session-123');
    await page.getByLabel(/Confirm deletion request/i).click();

    await page.getByRole('button', { name: /Delete User Data/i }).click();

    await expect(page.getByText(/Failed to delete data/i)).toBeVisible();
  });

  test('shows loading state during export', async ({ page }) => {
    await page.route('**/api/gdpr/export', async (route) => {
      // Delay response to see loading state
      await new Promise(resolve => setTimeout(resolve, 500));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: {
          'Content-Disposition': 'attachment; filename="export.json"',
        },
        body: JSON.stringify({
          export_date: '2025-10-20T12:00:00.000Z',
          domain: 'acme.com',
          user_identifier: 'session-123',
          conversations: [],
          metadata: { total_conversations: 0, total_messages: 0 },
        }),
      });
    });

    const downloadPromise = page.waitForEvent('download');

    await page.getByLabel(/Customer Domain/i).fill('acme.com');
    await page.getByLabel(/Session ID/i).fill('session-123');

    await page.getByRole('button', { name: /Export User Data/i }).click();

    // Check for loading state
    await expect(page.getByText('Exporting…')).toBeVisible();

    await downloadPromise;

    // Loading state should be gone
    await expect(page.getByText('Exporting…')).not.toBeVisible();
  });

  test('shows loading state during deletion', async ({ page }) => {
    await page.route('**/api/gdpr/delete', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 500));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Data successfully deleted',
          deleted_count: 2,
        }),
      });
    });

    await page.getByLabel(/Customer Domain/i).fill('acme.com');
    await page.getByLabel(/Session ID/i).fill('session-123');
    await page.getByLabel(/Confirm deletion request/i).click();

    await page.getByRole('button', { name: /Delete User Data/i }).click();

    // Check for loading state
    await expect(page.getByText('Processing…')).toBeVisible();

    // Wait for completion
    await expect(page.getByText(/Deleted 2 conversation/i)).toBeVisible();

    // Loading state should be gone
    await expect(page.getByText('Processing…')).not.toBeVisible();
  });

  test('renders GDPR compliance UI elements', async ({ page }) => {
    // Verify key UI elements are present
    await expect(page.getByText('User Rights Management')).toBeVisible();
    await expect(page.getByText('Right to be Forgotten')).toBeVisible();
    await expect(page.getByText('Data Portability')).toBeVisible();

    // Verify form fields
    await expect(page.getByLabel(/Customer Domain/i)).toBeVisible();
    await expect(page.getByLabel(/Session ID/i)).toBeVisible();
    await expect(page.getByLabel(/Email Address/i)).toBeVisible();
    await expect(page.getByLabel(/Confirm deletion request/i)).toBeVisible();

    // Verify action buttons
    await expect(page.getByRole('button', { name: /Export User Data/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Delete User Data/i })).toBeVisible();
  });

  test('displays audit log entries with correct metadata', async ({ page }) => {
    // Wait for audit log to load
    await page.waitForTimeout(500);

    // Verify audit log table/section is visible
    await expect(page.getByText(/Recent GDPR Requests/i)).toBeVisible();

    // Verify audit entry appears with correct data
    await expect(page.getByText('acme.com')).toBeVisible();
    await expect(page.getByText('session-123')).toBeVisible();
    await expect(page.getByText('user@acme.com')).toBeVisible();
    await expect(page.getByText('dashboard')).toBeVisible();
    await expect(page.getByText('completed')).toBeVisible();
  });

  test('filters audit log by request type', async ({ page }) => {
    // Select "Export" filter
    await page.getByRole('combobox', { name: /Filter by Type/i }).click();
    await page.getByRole('option', { name: /Export/i }).click();

    // Verify export-specific entries are visible
    await expect(page.getByText('Export generated.')).toBeVisible();

    // Select "Delete" filter
    await page.getByRole('combobox', { name: /Filter by Type/i }).click();
    await page.getByRole('option', { name: /Delete/i }).click();

    // Verify delete-specific entries are visible
    await expect(page.getByText('Deleted 2 conversations.')).toBeVisible();
    await expect(page.getByText(/deleted_count.*2/i)).toBeVisible();
  });
});
