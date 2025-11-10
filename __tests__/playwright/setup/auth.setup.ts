/**
 * Playwright Global Authentication Setup
 *
 * Runs before all tests to establish authentication state.
 * Saves auth session to be reused across test runs.
 */

import { test as setup, expect } from '@playwright/test';
import { setupAuthentication, TEST_CREDENTIALS } from '../../utils/playwright/auth-helpers';
import * as fs from 'fs';
import * as path from 'path';

const authFile = 'playwright/.auth/user.json';

setup('authenticate for E2E tests', async ({ page }) => {
  console.log('=== Global Authentication Setup ===');
  console.log('🔐 Setting up authentication for E2E tests...');

  // Ensure auth directory exists
  const authDir = path.dirname(authFile);
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
    console.log('📁 Created auth directory:', authDir);
  }

  try {
    // Authenticate and save state
    await setupAuthentication(page, {
      email: TEST_CREDENTIALS.email,
      password: TEST_CREDENTIALS.password,
      saveState: true,
      statePath: authFile,
    });

    // Verify auth state file was created
    if (fs.existsSync(authFile)) {
      const stats = fs.statSync(authFile);
      console.log(`✅ Auth state saved (${stats.size} bytes)`);
    } else {
      throw new Error('Auth state file was not created');
    }

    console.log('✅ Authentication setup complete');
    console.log('   Email:', TEST_CREDENTIALS.email);
    console.log('   State file:', authFile);
  } catch (error) {
    console.error('❌ Authentication setup failed:', error);
    throw error;
  }
});
