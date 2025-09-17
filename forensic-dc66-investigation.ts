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

async function forensicInvestigation() {
  console.log('='.repeat(80));
  console.log('DC66-10P FORENSIC INVESTIGATION');
  console.log('='.repeat(80));

  // Step 1: Check scraped_pages for DC66-10P
  console.log('\n1. CHECKING SCRAPED_PAGES FOR DC66-10P:');
  console.log('-'.repeat(40));
  
  const { data: scrapedPages, error: scrapedError } = await supabase
    .from('scraped_pages')
    .select('id, url, title, content, metadata')
    .or('content.ilike.%DC66-10P%,title.ilike.%DC66-10P%,url.ilike.%DC66-10P%')
    .order('created_at', { ascending: false });

  if (scrapedError) {
    console.error('Error fetching scraped pages:', scrapedError);
    return;
  }

  console.log(`Found ${scrapedPages?.length || 0} pages containing DC66-10P`);
  
  const pageIds = scrapedPages?.map(p => p.id) || [];
  
  scrapedPages?.forEach((page, idx) => {
    console.log(`\nPage ${idx + 1}:`);
    console.log(`  ID: ${page.id}`);
    console.log(`  URL: ${page.url}`);
    console.log(`  Title: ${page.title}`);
    
    // Check if DC66-10P is in content
    const contentIndex = page.content?.indexOf('DC66-10P') || -1;
    console.log(`  DC66-10P in content: ${contentIndex >= 0 ? `YES (position ${contentIndex})` : 'NO'}`);
    
    // Check metadata
    console.log(`  Metadata:`, JSON.stringify(page.metadata, null, 2));
  });

  // Step 2: Check embeddings for these pages
  console.log('\n2. CHECKING EMBEDDINGS FOR DC66-10P PAGES:');
  console.log('-'.repeat(40));

  if (pageIds.length > 0) {
    const { data: embeddings, error: embError } = await supabase
      .from('page_embeddings')
      .select('id, page_id, chunk_text, chunk_index, metadata')
      .in('page_id', pageIds);

    if (embError) {
      console.error('Error fetching embeddings:', embError);
    } else {
      console.log(`Found ${embeddings?.length || 0} embeddings for DC66-10P pages`);
      
      // Analyze each embedding
      embeddings?.forEach((emb, idx) => {
        const hasDC66 = emb.chunk_text?.includes('DC66-10P');
        console.log(`\nEmbedding ${idx + 1}:`);
        console.log(`  Page ID: ${emb.page_id}`);
        console.log(`  Chunk Index: ${emb.chunk_index}`);
        console.log(`  Contains DC66-10P: ${hasDC66 ? 'YES' : 'NO'}`);
        if (hasDC66) {
          const position = emb.chunk_text.indexOf('DC66-10P');
          console.log(`  Position in chunk: ${position}`);
          console.log(`  Context: ...${emb.chunk_text.substring(Math.max(0, position - 50), Math.min(emb.chunk_text.length, position + 100))}...`);
        }
        console.log(`  Metadata:`, JSON.stringify(emb.metadata, null, 2));
      });
    }
  }

  // Step 3: Direct embedding search for DC66-10P
  console.log('\n3. TESTING DIRECT EMBEDDING SEARCH:');
  console.log('-'.repeat(40));

  const { data: embedSearch } = await supabase
    .from('page_embeddings')
    .select('id, chunk_text, metadata')
    .or('chunk_text.ilike.%DC66-10P%,chunk_text.ilike.%DC66%')
    .limit(10);

  console.log(`Direct text search found ${embedSearch?.length || 0} embeddings with DC66`);
  embedSearch?.forEach((emb, idx) => {
    console.log(`\n  Result ${idx + 1}:`);
    const dc66Index = emb.chunk_text?.indexOf('DC66') || -1;
    console.log(`    DC66 position: ${dc66Index}`);
    if (dc66Index >= 0) {
      console.log(`    Context: ...${emb.chunk_text.substring(Math.max(0, dc66Index - 30), Math.min(emb.chunk_text.length, dc66Index + 80))}...`);
    }
  });

  // Step 4: Test vector similarity search
  console.log('\n4. TESTING VECTOR SIMILARITY SEARCH:');
  console.log('-'.repeat(40));

  try {
    // Generate embedding for "DC66-10P"
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: 'DC66-10P cable entry system',
    });

    const queryEmbedding = embeddingResponse.data[0]?.embedding;
    console.log('Generated embedding for "DC66-10P cable entry system"');

    // Perform vector search
    const { data: vectorResults, error: vectorError } = await supabase.rpc(
      'match_page_sections_improved',
      {
        embedding: queryEmbedding,
        match_threshold: 0.5, // Lower threshold for debugging
        match_count: 10,
        domain_id: null // Search across all domains for now
      }
    );

    if (vectorError) {
      console.error('Vector search error:', vectorError);
    } else {
      console.log(`Vector search returned ${vectorResults?.length || 0} results`);
      
      vectorResults?.forEach((result: any, idx: number) => {
        const hasDC66 = result.content?.includes('DC66');
        console.log(`\n  Result ${idx + 1}:`);
        console.log(`    Similarity: ${result.similarity}`);
        console.log(`    URL: ${result.url}`);
        console.log(`    Contains DC66: ${hasDC66}`);
        if (hasDC66) {
          const pos = result.content.indexOf('DC66');
          console.log(`    DC66 Context: ...${result.content.substring(Math.max(0, pos - 50), Math.min(result.content.length, pos + 100))}...`);
        }
      });
    }
  } catch (error) {
    console.error('Error in vector search:', error);
  }

  // Step 5: Check SKU extraction patterns
  console.log('\n5. ANALYZING SKU EXTRACTION:');
  console.log('-'.repeat(40));

  const testTexts = [
    'DC66-10P cable entry system',
    'Product code: DC66-10P',
    'Model DC66-10P with specifications',
    'DC66-10P/M32 variant available',
  ];

  const skuRegex = /\b(?:[A-Z]{2,}[-\/]?\d+[-\/]?[A-Z0-9]*|\d{3,}-[A-Z0-9]+|[A-Z0-9]{4,})\b/g;

  testTexts.forEach(text => {
    const matches = text.match(skuRegex);
    console.log(`\nText: "${text}"`);
    console.log(`  SKU matches: ${matches ? matches.join(', ') : 'NONE'}`);
  });

  // Step 6: Check if DC66-10P is being filtered out somewhere
  console.log('\n6. CHECKING FOR FILTERING ISSUES:');
  console.log('-'.repeat(40));

  // Check page_embeddings for chunk_text containing DC66
  const { data: chunkAnalysis } = await supabase
    .from('page_embeddings')
    .select('chunk_text')
    .ilike('chunk_text', '%DC66%')
    .limit(5);

  console.log(`\nChunks containing "DC66": ${chunkAnalysis?.length || 0}`);
  
  chunkAnalysis?.forEach((chunk, idx) => {
    const dc66Count = (chunk.chunk_text.match(/DC66[^\s]*/g) || []).length;
    const variants = chunk.chunk_text.match(/DC66[^\s]*/g) || [];
    console.log(`\n  Chunk ${idx + 1}:`);
    console.log(`    DC66 occurrences: ${dc66Count}`);
    console.log(`    Variants found: ${[...new Set(variants)].join(', ')}`);
  });

  // Step 7: Domain ID Analysis
  console.log('\n7. DOMAIN ID ANALYSIS:');
  console.log('-'.repeat(40));

  // Get domain IDs for DC66 pages
  const { data: domainPages } = await supabase
    .from('scraped_pages')
    .select('domain_id, url')
    .ilike('content', '%DC66-10P%');

  const domainIds = [...new Set(domainPages?.map(p => p.domain_id) || [])];
  console.log(`\nDomain IDs with DC66-10P content: ${domainIds.join(', ')}`);

  for (const domainId of domainIds) {
    const { data: domain } = await supabase
      .from('domains')
      .select('id, name')
      .eq('id', domainId)
      .single();

    console.log(`\n  Domain ${domainId}:`);
    console.log(`    Name: ${domain?.name || 'Unknown'}`);
    
    // Count embeddings for this domain
    const { count: embCount } = await supabase
      .from('page_embeddings')
      .select('*', { count: 'exact', head: true })
      .eq('domain_id', domainId);
    
    console.log(`    Total embeddings: ${embCount || 0}`);
    
    // Count DC66 embeddings
    const { count: dc66Count } = await supabase
      .from('page_embeddings')
      .select('*', { count: 'exact', head: true })
      .eq('domain_id', domainId)
      .ilike('chunk_text', '%DC66%');
    
    console.log(`    DC66 embeddings: ${dc66Count || 0}`);
  }

  console.log('\n' + '='.repeat(80));
  console.log('INVESTIGATION COMPLETE');
  console.log('='.repeat(80));
}

// Run the investigation
forensicInvestigation().catch(console.error);