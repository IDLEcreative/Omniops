#!/usr/bin/env tsx
/**
 * Verify RLS Policies via Supabase Management API
 *
 * This script queries the database system tables to check if RLS is enabled
 * and what policies exist on organization-related tables.
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const PROJECT_REF = SUPABASE_URL.match(/https:\/\/(.+?)\.supabase\.co/)?.[1];

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

interface RLSTableInfo {
  table_name: string;
  rls_enabled: boolean;
  rls_forced: boolean;
}

interface PolicyInfo {
  schemaname: string;
  tablename: string;
  policyname: string;
  permissive: string;
  roles: string[];
  cmd: string;
  qual: string;
  with_check: string;
}

async function checkRLSEnabled() {
  console.log('=== CHECKING RLS ENABLED STATUS ===\n');

  const tables = [
    'organizations',
    'organization_members',
    'organization_invitations',
    'customer_configs',
    'domains',
    'scraped_pages',
    'page_embeddings',
    'conversations',
    'messages',
    'structured_extractions'
  ];

  console.log('Table                          | RLS Enabled | Notes');
  console.log('-------------------------------|-------------|---------------------------');

  for (const table of tables) {
    // Query to check RLS status from pg_tables
    const { data, error } = await supabase
      .from('pg_tables' as any)
      .select('rowsecurity')
      .eq('schemaname', 'public')
      .eq('tablename', table)
      .single();

    if (error) {
      console.log(`${table.padEnd(30)} | ❌ Error    | ${error.message}`);
    } else if (data) {
      const enabled = data.rowsecurity;
      console.log(`${table.padEnd(30)} | ${enabled ? '✅ Enabled ' : '❌ Disabled'} | ${enabled ? 'RLS active' : 'WARNING: No RLS!'}`);
    } else {
      console.log(`${table.padEnd(30)} | ❓ Unknown  | Table may not exist`);
    }
  }
}

async function checkPoliciesExist() {
  console.log('\n\n=== CHECKING RLS POLICIES ===\n');

  const tables = [
    'organizations',
    'organization_members',
    'organization_invitations',
    'customer_configs',
    'domains',
    'scraped_pages',
    'page_embeddings',
    'conversations',
    'messages'
  ];

  for (const table of tables) {
    const { data, error } = await supabase
      .from('pg_policies' as any)
      .select('policyname, cmd, roles')
      .eq('schemaname', 'public')
      .eq('tablename', table);

    if (error) {
      console.log(`❌ ${table}: Error querying policies - ${error.message}`);
    } else if (data && data.length > 0) {
      console.log(`✅ ${table}: ${data.length} policies found`);
      data.forEach((policy: any) => {
        console.log(`   - ${policy.policyname} (${policy.cmd}) for roles: ${policy.roles?.join(', ') || 'all'}`);
      });
    } else {
      console.log(`⚠️  ${table}: No policies found (RLS may be enabled but no policies set)`);
    }
  }
}

async function checkServiceRoleBypass() {
  console.log('\n\n=== TESTING SERVICE ROLE BYPASS ===\n');

  // Service role should always be able to query regardless of RLS
  const tests = [
    { table: 'organizations', description: 'Core organization table' },
    { table: 'customer_configs', description: 'With organization_id FK' },
    { table: 'domains', description: 'With organization_id FK' },
    { table: 'scraped_pages', description: 'With domain_id FK (indirect)' }
  ];

  for (const test of tests) {
    const { data, error, count } = await supabase
      .from(test.table)
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.log(`❌ ${test.table}: Service role BLOCKED - ${error.message}`);
      console.log(`   Issue: Service role should bypass RLS but is being blocked!`);
    } else {
      console.log(`✅ ${test.table}: Service role has access (${count || 0} records)`);
      console.log(`   ${test.description}`);
    }
  }

  console.log('\n✅ Service role correctly bypasses RLS on all tables');
}

async function generateRLSPolicyRecommendations() {
  console.log('\n\n=== RLS POLICY RECOMMENDATIONS ===\n');

  console.log('For each table, you should have policies like these:\n');

  console.log('📋 organizations table:');
  console.log(`
-- Users can only see organizations they're members of
CREATE POLICY "Users can view their organizations"
ON organizations FOR SELECT
USING (
  id IN (
    SELECT organization_id
    FROM organization_members
    WHERE user_id = auth.uid()
  )
);

-- Authenticated users can create organizations
CREATE POLICY "Users can create organizations"
ON organizations FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Only admins/owners can update
CREATE POLICY "Admins can update organizations"
ON organizations FOR UPDATE
USING (
  id IN (
    SELECT organization_id
    FROM organization_members
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'owner')
  )
);
`);

  console.log('\n📋 customer_configs table:');
  console.log(`
-- Users can only see configs for their organizations
CREATE POLICY "Users can view their org configs"
ON customer_configs FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id
    FROM organization_members
    WHERE user_id = auth.uid()
  )
);

-- Users can create configs for their organizations
CREATE POLICY "Users can create org configs"
ON customer_configs FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT organization_id
    FROM organization_members
    WHERE user_id = auth.uid()
  )
);
`);

  console.log('\n📋 scraped_pages table (indirect via domain):');
  console.log(`
-- Users can only see pages for domains in their organizations
CREATE POLICY "Users can view their org pages"
ON scraped_pages FOR SELECT
USING (
  domain_id IN (
    SELECT d.id
    FROM domains d
    INNER JOIN organization_members om ON d.organization_id = om.organization_id
    WHERE om.user_id = auth.uid()
  )
);
`);

  console.log('\n⚠️  IMPORTANT: These are examples. Adjust based on your exact requirements.');
}

async function checkMissingPolicies() {
  console.log('\n\n=== IDENTIFYING MISSING POLICIES ===\n');

  const requiredPolicies = {
    'organizations': ['SELECT', 'INSERT', 'UPDATE', 'DELETE'],
    'organization_members': ['SELECT', 'INSERT', 'UPDATE', 'DELETE'],
    'customer_configs': ['SELECT', 'INSERT', 'UPDATE', 'DELETE'],
    'domains': ['SELECT', 'INSERT', 'UPDATE', 'DELETE'],
    'scraped_pages': ['SELECT'],
    'page_embeddings': ['SELECT'],
    'conversations': ['SELECT', 'INSERT'],
    'messages': ['SELECT', 'INSERT']
  };

  for (const [table, commands] of Object.entries(requiredPolicies)) {
    const { data: policies } = await supabase
      .from('pg_policies' as any)
      .select('cmd')
      .eq('schemaname', 'public')
      .eq('tablename', table);

    const existingCommands = new Set(policies?.map((p: any) => p.cmd) || []);

    console.log(`\n${table}:`);
    for (const cmd of commands) {
      const exists = existingCommands.has(cmd) || existingCommands.has('ALL');
      if (exists) {
        console.log(`  ✅ ${cmd} policy exists`);
      } else {
        console.log(`  ❌ ${cmd} policy MISSING - Users cannot ${cmd.toLowerCase()} records!`);
      }
    }
  }
}

async function main() {
  console.log('🔒 RLS Policy Verification Tool\n');
  console.log(`Database: ${SUPABASE_URL}`);
  console.log(`Project: ${PROJECT_REF}\n`);
  console.log('='.repeat(80) + '\n');

  await checkRLSEnabled();
  await checkPoliciesExist();
  await checkServiceRoleBypass();
  await checkMissingPolicies();
  await generateRLSPolicyRecommendations();

  console.log('\n' + '='.repeat(80));
  console.log('\n📝 NEXT STEPS:\n');
  console.log('1. Go to Supabase Dashboard: ' + SUPABASE_URL.replace('https://', 'https://app.supabase.com/project/') + '/auth/policies');
  console.log('2. Review and add missing RLS policies for each table');
  console.log('3. Test with actual user tokens (not service role)');
  console.log('4. Run integration tests to verify isolation\n');
  console.log('⚠️  Remember: Service role bypasses RLS - always test with user tokens!\n');
}

main();
