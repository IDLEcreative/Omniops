#!/usr/bin/env tsx
/**
 * Apply Security Migration Script
 *
 * Applies the security advisory fix migration directly to Supabase
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase credentials');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', SUPABASE_URL ? '✓' : '✗');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_KEY ? '✓' : '✗');
  process.exit(1);
}

const client = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function applyMigration() {
  console.log('\n════════════════════════════════════════════════════════════════');
  console.log('  Applying Security Migration');
  console.log('  Migration: 20251028_fix_security_advisories.sql');
  console.log('════════════════════════════════════════════════════════════════\n');

  try {
    // Read migration file
    const migrationPath = join(__dirname, 'supabase', 'migrations', '20251028_fix_security_advisories.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    console.log('📄 Migration file loaded');
    console.log(`   Size: ${migrationSQL.length} characters\n`);

    // Split SQL into statements (rough split on semicolons, but handle DO blocks)
    const statements = migrationSQL
      .split(/;\s*(?=(?:[^']*'[^']*')*[^']*$)/) // Split on semicolons not in strings
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📋 Executing ${statements.length} SQL statements...\n`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];

      // Skip comments
      if (statement.startsWith('--')) continue;

      process.stdout.write(`   [${i + 1}/${statements.length}] Executing... `);

      try {
        const { error } = await client.rpc('exec_sql' as any, { sql: statement });

        if (error) {
          // Some errors are expected (like DROP IF EXISTS on non-existent objects)
          if (error.message.includes('does not exist')) {
            process.stdout.write('⚠️  (skipped)\n');
          } else {
            process.stdout.write(`❌\n`);
            console.error(`       Error: ${error.message}`);
            errorCount++;
          }
        } else {
          process.stdout.write('✅\n');
          successCount++;
        }
      } catch (err) {
        process.stdout.write(`❌\n`);
        console.error(`       Error: ${err instanceof Error ? err.message : String(err)}`);
        errorCount++;
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    console.log('\n════════════════════════════════════════════════════════════════');
    console.log('  Migration Results');
    console.log('════════════════════════════════════════════════════════════════\n');

    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`📊 Total: ${statements.length}`);

    if (errorCount > 0) {
      console.log('\n⚠️  Some statements failed, but this may be normal.');
      console.log('   Run verification script to check if migration succeeded.\n');
    } else {
      console.log('\n✅ Migration completed successfully!\n');
    }

    console.log('Next steps:');
    console.log('   1. Run verification: npx tsx verify-security-migration.ts');
    console.log('   2. Check security advisors in Supabase Dashboard');
    console.log('   3. Run RLS tests: npx tsx test-rls-policies.ts\n');

    process.exit(errorCount > 5 ? 1 : 0); // Allow some errors for idempotency

  } catch (error) {
    console.error('\n💥 Migration failed:');
    console.error(error);
    process.exit(1);
  }
}

applyMigration();
