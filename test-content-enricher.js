/**
 * Comprehensive Test Suite for Content Enricher Module
 * Tests all functions including edge cases and e-commerce scenarios
 */

const { ContentEnricher } = require('./lib/content-enricher.js');

// ANSI color codes for better test output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Test tracking
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

// Test assertion helper
function assert(condition, testName, expected, actual) {
  totalTests++;
  if (condition) {
    console.log(`${colors.green}✓${colors.reset} ${testName}`);
    passedTests++;
  } else {
    console.log(`${colors.red}✗${colors.reset} ${testName}`);
    console.log(`  ${colors.dim}Expected: ${expected}${colors.reset}`);
    console.log(`  ${colors.dim}Actual: ${actual}${colors.reset}`);
    failedTests++;
  }
}

// Test group helper
function testGroup(groupName, fn) {
  console.log(`\n${colors.bright}${colors.blue}${groupName}${colors.reset}`);
  console.log('─'.repeat(50));
  fn();
}

// Sample test data
const sampleEcommerceMetadata = {
  ecommerceData: {
    products: [
      {
        name: 'Premium Brake Pad Set - Ceramic',
        sku: 'DC66-10P',
        price: {
          formatted: '$89.99',
          raw: 89.99
        },
        availability: {
          inStock: true,
          quantity: 15
        },
        categories: ['Brake Systems', 'Auto Parts', 'Performance Parts'],
        brand: 'Thompson eParts',
        attributes: {
          material: 'Ceramic Compound',
          compatibility: 'Universal Fit 2015-2023',
          warranty: '2 Year Limited',
          weight: '4.5 lbs'
        }
      }
    ]
  }
};

const multiProductMetadata = {
  ecommerceData: {
    products: [
      {
        name: 'Oil Filter - Premium',
        sku: 'OF-2023-X',
        price: { formatted: '$12.99' },
        availability: { inStock: true },
        brand: 'AutoMax'
      },
      {
        name: 'Air Filter - High Performance',
        sku: 'AF-HP-500',
        price: { formatted: '$24.99' },
        availability: { inStock: false },
        brand: 'FilterPro'
      }
    ]
  }
};

const businessMetadata = {
  businessInfo: {
    contactInfo: {
      phones: ['+1-555-123-4567'],
      emails: ['info@thompsoneparts.com'],
      addresses: ['123 Auto Parts Lane, Detroit, MI 48201']
    },
    businessHours: ['Mon-Fri: 8AM-6PM, Sat: 9AM-4PM, Sun: Closed']
  }
};

const topLevelProductMetadata = {
  productName: 'Alternator - Remanufactured',
  productSku: 'ALT-REM-2024',
  productPrice: '$249.99',
  productInStock: true
};

const hybridMetadata = {
  ...sampleEcommerceMetadata,
  ...businessMetadata,
  keywords: ['auto parts', 'brake pads', 'ceramic', 'performance'],
  entities: ['Thompson eParts', 'Detroit', 'Automotive'],
  content_type: 'product_page',
  price_range: { min: 50, max: 150 }
};

// Start Testing
console.log(`${colors.bright}${colors.cyan}Content Enricher Test Suite${colors.reset}`);
console.log('═'.repeat(50));

// Test 1: Basic enrichContent function
testGroup('1. enrichContent() - Basic Functionality', () => {
  const text = 'This is a premium brake pad designed for high performance vehicles.';
  const enriched = ContentEnricher.enrichContent(text, sampleEcommerceMetadata, 'https://example.com/products/brake-pads', 'Brake Pads');
  
  assert(
    enriched.includes('Title: Brake Pads'),
    'Should include title',
    'Title in content',
    enriched.includes('Title:') ? 'Title found' : 'Title missing'
  );
  
  assert(
    enriched.includes('Product: Premium Brake Pad Set - Ceramic'),
    'Should include product name',
    'Product name in content',
    enriched.includes('Product:') ? 'Product found' : 'Product missing'
  );
  
  assert(
    enriched.includes('SKU: DC66-10P'),
    'Should include SKU',
    'SKU in content',
    enriched.includes('SKU:') ? 'SKU found' : 'SKU missing'
  );
  
  assert(
    enriched.includes('Part Number: DC66-10P'),
    'Should duplicate SKU as Part Number for search optimization',
    'Part Number in content',
    enriched.includes('Part Number:') ? 'Part Number found' : 'Part Number missing'
  );
  
  assert(
    enriched.includes('Price: $89.99'),
    'Should include formatted price',
    'Price in content',
    enriched.includes('Price:') ? 'Price found' : 'Price missing'
  );
  
  assert(
    enriched.includes('Availability: In Stock'),
    'Should include availability status',
    'Availability in content',
    enriched.includes('Availability:') ? 'Availability found' : 'Availability missing'
  );
  
  assert(
    enriched.includes('Categories: Brake Systems, Auto Parts, Performance Parts'),
    'Should include categories',
    'Categories in content',
    enriched.includes('Categories:') ? 'Categories found' : 'Categories missing'
  );
  
  assert(
    enriched.includes('Brand: Thompson eParts'),
    'Should include brand',
    'Brand in content',
    enriched.includes('Brand:') ? 'Brand found' : 'Brand missing'
  );
  
  assert(
    enriched.includes('Material: Ceramic Compound'),
    'Should include product attributes',
    'Attributes in content',
    enriched.includes('Material:') ? 'Material attribute found' : 'Material attribute missing'
  );
  
  assert(
    enriched.endsWith(text),
    'Should append original text at the end',
    'Original text at end',
    enriched.endsWith(text) ? 'Text at end' : 'Text not at end'
  );
});

