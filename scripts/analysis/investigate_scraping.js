const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function investigateScrapingHistory() {
  console.log('=== FORENSIC INVESTIGATION: SCRAPING HISTORY ===\n');

  // 1. Total unique URLs in scraped_pages
  const { data: totalPages, error: totalError } = await supabase
    .from('scraped_pages')
    .select('url', { count: 'exact', head: true });
  
  console.log(`1. TOTAL UNIQUE URLS IN scraped_pages: ${totalPages ? totalPages.length : 'N/A'}`);
  if (totalError) console.error('Error:', totalError);

  // 2. Get count by customer_id
  const { data: customerCounts, error: customerError } = await supabase
    .from('scraped_pages')
    .select('customer_id')
    .eq('customer_id', 'thompsonseparts.co.uk');
  
  console.log(`\n2. PAGES FOR thompsonseparts.co.uk: ${customerCounts ? customerCounts.length : 0}`);

  // 3. Scraping timeline - when were pages scraped?
  const { data: timeline, error: timelineError } = await supabase
    .from('scraped_pages')
    .select('url, scraped_at')
    .eq('customer_id', 'thompsonseparts.co.uk')
    .order('scraped_at', { ascending: true })
    .limit(10);
  
  console.log('\n3. EARLIEST SCRAPED PAGES (first 10):');
  if (timeline) {
    timeline.forEach(page => {
      console.log(`   ${new Date(page.scraped_at).toISOString()} - ${page.url}`);
    });
  }

  // 4. Get latest scraped pages
  const { data: latestPages, error: latestError } = await supabase
    .from('scraped_pages')
    .select('url, scraped_at')
    .eq('customer_id', 'thompsonseparts.co.uk')
    .order('scraped_at', { ascending: false })
    .limit(10);
  
  console.log('\n4. LATEST SCRAPED PAGES (last 10):');
  if (latestPages) {
    latestPages.forEach(page => {
      console.log(`   ${new Date(page.scraped_at).toISOString()} - ${page.url}`);
    });
  }

  // 5. Group by scraping date/hour to identify scraping sessions
  const { data: allPages, error: allError } = await supabase
    .from('scraped_pages')
    .select('scraped_at')
    .eq('customer_id', 'thompsonseparts.co.uk');
  
  if (allPages) {
    const sessions = {};
    allPages.forEach(page => {
      const date = new Date(page.scraped_at);
      const hourKey = `${date.toISOString().split('T')[0]} ${date.getHours()}:00`;
      sessions[hourKey] = (sessions[hourKey] || 0) + 1;
    });
    
    console.log('\n5. SCRAPING SESSIONS (grouped by hour):');
    Object.entries(sessions)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .forEach(([hour, count]) => {
        console.log(`   ${hour} - ${count} pages`);
      });
  }

  // 6. Check embeddings count
  const { data: embeddingsCount, error: embError } = await supabase
    .from('page_embeddings')
    .select('page_id', { count: 'exact', head: true })
    .eq('customer_id', 'thompsonseparts.co.uk');
  
  console.log(`\n6. TOTAL EMBEDDINGS for thompsonseparts.co.uk: ${embeddingsCount ? embeddingsCount.length : 0}`);

  // 7. Sample of URLs with embeddings
  const { data: sampleEmbeddings, error: sampleError } = await supabase
    .from('page_embeddings')
    .select('page_id, created_at')
    .eq('customer_id', 'thompsonseparts.co.uk')
    .limit(20);
  
  if (sampleEmbeddings && sampleEmbeddings.length > 0) {
    console.log('\n7. SAMPLE OF PAGE IDs WITH EMBEDDINGS:');
    
    // Get the actual URLs for these page IDs
    const pageIds = sampleEmbeddings.map(e => e.page_id);
    const { data: pages } = await supabase
      .from('scraped_pages')
      .select('id, url')
      .in('id', pageIds);
    
    if (pages) {
      const pageMap = {};
      pages.forEach(p => pageMap[p.id] = p.url);
      
      sampleEmbeddings.forEach(emb => {
        const url = pageMap[emb.page_id] || 'URL not found';
        console.log(`   ${new Date(emb.created_at).toISOString()} - ${url}`);
      });
    }
  }

  // 8. Check for any scraping jobs in content_refresh_jobs
  const { data: jobs, error: jobsError } = await supabase
    .from('content_refresh_jobs')
    .select('*')
    .eq('customer_id', 'thompsonseparts.co.uk')
    .order('created_at', { ascending: false })
    .limit(10);
  
  console.log('\n8. CONTENT REFRESH JOBS:');
  if (jobs && jobs.length > 0) {
    jobs.forEach(job => {
      console.log(`   ${new Date(job.created_at).toISOString()} - Status: ${job.status}, Pages: ${job.pages_processed}/${job.total_pages}`);
    });
  } else {
    console.log('   No refresh jobs found');
  }

  // 9. Check unique URL patterns
  const { data: allUrls } = await supabase
    .from('scraped_pages')
    .select('url')
    .eq('customer_id', 'thompsonseparts.co.uk');
  
  if (allUrls) {
    const patterns = {};
    allUrls.forEach(({ url }) => {
      // Extract path pattern
      try {
        const urlObj = new URL(url);
        const pathParts = urlObj.pathname.split('/').filter(p => p);
        const pattern = pathParts[0] || 'root';
        patterns[pattern] = (patterns[pattern] || 0) + 1;
      } catch (e) {
        patterns['invalid'] = (patterns['invalid'] || 0) + 1;
      }
    });
    
    console.log('\n9. URL PATTERNS (by first path segment):');
    Object.entries(patterns)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .forEach(([pattern, count]) => {
        console.log(`   /${pattern}/* - ${count} pages`);
      });
  }

  // 10. Check for duplicate URLs (same URL scraped multiple times)
  const { data: duplicates } = await supabase.rpc('find_duplicate_urls', {
    p_customer_id: 'thompsonseparts.co.uk'
  }).catch(() => null);
  
  if (!duplicates) {
    // Fallback if RPC doesn't exist
    const { data: allUrlsForDups } = await supabase
      .from('scraped_pages')
      .select('url')
      .eq('customer_id', 'thompsonseparts.co.uk');
    
    if (allUrlsForDups) {
      const urlCounts = {};
      allUrlsForDups.forEach(({ url }) => {
        urlCounts[url] = (urlCounts[url] || 0) + 1;
      });
      
      const dups = Object.entries(urlCounts).filter(([url, count]) => count > 1);
      console.log(`\n10. DUPLICATE URLS: ${dups.length} URLs appear more than once`);
      if (dups.length > 0) {
        dups.slice(0, 5).forEach(([url, count]) => {
          console.log(`   ${url} - appears ${count} times`);
        });
      }
    }
  }

  console.log('\n=== END OF INVESTIGATION ===');
}

investigateScrapingHistory().catch(console.error);