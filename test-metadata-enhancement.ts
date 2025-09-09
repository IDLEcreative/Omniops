#!/usr/bin/env npx tsx
/**
 * Test Suite for Original Metadata Enhancement System
 * Tests content classification, keyword extraction, entity recognition, and metadata-based search
 */

import { config } from 'dotenv';
import { MetadataExtractor } from './lib/metadata-extractor';
import { createClient } from '@supabase/supabase-js';

config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Test content samples
const testSamples = [
  {
    name: "Product Page",
    content: `
The BOS-1234 Professional Motor is our top-selling 5HP motor perfect for heavy-duty applications.
Price: $599.99
SKU: BOS-1234
Brand: Bosch

Features:
- High efficiency design
- Thermal overload protection
- 2-year warranty
- IP65 rated for outdoor use

Installation is straightforward and typically takes 30-45 minutes.
Contact our support team at support@example.com for assistance.
`,
    url: "https://example.com/products/bos-1234",
    title: "BOS-1234 Professional Motor - Heavy Duty 5HP",
    expectedMetadata: {
      content_type: 'product',
      hasKeywords: true,
      hasEntities: true,
      hasPriceInfo: true,
      hasContactInfo: true
    }
  },
  {
    name: "FAQ Page",
    content: `
Q: How long is the warranty on your motors?
A: All our motors come with a standard 2-year manufacturer warranty.

Q: Can I install the motor myself?
A: Yes, installation is straightforward. However, we recommend professional installation for warranty coverage.

Q: What maintenance is required?
A: Regular maintenance includes monthly inspections and annual bearing replacement.
`,
    url: "https://example.com/faq",
    title: "Frequently Asked Questions",
    expectedMetadata: {
      content_type: 'faq',
      hasQAPairs: true,
      hasKeywords: true
    }
  },
  {
    name: "Technical Documentation",
    content: `
# Installation Guide

## Step 1: Preparation
Before installing the motor, ensure power is disconnected and you have the necessary tools.

## Step 2: Mounting
Mount the motor using the provided brackets. Ensure proper alignment with the coupling.

## Step 3: Electrical Connection
Connect the motor following the wiring diagram. Use appropriate wire gauge for the amperage.

## Troubleshooting
If the motor doesn't start, check:
1. Power supply
2. Wiring connections
3. Thermal overload status
`,
    url: "https://example.com/docs/installation",
    title: "Motor Installation Guide",
    expectedMetadata: {
      content_type: 'documentation',
      hasHeadings: true,
      hasSteps: true,
      hasTroubleshooting: true
    }
  }
];

