/**
 * Apply WooCommerce Usage Metrics Migration
 * Run: npx tsx scripts/apply-woocommerce-metrics-migration.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

async function applyMigration() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing required environment variables:');
    console.error('   - NEXT_PUBLIC_SUPABASE_URL');
    console.error('   - SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('📊 Applying WooCommerce Usage Metrics Migration...\n');

  // Read the migration file
  const migrationPath = path.join(
    __dirname,
    '..',
    'supabase',
    'migrations',
    '20251029140825_add_woocommerce_usage_metrics.sql'
  );

  const migrationSql = fs.readFileSync(migrationPath, 'utf-8');

  try {
    // Execute the migration
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSql });

    if (error) {
      // If exec_sql doesn't exist, try direct execution (this will fail with proper error)
      const { error: directError } = await supabase
        .from('woocommerce_usage_metrics')
        .select('id')
        .limit(1);

      if (directError && directError.code === '42P01') {
        // Table doesn't exist, need to run SQL manually
        console.log('⚠️  Direct SQL execution not available via Supabase client.');
        console.log('📋 Please run this migration manually in Supabase Dashboard:\n');
        console.log('1. Go to: https://supabase.com/dashboard/project/[your-project-id]/sql');
        console.log('2. Copy and paste the contents of:');
        console.log(`   ${migrationPath}`);
        console.log('3. Click "Run"\n');
        console.log('Migration SQL:');
        console.log('─'.repeat(80));
        console.log(migrationSql);
        console.log('─'.repeat(80));
        process.exit(1);
      }

      throw error;
    }

    console.log('✅ Migration applied successfully!');
    console.log('📊 Table created: woocommerce_usage_metrics');
    console.log('📊 Indexes created: 6');
    console.log('🔒 RLS enabled with 2 policies\n');

    // Verify table exists
    const { data, error: verifyError } = await supabase
      .from('woocommerce_usage_metrics')
      .select('id')
      .limit(1);

    if (verifyError) {
      console.log('⚠️  Warning: Could not verify table creation:', verifyError.message);
    } else {
      console.log('✓ Verification: Table is accessible\n');
    }

    console.log('🎉 Migration complete! You can now track WooCommerce operation analytics.');
  } catch (err: any) {
    console.error('❌ Migration failed:', err.message);
    console.log('\n📋 Manual migration required. Please run the SQL in Supabase Dashboard:');
    console.log(`   File: ${migrationPath}\n`);
    process.exit(1);
  }
}

applyMigration();
