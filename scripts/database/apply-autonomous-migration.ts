/**
 * Apply Autonomous Operations Migration
 *
 * Applies the autonomous_operations_system migration via Supabase Management API
 *
 * Usage: npx tsx scripts/database/apply-autonomous-migration.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN || process.env.SUPABASE_SERVICE_ROLE_KEY;
const PROJECT_REF = 'birugqyuqhiahxvxeyqg';

async function applyMigration() {
  if (!SUPABASE_ACCESS_TOKEN) {
    console.error('❌ SUPABASE_ACCESS_TOKEN or SUPABASE_SERVICE_ROLE_KEY environment variable required');
    process.exit(1);
  }

  console.log('🔄 Applying autonomous operations migration...\n');

  try {
    // Read migration file
    const migrationPath = path.join(
      process.cwd(),
      'supabase/migrations/20251110000000_autonomous_operations_system.sql'
    );

    const sql = fs.readFileSync(migrationPath, 'utf-8');

    console.log(`📄 Migration file: ${migrationPath}`);
    console.log(`📏 SQL length: ${sql.length} characters\n`);

    // Execute via Supabase Management API
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

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Migration failed:',  error);
      process.exit(1);
    }

    const result = await response.json();

    console.log('✅ Migration applied successfully!\n');
    console.log('📊 Tables created:');
    console.log('   - autonomous_operations');
    console.log('   - autonomous_operations_audit');
    console.log('   - autonomous_credentials');
    console.log('   - autonomous_consent\n');

    console.log('🔒 Row Level Security enabled on all tables');
    console.log('⚙️  Helper functions created');
    console.log('\n🎉 Autonomous operations system is ready!\n');

  } catch (error) {
    console.error('❌ Error applying migration:', error);
    process.exit(1);
  }
}

applyMigration();
