#!/usr/bin/env node
/**
 * Apply RLS migration using exec_sql function
 * Prerequisites: exec_sql function must exist in database
 * Usage: npx tsx scripts/database/apply-rls-with-exec.ts
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
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
  const sql = readFileSync(sqlPath, 'utf-8');

  console.log('🔧 Applying RLS policies migration...');
  console.log('Migration: 20251115_add_service_role_customer_configs_policies.sql\n');

  // Split SQL into individual statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  console.log(`Found ${statements.length} statements to execute\n`);

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    const preview = statement.substring(0, 70).replace(/\s+/g, ' ');

    console.log(`[${i + 1}/${statements.length}] ${preview}...`);

    const { error } = await supabase.rpc('exec_sql', {
      sql_query: statement + ';'
    });

    if (error) {
      // Check for acceptable errors
      const errorMsg = error.message || JSON.stringify(error);

      if (
        (statement.includes('CREATE POLICY') && errorMsg.includes('already exists')) ||
        (statement.includes('DROP POLICY') && errorMsg.includes('does not exist'))
      ) {
        console.log('  ⚠️  Skipped (already exists/not exists)\n');
        continue;
      }

      console.error(`  ❌ Failed: ${errorMsg}`);
      console.error('Statement:', statement.substring(0, 100));
      process.exit(1);
    }

    console.log('  ✅ Success\n');
  }

  console.log('✅ Migration applied successfully!');
  console.log('📊 Service role now has full access to customer_configs table');
}

applyMigration().catch((error) => {
  console.error('❌ Migration failed:', error);
  process.exit(1);
});
