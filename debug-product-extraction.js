#!/usr/bin/env node

require('dotenv').config();
const { EcommerceExtractor } = require('./lib/ecommerce-extractor');

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
    </div>
</body>
</html>
`;

async function debugExtraction() {
  console.log('=== Debug Product Extraction ===');
  
  const url = 'https://www.thompsonseparts.co.uk/product/hydraulic-pump-xyz123/';
  
  try {
    // Extract using e-commerce extractor
    const extracted = await EcommerceExtractor.extractEcommerce(mockProductHTML, url);
    
    console.log('\n=== Debug Information ===');
    console.log('Extracted object keys:', Object.keys(extracted));
    console.log('Platform:', extracted.platform);
    console.log('Page type:', extracted.pageType);
    console.log('Products array length:', extracted.products?.length || 0);
    
    if (extracted.products?.length > 0) {
      console.log('\n=== First Product Debug ===');
      const product = extracted.products[0];
      console.log('Product object:', product);
      console.log('Product keys:', Object.keys(product || {}));
      console.log('Product.sku:', product?.sku);
      console.log('Product.name:', product?.name);  
      console.log('Product.price:', product?.price);
      console.log('Product.availability:', product?.availability);
    } else {
      console.log('\n❌ No products found in array');
    }
    
    console.log('\n=== Metadata Debug ===');
    if (extracted.metadata) {
      console.log('Metadata keys:', Object.keys(extracted.metadata));
      
      const consolidatedFields = ['productSku', 'productName', 'productPrice', 'productInStock', 'productBrand'];
      consolidatedFields.forEach(field => {
        const value = extracted.metadata[field];
        console.log(`${field}:`, value, '(type:', typeof value, ')');
      });
      
      if (extracted.metadata.ecommerceData) {
        console.log('\necommerceData.products length:', extracted.metadata.ecommerceData.products?.length || 0);
        if (extracted.metadata.ecommerceData.products?.[0]) {
          console.log('ecommerceData first product:', extracted.metadata.ecommerceData.products[0]);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Extraction failed:', error);
    console.error('Error stack:', error.stack);
  }
}

debugExtraction().catch(console.error);