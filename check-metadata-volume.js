/**
 * Check how much metadata is being saved per page
 * Analyzes size, fields, and completeness
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function analyzeMetadataVolume() {
  console.log('📊 Analyzing Metadata Volume and Content');
  console.log('=' .repeat(60) + '\n');

  try {
    // 1. Get recent scraped pages from Thompson's
    console.log('1️⃣ Fetching recent Thompson\'s eParts pages...\n');
    
    const { data: pages, error } = await supabase
      .from('scraped_pages')
      .select('url, metadata, scraped_at')
      .like('url', '%thompsonseparts.co.uk%')
      .order('scraped_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error:', error);
      return;
    }

    if (!pages || pages.length === 0) {
      console.log('No pages found');
      return;
    }

    console.log(`Found ${pages.length} recent pages\n`);

    // 2. Analyze metadata size and content
    console.log('2️⃣ Metadata Analysis:\n');
    
    let totalSize = 0;
    let totalFields = 0;
    const fieldCounts = {};
    const metadataSizes = [];
    const examples = [];

    pages.forEach(page => {
      if (page.metadata) {
        // Calculate size
        const metadataJson = JSON.stringify(page.metadata);
        const sizeInBytes = new TextEncoder().encode(metadataJson).length;
        metadataSizes.push(sizeInBytes);
        totalSize += sizeInBytes;
        
        // Count fields
        const fields = Object.keys(page.metadata);
        totalFields += fields.length;
        
        // Track which fields appear
        fields.forEach(field => {
          fieldCounts[field] = (fieldCounts[field] || 0) + 1;
        });
        
        // Collect examples
        if (page.metadata.productSku || page.metadata.productPrice) {
          examples.push({
            url: page.url,
            metadata: page.metadata,
            size: sizeInBytes
          });
        }
      }
    });

    // 3. Display statistics
    console.log('📈 Size Statistics:');
    console.log('=' .repeat(40));
    console.log(`Total metadata size: ${(totalSize / 1024).toFixed(2)} KB`);
    console.log(`Average size per page: ${(totalSize / pages.length / 1024).toFixed(2)} KB`);
    console.log(`Min size: ${Math.min(...metadataSizes)} bytes`);
    console.log(`Max size: ${Math.max(...metadataSizes)} bytes`);
    console.log(`Average fields per page: ${(totalFields / pages.length).toFixed(1)}`);
    
    // 4. Field frequency
    console.log('\n📋 Field Frequency (top fields):');
    console.log('=' .repeat(40));
    Object.entries(fieldCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .forEach(([field, count]) => {
        const percentage = (count / pages.length * 100).toFixed(1);
        console.log(`  ${field}: ${count}/${pages.length} (${percentage}%)`);
      });

    // 5. Product metadata coverage
    console.log('\n🛍️ Product Metadata Coverage:');
    console.log('=' .repeat(40));
    const productFields = ['productSku', 'productPrice', 'productInStock', 'productBrand', 'productCategory'];
    productFields.forEach(field => {
      const count = fieldCounts[field] || 0;
      const percentage = (count / pages.length * 100).toFixed(1);
      const bar = '█'.repeat(Math.floor(count / pages.length * 20));
      console.log(`  ${field.padEnd(15)} ${bar} ${percentage}%`);
    });

    // 6. Example of full metadata
    if (examples.length > 0) {
      console.log('\n📦 Example Metadata (Product Page):');
      console.log('=' .repeat(40));
      const example = examples[0];
      console.log(`URL: ${example.url}`);
      console.log(`Size: ${(example.size / 1024).toFixed(2)} KB`);
      console.log('\nMetadata Fields:');
      
      // Group fields by type
      const productData = {};
      const businessData = {};
      const structuredData = {};
      const otherData = {};
      
      Object.entries(example.metadata).forEach(([key, value]) => {
        if (key.startsWith('product')) {
          productData[key] = value;
        } else if (key === 'businessInfo' || key === 'contact') {
          businessData[key] = value;
        } else if (key === 'ecommerceData' || key === '@context' || key === '@type') {
          structuredData[key] = value;
        } else {
          otherData[key] = value;
        }
      });
      
      if (Object.keys(productData).length > 0) {
        console.log('\n  🛍️ Product Data:');
        Object.entries(productData).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            const displayValue = typeof value === 'object' ? 
              JSON.stringify(value).substring(0, 100) : 
              String(value).substring(0, 100);
            console.log(`    • ${key}: ${displayValue}`);
          }
        });
      }
      
      if (Object.keys(businessData).length > 0) {
        console.log('\n  🏢 Business Data:');
        Object.entries(businessData).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            const displayValue = typeof value === 'object' ? 
              `[Object with ${Object.keys(value).length} fields]` : 
              String(value).substring(0, 100);
            console.log(`    • ${key}: ${displayValue}`);
          }
        });
      }
      
      if (Object.keys(structuredData).length > 0) {
        console.log('\n  📊 Structured/E-commerce Data:');
        Object.entries(structuredData).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (key === 'ecommerceData' && value.products) {
              console.log(`    • ${key}: ${value.products.length} products extracted`);
            } else {
              const displayValue = typeof value === 'object' ? 
                `[Object with ${Object.keys(value).length} fields]` : 
                String(value).substring(0, 100);
              console.log(`    • ${key}: ${displayValue}`);
            }
          }
        });
      }
      
      if (Object.keys(otherData).length > 0) {
        console.log('\n  📝 Other Metadata:');
        Object.entries(otherData).slice(0, 10).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            const displayValue = typeof value === 'object' ? 
              `[Object]` : 
              String(value).substring(0, 50);
            console.log(`    • ${key}: ${displayValue}`);
          }
        });
      }
    }

    // 7. Summary
    console.log('\n📊 SUMMARY:');
    console.log('=' .repeat(60));
    
    const avgSizeKB = (totalSize / pages.length / 1024).toFixed(2);
    if (avgSizeKB > 5) {
      console.log(`✅ Rich metadata: Average ${avgSizeKB} KB per page`);
      console.log('   This includes product data, structured data, and business info');
    } else if (avgSizeKB > 1) {
      console.log(`✅ Good metadata: Average ${avgSizeKB} KB per page`);
      console.log('   Sufficient for search and product display');
    } else {
      console.log(`⚠️ Light metadata: Average ${avgSizeKB} KB per page`);
      console.log('   Consider extracting more structured data');
    }
    
    const productCoverage = ((fieldCounts['productSku'] || 0) / pages.length * 100).toFixed(1);
    console.log(`\n📈 Product metadata on ${productCoverage}% of pages`);
    
    if (fieldCounts['ecommerceData']) {
      console.log(`✅ E-commerce extraction active on ${fieldCounts['ecommerceData']} pages`);
    }
    
    if (fieldCounts['businessInfo']) {
      console.log(`✅ Business info extracted on ${fieldCounts['businessInfo']} pages`);
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

// Run analysis
analyzeMetadataVolume().catch(console.error);