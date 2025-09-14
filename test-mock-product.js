#!/usr/bin/env node

require('dotenv').config();
const { EcommerceExtractor } = require('./lib/ecommerce-extractor');
const { ContentEnricher } = require('./lib/content-enricher');
const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');

// Initialize clients
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Mock HTML for a product page with e-commerce data
const mockProductHTML = `
<!DOCTYPE html>
<html>
<head>
    <title>Hydraulic Pump XYZ123 - Thompson's eParts</title>
    <meta name="description" content="High performance hydraulic pump for industrial applications">
    <script type="application/ld+json">
    {
        "@context": "https://schema.org/",
        "@type": "Product",
        "name": "Hydraulic Pump XYZ123",
        "sku": "XYZ123",
        "description": "High performance hydraulic pump for industrial applications",
        "brand": {
            "@type": "Brand",
            "name": "Thompson's"
        },
        "offers": {
            "@type": "Offer",
            "price": "1299.99",
            "priceCurrency": "GBP",
            "availability": "https://schema.org/InStock",
            "seller": {
                "@type": "Organization",
                "name": "Thompson's eParts"
            }
        },
        "category": "Hydraulic Pumps"
    }
    </script>
</head>
<body>
    <div class="product">
        <h1>Hydraulic Pump XYZ123</h1>
        <div class="product-info">
            <div class="sku">Part Number: XYZ123</div>
            <div class="price">£1,299.99</div>
            <div class="availability">✓ In Stock - 15 Available</div>
            <div class="brand">Brand: Thompson's</div>
        </div>
        <div class="description">
            <p>This high-performance hydraulic pump is designed for heavy-duty industrial applications. 
            Features include corrosion-resistant materials, high pressure capability up to 350 bar, 
            and reliable performance in extreme conditions.</p>
        </div>
        <div class="specifications">
            <h3>Technical Specifications</h3>
            <ul>
                <li>Max Pressure: 350 bar</li>
                <li>Flow Rate: 125 L/min</li>
                <li>Port Size: 1/2" BSP</li>
                <li>Material: Cast Iron</li>
                <li>Weight: 12.5 kg</li>
            </ul>
        </div>
        <div class="categories">
            <a href="/category/hydraulics">Hydraulics</a>
            <a href="/category/pumps">Pumps</a>
            <a href="/category/industrial-parts">Industrial Parts</a>
        </div>
    </div>
    <footer>
        <div class="contact-info">
            <p>Phone: 01254 914 750</p>
            <p>Email: sales@thompsonseparts.co.uk</p>
            <p>Address: Industrial Estate, Blackburn, Lancashire</p>
        </div>
    </footer>
</body>
</html>
`;

