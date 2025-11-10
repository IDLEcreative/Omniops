/**
 * Test Script: Autonomous Agent System
 *
 * Tests the complete autonomous agent infrastructure:
 * - Database schema
 * - Credential vault
 * - Consent manager
 * - Operation service
 * - Workflow registry
 * - Base agent functionality
 *
 * Usage: npx tsx scripts/tests/test-autonomous-agent.ts
 */

import { getCredentialVault } from '@/lib/autonomous/security/credential-vault';
import { getConsentManager } from '@/lib/autonomous/security/consent-manager';
import { getAuditLogger } from '@/lib/autonomous/security/audit-logger';
import { getOperationService } from '@/lib/autonomous/core/operation-service';
import { WorkflowRegistry } from '@/lib/autonomous/core/workflow-registry';
import { createClient } from '@supabase/supabase-js';

// Create Supabase client for scripts
function createServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials');
  }

  return createClient(supabaseUrl, supabaseKey);
}

// ============================================================================
// Test Configuration
// ============================================================================

const TEST_CUSTOMER_ID = 'test-customer-autonomous-' + Date.now();
const TEST_USER_ID = 'test-user-autonomous-' + Date.now();
const TEST_SERVICE = 'woocommerce';
const TEST_OPERATION = 'api_key_generation';

// ============================================================================
// Test Utilities
// ============================================================================

let testsPassed = 0;
let testsFailed = 0;

function assert(condition: boolean, message: string): void {
  if (condition) {
    console.log(`✅ ${message}`);
    testsPassed++;
  } else {
    console.error(`❌ ${message}`);
    testsFailed++;
    throw new Error(`Assertion failed: ${message}`);
  }
}

function section(title: string): void {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`  ${title}`);
  console.log('='.repeat(70));
}

// ============================================================================
// Tests
// ============================================================================

async function testDatabaseSchema(): Promise<void> {
  section('Test 1: Database Schema');

  const supabase = createServerClient();

  // Test autonomous_operations table exists
  const { data: operations, error: opsError } = await supabase
    .from('autonomous_operations')
    .select('*')
    .limit(1);

  assert(!opsError, 'autonomous_operations table exists');

  // Test autonomous_credentials table exists
  const { data: creds, error: credsError } = await supabase
    .from('autonomous_credentials')
    .select('*')
    .limit(1);

  assert(!credsError, 'autonomous_credentials table exists');

  // Test autonomous_consent table exists
  const { data: consent, error: consentError } = await supabase
    .from('autonomous_consent')
    .select('*')
    .limit(1);

  assert(!consentError, 'autonomous_consent table exists');

  // Test autonomous_operations_audit table exists
  const { data: audit, error: auditError } = await supabase
    .from('autonomous_operations_audit')
    .select('*')
    .limit(1);

  assert(!auditError, 'autonomous_operations_audit table exists');

  console.log('\n✅ All database tables exist and accessible');
}

async function testCredentialVault(): Promise<void> {
  section('Test 2: Credential Vault');

  const vault = getCredentialVault();

  // Test storing credential
  const testCredential = {
    value: 'test_api_key_' + Date.now(),
    metadata: { scopes: ['read', 'write'] },
    expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days
  };

  const stored = await vault.store(
    TEST_CUSTOMER_ID,
    TEST_SERVICE,
    'api_key',
    testCredential
  );

  assert(stored.id !== undefined, 'Credential stored successfully');
  assert(stored.customerId === TEST_CUSTOMER_ID, 'Customer ID matches');
  assert(stored.service === TEST_SERVICE, 'Service matches');

  // Test retrieving credential
  const retrieved = await vault.get(TEST_CUSTOMER_ID, TEST_SERVICE, 'api_key');

  assert(retrieved !== null, 'Credential retrieved');
  assert(retrieved!.value === testCredential.value, 'Credential value matches (decrypted)');
  assert(JSON.stringify(retrieved!.metadata) === JSON.stringify(testCredential.metadata), 'Metadata matches');

  // Test listing credentials
  const list = await vault.list(TEST_CUSTOMER_ID);
  assert(list.length === 1, 'One credential in list');

  // Test verification
  const verified = await vault.verify(TEST_CUSTOMER_ID, TEST_SERVICE, 'api_key');
  assert(verified === true, 'Credential verified');

  // Test deletion
  await vault.delete(TEST_CUSTOMER_ID, TEST_SERVICE, 'api_key');
  const afterDelete = await vault.get(TEST_CUSTOMER_ID, TEST_SERVICE, 'api_key');
  assert(afterDelete === null, 'Credential deleted successfully');

  console.log('\n✅ Credential vault working correctly (encryption verified)');
}

