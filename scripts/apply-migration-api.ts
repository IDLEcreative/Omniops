/**
 * Apply Migration via Supabase Management API
 * This script executes DDL statements using the Supabase Management API
 */

import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';

async function applyMigration() {
  // Get project reference from Supabase URL
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const accessToken = process.env.SUPABASE_ACCESS_TOKEN;

  if (!supabaseUrl) {
    console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL in environment');
    process.exit(1);
  }

  // Extract project reference from URL (e.g., https://birugqyuqhiahxvxeyqg.supabase.co)
  const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

  if (!projectRef) {
    console.error('❌ Could not extract project reference from Supabase URL');
    console.error(`   URL: ${supabaseUrl}`);
    process.exit(1);
  }

  console.log('📊 Applying WooCommerce Usage Metrics Migration\n');
  console.log(`🔗 Project: ${projectRef}`);

  // Read the migration file
  const migrationPath = path.join(
    __dirname,
    '..',
    'supabase',
    'migrations',
    '20251029140825_add_woocommerce_usage_metrics.sql'
  );

  const sql = fs.readFileSync(migrationPath, 'utf-8');

  if (!accessToken) {
    console.log('\n⚠️  SUPABASE_ACCESS_TOKEN not found in environment');
    console.log('📋 Please run this SQL manually in Supabase Dashboard:\n');
    console.log('1. Go to: https://supabase.com/dashboard/project/' + projectRef + '/sql/new');
    console.log('2. Paste the SQL below');
    console.log('3. Click "Run"\n');
    console.log('─'.repeat(80));
    console.log(sql);
    console.log('─'.repeat(80));
    console.log('\n💡 Or set SUPABASE_ACCESS_TOKEN and run this script again');
    process.exit(0);
  }

  console.log('🔑 Using access token for Management API\n');
  console.log('⏳ Executing SQL...\n');

  try {
    const response = await fetch(
      `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: sql })
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ Migration failed:', result);
      console.error('Status:', response.status, response.statusText);

      if (response.status === 401) {
        console.error('\n🔑 Authentication failed. Please check your SUPABASE_ACCESS_TOKEN');
        console.error('   Get a new token from: https://supabase.com/dashboard/account/tokens');
      }

      process.exit(1);
    }

    console.log('✅ Migration executed successfully!\n');
    console.log('📊 Table created: woocommerce_usage_metrics');
    console.log('📊 Indexes created: 6');
    console.log('🔒 RLS enabled: 2 policies');
    console.log('\n🎉 Analytics tracking is now active for all WooCommerce operations!');
  } catch (err: any) {
    console.error('❌ Error executing migration:', err.message);
    console.error('\n📋 Please run the SQL manually in Supabase Dashboard:');
    console.error(`   https://supabase.com/dashboard/project/${projectRef}/sql/new`);
    process.exit(1);
  }
}

applyMigration();
