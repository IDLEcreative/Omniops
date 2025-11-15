#!/usr/bin/env node
/**
 * Apply RLS migration using direct SQL execution
 * Usage: npx tsx scripts/database/apply-rls-direct.ts
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
  db: {
    schema: 'public',
  },
});

async function applyMigration() {
  console.log('📝 Reading migration file...');
  const sqlPath = join(process.cwd(), 'supabase/migrations/20251115_add_service_role_customer_configs_policies.sql');
  const sql = readFileSync(sqlPath, 'utf-8');

  console.log('🔧 Applying RLS policies migration...');
  console.log('Migration: 20251115_add_service_role_customer_configs_policies.sql\n');

  // Split into individual statements and execute each one
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i] + ';';

    // Skip comments
    if (statement.trim().startsWith('--')) {
      continue;
    }

    console.log(`\n[${i + 1}/${statements.length}] Executing:`);
    console.log(statement.substring(0, 100) + '...\n');

    try {
      // Use the REST API directly to execute DDL
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Prefer': 'return=representation',
        },
        body: JSON.stringify({ query: statement }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Failed with status ${response.status}`);
        console.error('Error:', errorText);

        // For policy creation, we can ignore "already exists" errors
        if (statement.includes('CREATE POLICY') && errorText.includes('already exists')) {
          console.log('⚠️  Policy already exists, continuing...');
          continue;
        }

        // Try alternative method using from() with raw SQL
        console.log('Trying raw SQL execution...');
        const { error } = await supabase.rpc('exec' as any, { query: statement } as any);

        if (error) {
          console.error('❌ Raw SQL also failed:', error);
          process.exit(1);
        }
      }

      console.log('✅ Success');
    } catch (error) {
      console.error(`❌ Exception executing statement ${i + 1}:`, error);
      process.exit(1);
    }
  }

  console.log('\n✅ Migration applied successfully!');
  console.log('📊 Service role now has full access to customer_configs table');
}

applyMigration().catch((error) => {
  console.error('❌ Migration failed:', error);
  process.exit(1);
});
