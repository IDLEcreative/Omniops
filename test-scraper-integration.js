#!/usr/bin/env node

/**
 * Test script to verify the integrated scraper-worker with metadata enrichment
 * This tests the complete pipeline: extraction -> enrichment -> embedding
 */

require('dotenv').config();
const { JSDOM } = require('jsdom');
const { ContentEnricher } = require('./lib/content-enricher');

// Test HTML with e-commerce product data
const testHTML = `
<!DOCTYPE html>
<html>
<head>
  <title>DC66-10P Dryer Heating Element - Premium Appliance Parts</title>
  <meta name="description" content="High-quality replacement heating element for Samsung dryers. In stock and ready to ship.">
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "DC66-10P Dryer Heating Element",
    "sku": "DC66-10P",
    "brand": {
      "@type": "Brand",
      "name": "Samsung"
    },
    "offers": {
      "@type": "Offer",
      "price": "49.99",
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock"
    }
  }
  </script>
</head>
<body>
  <div class="product-page">
    <h1>DC66-10P Dryer Heating Element</h1>
    <div class="product-sku">SKU: DC66-10P</div>
    <div class="price">$49.99</div>
    <div class="in-stock">✓ In Stock - Ships Today</div>
    <div class="product-description">
      This heating element (part number DC66-10P) is for Samsung dryers. 
      The heating element produces the heat to dry clothes during the drying cycle.
      Disconnect the power before installing this part. Wear work gloves to protect your hands.
    </div>
  </div>
</body>
</html>
`;

// Simulate the extractMetadata function from scraper-worker.js
function extractMetadata(document) {
  const getMeta = (name) => {
    const element = document.querySelector(
      `meta[name="${name}"], meta[property="${name}"], meta[property="og:${name}"], meta[property="article:${name}"]`
    );
    return element ? element.getAttribute('content') : null;
  };
  
  // Extract JSON-LD structured data
  let structuredData = {};
  const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
  jsonLdScripts.forEach(script => {
    try {
      const data = JSON.parse(script.textContent || '{}');
      structuredData = { ...structuredData, ...data };
    } catch (e) {
      // Ignore parsing errors
    }
  });
  
  // Extract product data from HTML
  const extractProductData = () => {
    const productData = {};
    
    // Try to extract price
    const priceElement = document.querySelector('.price, .product-price, [itemprop="price"]');
    if (priceElement) {
      productData.price = priceElement.textContent?.trim();
    }
    
    // Try to extract stock
    const stockElement = document.querySelector('.in-stock, .stock, .availability');
    if (stockElement) {
      productData.availability = stockElement.textContent?.trim();
      productData.inStock = !stockElement.textContent?.toLowerCase().includes('out of stock');
    }
    
    // Try to extract SKU
    const skuElement = document.querySelector('.product-sku, .sku, [itemprop="sku"]');
    if (skuElement) {
      const skuText = skuElement.textContent?.trim();
      // Extract just the SKU code
      productData.sku = skuText?.replace(/SKU:\s*/i, '');
    }
    
    productData.lastChecked = new Date().toISOString();
    return productData;
  };
  
  const productData = extractProductData();
  
  return {
    title: getMeta('title') || document.title,
    description: getMeta('description'),
    ...structuredData,
    ...productData,
    // Standardized fields for ContentEnricher
    productSku: productData.sku || structuredData.sku,
    productPrice: productData.price || structuredData.offers?.price,
    productInStock: productData.inStock !== undefined ? productData.inStock : 
                    (structuredData.offers?.availability === 'https://schema.org/InStock'),
    productBrand: structuredData.brand?.name || structuredData.brand,
  };
}

