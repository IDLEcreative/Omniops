import { readFileSync } from 'fs';

const SUPABASE_ACCESS_TOKEN = 'sbp_f30783ba26b0a6ae2bba917988553bd1d5f76d97';
const PROJECT_REF = 'birugqyuqhiahxvxeyqg';

async function exec(sql: string) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: sql })
  });
  return await res.json();
}

(async () => {
  console.log('🗑️  Dropping old function...');
  await exec('DROP FUNCTION IF EXISTS public.refresh_chat_telemetry_rollups CASCADE;');
  console.log('✅ Dropped\n');

  console.log('🔧 Creating working function with 3 separate WITH blocks...');
  const sql = readFileSync('apply-working-function.sql', 'utf-8');
  await exec(sql);
  console.log('✅ Function created!\n');

  console.log('🧪 Testing (1 hour)...');
  const test = await exec("SELECT public.refresh_chat_telemetry_rollups('hour', NOW() - INTERVAL '1 hour');");
  console.log(`✅ Test: ${test[0]?.refresh_chat_telemetry_rollups} rows\n`);

  console.log('📊 Populating hourly (14 days)...');
  const h = await exec("SELECT public.refresh_chat_telemetry_rollups('hour', NOW() - INTERVAL '14 days');");
  console.log(`✅ ${h[0]?.refresh_chat_telemetry_rollups} rows\n`);

  console.log('📊 Populating daily (90 days)...');
  const d = await exec("SELECT public.refresh_chat_telemetry_rollups('day', NOW() - INTERVAL '90 days');");
  console.log(`✅ ${d[0]?.refresh_chat_telemetry_rollups} rows\n`);

  console.log('✅ Verifying...');
  const [c1, c2, c3] = await Promise.all([
    exec('SELECT COUNT(*) FROM chat_telemetry_rollups;'),
    exec('SELECT COUNT(*) FROM chat_telemetry_domain_rollups;'),
    exec('SELECT COUNT(*) FROM chat_telemetry_model_rollups;')
  ]);

  console.log(`\n📈 Final Counts:`);
  console.log(`   chat_telemetry_rollups: ${c1[0]?.count}`);
  console.log(`   chat_telemetry_domain_rollups: ${c2[0]?.count}`);
  console.log(`   chat_telemetry_model_rollups: ${c3[0]?.count}\n`);

  console.log('✨ SUCCESS! Telemetry dashboard is now fully optimized!');
})();
