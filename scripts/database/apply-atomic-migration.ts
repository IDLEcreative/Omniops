/**
 * Apply Atomic Transaction Migration
 *
 * Purpose: Apply atomic_page_with_embeddings function to database
 *
 * What it does:
 * 1. Reads migration SQL file
 * 2. Applies to production database via Management API
 * 3. Verifies function was created successfully
 *
 * Usage:
 *   SUPABASE_ACCESS_TOKEN=sbp_xxx npx tsx scripts/database/apply-atomic-migration.ts
 *
 * Requirements:
 * - SUPABASE_ACCESS_TOKEN environment variable
 * - Migration file exists: supabase/migrations/20251108_atomic_page_embeddings.sql
 *
 * Last Updated: 2025-11-08
 */

import * as fs from 'fs/promises';
import * as path from 'path';

const RESET = '\x1b[0m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';

function log(message: string, color: string = RESET) {
  console.log(`${color}${message}${RESET}`);
}

async function applyAtomicMigration() {
  const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
  const PROJECT_REF = 'birugqyuqhiahxvxeyqg';

  if (!SUPABASE_ACCESS_TOKEN) {
    log('❌ SUPABASE_ACCESS_TOKEN environment variable not set', RED);
    log('   Set it with: export SUPABASE_ACCESS_TOKEN=sbp_...', YELLOW);
    process.exit(1);
  }

  log('\n🚀 Applying Atomic Transaction Migration', BLUE);
  log('═══════════════════════════════════════════\n', BLUE);

  // Step 1: Read migration file
  log('📝 Reading migration file...', YELLOW);
  const migrationPath = path.join(
    process.cwd(),
    'supabase/migrations/20251108_atomic_page_embeddings.sql'
  );

  let migrationSQL: string;
  try {
    migrationSQL = await fs.readFile(migrationPath, 'utf-8');
    log(`✅ Migration file loaded (${migrationSQL.length} bytes)`, GREEN);
  } catch (error) {
    log('❌ Failed to read migration file:', RED);
    log(`   ${error}`, RED);
    log(`   Path: ${migrationPath}`, YELLOW);
    process.exit(1);
  }

  // Step 2: Apply migration
  log('\n🔧 Applying migration to database...', YELLOW);
  try {
    const response = await fetch(
      `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${SUPABASE_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: migrationSQL }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      log('❌ Migration failed:', RED);
      log(`   Status: ${response.status} ${response.statusText}`, RED);
      log(`   Response: ${errorText}`, RED);
      process.exit(1);
    }

    const responseData = await response.json();
    log('✅ Migration applied successfully', GREEN);

    // Log any notices or warnings from PostgreSQL
    if (responseData && Array.isArray(responseData)) {
      log(`   Rows affected: ${responseData.length}`, GREEN);
    }
  } catch (error) {
    log('❌ Exception while applying migration:', RED);
    log(`   ${error}`, RED);
    process.exit(1);
  }

  // Step 3: Verify function exists
  log('\n🔍 Verifying function registration...', YELLOW);
  const verifySQL = `
    SELECT
      routine_name,
      routine_type,
      data_type as return_type,
      routine_definition
    FROM information_schema.routines
    WHERE routine_name = 'atomic_page_with_embeddings'
      AND routine_schema = 'public';
  `;

  try {
    const verifyResponse = await fetch(
      `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${SUPABASE_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: verifySQL }),
      }
    );

    if (!verifyResponse.ok) {
      log('⚠️  Could not verify function (non-critical):', YELLOW);
      log(`   Status: ${verifyResponse.status}`, YELLOW);
    } else {
      const verifyData = await verifyResponse.json();

      if (verifyData && Array.isArray(verifyData) && verifyData.length > 0) {
        log('✅ Function registered in database:', GREEN);
        log(`   Name: ${verifyData[0].routine_name}`, GREEN);
        log(`   Type: ${verifyData[0].routine_type}`, GREEN);
        log(`   Returns: ${verifyData[0].return_type}`, GREEN);
      } else {
        log('❌ Function not found after migration!', RED);
        log('   This may indicate a problem with the migration.', RED);
        process.exit(1);
      }
    }
  } catch (error) {
    log('⚠️  Exception during verification (non-critical):', YELLOW);
    log(`   ${error}`, YELLOW);
  }

  // Step 4: Check function parameters
  log('\n📋 Checking function parameters...', YELLOW);
  const paramsSQL = `
    SELECT
      parameter_name,
      parameter_mode,
      data_type
    FROM information_schema.parameters
    WHERE specific_name IN (
      SELECT specific_name
      FROM information_schema.routines
      WHERE routine_name = 'atomic_page_with_embeddings'
        AND routine_schema = 'public'
    )
    ORDER BY ordinal_position;
  `;

  try {
    const paramsResponse = await fetch(
      `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${SUPABASE_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: paramsSQL }),
      }
    );

    if (paramsResponse.ok) {
      const paramsData = await paramsResponse.json();
      if (paramsData && Array.isArray(paramsData) && paramsData.length > 0) {
        log('✅ Function parameters:', GREEN);
        paramsData.forEach((param: any) => {
          log(
            `   - ${param.parameter_name || 'return'} (${param.parameter_mode}): ${param.data_type}`,
            GREEN
          );
        });
      }
    }
  } catch (error) {
    log('⚠️  Could not fetch parameters (non-critical)', YELLOW);
  }

  // Success summary
  log('\n═══════════════════════════════════════════', GREEN);
  log('✅ Migration Complete', GREEN);
  log('═══════════════════════════════════════════', GREEN);
  log('\n📚 Next Steps:', BLUE);
  log('   1. Run tests: npx tsx scripts/tests/test-atomic-transaction.ts', BLUE);
  log('   2. Verify in Supabase Dashboard → Database → Functions', BLUE);
  log('   3. Integrate into worker (see docs/10-ANALYSIS/ANALYSIS_TRANSACTION_INTEGRATION.md)', BLUE);
  log('');
}

applyAtomicMigration().catch((error) => {
  log('\n💥 Unhandled error:', RED);
  console.error(error);
  process.exit(1);
});
