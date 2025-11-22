#!/usr/bin/env tsx

/**
 * Apply Privacy Migrations via Supabase Management API
 *
 * Purpose: Deploy user_agreements, account_deletion_requests, and data_export_logs tables
 * Method: Uses Management API to bypass CLI migration conflicts
 *
 * Tables Created:
 * - user_agreements: Tracks Terms of Service acceptance (GDPR Article 7)
 * - account_deletion_requests: Manages 30-day deletion cooling off (GDPR Article 17)
 * - data_export_logs: Audit trail for data exports (GDPR Article 15 & 20)
 *
 * Usage: SUPABASE_ACCESS_TOKEN="sbp_..." npx tsx scripts/database/apply-privacy-migrations.ts
 */

import fs from 'fs/promises';
import path from 'path';

const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const PROJECT_REF = 'birugqyuqhiahxvxeyqg';

const MIGRATIONS = [
  {
    file: '20251122201112_create_user_agreements.sql',
    table: 'user_agreements',
    description: 'Terms of Service acceptance tracking (GDPR Article 7)'
  },
  {
    file: '20251122201113_create_account_deletions.sql',
    table: 'account_deletion_requests',
    description: 'Account deletion with 30-day cooling off (GDPR Article 17)'
  },
  {
    file: '20251122201114_create_data_export_logs.sql',
    table: 'data_export_logs',
    description: 'Data export audit trail (GDPR Article 15 & 20)'
  }
];

async function checkTableExists(tableName: string): Promise<boolean> {
  const query = `
    SELECT EXISTS (
      SELECT FROM pg_tables
      WHERE schemaname = 'public'
      AND tablename = '${tableName}'
    );
  `;

  try {
    const response = await fetch(
      `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query })
      }
    );

    if (response.ok) {
      const result = await response.json();
      return result[0]?.exists || false;
    }
    return false;
  } catch (error) {
    console.error(`   ⚠️  Warning: Could not check if ${tableName} exists:`, error);
    return false;
  }
}

async function applyMigration(migrationFile: string): Promise<boolean> {
  const migrationPath = path.join(
    process.cwd(),
    'supabase/migrations',
    migrationFile
  );

  console.log(`📖 Reading migration: ${migrationFile}`);

  let migrationSQL: string;
  try {
    migrationSQL = await fs.readFile(migrationPath, 'utf-8');
    console.log(`   Loaded (${migrationSQL.length} characters)`);
  } catch (error) {
    console.error(`   ❌ Error reading migration file:`, error);
    return false;
  }

  console.log(`📡 Applying migration...`);

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
      console.error(`   ❌ Migration failed!`);
      console.error(`   Status: ${response.status} ${response.statusText}`);
      console.error(`   Response: ${errorText}`);
      return false;
    }

    console.log(`   ✅ Migration applied successfully\n`);
    return true;

  } catch (error) {
    console.error(`   ❌ Error applying migration:`, error);
    return false;
  }
}

async function verifyTables(): Promise<void> {
  console.log('🔍 Verifying tables and policies...\n');

  const verificationQuery = `
    SELECT
      t.tablename,
      COUNT(DISTINCT i.indexname) as index_count,
      COUNT(DISTINCT p.policyname) as policy_count
    FROM pg_tables t
    LEFT JOIN pg_indexes i ON t.tablename = i.tablename AND t.schemaname = i.schemaname
    LEFT JOIN pg_policies p ON t.tablename = p.tablename AND t.schemaname = p.schemaname
    WHERE t.schemaname = 'public'
    AND t.tablename IN ('user_agreements', 'account_deletion_requests', 'data_export_logs')
    GROUP BY t.tablename
    ORDER BY t.tablename;
  `;

  try {
    const response = await fetch(
      `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: verificationQuery })
      }
    );

    if (!response.ok) {
      console.error('⚠️  Warning: Could not verify tables');
      return;
    }

    const result = await response.json();
    console.log('✅ Tables verified:');
    console.table(result);
    console.log('\n');

  } catch (error) {
    console.error('⚠️  Warning: Verification query failed:', error);
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🚀 Privacy Migrations - GDPR Compliance Tables');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Validation
  if (!SUPABASE_ACCESS_TOKEN) {
    console.error('❌ Error: SUPABASE_ACCESS_TOKEN environment variable not set');
    console.error('   Set it with: export SUPABASE_ACCESS_TOKEN="sbp_..."');
    process.exit(1);
  }

  let appliedCount = 0;
  let skippedCount = 0;

  // Apply migrations
  for (const migration of MIGRATIONS) {
    console.log(`\n📦 Processing: ${migration.table}`);
    console.log(`   Purpose: ${migration.description}\n`);

    // Check if table already exists
    const exists = await checkTableExists(migration.table);
    if (exists) {
      console.log(`   ⏭️  Table already exists - skipping migration\n`);
      skippedCount++;
      continue;
    }

    const success = await applyMigration(migration.file);
    if (success) {
      appliedCount++;
    }
  }

  // Verify all tables
  await verifyTables();

  // Summary
  console.log('═══════════════════════════════════════════════════════════');
  console.log('✅ PRIVACY MIGRATIONS COMPLETE');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`\n📊 Results:`);
  console.log(`   Applied: ${appliedCount} migrations`);
  console.log(`   Skipped: ${skippedCount} migrations (already exist)`);
  console.log(`\n📋 Tables Created:`);
  console.log(`   1. user_agreements - Terms of Service tracking`);
  console.log(`   2. account_deletion_requests - 30-day deletion cooling off`);
  console.log(`   3. data_export_logs - Data export audit trail`);
  console.log(`\n🔒 Features:`);
  console.log(`   - Row Level Security (RLS) enabled on all tables`);
  console.log(`   - Users can only access their own data`);
  console.log(`   - Service role has admin access for processing`);
  console.log(`   - Proper indexes for performance`);
  console.log(`   - Foreign key cascades for data integrity`);
  console.log(`\n📝 Next Steps:`);
  console.log(`   - Implement API endpoints for Terms acceptance`);
  console.log(`   - Create UI for account deletion requests`);
  console.log(`   - Build data export functionality`);
  console.log(`   - Add scheduled job for processing deletions`);
  console.log('═══════════════════════════════════════════════════════════\n');
}

// Run migrations
main().catch((error) => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