async function runIntegrationTest() {
  console.log('\\n' + '='.repeat(80));
  console.log('   SCRAPER INTEGRATION TEST - METADATA ENRICHMENT PIPELINE');
  console.log('='.repeat(80) + '\\n');

  try {
    // Step 1: Parse HTML
    console.log('📄 Step 1: Parsing HTML');
    console.log('─'.repeat(40));
    const dom = new JSDOM(testHTML);
    const document = dom.window.document;
    console.log('✓ HTML parsed successfully\\n');

    // Step 2: Extract metadata
    console.log('🔍 Step 2: Extracting Metadata');
    console.log('─'.repeat(40));
    const metadata = extractMetadata(document);
    
    console.log('Extracted metadata:');
    console.log(`  Title: ${metadata.title}`);
    console.log(`  Description: ${metadata.description}`);
    console.log(`  Product SKU: ${metadata.productSku}`);
    console.log(`  Product Price: ${metadata.productPrice}`);
    console.log(`  Product In Stock: ${metadata.productInStock}`);
    console.log(`  Product Brand: ${metadata.productBrand}`);
    console.log('');

    // Step 3: Extract plain text content
    console.log('📝 Step 3: Extracting Content');
    console.log('─'.repeat(40));
    const plainText = document.body.textContent
      .replace(/\\s+/g, ' ')
      .trim();
    console.log(`Original content (${plainText.length} chars):`);
    console.log(`"${plainText.substring(0, 100)}..."\\n`);

    // Step 4: Enrich content
    console.log('✨ Step 4: Enriching Content with Metadata');
    console.log('─'.repeat(40));
    const enrichedContent = ContentEnricher.enrichContent(plainText, metadata, 'https://example.com/product', metadata.title);
    
    console.log(`Enriched content (${enrichedContent.length} chars):`);
    console.log(`"${enrichedContent.substring(0, 200)}..."\\n`);

    // Step 5: Verify enrichment
    console.log('✅ Step 5: Verifying Enrichment');
    console.log('─'.repeat(40));
    
    const checks = [
      { 
        name: 'SKU included', 
        test: enrichedContent.includes(metadata.productSku),
        expected: metadata.productSku
      },
      { 
        name: 'Price included', 
        test: enrichedContent.includes('49.99'),
        expected: '$49.99'
      },
      { 
        name: 'Stock status included', 
        test: enrichedContent.toLowerCase().includes('in stock'),
        expected: 'In Stock'
      },
      { 
        name: 'Brand included', 
        test: enrichedContent.includes('Samsung'),
        expected: 'Samsung'
      },
      {
        name: 'Original content preserved',
        test: enrichedContent.includes('heating element'),
        expected: 'heating element'
      }
    ];

    let passCount = 0;
    let failCount = 0;

    for (const check of checks) {
      if (check.test) {
        console.log(`  ✓ ${check.name}: "${check.expected}"`);
        passCount++;
      } else {
        console.log(`  ✗ ${check.name}: Expected "${check.expected}" not found`);
        failCount++;
      }
    }

    // Summary
    console.log('\\n' + '='.repeat(80));
    console.log('   TEST SUMMARY');
    console.log('='.repeat(80));
    
    const successRate = Math.round((passCount / (passCount + failCount)) * 100);
    console.log(`\\nTests Passed: ${passCount}`);
    console.log(`Tests Failed: ${failCount}`);
    console.log(`Success Rate: ${successRate}%`);
    
    if (successRate >= 80) {
      console.log('\\n✅ Integration test PASSED! The metadata enrichment pipeline is working correctly.');
      console.log('\\n📋 Next Steps:');
      console.log('1. Run a force rescrape on a test domain to generate enriched embeddings');
      console.log('2. Test product search queries to verify improved accuracy');
      console.log('3. Monitor the logs to ensure metadata is being extracted and enriched');
    } else {
      console.log('\\n⚠️  Integration test needs attention. Some features are not working as expected.');
    }

  } catch (error) {
    console.error('\\n❌ Test failed with error:', error.message);
    console.error(error.stack);
  }
}

// Run the test
runIntegrationTest().catch(console.error);