async function testMockProductExtraction() {
  console.log('=== Testing Mock Product Extraction ===');
  
  const url = 'https://www.thompsonseparts.co.uk/product/hydraulic-pump-xyz123/';
  
  // Extract using e-commerce extractor
  console.log('Running e-commerce extraction...');
  const extracted = await EcommerceExtractor.extractEcommerce(mockProductHTML, url);
  
  console.log('\n=== Extraction Results ===');
  console.log('Title:', extracted.title);
  console.log('Content length:', extracted.content?.length || 0);
  console.log('Word count:', extracted.wordCount);
  console.log('Platform:', extracted.platform);
  console.log('Page type:', extracted.pageType);
  console.log('Products count:', extracted.products?.length || 0);
  
  if (extracted.products?.[0]) {
    const product = extracted.products[0];
    console.log('\n=== Product Details ===');
    console.log('SKU:', product.sku);
    console.log('Name:', product.name);
    console.log('Price:', JSON.stringify(product.price));
    console.log('Availability:', JSON.stringify(product.availability));
    console.log('Categories:', product.categories);
    console.log('Brand:', product.brand);
    console.log('Attributes keys:', product.attributes ? Object.keys(product.attributes) : 'none');
  }
  
  console.log('\n=== Consolidated Metadata Check ===');
  const metadata = extracted.metadata;
  console.log('Metadata keys:', Object.keys(metadata || {}));
  
  // Check for consolidated fields
  const consolidatedFields = [
    'productSku', 'productName', 'productPrice', 'productInStock',
    'platform', 'pageType'
  ];
  
  consolidatedFields.forEach(field => {
    if (metadata[field] !== undefined) {
      console.log(`✅ ${field}:`, metadata[field]);
    } else {
      console.log(`❌ ${field}: not found`);
    }
  });
  
  // Check for duplicate fields
  console.log('\n=== Duplicate Field Check ===');
  const duplicateChecks = [
    ['productSku', 'products[0].sku'],
    ['productName', 'products[0].name'],
    ['productPrice', 'products[0].price']
  ];
  
  let duplicateFound = false;
  duplicateChecks.forEach(([field1, field2]) => {
    const val1 = metadata[field1];
    const val2 = extracted.products?.[0]?.[field2.split('.')[1]];
    
    if (val1 !== undefined && val2 !== undefined) {
      console.log(`⚠️  POTENTIAL DUPLICATE: ${field1} and ${field2}`);
      console.log(`   ${field1}:`, val1);
      console.log(`   ${field2}:`, val2);
      duplicateFound = true;
    }
  });
  
  if (!duplicateFound) {
    console.log('✅ No duplicate fields detected');
  }
  
  // Test content enrichment
  console.log('\n=== Content Enrichment Test ===');
  const originalContent = extracted.content;
  const enrichedContent = ContentEnricher.enrichContent(
    originalContent,
    metadata,
    url,
    extracted.title
  );
  
  console.log('Original length:', originalContent.length);
  console.log('Enriched length:', enrichedContent.length);
  console.log('Enrichment added:', enrichedContent.length - originalContent.length, 'characters');
  
  // Show enrichment preview (first 3 lines)
  const enrichmentLines = enrichedContent.split('\n').slice(0, 5);
  console.log('\nEnrichment preview:');
  enrichmentLines.forEach((line, index) => {
    console.log(`  ${index + 1}: ${line}`);
  });
  
  // Calculate enrichment quality
  const quality = ContentEnricher.calculateEnrichmentQuality(enrichedContent);
  console.log('\n=== Enrichment Quality Analysis ===');
  console.log('Enrichment score:', quality.enrichmentScore + '%');
  console.log('Has product data:', quality.hasProductData ? '✅' : '❌');
  console.log('Has SKU:', quality.hasSKU ? '✅' : '❌');
  console.log('Has price:', quality.hasPrice ? '✅' : '❌');
  console.log('Has availability:', quality.hasAvailability ? '✅' : '❌');
  console.log('Has business info:', quality.hasBusinessInfo ? '✅' : '❌');
  
  // Test metadata-only content
  console.log('\n=== Metadata-Only Content Test ===');
  const metadataOnlyContent = ContentEnricher.createMetadataOnlyContent(metadata);
  console.log('Metadata-only content length:', metadataOnlyContent.length);
  console.log('Metadata-only preview:', metadataOnlyContent.substring(0, 200) + '...');
  
  // Test embeddings (just one chunk for demo)
  console.log('\n=== Embedding Test ===');
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: [enrichedContent.substring(0, 1000)], // First 1000 chars
    });
    
    const embedding = response.data[0].embedding;
    console.log('✅ Embedding generated successfully');
    console.log('Embedding dimensions:', embedding.length);
    console.log('Sample values:', embedding.slice(0, 5).map(v => v.toFixed(6)));
    
  } catch (embError) {
    console.error('❌ Embedding generation failed:', embError.message);
  }
  
  return {
    extracted,
    enrichedContent,
    quality,
    metadataOnlyContent
  };
}

testMockProductExtraction()
  .then(result => {
    console.log('\n=== Test Summary ===');
    console.log('✅ Mock product extraction test completed successfully');
    console.log('Metadata fields extracted:', Object.keys(result.extracted.metadata || {}).length);
    console.log('Enrichment quality score:', result.quality.enrichmentScore + '%');
    console.log('ContentEnricher working:', result.quality.enrichmentScore > 0 ? '✅' : '❌');
  })
  .catch(error => {
    console.error('❌ Test failed:', error);
  });