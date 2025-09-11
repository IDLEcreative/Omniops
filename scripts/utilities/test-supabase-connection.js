const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testConnection() {
  console.log('Testing Supabase connection...\n');
  
  // Test 1: Simple query
  console.log('Test 1: Simple count query');
  const startTime1 = Date.now();
  try {
    const { count, error } = await supabase
      .from('scraped_pages')
      .select('*', { count: 'exact', head: true });
    
    if (error) throw error;
    console.log(`✅ Success: ${count} pages found (${Date.now() - startTime1}ms)\n`);
  } catch (error) {
    console.log(`❌ Failed: ${error.message} (${Date.now() - startTime1}ms)\n`);
  }

  // Test 2: Database stats
  console.log('Test 2: Database connection stats');
  const startTime2 = Date.now();
  try {
    const { data, error } = await supabase.rpc('get_pg_stat_activity');
    if (!error && !data) {
      // Try direct query if RPC doesn't exist
      const { data: stats, error: statsError } = await supabase
        .from('scraped_pages')
        .select('id')
        .limit(1);
      
      if (statsError) throw statsError;
      console.log(`✅ Database responding (${Date.now() - startTime2}ms)\n`);
    } else if (error) {
      throw error;
    } else {
      console.log(`✅ Active connections: ${data?.length || 0} (${Date.now() - startTime2}ms)\n`);
    }
  } catch (error) {
    console.log(`⚠️  Stats query failed: ${error.message} (${Date.now() - startTime2}ms)\n`);
  }

  // Test 3: Write operation
  console.log('Test 3: Test write operation');
  const startTime3 = Date.now();
  try {
    const testData = {
      url: 'https://test.example.com/connection-test-' + Date.now(),
      title: 'Connection Test',
      content: 'Testing database write',
      scraped_at: new Date().toISOString(),
      word_count: 3
    };
    
    const { data, error } = await supabase
      .from('scraped_pages')
      .insert(testData)
      .select()
      .single();
    
    if (error) throw error;
    
    // Clean up test data
    await supabase
      .from('scraped_pages')
      .delete()
      .eq('id', data.id);
    
    console.log(`✅ Write/Delete successful (${Date.now() - startTime3}ms)\n`);
  } catch (error) {
    console.log(`❌ Write failed: ${error.message} (${Date.now() - startTime3}ms)\n`);
  }

  // Test 4: Bulk operation (similar to scraper)
  console.log('Test 4: Bulk insert test (5 records)');
  const startTime4 = Date.now();
  try {
    const bulkData = Array.from({ length: 5 }, (_, i) => ({
      url: `https://test.example.com/bulk-test-${Date.now()}-${i}`,
      title: `Bulk Test ${i}`,
      content: 'Testing bulk insert operation',
      scraped_at: new Date().toISOString(),
      word_count: 4
    }));
    
    const { data, error } = await supabase
      .from('scraped_pages')
      .insert(bulkData)
      .select();
    
    if (error) throw error;
    
    // Clean up
    const ids = data.map(d => d.id);
    await supabase
      .from('scraped_pages')
      .delete()
      .in('id', ids);
    
    console.log(`✅ Bulk insert/delete successful (${Date.now() - startTime4}ms)\n`);
  } catch (error) {
    console.log(`❌ Bulk operation failed: ${error.message} (${Date.now() - startTime4}ms)\n`);
  }

  // Test 5: Check for connection pooling issues
  console.log('Test 5: Concurrent connections test');
  const startTime5 = Date.now();
  try {
    const promises = Array.from({ length: 10 }, async (_, i) => {
      const { count, error } = await supabase
        .from('scraped_pages')
        .select('*', { count: 'exact', head: true });
      if (error) throw error;
      return count;
    });
    
    await Promise.all(promises);
    console.log(`✅ 10 concurrent queries successful (${Date.now() - startTime5}ms)\n`);
  } catch (error) {
    console.log(`❌ Concurrent queries failed: ${error.message} (${Date.now() - startTime5}ms)\n`);
  }

  console.log('Connection test complete!\n');
}

testConnection().catch(console.error);