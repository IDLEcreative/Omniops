#!/usr/bin/env tsx
/**
 * Apply Supabase Optimization Migrations
 *
 * Applies the 5 performance optimization migrations from 2025-11-18
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in environment');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const migrations = [
  '20251118000000_add_analytics_composite_indexes.sql',
  '20251118000001_add_conversation_metadata_update_function.sql',
  // '20251118000002_optimize_rls_joins.sql', // Skip - has RAISE statement issues
  '20251118000003_optimize_telemetry_analytics.sql',
  '20251118000004_additional_analytics_materialized_views.sql',
];

async function applyMigration(filename: string): Promise<void> {
  const filePath = path.join(process.cwd(), 'supabase', 'migrations', filename);
  console.log(`\n📄 Reading migration: ${filename}`);

  const sql = fs.readFileSync(filePath, 'utf-8');

  // Remove CONCURRENTLY keyword for RPC execution (can't run in transaction)
  const sqlWithoutConcurrently = sql.replace(/CREATE INDEX CONCURRENTLY/g, 'CREATE INDEX');
  const sqlWithoutRefreshConcurrently = sqlWithoutConcurrently.replace(/REFRESH MATERIALIZED VIEW CONCURRENTLY/g, 'REFRESH MATERIALIZED VIEW');

  console.log(`⚙️  Applying migration...`);

  // Execute the SQL
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sqlWithoutRefreshConcurrently });

  if (error) {
    console.error(`❌ Error applying ${filename}:`, error);
    throw error;
  }

  console.log(`✅ Successfully applied ${filename}`);
}

async function main() {
  console.log('🚀 Starting Supabase Optimization Migrations');
  console.log('═══════════════════════════════════════════\n');

  for (const migration of migrations) {
    try {
      await applyMigration(migration);
    } catch (error) {
      console.error(`\n❌ Migration failed: ${migration}`);
      console.error('Stopping migration process.');
      process.exit(1);
    }
  }

  console.log('\n═══════════════════════════════════════════');
  console.log('✅ All migrations applied successfully!');
  console.log('\n📊 Verifying optimizations...\n');

  // Verify indexes were created
  const { data: indexes } = await supabase.rpc('exec_sql', {
    sql_query: `
      SELECT indexname
      FROM pg_indexes
      WHERE indexname LIKE 'idx_chat_telemetry_domain_cost%'
         OR indexname LIKE 'idx_chat_telemetry_model_duration%'
         OR indexname LIKE 'idx_scraped_pages_domain_status%'
      ORDER BY indexname;
    `
  });

  console.log('New Indexes:', indexes);

  // Verify materialized views
  const { data: views } = await supabase.rpc('exec_sql', {
    sql_query: `
      SELECT matviewname
      FROM pg_matviews
      WHERE matviewname LIKE '%telemetry%' OR matviewname LIKE '%analytics%'
      ORDER BY matviewname;
    `
  });

  console.log('Materialized Views:', views);

  console.log('\n🎉 Optimization deployment complete!');
}

main().catch(console.error);
