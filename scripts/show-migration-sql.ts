/**
 * Show Migration SQL for Manual Execution
 * Displays the SQL to run in Supabase Dashboard
 */

import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';

function showMigrationSQL() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const projectRef = supabaseUrl?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

  console.log('\n' + '='.repeat(80));
  console.log('  WooCommerce Usage Metrics Migration');
  console.log('='.repeat(80) + '\n');

  if (projectRef) {
    console.log('📍 Your Project:', projectRef);
    console.log('🔗 SQL Editor:', `https://supabase.com/dashboard/project/${projectRef}/sql/new`);
    console.log('');
  }

  // Read the migration file
  const migrationPath = path.join(
    __dirname,
    '..',
    'supabase',
    'migrations',
    '20251029140825_add_woocommerce_usage_metrics.sql'
  );

  const sql = fs.readFileSync(migrationPath, 'utf-8');

  console.log('📋 INSTRUCTIONS:');
  console.log('   1. Go to Supabase Dashboard → SQL Editor');
  console.log('   2. Click "New Query"');
  console.log('   3. Copy the SQL below');
  console.log('   4. Paste into the editor');
  console.log('   5. Click "Run" (or press Cmd/Ctrl + Enter)');
  console.log('');
  console.log('📊 This will create:');
  console.log('   • Table: woocommerce_usage_metrics');
  console.log('   • Indexes: 6 (for performance)');
  console.log('   • RLS Policies: 2 (for security)');
  console.log('');
  console.log('=' .repeat(80));
  console.log('SQL TO EXECUTE:');
  console.log('='.repeat(80) + '\n');
  console.log(sql);
  console.log('\n' + '='.repeat(80));
  console.log('✅ After running, analytics will be tracked for all WooCommerce operations');
  console.log('='.repeat(80) + '\n');
}

showMigrationSQL();
