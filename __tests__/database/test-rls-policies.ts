/**
 * RLS Policy Testing Suite orchestrator.
 * Breaks the legacy monolith into modular helpers under ./rls-policies.
 */

import { setupTestData } from './rls-policies/setup';
import { testServiceRoleAccess } from './rls-policies/service-role-tests';
import { testAnonymousRestrictions } from './rls-policies/anonymous-tests';
import { testViewSecurity } from './rls-policies/view-security-tests';
import { testMultiTenantIsolation } from './rls-policies/multitenant-tests';
import { testGDPRAuditIsolation } from './rls-policies/gdpr-tests';
import { cleanupTestData } from './rls-policies/cleanup';
import { printSummary } from './rls-policies/summary';

async function runRlsPolicySuite() {
  console.log('\n════════════════════════════════════════════════════════════════');
  console.log('  RLS Policy Test Suite');
  console.log('  Migration: 20251028_fix_security_advisories.sql');
  console.log('════════════════════════════════════════════════════════════════\n');

  const testData = await setupTestData();

  try {
    await testServiceRoleAccess();
    await testAnonymousRestrictions();
    await testViewSecurity();
    await testMultiTenantIsolation(testData);
    await testGDPRAuditIsolation(testData);
  } finally {
    await cleanupTestData(testData);
  }

  const failed = printSummary();
  process.exit(failed > 0 ? 1 : 0);
}

runRlsPolicySuite().catch((error) => {
  console.error('\n💥 Test suite failed with error:');
  console.error(error);
  process.exit(1);
});
