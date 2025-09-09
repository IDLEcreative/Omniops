const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://birugqyuqhiahxvxeyqg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpcnVncXl1cWhpYWh4dnhleXFnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTc4NzE2NCwiZXhwIjoyMDcxMzYzMTY0fQ.5bw0QlkRgv_PA7iHrpWixvC31d7WZ5VYSR2JZnhsw8s';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyCleanupNeeded() {
  console.log('🔍 DATABASE CLEANUP VERIFICATION');
  console.log('=' .repeat(60));
  console.log('\nChecking what cleanup actions are needed...\n');
  
  // Tables that need to be created
  const tablesToCreate = ['scrape_jobs', 'query_cache'];
  
  // Tables that should be dropped
  const tablesToDrop = [
    'chat_sessions',
    'chat_messages',
    'businesses',
    'business_configs',
    'business_usage',
    'privacy_requests',
    'customer_verifications',
    'customer_access_logs',
    'customer_data_cache',
    'ai_optimized_content',
    'content_hashes',
    'page_content_references',
    'domain_patterns',
    'training_data',
    'content_refresh_jobs',
    'customers'
  ];
  
  // Tables that should remain
  const tablesToKeep = [
    'customer_configs',
    'domains',
    'scraped_pages',
    'page_embeddings',
    'structured_extractions',
    'conversations',
    'messages',
    'website_content'
  ];
  
  const actions = {
    create: [],
    drop: [],
    keep: []
  };
  
  console.log('📋 TABLES TO CREATE:');
  for (const table of tablesToCreate) {
    const { error } = await supabase
      .from(table)
      .select('id')
      .limit(1);
    
    if (error && (error.message.includes('not exist') || error.message.includes('not found'))) {
      console.log(`  ❌ ${table} - NEEDS TO BE CREATED`);
      actions.create.push(table);
    } else {
      console.log(`  ✅ ${table} - Already exists`);
    }
  }
  
  console.log('\n🗑️  TABLES TO DROP:');
  for (const table of tablesToDrop) {
    const { error, count } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });
    
    if (!error) {
      console.log(`  ⚠️  ${table} - EXISTS (${count || 0} rows) - SHOULD BE DROPPED`);
      actions.drop.push({ table, rows: count || 0 });
    } else if (error.message.includes('not exist')) {
      console.log(`  ✅ ${table} - Already removed`);
    }
  }
  
  console.log('\n✅ TABLES TO KEEP:');
  for (const table of tablesToKeep) {
    const { error, count } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });
    
    if (!error) {
      console.log(`  ✅ ${table} - Active (${count || 0} rows)`);
      actions.keep.push({ table, rows: count || 0 });
    } else {
      console.log(`  ❌ ${table} - ERROR: ${error.message}`);
    }
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log('\n📊 SUMMARY OF REQUIRED ACTIONS:\n');
  
  if (actions.create.length > 0) {
    console.log(`🔨 Tables to CREATE: ${actions.create.length}`);
    actions.create.forEach(t => console.log(`   - ${t}`));
  }
  
  if (actions.drop.length > 0) {
    console.log(`\n🗑️  Tables to DROP: ${actions.drop.length}`);
    const totalRows = actions.drop.reduce((sum, t) => sum + t.rows, 0);
    actions.drop.forEach(t => console.log(`   - ${t.table} (${t.rows} rows)`));
    console.log(`   Total rows that would be deleted: ${totalRows}`);
  }
  
  console.log(`\n✅ Tables to KEEP: ${actions.keep.length}`);
  const totalKeepRows = actions.keep.reduce((sum, t) => sum + t.rows, 0);
  console.log(`   Total rows preserved: ${totalKeepRows.toLocaleString()}`);
  
  if (actions.create.length === 0 && actions.drop.length === 0) {
    console.log('\n✨ Database is already clean! No actions needed.');
  } else {
    console.log('\n⚠️  NEXT STEPS:');
    console.log('1. Run the migration SQL in Supabase Dashboard SQL Editor');
    console.log('2. Location: supabase/migrations/20250909_database_cleanup.sql');
    console.log('3. After migration, update code to remove references to dropped tables');
  }
}

verifyCleanupNeeded().catch(console.error);