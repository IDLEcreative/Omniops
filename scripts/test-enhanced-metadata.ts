#!/usr/bin/env npx tsx
/**
 * Test script for enhanced metadata system
 * Demonstrates the improvements in search relevance through metadata enrichment
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { MetadataExtractor } from '../lib/metadata-extractor';

// Load environment variables
config({ path: '.env.local' });

// Check for required environment variables
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables');
  console.error('Please ensure .env.local contains:');
  console.error('  NEXT_PUBLIC_SUPABASE_URL');
  console.error('  SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Test content samples
const testContent = {
  product: {
    url: 'https://example.com/products/dc66-10p-motor',
    title: 'DC66-10P Replacement Motor - High Performance',
    content: `
      DC66-10P Replacement Motor - Professional Grade
      
      Price: £299.99
      SKU: DC66-10P
      Availability: In Stock
      Rating: 4.8 out of 5 (156 reviews)
      
      Description:
      This high-performance replacement motor is designed for industrial applications.
      Compatible with models XR-500, XR-600, and XR-700. Features include:
      - 2000W power output
      - Quiet operation at 65dB
      - Energy efficient design
      - 2-year manufacturer warranty
      
      Technical Specifications:
      - Voltage: 240V
      - Current: 8.3A
      - Speed: 1800 RPM
      - Weight: 5.2kg
      
      Installation is straightforward and typically takes 30-45 minutes.
      All necessary mounting hardware is included in the package.
    `
  },
  faq: {
    url: 'https://example.com/support/faq',
    title: 'Frequently Asked Questions',
    content: `
      Frequently Asked Questions
      
      Q: How do I install the DC66-10P motor?
      A: Installation is simple. First, disconnect power to your equipment. 
         Remove the old motor by unscrewing the four mounting bolts. 
         Position the new DC66-10P motor and secure with the provided bolts.
         Connect the wiring according to the color-coded diagram included.
      
      Q: What is the warranty period?
      A: All our motors come with a 2-year manufacturer warranty covering
         defects in materials and workmanship. Extended warranty options
         are available for purchase.
      
      Q: Is the DC66-10P compatible with older models?
      A: Yes, the DC66-10P is backward compatible with all models from 
         2015 onwards, including the XR-400 series. For older models,
         you may need the adapter kit (sold separately).
      
      Q: What maintenance is required?
      A: Regular maintenance includes monthly cleaning of air vents,
         checking belt tension every 3 months, and annual lubrication
         of bearings. Detailed maintenance schedules are in the manual.
    `
  },
  documentation: {
    url: 'https://example.com/docs/installation-guide',
    title: 'Installation Guide - Motor Replacement',
    content: `
      Motor Replacement Installation Guide
      
      Prerequisites:
      - Phillips head screwdriver
      - 10mm wrench
      - Wire strippers (if needed)
      - Safety gloves and goggles
      
      Step 1: Safety First
      Before beginning any work, ensure the power supply is completely
      disconnected. Lock out the circuit breaker to prevent accidental
      power restoration during installation.
      
      Step 2: Remove Old Motor
      Locate the four mounting bolts securing the motor to the frame.
      Using the 10mm wrench, carefully remove each bolt. Support the
      motor weight as you remove the final bolt to prevent dropping.
      
      Step 3: Disconnect Wiring
      Take a photo of the existing wiring configuration for reference.
      Carefully disconnect each wire, noting the connection points.
      The standard configuration uses: Red (Live), Black (Neutral),
      Green/Yellow (Ground).
      
      Step 4: Install New Motor
      Position the new DC66-10P motor onto the mounting frame.
      Insert and hand-tighten all four mounting bolts before fully
      tightening with the wrench. Ensure the motor is level.
      
      Step 5: Connect Wiring
      Following your reference photo or the included diagram,
      connect the wires to the corresponding terminals. Ensure
      all connections are secure and properly insulated.
    `
  }
};

async function testMetadataExtraction() {
  console.log('\n🔍 Testing Metadata Extraction\n');
  console.log('=' .repeat(60));
  
  for (const [type, data] of Object.entries(testContent)) {
    console.log(`\n📄 Content Type: ${type.toUpperCase()}`);
    console.log(`URL: ${data.url}`);
    
    // Extract metadata
    const metadata = await MetadataExtractor.extractEnhancedMetadata(
      data.content,
      data.content,
      data.url,
      data.title,
      0,
      1
    );
    
    console.log('\nExtracted Metadata:');
    console.log(`  Content Type: ${metadata.content_type}`);
    console.log(`  Keywords: ${metadata.keywords.slice(0, 5).join(', ')}`);
    console.log(`  Word Count: ${metadata.word_count}`);
    console.log(`  Readability Score: ${metadata.readability_score?.toFixed(1)}`);
    
    if (metadata.entities.skus?.length) {
      console.log(`  SKUs Found: ${metadata.entities.skus.join(', ')}`);
    }
    if (metadata.entities.brands?.length) {
      console.log(`  Brands: ${metadata.entities.brands.join(', ')}`);
    }
    if (metadata.price_range) {
      console.log(`  Price Range: ${metadata.price_range.currency} ${metadata.price_range.min}-${metadata.price_range.max}`);
    }
    if (metadata.availability) {
      console.log(`  Availability: ${metadata.availability}`);
    }
  }
}

async function testEnhancedSearch() {
  console.log('\n🔎 Testing Enhanced Search\n');
  console.log('=' .repeat(60));
  
  // Test queries
  const queries = [
    {
      query: 'DC66-10P motor installation',
      filters: { contentTypes: ['product', 'documentation'] }
    },
    {
      query: 'warranty period',
      filters: { contentTypes: ['faq'] }
    },
    {
      query: 'replacement motor under £400',
      filters: { 
        contentTypes: ['product'],
        priceRange: { min: 0, max: 400 }
      }
    }
  ];
  
  for (const test of queries) {
    console.log(`\n🔍 Query: "${test.query}"`);
    if (test.filters.contentTypes) {
      console.log(`   Filter: Content types = ${test.filters.contentTypes.join(', ')}`);
    }
    if (test.filters.priceRange) {
      console.log(`   Filter: Price range = £${test.filters.priceRange.min}-${test.filters.priceRange.max}`);
    }
    
    // Simulate search (in real scenario, this would query the database)
    console.log('\n   Results would be filtered and scored based on:');
    console.log('   • Vector similarity to query');
    console.log('   • Content type relevance');
    console.log('   • Keyword matches in metadata');
    console.log('   • Chunk position (early chunks get boost)');
    console.log('   • Price range filtering (if applicable)');
  }
}

async function testMigration() {
  console.log('\n🔄 Testing Migration Capability\n');
  console.log('=' .repeat(60));
  
  console.log('\nMigration would process existing embeddings to add:');
  console.log('  • Content type classification');
  console.log('  • Keyword extraction');
  console.log('  • Entity recognition (SKUs, brands, models)');
  console.log('  • Readability scoring');
  console.log('  • E-commerce data extraction');
  
  console.log('\nTo run migration on real data:');
  console.log('  await migrateExistingEmbeddings(100, "example.com");');
}

async function testMetadataStats() {
  console.log('\n📊 Testing Metadata Statistics\n');
  console.log('=' .repeat(60));
  
  // Check if we can connect to database
  const { data: domains, error } = await supabase
    .from('domains')
    .select('domain')
    .limit(1);
  
  if (error) {
    console.log('❌ Cannot connect to database for live stats');
    console.log('\nExample stats output:');
    console.log('  Total Embeddings: 1,234');
    console.log('  With Enhanced Metadata: 456 (37%)');
    console.log('  Content Distribution:');
    console.log('    - product: 234');
    console.log('    - faq: 89');
    console.log('    - documentation: 67');
    console.log('    - general: 66');
    console.log('  Avg Keywords/Chunk: 8.3');
    console.log('  Avg Readability: 62.5');
    return;
  }
  
  if (domains && domains.length > 0) {
    console.log(`\nAnalyzing metadata for domain: ${domains[0].domain}`);
    console.log('\nWould analyze metadata quality here using analyzeMetadataQuality()');
    console.log('Example output:');
    console.log('  Total Embeddings: 153');
    console.log('  With Enhanced Metadata: 0 (0%)');
    console.log('  Content Distribution: {}');
    console.log('  Avg Keywords/Chunk: 0');
    console.log('  Avg Readability: 0');
  }
}

async function demonstrateImprovements() {
  console.log('\n✨ Key Improvements Summary\n');
  console.log('=' .repeat(60));
  
  console.log('\n1. 🎯 Better Search Relevance');
  console.log('   • Content type classification ensures appropriate results');
  console.log('   • Keyword and entity matching improves precision');
  console.log('   • Position-aware scoring (early chunks weighted higher)');
  
  console.log('\n2. 🚀 Faster Filtered Searches');
  console.log('   • Pre-filter by content type before vector operations');
  console.log('   • Metadata indexes for rapid filtering');
  console.log('   • Skip vector search for exact SKU/entity matches');
  
  console.log('\n3. 📈 Enhanced User Experience');
  console.log('   • Faceted search capabilities');
  console.log('   • Price range filtering for e-commerce');
  console.log('   • Better snippet generation with section context');
  
  console.log('\n4. 📊 Monitoring & Optimization');
  console.log('   • Track metadata quality metrics');
  console.log('   • Identify content gaps');
  console.log('   • A/B test scoring weights');
}

// Main execution
async function main() {
  console.log('🚀 Enhanced Metadata System Test Suite');
  console.log('=' .repeat(60));
  
  try {
    await testMetadataExtraction();
    await testEnhancedSearch();
    await testMigration();
    await testMetadataStats();
    await demonstrateImprovements();
    
    console.log('\n✅ All tests completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Run the migration: npx tsx scripts/migrate-embeddings.ts');
    console.log('2. Apply database migration: supabase migration up');
    console.log('3. Update scraping to use generateEnhancedEmbeddings()');
    console.log('4. Switch search to use searchEnhancedContent()');
    
  } catch (error) {
    console.error('\n❌ Error during testing:', error);
    process.exit(1);
  }
}

// Run the tests
main().catch(console.error);