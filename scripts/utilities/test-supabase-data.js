import { createClient  } from '@supabase/supabase-js';

const supabaseUrl = 'https://birugqyuqhiahxvxeyqg.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpcnVncXl1cWhpYWh4dnhleXFnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTc4NzE2NCwiZXhwIjoyMDcxMzYzMTY0fQ.5bw0QlkRgv_PA7iHrpWixvC31d7WZ5VYSR2JZnhsw8s';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkScrapedData() {
  console.log('Checking Thompsons scraped data in Supabase...\n');
  
  // Check scraped_pages table
  const { data: pages, error: pagesError } = await supabase
    .from('scraped_pages')
    .select('id, url, title, last_scraped_at')
    .like('url', '%thompsonseparts%')
    .order('last_scraped_at', { ascending: false })
    .limit(5);
    
  if (pagesError) {
    console.error('Error fetching scraped_pages:', pagesError);
  } else {
    console.log(`Found ${pages?.length || 0} Thompsons pages in scraped_pages table:`);
    pages?.forEach(page => {
      console.log(`  - ${page.title || 'No title'}`);
      console.log(`    URL: ${page.url}`);
      console.log(`    Scraped: ${page.last_scraped_at}\n`);
    });
  }
  
  // Check page_embeddings table
  const { data: embeddings, count } = await supabase
    .from('page_embeddings')
    .select('id', { count: 'exact', head: true })
    .in('page_id', pages?.map(p => p.id) || []);
    
  console.log(`Total embeddings for these pages: ${count || 0}\n`);
  
  // Check total pages in database
  const { count: totalPages } = await supabase
    .from('scraped_pages')
    .select('id', { count: 'exact', head: true });
    
  console.log(`Total pages in database: ${totalPages || 0}`);
  
  // Check recent scraping activity
  const { data: recentPages } = await supabase
    .from('scraped_pages')
    .select('url, last_scraped_at')
    .gte('last_scraped_at', new Date(Date.now() - 30 * 60 * 1000).toISOString()) // Last 30 minutes
    .order('last_scraped_at', { ascending: false })
    .limit(3);
    
  console.log(`\nPages scraped in last 30 minutes: ${recentPages?.length || 0}`);
  recentPages?.forEach(page => {
    console.log(`  - ${page.url.substring(0, 60)}...`);
  });
}

checkScrapedData().catch(console.error);