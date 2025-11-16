/**
 * Apply product_embeddings migration via Supabase Management API
 *
 * Uses Management API to execute SQL when MCP/CLI unavailable
 */

import { readFileSync } from 'fs';
import { join } from 'path';

const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const PROJECT_REF = 'birugqyuqhiahxvxeyqg';

if (!SUPABASE_ACCESS_TOKEN) {
  console.error('❌ Missing SUPABASE_ACCESS_TOKEN environment variable');
  console.error('Set it with: export SUPABASE_ACCESS_TOKEN="sbp_..."');
  process.exit(1);
}

async function applyMigration() {
  console.log('📋 Reading migration file...');

  const migrationPath = join(
    process.cwd(),
    'supabase',
    'migrations',
    '20251115000000_product_embeddings_cache.sql'
  );

  const migrationSQL = readFileSync(migrationPath, 'utf-8');

  console.log('🚀 Applying migration via Management API...');
  console.log(`   Project: ${PROJECT_REF}`);
  console.log(`   SQL Lines: ${migrationSQL.split('\n').length}`);

  try {
    const response = await fetch(
      `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: migrationSQL })
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API error: ${response.status} ${response.statusText}\n${error}`);
    }

    const result = await response.json();

    console.log('✅ Migration applied successfully!');
    console.log('\nCreated:');
    console.log('  - product_embeddings table');
    console.log('  - 5 indexes (domain, product_id, sku, last_accessed, vector)');
    console.log('  - 2 RLS policies (domain_isolation, service_role)');
    console.log('  - 2 functions (update_updated_at, clean_old_embeddings)');
    console.log('  - 1 trigger (auto-update updated_at)');

    console.log('\nVerifying table creation...');
    const verifyResponse = await fetch(
      `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `
            SELECT EXISTS (
              SELECT FROM information_schema.tables
              WHERE table_schema = 'public'
              AND table_name = 'product_embeddings'
            ) as table_exists;
          `
        })
      }
    );

    const verifyResult = await verifyResponse.json();

    if (verifyResult[0]?.rows?.[0]?.table_exists) {
      console.log('✅ Verified: product_embeddings table exists');
    } else {
      console.warn('⚠️  Warning: Could not verify table creation');
    }

    console.log('\n🎉 Migration complete!');
    console.log('\nNext steps:');
    console.log('  1. Test caching with product searches');
    console.log('  2. Monitor cache hit/miss rates');
    console.log('  3. Pre-generate embeddings for existing products');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

applyMigration();
