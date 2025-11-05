#!/usr/bin/env tsx
import { config } from 'dotenv';
import { readFileSync } from 'fs';
import pg from 'pg';
import { resolve } from 'path';

config({ path: '.env.local' });

const { Client } = pg;

// Build connection string from Supabase env vars
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Extract project ref from URL (e.g., birugqyuqhiahxvxeyqg from https://birugqyuqhiahxvxeyqg.supabase.co)
const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

if (!projectRef) {
  throw new Error('Could not extract project ref from SUPABASE_URL');
}

// Supabase PostgreSQL connection uses pooler on port 6543
const connectionString = `postgresql://postgres.${projectRef}:${serviceRoleKey}@aws-0-us-west-1.pooler.supabase.com:6543/postgres`;

async function applyMigration() {
  const client = new Client({ connectionString });

  try {
    console.log('🔌 Connecting to Supabase PostgreSQL...\n');
    await client.connect();
    console.log('✅ Connected!\n');

    console.log('📄 Reading SQL migration file...\n');
    const sqlPath = resolve(__dirname, 'create-lookup-failures-table.sql');
    const sql = readFileSync(sqlPath, 'utf-8');

    console.log('⚙️  Executing migration...\n');
    await client.query(sql);
    console.log('✅ Migration applied successfully!\n');

    console.log('🔍 Verifying table creation...\n');
    const tableCheck = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'lookup_failures'
      ORDER BY ordinal_position
    `);

    console.log(`📊 Table columns (${tableCheck.rows.length}):`);
    tableCheck.rows.forEach(row => {
      console.log(`  - ${row.column_name} (${row.data_type})`);
    });

    console.log('\n🔍 Verifying indexes...\n');
    const indexCheck = await client.query(`
      SELECT indexname
      FROM pg_indexes
      WHERE tablename = 'lookup_failures'
    `);

    console.log(`📊 Indexes (${indexCheck.rows.length}):`);
    indexCheck.rows.forEach(row => {
      console.log(`  - ${row.indexname}`);
    });

    console.log('\n✨ SUCCESS! lookup_failures table is ready for telemetry tracking!');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.message.includes('already exists')) {
      console.log('\nℹ️  Table already exists. Migration may have been applied previously.');
    }
    throw error;
  } finally {
    await client.end();
  }
}

applyMigration().catch(console.error);