// Test 2: Edge cases
testGroup('2. enrichContent() - Edge Cases', () => {
  // Empty metadata
  const emptyResult = ContentEnricher.enrichContent('Sample text', {}, '', '');
  assert(
    emptyResult === 'Sample text',
    'Should handle empty metadata gracefully',
    'Sample text',
    emptyResult
  );
  
  // Null/undefined values
  const nullResult = ContentEnricher.enrichContent('Text', null, null, null);
  assert(
    nullResult === 'Text',
    'Should handle null values',
    'Text',
    nullResult
  );
  
  // Missing text
  const noTextResult = ContentEnricher.enrichContent('', sampleEcommerceMetadata, '', 'Title');
  assert(
    noTextResult.includes('Title:') && noTextResult.includes('SKU:'),
    'Should enrich even with empty text',
    'Enriched metadata',
    noTextResult.includes('Title:') ? 'Has enrichment' : 'No enrichment'
  );
  
  // Invalid URL
  const invalidUrlResult = ContentEnricher.enrichContent('Text', {}, 'not-a-url', '');
  assert(
    invalidUrlResult === 'Text',
    'Should handle invalid URLs gracefully',
    'Text',
    invalidUrlResult
  );
  
  // Product with missing price
  const noPriceMetadata = {
    ecommerceData: {
      products: [{
        name: 'Test Product',
        sku: 'TEST-001'
      }]
    }
  };
  const noPriceResult = ContentEnricher.enrichContent('Text', noPriceMetadata);
  assert(
    !noPriceResult.includes('Price: undefined'),
    'Should not include undefined price',
    'No undefined price',
    noPriceResult.includes('undefined') ? 'Has undefined' : 'No undefined'
  );
});

// Test 3: createMetadataOnlyContent function
testGroup('3. createMetadataOnlyContent() Function', () => {
  const metadataOnly = ContentEnricher.createMetadataOnlyContent(sampleEcommerceMetadata);
  
  assert(
    metadataOnly.includes('SKU: DC66-10P'),
    'Should include SKU in metadata-only content',
    'SKU present',
    metadataOnly.includes('SKU:') ? 'SKU found' : 'SKU missing'
  );
  
  assert(
    metadataOnly.includes('Name: Premium Brake Pad Set - Ceramic'),
    'Should include product name',
    'Name present',
    metadataOnly.includes('Name:') ? 'Name found' : 'Name missing'
  );
  
  assert(
    !metadataOnly.includes('\n'),
    'Should use pipe separators, not newlines',
    'No newlines',
    !metadataOnly.includes('\n') ? 'No newlines' : 'Has newlines'
  );
  
  // Test with multiple products
  const multiProductResult = ContentEnricher.createMetadataOnlyContent(multiProductMetadata);
  assert(
    multiProductResult.includes('---'),
    'Should include separator for multiple products',
    'Separator present',
    multiProductResult.includes('---') ? 'Separator found' : 'Separator missing'
  );
  
  // Test with top-level metadata
  const topLevelResult = ContentEnricher.createMetadataOnlyContent(topLevelProductMetadata);
  assert(
    topLevelResult.includes('SKU: ALT-REM-2024'),
    'Should handle top-level product metadata',
    'Top-level SKU present',
    topLevelResult.includes('SKU:') ? 'SKU found' : 'SKU missing'
  );
});

// Test 4: extractUrlContext function
testGroup('4. extractUrlContext() Helper Function', () => {
  const productUrl = ContentEnricher.extractUrlContext('https://example.com/products/brake-systems/ceramic-pads');
  assert(
    productUrl === 'products > brake systems > ceramic pads',
    'Should extract and format URL path',
    'products > brake systems > ceramic pads',
    productUrl
  );
  
  const indexUrl = ContentEnricher.extractUrlContext('https://example.com/index.html');
  assert(
    indexUrl === '',
    'Should skip generic URL parts',
    'Empty string',
    indexUrl
  );
  
  const rootUrl = ContentEnricher.extractUrlContext('https://example.com/');
  assert(
    rootUrl === '',
    'Should handle root URL',
    'Empty string',
    rootUrl
  );
  
  const invalidUrl = ContentEnricher.extractUrlContext('not-a-url');
  assert(
    invalidUrl === '',
    'Should handle invalid URL',
    'Empty string',
    invalidUrl
  );
});

