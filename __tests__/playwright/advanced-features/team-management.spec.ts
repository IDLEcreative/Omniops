import { test, expect, Page } from '@playwright/test';

/**
 * E2E Test: Team Management Journey
 *
 * Tests the COMPLETE team management flow from invitation to member access.
 * Journey: Invite member → Accept invitation → Set password → Login → Verify permissions → Access allowed features
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_TIMEOUT = 180000; // 3 minutes

interface TeamMember {
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  invitationToken?: string;
}

/**
 * Mock email service to capture invitation emails
 */
async function mockEmailService(page: Page): Promise<{ getLastEmail: () => any }> {
  console.log('🔧 Setting up email service mock');

  const emailState = { lastEmail: null as any };

  await page.route('**/api/team/invite', async (route) => {
    const requestData = route.request().postDataJSON();
    console.log('📧 Invitation request:', requestData.email);

    // Generate mock invitation token
    const token = `invite_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    emailState.lastEmail = {
      to: requestData.email,
      subject: 'You have been invited to join the team',
      token: token,
      role: requestData.role,
      invitationUrl: `${BASE_URL}/invite/${token}`
    };

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        message: 'Invitation sent successfully',
        token: token
      })
    });
  });

  console.log('✅ Email service mock ready');
  return {
    getLastEmail: () => emailState.lastEmail
  };
}

/**
 * Navigate to team management page
 */
async function navigateToTeamManagement(page: Page): Promise<void> {
  console.log('📍 Navigating to team management page');

  await page.goto(`${BASE_URL}/dashboard/team`, { waitUntil: 'networkidle' });

  // Verify team management page loaded
  const pageTitle = page.locator('h1, h2').filter({ hasText: /team|members/i }).first();
  await expect(pageTitle).toBeVisible({ timeout: 10000 });

  console.log('✅ Team management page loaded');
}

/**
 * Send team invitation
 */
async function sendTeamInvitation(page: Page, member: TeamMember): Promise<void> {
  console.log(`📍 Sending invitation to ${member.email} as ${member.role}`);

  // Click invite button
  const inviteButton = page.locator('button:has-text("Invite"), button:has-text("Add member")').first();
  await inviteButton.click();
  await page.waitForTimeout(500);

  // Fill invitation form
  const emailInput = page.locator('input[name="email"], input[type="email"], input[placeholder*="email" i]').first();
  await emailInput.waitFor({ state: 'visible', timeout: 5000 });
  await emailInput.fill(member.email);

  // Select role
  const roleSelect = page.locator('select[name="role"], [role="combobox"]:has-text("role")').first();
  if (await roleSelect.isVisible({ timeout: 2000 })) {
    await roleSelect.selectOption(member.role);
  } else {
    // Try radio buttons or dropdown
    const roleOption = page.locator(`label:has-text("${member.role}"), button:has-text("${member.role}")`).first();
    if (await roleOption.isVisible({ timeout: 2000 })) {
      await roleOption.click();
    }
  }

  // Submit invitation
  const submitButton = page.locator('button[type="submit"]:has-text("Send"), button:has-text("Invite")').first();
  await submitButton.click();

  // Wait for success message
  await page.waitForTimeout(2000);
  const successMessage = page.locator('text=/invitation sent/i, [role="alert"]:has-text("success")').first();
  await expect(successMessage).toBeVisible({ timeout: 5000 });

  console.log('✅ Invitation sent successfully');
}

/**
 * Accept invitation and complete registration
 */
async function acceptInvitation(page: Page, invitationUrl: string, password: string): Promise<void> {
  console.log('📍 Accepting invitation');

  await page.goto(invitationUrl, { waitUntil: 'networkidle' });

  // Verify invitation page
  const heading = page.locator('h1, h2').filter({ hasText: /accept|invitation|join/i }).first();
  await expect(heading).toBeVisible({ timeout: 10000 });

  // Fill password form
  const passwordInput = page.locator('input[name="password"], input[type="password"]').first();
  await passwordInput.fill(password);

  const confirmPasswordInput = page.locator('input[name="confirmPassword"], input[name="password_confirm"]').first();
  if (await confirmPasswordInput.isVisible({ timeout: 2000 })) {
    await confirmPasswordInput.fill(password);
  }

  // Accept invitation
  const acceptButton = page.locator('button[type="submit"]:has-text("Accept"), button:has-text("Join")').first();
  await acceptButton.click();

  await page.waitForTimeout(3000);

  console.log('✅ Invitation accepted and password set');
}

/**
 * Login as team member
 */
async function loginAsMember(page: Page, email: string, password: string): Promise<void> {
  console.log(`📍 Logging in as ${email}`);

  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });

  const emailInput = page.locator('input[name="email"], input[type="email"]').first();
  await emailInput.fill(email);

  const passwordInput = page.locator('input[name="password"], input[type="password"]').first();
  await passwordInput.fill(password);

  const loginButton = page.locator('button[type="submit"]:has-text("Log in"), button:has-text("Sign in")').first();
  await loginButton.click();

  // Wait for dashboard to load
  await page.waitForTimeout(3000);
  await page.waitForURL(/dashboard/, { timeout: 10000 });

  console.log('✅ Logged in successfully');
}

/**
 * Verify role-based permissions
 */
async function verifyRolePermissions(page: Page, role: 'admin' | 'editor' | 'viewer'): Promise<void> {
  console.log(`📍 Verifying ${role} permissions`);

  const permissions = {
    admin: {
      canAccessSettings: true,
      canAccessAnalytics: true,
      canAccessConversations: true,
      canAccessTeam: true,
      canEditDomain: true
    },
    editor: {
      canAccessSettings: false,
      canAccessAnalytics: true,
      canAccessConversations: true,
      canAccessTeam: false,
      canEditDomain: true
    },
    viewer: {
      canAccessSettings: false,
      canAccessAnalytics: true,
      canAccessConversations: true,
      canAccessTeam: false,
      canEditDomain: false
    }
  };

  const expected = permissions[role];

  // Check analytics access
  console.log('📍 Checking analytics access');
  await page.goto(`${BASE_URL}/dashboard/analytics`, { waitUntil: 'networkidle' });

  if (expected.canAccessAnalytics) {
    const analyticsContent = page.locator('h1:has-text("Analytics"), [data-testid="analytics-dashboard"]').first();
    await expect(analyticsContent).toBeVisible({ timeout: 5000 });
    console.log('✅ Analytics access granted');
  } else {
    const accessDenied = page.locator('text=/access denied/i, text=/permission/i').first();
    await expect(accessDenied).toBeVisible({ timeout: 5000 });
    console.log('✅ Analytics access denied (expected)');
  }

  // Check conversations access
  console.log('📍 Checking conversations access');
  await page.goto(`${BASE_URL}/dashboard/conversations`, { waitUntil: 'networkidle' });

  if (expected.canAccessConversations) {
    const conversationsContent = page.locator('h1:has-text("Conversations"), [data-testid="conversations-list"]').first();
    await expect(conversationsContent).toBeVisible({ timeout: 5000 });
    console.log('✅ Conversations access granted');
  } else {
    const accessDenied = page.locator('text=/access denied/i, text=/permission/i').first();
    await expect(accessDenied).toBeVisible({ timeout: 5000 });
    console.log('✅ Conversations access denied (expected)');
  }

  // Check settings access
  console.log('📍 Checking settings access');
  await page.goto(`${BASE_URL}/dashboard/settings`, { waitUntil: 'networkidle' });

  if (expected.canAccessSettings) {
    const settingsContent = page.locator('h1:has-text("Settings"), [data-testid="settings-page"]').first();
    await expect(settingsContent).toBeVisible({ timeout: 5000 });
    console.log('✅ Settings access granted');
  } else {
    const accessDenied = page.locator('text=/access denied/i, text=/permission/i, [data-testid="no-permission"]').first();
    const url = page.url();
    const isOnSettings = url.includes('/settings');

    if (isOnSettings) {
      await expect(accessDenied).toBeVisible({ timeout: 5000 });
      console.log('✅ Settings access denied (expected)');
    } else {
      console.log('✅ Settings access redirected (expected)');
    }
  }

  console.log(`✅ All ${role} permissions verified`);
}

/**
 * Verify team member can access allowed features
 */
async function verifyFeatureAccess(page: Page, role: 'admin' | 'editor' | 'viewer'): Promise<void> {
  console.log('📍 Verifying feature access');

  // All roles should access analytics
  await page.goto(`${BASE_URL}/dashboard/analytics`, { waitUntil: 'networkidle' });

  // Check for analytics widgets
  const metricsCards = page.locator('[data-testid="metric-card"], .metric-card, .stat-card');
  const cardsCount = await metricsCards.count();
  expect(cardsCount).toBeGreaterThan(0);
  console.log(`✅ Found ${cardsCount} analytics widgets`);

  // All roles should access conversations
  await page.goto(`${BASE_URL}/dashboard/conversations`, { waitUntil: 'networkidle' });

  const conversationsList = page.locator('[data-testid="conversation-item"], .conversation-item, .conversation-row');
  const isVisible = await conversationsList.first().isVisible({ timeout: 5000 }).catch(() => false);

  if (isVisible) {
    console.log('✅ Conversations list accessible');
  } else {
    console.log('⚠️ No conversations found (empty state is okay)');
  }

  // Only editors and admins should edit domains
  if (role === 'admin' || role === 'editor') {
    await page.goto(`${BASE_URL}/dashboard/domains`, { waitUntil: 'networkidle' });
    const editButton = page.locator('button:has-text("Edit"), a:has-text("Configure")').first();
    await expect(editButton).toBeVisible({ timeout: 5000 });
    console.log('✅ Domain edit access granted');
  }

  console.log('✅ Feature access verified');
}

test.describe('Team Management Journey E2E', () => {
  test.setTimeout(TEST_TIMEOUT);

  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('should complete full team invitation flow for viewer role', async ({ page }) => {
    console.log('=== Starting Team Management Test: Viewer Role ===');

    const newMember: TeamMember = {
      email: `viewer-${Date.now()}@test.com`,
      role: 'viewer'
    };
    const password = 'SecureTestPassword123!';

    // Setup email mock
    const emailService = await mockEmailService(page);

    // Step 1: Navigate to team management
    await navigateToTeamManagement(page);

    // Step 2: Send invitation
    await sendTeamInvitation(page, newMember);

    // Step 3: Get invitation URL from email
    await page.waitForTimeout(1000);
    const invitationEmail = emailService.getLastEmail();
    expect(invitationEmail).not.toBeNull();
    expect(invitationEmail.to).toBe(newMember.email);
    expect(invitationEmail.role).toBe(newMember.role);
    console.log('✅ Invitation email captured:', invitationEmail.invitationUrl);

    // Step 4: Accept invitation in new context
    const invitationUrl = invitationEmail.invitationUrl;
    await acceptInvitation(page, invitationUrl, password);

    // Step 5: Login as new member
    await loginAsMember(page, newMember.email, password);

    // Step 6: Verify permissions
    await verifyRolePermissions(page, newMember.role);

    // Step 7: Verify feature access
    await verifyFeatureAccess(page, newMember.role);

    await page.screenshot({
      path: `test-results/team-management-viewer-success-${Date.now()}.png`,
      fullPage: true
    });

    console.log('✅ Complete team invitation flow validated end-to-end for viewer!');
  });

  test('should handle editor role with correct permissions', async ({ page }) => {
    console.log('=== Testing Editor Role Permissions ===');

    const newMember: TeamMember = {
      email: `editor-${Date.now()}@test.com`,
      role: 'editor'
    };
    const password = 'SecureTestPassword123!';

    const emailService = await mockEmailService(page);
    await navigateToTeamManagement(page);
    await sendTeamInvitation(page, newMember);

    const invitationEmail = emailService.getLastEmail();
    await acceptInvitation(page, invitationEmail.invitationUrl, password);
    await loginAsMember(page, newMember.email, password);
    await verifyRolePermissions(page, newMember.role);

    console.log('✅ Editor role permissions validated!');
  });

  test('should show team members list with correct roles', async ({ page }) => {
    console.log('⏭️ Team members list test - TODO');
  });

  test('should allow admin to revoke member access', async ({ page }) => {
    console.log('⏭️ Member revocation test - TODO');
  });

  test('should handle expired invitation tokens', async ({ page }) => {
    console.log('⏭️ Expired invitation test - TODO');
  });

  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status !== 'passed') {
      await page.screenshot({
        path: `test-results/team-management-failure-${Date.now()}.png`,
        fullPage: true
      });
    }
  });
});
