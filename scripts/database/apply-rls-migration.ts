#!/usr/bin/env node
/**
 * Apply RLS migration for service role policies
 * Usage: npx tsx scripts/database/apply-rls-migration.ts
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

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
  console.log('Migration: 20251115_add_service_role_customer_configs_policies.sql');

  // Split SQL into individual statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    console.log(`\n[${i + 1}/${statements.length}] Executing statement...`);

    const { error } = await supabase.rpc('exec_sql' as any, {
      sql_query: statement + ';'
    } as any);

    if (error) {
      // Try direct execution via PostgREST if exec_sql doesn't exist
      console.log('Trying alternative execution method...');

      // For DDL statements, we need to use the REST API directly
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({ query: statement + ';' }),
      });

      if (!response.ok) {
        console.error(`❌ Failed to execute statement ${i + 1}`);
        console.error('Error:', error);
        console.error('Statement:', statement.substring(0, 100) + '...');

        // For policy creation, we can ignore "already exists" errors
        if (statement.includes('CREATE POLICY') && error.message?.includes('already exists')) {
          console.log('⚠️  Policy already exists, continuing...');
          continue;
        }

        process.exit(1);
      }
    }

    console.log('✅ Success');
  }

  console.log('\n✅ Migration applied successfully!');
  console.log('📊 Service role now has full access to customer_configs table');
}

applyMigration().catch((error) => {
  console.error('❌ Migration failed:', error);
  process.exit(1);
});
