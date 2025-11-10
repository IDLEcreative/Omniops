#!/usr/bin/env npx tsx

/**
 * Apply Cart Analytics Migration
 *
 * Applies the cart analytics database schema.
 */

import { createServiceRoleClient } from '../../lib/supabase-server';
import fs from 'fs';
import path from 'path';

async function applyMigration() {
  console.log('🔧 Applying Cart Analytics Migration...\n');

  const supabase = await createServiceRoleClient();
  if (!supabase) {
    console.error('❌ Failed to create Supabase client');
    process.exit(1);
  }

  // Read the migration file
  const migrationPath = path.join(process.cwd(), 'supabase/migrations/20251110_cart_analytics.sql');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

  // Split into individual statements (simple split on semicolon)
  const statements = migrationSQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  console.log(`📄 Found ${statements.length} SQL statements to execute\n`);

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    const preview = statement.substring(0, 60).replace(/\s+/g, ' ');

    console.log(`[${i + 1}/${statements.length}] ${preview}...`);

    try {
      const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });

      if (error) {
        // Try direct execution if RPC fails
        const directResult = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json',
            'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY || ''
          },
          body: JSON.stringify({ query: statement + ';' })
        });

        if (!directResult.ok) {
          console.log(`   ⚠️  Skipped (may already exist)`);
        } else {
          console.log(`   ✅ Success`);
          successCount++;
        }
      } else {
        console.log(`   ✅ Success`);
        successCount++;
      }
    } catch (err) {
      console.log(`   ⚠️  Skipped (${err instanceof Error ? err.message : 'unknown error'})`);
      errorCount++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`✅ Migration complete: ${successCount} succeeded, ${errorCount} skipped`);
  console.log('='.repeat(60));

  // Verify tables were created
  console.log('\n🔍 Verifying tables...\n');

  const tables = ['cart_operations', 'cart_session_metrics', 'cart_abandonments', 'cart_analytics_daily'];

  for (const table of tables) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .limit(0);

    if (error) {
      console.log(`   ❌ ${table}: Not found or error`);
    } else {
      console.log(`   ✅ ${table}: Exists`);
    }
  }

  console.log('\n✨ Migration verification complete!\n');
}

applyMigration().catch(console.error);
