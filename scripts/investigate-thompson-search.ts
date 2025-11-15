import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function investigate() {
  console.log('=== 1. DOMAIN CONFIGURATION ===');
  const { data: configs, error: configError } = await supabase
    .from('customer_configs')
    .select('id, domain, active, woocommerce_url, created_at')
    .ilike('domain', '%thompson%');

  if (configError) {
    console.error('Error fetching configs:', configError);
  } else {
    console.log('Matching domains:', JSON.stringify(configs, null, 2));
  }

  if (!configs || configs.length === 0) {
    console.log('⚠️ NO DOMAINS FOUND matching thompson - checking all domains:');
    const { data: allDomains } = await supabase
      .from('customer_configs')
      .select('id, domain, active')
      .order('created_at', { ascending: false })
      .limit(20);
    console.log('Recent domains:', JSON.stringify(allDomains, null, 2));
    return;
  }

  const domainId = configs[0].id;
  const domain = configs[0].domain;

  console.log('\n=== 2. SCRAPED CONTENT ===');
  const { count: pageCount } = await supabase
    .from('scraped_pages')
    .select('*', { count: 'exact', head: true })
    .eq('domain_id', domainId);
  console.log('Total scraped pages:', pageCount);

  const { data: pumpPages } = await supabase
    .from('scraped_pages')
    .select('title, url, content')
    .eq('domain_id', domainId)
    .or('title.ilike.%pump%,content.ilike.%pump%')
    .limit(5);
  console.log('Sample pages mentioning pumps:', pumpPages?.length || 0);
  if (pumpPages && pumpPages.length > 0) {
    console.log('First pump page:', {
      title: pumpPages[0].title,
      url: pumpPages[0].url,
      contentPreview: pumpPages[0].content?.substring(0, 200)
    });
  }

  console.log('\n=== 3. EMBEDDINGS STATUS ===');
  const { data: pageIds } = await supabase
    .from('scraped_pages')
    .select('id')
    .eq('domain_id', domainId);

  if (pageIds && pageIds.length > 0) {
    const ids = pageIds.map(p => p.id);
    const { count: embeddingCount } = await supabase
      .from('page_embeddings')
      .select('*', { count: 'exact', head: true })
      .in('page_id', ids);
    console.log('Total embeddings:', embeddingCount);
    const coverage = pageCount && embeddingCount ? (embeddingCount / pageCount * 100).toFixed(1) : 'N/A';
    console.log('Embeddings coverage:', coverage + '%');
  }

  console.log('\n=== 4. WOOCOMMERCE INTEGRATION ===');
  const { data: fullConfig } = await supabase
    .from('customer_configs')
    .select('woocommerce_url, woocommerce_credentials_encrypted')
    .eq('id', domainId)
    .single();

  console.log('WooCommerce URL:', fullConfig?.woocommerce_url);
  console.log('Has credentials:', fullConfig?.woocommerce_credentials_encrypted ? 'YES' : 'NO');

  console.log('\n=== 5. DOMAIN VARIATIONS TEST ===');
  const variations = [
    'thompsonseparts.co.uk',
    'www.thompsonseparts.co.uk',
    'https://thompsonseparts.co.uk',
    'https://www.thompsonseparts.co.uk'
  ];

  for (const variant of variations) {
    const { data } = await supabase
      .from('customer_configs')
      .select('id, domain')
      .eq('domain', variant)
      .single();
    console.log(`${variant}: ${data ? '✅ FOUND (id: ' + data.id + ')' : '❌ NOT FOUND'}`);
  }
}

investigate().catch(console.error);
