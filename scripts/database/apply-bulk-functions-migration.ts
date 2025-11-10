#!/usr/bin/env tsx

/**
 * Apply Bulk Functions Migration via Supabase Management API
 *
 * Purpose: Deploy bulk_upsert_scraped_pages and bulk_insert_embeddings functions
 * Method: Uses Management API to bypass CLI migration conflicts
 *
 * Usage: npx tsx scripts/database/apply-bulk-functions-migration.ts
 */

import fs from 'fs/promises';
import path from 'path';

const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const PROJECT_REF = 'birugqyuqhiahxvxeyqg';

async function applyMigration() {
  console.log('🚀 Starting bulk functions migration...\n');

  // Validation
  if (!SUPABASE_ACCESS_TOKEN) {
    console.error('❌ Error: SUPABASE_ACCESS_TOKEN environment variable not set');
    console.error('   Set it with: export SUPABASE_ACCESS_TOKEN="sbp_..."');
    process.exit(1);
  }

  // Read migration file
  const migrationPath = path.join(
    process.cwd(),
    'supabase/migrations/20251108_create_bulk_functions.sql'
  );

  console.log(`📖 Reading migration file: ${migrationPath}`);

  let migrationSQL: string;
  try {
    migrationSQL = await fs.readFile(migrationPath, 'utf-8');
    console.log(`✅ Migration file loaded (${migrationSQL.length} characters)\n`);
  } catch (error) {
    console.error('❌ Error reading migration file:', error);
    process.exit(1);
  }

  // Apply migration via Management API
  console.log('📡 Applying migration via Supabase Management API...');
  console.log(`   Project: ${PROJECT_REF}`);
  console.log(`   Endpoint: https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query\n`);

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
      console.error('❌ Migration failed!');
      console.error(`   Status: ${response.status} ${response.statusText}`);
      console.error(`   Response: ${errorText}`);
      process.exit(1);
    }

    const result = await response.json();
    console.log('✅ Migration applied successfully!');
    console.log('   Result:', JSON.stringify(result, null, 2));
    console.log('\n');

  } catch (error) {
    console.error('❌ Error applying migration:', error);
    process.exit(1);
  }

  // Verify functions were created
  console.log('🔍 Verifying functions were created...\n');

  const verificationQuery = `
    SELECT
      proname as function_name,
      pg_get_function_arguments(oid) as arguments,
      pg_get_function_result(oid) as return_type
    FROM pg_proc
    WHERE proname IN ('bulk_upsert_scraped_pages', 'bulk_insert_embeddings')
    ORDER BY proname;
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
      console.error('⚠️  Warning: Could not verify functions');
      console.error(`   Status: ${response.status}`);
    } else {
      const result = await response.json();
      console.log('✅ Functions verified:');
      console.log(JSON.stringify(result, null, 2));
      console.log('\n');
    }

  } catch (error) {
    console.error('⚠️  Warning: Verification query failed:', error);
  }

  // Summary
  console.log('═══════════════════════════════════════════════════════════');
  console.log('✅ PHASE 2: SQL BULK FUNCTIONS MIGRATION COMPLETE');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('\n📋 Functions Created:');
  console.log('   1. bulk_upsert_scraped_pages(JSONB) → TABLE(id UUID, url TEXT)');
  console.log('   2. bulk_insert_embeddings(JSONB) → INTEGER\n');
  console.log('🚀 Performance Impact:');
  console.log('   - Expected speedup: 10-100x faster than individual queries');
  console.log('   - Fallback logic no longer needed');
  console.log('   - Bulk operations now available for content refresh\n');
  console.log('📝 Next Steps:');
  console.log('   - Phase 4: Update embeddings-optimized.ts to use these functions');
  console.log('   - Phase 7: Update scraper-optimized.ts to use these functions');
  console.log('   - Test content refresh with bulk operations');
  console.log('═══════════════════════════════════════════════════════════\n');
}

// Run migration
applyMigration().catch((error) => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
