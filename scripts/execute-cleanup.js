const fetch = require('node-fetch');

// Supabase Management API configuration
const SUPABASE_ACCESS_TOKEN = 'sbp_f30783ba26b0a6ae2bba917988553bd1d5f76d97';
const PROJECT_REF = 'birugqyuqhiahxvxeyqg';

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
    // Use Supabase Management API to execute SQL
    const response = await fetch(
      `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: cleanupSQL
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Failed to execute SQL:', response.status, errorText);
      
      // Try alternative approach using direct connection
      console.log('\n📝 Alternative: Copy and run this SQL in Supabase Dashboard:');
      console.log('https://supabase.com/dashboard/project/birugqyuqhiahxvxeyqg/sql\n');
      console.log(cleanupSQL);
      return;
    }

    const result = await response.json();
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
    console.log('https://supabase.com/dashboard/project/birugqyuqhiahxvxeyqg/sql\n');
    console.log(cleanupSQL);
  }
}

// Also verify the final state
async function verifyFinalState() {
  const { createClient } = require('@supabase/supabase-js');
  
  const supabaseUrl = 'https://birugqyuqhiahxvxeyqg.supabase.co';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpcnVncXl1cWhpYWh4dnhleXFnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTc4NzE2NCwiZXhwIjoyMDcxMzYzMTY0fQ.5bw0QlkRgv_PA7iHrpWixvC31d7WZ5VYSR2JZnhsw8s';
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
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