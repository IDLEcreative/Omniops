#!/usr/bin/env node
/**
 * Apply RLS migration using Supabase REST API
 * Usage: npx tsx scripts/database/apply-rls-via-api.ts
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

// Create client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function executeSql(sql: string): Promise<{ success: boolean; error?: any }> {
  try {
    // Use rpc to execute raw SQL
    const { data, error } = await (supabase as any).rpc('exec', {
      sql_string: sql
    });

    if (error) {
      // Try alternative method - direct SQL execution
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify({ query: sql }),
      });

      if (!response.ok) {
        return { success: false, error: await response.text() };
      }
    }

    return { success: true, data };
  } catch (err) {
    return { success: false, error: err };
  }
}

async function applyMigration() {
  console.log('📝 Reading migration file...');
  const sqlPath = join(process.cwd(), 'supabase/migrations/20251115_add_service_role_customer_configs_policies.sql');
  const fullSql = readFileSync(sqlPath, 'utf-8');

  console.log('🔧 Applying RLS policies migration...\n');

  // Split into individual statements
  const statements = fullSql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--') && s !== '');

  console.log(`Found ${statements.length} SQL statements to execute\n`);

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];

    // Skip pure comment lines
    if (statement.startsWith('--')) {
      continue;
    }

    console.log(`[${i + 1}/${statements.length}] Executing:`);
    const preview = statement.substring(0, 80).replace(/\s+/g, ' ');
    console.log(`  ${preview}...`);

    // Execute using the from().rpc() pattern which works with service role
    const { data, error } = await (supabase as any)
      .from('_migrations')
      .select('*')
      .limit(0)
      .then(() => {
        // This is a trick - we execute the SQL by using a raw query
        return (supabase as any).rpc('exec', { query: statement + ';' });
      })
      .catch(async () => {
        // If that fails, try executing directly via SQL
        const result = await executeSql(statement + ';');
        return result;
      });

    if (error) {
      // Check if it's an "already exists" error for policies
      const errorMsg = error.message || JSON.stringify(error);

      if (statement.includes('CREATE POLICY') && errorMsg.includes('already exists')) {
        console.log('  ⚠️  Policy already exists, skipping...\n');
        continue;
      }

      if (statement.includes('DROP POLICY') && errorMsg.includes('does not exist')) {
        console.log('  ⚠️  Policy does not exist, skipping...\n');
        continue;
      }

      console.error('  ❌ Error:', errorMsg);
      console.error('\nFailed statement:', statement);
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
