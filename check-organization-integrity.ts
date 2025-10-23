#!/usr/bin/env tsx
/**
 * Comprehensive Database Integrity Check for Organization Migration
 *
 * Checks:
 * 1. NULL organization_ids in critical tables
 * 2. RLS policies for organization-based tables
 * 3. Orphaned records without valid organization references
 * 4. Cross-organization data isolation
 * 5. Foreign key relationships
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

interface IntegrityIssue {
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  category: string;
  table?: string;
  issue: string;
  count?: number;
  details?: any;
  recommendation: string;
}

const issues: IntegrityIssue[] = [];

async function checkNullOrganizationIds() {
  console.log('\n=== 1. CHECKING FOR NULL organization_ids ===\n');

  const tablesToCheck = [
    'customer_configs',
    'domains',
    'scraped_pages',
    'page_embeddings',
    'conversations',
    'messages',
    'structured_extractions'
  ];

  for (const table of tablesToCheck) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('id', { count: 'exact', head: false })
        .is('organization_id', null);

      if (error) {
        console.log(`❌ Error checking ${table}: ${error.message}`);
        issues.push({
          severity: 'HIGH',
          category: 'NULL_CHECK_ERROR',
          table,
          issue: `Failed to check for NULL organization_ids: ${error.message}`,
          recommendation: 'Verify table exists and has organization_id column'
        });
        continue;
      }

      const count = data?.length || 0;
      if (count > 0) {
        console.log(`❌ ${table}: ${count} records with NULL organization_id`);
        issues.push({
          severity: 'CRITICAL',
          category: 'NULL_ORGANIZATION_ID',
          table,
          issue: `${count} records have NULL organization_id`,
          count,
          recommendation: 'Run migration to populate organization_id from user relationships or delete orphaned records'
        });
      } else {
        console.log(`✅ ${table}: No NULL organization_ids`);
      }
    } catch (e: any) {
      console.log(`⚠️  ${table}: Table may not have organization_id column - ${e.message}`);
    }
  }
}

async function checkRLSPolicies() {
  console.log('\n=== 2. CHECKING RLS POLICIES ===\n');

  // Query pg_policies directly via raw SQL
  try {
    const query = `
      SELECT
        schemaname,
        tablename,
        policyname,
        permissive,
        roles,
        cmd
      FROM pg_policies
      WHERE schemaname = 'public'
      ORDER BY tablename, policyname;
    `;

    // Use supabase-js to execute query (service role can query pg_policies)
    const { data: pgPolicies, error: pgError } = await supabase
      .from('pg_policies' as any)
      .select('*');

    if (pgError) {
      console.log('⚠️  Could not fetch RLS policies directly, checking table RLS status...\n');

      // Check if RLS is enabled on key tables
      const orgTables = [
        'organizations',
        'organization_members',
        'organization_invitations',
        'customer_configs',
        'domains',
        'scraped_pages',
        'page_embeddings'
      ];

      for (const table of orgTables) {
        const { data, error } = await supabase
          .from(table)
          .select('id', { count: 'exact', head: true });

        console.log(`Table: ${table} - ${error ? 'Has RLS/Access Controls' : 'Accessible (may need RLS)'}`);
      }
    } else {
      console.log('📋 RLS Policies Found:\n');
      console.log(JSON.stringify(pgPolicies, null, 2));
    }
  } catch (e: any) {
    console.log('⚠️  Error querying policies:', e.message);
  }

  // Expected policies for organization tables
  const expectedPolicies = {
    'organizations': ['select', 'insert', 'update', 'delete'],
    'organization_members': ['select', 'insert', 'update', 'delete'],
    'organization_invitations': ['select', 'insert', 'update', 'delete'],
    'customer_configs': ['select', 'insert', 'update', 'delete'],
    'domains': ['select', 'insert', 'update', 'delete'],
    'scraped_pages': ['select', 'insert', 'update', 'delete'],
    'page_embeddings': ['select', 'insert', 'update', 'delete']
  };

  console.log('\n⚠️  Manual verification needed for RLS policies on organization tables');
  issues.push({
    severity: 'HIGH',
    category: 'RLS_VERIFICATION',
    issue: 'RLS policies require manual verification',
    recommendation: 'Check Supabase Dashboard > Authentication > Policies to ensure organization-based RLS is in place'
  });
}

async function checkOrphanedRecords() {
  console.log('\n=== 3. CHECKING FOR ORPHANED RECORDS ===\n');

  // Check customer_configs without valid organization
  console.log('Checking customer_configs for orphaned records...');
  const configs = await supabase.from('customer_configs').select('id, organization_id');
  const orgs = await supabase.from('organizations').select('id');
  const orgIds = new Set(orgs.data?.map(o => o.id) || []);
  const orphanedConfigs = configs.data?.filter(c => c.organization_id && !orgIds.has(c.organization_id)) || [];
  const orphanedConfigsCount = orphanedConfigs.length;

  if (orphanedConfigsCount > 0) {
    console.log(`❌ Found ${orphanedConfigsCount} orphaned customer_configs`);
    issues.push({
      severity: 'HIGH',
      category: 'ORPHANED_RECORDS',
      table: 'customer_configs',
      issue: `${orphanedConfigsCount} records reference non-existent organizations`,
      count: orphanedConfigsCount,
      recommendation: 'Delete orphaned records or create missing organization references'
    });
  } else {
    console.log('✅ No orphaned customer_configs');
  }

  // Check domains without valid organization
  console.log('Checking domains for orphaned records...');
  const domains = await supabase.from('domains').select('id, organization_id');
  const orphanedDomains = domains.data?.filter(d => d.organization_id && !orgIds.has(d.organization_id)) || [];
  const orphanedDomainsCount = orphanedDomains.length;

  if (orphanedDomainsCount > 0) {
    console.log(`❌ Found ${orphanedDomainsCount} orphaned domains`);
    issues.push({
      severity: 'HIGH',
      category: 'ORPHANED_RECORDS',
      table: 'domains',
      issue: `${orphanedDomainsCount} records reference non-existent organizations`,
      count: orphanedDomainsCount,
      recommendation: 'Delete orphaned records or create missing organization references'
    });
  } else {
    console.log('✅ No orphaned domains');
  }

  // Check scraped_pages without valid domain
  console.log('Checking scraped_pages for orphaned records...');
  const { data: scrapedPages } = await supabase
    .from('scraped_pages')
    .select('id, domain_id')
    .limit(1000);

  const { data: validDomains } = await supabase
    .from('domains')
    .select('id');

  const validDomainIds = new Set(validDomains?.map(d => d.id) || []);
  const orphanedPages = scrapedPages?.filter(p => p.domain_id && !validDomainIds.has(p.domain_id)) || [];

  if (orphanedPages.length > 0) {
    console.log(`❌ Found ${orphanedPages.length} orphaned scraped_pages (sample of first 1000)`);
    issues.push({
      severity: 'MEDIUM',
      category: 'ORPHANED_RECORDS',
      table: 'scraped_pages',
      issue: `At least ${orphanedPages.length} records reference non-existent domains`,
      count: orphanedPages.length,
      recommendation: 'Delete orphaned scraped_pages records'
    });
  } else {
    console.log('✅ No orphaned scraped_pages (in sample)');
  }
}

async function checkCrossOrganizationIsolation() {
  console.log('\n=== 4. CHECKING CROSS-ORGANIZATION DATA ISOLATION ===\n');

  // Get all organizations
  const { data: orgs, error: orgError } = await supabase
    .from('organizations')
    .select('id, name')
    .limit(10);

  if (!orgs || orgs.length === 0) {
    console.log('⚠️  No organizations found to test isolation');
    issues.push({
      severity: 'MEDIUM',
      category: 'ISOLATION_TEST',
      issue: 'No organizations exist to test cross-organization isolation',
      recommendation: 'Create test organizations and verify RLS policies'
    });
    return;
  }

  console.log(`Found ${orgs.length} organizations to test\n`);

  // Test if customer_configs are properly isolated
  for (const org of orgs) {
    const { data: configs, error } = await supabase
      .from('customer_configs')
      .select('id, organization_id, domain')
      .eq('organization_id', org.id);

    console.log(`Org "${org.name}" (${org.id}): ${configs?.length || 0} customer_configs`);

    // Check if any configs belong to other orgs
    const wrongOrg = configs?.filter(c => c.organization_id !== org.id) || [];
    if (wrongOrg.length > 0) {
      console.log(`❌ Found ${wrongOrg.length} configs with mismatched organization_id!`);
      issues.push({
        severity: 'CRITICAL',
        category: 'DATA_ISOLATION_BREACH',
        table: 'customer_configs',
        issue: `Query for org ${org.id} returned configs from other organizations`,
        count: wrongOrg.length,
        recommendation: 'URGENT: Review and fix RLS policies - data isolation is broken'
      });
    }
  }

  console.log('\n✅ Basic isolation test completed (service role has full access)');
  console.log('⚠️  NOTE: Service role bypasses RLS - need to test with authenticated user tokens');

  issues.push({
    severity: 'HIGH',
    category: 'ISOLATION_TEST',
    issue: 'Cross-organization isolation tests require authenticated user tokens',
    recommendation: 'Create test users for each org and verify they cannot access other orgs data'
  });
}

async function checkForeignKeyRelationships() {
  console.log('\n=== 5. CHECKING FOREIGN KEY RELATIONSHIPS ===\n');

  const checks = [
    {
      table: 'organization_members',
      fk: 'organization_id',
      references: 'organizations'
    },
    {
      table: 'organization_invitations',
      fk: 'organization_id',
      references: 'organizations'
    },
    {
      table: 'customer_configs',
      fk: 'organization_id',
      references: 'organizations'
    },
    {
      table: 'domains',
      fk: 'organization_id',
      references: 'organizations'
    },
    {
      table: 'scraped_pages',
      fk: 'domain_id',
      references: 'domains'
    },
    {
      table: 'page_embeddings',
      fk: 'domain_id',
      references: 'domains'
    }
  ];

  for (const check of checks) {
    console.log(`\nChecking ${check.table}.${check.fk} -> ${check.references}`);

    // Simple existence check
    const { data: records } = await supabase
      .from(check.table)
      .select(`id, ${check.fk}`)
      .limit(5);

    if (records && records.length > 0) {
      const sample = records[0];
      const fkValue = sample?.[check.fk as keyof typeof sample];

      if (fkValue) {
        const { data: referenced } = await supabase
          .from(check.references)
          .select('id')
          .eq('id', fkValue)
          .single();

        if (referenced) {
          console.log(`✅ Valid FK relationship verified (sample)`);
        } else {
          console.log(`❌ FK references non-existent ${check.references} record`);
          issues.push({
            severity: 'HIGH',
            category: 'FOREIGN_KEY_VIOLATION',
            table: check.table,
            issue: `Foreign key ${check.fk} references non-existent ${check.references}`,
            recommendation: 'Add proper foreign key constraints with CASCADE rules'
          });
        }
      } else {
        console.log(`⚠️  Sample record has NULL ${check.fk}`);
      }
    } else {
      console.log(`ℹ️  Table ${check.table} is empty`);
    }
  }
}

async function generateReport() {
  console.log('\n\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║                  INTEGRITY CHECK REPORT                      ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  if (issues.length === 0) {
    console.log('✅ NO ISSUES FOUND - Database integrity looks good!\n');
    return;
  }

  // Group by severity
  const critical = issues.filter(i => i.severity === 'CRITICAL');
  const high = issues.filter(i => i.severity === 'HIGH');
  const medium = issues.filter(i => i.severity === 'MEDIUM');
  const low = issues.filter(i => i.severity === 'LOW');

  console.log(`📊 SUMMARY: ${issues.length} issues found\n`);
  console.log(`   🔴 CRITICAL: ${critical.length}`);
  console.log(`   🟠 HIGH:     ${high.length}`);
  console.log(`   🟡 MEDIUM:   ${medium.length}`);
  console.log(`   🟢 LOW:      ${low.length}\n`);

  // Detailed issues
  for (const severity of ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']) {
    const severityIssues = issues.filter(i => i.severity === severity);
    if (severityIssues.length === 0) continue;

    const icon = severity === 'CRITICAL' ? '🔴' : severity === 'HIGH' ? '🟠' : severity === 'MEDIUM' ? '🟡' : '🟢';
    console.log(`\n${icon} ${severity} ISSUES (${severityIssues.length}):\n`);
    console.log('─'.repeat(80));

    severityIssues.forEach((issue, idx) => {
      console.log(`\n${idx + 1}. [${issue.category}] ${issue.table ? `Table: ${issue.table}` : ''}`);
      console.log(`   Issue: ${issue.issue}`);
      if (issue.count) console.log(`   Count: ${issue.count}`);
      console.log(`   ➜ ${issue.recommendation}`);
    });
  }

  console.log('\n' + '═'.repeat(80) + '\n');
}

async function main() {
  console.log('🔍 Starting Comprehensive Database Integrity Check...\n');
  console.log(`Database: ${SUPABASE_URL}\n`);

  try {
    await checkNullOrganizationIds();
    await checkRLSPolicies();
    await checkOrphanedRecords();
    await checkCrossOrganizationIsolation();
    await checkForeignKeyRelationships();
    await generateReport();
  } catch (error) {
    console.error('\n❌ Fatal error during integrity check:', error);
    process.exit(1);
  }
}

main();
