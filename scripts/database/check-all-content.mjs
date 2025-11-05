#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';

async function checkAllContent() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const thompsonId = '8dccd788-1ec1-43c2-af56-78aa3366bad3';

  console.log('Checking all content tables for Thompson customer...\n');

  // Check scraped_pages
  const { count: scrapedPages } = await supabase
    .from('scraped_pages')
    .select('*', { count: 'exact', head: true })
    .eq('customer_id', thompsonId);

  console.log(`scraped_pages: ${scrapedPages || 0} rows`);

  // Check website_content
  const { count: websiteContent } = await supabase
    .from('website_content')
    .select('*', { count: 'exact', head: true })
    .eq('customer_id', thompsonId);

  console.log(`website_content: ${websiteContent || 0} rows`);

  // Check page_embeddings
  const { count: pageEmbeddings } = await supabase
    .from('page_embeddings')
    .select('*', { count: 'exact', head: true })
    .eq('customer_id', thompsonId);

  console.log(`page_embeddings: ${pageEmbeddings || 0} rows`);

  // Check structured_extractions
  const { count: extractions } = await supabase
    .from('structured_extractions')
    .select('*', { count: 'exact', head: true })
    .eq('customer_id', thompsonId);

  console.log(`structured_extractions: ${extractions || 0} rows`);

  // Check if ANY customer has data
  console.log('\n\nChecking if ANY customer has scraped content...\n');

  const { data: anyScraped } = await supabase
    .from('scraped_pages')
    .select('customer_id')
    .limit(1);

  const { data: anyWebsite } = await supabase
    .from('website_content')
    .select('customer_id')
    .limit(1);

  console.log(`ANY scraped_pages: ${anyScraped && anyScraped.length > 0 ? 'YES' : 'NO'}`);
  console.log(`ANY website_content: ${anyWebsite && anyWebsite.length > 0 ? 'YES' : 'NO'}`);

  if (anyWebsite && anyWebsite.length > 0) {
    // Get customer with most website content
    const { data: topCustomer } = await supabase
      .from('website_content')
      .select('customer_id')
      .limit(1000);

    const counts = {};
    topCustomer.forEach(row => {
      counts[row.customer_id] = (counts[row.customer_id] || 0) + 1;
    });

    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);

    console.log('\n\nTop customers by website_content count:');
    for (const [customerId, count] of sorted.slice(0, 5)) {
      const { data: customer } = await supabase
        .from('customer_configs')
        .select('domain, business_name')
        .eq('id', customerId)
        .single();

      console.log(`  ${customer?.business_name || customer?.domain || 'Unknown'}: ${count} pages (ID: ${customerId})`);
    }
  }
}

checkAllContent().catch(console.error);
