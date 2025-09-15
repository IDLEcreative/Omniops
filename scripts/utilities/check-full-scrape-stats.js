import { createClient  } from '@supabase/supabase-js';

const supabaseUrl = 'https://birugqyuqhiahxvxeyqg.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpcnVncXl1cWhpYWh4dnhleXFnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTc4NzE2NCwiZXhwIjoyMDcxMzYzMTY0fQ.5bw0QlkRgv_PA7iHrpWixvC31d7WZ5VYSR2JZnhsw8s';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function getFullStats() {
  console.log('📊 COMPLETE THOMPSONS SCRAPING STATISTICS\n');
  console.log('='.repeat(50));
  
  // Count all Thompsons pages
  const { count: thompsonsPagesCount } = await supabase
    .from('scraped_pages')
    .select('*', { count: 'exact', head: true })
    .like('url', '%thompsonseparts%');
    
  console.log(`\n✅ Total Thompsons pages scraped: ${thompsonsPagesCount}`);
  
  // Get scraping time range
  const { data: timeRange } = await supabase
    .from('scraped_pages')
    .select('last_scraped_at')
    .like('url', '%thompsonseparts%')
    .order('last_scraped_at', { ascending: true })
    .limit(1);
    
  const { data: latestScrape } = await supabase
    .from('scraped_pages')
    .select('last_scraped_at')
    .like('url', '%thompsonseparts%')
    .order('last_scraped_at', { ascending: false })
    .limit(1);
    
  if (timeRange?.[0] && latestScrape?.[0]) {
    const start = new Date(timeRange[0].last_scraped_at);
    const end = new Date(latestScrape[0].last_scraped_at);
    const duration = (end - start) / 1000 / 60; // in minutes
    
    console.log(`\n⏱️  Scraping time:`);
    console.log(`   Started: ${start.toLocaleTimeString()}`);
    console.log(`   Completed: ${end.toLocaleTimeString()}`);
    console.log(`   Duration: ${duration.toFixed(1)} minutes`);
  }
  
  // Count embeddings
  const { data: thompsonsPageIds } = await supabase
    .from('scraped_pages')
    .select('id')
    .like('url', '%thompsonseparts%');
    
  if (thompsonsPageIds) {
    const { count: embeddingsCount } = await supabase
      .from('page_embeddings')
      .select('*', { count: 'exact', head: true })
      .in('page_id', thompsonsPageIds.map(p => p.id));
      
    console.log(`\n🧠 Vector embeddings generated: ${embeddingsCount}`);
    console.log(`   Average chunks per page: ${(embeddingsCount / thompsonsPagesCount).toFixed(1)}`);
  }
  
  // Sample of page types scraped
  const { data: pageTypes } = await supabase
    .from('scraped_pages')
    .select('url')
    .like('url', '%thompsonseparts%');
    
  if (pageTypes) {
    const categories = new Set();
    pageTypes.forEach(page => {
      if (page.url.includes('/product-category/')) categories.add('Product Category');
      else if (page.url.includes('/product/')) categories.add('Product Page');
      else if (page.url.includes('/about')) categories.add('About Page');
      else if (page.url.includes('/contact')) categories.add('Contact Page');
      else if (page.url === 'https://www.thompsonseparts.co.uk/') categories.add('Homepage');
      else categories.add('Other');
    });
    
    console.log(`\n📑 Page types scraped:`);
    categories.forEach(cat => console.log(`   - ${cat}`));
  }
  
  // Check content quality - sample a page
  const { data: samplePage } = await supabase
    .from('scraped_pages')
    .select('title, content')
    .like('url', '%thompsonseparts%')
    .limit(1)
    .single();
    
  if (samplePage) {
    console.log(`\n📝 Content quality check:`);
    console.log(`   Sample page: "${samplePage.title}"`);
    console.log(`   Content length: ${samplePage.content.length} characters`);
    console.log(`   Words (approx): ${samplePage.content.split(/\s+/).length}`);
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('✅ SCRAPING COMPLETED SUCCESSFULLY!\n');
}

getFullStats().catch(console.error);