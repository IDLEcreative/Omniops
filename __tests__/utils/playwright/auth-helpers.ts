/**
 * Playwright Authentication Helpers for E2E Tests
 *
 * Provides authentication utilities for dashboard and analytics tests.
 * Handles login, session management, and auth state verification.
 */

import { Page, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

/**
 * Test user credentials from environment
 */
export const TEST_CREDENTIALS = {
  email: process.env.TEST_USER_EMAIL || 'test@omniops.test',
  password: process.env.TEST_USER_PASSWORD || 'test_password_123_secure',
};

/**
 * Authenticate user for E2E tests
 * Logs in and returns auth state for verification
 */
export async function authenticateUser(
  page: Page,
  email: string = TEST_CREDENTIALS.email,
  password: string = TEST_CREDENTIALS.password
): Promise<void> {
  console.log('🔐 Authenticating user:', email);

  // Navigate to login page
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });

  // Wait for login form to be visible
  const emailInput = page.locator('input[id="email"], input[type="email"]').first();
  await emailInput.waitFor({ state: 'visible', timeout: 10000 });

  // Fill in credentials
  console.log('📍 Entering credentials');
  await emailInput.fill(email);

  const passwordInput = page.locator('input[id="password"], input[type="password"]').first();
  await passwordInput.fill(password);

  // Submit login form
  console.log('📍 Submitting login form');
  const submitButton = page.locator('button[type="submit"]').first();
  await submitButton.click();

  // Wait for redirect to dashboard (or wait for URL change)
  console.log('📍 Waiting for authentication to complete');
  await page.waitForURL(/\/dashboard/, { timeout: 15000 }).catch(async () => {
    // Fallback: check if we're on dashboard by looking for dashboard elements
    const dashboardIndicator = page.locator('[data-testid="user-menu"], .sidebar, nav').first();
    await dashboardIndicator.waitFor({ state: 'visible', timeout: 10000 });
  });

  // Wait for page to fully load
  await page.waitForLoadState('domcontentloaded');

  // Verify authenticated - look for user menu or logout button
  const authIndicator = await Promise.race([
    page.locator('[data-testid="user-menu"]').isVisible().catch(() => false),
    page.locator('button:has-text("Logout"), button:has-text("Sign out")').isVisible().catch(() => false),
    page.locator('.sidebar').isVisible().catch(() => false),
  ]);

  if (!authIndicator) {
    console.log('⚠️ Could not verify authentication - checking for error messages');
    const errorMessage = await page.locator('text=/invalid|incorrect|failed/i').first().textContent().catch(() => null);
    if (errorMessage) {
      throw new Error(`Authentication failed: ${errorMessage}`);
    }
  }

  console.log('✅ User authenticated successfully');
}

/**
 * Save authentication state for reuse across tests
 */
export async function saveAuthState(page: Page, path: string): Promise<void> {
  console.log('💾 Saving authentication state to:', path);
  await page.context().storageState({ path });
  console.log('✅ Auth state saved');
}

/**
 * Check if user is currently authenticated
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  try {
    // Try to access dashboard
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded', timeout: 10000 });

    // If redirected to login, not authenticated
    if (page.url().includes('/login')) {
      return false;
    }

    // Check for authentication indicators
    const authIndicator = await Promise.race([
      page.locator('[data-testid="user-menu"]').isVisible().catch(() => false),
      page.locator('button:has-text("Logout"), button:has-text("Sign out")').isVisible().catch(() => false),
      page.locator('.sidebar').isVisible().catch(() => false),
    ]);

    return Boolean(authIndicator);
  } catch {
    return false;
  }
}

/**
 * Sign out current user
 */
export async function signOut(page: Page): Promise<void> {
  console.log('🚪 Signing out user');

  const logoutButton = page.locator('button:has-text("Logout"), button:has-text("Sign out")').first();

  if (await logoutButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await logoutButton.click();
    await page.waitForURL(/\/login/, { timeout: 10000 });
    console.log('✅ User signed out');
  } else {
    console.log('⚠️ Logout button not found - clearing session directly');
    await page.context().clearCookies();
  }
}

/**
 * Navigate to dashboard with authentication check
 */
export async function navigateToDashboardAuthenticated(page: Page): Promise<void> {
  console.log('📍 Navigate to dashboard (with auth check)');

  // Check if already authenticated
  const isAuth = await isAuthenticated(page);

  if (!isAuth) {
    console.log('⚠️ Not authenticated - logging in');
    await authenticateUser(page);
  }

  // Navigate to dashboard
  await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('domcontentloaded');

  console.log('✅ Dashboard loaded with authentication');
}

/**
 * Setup authentication for a test session
 * Call this in test.beforeEach() or global setup
 */
export async function setupAuthentication(
  page: Page,
  options: {
    email?: string;
    password?: string;
    saveState?: boolean;
    statePath?: string;
  } = {}
): Promise<void> {
  const {
    email = TEST_CREDENTIALS.email,
    password = TEST_CREDENTIALS.password,
    saveState = false,
    statePath = 'playwright/.auth/user.json',
  } = options;

  await authenticateUser(page, email, password);

  if (saveState) {
    await saveAuthState(page, statePath);
  }
}

/**
 * Verify user is on analytics dashboard
 */
export async function verifyOnAnalyticsDashboard(page: Page): Promise<void> {
  // Wait for analytics indicators
  const analyticsIndicator = await Promise.race([
    page.locator('h1:has-text("Analytics"), h2:has-text("Analytics")').isVisible().catch(() => false),
    page.locator('[data-testid="analytics-dashboard"]').isVisible().catch(() => false),
    page.locator('text=/Analytics Dashboard/i').isVisible().catch(() => false),
  ]);

  if (!analyticsIndicator) {
    throw new Error('Not on analytics dashboard');
  }
}
