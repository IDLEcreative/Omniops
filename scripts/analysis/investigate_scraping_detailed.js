import { createClient  } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function investigateScrapingDetailed() {
  console.log('=== FORENSIC INVESTIGATION: WHY EMBEDDINGS EXIST ===\n');

  // 1. Check domains table
  console.log('1. CHECKING DOMAINS TABLE:');
  const { data: domains, error: domainError } = await supabase
    .from('domains')
    .select('*');
  
  if (domains && domains.length > 0) {
    console.log(`   Found ${domains.length} domains:`);
    domains.forEach(d => {
      console.log(`   - ID: ${d.id}, Domain: ${d.domain}, Created: ${d.created_at}`);
    });
  } else {
    console.log('   No domains found');
  }

  // 2. Check scraped_pages with domain_id (not customer_id!)
  console.log('\n2. CHECKING SCRAPED_PAGES BY DOMAIN_ID:');
  const { data: scrapedPages } = await supabase
    .from('scraped_pages')
    .select('id, url, domain_id, scraped_at')
    .order('scraped_at', { ascending: false })
    .limit(20);
  
  if (scrapedPages && scrapedPages.length > 0) {
    console.log(`   Found ${scrapedPages.length} scraped pages (showing first 20):`);
    
    // Group by domain_id
    const pagesByDomain = {};
    for (const page of scrapedPages) {
      if (!pagesByDomain[page.domain_id]) {
        pagesByDomain[page.domain_id] = [];
      }
      pagesByDomain[page.domain_id].push(page);
    }
    
    for (const [domainId, pages] of Object.entries(pagesByDomain)) {
      console.log(`\n   Domain ID: ${domainId || 'NULL'}`);
      pages.slice(0, 3).forEach(p => {
        console.log(`      ${new Date(p.scraped_at).toISOString()} - ${p.url}`);
      });
      if (pages.length > 3) {
        console.log(`      ... and ${pages.length - 3} more pages`);
      }
    }
  } else {
    console.log('   No scraped pages found');
  }

  // 3. Get total count by domain
  console.log('\n3. TOTAL PAGES PER DOMAIN:');
  if (domains && domains.length > 0) {
    for (const domain of domains) {
      const { count } = await supabase
        .from('scraped_pages')
        .select('*', { count: 'exact', head: true })
        .eq('domain_id', domain.id);
      
      console.log(`   ${domain.domain}: ${count || 0} pages`);
    }
  }

  // 4. Check page_embeddings table - look for any with page_id
  console.log('\n4. CHECKING PAGE_EMBEDDINGS:');
  const { data: embeddings, count: embCount } = await supabase
    .from('page_embeddings')
    .select('page_id, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .limit(10);
  
  console.log(`   Total embeddings: ${embCount || 0}`);
  
  if (embeddings && embeddings.length > 0) {
    console.log('   Sample embeddings (last 10):');
    
    // Get the page URLs for these embeddings
    const pageIds = embeddings.map(e => e.page_id);
    const { data: pages } = await supabase
      .from('scraped_pages')
      .select('id, url, domain_id')
      .in('id', pageIds);
    
    if (pages) {
      const pageMap = {};
      pages.forEach(p => pageMap[p.id] = p);
      
      embeddings.forEach(emb => {
        const page = pageMap[emb.page_id];
        if (page) {
          console.log(`      ${new Date(emb.created_at).toISOString()} - Page ID: ${emb.page_id}, URL: ${page.url}`);
        }
      });
    }
  }

  // 5. Check for thompsonseparts specifically
  console.log('\n5. CHECKING FOR THOMPSONSEPARTS DATA:');
  
  // Find domain ID for thompsonseparts
  const { data: thompsonsDomain } = await supabase
    .from('domains')
    .select('id')
    .or('domain.eq.thompsonseparts.co.uk,domain.eq.thompsons-eparts.com,domain.eq.www.thompsonseparts.co.uk')
    .single();
  
  if (thompsonsDomain) {
    console.log(`   Found domain ID: ${thompsonsDomain.id}`);
    
    const { count: pageCount } = await supabase
      .from('scraped_pages')
      .select('*', { count: 'exact', head: true })
      .eq('domain_id', thompsonsDomain.id);
    
    console.log(`   Total pages for this domain: ${pageCount || 0}`);
    
    // Check embeddings for these pages
    const { data: thompsonsPages } = await supabase
      .from('scraped_pages')
      .select('id')
      .eq('domain_id', thompsonsDomain.id)
      .limit(100);
    
    if (thompsonsPages && thompsonsPages.length > 0) {
      const pageIds = thompsonsPages.map(p => p.id);
      const { count: embeddingCount } = await supabase
        .from('page_embeddings')
        .select('*', { count: 'exact', head: true })
        .in('page_id', pageIds);
      
      console.log(`   Total embeddings for this domain: ${embeddingCount || 0}`);
    }
  } else {
    console.log('   No thompsonseparts domain found in database');
  }

  // 6. Check scraping timeline to understand when data was created
  console.log('\n6. SCRAPING TIMELINE ANALYSIS:');
  const { data: allPages } = await supabase
    .from('scraped_pages')
    .select('scraped_at')
    .order('scraped_at', { ascending: true });
  
  if (allPages && allPages.length > 0) {
    const timeline = {};
    allPages.forEach(page => {
      const date = new Date(page.scraped_at);
      const dayKey = date.toISOString().split('T')[0];
      timeline[dayKey] = (timeline[dayKey] || 0) + 1;
    });
    
    console.log('   Pages scraped by day:');
    Object.entries(timeline)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .forEach(([day, count]) => {
        console.log(`      ${day}: ${count} pages`);
      });
  }

  // 7. Most importantly: check if the upsert logic is working
  console.log('\n7. CHECKING FOR DUPLICATE URLS (upsert behavior):');
  const { data: allUrls } = await supabase
    .from('scraped_pages')
    .select('url, id, scraped_at')
    .order('url');
  
  if (allUrls) {
    const urlCounts = {};
    allUrls.forEach(({ url }) => {
      urlCounts[url] = (urlCounts[url] || 0) + 1;
    });
    
    const duplicates = Object.entries(urlCounts).filter(([, count]) => count > 1);
    if (duplicates.length > 0) {
      console.log(`   Found ${duplicates.length} duplicate URLs (should be 0 if upsert works correctly):`);
      duplicates.slice(0, 5).forEach(([url, count]) => {
        console.log(`      ${url} - appears ${count} times`);
      });
    } else {
      console.log('   No duplicate URLs found (upsert is working correctly)');
    }
  }

  console.log('\n=== INVESTIGATION COMPLETE ===');
  
  console.log('\n=== KEY FINDINGS ===');
  console.log('The scraper uses UPSERT with onConflict: "url"');
  console.log('This means if a URL was scraped before, it gets UPDATED, not created new');
  console.log('The embeddings check looks for existing embeddings by page_id');
  console.log('So if pages were scraped before, they retain their IDs and embeddings!');
}

investigateScrapingDetailed().catch(console.error);