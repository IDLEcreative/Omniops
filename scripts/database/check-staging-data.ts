/**
 * Check Staging Domain Data
 * Verifies if epartstaging.wpengine.com has scraped pages and embeddings
 */

import { createServiceRoleClient } from '../../lib/supabase/server';

async function checkStagingData() {
  const supabase = await createServiceRoleClient();
  const domain = 'epartstaging.wpengine.com';

  console.log(`\n🔍 Checking data for: ${domain}\n`);

  // Check customer_configs
  const { data: config } = await supabase
    .from('customer_configs')
    .select('domain, woocommerce_url, active, organization_id')
    .eq('domain', domain)
    .single();

  console.log('📋 Customer Config:');
  console.log(`   Domain: ${config?.domain}`);
  console.log(`   WooCommerce: ${config?.woocommerce_url || 'Not configured'}`);
  console.log(`   Active: ${config?.active}`);
  console.log(`   Organization ID: ${config?.organization_id}`);

  // Check scraped_pages
  const { data: pages, count: pageCount } = await supabase
    .from('scraped_pages')
    .select('id', { count: 'exact' })
    .eq('domain', domain);

  console.log(`\n📄 Scraped Pages: ${pageCount || 0}`);

  // Check page_embeddings
  const { data: embeddings, count: embeddingCount } = await supabase
    .from('page_embeddings')
    .select('id', { count: 'exact' })
    .eq('domain', domain);

  console.log(`🔢 Page Embeddings: ${embeddingCount || 0}`);

  // Check structured_extractions
  const { data: extractions, count: extractionCount } = await supabase
    .from('structured_extractions')
    .select('id, extraction_type', { count: 'exact' })
    .eq('domain', domain);

  console.log(`📦 Structured Extractions: ${extractionCount || 0}`);
  if (extractions && extractions.length > 0) {
    const types = extractions.map(e => e.extraction_type).join(', ');
    console.log(`   Types: ${types}`);
  }

  // Compare with production domain
  console.log(`\n\n🔍 Comparing with production (thompsonseparts.co.uk):\n`);

  const prodDomain = 'thompsonseparts.co.uk';

  const { count: prodPageCount } = await supabase
    .from('scraped_pages')
    .select('id', { count: 'exact' })
    .eq('domain', prodDomain);

  const { count: prodEmbeddingCount } = await supabase
    .from('page_embeddings')
    .select('id', { count: 'exact' })
    .eq('domain', prodDomain);

  console.log(`📄 Production Pages: ${prodPageCount || 0}`);
  console.log(`🔢 Production Embeddings: ${prodEmbeddingCount || 0}`);

  // Diagnosis
  console.log(`\n\n💡 Diagnosis:\n`);

  if (!pageCount || pageCount === 0) {
    console.log('❌ Staging domain has NO scraped pages');
    console.log('   → The chat cannot use RAG/semantic search');
    console.log('   → Need to scrape the staging WordPress site');
  } else if (!embeddingCount || embeddingCount === 0) {
    console.log('⚠️  Staging has pages but NO embeddings');
    console.log('   → Scraped but not indexed for semantic search');
    console.log('   → Need to generate embeddings');
  } else {
    console.log('✅ Staging domain has both pages and embeddings');
    console.log('   → RAG should be working');
    console.log('   → Issue might be elsewhere (check WooCommerce config)');
  }

  console.log(`\n`);
}

checkStagingData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
