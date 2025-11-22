#!/usr/bin/env npx tsx
/**
 * Apply Persistence Migrations
 *
 * Applies database migrations for persistent message queue and scrape job audit trail.
 *
 * Usage:
 *   npx tsx scripts/database/apply-persistence-migrations.ts
 *   npx tsx scripts/database/apply-persistence-migrations.ts --dry-run
 *   npx tsx scripts/database/apply-persistence-migrations.ts --rollback
 *
 * Requirements:
 *   - SUPABASE_SERVICE_ROLE_KEY environment variable
 *   - NEXT_PUBLIC_SUPABASE_URL environment variable
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { createServiceRoleClient } from '@/lib/supabase/server';

interface MigrationFile {
  filename: string;
  path: string;
  sql: string;
}

const MIGRATIONS_DIR = join(process.cwd(), 'migrations');

const MIGRATIONS: MigrationFile[] = [
  {
    filename: '20251122_add_persistent_message_queue.sql',
    path: join(MIGRATIONS_DIR, '20251122_add_persistent_message_queue.sql'),
    sql: '',
  },
  {
    filename: '20251122_add_scrape_job_audit_trail.sql',
    path: join(MIGRATIONS_DIR, '20251122_add_scrape_job_audit_trail.sql'),
    sql: '',
  },
];

async function loadMigrations(): Promise<MigrationFile[]> {
  return MIGRATIONS.map((migration) => ({
    ...migration,
    sql: readFileSync(migration.path, 'utf-8'),
  }));
}

async function applyMigration(
  supabase: Awaited<ReturnType<typeof createServiceRoleClient>>,
  migration: MigrationFile
): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase client not available');
  }

  console.log(`\n📝 Applying migration: ${migration.filename}`);
  console.log('─'.repeat(80));

  // Split SQL into individual statements (simple split by semicolon + newline)
  const statements = migration.sql
    .split(';\n')
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith('--'));

  let successCount = 0;
  let errorCount = 0;

  for (const statement of statements) {
    if (!statement) continue;

    try {
      const { error } = await supabase.rpc('exec_sql', { sql: statement });

      if (error) {
        // Check if error is "already exists" - treat as warning, not failure
        if (
          error.message.includes('already exists') ||
          error.message.includes('duplicate')
        ) {
          console.log(`⚠️  Already exists (skipping): ${statement.substring(0, 60)}...`);
          successCount++;
        } else {
          console.error(`❌ Error: ${error.message}`);
          console.error(`   Statement: ${statement.substring(0, 100)}...`);
          errorCount++;
        }
      } else {
        successCount++;
        console.log(`✅ Success: ${statement.substring(0, 60)}...`);
      }
    } catch (error) {
      console.error(`❌ Unexpected error: ${error}`);
      console.error(`   Statement: ${statement.substring(0, 100)}...`);
      errorCount++;
    }
  }

  console.log('─'.repeat(80));
  console.log(`📊 Results: ${successCount} successful, ${errorCount} errors`);

  if (errorCount > 0) {
    throw new Error(`Migration failed with ${errorCount} errors`);
  }
}

async function verifyMigrations(
  supabase: Awaited<ReturnType<typeof createServiceRoleClient>>
): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase client not available');
  }

  console.log('\n🔍 Verifying migrations...');
  console.log('─'.repeat(80));

  const tables = [
    'message_queue',
    'scrape_jobs',
    'scrape_job_results',
    'scrape_job_stats',
  ];

  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.error(`❌ Table ${table}: ${error.message}`);
      } else {
        console.log(`✅ Table ${table}: exists (${count ?? 0} rows)`);
      }
    } catch (error) {
      console.error(`❌ Table ${table}: ${error}`);
    }
  }

  // Verify functions
  const functions = ['cleanup_expired_message_queue', 'cleanup_old_scrape_jobs'];

  for (const func of functions) {
    try {
      const { error } = await supabase.rpc(func);

      // If error is about missing parameter, that's fine - function exists
      if (error && !error.message.includes('requires') && !error.message.includes('argument')) {
        console.error(`❌ Function ${func}: ${error.message}`);
      } else {
        console.log(`✅ Function ${func}: exists`);
      }
    } catch (error) {
      console.error(`❌ Function ${func}: ${error}`);
    }
  }

  console.log('─'.repeat(80));
}

async function rollbackMigrations(
  supabase: Awaited<ReturnType<typeof createServiceRoleClient>>
): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase client not available');
  }

  console.log('\n🔄 Rolling back migrations...');
  console.log('─'.repeat(80));

  const rollbackSQL = `
    -- Drop tables (cascade to remove dependencies)
    DROP TABLE IF EXISTS public.message_queue CASCADE;
    DROP TABLE IF EXISTS public.scrape_job_results CASCADE;
    DROP TABLE IF EXISTS public.scrape_job_stats CASCADE;
    DROP TABLE IF EXISTS public.scrape_jobs CASCADE;

    -- Drop functions
    DROP FUNCTION IF EXISTS cleanup_expired_message_queue() CASCADE;
    DROP FUNCTION IF EXISTS cleanup_old_scrape_jobs(INTEGER) CASCADE;
    DROP FUNCTION IF EXISTS update_scrape_job_stats() CASCADE;
  `;

  const { error } = await supabase.rpc('exec_sql', { sql: rollbackSQL });

  if (error) {
    console.error(`❌ Rollback failed: ${error.message}`);
    throw error;
  }

  console.log('✅ Rollback completed successfully');
  console.log('─'.repeat(80));
}

async function main() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run');
  const isRollback = args.includes('--rollback');

  console.log('🚀 Persistence Migrations Tool');
  console.log('═'.repeat(80));

  if (isDryRun) {
    console.log('🔍 DRY RUN MODE - No changes will be applied');
  }

  if (isRollback) {
    console.log('⚠️  ROLLBACK MODE - Migrations will be reverted');
  }

  // Load migrations
  const migrations = await loadMigrations();
  console.log(`\n📚 Loaded ${migrations.length} migrations:`);
  migrations.forEach((m) => console.log(`   - ${m.filename}`));

  if (isDryRun) {
    console.log('\n✅ Dry run complete - migrations loaded successfully');
    return;
  }

  // Create Supabase client
  const supabase = await createServiceRoleClient();
  if (!supabase) {
    throw new Error(
      'Failed to create Supabase client. Check SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL'
    );
  }

  if (isRollback) {
    // Rollback migrations
    await rollbackMigrations(supabase);
  } else {
    // Apply migrations
    for (const migration of migrations) {
      await applyMigration(supabase, migration);
    }

    // Verify
    await verifyMigrations(supabase);
  }

  console.log('\n✅ Migration process completed successfully!');
  console.log('═'.repeat(80));
}

main().catch((error) => {
  console.error('\n❌ Migration failed:', error);
  process.exit(1);
});
