#!/usr/bin/env tsx
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  console.log('🚀 Applying WooCommerce usage metrics migration...\n');

  // Read the migration file
  const migrationPath = path.join(
    __dirname,
    'supabase/migrations/20251029140825_add_woocommerce_usage_metrics.sql'
  );

  const sql = fs.readFileSync(migrationPath, 'utf-8');

  // Split by semicolons and execute each statement
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    console.log(`Executing statement ${i + 1}/${statements.length}...`);

    const { error } = await supabase.rpc('exec_sql', { sql_query: statement });

    if (error) {
      console.error(`❌ Error on statement ${i + 1}:`, error.message);
      console.error('Statement:', statement.substring(0, 200));
      process.exit(1);
    }
  }

  console.log('\n✅ Migration applied successfully!');
  console.log('\nVerifying table creation...');

  // Verify the table exists
  const { data, error } = await supabase
    .from('woocommerce_usage_metrics')
    .select('id')
    .limit(1);

  if (error) {
    console.error('❌ Verification failed:', error.message);
    process.exit(1);
  }

  console.log('✅ Table verified: woocommerce_usage_metrics exists');
  console.log('\n🎉 Ready to track WooCommerce analytics!');
}

applyMigration().catch(console.error);
