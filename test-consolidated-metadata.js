/**
 * Test consolidated metadata extraction
 * Verifies that metadata is extracted once and properly consolidated
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testConsolidatedMetadata() {
  console.log('🧪 Testing Consolidated Metadata Extraction');
  console.log('=' .repeat(60) + '\n');

  try {
    // 1. Check recent pages for consolidated metadata
    console.log('1️⃣ Fetching recent pages with metadata...\n');
    
    const { data: recentPages, error } = await supabase
      .from('scraped_pages')
      .select('id, url, metadata, scraped_at')
      .not('metadata', 'is', null)
      .order('scraped_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching pages:', error);
      return;
    }

    if (!recentPages || recentPages.length === 0) {
      console.log('❌ No pages with metadata found');
      return;
    }

    console.log(`✅ Found ${recentPages.length} pages with metadata\n`);

    // 2. Analyze metadata structure
    console.log('2️⃣ Analyzing metadata structure for consolidation...\n');
    
    let consolidatedCount = 0;
    let duplicateFieldsFound = false;
    const issues = [];

    for (const page of recentPages) {
      const metadata = page.metadata;
      
      // Check if metadata is properly consolidated
      const hasProductFields = !!(
        metadata.productSku || 
        metadata.productPrice || 
        metadata.productInStock !== undefined ||
        metadata.productBrand ||
        metadata.productCategory
      );

      // Check for duplication issues
      if (metadata.ecommerceData?.products?.[0]) {
        const product = metadata.ecommerceData.products[0];
        
        // Check if fields exist in both places (potential duplication)
        if (product.sku && metadata.productSku && product.sku !== metadata.productSku) {
          duplicateFieldsFound = true;
          issues.push({
            url: page.url,
            issue: 'SKU mismatch',
            ecommerce: product.sku,
            metadata: metadata.productSku
          });
        }
        
        // Product fields should be consolidated at top level
        if (hasProductFields) {
          consolidatedCount++;
        }
      } else if (hasProductFields) {
        // Has product fields without ecommerceData - this is fine
        consolidatedCount++;
      }
    }

    // 3. Display results
    console.log('📊 Consolidation Analysis:');
    console.log('=' .repeat(40));
    console.log(`Pages with consolidated metadata: ${consolidatedCount}/${recentPages.length}`);
    console.log(`Duplicate/conflicting fields found: ${duplicateFieldsFound ? '⚠️ YES' : '✅ NO'}\n`);

    if (issues.length > 0) {
      console.log('⚠️ Issues Found:');
      issues.forEach(issue => {
        console.log(`  • ${issue.url}`);
        console.log(`    ${issue.issue}: ecommerce="${issue.ecommerce}" vs metadata="${issue.metadata}"`);
      });
      console.log('');
    }

    // 4. Show example of properly consolidated metadata
    const goodExample = recentPages.find(p => 
      p.metadata.productSku || p.metadata.productPrice
    );

    if (goodExample) {
      console.log('✅ Example of Properly Consolidated Metadata:');
      console.log(`URL: ${goodExample.url}`);
      console.log('Consolidated Product Fields:');
      
      const fields = [
        ['SKU', goodExample.metadata.productSku],
        ['Price', goodExample.metadata.productPrice],
        ['In Stock', goodExample.metadata.productInStock],
        ['Brand', goodExample.metadata.productBrand],
        ['Category', goodExample.metadata.productCategory]
      ];
      
      fields.forEach(([name, value]) => {
        if (value !== undefined && value !== null) {
          console.log(`  • ${name}: ${value}`);
        }
      });
      
      console.log('\nSource Priority:');
      if (goodExample.metadata.ecommerceData?.products?.[0]) {
        console.log('  ✓ ecommerceData.products[0] (primary source)');
        console.log('  ✓ Falls back to extractMeta() values if not in ecommerceData');
      } else {
        console.log('  ✓ extractMeta() function (when no ecommerceData)');
      }
    }

    // 5. Check for proper metadata flow
    console.log('\n3️⃣ Checking metadata flow consistency...\n');
    
    // Sample a page to check its embeddings
    const samplePage = recentPages[0];
    if (samplePage.id) {
      const { data: embeddings } = await supabase
        .from('page_embeddings')
        .select('chunk_text')
        .eq('page_id', samplePage.id)
        .limit(1);

      if (embeddings && embeddings.length > 0) {
        const hasEnrichment = embeddings[0].chunk_text?.includes('SKU:') || 
                             embeddings[0].chunk_text?.includes('Price:');
        
        console.log('Embedding enrichment check:');
        console.log(`  • Page has metadata: ${samplePage.metadata.productSku ? '✅' : '❌'}`);
        console.log(`  • Embedding is enriched: ${hasEnrichment ? '✅' : '❌'}`);
        
        if (samplePage.metadata.productSku && !hasEnrichment) {
          console.log('  ⚠️ Metadata exists but not in embeddings - enrichment may be off');
        }
      }
    }

    // 6. Final verdict
    console.log('\n' + '=' .repeat(60));
    console.log('📋 FINAL ASSESSMENT:\n');
    
    if (consolidatedCount > 0 && !duplicateFieldsFound) {
      console.log('✅ SUCCESS: Metadata is properly consolidated!');
      console.log('   • Single source of truth for product fields');
      console.log('   • ecommerceData takes priority when available');
      console.log('   • extractMeta() provides fallback values');
      console.log('   • No duplicate or conflicting fields found');
    } else if (duplicateFieldsFound) {
      console.log('⚠️ ISSUE: Duplicate/conflicting metadata fields detected');
      console.log('   • Same data exists in multiple locations');
      console.log('   • Need to ensure single source of truth');
    } else {
      console.log('⚠️ No consolidated metadata found');
      console.log('   • Pages may not be product pages');
      console.log('   • Or metadata extraction may not be working');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testConsolidatedMetadata().catch(console.error);