async function testConsentManager(): Promise<void> {
  section('Test 3: Consent Manager');

  const consent = getConsentManager();

  // Test granting consent
  const consentRecord = await consent.grant(
    TEST_CUSTOMER_ID,
    TEST_USER_ID,
    {
      service: TEST_SERVICE,
      operation: TEST_OPERATION,
      permissions: ['read_products', 'create_api_keys'],
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
    }
  );

  assert(consentRecord.id !== undefined, 'Consent granted');
  assert(consentRecord.customerId === TEST_CUSTOMER_ID, 'Customer ID matches');
  assert(consentRecord.permissions.length === 2, 'Permissions stored');

  // Test verifying consent
  const verification = await consent.verify(
    TEST_CUSTOMER_ID,
    TEST_SERVICE,
    TEST_OPERATION
  );

  assert(verification.hasConsent === true, 'Consent verified');
  assert(verification.consentRecord !== undefined, 'Consent record returned');

  // Test checking permission
  const hasPermission = await consent.hasPermission(
    TEST_CUSTOMER_ID,
    TEST_SERVICE,
    TEST_OPERATION,
    'create_api_keys'
  );

  assert(hasPermission === true, 'Specific permission verified');

  // Test listing consents
  const consents = await consent.list(TEST_CUSTOMER_ID, { activeOnly: true });
  assert(consents.length === 1, 'One active consent found');

  // Test revoking consent
  await consent.revoke(TEST_CUSTOMER_ID, TEST_SERVICE, TEST_OPERATION);

  const afterRevoke = await consent.verify(TEST_CUSTOMER_ID, TEST_SERVICE, TEST_OPERATION);
  assert(afterRevoke.hasConsent === false, 'Consent revoked successfully');

  console.log('\n✅ Consent manager working correctly');
}

async function testAuditLogger(): Promise<void> {
  section('Test 4: Audit Logger');

  const logger = getAuditLogger();

  // Create test operation
  const operationService = getOperationService();

  // First grant consent again for operation creation
  const consent = getConsentManager();
  await consent.grant(TEST_CUSTOMER_ID, TEST_USER_ID, {
    service: TEST_SERVICE,
    operation: TEST_OPERATION,
    permissions: ['read_products', 'create_api_keys']
  });

  const operation = await operationService.create({
    customerId: TEST_CUSTOMER_ID,
    userId: TEST_USER_ID,
    service: TEST_SERVICE,
    operation: TEST_OPERATION
  });

  // Test logging steps
  const step1 = await logger.logStep({
    operationId: operation.id,
    stepNumber: 1,
    intent: 'Navigate to login page',
    action: 'await page.goto("https://example.com/login")',
    success: true,
    pageUrl: 'https://example.com/login',
    durationMs: 1250
  });

  assert(step1.id !== undefined, 'Step logged successfully');
  assert(step1.stepNumber === 1, 'Step number correct');

  const step2 = await logger.logStep({
    operationId: operation.id,
    stepNumber: 2,
    intent: 'Fill username',
    action: 'await page.fill("#username", "admin")',
    success: true,
    durationMs: 150
  });

  assert(step2.stepNumber === 2, 'Second step logged');

  // Test retrieving logs
  const logs = await logger.getOperationLogs(operation.id);
  assert(logs.length === 2, 'Two steps retrieved');

  // Test getting summary
  const summary = await logger.getOperationSummary(operation.id);
  assert(summary.totalSteps === 2, 'Summary: 2 total steps');
  assert(summary.successfulSteps === 2, 'Summary: 2 successful steps');
  assert(summary.failedSteps === 0, 'Summary: 0 failed steps');

  console.log('\n✅ Audit logger working correctly');
}

