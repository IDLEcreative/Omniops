// MIGRATED: Now uses environment variables via supabase-config.js
import { getSupabaseConfig, executeSQL } from './supabase-config.js';

const config = getSupabaseConfig();

async function executeCleanupSQL() {
  console.log('🧹 EXECUTING DATABASE CLEANUP');
  console.log('=' .repeat(60));
  
  // SQL to drop all unused tables
  const cleanupSQL = `
-- Drop deprecated duplicate tables
DROP TABLE IF EXISTS public.chat_sessions CASCADE;
DROP TABLE IF EXISTS public.chat_messages CASCADE;

-- Drop unused multi-tenant tables  
DROP TABLE IF EXISTS public.businesses CASCADE;
DROP TABLE IF EXISTS public.business_configs CASCADE;
DROP TABLE IF EXISTS public.business_usage CASCADE;

-- Drop unused privacy/compliance tables
DROP TABLE IF EXISTS public.privacy_requests CASCADE;
DROP TABLE IF EXISTS public.customer_verifications CASCADE;
DROP TABLE IF EXISTS public.customer_access_logs CASCADE;
DROP TABLE IF EXISTS public.customer_data_cache CASCADE;

-- Drop unused optimization/feature tables
DROP TABLE IF EXISTS public.ai_optimized_content CASCADE;
DROP TABLE IF EXISTS public.content_hashes CASCADE;
DROP TABLE IF EXISTS public.page_content_references CASCADE;
DROP TABLE IF EXISTS public.domain_patterns CASCADE;

-- Drop unused tables with no data
DROP TABLE IF EXISTS public.training_data CASCADE;
DROP TABLE IF EXISTS public.content_refresh_jobs CASCADE;
DROP TABLE IF EXISTS public.customers CASCADE;
`;

  try {
    // Use helper function from supabase-config.js
    const result = await executeSQL(config, cleanupSQL);
    console.log('✅ Successfully dropped all unused tables!');
    console.log('\nResult:', result);
    
    // List of dropped tables
    const droppedTables = [
      'chat_sessions', 'chat_messages',
      'businesses', 'business_configs', 'business_usage',
      'privacy_requests', 'customer_verifications', 'customer_access_logs', 'customer_data_cache',
      'ai_optimized_content', 'content_hashes', 'page_content_references', 'domain_patterns',
      'training_data', 'content_refresh_jobs', 'customers'
    ];
    
    console.log('\n🗑️  DROPPED TABLES (16 total):');
    droppedTables.forEach(table => console.log(`  - ${table}`));
    
    console.log('\n✅ REMAINING TABLES (10 essential):');
    const remainingTables = [
      'customer_configs', 'domains', 'scraped_pages', 'page_embeddings',
      'structured_extractions', 'conversations', 'messages', 'website_content',
      'scrape_jobs', 'query_cache'
    ];
    remainingTables.forEach(table => console.log(`  - ${table}`));
    
    console.log('\n✨ Database cleanup complete!');
    console.log('Your database is now optimized with only essential tables.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n📝 Please run this SQL manually in Supabase Dashboard:');
    console.log(`https://supabase.com/dashboard/project/${config.projectRef}/sql\n`);
    console.log(cleanupSQL);
  }
}

// Also verify the final state
async function verifyFinalState() {
  const { createClient } = await import('@supabase/supabase-js');
  const { createSupabaseClient } = await import('./supabase-config.js');

  // Use helper to create client from environment variables
  const supabase = await createSupabaseClient(config);
  
  console.log('\n🔍 VERIFYING FINAL STATE...\n');
  
  const tablesToCheck = [
    'chat_sessions', 'chat_messages', 'businesses', 'customers',
    'training_data', 'content_refresh_jobs'
  ];
  
  let anyExist = false;
  for (const table of tablesToCheck) {
    const { error } = await supabase
      .from(table)
      .select('id')
      .limit(1);
    
    if (!error || error.code === 'PGRST116') {
      console.log(`  ⚠️  ${table} - Still exists (run SQL manually)`);
      anyExist = true;
    } else if (error.message?.includes('not exist')) {
      console.log(`  ✅ ${table} - Successfully removed`);
    }
  }
  
  if (anyExist) {
    console.log('\n⚠️  Some tables still exist. Please run the SQL manually in Supabase Dashboard.');
  } else {
    console.log('\n✅ All unused tables have been successfully removed!');
  }
}

// Execute the cleanup
executeCleanupSQL()
  .then(() => verifyFinalState())
  .catch(console.error);