// Test 5: needsEnrichment function
testGroup('5. needsEnrichment() Function', () => {
  const plainText = 'This is plain text without any enrichment markers.';
  assert(
    ContentEnricher.needsEnrichment(plainText) === true,
    'Should identify text needing enrichment',
    'true',
    ContentEnricher.needsEnrichment(plainText)
  );
  
  const enrichedText = 'SKU: DC66-10P | Product: Brake Pad | This is enriched content.';
  assert(
    ContentEnricher.needsEnrichment(enrichedText) === false,
    'Should identify already enriched text',
    'false',
    ContentEnricher.needsEnrichment(enrichedText)
  );
  
  const partiallyEnriched = 'Price: $99.99 for this product';
  assert(
    ContentEnricher.needsEnrichment(partiallyEnriched) === false,
    'Should detect partial enrichment markers',
    'false',
    ContentEnricher.needsEnrichment(partiallyEnriched)
  );
});

// Test 6: calculateEnrichmentQuality function
testGroup('6. calculateEnrichmentQuality() Scoring Function', () => {
  const highQualityContent = ContentEnricher.enrichContent(
    'Product description text',
    sampleEcommerceMetadata,
    'https://example.com/products',
    'Product Page'
  );
  
  const highQualityMetrics = ContentEnricher.calculateEnrichmentQuality(highQualityContent);
  
  assert(
    highQualityMetrics.hasProductData === true,
    'Should detect product data',
    'true',
    highQualityMetrics.hasProductData
  );
  
  assert(
    highQualityMetrics.hasSKU === true,
    'Should detect SKU',
    'true',
    highQualityMetrics.hasSKU
  );
  
  assert(
    highQualityMetrics.hasPrice === true,
    'Should detect price',
    'true',
    highQualityMetrics.hasPrice
  );
  
  assert(
    highQualityMetrics.hasAvailability === true,
    'Should detect availability',
    'true',
    highQualityMetrics.hasAvailability
  );
  
  assert(
    highQualityMetrics.enrichmentScore >= 80,
    'Should have high enrichment score for complete data',
    '>= 80',
    highQualityMetrics.enrichmentScore
  );
  
  // Test low quality content
  const lowQualityMetrics = ContentEnricher.calculateEnrichmentQuality('Just plain text');
  assert(
    lowQualityMetrics.enrichmentScore === 0,
    'Should have zero score for unenriched content',
    '0',
    lowQualityMetrics.enrichmentScore
  );
  
  // Test partial enrichment
  const partialContent = 'SKU: TEST-001 | Product: Test Item';
  const partialMetrics = ContentEnricher.calculateEnrichmentQuality(partialContent);
  assert(
    partialMetrics.enrichmentScore === 50,
    'Should calculate correct score for partial enrichment',
    '50',
    partialMetrics.enrichmentScore
  );
});

// Test 7: formatAttributeName helper
testGroup('7. formatAttributeName() Helper Function', () => {
  assert(
    ContentEnricher.formatAttributeName('material_type') === 'Material Type',
    'Should format snake_case',
    'Material Type',
    ContentEnricher.formatAttributeName('material_type')
  );
  
  assert(
    ContentEnricher.formatAttributeName('productWeight') === 'Product Weight',
    'Should format camelCase',
    'Product Weight',
    ContentEnricher.formatAttributeName('productWeight')
  );
  
  assert(
    ContentEnricher.formatAttributeName('SKU') === 'S K U',
    'Should handle all caps',
    'S K U',
    ContentEnricher.formatAttributeName('SKU')
  );
});

// Test 8: Complex scenarios
testGroup('8. Complex Scenarios', () => {
  // Hybrid metadata with all types
  const hybridResult = ContentEnricher.enrichContent(
    'Complex product page content',
    hybridMetadata,
    'https://shop.example.com/auto-parts/brakes/ceramic',
    'Premium Ceramic Brake Pads'
  );
  
  assert(
    hybridResult.includes('Phone:') && hybridResult.includes('SKU:'),
    'Should handle hybrid metadata with business and product info',
    'Both business and product data',
    hybridResult.includes('Phone:') && hybridResult.includes('SKU:') ? 'Both present' : 'Missing data'
  );
  
  assert(
    hybridResult.includes('Keywords: auto parts'),
    'Should include keywords',
    'Keywords present',
    hybridResult.includes('Keywords:') ? 'Keywords found' : 'Keywords missing'
  );
  
  assert(
    hybridResult.includes('Content Type: product_page'),
    'Should include content type when not general',
    'Content type present',
    hybridResult.includes('Content Type:') ? 'Type found' : 'Type missing'
  );
  
  // Out of stock product
  const outOfStockMetadata = {
    ecommerceData: {
      products: [{
        name: 'Rare Part',
        sku: 'RARE-001',
        availability: {
          inStock: false,
          quantity: 0
        }
      }]
    }
  };
  
  const outOfStockResult = ContentEnricher.enrichContent('Product text', outOfStockMetadata);
  assert(
    outOfStockResult.includes('Availability: Out of Stock'),
    'Should handle out of stock products',
    'Out of Stock',
    outOfStockResult.includes('Out of Stock') ? 'Correct status' : 'Wrong status'
  );
});

