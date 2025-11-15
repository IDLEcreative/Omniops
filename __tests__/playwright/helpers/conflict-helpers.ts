import { Page, Route } from '@playwright/test';

/**
 * Helper functions for database conflict testing
 */

export interface ConflictMockState {
  currentVersion: number;
  editAttempts: number;
  conflictDetected: boolean;
  resolutionSuccessful: boolean;
}

/**
 * Setup route mock for concurrent edit conflict simulation
 */
export async function setupConflictMock(
  page: Page,
  apiPath: string
): Promise<ConflictMockState> {
  const state: ConflictMockState = {
    currentVersion: 1,
    editAttempts: 0,
    conflictDetected: false,
    resolutionSuccessful: false
  };

  await page.route(apiPath, async (route: Route) => {
    const method = route.request().method();

    if (method === 'GET') {
      console.log(`📥 GET settings (version ${state.currentVersion})`);
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          settings: {
            name: 'Test Domain',
            description: 'Original description',
            retentionDays: 30,
            version: state.currentVersion
          }
        })
      });
    } else if (method === 'PUT' || method === 'PATCH') {
      state.editAttempts++;
      const requestBody = route.request().postDataJSON();
      const submittedVersion = requestBody.version || 0;

      console.log(`📤 PUT/PATCH attempt #${state.editAttempts}`);
      console.log(`   Submitted version: ${submittedVersion}`);
      console.log(`   Current version: ${state.currentVersion}`);

      if (state.editAttempts === 1) {
        // Simulate concurrent edit
        console.log('👥 Simulating concurrent edit by another user');
        state.currentVersion = 2;
        state.conflictDetected = true;

        console.log('⚠️  Version mismatch detected - returning 409 Conflict');
        await route.fulfill({
          status: 409,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Conflict: Settings were modified by another user',
            message: 'These settings have been updated by another user while you were editing. Please review the changes and try again.',
            code: 'EDIT_CONFLICT',
            currentVersion: state.currentVersion,
            currentData: {
              name: 'Test Domain',
              description: 'Modified by another user',
              retentionDays: 60
            },
            yourData: requestBody
          })
        });
      } else {
        // Second attempt succeeds
        console.log('✅ Version matches - accepting update');
        state.currentVersion++;
        state.resolutionSuccessful = true;

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Settings updated successfully',
            settings: {
              ...requestBody,
              version: state.currentVersion
            }
          })
        });
      }
    } else {
      await route.continue();
    }
  });

  console.log('✅ Concurrent edit mock ready');
  return state;
}

/**
 * Common selectors for conflict UI elements
 */
export const CONFLICT_ERROR_SELECTORS = [
  'text=/conflict/i',
  'text=/modified by another user/i',
  'text=/updated.*while you were editing/i',
  '.conflict-error',
  '.edit-conflict',
  '[role="alert"]',
  '.error-message'
];

export const RESOLUTION_OPTION_SELECTORS = [
  'button:has-text("Keep My Changes")',
  'button:has-text("Use Their Changes")',
  'button:has-text("Merge")',
  'button:has-text("Review Changes")',
  'button:has-text("Retry")',
  'button:has-text("Reload")'
];

export const COMPARISON_SELECTORS = [
  '.conflict-comparison',
  '.changes-diff',
  'text=/your changes/i',
  'text=/their changes/i',
  'text=/current.*version/i'
];

export const SUCCESS_MESSAGE_SELECTORS = [
  'text=/updated successfully/i',
  'text=/saved successfully/i',
  'text=/changes saved/i',
  '.success-message',
  '[role="alert"]:has-text("success")'
];