async function runTests() {
  console.log('🧪 Metadata Enhancement Test Suite\n');
  console.log('=' .repeat(80));
  
  let totalTests = 0;
  let passedTests = 0;
  const results: any[] = [];

  // Test each sample
  for (const sample of testSamples) {
    console.log(`\n📄 Testing: ${sample.name}`);
    console.log('-'.repeat(40));
    
    try {
      // Test metadata extraction
      const metadata = await MetadataExtractor.extractEnhancedMetadata(
        sample.content,
        sample.content, // fullContent
        sample.url,
        sample.title,
        0, // chunkIndex
        1, // totalChunks
        `<html><body>${sample.content}</body></html>` // Simple HTML wrapper
      );
      
      console.log('\n📊 Extracted Metadata:');
      console.log(`  Content Type: ${metadata.content_type}`);
      console.log(`  Keywords: ${metadata.keywords?.slice(0, 5).join(', ') || 'none'}`);
      console.log(`  Readability Score: ${metadata.readability_score?.toFixed(1) || 'N/A'}`);
      
      // Test content type detection
      if (sample.expectedMetadata.content_type) {
        const typeMatch = metadata.content_type === sample.expectedMetadata.content_type;
        totalTests++;
        if (typeMatch) passedTests++;
        console.log(`  ✓ Content type detection: ${typeMatch ? '✅' : '❌'} (expected: ${sample.expectedMetadata.content_type}, got: ${metadata.content_type})`);
      }
      
      // Test keyword extraction
      if (sample.expectedMetadata.hasKeywords) {
        const hasKeywords = metadata.keywords && metadata.keywords.length > 0;
        totalTests++;
        if (hasKeywords) passedTests++;
        console.log(`  ✓ Keyword extraction: ${hasKeywords ? '✅' : '❌'} (found ${metadata.keywords?.length || 0} keywords)`);
      }
      
      // Test entity extraction
      if (sample.expectedMetadata.hasEntities) {
        const hasEntities = metadata.entities && Object.values(metadata.entities).some(e => e.length > 0);
        totalTests++;
        if (hasEntities) passedTests++;
        console.log(`  ✓ Entity extraction: ${hasEntities ? '✅' : '❌'}`);
        
        if (metadata.entities) {
          if (metadata.entities.products?.length > 0) {
            console.log(`    Products: ${metadata.entities.products.join(', ')}`);
          }
          if (metadata.entities.brands?.length > 0) {
            console.log(`    Brands: ${metadata.entities.brands.join(', ')}`);
          }
          if (metadata.entities.skus?.length > 0) {
            console.log(`    SKUs: ${metadata.entities.skus.join(', ')}`);
          }
        }
      }
      
      // Test price extraction
      if (sample.expectedMetadata.hasPriceInfo) {
        const hasPriceInfo = metadata.price_range && (metadata.price_range.min > 0 || metadata.price_range.max > 0);
        totalTests++;
        if (hasPriceInfo) passedTests++;
        console.log(`  ✓ Price extraction: ${hasPriceInfo ? '✅' : '❌'}`);
        if (hasPriceInfo) {
          console.log(`    Price range: $${metadata.price_range.min} - $${metadata.price_range.max}`);
        }
      }
      
      // Test contact info extraction
      if (sample.expectedMetadata.hasContactInfo) {
        const hasContactInfo = metadata.contact_info && (metadata.contact_info.email || metadata.contact_info.phone);
        totalTests++;
        if (hasContactInfo) passedTests++;
        console.log(`  ✓ Contact extraction: ${hasContactInfo ? '✅' : '❌'}`);
        if (hasContactInfo && metadata.contact_info) {
          if (metadata.contact_info.email) {
            console.log(`    Email: ${metadata.contact_info.email}`);
          }
          if (metadata.contact_info.phone) {
            console.log(`    Phone: ${metadata.contact_info.phone}`);
          }
        }
      }
      
      // Test Q&A extraction
      if (sample.expectedMetadata.hasQAPairs) {
        const hasQA = metadata.qa_pairs && metadata.qa_pairs.length > 0;
        totalTests++;
        if (hasQA) passedTests++;
        console.log(`  ✓ Q&A extraction: ${hasQA ? '✅' : '❌'} (found ${metadata.qa_pairs?.length || 0} pairs)`);
      }
      
      results.push({
        name: sample.name,
        metadata,
        passed: true
      });
      
    } catch (error) {
      console.log('❌ ERROR:', error);
      results.push({
        name: sample.name,
        error,
        passed: false
      });
    }
  }
  
  // Test metadata scoring calculation
  console.log('\n' + '='.repeat(80));
  console.log('🔢 Testing Metadata Scoring\n');
  
  const scoringTests = [
    {
      name: "First chunk boost",
      metadata: { chunk_index: 0 },
      expectedBoost: 0.15
    },
    {
      name: "Keyword match boost",
      metadata: { keywords: ['motor', 'installation'] },
      queryKeywords: ['motor'],
      expectedBoost: 0.20
    },
    {
      name: "Entity match boost",
      metadata: { entities: { skus: ['BOS-1234'] } },
      queryKeywords: ['BOS-1234'],
      expectedBoost: 0.25
    }
  ];
  
  console.log('Scoring tests would be validated through database functions...');
  
  // Test database functions
  console.log('\n' + '='.repeat(80));
  console.log('🗄️ Testing Database Functions\n');
  
  try {
    // Test get_metadata_stats function
    const { data: stats, error: statsError } = await supabase
      .rpc('get_metadata_stats', { p_domain_id: null });
    
    if (statsError) {
      console.log('❌ Error calling get_metadata_stats:', statsError);
    } else {
      totalTests++;
      passedTests++;
      console.log('✅ get_metadata_stats function working');
      console.log(`  Total embeddings: ${stats?.[0]?.total_embeddings || 0}`);
      console.log(`  With enhanced metadata: ${stats?.[0]?.with_enhanced_metadata || 0}`);
      console.log(`  Coverage: ${stats?.[0]?.coverage_percentage?.toFixed(1) || 0}%`);
    }
    
    // Test search_by_metadata function
    const { data: metadataSearch, error: metadataError } = await supabase
      .rpc('search_by_metadata', {
        p_domain_id: null,
        content_types: ['product'],
        limit_count: 1
      });
    
    if (metadataError) {
      console.log('❌ Error calling search_by_metadata:', metadataError);
    } else {
      totalTests++;
      passedTests++;
      console.log('✅ search_by_metadata function working');
      console.log(`  Found ${metadataSearch?.length || 0} results`);
    }
    
  } catch (dbError) {
    console.log('❌ Database function tests failed:', dbError);
  }
  
  // Performance test
  console.log('\n' + '='.repeat(80));
  console.log('⚡ Performance Testing\n');
  
  const perfContent = testSamples[0].content;
  const startTime = Date.now();
  
  for (let i = 0; i < 100; i++) {
    await MetadataExtractor.extractEnhancedMetadata(
      perfContent,
      perfContent,
      'https://example.com/test',
      'Test Page',
      0,
      1
    );
  }
  
  const endTime = Date.now();
  const avgTime = (endTime - startTime) / 100;
  
  console.log(`Average extraction time: ${avgTime.toFixed(2)}ms`);
  console.log(`Performance: ${avgTime < 50 ? '✅ Excellent' : avgTime < 100 ? '⚠️ Good' : '❌ Needs optimization'}`);
  
  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 Test Summary\n');
  console.log(`Total tests: ${totalTests}`);
  console.log(`✅ Passed: ${passedTests}`);
  console.log(`❌ Failed: ${totalTests - passedTests}`);
  console.log(`Success rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  
  // Check if metadata is being used in production
  console.log('\n🔍 Production Usage Check\n');
  
  const { data: sampleEmbeddings, error: embError } = await supabase
    .from('page_embeddings')
    .select('metadata')
    .limit(5);
  
  if (!embError && sampleEmbeddings) {
    const withMetadata = sampleEmbeddings.filter(e => 
      e.metadata && e.metadata.content_type
    ).length;
    
    console.log(`Sample check: ${withMetadata}/${sampleEmbeddings.length} embeddings have enhanced metadata`);
    
    if (withMetadata > 0) {
      console.log('\nSample metadata structure:');
      const sample = sampleEmbeddings.find(e => e.metadata?.content_type);
      if (sample?.metadata) {
        console.log(`  Content type: ${sample.metadata.content_type}`);
        console.log(`  Has keywords: ${!!sample.metadata.keywords}`);
        console.log(`  Has entities: ${!!sample.metadata.entities}`);
        console.log(`  Has readability: ${!!sample.metadata.readability_score}`);
      }
    }
  }
  
  console.log('\n✨ Metadata Enhancement Testing Complete!\n');
}

// Run the tests
runTests().catch(console.error);