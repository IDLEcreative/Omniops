#!/usr/bin/env tsx
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const sql = fs.readFileSync('scripts/database/apply-optimizations-manual.sql', 'utf-8');

  console.log('🚀 Applying optimizations...\n');

  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

  if (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }

  console.log('✅ Optimizations applied successfully!');
  console.log('📊 Refreshing materialized views...\n');

  // Verify the views were created
  const { data: views } = await supabase.rpc('exec_sql', {
    sql_query: `
      SELECT matviewname
      FROM pg_matviews
      WHERE matviewname LIKE '%telemetry%' OR matviewname LIKE '%analytics%' OR matviewname LIKE '%conversation%'
      ORDER BY matviewname;
    `
  });

  console.log('Created Materialized Views:', views);

  console.log('\n🎉 All optimizations applied!');
}

main().catch(console.error);
