#!/usr/bin/env node
/**
 * Security Migration Verification Script
 *
 * Verifies that migration 20251028_fix_security_advisories.sql was applied successfully.
 *
 * Usage:
 *   npx tsx verify-security-migration.ts
 *
 * Checks:
 *   1. All 4 telemetry views use SECURITY INVOKER
 *   2. All 8 tables have RLS enabled
 *   3. All expected RLS policies exist
 */

import { createClient } from '@supabase/supabase-js';
import {
  checkViewSecurity,
  checkRLSEnabled,
  checkRLSPolicies,
  runSmokeTests,
  type CheckResult
} from '../../lib/scripts/verify-security-migration/checks.js';
import { printSummary, getExitCode } from '../../lib/scripts/verify-security-migration/report.js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function main(): Promise<void> {
  console.log('\n════════════════════════════════════════════════════════════════');
  console.log('  Security Migration Verification');
  console.log('  Migration: 20251028_fix_security_advisories.sql');
  console.log('════════════════════════════════════════════════════════════════');

  const results: CheckResult[] = [];

  try {
    await checkViewSecurity(serviceClient, results);
    await checkRLSEnabled(serviceClient, results);
    await checkRLSPolicies(serviceClient, results);
    await runSmokeTests(serviceClient, results);

    printSummary(results);
    process.exit(getExitCode(results));
  } catch (error) {
    console.error('\n💥 Verification failed with error:');
    console.error(error);
    process.exit(1);
  }
}

// Run verification
main();
