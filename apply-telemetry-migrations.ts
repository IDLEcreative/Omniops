/**
 * Apply telemetry migrations to Supabase via SQL execution
 */

import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { createServiceRoleClient } from './lib/supabase-server';

config({ path: '.env.local' });

async function applyMigrations() {
  console.log('📦 Applying telemetry migrations to Supabase...\n');

  const supabase = await createServiceRoleClient();

  if (!supabase) {
    console.error('❌ Failed to create Supabase client');
    process.exit(1);
  }

  const migrations = [
    'supabase/migrations/20250117_create_chat_telemetry.sql',
    'supabase/migrations/20251020_chat_telemetry_rollups.sql',
    'supabase/migrations/20251020_chat_telemetry_domain_model_rollups.sql'
  ];

  for (const migrationPath of migrations) {
    console.log(`\n📄 Applying: ${migrationPath.split('/').pop()}`);

    try {
      const sql = readFileSync(migrationPath, 'utf-8');

      // Split by semicolon but be smart about it
      // This is a simple approach - for complex migrations you'd want a proper SQL parser
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      let successCount = 0;
      let errorCount = 0;

      for (const statement of statements) {
        if (statement.length < 10) continue; // Skip empty/tiny statements

        try {
          const { error } = await supabase.rpc('exec_sql', { query: statement + ';' });

          if (error) {
            // Some errors are acceptable (like "already exists")
            if (
              error.message.includes('already exists') ||
              error.message.includes('duplicate key')
            ) {
              console.log(`   ℹ️  Skipped: ${error.message.substring(0, 80)}...`);
            } else {
              console.log(`   ❌ Error: ${error.message}`);
              errorCount++;
            }
          } else {
            successCount++;
          }
        } catch (err: any) {
          console.log(`   ❌ Exception: ${err.message}`);
          errorCount++;
        }
      }

      console.log(`   ✅ Completed: ${successCount} statements, ${errorCount} errors`);
    } catch (err: any) {
      console.log(`   ❌ Failed to read migration file: ${err.message}`);
    }
  }

  console.log('\n✨ Migration application complete!\n');
  console.log('Run `npx tsx verify-telemetry-tables.ts` to verify the setup.');
}

applyMigrations().catch(console.error);
