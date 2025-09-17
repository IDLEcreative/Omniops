#!/usr/bin/env npx tsx
/**
 * Forensic Investigation: Cifa Product Embedding Quality and Retrieval Issues
 * 
 * This test investigates why only 2-4 Cifa products are returned when 20+ exist
 * We'll examine:
 * 1. Embedding presence and quality for Cifa products
 * 2. Similarity scores and thresholds
 * 3. Content extraction and chunking issues
 * 4. The complete retrieval pipeline
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { generateQueryEmbedding, searchSimilarContent, splitIntoChunks } from './lib/embeddings';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function investigateCifaEmbeddings() {
  console.log('🔍 FORENSIC INVESTIGATION: CIFA PRODUCT EMBEDDINGS');
  console.log('=' .repeat(80));

  // Phase 1: Check domain mapping
  console.log('\n📊 PHASE 1: Domain Configuration');
  console.log('-'.repeat(60));
  
  const { data: domainData, error: domainError } = await supabase
    .from('domains')
    .select('id, domain')
    .eq('domain', 'thompsonseparts.co.uk')
    .single();

  if (domainError || !domainData) {
    console.error('❌ Domain not found in database');
    console.error('Error:', domainError);
    return;
  }

  console.log(`✅ Domain found: ${domainData.domain}`);
  console.log(`   Domain ID: ${domainData.id}`);

  const domainId = domainData.id;

  // Phase 2: Check Cifa products in scraped_pages
  console.log('\n📊 PHASE 2: Cifa Products in Database');
  console.log('-'.repeat(60));
  
  const { data: cifaPages, error: cifaError } = await supabase
    .from('scraped_pages')
    .select('id, url, title, content')
    .eq('domain_id', domainId)
    .or('url.ilike.%cifa%,title.ilike.%cifa%,content.ilike.%cifa%')
    .limit(30);

  if (cifaError) {
    console.error('❌ Error fetching Cifa products:', cifaError);
    return;
  }

  console.log(`✅ Found ${cifaPages?.length || 0} Cifa-related pages`);
  
  if (cifaPages && cifaPages.length > 0) {
    console.log('\n📋 Sample Cifa Products:');
    cifaPages.slice(0, 5).forEach((page, i) => {
      console.log(`   ${i + 1}. ${page.title || 'Untitled'}`);
      console.log(`      URL: ${page.url}`);
      console.log(`      Page ID: ${page.id}`);
    });
  }

  // Phase 3: Check embeddings for these pages
  console.log('\n📊 PHASE 3: Embedding Analysis');
  console.log('-'.repeat(60));

  let totalEmbeddings = 0;
  let missingEmbeddings = [];
  let embeddingQualityIssues = [];

  for (const page of cifaPages || []) {
    const { data: embeddings, error } = await supabase
      .from('page_embeddings')
      .select('id, chunk_text, embedding, metadata')
      .eq('page_id', page.id);

    if (error) {
      console.error(`❌ Error fetching embeddings for page ${page.id}:`, error);
      continue;
    }

    if (!embeddings || embeddings.length === 0) {
      missingEmbeddings.push(page);
      console.log(`⚠️ No embeddings for: ${page.title} (${page.url})`);
    } else {
      totalEmbeddings += embeddings.length;
      
      // Check embedding quality
      for (const emb of embeddings) {
        // Check if embedding is null or invalid
        if (!emb.embedding) {
          embeddingQualityIssues.push({
            page: page.title,
            issue: 'NULL embedding vector'
          });
        }
        
        // Check chunk text quality
        const chunkText = emb.chunk_text;
        if (chunkText) {
          // Check if chunk contains meaningful product info
          const hasProductInfo = 
            chunkText.toLowerCase().includes('cifa') ||
            chunkText.includes('SKU') ||
            chunkText.includes('Price') ||
            chunkText.includes('pump');
          
          if (!hasProductInfo && page.url.includes('/product/')) {
            embeddingQualityIssues.push({
              page: page.title,
              issue: 'Chunk missing product information',
              chunk: chunkText.substring(0, 100)
            });
          }
        }
      }
    }
  }

  console.log(`\n📈 Embedding Statistics:`);
  console.log(`   Total Cifa pages: ${cifaPages?.length || 0}`);
  console.log(`   Pages with embeddings: ${(cifaPages?.length || 0) - missingEmbeddings.length}`);
  console.log(`   Pages missing embeddings: ${missingEmbeddings.length}`);
  console.log(`   Total embedding chunks: ${totalEmbeddings}`);
  console.log(`   Quality issues found: ${embeddingQualityIssues.length}`);

  if (missingEmbeddings.length > 0) {
    console.log('\n⚠️ Pages Missing Embeddings:');
    missingEmbeddings.slice(0, 5).forEach(page => {
      console.log(`   - ${page.title} (${page.url})`);
    });
  }

  if (embeddingQualityIssues.length > 0) {
    console.log('\n⚠️ Embedding Quality Issues:');
    embeddingQualityIssues.slice(0, 5).forEach(issue => {
      console.log(`   - ${issue.page}: ${issue.issue}`);
      if (issue.chunk) {
        console.log(`     Chunk: "${issue.chunk}..."`);
      }
    });
  }

  // Phase 4: Test similarity search
  console.log('\n📊 PHASE 4: Similarity Search Testing');
  console.log('-'.repeat(60));

  const testQueries = [
    'pump for my Cifa mixer',
    'Cifa water pump',
    'Cifa pump',
    'Cifa',
    'water pump half coupling',
    'mixer pump'
  ];

  for (const query of testQueries) {
    console.log(`\n🔍 Testing query: "${query}"`);
    
    // Generate embedding for query
    const queryEmbedding = await generateQueryEmbedding(query, true, 'thompsonseparts.co.uk');
    
    // Direct similarity search in database
    const { data: results, error } = await supabase.rpc('search_embeddings', {
      query_embedding: queryEmbedding,
      p_domain_id: domainId,
      match_threshold: 0.1, // Very low threshold to see all matches
      match_count: 10
    });

    if (error) {
      console.error(`   ❌ Search error:`, error);
      continue;
    }

    console.log(`   Found ${results?.length || 0} results`);
    
    if (results && results.length > 0) {
      console.log('   Top 3 matches:');
      results.slice(0, 3).forEach((r: any, i: number) => {
        console.log(`   ${i + 1}. Similarity: ${r.similarity?.toFixed(4)}`);
        console.log(`      URL: ${r.url}`);
        console.log(`      Chunk: "${(r.chunk_text || '').substring(0, 100)}..."`);
      });
      
      // Check if any Cifa products are in results
      const cifaResults = results.filter((r: any) => 
        r.url?.includes('cifa') || r.chunk_text?.toLowerCase().includes('cifa')
      );
      console.log(`   Cifa products in results: ${cifaResults.length}`);
    }
  }

  // Phase 5: Analyze a specific Cifa product page
  console.log('\n📊 PHASE 5: Deep Dive - Specific Product Analysis');
  console.log('-'.repeat(60));

  const targetUrl = '/product/cifa-mixer-water-pump-half-coupling-ref-0-1525-29/';
  
  const { data: targetPage } = await supabase
    .from('scraped_pages')
    .select('id, title, content')
    .eq('domain_id', domainId)
    .like('url', `%${targetUrl}%`)
    .single();

  if (targetPage) {
    console.log(`\n🎯 Analyzing: ${targetPage.title}`);
    console.log(`   Page ID: ${targetPage.id}`);
    
    // Check content extraction
    const contentLength = targetPage.content?.length || 0;
    console.log(`   Content length: ${contentLength} characters`);
    
    // Check what's in the content
    const contentLower = targetPage.content?.toLowerCase() || '';
    console.log('\n   Content Analysis:');
    console.log(`   - Contains "cifa": ${contentLower.includes('cifa')}`);
    console.log(`   - Contains "pump": ${contentLower.includes('pump')}`);
    console.log(`   - Contains "water": ${contentLower.includes('water')}`);
    console.log(`   - Contains "SKU": ${targetPage.content?.includes('SKU')}`);
    console.log(`   - Contains price (£): ${targetPage.content?.includes('£')}`);
    
    // Sample content to see what's being indexed
    console.log('\n   Content Sample (first 500 chars):');
    console.log(`   "${targetPage.content?.substring(0, 500)}..."`);
    
    // Check how it's chunked
    const chunks = splitIntoChunks(targetPage.content || '', 1000);
    console.log(`\n   Chunking Analysis:`);
    console.log(`   - Total chunks: ${chunks.length}`);
    
    // Analyze each chunk
    chunks.forEach((chunk, i) => {
      const hasProductInfo = 
        chunk.toLowerCase().includes('cifa') ||
        chunk.includes('SKU') ||
        chunk.includes('£');
      
      console.log(`   - Chunk ${i + 1}: ${chunk.length} chars, has product info: ${hasProductInfo}`);
      if (i < 2) {
        console.log(`     Preview: "${chunk.substring(0, 100)}..."`);
      }
    });
    
    // Check embeddings for this specific page
    const { data: pageEmbeddings } = await supabase
      .from('page_embeddings')
      .select('chunk_text, embedding, metadata')
      .eq('page_id', targetPage.id);
    
    console.log(`\n   Embeddings for this page: ${pageEmbeddings?.length || 0}`);
    
    if (pageEmbeddings && pageEmbeddings.length > 0) {
      // Test similarity directly with "Cifa pump" query
      const testQuery = 'Cifa water pump';
      const queryEmb = await generateQueryEmbedding(testQuery);
      
      console.log(`\n   Testing similarity with "${testQuery}":`);
      
      for (let i = 0; i < Math.min(3, pageEmbeddings.length); i++) {
        const emb = pageEmbeddings[i];
        if (emb && emb.embedding) {
          // Calculate cosine similarity
          const similarity = cosineSimilarity(queryEmb, emb.embedding);
          console.log(`   - Chunk ${i + 1} similarity: ${similarity.toFixed(4)}`);
          console.log(`     Chunk: "${emb.chunk_text?.substring(0, 100) || ''}..."`);
        }
      }
    }
  }

  // Phase 6: Test the high-level search function
  console.log('\n📊 PHASE 6: High-Level Search Function Test');
  console.log('-'.repeat(60));

  console.log('\nTesting searchSimilarContent function:');
  const searchResults = await searchSimilarContent(
    'pump for my Cifa mixer',
    'thompsonseparts.co.uk',
    10,
    0.1 // Low threshold
  );

  console.log(`Results returned: ${searchResults.length}`);
  searchResults.forEach((result, i) => {
    console.log(`${i + 1}. ${result.title} (similarity: ${result.similarity.toFixed(4)})`);
    console.log(`   URL: ${result.url}`);
    const isCifa = result.url.includes('cifa') || result.content.toLowerCase().includes('cifa');
    console.log(`   Is Cifa product: ${isCifa ? '✅ YES' : '❌ NO'}`);
  });

  // Summary and recommendations
  console.log('\n' + '='.repeat(80));
  console.log('📋 INVESTIGATION SUMMARY');
  console.log('='.repeat(80));
  
  console.log('\n🔍 Key Findings:');
  console.log(`1. Total Cifa products in database: ${cifaPages?.length || 0}`);
  console.log(`2. Products with embeddings: ${(cifaPages?.length || 0) - missingEmbeddings.length}`);
  console.log(`3. Total embedding chunks: ${totalEmbeddings}`);
  console.log(`4. Embedding quality issues: ${embeddingQualityIssues.length}`);
  
  console.log('\n🎯 Likely Issues:');
  if (missingEmbeddings.length > 0) {
    console.log('- Some Cifa products are missing embeddings entirely');
  }
  if (embeddingQualityIssues.length > 0) {
    console.log('- Some embeddings have quality issues (missing product info)');
  }
  console.log('- Content extraction might be including too much navigation/boilerplate');
  console.log('- Chunking might be splitting product information inappropriately');
  console.log('- Similarity threshold might be filtering out valid matches');
  
  console.log('\n💡 Recommendations:');
  console.log('1. Re-generate embeddings for Cifa products with improved content extraction');
  console.log('2. Ensure product-specific information is prioritized in chunks');
  console.log('3. Consider using product-aware chunking that keeps SKU, name, and price together');
  console.log('4. Lower similarity threshold or use hybrid search (semantic + keyword)');
  console.log('5. Implement fallback to keyword search when semantic search returns few results');
}

// Helper function for cosine similarity
function cosineSimilarity(vec1: number[], vec2: number[]): number {
  if (!vec1 || !vec2 || vec1.length !== vec2.length) return 0;
  
  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;
  
  for (let i = 0; i < vec1.length; i++) {
    const v1 = vec1[i] ?? 0;
    const v2 = vec2[i] ?? 0;
    dotProduct += v1 * v2;
    norm1 += v1 * v1;
    norm2 += v2 * v2;
  }
  
  const denominator = Math.sqrt(norm1) * Math.sqrt(norm2);
  return denominator === 0 ? 0 : dotProduct / denominator;
}

// Run the investigation
investigateCifaEmbeddings().catch(console.error);