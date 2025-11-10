/**
 * Apply Multi-Language Support Migration
 *
 * Applies the translation tables, indexes, and RLS policies
 */

import { readFileSync } from 'fs';
import { join } from 'path';

const SUPABASE_PROJECT_REF = 'birugqyuqhiahxvxeyqg';
const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;

if (!SUPABASE_ACCESS_TOKEN) {
  console.error('❌ SUPABASE_ACCESS_TOKEN environment variable not set');
  process.exit(1);
}

async function applyMigration() {
  try {
    console.log('📦 Reading migration file...');

    const migrationPath = join(process.cwd(), 'supabase/migrations/20251110_multi_language_support.sql');
    const sqlQuery = readFileSync(migrationPath, 'utf-8');

    console.log('🚀 Applying migration via Supabase Management API...');

    const response = await fetch(
      `https://api.supabase.com/v1/projects/${SUPABASE_PROJECT_REF}/database/query`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: sqlQuery }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ Migration failed:', result);
      process.exit(1);
    }

    console.log('✅ Migration applied successfully!');
    console.log('\n📊 Created:');
    console.log('  - translation_cache table (with indexes)');
    console.log('  - user_language_preferences table');
    console.log('  - translation_statistics table');
    console.log('  - Added language columns to domains table');
    console.log('  - RLS policies for all tables');
    console.log('  - Helper functions: get_cached_translation(), cache_translation()');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

applyMigration();
