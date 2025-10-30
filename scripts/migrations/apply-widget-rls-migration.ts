#!/usr/bin/env tsx

/**
 * Apply Widget RLS Migration
 *
 * This script applies the corrected RLS policies for widget tables using the Supabase Management API.
 * It reads the migration file and executes it directly in the database.
 *
 * Run: npx tsx apply-widget-rls-migration.ts
 */

import { readFileSync } from 'fs';
import { join } from 'path';

// Supabase configuration
const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const PROJECT_REF = 'birugqyuqhiahxvxeyqg';

if (!SUPABASE_ACCESS_TOKEN) {
  console.error('❌ Missing SUPABASE_ACCESS_TOKEN environment variable');
  console.error('');
  console.error('Get your access token from:');
  console.error('https://supabase.com/dashboard/account/tokens');
  console.error('');
  console.error('Then set it:');
  console.error('export SUPABASE_ACCESS_TOKEN="sbp_..."');
  process.exit(1);
}

async function applyMigration() {
  console.log('════════════════════════════════════════════════════════════════');
  console.log('  Widget Tables RLS Migration Application');
  console.log('  Migration: 20251028_fix_widget_rls_policies.sql');
  console.log('════════════════════════════════════════════════════════════════');
  console.log();

  // Read migration file
  console.log('📖 Reading migration file...');
  const migrationPath = join(__dirname, 'supabase', 'migrations', '20251028_fix_widget_rls_policies.sql');
  let migrationSQL: string;

  try {
    migrationSQL = readFileSync(migrationPath, 'utf-8');
    console.log(`✅ Loaded migration (${migrationSQL.length} characters)`);
  } catch (error: any) {
    console.error(`❌ Failed to read migration file: ${error.message}`);
    console.error(`   Path: ${migrationPath}`);
    process.exit(1);
  }

  // Execute migration via Supabase Management API
  console.log();
  console.log('🚀 Applying migration to database...');
  console.log(`   Project: ${PROJECT_REF}`);
  console.log();

  try {
    const response = await fetch(
      `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: migrationSQL })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();

    console.log('✅ Migration applied successfully!');
    console.log();

    // Check if there are any notices (our verification output)
    if (result.notices && result.notices.length > 0) {
      console.log('📋 Migration Output:');
      result.notices.forEach((notice: string) => {
        console.log(`   ${notice}`);
      });
      console.log();
    }

  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    console.error();
    console.error('Common issues:');
    console.error('  1. Invalid access token - check SUPABASE_ACCESS_TOKEN');
    console.error('  2. Insufficient permissions - ensure token has database access');
    console.error('  3. Syntax error in migration - review the SQL file');
    console.error();
    process.exit(1);
  }

  // Next steps
  console.log('════════════════════════════════════════════════════════════════');
  console.log('  Next Steps');
  console.log('════════════════════════════════════════════════════════════════');
  console.log();
  console.log('1. Verify migration success:');
  console.log('   npx tsx verify-widget-rls.ts');
  console.log();
  console.log('2. Test widget features in the application');
  console.log();
  console.log('3. Review security advisors in Supabase dashboard:');
  console.log(`   https://supabase.com/dashboard/project/${PROJECT_REF}/advisors/security`);
  console.log();
  console.log('════════════════════════════════════════════════════════════════');
}

applyMigration().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
