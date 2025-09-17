#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

async function analyzeEmbeddings() {
  console.log('='.repeat(80));
  console.log('DC66-10P EMBEDDINGS ANALYSIS');
  console.log('='.repeat(80));

  // First get the domain_id for Thompson's
  const { data: domainData } = await supabase
    .from('domains')
    .select('id, name')
    .ilike('name', '%thompson%')
    .single();

  const domainId = domainData?.id;
  console.log(`\nThompson's Domain ID: ${domainId}`);

  // Get all DC66-10P embeddings directly
  console.log('\n1. DIRECT EMBEDDING SEARCH FOR DC66:');
  console.log('-'.repeat(40));

  const { data: dc66Embeddings } = await supabase
    .from('page_embeddings')
    .select('id, page_id, chunk_text, chunk_index, metadata, domain_id')
    .ilike('chunk_text', '%DC66%')
    .order('chunk_index');

  console.log(`Found ${dc66Embeddings?.length || 0} embeddings containing "DC66"`);

  // Analyze each embedding
  const dc66Variants = new Set<string>();
  dc66Embeddings?.forEach((emb, idx) => {
    // Find all DC66 variants in the text
    const matches = emb.chunk_text.match(/DC66[^\s,;).]*/g) || [];
    matches.forEach((m: string) => dc66Variants.add(m));

    if (idx < 5) { // Show first 5 in detail
      console.log(`\nEmbedding ${idx + 1}:`);
      console.log(`  Domain ID: ${emb.domain_id}`);
      console.log(`  Page ID: ${emb.page_id}`);
      console.log(`  Chunk Index: ${emb.chunk_index}`);
      console.log(`  DC66 variants in chunk: ${matches.join(', ')}`);
      
      // Show metadata
      if (emb.metadata) {
        console.log(`  Metadata SKU: ${emb.metadata.productSku || 'NOT SET'}`);
        console.log(`  Metadata Category: ${emb.metadata.productCategory || 'NOT SET'}`);
      }

      // Show context around DC66-10P if present
      if (emb.chunk_text.includes('DC66-10P')) {
        const pos = emb.chunk_text.indexOf('DC66-10P');
        const context = emb.chunk_text.substring(
          Math.max(0, pos - 100),
          Math.min(emb.chunk_text.length, pos + 150)
        );
        console.log(`  DC66-10P Context: ...${context}...`);
      }
    }
  });

  console.log(`\nAll DC66 variants found: ${Array.from(dc66Variants).sort().join(', ')}`);

  // Test vector similarity for DC66-10P
  console.log('\n2. TESTING VECTOR SEARCH FOR DC66-10P:');
  console.log('-'.repeat(40));

  const testQueries = [
    'DC66-10P',
    'DC66-10P cable entry system',
    'DC66 10P product',
    'trip switch DC66-10P'
  ];

  for (const testQuery of testQueries) {
    console.log(`\nQuery: "${testQuery}"`);
    
    // Generate embedding
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: testQuery,
    });

    const queryEmbedding = embeddingResponse.data[0]?.embedding;

    // Test with domain filter
    const { data: withDomain, error: e1 } = await supabase.rpc(
      'match_page_sections_improved',
      {
        embedding: queryEmbedding,
        match_threshold: 0.5,
        match_count: 5,
        domain_id: domainId
      }
    );

    console.log(`  With domain filter (${domainId}): ${withDomain?.length || 0} results`);
    
    if (withDomain && withDomain.length > 0) {
      const dc66Results = withDomain.filter((r: any) => 
        r.content?.includes('DC66') || r.url?.includes('DC66')
      );
      console.log(`    Contains DC66: ${dc66Results.length}`);
      
      if (dc66Results.length > 0) {
        console.log(`    First DC66 result similarity: ${dc66Results[0].similarity}`);
        console.log(`    URL: ${dc66Results[0].url}`);
      }
    }

    // Test without domain filter
    const { data: withoutDomain } = await supabase.rpc(
      'match_page_sections_improved',
      {
        embedding: queryEmbedding,
        match_threshold: 0.5,
        match_count: 5,
        domain_id: null
      }
    );

    console.log(`  Without domain filter: ${withoutDomain?.length || 0} results`);
    
    if (withoutDomain && withoutDomain.length > 0) {
      const dc66Results = withoutDomain.filter((r: any) => 
        r.content?.includes('DC66') || r.url?.includes('DC66')
      );
      console.log(`    Contains DC66: ${dc66Results.length}`);
    }
  }

  // Check metadata search
  console.log('\n3. TESTING METADATA SEARCH:');
  console.log('-'.repeat(40));

  const { data: metadataSearch } = await supabase
    .from('scraped_pages')
    .select('url, title, metadata')
    .eq('domain_id', domainId)
    .or('metadata->>productSku.ilike.%DC66%,metadata->>productCategory.ilike.%DC66%')
    .limit(10);

  console.log(`Metadata search found: ${metadataSearch?.length || 0} results`);
  metadataSearch?.forEach((page, idx) => {
    console.log(`\n  Result ${idx + 1}:`);
    console.log(`    URL: ${page.url}`);
    console.log(`    Title: ${page.title}`);
    console.log(`    SKU: ${page.metadata?.productSku || 'NOT SET'}`);
    console.log(`    Category: ${page.metadata?.productCategory || 'NOT SET'}`);
  });

  // Check keyword search
  console.log('\n4. TESTING KEYWORD SEARCH:');
  console.log('-'.repeat(40));

  const { data: keywordSearch } = await supabase
    .from('scraped_pages')
    .select('url, title')
    .eq('domain_id', domainId)
    .or('content.ilike.%DC66-10P%,title.ilike.%DC66-10P%')
    .limit(5);

  console.log(`Keyword search found: ${keywordSearch?.length || 0} results`);
  keywordSearch?.forEach((page, idx) => {
    console.log(`  ${idx + 1}. ${page.title}`);
    console.log(`     ${page.url}`);
  });

  // Analyze the RPC function
  console.log('\n5. ANALYZING RPC FUNCTION match_page_sections_improved:');
  console.log('-'.repeat(40));

  // Check if the function exists and what it returns
  const { data: funcDef } = await supabase.rpc('match_page_sections_improved', {
    embedding: new Array(1536).fill(0), // dummy embedding
    match_threshold: 0.5,
    match_count: 1,
    domain_id: domainId
  });

  console.log(`RPC function returned ${funcDef?.length || 0} results (with dummy embedding)`);

  console.log('\n' + '='.repeat(80));
  console.log('ANALYSIS COMPLETE');
  console.log('='.repeat(80));
}

analyzeEmbeddings().catch(console.error);