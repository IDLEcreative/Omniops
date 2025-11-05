#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';

async function findThompsonCustomer() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Search for Thompson's customer
  const { data: customers, error } = await supabase
    .from('customer_configs')
    .select('id, domain, business_name')
    .or('business_name.ilike.%thompson%,domain.ilike.%thompson%')
    .limit(5);

  if (error) {
    console.error('Error querying customers:', error);
    process.exit(1);
  }

  if (!customers || customers.length === 0) {
    console.log('No Thompson customer found. Listing all customers:');
    const { data: allCustomers } = await supabase
      .from('customer_configs')
      .select('id, domain, business_name')
      .limit(10);

    console.table(allCustomers);
    process.exit(0);
  }

  console.log('✅ Found Thompson customer(s):');
  console.table(customers);

  // Count scraped pages and embeddings
  for (const customer of customers) {
    const { count: pageCount } = await supabase
      .from('scraped_pages')
      .select('*', { count: 'exact', head: true })
      .eq('customer_id', customer.id);

    const { count: embeddingCount } = await supabase
      .from('page_embeddings')
      .select('*', { count: 'exact', head: true })
      .eq('customer_id', customer.id);

    console.log(`\n📊 Data for: ${customer.business_name || customer.domain}`);
    console.log(`   Customer ID: ${customer.id}`);
    console.log(`   Domain: ${customer.domain}`);
    console.log(`   Pages: ${pageCount || 0}`);
    console.log(`   Embeddings: ${embeddingCount || 0}`);

    if (pageCount && pageCount > 0) {
      console.log(`\n✅ Ready for MCP validation testing!`);
      console.log(`   Run: TEST_CUSTOMER_ID="${customer.id}" TEST_DOMAIN="${customer.domain}" npx tsx scripts/tests/run-mcp-comparison.ts --sample`);
    } else {
      console.log(`\n⚠️  No scraped content found - customer may need scraping first`);
    }
  }
}

findThompsonCustomer().catch(console.error);
