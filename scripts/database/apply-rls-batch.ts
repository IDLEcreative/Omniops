#!/usr/bin/env node
/**
 * Apply RLS migration as a single batch
 * Usage: npx tsx scripts/database/apply-rls-batch.ts
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function applyMigration() {
  console.log('📝 Reading migration file...');
  const sqlPath = join(process.cwd(), 'supabase/migrations/20251115_add_service_role_customer_configs_policies.sql');
  const fullSql = readFileSync(sqlPath, 'utf-8');

  console.log('🔧 Applying RLS policies migration as single batch...\n');

  // Execute the entire SQL file as one batch
  const { error } = await supabase.rpc('exec_sql', {
    sql_query: fullSql
  });

  if (error) {
    console.error('❌ Migration failed:', error);
    console.error('\nPlease apply the SQL manually in Supabase Dashboard:');
    console.error('https://supabase.com/dashboard/project/birugqyuqhiahxvxeyqg/sql/new');
    process.exit(1);
  }

  console.log('✅ Migration applied successfully!');
  console.log('📊 Service role now has full access to customer_configs table');
  console.log('\n✅ RLS Policies created:');
  console.log('   - service_role_select_customer_configs');
  console.log('   - service_role_insert_customer_configs');
  console.log('   - service_role_update_customer_configs');
  console.log('   - service_role_delete_customer_configs');
}

applyMigration().catch((error) => {
  console.error('❌ Migration failed:', error);
  process.exit(1);
});