// Test 9: Module exports
testGroup('9. Module Exports', () => {
  assert(
    typeof ContentEnricher === 'function',
    'ContentEnricher should be exported as a class/function',
    'function',
    typeof ContentEnricher
  );
  
  assert(
    typeof ContentEnricher.enrichContent === 'function',
    'enrichContent should be a static method',
    'function',
    typeof ContentEnricher.enrichContent
  );
  
  assert(
    typeof ContentEnricher.createMetadataOnlyContent === 'function',
    'createMetadataOnlyContent should be a static method',
    'function',
    typeof ContentEnricher.createMetadataOnlyContent
  );
  
  assert(
    typeof ContentEnricher.needsEnrichment === 'function',
    'needsEnrichment should be a static method',
    'function',
    typeof ContentEnricher.needsEnrichment
  );
  
  assert(
    typeof ContentEnricher.calculateEnrichmentQuality === 'function',
    'calculateEnrichmentQuality should be a static method',
    'function',
    typeof ContentEnricher.calculateEnrichmentQuality
  );
});

// Test 10: Thompson's eParts specific scenarios
testGroup('10. Thompson\'s eParts Catalog Scenarios', () => {
  const thompsonProduct = {
    ecommerceData: {
      products: [{
        name: 'Heavy Duty Alternator - 160 Amp',
        sku: 'DC66-10P',
        price: { formatted: '$349.99' },
        availability: { 
          inStock: true, 
          quantity: 8 
        },
        brand: 'Thompson eParts',
        categories: ['Electrical', 'Alternators & Generators', 'Heavy Duty'],
        attributes: {
          amperage: '160 Amps',
          voltage: '12V',
          pulley_type: 'Serpentine',
          'OEM_cross_reference': 'GM 10463443, Ford F81U-10300-FA',
          core_charge: '$75.00'
        }
      }]
    }
  };
  
  const enrichedThompson = ContentEnricher.enrichContent(
    'Professional grade alternator for heavy duty applications',
    thompsonProduct,
    'https://thompsoneparts.com/catalog/electrical/alternators/DC66-10P',
    'Heavy Duty Alternator DC66-10P'
  );
  
  assert(
    enrichedThompson.includes('SKU: DC66-10P') && enrichedThompson.includes('Part Number: DC66-10P'),
    'Should emphasize part number for auto parts search',
    'Dual SKU/Part Number reference',
    enrichedThompson.includes('Part Number:') ? 'Has dual reference' : 'Missing dual reference'
  );
  
  assert(
    enrichedThompson.includes('O E M Cross Reference: GM 10463443, Ford F81U-10300-FA'),
    'Should include OEM cross references',
    'OEM references present',
    enrichedThompson.includes('Cross Reference') ? 'Has OEM refs' : 'Missing OEM refs'
  );
  
  assert(
    enrichedThompson.includes('Core Charge: $75.00'),
    'Should include core charge for auto parts',
    'Core charge present',
    enrichedThompson.includes('Core Charge') ? 'Has core charge' : 'Missing core charge'
  );
  
  const quality = ContentEnricher.calculateEnrichmentQuality(enrichedThompson);
  assert(
    quality.enrichmentScore === 90,
    'Should achieve high quality score for complete auto parts data',
    '90',
    quality.enrichmentScore
  );
});

// Print test summary
console.log('\n' + '═'.repeat(50));
console.log(`${colors.bright}Test Summary${colors.reset}`);
console.log('─'.repeat(50));
console.log(`Total Tests: ${totalTests}`);
console.log(`${colors.green}Passed: ${passedTests}${colors.reset}`);
console.log(`${colors.red}Failed: ${failedTests}${colors.reset}`);

if (failedTests === 0) {
  console.log(`\n${colors.bright}${colors.green}✨ All tests passed successfully!${colors.reset}`);
  process.exit(0);
} else {
  console.log(`\n${colors.bright}${colors.red}❌ ${failedTests} test(s) failed${colors.reset}`);
  process.exit(1);
}