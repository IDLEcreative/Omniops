import { createClient  } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function investigateAllCustomers() {
  console.log('=== INVESTIGATING ALL CUSTOMERS IN DATABASE ===\n');

  // 1. Get all unique customer_ids from scraped_pages
  const { data: customers, error } = await supabase
    .from('scraped_pages')
    .select('customer_id');
  
  if (customers && customers.length > 0) {
    const uniqueCustomers = [...new Set(customers.map(c => c.customer_id))];
    console.log('1. UNIQUE CUSTOMER IDs IN scraped_pages:');
    uniqueCustomers.forEach(id => {
      console.log(`   - ${id}`);
    });
    
    // Count pages per customer
    for (const customerId of uniqueCustomers) {
      const { data: count } = await supabase
        .from('scraped_pages')
        .select('id', { count: 'exact', head: true })
        .eq('customer_id', customerId);
      
      console.log(`\n   Customer "${customerId}": ${count ? count.length : 0} pages`);
      
      // Get sample URLs
      const { data: sampleUrls } = await supabase
        .from('scraped_pages')
        .select('url')
        .eq('customer_id', customerId)
        .limit(3);
      
      if (sampleUrls) {
        console.log('   Sample URLs:');
        sampleUrls.forEach(({ url }) => {
          console.log(`      - ${url}`);
        });
      }
    }
  } else {
    console.log('No customers found in scraped_pages table');
  }

  // 2. Check customer_configs table
  console.log('\n2. CUSTOMERS IN customer_configs TABLE:');
  const { data: configs, error: configError } = await supabase
    .from('customer_configs')
    .select('id, domain, created_at');
  
  if (configs) {
    configs.forEach(config => {
      console.log(`   ID: ${config.id}, Domain: ${config.domain}, Created: ${config.created_at}`);
    });
  } else {
    console.log('   No customer configs found');
  }

  // 3. Check page_embeddings for any customer_ids
  console.log('\n3. CUSTOMERS IN page_embeddings TABLE:');
  const { data: embeddingCustomers } = await supabase
    .from('page_embeddings')
    .select('customer_id');
  
  if (embeddingCustomers && embeddingCustomers.length > 0) {
    const uniqueEmbCustomers = [...new Set(embeddingCustomers.map(c => c.customer_id))];
    uniqueEmbCustomers.forEach(id => {
      console.log(`   - ${id}`);
    });
  } else {
    console.log('   No embeddings found');
  }

  // 4. Check website_content table (alternative storage)
  console.log('\n4. CHECKING website_content TABLE:');
  const { data: websiteContent } = await supabase
    .from('website_content')
    .select('customer_id, url')
    .limit(10);
  
  if (websiteContent && websiteContent.length > 0) {
    const contentByCustomer = {};
    websiteContent.forEach(({ customer_id, url }) => {
      if (!contentByCustomer[customer_id]) {
        contentByCustomer[customer_id] = [];
      }
      contentByCustomer[customer_id].push(url);
    });
    
    for (const [customerId, urls] of Object.entries(contentByCustomer)) {
      console.log(`   Customer "${customerId}": ${urls.length} sample URLs`);
      urls.slice(0, 2).forEach(url => {
        console.log(`      - ${url}`);
      });
    }
  } else {
    console.log('   No content found in website_content table');
  }

  // 5. Check page_embeddings table (alternative embeddings storage)
  console.log('\n5. CHECKING page_embeddings TABLE:');
  const { data: contentEmbeddings } = await supabase
    .from('page_embeddings')
    .select('customer_id')
    .limit(100);
  
  if (contentEmbeddings && contentEmbeddings.length > 0) {
    const uniqueContentCustomers = [...new Set(contentEmbeddings.map(c => c.customer_id))];
    console.log(`   Found embeddings for ${uniqueContentCustomers.length} customers:`);
    uniqueContentCustomers.forEach(id => {
      console.log(`   - ${id}`);
    });
    
    // Count embeddings per customer
    for (const customerId of uniqueContentCustomers) {
      const { data: count } = await supabase
        .from('page_embeddings')
        .select('id', { count: 'exact', head: true })
        .eq('customer_id', customerId);
      
      console.log(`      "${customerId}": ${count ? count.length : 0} embeddings`);
    }
  } else {
    console.log('   No embeddings found in page_embeddings table');
  }

  console.log('\n=== END OF INVESTIGATION ===');
}

investigateAllCustomers().catch(console.error);