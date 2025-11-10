#!/usr/bin/env tsx

/**
 * Verify RLS Policies on Protected Tables
 *
 * This script verifies that Row Level Security is properly configured
 * on all tables, with special focus on the 3 recently protected tables:
 * - widget_config_versions
 * - domain_mappings
 * - demo_sessions
 *
 * Usage:
 *   npx tsx scripts/database/verify-rls-policies.ts
 *
 * What it checks:
 * - RLS is enabled on all tables
 * - Required policies exist
 * - Service role bypass policies are present
 * - Tenant isolation policies are configured
 *
 * Note: Requires SUPABASE_SERVICE_ROLE_KEY in environment
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface TableRLSStatus {
  tablename: string;
  rowsecurity: boolean;
}

interface PolicyInfo {
  tablename: string;
  policyname: string;
  permissive: string;
  roles: string[];
  cmd: string;
  qual: string | null;
  with_check: string | null;
}

const CRITICAL_TABLES = [
  'widget_config_versions',
  'domain_mappings',
  'demo_sessions',
  'customer_configs',
  'scraped_pages',
  'page_embeddings',
  'conversations',
  'messages'
];

async function checkRLSStatus(): Promise<Map<string, boolean>> {
  console.log('📊 Checking RLS status on critical tables...\n');

  const { data, error } = await supabase
    .from('pg_tables')
    .select('tablename, rowsecurity')
    .in('tablename', CRITICAL_TABLES)
    .order('tablename');

  if (error) {
    console.error('❌ Error checking RLS status:', error.message);
    process.exit(1);
  }

  const statusMap = new Map<string, boolean>();
  const results = data as unknown as TableRLSStatus[];

  let allEnabled = true;
  results.forEach((row) => {
    const status = row.rowsecurity ? '✅ Enabled' : '❌ DISABLED';
    console.log(`   ${row.tablename.padEnd(30)} ${status}`);
    statusMap.set(row.tablename, row.rowsecurity);

    if (!row.rowsecurity) {
      allEnabled = false;
    }
  });

  console.log();

  if (!allEnabled) {
    console.error('❌ Some tables have RLS disabled!');
  } else {
    console.log('✅ All critical tables have RLS enabled\n');
  }

  return statusMap;
}

async function checkPolicies(): Promise<boolean> {
  console.log('🔍 Checking RLS policies...\n');

  const { data, error } = await supabase.rpc('exec_sql', {
    query: `
      SELECT
        tablename,
        policyname,
        permissive,
        roles,
        cmd,
        qual,
        with_check
      FROM pg_policies
      WHERE tablename IN (${CRITICAL_TABLES.map(t => `'${t}'`).join(',')})
      ORDER BY tablename, policyname;
    `
  });

  if (error) {
    console.error('❌ Error fetching policies:', error.message);
    return false;
  }

  const policies = data as unknown as PolicyInfo[];
  const tableGroups = new Map<string, PolicyInfo[]>();

  // Group policies by table
  policies.forEach((policy) => {
    if (!tableGroups.has(policy.tablename)) {
      tableGroups.set(policy.tablename, []);
    }
    tableGroups.get(policy.tablename)!.push(policy);
  });

  // Check each table
  let allGood = true;
  CRITICAL_TABLES.forEach((tableName) => {
    const tablePolicies = tableGroups.get(tableName) || [];

    console.log(`📋 ${tableName}:`);

    if (tablePolicies.length === 0) {
      console.log('   ❌ NO POLICIES FOUND!\n');
      allGood = false;
      return;
    }

    // Check for service role bypass
    const hasServiceRole = tablePolicies.some(
      p => p.roles.includes('service_role')
    );

    if (!hasServiceRole) {
      console.log('   ⚠️  Missing service_role bypass policy');
      allGood = false;
    }

    // List all policies
    tablePolicies.forEach((policy) => {
      const icon = policy.roles.includes('service_role') ? '🔑' : '👥';
      console.log(`   ${icon} ${policy.policyname}`);
      console.log(`      Roles: ${policy.roles.join(', ')}`);
      console.log(`      Command: ${policy.cmd}`);
    });

    console.log();
  });

  return allGood;
}

async function checkRecentlyProtectedTables(): Promise<boolean> {
  console.log('🆕 Verifying recently protected tables...\n');

  const recentlyProtected = [
    'widget_config_versions',
    'domain_mappings',
    'demo_sessions'
  ];

  let allGood = true;

  for (const tableName of recentlyProtected) {
    const { data, error } = await supabase.rpc('exec_sql', {
      query: `
        SELECT policyname, roles, cmd
        FROM pg_policies
        WHERE tablename = '${tableName}'
        ORDER BY policyname;
      `
    });

    if (error) {
      console.error(`   ❌ Error checking ${tableName}:`, error.message);
      allGood = false;
      continue;
    }

    const policies = data as any[];

    console.log(`📌 ${tableName}:`);

    if (policies.length < 2) {
      console.log(`   ❌ Expected 2 policies, found ${policies.length}`);
      allGood = false;
    } else {
      console.log(`   ✅ Has ${policies.length} policies`);
      policies.forEach((p: any) => {
        console.log(`      - ${p.policyname}`);
      });
    }

    console.log();
  }

  return allGood;
}

async function generateReport(): Promise<void> {
  console.log('📄 Generating RLS Security Report...\n');

  const { data, error } = await supabase.rpc('exec_sql', {
    query: `
      SELECT
        t.tablename,
        t.rowsecurity,
        COUNT(p.policyname) as policy_count
      FROM pg_tables t
      LEFT JOIN pg_policies p ON p.tablename = t.tablename
      WHERE t.schemaname = 'public'
        AND t.tablename NOT LIKE 'pg_%'
        AND t.tablename NOT LIKE 'sql_%'
      GROUP BY t.tablename, t.rowsecurity
      ORDER BY t.rowsecurity DESC, policy_count DESC, t.tablename;
    `
  });

  if (error) {
    console.error('❌ Error generating report:', error.message);
    return;
  }

  const report = data as any[];

  console.log('┌─────────────────────────────────┬─────────────┬──────────────┐');
  console.log('│ Table Name                      │ RLS Enabled │ Policy Count │');
  console.log('├─────────────────────────────────┼─────────────┼──────────────┤');

  report.forEach((row: any) => {
    const name = row.tablename.padEnd(31);
    const rls = row.rowsecurity ? '✅ Yes     ' : '❌ No      ';
    const count = String(row.policy_count || 0).padStart(12);
    console.log(`│ ${name} │ ${rls} │ ${count} │`);
  });

  console.log('└─────────────────────────────────┴─────────────┴──────────────┘');
  console.log();

  // Summary
  const totalTables = report.length;
  const rlsEnabled = report.filter((r: any) => r.rowsecurity).length;
  const rlsDisabled = totalTables - rlsEnabled;

  console.log('📊 Summary:');
  console.log(`   Total tables: ${totalTables}`);
  console.log(`   RLS enabled: ${rlsEnabled} (${Math.round(rlsEnabled/totalTables*100)}%)`);

  if (rlsDisabled > 0) {
    console.log(`   ⚠️  RLS disabled: ${rlsDisabled} tables need review`);
  }

  console.log();
}

async function main() {
  console.log('🔒 RLS Policy Verification\n');
  console.log('='.repeat(50) + '\n');

  // Check RLS status
  const rlsStatus = await checkRLSStatus();

  // Check policies exist
  const policiesOk = await checkPolicies();

  // Check recently protected tables
  const recentOk = await checkRecentlyProtectedTables();

  // Generate full report
  await generateReport();

  // Final verdict
  if (rlsStatus.size > 0 && policiesOk && recentOk) {
    console.log('✅ RLS verification PASSED\n');
    process.exit(0);
  } else {
    console.log('❌ RLS verification FAILED - issues found above\n');
    process.exit(1);
  }
}

main().catch(console.error);
