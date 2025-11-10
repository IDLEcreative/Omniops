/**
 * Apply Autonomous Operations System Migration
 *
 * Uses Supabase Management API to execute SQL directly
 */

import fs from 'fs';
import path from 'path';

const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const PROJECT_REF = 'birugqyuqhiahxvxeyqg';

if (!SUPABASE_ACCESS_TOKEN) {
  console.error('❌ SUPABASE_ACCESS_TOKEN environment variable required');
  process.exit(1);
}

async function applyMigration() {
  try {
    // Read migration SQL
    const migrationPath = path.join(
      process.cwd(),
      'supabase/migrations/20251110000000_autonomous_operations_system.sql'
    );

    console.log('📖 Reading migration file...');
    const sql = fs.readFileSync(migrationPath, 'utf-8');

    console.log('🚀 Applying migration to Supabase...');
    console.log(`   Project: ${PROJECT_REF}`);
    console.log(`   SQL Length: ${sql.length} characters`);

    const response = await fetch(
      `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: sql })
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ Migration failed:');
      console.error(JSON.stringify(result, null, 2));
      process.exit(1);
    }

    console.log('✅ Migration applied successfully!');
    console.log('\n📊 Result:', JSON.stringify(result, null, 2));

    // Verify tables were created
    console.log('\n🔍 Verifying tables...');
    const verifyResponse = await fetch(
      `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `
            SELECT table_name
            FROM information_schema.tables
            WHERE table_name IN (
              'autonomous_operations',
              'autonomous_operations_audit',
              'autonomous_credentials',
              'autonomous_consent'
            )
            ORDER BY table_name;
          `
        })
      }
    );

    const verifyResult = await verifyResponse.json();

    if (verifyResult.length === 4) {
      console.log('✅ All 4 tables verified:');
      verifyResult.forEach((row: any) => {
        console.log(`   ✓ ${row.table_name}`);
      });
    } else {
      console.log('⚠️  Expected 4 tables, found:', verifyResult.length);
      console.log(verifyResult);
    }

    console.log('\n🎉 Database migration complete!');
    console.log('\n📋 Next steps:');
    console.log('   1. Run integration tests: npx tsx scripts/tests/test-autonomous-agent.ts');
    console.log('   2. Create storage bucket: autonomous-screenshots');
    console.log('   3. Set ANTHROPIC_API_KEY in .env.local');

  } catch (error) {
    console.error('❌ Error applying migration:', error);
    if (error instanceof Error) {
      console.error('   Message:', error.message);
      console.error('   Stack:', error.stack);
    }
    process.exit(1);
  }
}

applyMigration();
