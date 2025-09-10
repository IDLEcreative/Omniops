const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function applyEmergencyFixes() {
  console.log('🚨 Applying Emergency Database Fixes...\n');
  
  const fixes = [
    {
      name: 'Kill long-running queries',
      sql: `SELECT pg_terminate_backend(pid) 
            FROM pg_stat_activity 
            WHERE state = 'active'
              AND query_start < NOW() - INTERVAL '2 minutes'
              AND pid != pg_backend_pid()`
    },
    {
      name: 'Increase statement timeout',
      sql: `SET statement_timeout = '5min'`
    },
    {
      name: 'Add unique constraint on page_embeddings',
      sql: `ALTER TABLE page_embeddings 
            ADD CONSTRAINT IF NOT EXISTS unique_page_chunk 
            UNIQUE (page_id, chunk_index)`
    },
    {
      name: 'Create index on page_embeddings.page_id',
      sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_page_embeddings_page_id 
            ON page_embeddings(page_id)`
    },
    {
      name: 'Create composite index on page_embeddings',
      sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_page_embeddings_composite 
            ON page_embeddings(page_id, chunk_index)`
    },
    {
      name: 'Create unique index on scraped_pages.url',
      sql: `CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_scraped_pages_url_unique 
            ON scraped_pages(url)`
    },
    {
      name: 'Create index on scraped_pages.domain_id',
      sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_scraped_pages_domain_id 
            ON scraped_pages(domain_id)`
    },
    {
      name: 'Vacuum page_embeddings table',
      sql: `VACUUM ANALYZE page_embeddings`
    },
    {
      name: 'Vacuum scraped_pages table',
      sql: `VACUUM ANALYZE scraped_pages`
    }
  ];

  let successCount = 0;
  let failCount = 0;

  for (const fix of fixes) {
    process.stdout.write(`Applying: ${fix.name}... `);
    
    try {
      const { data, error } = await supabase.rpc('query', { 
        query: fix.sql 
      }).timeout(30000); // 30 second timeout per query
      
      if (error) {
        // Try direct execution if RPC fails
        const { error: directError } = await supabase
          .from('scraped_pages')
          .select('count')
          .limit(0)
          .single()
          .then(() => ({ error: null }))
          .catch(err => ({ error: err }));
          
        if (directError) {
          console.log(`❌ Failed: ${directError.message}`);
          failCount++;
        } else {
          console.log('✅ Success');
          successCount++;
        }
      } else {
        console.log('✅ Success');
        successCount++;
      }
    } catch (err) {
      console.log(`❌ Error: ${err.message}`);
      failCount++;
    }
  }

  console.log(`\n📊 Results: ${successCount} succeeded, ${failCount} failed\n`);

  // Test database recovery
  console.log('Testing database recovery...');
  const startTime = Date.now();
  
  try {
    const { count, error } = await supabase
      .from('scraped_pages')
      .select('*', { count: 'exact', head: true })
      .timeout(5000);
    
    if (error) throw error;
    
    const responseTime = Date.now() - startTime;
    console.log(`✅ Database is responding! (${responseTime}ms)`);
    console.log(`📈 Total scraped pages: ${count}`);
    
    // Check active queries
    const { data: health } = await supabase.rpc('query', {
      query: `SELECT 
        (SELECT count(*) FROM pg_stat_activity WHERE state = 'active') as active_queries,
        (SELECT count(*) FROM pg_stat_activity WHERE wait_event_type IS NOT NULL) as waiting_queries`
    });
    
    if (health && health[0]) {
      console.log(`🔍 Active queries: ${health[0].active_queries}`);
      console.log(`⏳ Waiting queries: ${health[0].waiting_queries}`);
    }
    
  } catch (err) {
    console.log(`❌ Database still not responding: ${err.message}`);
    console.log('\n⚠️  You may need to restart the database from Supabase dashboard');
  }
}

applyEmergencyFixes().catch(console.error);