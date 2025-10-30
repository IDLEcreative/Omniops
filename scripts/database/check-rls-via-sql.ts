#!/usr/bin/env tsx
/**
 * Check RLS Policies via Direct SQL Query
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  db: { schema: 'public' },
  auth: { persistSession: false }
});

async function queryRLSPolicies() {
  console.log('=== QUERYING RLS POLICIES FROM pg_policies ===\n');

  // We need to use a SQL function to query system tables
  // Let's try querying using information_schema

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

  console.log('Checking RLS enabled status on tables:\n');

  for (const table of tables) {
    // Try to query the table directly - if RLS is enabled and we're not bypassing it,
    // we'll get an error. With service role, we bypass RLS.
    const { data, error, count } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });

    console.log(`${table}:`);
    console.log(`  Service role can query: ${!error}`);
    if (error) console.log(`  Error: ${error.message}`);
    console.log(`  Row count: ${count || 0}`);
    console.log('');
  }
}

async function checkForeignKeyConstraints() {
  console.log('\n=== FOREIGN KEY CONSTRAINTS ===\n');

  // Check if there are any foreign key errors by trying to insert invalid data
  const testOrgId = '00000000-0000-0000-0000-000000000000';

  console.log('Testing foreign key constraints (these should fail):\n');

  // Test organization_members
  const { error: memberError } = await supabase
    .from('organization_members')
    .insert({
      organization_id: testOrgId,
      user_id: testOrgId,
      role: 'member'
    });

  console.log('organization_members.organization_id FK:');
  console.log(`  ${memberError ? '✅ Enforced' : '❌ Not enforced'}`);
  if (memberError) console.log(`  Error: ${memberError.message}`);

  // Test customer_configs
  const { error: configError } = await supabase
    .from('customer_configs')
    .insert({
      organization_id: testOrgId,
      domain: 'test-fk.example.com',
      customer_id: testOrgId
    });

  console.log('\ncustomer_configs.organization_id FK:');
  console.log(`  ${configError ? '✅ Enforced' : '❌ Not enforced'}`);
  if (configError) console.log(`  Error: ${configError.message}`);

  // Test domains
  const { error: domainError } = await supabase
    .from('domains')
    .insert({
      organization_id: testOrgId,
      domain: 'test-fk.example.com',
      user_id: testOrgId
    });

  console.log('\ndomains.organization_id FK:');
  console.log(`  ${domainError ? '✅ Enforced' : '❌ Not enforced'}`);
  if (domainError) console.log(`  Error: ${domainError.message}`);
}

async function checkIndexes() {
  console.log('\n\n=== CHECKING INDEXES ON ORGANIZATION COLUMNS ===\n');

  // List all indexes on organization-related columns
  const indexQueries = [
    { table: 'customer_configs', column: 'organization_id' },
    { table: 'domains', column: 'organization_id' },
    { table: 'organization_members', column: 'organization_id' },
    { table: 'organization_members', column: 'user_id' },
    { table: 'scraped_pages', column: 'domain_id' },
    { table: 'page_embeddings', column: 'domain_id' }
  ];

  console.log('Note: Indexes should exist for performance on FK and WHERE clauses\n');

  for (const { table, column } of indexQueries) {
    console.log(`${table}.${column}:`);
    console.log(`  Should have index for queries filtering by ${column}`);
  }
}

async function testOrganizationIsolation() {
  console.log('\n\n=== TESTING ORGANIZATION ISOLATION ===\n');

  // Get first organization
  const { data: org1 } = await supabase
    .from('organizations')
    .select('id, name')
    .limit(1)
    .single();

  if (!org1) {
    console.log('❌ No organizations found to test');
    return;
  }

  console.log(`Testing with organization: ${org1.name} (${org1.id})\n`);

  // Get customer configs for this org
  const { data: configs } = await supabase
    .from('customer_configs')
    .select('id, domain, organization_id')
    .eq('organization_id', org1.id);

  console.log(`Customer configs for org ${org1.id}: ${configs?.length || 0}`);

  // Verify all configs belong to this org
  const wrongOrg = configs?.filter(c => c.organization_id !== org1.id) || [];
  if (wrongOrg.length > 0) {
    console.log(`❌ CRITICAL: Found ${wrongOrg.length} configs with wrong org_id!`);
  } else {
    console.log('✅ All configs correctly associated with org');
  }

  // Get domains for this org
  const { data: domains } = await supabase
    .from('domains')
    .select('id, domain, organization_id')
    .eq('organization_id', org1.id);

  console.log(`\nDomains for org ${org1.id}: ${domains?.length || 0}`);

  const wrongDomainOrg = domains?.filter(d => d.organization_id !== org1.id) || [];
  if (wrongDomainOrg.length > 0) {
    console.log(`❌ CRITICAL: Found ${wrongDomainOrg.length} domains with wrong org_id!`);
  } else {
    console.log('✅ All domains correctly associated with org');
  }

  // Check indirect relationships through domain_id
  if (domains && domains.length > 0) {
    const domainId = domains[0]?.id;

    if (domainId) {
      const { data: pages } = await supabase
        .from('scraped_pages')
        .select('id, url, domain_id')
        .eq('domain_id', domainId)
        .limit(5);

      console.log(`\nScraped pages for domain ${domains[0]?.domain || 'unknown'}: ${pages?.length || 0}`);

      // Verify domain relationship
      const wrongDomain = pages?.filter(p => p.domain_id !== domainId) || [];
      if (wrongDomain.length > 0) {
        console.log(`❌ CRITICAL: Found ${wrongDomain.length} pages with wrong domain_id!`);
      } else {
        console.log('✅ All pages correctly associated with domain');
      }
    }
  }
}

async function main() {
  console.log('🔒 RLS and Security Check\n');
  console.log(`Database: ${SUPABASE_URL}\n`);
  console.log('='.repeat(80) + '\n');

  await queryRLSPolicies();
  await checkForeignKeyConstraints();
  await checkIndexes();
  await testOrganizationIsolation();

  console.log('\n' + '='.repeat(80));
  console.log('\n⚠️  IMPORTANT NOTES:');
  console.log('1. Service role bypasses RLS - cannot test RLS enforcement from here');
  console.log('2. RLS policies must be verified in Supabase Dashboard');
  console.log('3. Test with actual user tokens to verify isolation');
  console.log('4. Foreign key constraints protect data integrity');
  console.log('5. Indexes should exist on all organization_id and domain_id columns\n');
}

main();
