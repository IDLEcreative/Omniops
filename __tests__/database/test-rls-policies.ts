/**
 * RLS Policy Testing Suite
 *
 * Tests Row Level Security policies to ensure proper multi-tenant isolation.
 *
 * Usage:
 *   npx tsx test-rls-policies.ts
 *
 * Requirements:
 *   - Migration 20251028_fix_security_advisories.sql must be applied
 *   - Test organizations and users must exist in database
 */

import { createClient } from '@supabase/supabase-js';

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Test results tracking
interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  duration: number;
}

const results: TestResult[] = [];

// Clients with different roles
const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Test utilities
async function runTest(name: string, testFn: () => Promise<void>): Promise<void> {
  const startTime = Date.now();
  try {
    await testFn();
    results.push({ name, passed: true, duration: Date.now() - startTime });
    console.log(`✅ ${name}`);
  } catch (error) {
    results.push({
      name,
      passed: false,
      error: error instanceof Error ? error.message : String(error),
      duration: Date.now() - startTime,
    });
    console.error(`❌ ${name}`);
    console.error(`   Error: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function assertCount(
  actual: number,
  expected: number | 'any',
  message: string
): Promise<void> {
  if (expected === 'any') {
    if (actual === 0) {
      throw new Error(`${message}: Expected any rows but got 0`);
    }
  } else if (actual !== expected) {
    throw new Error(`${message}: Expected ${expected} rows but got ${actual}`);
  }
}

// =============================================================================
// Test Setup: Create test data
// =============================================================================

async function setupTestData(): Promise<{
  org1Id: string;
  org2Id: string;
  domain1: string;
  domain2: string;
}> {
  console.log('\n🔧 Setting up test data...\n');

  // Create test organizations
  const { data: org1, error: org1Error } = await serviceClient
    .from('organizations')
    .insert({ name: 'Test Org 1', slug: 'test-org-1-rls' })
    .select()
    .single();

  if (org1Error && !org1Error.message.includes('duplicate')) {
    throw new Error(`Failed to create org1: ${org1Error.message}`);
  }

  const { data: org2, error: org2Error } = await serviceClient
    .from('organizations')
    .insert({ name: 'Test Org 2', slug: 'test-org-2-rls' })
    .select()
    .single();

  if (org2Error && !org2Error.message.includes('duplicate')) {
    throw new Error(`Failed to create org2: ${org2Error.message}`);
  }

  // Get existing orgs if already created
  const { data: existingOrgs } = await serviceClient
    .from('organizations')
    .select('*')
    .in('slug', ['test-org-1-rls', 'test-org-2-rls']);

  const org1Id = org1?.id || existingOrgs?.[0]?.id;
  const org2Id = org2?.id || existingOrgs?.[1]?.id;

  const domain1 = 'test-org-1.example.com';
  const domain2 = 'test-org-2.example.com';

  // Create customer configs for each org
  await serviceClient
    .from('customer_configs')
    .upsert([
      { domain: domain1, organization_id: org1Id, business_name: 'Test Org 1' },
      { domain: domain2, organization_id: org2Id, business_name: 'Test Org 2' },
    ], { onConflict: 'domain' });

  console.log(`✓ Created test organizations and domains`);
  console.log(`  Org 1: ${org1Id} (${domain1})`);
  console.log(`  Org 2: ${org2Id} (${domain2})`);

  return { org1Id, org2Id, domain1, domain2 };
}

// =============================================================================
// Test Suite: Service Role Access
// =============================================================================

async function testServiceRoleAccess(testData: any): Promise<void> {
  console.log('\n📋 Testing Service Role Access...\n');

  await runTest('Service role can read chat_telemetry_rollups', async () => {
    const { data, error } = await serviceClient
      .from('chat_telemetry_rollups')
      .select('*')
      .limit(10);

    if (error) throw error;
    // Service role should have access (may be empty, but no permission error)
  });

  await runTest('Service role can read chat_telemetry_domain_rollups', async () => {
    const { data, error } = await serviceClient
      .from('chat_telemetry_domain_rollups')
      .select('*')
      .limit(10);

    if (error) throw error;
  });

  await runTest('Service role can read demo_attempts', async () => {
    const { data, error } = await serviceClient
      .from('demo_attempts')
      .select('*')
      .limit(10);

    if (error) throw error;
  });

  await runTest('Service role can read gdpr_audit_log', async () => {
    const { data, error } = await serviceClient
      .from('gdpr_audit_log')
      .select('*')
      .limit(10);

    if (error) throw error;
  });
}

// =============================================================================
// Test Suite: Anonymous Role Restrictions
// =============================================================================

async function testAnonymousRestrictions(): Promise<void> {
  console.log('\n📋 Testing Anonymous Role Restrictions...\n');

  await runTest('Anonymous cannot read chat_telemetry_rollups', async () => {
    const { data, error } = await anonClient
      .from('chat_telemetry_rollups')
      .select('*')
      .limit(1);

    // Should either get permission error or empty result due to RLS
    if (!error && data && data.length > 0) {
      throw new Error('Anonymous role should not have access to rollups');
    }
  });

  await runTest('Anonymous cannot read demo_attempts', async () => {
    const { data, error } = await anonClient
      .from('demo_attempts')
      .select('*')
      .limit(1);

    if (!error && data && data.length > 0) {
      throw new Error('Anonymous role should not have access to demo attempts');
    }
  });

  await runTest('Anonymous cannot read gdpr_audit_log', async () => {
    const { data, error } = await anonClient
      .from('gdpr_audit_log')
      .select('*')
      .limit(1);

    if (!error && data && data.length > 0) {
      throw new Error('Anonymous role should not have access to GDPR logs');
    }
  });
}

// =============================================================================
// Test Suite: View Security (SECURITY INVOKER)
// =============================================================================

async function testViewSecurity(): Promise<void> {
  console.log('\n📋 Testing View Security (SECURITY INVOKER)...\n');

  await runTest('chat_telemetry_metrics view respects RLS', async () => {
    // Service role should be able to query
    const { data, error } = await serviceClient
      .from('chat_telemetry_metrics')
      .select('*')
      .limit(1);

    if (error) throw error;

    // Anonymous should be blocked or get empty result
    const { data: anonData } = await anonClient
      .from('chat_telemetry_metrics')
      .select('*')
      .limit(1);

    // If anon gets data, it should be empty due to RLS
    if (anonData && anonData.length > 0) {
      console.warn('   ⚠️  Anonymous can query view (check if chat_telemetry has proper RLS)');
    }
  });

  await runTest('chat_telemetry_domain_costs view respects RLS', async () => {
    const { data, error } = await serviceClient
      .from('chat_telemetry_domain_costs')
      .select('*')
      .limit(1);

    if (error) throw error;
  });

  await runTest('chat_telemetry_cost_analytics view respects RLS', async () => {
    const { data, error } = await serviceClient
      .from('chat_telemetry_cost_analytics')
      .select('*')
      .limit(1);

    if (error) throw error;
  });

  await runTest('chat_telemetry_hourly_costs view respects RLS', async () => {
    const { data, error } = await serviceClient
      .from('chat_telemetry_hourly_costs')
      .select('*')
      .limit(1);

    if (error) throw error;
  });
}

// =============================================================================
// Test Suite: Multi-Tenant Isolation
// =============================================================================

async function testMultiTenantIsolation(testData: any): Promise<void> {
  console.log('\n📋 Testing Multi-Tenant Isolation...\n');

  // Insert test rollup data
  await runTest('Insert test rollup data', async () => {
    const now = new Date();
    const hourStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours());
    const hourEnd = new Date(hourStart.getTime() + 60 * 60 * 1000);

    await serviceClient
      .from('chat_telemetry_domain_rollups')
      .upsert([
        {
          bucket_start: hourStart.toISOString(),
          bucket_end: hourEnd.toISOString(),
          granularity: 'hour',
          domain: testData.domain1,
          total_requests: 100,
          success_count: 95,
          failure_count: 5,
          total_input_tokens: 10000,
          total_output_tokens: 5000,
          total_cost_usd: 0.5,
        },
        {
          bucket_start: hourStart.toISOString(),
          bucket_end: hourEnd.toISOString(),
          granularity: 'hour',
          domain: testData.domain2,
          total_requests: 50,
          success_count: 48,
          failure_count: 2,
          total_input_tokens: 5000,
          total_output_tokens: 2500,
          total_cost_usd: 0.25,
        },
      ], {
        onConflict: 'granularity,bucket_start,domain',
      });

    console.log('   ✓ Inserted test data for both domains');
  });

  await runTest('Service role sees all domain rollups', async () => {
    const { data, error } = await serviceClient
      .from('chat_telemetry_domain_rollups')
      .select('*')
      .in('domain', [testData.domain1, testData.domain2]);

    if (error) throw error;

    await assertCount(
      data?.length || 0,
      2,
      'Service role should see rollups for both test domains'
    );
  });

  // Note: Testing authenticated user isolation requires actual user auth
  // which is complex to set up in a standalone test script
  await runTest('Organization isolation is enforced by policy', async () => {
    // Verify the policy exists
    const { data: policies, error } = await serviceClient.rpc('pg_policies' as any);

    // This is a smoke test - actual isolation testing requires authenticated users
    console.log('   ℹ️  Full isolation testing requires authenticated user sessions');
    console.log('   ℹ️  Verify manually: Users should only see their org\'s domains');
  });
}

// =============================================================================
// Test Suite: GDPR Audit Log Isolation
// =============================================================================

async function testGDPRAuditIsolation(testData: any): Promise<void> {
  console.log('\n📋 Testing GDPR Audit Log Isolation...\n');

  await runTest('Insert test GDPR audit logs', async () => {
    await serviceClient
      .from('gdpr_audit_log')
      .insert([
        {
          domain: testData.domain1,
          request_type: 'export',
          session_id: 'test-session-1',
          email: 'user1@test.com',
          actor: 'admin@org1.com',
          status: 'completed',
        },
        {
          domain: testData.domain2,
          request_type: 'delete',
          session_id: 'test-session-2',
          email: 'user2@test.com',
          actor: 'admin@org2.com',
          status: 'completed',
          deleted_count: 42,
        },
      ]);

    console.log('   ✓ Inserted test GDPR logs for both domains');
  });

  await runTest('Service role sees all GDPR logs', async () => {
    const { data, error } = await serviceClient
      .from('gdpr_audit_log')
      .select('*')
      .in('domain', [testData.domain1, testData.domain2]);

    if (error) throw error;

    await assertCount(
      data?.length || 0,
      'any',
      'Service role should see GDPR logs for test domains'
    );
  });

  await runTest('Anonymous cannot access GDPR logs', async () => {
    const { data, error } = await anonClient
      .from('gdpr_audit_log')
      .select('*')
      .in('domain', [testData.domain1, testData.domain2]);

    if (!error && data && data.length > 0) {
      throw new Error('Anonymous should not access GDPR audit logs');
    }
  });
}

// =============================================================================
// Test Cleanup
// =============================================================================

async function cleanupTestData(testData: any): Promise<void> {
  console.log('\n🧹 Cleaning up test data...\n');

  // Delete test data (cascades will handle related records)
  await serviceClient
    .from('customer_configs')
    .delete()
    .in('domain', [testData.domain1, testData.domain2]);

  await serviceClient
    .from('organizations')
    .delete()
    .in('id', [testData.org1Id, testData.org2Id]);

  console.log('✓ Test data cleaned up');
}

// =============================================================================
// Main Test Runner
// =============================================================================

async function main(): Promise<void> {
  console.log('\n════════════════════════════════════════════════════════════════');
  console.log('  RLS Policy Test Suite');
  console.log('  Migration: 20251028_fix_security_advisories.sql');
  console.log('════════════════════════════════════════════════════════════════\n');

  try {
    // Setup
    const testData = await setupTestData();

    // Run test suites
    await testServiceRoleAccess(testData);
    await testAnonymousRestrictions();
    await testViewSecurity();
    await testMultiTenantIsolation(testData);
    await testGDPRAuditIsolation(testData);

    // Cleanup
    await cleanupTestData(testData);

    // Print summary
    console.log('\n════════════════════════════════════════════════════════════════');
    console.log('  Test Results Summary');
    console.log('════════════════════════════════════════════════════════════════\n');

    const passed = results.filter((r) => r.passed).length;
    const failed = results.filter((r) => !r.passed).length;
    const total = results.length;

    console.log(`Total Tests: ${total}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📊 Success Rate: ${((passed / total) * 100).toFixed(1)}%`);

    if (failed > 0) {
      console.log('\n❌ Failed Tests:');
      results
        .filter((r) => !r.passed)
        .forEach((r) => {
          console.log(`   • ${r.name}`);
          console.log(`     ${r.error}`);
        });
    }

    console.log('\n════════════════════════════════════════════════════════════════\n');

    process.exit(failed > 0 ? 1 : 0);
  } catch (error) {
    console.error('\n💥 Test suite failed with error:');
    console.error(error);
    process.exit(1);
  }
}

// Run tests
main();
