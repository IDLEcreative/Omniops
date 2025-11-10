#!/usr/bin/env tsx

/**
 * Apply RLS Policies to Unprotected Tables
 *
 * This script applies Row Level Security policies to 3 tables that were
 * previously exposed without protection:
 * 1. widget_config_versions
 * 2. domain_mappings
 * 3. demo_sessions
 *
 * Usage:
 *   npx tsx scripts/database/apply-rls-policies.ts
 *
 * What it does:
 * - Enables RLS on each table
 * - Creates service_role bypass policies
 * - Creates tenant-isolation policies based on organization membership
 *
 * Note: Requires SUPABASE_SERVICE_ROLE_KEY in environment
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', SUPABASE_URL ? '✓' : '✗');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_ROLE_KEY ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface MigrationFile {
  filename: string;
  path: string;
  table: string;
}

const migrations: MigrationFile[] = [
  {
    filename: '20250108000001_add_rls_widget_config_versions.sql',
    path: path.join(__dirname, '../../supabase/migrations/20250108000001_add_rls_widget_config_versions.sql'),
    table: 'widget_config_versions'
  },
  {
    filename: '20250108000002_add_rls_domain_mappings.sql',
    path: path.join(__dirname, '../../supabase/migrations/20250108000002_add_rls_domain_mappings.sql'),
    table: 'domain_mappings'
  },
  {
    filename: '20250108000003_add_rls_demo_sessions.sql',
    path: path.join(__dirname, '../../supabase/migrations/20250108000003_add_rls_demo_sessions.sql'),
    table: 'demo_sessions'
  }
];

async function checkCurrentRLS() {
  console.log('📊 Checking current RLS status...\n');

  const { data, error } = await supabase.rpc('exec_sql', {
    query: `
      SELECT
        tablename,
        rowsecurity
      FROM pg_tables
      WHERE tablename IN ('widget_config_versions', 'domain_mappings', 'demo_sessions')
      ORDER BY tablename;
    `
  });

  if (error) {
    console.error('❌ Error checking RLS status:', error.message);
    return false;
  }

  if (data && Array.isArray(data)) {
    data.forEach((row: any) => {
      const status = row.rowsecurity ? '✓ Enabled' : '✗ Disabled';
      console.log(`   ${row.tablename}: ${status}`);
    });
    console.log();
  }

  return true;
}

async function applyMigration(migration: MigrationFile): Promise<boolean> {
  console.log(`📝 Applying migration for ${migration.table}...`);

  if (!fs.existsSync(migration.path)) {
    console.error(`   ❌ Migration file not found: ${migration.path}`);
    return false;
  }

  const sql = fs.readFileSync(migration.path, 'utf-8');

  // Execute the migration SQL
  const { error } = await supabase.rpc('exec_sql', {
    query: sql
  });

  if (error) {
    console.error(`   ❌ Error applying migration: ${error.message}`);
    return false;
  }

  console.log(`   ✓ Successfully applied RLS policies for ${migration.table}`);
  return true;
}

async function verifyPolicies() {
  console.log('\n🔍 Verifying RLS policies...\n');

  const { data, error } = await supabase.rpc('exec_sql', {
    query: `
      SELECT
        tablename,
        policyname,
        roles,
        cmd
      FROM pg_policies
      WHERE tablename IN ('widget_config_versions', 'domain_mappings', 'demo_sessions')
      ORDER BY tablename, policyname;
    `
  });

  if (error) {
    console.error('❌ Error verifying policies:', error.message);
    return false;
  }

  if (data && Array.isArray(data)) {
    let currentTable = '';
    data.forEach((row: any) => {
      if (row.tablename !== currentTable) {
        currentTable = row.tablename;
        console.log(`\n📋 ${currentTable}:`);
      }
      console.log(`   ✓ ${row.policyname} (${row.cmd})`);
    });
    console.log();
  }

  return true;
}

async function main() {
  console.log('🔒 RLS Policy Application Script\n');
  console.log('=' .repeat(50) + '\n');

  // Check current status
  const statusOk = await checkCurrentRLS();
  if (!statusOk) {
    process.exit(1);
  }

  // Apply migrations
  console.log('🚀 Applying RLS migrations...\n');
  let allSucceeded = true;

  for (const migration of migrations) {
    const success = await applyMigration(migration);
    if (!success) {
      allSucceeded = false;
    }
  }

  if (!allSucceeded) {
    console.error('\n❌ Some migrations failed. Please check errors above.');
    process.exit(1);
  }

  // Verify policies were created
  await verifyPolicies();

  console.log('✅ All RLS policies successfully applied!\n');
  console.log('📊 Summary:');
  console.log('   - widget_config_versions: Protected by organization membership');
  console.log('   - domain_mappings: Protected by domain ownership');
  console.log('   - demo_sessions: Public access (session-based validation)');
  console.log();
}

main().catch(console.error);
