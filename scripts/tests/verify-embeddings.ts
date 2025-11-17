#!/usr/bin/env tsx
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function verifyEmbeddings() {
  console.log('🔍 Checking embeddings for test user...\n');

  const testUserId = '00668058-84f1-4870-b0e6-b8a226535dc5';

  // Get test user's organization
  const { data: orgMembers } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', testUserId);

  if (!orgMembers || orgMembers.length === 0) {
    console.log('❌ No organization found for test user');
    return;
  }

  const orgIds = orgMembers.map(m => m.organization_id);
  console.log(`✅ Found ${orgIds.length} organization(s)`);

  // Get domains
  const { data: domains } = await supabase
    .from('domains')
    .select('id, domain')
    .in('organization_id', orgIds);

  console.log(`✅ Found ${domains?.length || 0} domain(s):`, domains?.map(d => d.domain).join(', '));

  if (!domains || domains.length === 0) {
    console.log('❌ No domains found');
    return;
  }

  const domainIds = domains.map(d => d.id);

  // Get scraped pages
  const { data: pages } = await supabase
    .from('scraped_pages')
    .select('id, url, title')
    .in('domain_id', domainIds);

  console.log(`✅ Found ${pages?.length || 0} scraped page(s)`);

  // Get embeddings
  const { data: embeddings } = await supabase
    .from('page_embeddings')
    .select('id, chunk_text, metadata, page_id')
    .in('domain_id', domainIds);

  console.log(`\n📊 Embedding Stats:`);
  console.log(`   Total embeddings: ${embeddings?.length || 0}`);

  if (embeddings && embeddings.length > 0) {
    console.log(`\n✅ EMBEDDINGS ARE GENERATED AND SEARCHABLE!`);
    console.log(`\nSample embedding:`);
    console.log(`   Chunk text: ${embeddings[0].chunk_text.substring(0, 80)}...`);
    console.log(`   Metadata:`, embeddings[0].metadata);

    // Group by page
    const byPage = embeddings.reduce((acc: any, emb: any) => {
      acc[emb.page_id] = (acc[emb.page_id] || 0) + 1;
      return acc;
    }, {});

    console.log(`\n📄 Embeddings per page:`);
    Object.entries(byPage).forEach(([pageId, count]) => {
      const page = pages?.find(p => p.id === pageId);
      console.log(`   ${page?.title || page?.url || pageId}: ${count} chunks`);
    });
  } else {
    console.log(`\n⚠️ No embeddings found - pages may not have been processed yet`);
  }
}

verifyEmbeddings().catch(console.error);
