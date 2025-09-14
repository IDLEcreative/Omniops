#!/usr/bin/env node

/**
 * Comprehensive Metadata Verification Test
 * Tests that metadata is being generated, embedded, and vectorized correctly
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { ContentEnricher } = require('./lib/content-enricher');
const { MetadataExtractor } = require('./lib/metadata-extractor');
const { EcommerceExtractor } = require('./lib/ecommerce-extractor');
const OpenAI = require('openai');

// Initialize services
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const contentEnricher = new ContentEnricher();
const metadataExtractor = new MetadataExtractor();
const ecommerceExtractor = new EcommerceExtractor();

// Test HTML simulating an e-commerce product page
const testHTML = `
<!DOCTYPE html>
<html>
<head>
  <title>DC66-10P Dryer Heating Element - Thompson's eParts</title>
  <meta name="description" content="High-quality replacement heating element for Samsung dryers">
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "DC66-10P Dryer Heating Element",
    "sku": "DC66-10P",
    "price": "49.99",
    "priceCurrency": "USD",
    "availability": "InStock",
    "brand": "Samsung",
    "category": "Appliance Parts"
  }
  </script>
</head>
<body>
  <h1>DC66-10P Dryer Heating Element</h1>
  <div class="product-sku">SKU: DC66-10P</div>
  <div class="price">$49.99</div>
  <div class="availability in-stock">In Stock</div>
  <div class="product-description">
    This heating element is designed for Samsung dryers and provides reliable performance.
    Compatible with models DV448AEE/XAA, DV50F9A6EVW/A2, and more.
  </div>
  <div class="specifications">
    <h3>Specifications</h3>
    <ul>
      <li>Part Number: DC66-10P</li>
      <li>Manufacturer: Samsung</li>
      <li>Voltage: 240V</li>
      <li>Wattage: 5300W</li>
    </ul>
  </div>
</body>
</html>
`;

async function runComprehensiveTest() {
  console.log('\\n' + '='.repeat(80));
  console.log('   COMPREHENSIVE METADATA VERIFICATION TEST');
  console.log('='.repeat(80) + '\\n');

  const results = {
    metadata: { pass: 0, fail: 0 },
    enrichment: { pass: 0, fail: 0 },
    embedding: { pass: 0, fail: 0 },
    vectorization: { pass: 0, fail: 0 }
  };

  try {
    // Test 1: Metadata Extraction
    console.log('\\n📊 Test 1: Metadata Extraction');
    console.log('─'.repeat(40));
    
    // Use the static method from MetadataExtractor
    const extractedMetadata = MetadataExtractor.extractEnhancedMetadata(
      testHTML.replace(/<[^>]*>/g, ' '),  // chunk text
      testHTML,                            // full content
      'https://example.com/product',      // url
      'DC66-10P Dryer Heating Element',   // title
      0,                                   // chunk position
      1,                                   // total chunks
      testHTML                             // html content
    );
    
    // Check for essential metadata fields
    const metadataFields = ['content_type', 'keywords', 'price_range', 'contact_info', 'semantic_density'];
    for (const field of metadataFields) {
      if (extractedMetadata[field]) {
        console.log(`  ✓ ${field}: ${JSON.stringify(extractedMetadata[field])}`);
        results.metadata.pass++;
      } else {
        console.log(`  ✗ ${field}: Missing`);
        results.metadata.fail++;
      }
    }

    // Test 2: E-commerce Extraction
    console.log('\\n🛍️ Test 2: E-commerce Data Extraction');
    console.log('─'.repeat(40));
    
    const ecommerceData = await EcommerceExtractor.extractEcommerce(testHTML, 'https://example.com/product');
    
    if (ecommerceData.products && ecommerceData.products.length > 0) {
      console.log(`  ✓ Products found: ${ecommerceData.products.length}`);
      results.enrichment.pass++;
      
      const product = ecommerceData.products[0];
      const productFields = ['sku', 'name', 'price', 'availability'];
      
      for (const field of productFields) {
        if (product[field]) {
          console.log(`  ✓ Product ${field}: ${product[field]}`);
          results.enrichment.pass++;
        } else {
          console.log(`  ✗ Product ${field}: Missing`);
          results.enrichment.fail++;
        }
      }
    } else {
      console.log('  ✗ No products extracted');
      results.enrichment.fail++;
    }

    // Test 3: Content Enrichment
    console.log('\\n✨ Test 3: Content Enrichment');
    console.log('─'.repeat(40));
    
    const plainText = testHTML.replace(/<[^>]*>/g, ' ').trim();
    const enrichedContent = contentEnricher.enrichContent(plainText, extractedMetadata);
    
    // Check if enrichment added metadata
    const enrichmentChecks = [
      { pattern: /DC66-10P/i, name: 'SKU preserved' },
      { pattern: /\\$49\\.99|49\\.99/i, name: 'Price preserved' },
      { pattern: /in stock/i, name: 'Availability preserved' },
      { pattern: /Samsung/i, name: 'Brand preserved' }
    ];
    
    for (const check of enrichmentChecks) {
      if (check.pattern.test(enrichedContent)) {
        console.log(`  ✓ ${check.name}`);
        results.enrichment.pass++;
      } else {
        console.log(`  ✗ ${check.name}`);
        results.enrichment.fail++;
      }
    }

    // Test 4: Embedding Generation
    console.log('\\n🔢 Test 4: Embedding Generation');
    console.log('─'.repeat(40));
    
    try {
      // Generate embedding for enriched content
      const embeddingResponse = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: enrichedContent.substring(0, 8000), // Limit for API
      });
      
      const embedding = embeddingResponse.data[0].embedding;
      
      if (embedding && embedding.length === 1536) {
        console.log(`  ✓ Embedding generated: ${embedding.length} dimensions`);
        console.log(`  ✓ First 5 values: [${embedding.slice(0, 5).map(v => v.toFixed(4)).join(', ')}...]`);
        results.embedding.pass++;
      } else {
        console.log(`  ✗ Invalid embedding dimensions: ${embedding ? embedding.length : 0}`);
        results.embedding.fail++;
      }
      
      // Generate metadata embedding if we have structured data
      if (extractedMetadata.productSku) {
        const metadataString = JSON.stringify({
          sku: extractedMetadata.productSku,
          price: extractedMetadata.productPrice,
          inStock: extractedMetadata.productInStock,
          brand: extractedMetadata.productBrand || 'Samsung'
        });
        
        const metadataEmbeddingResponse = await openai.embeddings.create({
          model: 'text-embedding-3-small',
          input: metadataString,
        });
        
        const metadataEmbedding = metadataEmbeddingResponse.data[0].embedding;
        
        if (metadataEmbedding && metadataEmbedding.length === 1536) {
          console.log(`  ✓ Metadata embedding generated: ${metadataEmbedding.length} dimensions`);
          results.embedding.pass++;
        } else {
          console.log(`  ✗ Invalid metadata embedding`);
          results.embedding.fail++;
        }
      }
    } catch (error) {
      console.log(`  ✗ Embedding generation failed: ${error.message}`);
      results.embedding.fail++;
    }

    // Test 5: Database Storage Check
    console.log('\\n💾 Test 5: Database Vectorization Check');
    console.log('─'.repeat(40));
    
    // Check if we have any pages with metadata in the database
    const { data: pagesWithMetadata, error: dbError } = await supabase
      .from('scraped_pages')
      .select('url, title, metadata')
      .not('metadata', 'is', null)
      .limit(3);
    
    if (!dbError && pagesWithMetadata && pagesWithMetadata.length > 0) {
      console.log(`  ✓ Found ${pagesWithMetadata.length} pages with metadata`);
      results.vectorization.pass++;
      
      for (const page of pagesWithMetadata) {
        const hasProductData = page.metadata?.productSku || 
                              page.metadata?.productPrice || 
                              page.metadata?.sku ||
                              page.metadata?.price;
        
        if (hasProductData) {
          console.log(`  ✓ ${page.url}: Has product metadata`);
          results.vectorization.pass++;
        } else {
          console.log(`  ⚠ ${page.url}: Has metadata but no product data`);
        }
      }
    } else {
      console.log(`  ✗ No pages with metadata found in database`);
      if (dbError) console.log(`  Error: ${dbError.message}`);
      results.vectorization.fail++;
    }

    // Check for embeddings
    const { data: embeddingsCount, error: embError } = await supabase
      .from('page_embeddings')
      .select('id', { count: 'exact', head: true });
    
    if (!embError && embeddingsCount) {
      console.log(`  ✓ Total embeddings in database: ${embeddingsCount}`);
      results.vectorization.pass++;
    } else {
      console.log(`  ✗ Could not count embeddings`);
      results.vectorization.fail++;
    }

  } catch (error) {
    console.error('\\n❌ Test failed with error:', error.message);
  }

  // Print summary
  console.log('\\n' + '='.repeat(80));
  console.log('   TEST SUMMARY');
  console.log('='.repeat(80));
  
  const categories = [
    { name: 'Metadata Extraction', results: results.metadata },
    { name: 'Content Enrichment', results: results.enrichment },
    { name: 'Embedding Generation', results: results.embedding },
    { name: 'Database Vectorization', results: results.vectorization }
  ];
  
  let totalPass = 0;
  let totalFail = 0;
  
  for (const category of categories) {
    const passRate = category.results.pass + category.results.fail > 0 
      ? Math.round((category.results.pass / (category.results.pass + category.results.fail)) * 100)
      : 0;
    
    const status = passRate >= 80 ? '✅' : passRate >= 50 ? '⚠️' : '❌';
    
    console.log(`\\n${status} ${category.name}:`);
    console.log(`   Pass: ${category.results.pass} | Fail: ${category.results.fail} | Success Rate: ${passRate}%`);
    
    totalPass += category.results.pass;
    totalFail += category.results.fail;
  }
  
  const overallRate = Math.round((totalPass / (totalPass + totalFail)) * 100);
  console.log('\\n' + '─'.repeat(80));
  console.log(`Overall Success Rate: ${overallRate}% ${overallRate >= 80 ? '✅ PASS' : '❌ NEEDS ATTENTION'}`);
  console.log('─'.repeat(80) + '\\n');

  // Recommendations
  if (overallRate < 80) {
    console.log('\\n📝 Recommendations:');
    console.log('─'.repeat(40));
    
    if (results.metadata.fail > 0) {
      console.log('• Metadata extraction needs improvement - check MetadataExtractor');
    }
    if (results.enrichment.fail > 0) {
      console.log('• Content enrichment not working properly - verify ContentEnricher');
    }
    if (results.embedding.fail > 0) {
      console.log('• Embedding generation issues - check OpenAI API key and connection');
    }
    if (results.vectorization.fail > 0) {
      console.log('• Database storage issues - run a fresh scrape with metadata enabled');
    }
  }
}

// Run the test
runComprehensiveTest().catch(console.error);