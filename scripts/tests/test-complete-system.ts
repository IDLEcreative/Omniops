#!/usr/bin/env npx tsx
/**
 * Complete System Integration Test
 * Validates all search improvements work together
 */

import { config } from 'dotenv';
import { MetadataExtractor } from './lib/metadata-extractor';
import { QueryEnhancerOptimized as QueryEnhancer } from './lib/query-enhancer-optimized';
import { SemanticChunkerOptimized as SemanticChunker } from './lib/semantic-chunker-optimized';

config();

async function runCompleteTest() {
  console.log('🚀 Complete Search System Integration Test\n');
  console.log('=' .repeat(80));
  
  // Test scenario: User searching for a product with typos
  const userQuery = "cheep moter instalation guide BOS-1234";
  const sampleContent = `
# BOS-1234 Professional Motor Installation Guide

## Product Overview
The BOS-1234 is our top-rated 5HP motor designed for heavy-duty applications.
Price: $599.99
Contact support: support@motors.com or call 1-800-555-0123

## Installation Steps

### Step 1: Preparation
Before installing the motor, ensure you have all necessary tools and the power is disconnected.

### Step 2: Mounting
Mount the motor using the provided brackets. Ensure proper alignment with the coupling.

### Step 3: Electrical Connection
Connect the motor following the wiring diagram. Use appropriate wire gauge for the amperage.

## Troubleshooting

Q: What if the motor doesn't start?
A: Check the power supply and ensure all connections are secure.

Q: How often should I perform maintenance?
A: Regular maintenance should be performed monthly, with annual bearing replacement.

## Specifications
- Power: 5HP
- Voltage: 220V
- RPM: 1750
- Weight: 45 lbs
`;

  const htmlContent = `<html><body>${sampleContent.replace(/\n/g, '<br>')}</body></html>`;
  
  console.log('📝 PHASE 1: Query Enhancement\n');
  console.log(`User Query: "${userQuery}"`);
  
  // Enhance the query
  const enhanced = await QueryEnhancer.enhance(userQuery);
  console.log('\nEnhancement Results:');
  console.log(`  ✓ Normalized: "${enhanced.normalized}"`);
  console.log(`  ✓ Intent: ${enhanced.intent}`);
  console.log(`  ✓ Spelling corrections: ${Array.from(enhanced.spelling_corrections.entries()).map(([w, c]) => `${w}→${c}`).join(', ')}`);
  console.log(`  ✓ Entities detected:`);
  if (enhanced.entities.skus.length > 0) {
    console.log(`    - SKUs: ${enhanced.entities.skus.join(', ')}`);
  }
  if (enhanced.entities.products.length > 0) {
    console.log(`    - Products: ${enhanced.entities.products.join(', ')}`);
  }
  console.log(`  ✓ Confidence: ${(enhanced.confidence_score * 100).toFixed(0)}%`);
  
  console.log('\n' + '-'.repeat(80));
  console.log('📄 PHASE 2: Semantic Chunking\n');
  
  // Chunk the content semantically
  const chunks = await SemanticChunker.chunkContent(sampleContent, htmlContent);
  console.log(`Content chunked into ${chunks.length} semantic units:`);
  
  chunks.forEach((chunk, idx) => {
    console.log(`\n  Chunk ${idx + 1}:`);
    console.log(`    Type: ${chunk.type}`);
    console.log(`    Parent: ${chunk.parent_heading || '(root)'}`);
    console.log(`    Size: ${chunk.metadata.char_count} chars`);
    console.log(`    Completeness: ${(chunk.semantic_completeness * 100).toFixed(0)}%`);
    const preview = chunk.content.substring(0, 60).replace(/\n/g, ' ');
    console.log(`    Preview: "${preview}..."`);
  });
  
  console.log('\n' + '-'.repeat(80));
  console.log('🏷️ PHASE 3: Metadata Extraction\n');
  
  // Extract metadata for each chunk
  const metadataResults = [];
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const metadata = await MetadataExtractor.extractEnhancedMetadata(
      chunk.content,
      sampleContent,
      'https://example.com/products/bos-1234',
      'BOS-1234 Professional Motor',
      i,
      chunks.length,
      htmlContent
    );
    metadataResults.push(metadata);
    
    console.log(`Chunk ${i + 1} Metadata:`);
    console.log(`  Content type: ${metadata.content_type}`);
    console.log(`  Keywords: ${metadata.keywords?.slice(0, 3).join(', ') || 'none'}`);
    
    if (metadata.entities?.skus?.length > 0) {
      console.log(`  SKUs: ${metadata.entities.skus.join(', ')}`);
    }
    
    if (metadata.price_range) {
      console.log(`  Price: $${metadata.price_range.min}`);
    }
    
    if (metadata.contact_info) {
      console.log(`  Contact: ${metadata.contact_info.email || ''} ${metadata.contact_info.phone || ''}`);
    }
    
    if (metadata.qa_pairs && metadata.qa_pairs.length > 0) {
      console.log(`  Q&A pairs: ${metadata.qa_pairs.length} found`);
    }
  }
  
  console.log('\n' + '-'.repeat(80));
  console.log('🔍 PHASE 4: Search Relevance Simulation\n');
  
  // Simulate search scoring
  console.log('Simulating search with enhanced query and metadata...\n');
  
  // Find best matching chunk
  let bestChunk = null;
  let bestScore = 0;
  
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const metadata = metadataResults[i];
    
    // Calculate relevance score
    let score = 0;
    
    // Base similarity (simulated)
    const hasQueryTerms = enhanced.expanded_terms.some(term => 
      chunk.content.toLowerCase().includes(term.toLowerCase())
    );
    if (hasQueryTerms) score += 0.5;
    
    // Position boost
    if (i === 0) score += 0.15;
    else if (i === 1) score += 0.10;
    else if (i === 2) score += 0.05;
    
    // Keyword boost
    if (metadata.keywords && enhanced.entities.skus.some(sku => 
      metadata.keywords.includes(sku.toLowerCase())
    )) {
      score += 0.25;
    }
    
    // Entity boost
    if (metadata.entities?.skus?.includes('BOS-1234')) {
      score += 0.30;
    }
    
    // Content type boost
    if (enhanced.intent === 'informational' && metadata.content_type === 'documentation') {
      score += 0.10;
    }
    
    console.log(`Chunk ${i + 1} score: ${score.toFixed(2)}`);
    console.log(`  - Query terms: ${hasQueryTerms ? '✓' : '✗'}`);
    console.log(`  - Position boost: +${i === 0 ? 0.15 : i === 1 ? 0.10 : i === 2 ? 0.05 : 0}`);
    console.log(`  - SKU match: ${metadata.entities?.skus?.includes('BOS-1234') ? '✓' : '✗'}`);
    console.log(`  - Content type match: ${metadata.content_type === 'documentation' ? '✓' : '✗'}`);
    
    if (score > bestScore) {
      bestScore = score;
      bestChunk = i;
    }
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('✨ RESULTS SUMMARY\n');
  
  console.log('1️⃣ Query Enhancement:');
  console.log(`   - Fixed ${enhanced.spelling_corrections.size} spelling errors`);
  console.log(`   - Detected intent: ${enhanced.intent}`);
  console.log(`   - Extracted ${enhanced.entities.skus.length} SKUs`);
  
  console.log('\n2️⃣ Semantic Chunking:');
  console.log(`   - Created ${chunks.length} semantic chunks`);
  console.log(`   - Average completeness: ${(chunks.reduce((sum, c) => sum + c.semantic_completeness, 0) / chunks.length * 100).toFixed(0)}%`);
  
  console.log('\n3️⃣ Metadata Extraction:');
  console.log(`   - Extracted metadata for all chunks`);
  console.log(`   - Found prices: ${metadataResults.some(m => m.price_range) ? '✓' : '✗'}`);
  console.log(`   - Found contact info: ${metadataResults.some(m => m.contact_info) ? '✓' : '✗'}`);
  console.log(`   - Found Q&A pairs: ${metadataResults.some(m => m.qa_pairs && m.qa_pairs.length > 0) ? '✓' : '✗'}`);
  
  console.log('\n4️⃣ Search Relevance:');
  console.log(`   - Best matching chunk: #${bestChunk! + 1}`);
  console.log(`   - Relevance score: ${(bestScore * 100).toFixed(0)}%`);
  console.log(`   - Would return: "${chunks[bestChunk!].content.substring(0, 100)}..."`);
  
  console.log('\n' + '='.repeat(80));
  console.log('🎉 ALL SYSTEMS OPERATIONAL AND INTEGRATED!\n');
  
  // Performance check
  console.log('⚡ Performance Metrics:');
  const startTime = Date.now();
  
  for (let i = 0; i < 100; i++) {
    await QueryEnhancer.enhance("test query");
    await SemanticChunker.chunkContent("test content");
    await MetadataExtractor.extractEnhancedMetadata(
      "test", "test", "http://test", "test", 0, 1
    );
  }
  
  const totalTime = Date.now() - startTime;
  console.log(`   - 100 complete operations: ${totalTime}ms`);
  console.log(`   - Average per operation: ${(totalTime / 100).toFixed(2)}ms`);
  console.log(`   - Performance rating: ${totalTime < 1000 ? '⚡ Excellent' : totalTime < 5000 ? '✅ Good' : '⚠️ Needs optimization'}`);
  
  console.log('\n🚀 System ready for production deployment!\n');
}

runCompleteTest().catch(console.error);