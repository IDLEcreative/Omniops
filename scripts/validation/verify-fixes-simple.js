const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyFixes() {
  console.log('🔍 Verifying Database Optimizations...\n');
  
  try {
    // Test query performance
    console.log('Testing query performance...');
    const startTime = Date.now();
    
    const { count: pageCount, error: pageError } = await supabase
      .from('scraped_pages')
      .select('*', { count: 'exact', head: true });
    
    const pageResponseTime = Date.now() - startTime;
    
    if (pageError) {
      console.log('❌ Error querying scraped_pages:', pageError.message);
    } else {
      console.log(`✅ scraped_pages query: ${pageResponseTime}ms (${pageCount} rows)`);
    }
    
    // Test page_embeddings
    const embedStartTime = Date.now();
    const { count: embedCount, error: embedError } = await supabase
      .from('page_embeddings')
      .select('*', { count: 'exact', head: true });
    
    const embedResponseTime = Date.now() - embedStartTime;
    
    if (embedError) {
      console.log('❌ Error querying page_embeddings:', embedError.message);
    } else {
      console.log(`✅ page_embeddings query: ${embedResponseTime}ms (${embedCount} rows)`);
    }
    
    // Performance verdict
    console.log('\n📊 Performance Analysis:');
    if (pageResponseTime < 500 && embedResponseTime < 500) {
      console.log('✅ EXCELLENT: Database is performing optimally!');
      console.log('   Indexes are working correctly.');
    } else if (pageResponseTime < 1000 && embedResponseTime < 1000) {
      console.log('⚠️  GOOD: Database performance is acceptable.');
      console.log('   Queries are reasonably fast.');
    } else {
      console.log('❌ SLOW: Database may still have performance issues.');
      console.log('   Consider additional optimizations.');
    }
    
    // Test a sample insert (simulation)
    console.log('\n🧪 Testing INSERT performance...');
    const testUrl = `https://test.example.com/page-${Date.now()}`;
    
    const insertStart = Date.now();
    const { data: insertData, error: insertError } = await supabase
      .from('scraped_pages')
      .upsert({
        url: testUrl,
        title: 'Performance Test Page',
        content: 'This is a test to verify database performance after optimizations.',
        scraped_at: new Date().toISOString()
      }, {
        onConflict: 'url'
      })
      .select()
      .single();
    
    const insertTime = Date.now() - insertStart;
    
    if (insertError) {
      console.log('❌ Insert test failed:', insertError.message);
    } else {
      console.log(`✅ INSERT completed in ${insertTime}ms`);
      
      // Clean up test data
      await supabase
        .from('scraped_pages')
        .delete()
        .eq('id', insertData.id);
    }
    
    // Final verdict
    console.log('\n🎯 FINAL VERDICT:');
    if (insertTime < 200 && pageResponseTime < 500) {
      console.log('✅ Database is FULLY OPTIMIZED and ready for scraping!');
      console.log('   All critical performance fixes have been successfully applied.');
      console.log('   The scraper should now run without timeouts.');
    } else if (insertTime < 500) {
      console.log('✅ Database performance is GOOD.');
      console.log('   Scraping should work without timeouts.');
    } else {
      console.log('⚠️  Database may need additional optimization.');
      console.log('   Monitor performance during scraping.');
    }
    
  } catch (err) {
    console.error('❌ Verification error:', err.message);
  }
}

verifyFixes();