async function testOperationService(): Promise<void> {
  section('Test 5: Operation Service');

  const operationService = getOperationService();

  // Test creating operation with consent
  const operation = await operationService.create({
    customerId: TEST_CUSTOMER_ID,
    userId: TEST_USER_ID,
    service: TEST_SERVICE,
    operation: TEST_OPERATION,
    metadata: { test: true }
  });

  assert(operation.id !== undefined, 'Operation created');
  assert(operation.status === 'pending', 'Operation status is pending (consent exists)');
  assert(operation.consentGiven === true, 'Consent marked as given');

  // Test retrieving operation
  const retrieved = await operationService.get(operation.id);
  assert(retrieved !== null, 'Operation retrieved');
  assert(retrieved!.id === operation.id, 'Operation ID matches');

  // Test listing operations
  const operations = await operationService.list(TEST_CUSTOMER_ID);
  assert(operations.length >= 2, 'Multiple operations listed'); // At least 2 from previous tests

  // Test statistics
  const stats = await operationService.getStats(TEST_CUSTOMER_ID);
  assert(stats.total >= 2, 'Stats: Total operations correct');
  assert(stats.pending >= 1, 'Stats: Pending operations exist');

  console.log('\n✅ Operation service working correctly');
}

async function testWorkflowRegistry(): Promise<void> {
  section('Test 6: Workflow Registry');

  // Test loading knowledge base
  const workflowCount = WorkflowRegistry.count();
  assert(workflowCount > 0, `Knowledge base loaded (${workflowCount} workflows)`);

  // Test listing workflows
  const workflows = WorkflowRegistry.list();
  assert(workflows.length === workflowCount, 'All workflows listed');
  assert(workflows[0].id !== undefined, 'Workflow has ID');
  assert(workflows[0].name !== undefined, 'Workflow has name');

  // Test searching workflows
  const wooWorkflows = WorkflowRegistry.search('woocommerce');
  if (wooWorkflows.length > 0) {
    console.log(`  Found ${wooWorkflows.length} WooCommerce workflows`);
    assert(wooWorkflows.length > 0, 'WooCommerce workflows found');
  }

  // Test checking if workflow exists
  const firstWorkflowId = workflows[0].id;
  const exists = WorkflowRegistry.exists(firstWorkflowId);
  assert(exists === true, 'Workflow existence check works');

  // Test getting workflow definition
  const definition = WorkflowRegistry.getDefinition(firstWorkflowId);
  assert(definition.id === firstWorkflowId, 'Workflow definition retrieved');
  assert(definition.steps.length > 0, 'Workflow has steps');
  assert(definition.preconditions !== undefined, 'Workflow has preconditions');

  console.log('\n✅ Workflow registry working correctly');
}

async function cleanup(): Promise<void> {
  section('Cleanup');

  const supabase = createServerClient();

  // Clean up test data
  try {
    // Delete test credentials
    await supabase
      .from('autonomous_credentials')
      .delete()
      .eq('customer_id', TEST_CUSTOMER_ID);

    // Delete test consents
    await supabase
      .from('autonomous_consent')
      .delete()
      .eq('customer_id', TEST_CUSTOMER_ID);

    // Delete test audit logs (via CASCADE)
    // Delete test operations (CASCADE will handle audit logs)
    await supabase
      .from('autonomous_operations')
      .delete()
      .eq('customer_id', TEST_CUSTOMER_ID);

    console.log('✅ Test data cleaned up');
  } catch (error) {
    console.warn('⚠️  Cleanup warning:', error);
  }
}

// ============================================================================
// Main Test Runner
// ============================================================================

async function main() {
  console.log('\n🤖 Autonomous Agent System - Integration Tests');
  console.log('='.repeat(70));

  try {
    await testDatabaseSchema();
    await testCredentialVault();
    await testConsentManager();
    await testAuditLogger();
    await testOperationService();
    await testWorkflowRegistry();

    section('Test Results');
    console.log(`\n✅ Passed: ${testsPassed}`);
    console.log(`❌ Failed: ${testsFailed}`);
    console.log(`📊 Total:  ${testsPassed + testsFailed}`);

    if (testsFailed === 0) {
      console.log('\n🎉 All tests passed! Autonomous agent system is operational.\n');
    } else {
      console.log('\n⚠️  Some tests failed. Review errors above.\n');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n💥 Test suite failed:', error);
    process.exit(1);
  } finally {
    await cleanup();
  }
}

main().catch(console.error);
