#!/usr/bin/env tsx
import { createClient } from '@supabase/supabase-js';

async function findThompsonCustomer() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Search for Thompson's customer
  const { data: customers, error } = await supabase
    .from('customer_configs')
    .select('id, domain, domain_id, name, platform')
    .or('name.ilike.%thompson%,domain.ilike.%thompson%')
    .limit(5);

  if (error) {
    console.error('Error querying customers:', error);
    process.exit(1);
  }

  if (!customers || customers.length === 0) {
    console.log('No Thompson customer found. Listing all customers:');
    const { data: allCustomers } = await supabase
      .from('customer_configs')
      .select('id, domain, domain_id, name')
      .limit(10);

    console.table(allCustomers);
    process.exit(0);
  }

  console.log('Found Thompson customer(s):');
  console.table(customers);

  // Count scraped pages
  for (const customer of customers) {
    const { count: pageCount } = await supabase
      .from('scraped_pages')
      .select('*', { count: 'exact', head: true })
      .eq('customer_id', customer.id);

    const { count: embeddingCount } = await supabase
      .from('page_embeddings')
      .select('*', { count: 'exact', head: true })
      .eq('domain_id', customer.domain_id);

    console.log(`\nCustomer: ${customer.name} (${customer.domain})`);
    console.log(`  ID: ${customer.id}`);
    console.log(`  Domain ID: ${customer.domain_id}`);
    console.log(`  Pages: ${pageCount}`);
    console.log(`  Embeddings: ${embeddingCount}`);
    console.log(`  Platform: ${customer.platform || 'generic'}`);
  }
}

findThompsonCustomer().catch(console.error);
