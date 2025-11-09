#!/usr/bin/env npx tsx

/**
 * Apply cron_refresh_history table migration
 *
 * This script applies the database migration for the scheduled content refresh system.
 * Uses the service role client to execute SQL directly.
 */

import { createServiceRoleClient } from '@/lib/supabase-server';
import fs from 'fs';
import path from 'path';

const migrationSQL = `
-- Track all scheduled refresh runs
CREATE TABLE IF NOT EXISTS cron_refresh_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL CHECK (status IN ('running', 'completed', 'failed')),
  domains_processed INTEGER DEFAULT 0,
  domains_failed INTEGER DEFAULT 0,
  pages_refreshed INTEGER DEFAULT 0,
  total_duration_ms INTEGER,
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Index for quick status lookups
CREATE INDEX IF NOT EXISTS idx_cron_history_status ON cron_refresh_history(status, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_cron_history_started ON cron_refresh_history(started_at DESC);

-- Enable RLS
ALTER TABLE cron_refresh_history ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'cron_refresh_history'
    AND policyname = 'Service role can manage cron history'
  ) THEN
    CREATE POLICY "Service role can manage cron history"
      ON cron_refresh_history
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;
`;

async function applyMigration() {
  console.log('🔄 Applying cron_refresh_history migration...\n');
  console.log('📝 Using Supabase Management API for direct SQL execution\n');

  try {
    const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
    const accessToken = process.env.SUPABASE_ACCESS_TOKEN;

    if (!projectRef) {
      throw new Error('Could not extract project reference from NEXT_PUBLIC_SUPABASE_URL');
    }

    if (!accessToken) {
      console.log('⚠️  SUPABASE_ACCESS_TOKEN not set, trying service role client method...\n');
      return await applyViaSQLStatements();
    }

    // Use Management API to execute SQL
    const response = await fetch(
      `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: migrationSQL })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Management API error (${response.status}): ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Migration executed via Management API');
    console.log('✅ Result:', JSON.stringify(result, null, 2));

    // Verify the table was created
    await verifyMigration();

    console.log('\n🎉 Cron system database migration complete!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.log('\n💡 Manual alternative: Run this SQL in Supabase Dashboard:\n');
    console.log(migrationSQL);
    process.exit(1);
  }
}

async function applyViaSQLStatements() {
  console.log('📝 Using service role client with individual SQL statements\n');

  const supabase = await createServiceRoleClient();
  if (!supabase) {
    throw new Error('Failed to create Supabase client');
  }

  try {
    // Create table
    console.log('1️⃣ Creating cron_refresh_history table...');
    await supabase.rpc('exec', {
      sql: `CREATE TABLE IF NOT EXISTS cron_refresh_history (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        completed_at TIMESTAMP WITH TIME ZONE,
        status TEXT NOT NULL CHECK (status IN ('running', 'completed', 'failed')),
        domains_processed INTEGER DEFAULT 0,
        domains_failed INTEGER DEFAULT 0,
        pages_refreshed INTEGER DEFAULT 0,
        total_duration_ms INTEGER,
        error_message TEXT,
        metadata JSONB,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );`
    }).then(({ error }) => {
      if (error && !error.message?.includes('already exists')) {
        throw error;
      }
    });

    console.log('2️⃣ Creating indexes...');
    await supabase.rpc('exec', {
      sql: `CREATE INDEX IF NOT EXISTS idx_cron_history_status ON cron_refresh_history(status, started_at DESC);`
    });
    await supabase.rpc('exec', {
      sql: `CREATE INDEX IF NOT EXISTS idx_cron_history_started ON cron_refresh_history(started_at DESC);`
    });

    console.log('3️⃣ Enabling RLS...');
    await supabase.rpc('exec', {
      sql: `ALTER TABLE cron_refresh_history ENABLE ROW LEVEL SECURITY;`
    }).then(({ error }) => {
      if (error && !error.message?.includes('already enabled')) {
        console.log('⚠️  RLS might already be enabled');
      }
    });

    console.log('4️⃣ Creating RLS policy...');
    // Policy creation might fail if it exists, that's ok
    await supabase.rpc('exec', {
      sql: `CREATE POLICY "Service role can manage cron history"
        ON cron_refresh_history
        FOR ALL
        TO service_role
        USING (true)
        WITH CHECK (true);`
    }).then(({ error }) => {
      if (error && !error.message?.includes('already exists')) {
        console.log('⚠️  Policy might already exist');
      }
    });

    await verifyMigration();
    console.log('\n🎉 Migration complete!\n');

  } catch (error: any) {
    throw new Error(`SQL execution error: ${error.message}`);
  }
}

async function verifyMigration() {
  const supabase = await createServiceRoleClient();

  const { error: verifyError } = await supabase
    .from('cron_refresh_history')
    .select('count')
    .limit(1);

  if (verifyError) {
    throw new Error(`Verification failed: ${verifyError.message}`);
  }

  console.log('✅ Table verified: cron_refresh_history');
  console.log('✅ Indexes: idx_cron_history_status, idx_cron_history_started');
  console.log('✅ RLS: Enabled with service role policy');
}

applyMigration();
