import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function applyMigration() {
  console.log('📝 Reading migration file...');
  const sqlPath = join(process.cwd(), 'supabase/migrations/20251115_add_service_role_customer_configs_policies.sql');
  const sql = readFileSync(sqlPath, 'utf-8');

  console.log('🔧 Applying migration to database...');

  // Execute the SQL
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql }).single();

  if (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }

  console.log('✅ Migration applied successfully!');
  console.log('📊 Result:', data);
}

applyMigration();
