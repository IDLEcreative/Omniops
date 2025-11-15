#!/usr/bin/env node
/**
 * Apply RLS migration using pg library
 * Usage: npx tsx scripts/database/apply-rls-pg.ts
 */

import { readFileSync } from 'fs';
import { join } from 'path';

async function applyMigration() {
  // Dynamic import of pg to avoid bundling issues
  const { Client } = await import('pg');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

  if (!supabaseUrl) {
    console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL');
    process.exit(1);
  }

  // Extract project ref from URL
  const projectRef = supabaseUrl.match(/https:\/\/([^.]+)/)?.[1];

  if (!projectRef) {
    console.error('❌ Could not extract project ref from Supabase URL');
    process.exit(1);
  }

  console.log(`📝 Connecting to Supabase project: ${projectRef}`);

  // Connection string for Supabase - using pooler
  const connectionString = `postgresql://postgres.${projectRef}:${process.env.SUPABASE_DB_PASSWORD}@aws-0-us-west-1.pooler.supabase.com:6543/postgres`;

  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected!\n');

    console.log('📝 Reading migration file...');
    const sqlPath = join(process.cwd(), 'supabase/migrations/20251115_add_service_role_customer_configs_policies.sql');
    const fullSql = readFileSync(sqlPath, 'utf-8');

    console.log('🔧 Executing migration...\n');

    // Execute the full SQL as one transaction
    await client.query('BEGIN');

    try {
      await client.query(fullSql);
      await client.query('COMMIT');

      console.log('✅ Migration applied successfully!');
      console.log('📊 Service role now has full access to customer_configs table');
    } catch (error: any) {
      await client.query('ROLLBACK');
      throw error;
    }

  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    if (error.detail) {
      console.error('Details:', error.detail);
    }
    process.exit(1);
  } finally {
    await client.end();
  }
}

applyMigration();
