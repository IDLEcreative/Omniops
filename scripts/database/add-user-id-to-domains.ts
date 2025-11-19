/**
 * Migration Script: Add user_id column to domains table
 *
 * This script fixes schema drift where the column exists in migration files
 * but is missing from the production database.
 */

import { createServiceRoleClient } from '@/lib/supabase-server';

async function applyMigration() {
  console.log('🔧 Starting migration: Add user_id to domains table...\n');

  const supabase = await createServiceRoleClient();

  if (!supabase) {
    console.error('❌ Failed to create Supabase client');
    console.error('   Check SUPABASE_SERVICE_ROLE_KEY in .env.local');
    process.exit(1);
  }

  // Step 1: Add user_id column
  console.log('📝 Step 1: Adding user_id column...');
  const addColumnSQL = `
    ALTER TABLE domains
    ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  `;

  const { error: addError } = await supabase.rpc('exec_sql', { query: addColumnSQL });

  if (addError) {
    console.error('❌ Failed to add column:', addError.message);
    console.log('\n💡 Manual fix required:');
    console.log('   1. Go to Supabase Dashboard → SQL Editor');
    console.log('   2. Run this SQL:');
    console.log('      ALTER TABLE domains ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;');
    console.log('      CREATE INDEX IF NOT EXISTS idx_domains_user_id ON domains(user_id);');
    process.exit(1);
  }

  console.log('✅ Column added successfully\n');

  // Step 2: Create index
  console.log('📝 Step 2: Creating index...');
  const createIndexSQL = `
    CREATE INDEX IF NOT EXISTS idx_domains_user_id ON domains(user_id);
  `;

  const { error: indexError } = await supabase.rpc('exec_sql', { query: createIndexSQL });

  if (indexError) {
    console.error('⚠️  Failed to create index:', indexError.message);
    console.log('   (Column added successfully, index creation can be done manually)');
  } else {
    console.log('✅ Index created successfully\n');
  }

  // Step 3: Verify
  console.log('📝 Step 3: Verifying column exists...');

  // Try to select user_id - if it exists, this will succeed
  const { error: verifyError } = await supabase
    .from('domains')
    .select('id, domain, user_id, organization_id')
    .limit(1);

  if (verifyError) {
    console.error('❌ Verification failed:', verifyError.message);
    process.exit(1);
  }

  console.log('✅ Verified: user_id column exists and is queryable\n');

  console.log('🎉 Migration completed successfully!');
  console.log('   The domains table now has a user_id column');
  console.log('   URL uploads should now work correctly\n');
}

applyMigration().catch((error) => {
  console.error('\n💥 Unexpected error:', error);
  process.exit(1);
});
