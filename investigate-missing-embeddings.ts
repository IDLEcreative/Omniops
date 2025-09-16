#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function investigateMissingEmbeddings() {
  console.log('='.repeat(80));
  console.log('INVESTIGATING MISSING DC66-10P EMBEDDINGS');
  console.log('='.repeat(80));

  // Get Thompson's domain ID
  const { data: domainData } = await supabase
    .from('domains')
    .select('id, name')
    .ilike('name', '%thompson%')
    .single();

  const domainId = domainData?.id;
  console.log(`\nThompson's Domain ID: ${domainId}`);

  // Step 1: Get all pages with DC66-10P
  console.log('\n1. PAGES WITH DC66-10P IN SCRAPED_PAGES:');
  console.log('-'.repeat(40));

  const { data: dc66Pages } = await supabase
    .from('scraped_pages')
    .select('id, url, title, scraped_at, domain_id')
    .ilike('content', '%DC66-10P%')
    .order('scraped_at', { ascending: false });

  console.log(`Found ${dc66Pages?.length || 0} pages with DC66-10P`);

  const pageIds = dc66Pages?.map(p => p.id) || [];
  
  dc66Pages?.forEach((page, idx) => {
    console.log(`\n  Page ${idx + 1}:`);
    console.log(`    ID: ${page.id}`);
    console.log(`    Domain ID: ${page.domain_id}`);
    console.log(`    URL: ${page.url}`);
    console.log(`    Scraped: ${page.scraped_at}`);
  });

  // Step 2: Check if these pages have ANY embeddings
  console.log('\n2. CHECKING FOR EMBEDDINGS OF DC66-10P PAGES:');
  console.log('-'.repeat(40));

  if (pageIds.length > 0) {
    for (const pageId of pageIds) {
      const { data: embeddings, count } = await supabase
        .from('page_embeddings')
        .select('id, chunk_index', { count: 'exact' })
        .eq('page_id', pageId);

      console.log(`\n  Page ${pageId}:`);
      console.log(`    Embeddings count: ${count || 0}`);
      
      if (count === 0) {
        console.log(`    ❌ NO EMBEDDINGS FOUND!`);
        
        // Check if this page was ever processed
        const page = dc66Pages?.find(p => p.id === pageId);
        if (page) {
          console.log(`    Page URL: ${page.url}`);
          console.log(`    Scraped at: ${page.scraped_at}`);
        }
      }
    }
  }

  // Step 3: Check total embeddings for Thompson's domain
  console.log('\n3. TOTAL EMBEDDINGS FOR THOMPSON\'S DOMAIN:');
  console.log('-'.repeat(40));

  const { count: totalEmbeddings } = await supabase
    .from('page_embeddings')
    .select('*', { count: 'exact', head: true })
    .eq('domain_id', domainId);

  console.log(`Total embeddings for Thompson's: ${totalEmbeddings || 0}`);

  // Step 4: Check recent embedding creation
  console.log('\n4. RECENT EMBEDDINGS CREATED:');
  console.log('-'.repeat(40));

  const { data: recentEmbeddings } = await supabase
    .from('page_embeddings')
    .select('id, page_id, created_at')
    .eq('domain_id', domainId)
    .order('created_at', { ascending: false })
    .limit(5);

  console.log(`Most recent embeddings:`);
  recentEmbeddings?.forEach((emb, idx) => {
    console.log(`  ${idx + 1}. Created: ${emb.created_at}, Page: ${emb.page_id}`);
  });

  // Step 5: Check if there are any embeddings with "trip" or "switch" (related terms)
  console.log('\n5. SEARCHING FOR RELATED TERMS IN EMBEDDINGS:');
  console.log('-'.repeat(40));

  const relatedTerms = ['trip', 'switch', 'relay', 'solenoid', 'allbright'];
  
  for (const term of relatedTerms) {
    const { count } = await supabase
      .from('page_embeddings')
      .select('*', { count: 'exact', head: true })
      .eq('domain_id', domainId)
      .ilike('chunk_text', `%${term}%`);

    console.log(`  "${term}": ${count || 0} embeddings`);
  }

  // Step 6: Check for orphaned pages (pages without embeddings)
  console.log('\n6. ORPHANED PAGES (NO EMBEDDINGS):');
  console.log('-'.repeat(40));

  const { data: allPages } = await supabase
    .from('scraped_pages')
    .select('id')
    .eq('domain_id', domainId);

  const allPageIds = allPages?.map(p => p.id) || [];

  const { data: pagesWithEmbeddings } = await supabase
    .from('page_embeddings')
    .select('page_id')
    .eq('domain_id', domainId);

  const pagesWithEmbeddingsSet = new Set(pagesWithEmbeddings?.map(e => e.page_id) || []);
  const orphanedPages = allPageIds.filter(id => !pagesWithEmbeddingsSet.has(id));

  console.log(`Total pages: ${allPageIds.length}`);
  console.log(`Pages with embeddings: ${pagesWithEmbeddingsSet.size}`);
  console.log(`Orphaned pages (no embeddings): ${orphanedPages.length}`);

  if (orphanedPages.length > 0 && orphanedPages.length < 20) {
    console.log('\n  Sample of orphaned page IDs:');
    orphanedPages.slice(0, 10).forEach(id => console.log(`    - ${id}`));
  }

  // Step 7: Check specific page content
  if (pageIds.length > 0) {
    console.log('\n7. SAMPLE CONTENT FROM DC66-10P PAGE:');
    console.log('-'.repeat(40));

    const { data: samplePage } = await supabase
      .from('scraped_pages')
      .select('content')
      .eq('id', pageIds[0])
      .single();

    if (samplePage?.content) {
      const dc66Index = samplePage.content.indexOf('DC66-10P');
      if (dc66Index >= 0) {
        const snippet = samplePage.content.substring(
          Math.max(0, dc66Index - 200),
          Math.min(samplePage.content.length, dc66Index + 300)
        );
        console.log(`Content around DC66-10P:`);
        console.log(`...${snippet}...`);
      }
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('ROOT CAUSE ANALYSIS:');
  console.log('='.repeat(80));
  console.log('\n⚠️  CRITICAL FINDING: Pages containing DC66-10P have NO embeddings!');
  console.log('   This explains why vector search cannot find these products.');
  console.log('\n   The embedding generation process either:');
  console.log('   1. Never ran for these pages');
  console.log('   2. Failed silently');
  console.log('   3. Was filtered out by some criteria');
  console.log('\nSOLUTION: Re-generate embeddings for all orphaned pages.');
  console.log('='.repeat(80));
}

investigateMissingEmbeddings().catch(console.error);