import { config } from 'dotenv';
import { readFileSync } from 'fs';
import pg from 'pg';

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

async function runSQL() {
  const client = new Client({ connectionString });

  try {
    console.log('🔌 Connecting to Supabase PostgreSQL...\n');
    await client.connect();
    console.log('✅ Connected!\n');

    console.log('📄 Reading SQL file...\n');
    const sql = readFileSync('apply-rollup-function.sql', 'utf-8');

    console.log('⚙️  Executing function creation...\n');
    await client.query(sql);
    console.log('✅ Function created successfully!\n');

    console.log('📊 Running hourly rollups (past 14 days)...\n');
    const hourlyResult = await client.query(
      "SELECT public.refresh_chat_telemetry_rollups('hour', NOW() - INTERVAL '14 days')"
    );
    console.log(`✅ Hourly rollups: ${hourlyResult.rows[0]?.refresh_chat_telemetry_rollups} buckets\n`);

    console.log('📊 Running daily rollups (past 90 days)...\n');
    const dailyResult = await client.query(
      "SELECT public.refresh_chat_telemetry_rollups('day', NOW() - INTERVAL '90 days')"
    );
    console.log(`✅ Daily rollups: ${dailyResult.rows[0]?.refresh_chat_telemetry_rollups} buckets\n`);

    console.log('✅ Verifying rollup counts...\n');
    const countResult = await client.query('SELECT COUNT(*) FROM chat_telemetry_rollups');
    console.log(`📈 Total rollup records: ${countResult.rows[0].count}\n`);

    console.log('✨ SUCCESS! Telemetry rollups are now fully populated and optimized!');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await client.end();
  }
}

runSQL().catch(console.error);
