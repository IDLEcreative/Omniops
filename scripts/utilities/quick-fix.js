import { createClient  } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function quickFix() {
  console.log('Testing database connection...\n');
  
  try {
    // Test basic connectivity
    const { count, error } = await supabase
      .from('scraped_pages')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.log('❌ Database error:', error.message);
      return;
    }
    
    console.log('✅ Database is responding!');
    console.log(`📊 Total scraped pages: ${count}\n`);
    
    // Check if indexes exist
    const { data: indexes } = await supabase
      .from('pg_indexes')
      .select('indexname')
      .eq('tablename', 'page_embeddings');
    
    console.log('Existing indexes on page_embeddings:');
    if (indexes && indexes.length > 0) {
      indexes.forEach(idx => console.log(`  - ${idx.indexname}`));
    } else {
      console.log('  (none found or unable to query)');
    }
    
    console.log('\n⚠️  IMPORTANT: The critical indexes need to be added manually.');
    console.log('Please go to the Supabase SQL Editor and run the SQL from URGENT-RUN-THIS-SQL.sql');
    console.log('\nThe most critical fix is:');
    console.log('CREATE INDEX IF NOT EXISTS idx_page_embeddings_page_id ON page_embeddings(page_id);');
    
  } catch (err) {
    console.error('Error:', err.message);
  }
}

quickFix();