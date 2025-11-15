#!/usr/bin/env node
/**
 * Apply RLS migration using service role key
 * Usage: npx tsx scripts/database/apply-rls-simple.ts
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

async function applyMigration() {
  console.log('📝 Reading migration file...');
  const sqlPath = join(process.cwd(), 'supabase/migrations/20251115_add_service_role_customer_configs_policies.sql');
  const fullSql = readFileSync(sqlPath, 'utf-8');

  console.log('🔧 Executing migration statements...\n');

  // Split into statements - handle both ; and newlines
  const statements = fullSql
    .split(';')
    .map(s => s.trim())
    .filter(s => {
      // Remove comments and empty lines
      const cleaned = s.replace(/--.*$/gm, '').trim();
      return cleaned.length > 0;
    });

  console.log(`Found ${statements.length} statements to execute\n`);

  // Create Supabase client
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  let successCount = 0;
  let skipCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    const preview = statement.substring(0, 60).replace(/\s+/g, ' ');

    console.log(`[${i + 1}/${statements.length}] ${preview}...`);

    try {
      // Execute SQL using raw query
      const { error } = await supabase.rpc('exec' as any, {
        sql: statement + ';'
      } as any);

      if (error) {
        // Check for acceptable errors
        if (
          (statement.includes('DROP POLICY') && error.message?.includes('does not exist')) ||
          (statement.includes('CREATE POLICY') && error.message?.includes('already exists'))
        ) {
          console.log('  ⚠️  Skipped (already exists/not exists)\n');
          skipCount++;
          continue;
        }

        console.error('  ❌ Error:', error.message);
        throw error;
      }

      console.log('  ✅ Success\n');
      successCount++;

    } catch (err: any) {
      console.error('\n❌ Failed to execute statement:', err.message);
      console.error('Statement:', statement.substring(0, 200));
      process.exit(1);
    }
  }

  console.log(`\n✅ Migration completed!`);
  console.log(`   Success: ${successCount} statements`);
  console.log(`   Skipped: ${skipCount} statements`);
  console.log(`\n📊 Service role policies are now active on customer_configs table`);
}

applyMigration().catch((error) => {
  console.error('❌ Migration failed:', error);
  process.exit(1);
});
