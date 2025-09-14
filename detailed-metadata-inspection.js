#!/usr/bin/env node

/**
 * Detailed Metadata Inspection
 * Deep dive into specific metadata structures to understand issues
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function inspectMetadata() {
  console.log('\n' + '='.repeat(80));
  console.log('   DETAILED METADATA INSPECTION');
  console.log('='.repeat(80) + '\n');

  try {
    // 1. Get the most recent 5 pages with metadata to inspect structure
    console.log('🔍 Inspecting Recent Pages with Metadata...\n');
    
    const { data: recentPages, error } = await supabase
      .from('scraped_pages')
      .select(`
        id, 
        url, 
        title, 
        metadata,
        created_at,
        domains!scraped_pages_domain_id_fkey(domain)
      `)
      .not('metadata', 'is', null)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      throw new Error(`Database query failed: ${error.message}`);
    }

    if (!recentPages || recentPages.length === 0) {
      console.log('❌ No pages with metadata found');
      return;
    }

    console.log(`Found ${recentPages.length} recent pages with metadata:\n`);

    for (let i = 0; i < recentPages.length; i++) {
      const page = recentPages[i];
      const domain = page.domains?.domain || 'Unknown';
      
      console.log(`${i + 1}. ${domain} - ${page.url}`);
      console.log(`   Created: ${page.created_at}`);
      console.log(`   Title: ${page.title || 'No title'}`);
      
      if (page.metadata) {
        console.log('   Metadata Structure:');
        
        // Show top-level keys
        const topLevelKeys = Object.keys(page.metadata);
        console.log(`     Top-level keys: ${topLevelKeys.join(', ')}`);
        
        // Check for consolidated product fields
        const productFields = [
          'productSku', 'productPrice', 'productInStock', 
          'productBrand', 'productCategory'
        ];
        
        console.log('     Consolidated Product Fields:');
        productFields.forEach(field => {
          const value = page.metadata[field];
          if (value !== undefined && value !== null) {
            console.log(`       ✅ ${field}: ${JSON.stringify(value)}`);
          } else {
            console.log(`       ❌ ${field}: Missing`);
          }
        });
        
        // Check ecommerceData structure
        if (page.metadata.ecommerceData) {
          console.log('     ecommerceData Structure:');
          const ecomData = page.metadata.ecommerceData;
          console.log(`       Has products: ${ecomData.products ? 'Yes' : 'No'}`);
          
          if (ecomData.products && ecomData.products.length > 0) {
            const product = ecomData.products[0];
            console.log(`       First product keys: ${Object.keys(product).join(', ')}`);
            console.log(`       Product data: ${JSON.stringify(product, null, 8)}`);
          }
        }
        
        // Check extractMeta structure
        if (page.metadata.extractMeta) {
          console.log('     extractMeta Structure:');
          console.log(`       Keys: ${Object.keys(page.metadata.extractMeta).join(', ')}`);
        }
        
        // Check for legacy fields
        const legacyFields = ['sku', 'price', 'inStock', 'brand', 'category'];
        const foundLegacy = legacyFields.filter(field => 
          page.metadata[field] !== undefined && page.metadata[field] !== null
        );
        
        if (foundLegacy.length > 0) {
          console.log(`     ⚠️ Legacy fields found: ${foundLegacy.join(', ')}`);
        }
      }
      
      console.log('   ' + '─'.repeat(60) + '\n');
    }

    // 2. Check page_embeddings for these pages
    console.log('📊 Checking Embedding Status...\n');
    
    for (const page of recentPages) {
      const { data: embeddings, error: embError } = await supabase
        .from('page_embeddings')
        .select('id, chunk_text, metadata_embedding')
        .eq('page_id', page.id);
      
      if (!embError && embeddings) {
        console.log(`${page.url}:`);
        console.log(`   Embeddings count: ${embeddings.length}`);
        
        if (embeddings.length > 0) {
          const firstEmbedding = embeddings[0];
          const chunkPreview = firstEmbedding.chunk_text ? 
            firstEmbedding.chunk_text.substring(0, 200) + '...' : 
            'No chunk text';
          
          console.log(`   Chunk preview: ${chunkPreview}`);
          console.log(`   Has metadata embedding: ${firstEmbedding.metadata_embedding ? 'Yes' : 'No'}`);
          
          // Check if chunk contains enriched metadata
          const hasEnrichment = firstEmbedding.chunk_text?.includes('SKU:') || 
                               firstEmbedding.chunk_text?.includes('Price:') ||
                               firstEmbedding.chunk_text?.includes('Brand:');
          console.log(`   Contains enrichment: ${hasEnrichment ? 'Yes' : 'No'}`);
        } else {
          console.log('   ❌ No embeddings found for this page');
        }
        console.log('');
      }
    }

    // 3. Check for any metadata_embeddings specifically
    console.log('🔗 Checking Metadata Embeddings Table...\n');
    
    const { data: metadataEmbeddings, error: metaError } = await supabase
      .from('page_embeddings')
      .select('id, page_id, metadata_embedding')
      .not('metadata_embedding', 'is', null)
      .limit(5);
    
    if (!metaError && metadataEmbeddings) {
      console.log(`Found ${metadataEmbeddings.length} pages with metadata embeddings`);
      
      if (metadataEmbeddings.length > 0) {
        console.log('Sample metadata embeddings:');
        for (const embedding of metadataEmbeddings) {
          console.log(`   Page ID: ${embedding.page_id}`);
          console.log(`   Metadata embedding dimensions: ${embedding.metadata_embedding ? 'Present' : 'Missing'}`);
        }
      }
    } else if (metaError) {
      console.log(`Error checking metadata embeddings: ${metaError.message}`);
    } else {
      console.log('❌ No metadata embeddings found in database');
    }

    // 4. Summary of issues found
    console.log('\n' + '='.repeat(80));
    console.log('   ISSUE SUMMARY');
    console.log('='.repeat(80) + '\n');
    
    const issues = [];
    let consolidatedCount = 0;
    let embedCount = 0;
    
    for (const page of recentPages) {
      // Check consolidation
      const hasConsolidated = !!(
        page.metadata.productSku || 
        page.metadata.productPrice || 
        page.metadata.productBrand
      );
      
      if (hasConsolidated) consolidatedCount++;
      
      // Check for issues
      if (page.metadata.ecommerceData?.products?.[0]) {
        const product = page.metadata.ecommerceData.products[0];
        if (typeof product.price === 'object') {
          issues.push(`Price object issue in ${page.url}`);
        }
      }
      
      // Check embeddings (this would need to be checked separately)
    }
    
    console.log(`📊 Statistics:`);
    console.log(`   Pages analyzed: ${recentPages.length}`);
    console.log(`   Properly consolidated: ${consolidatedCount}`);
    console.log(`   Consolidation rate: ${Math.round((consolidatedCount / recentPages.length) * 100)}%`);
    
    if (issues.length > 0) {
      console.log('\n⚠️ Issues Found:');
      issues.forEach(issue => console.log(`   • ${issue}`));
    } else {
      console.log('\n✅ No major structural issues detected in sample');
    }

  } catch (error) {
    console.error('❌ Inspection failed:', error.message);
    console.error(error);
  }
}

// Run the inspection
inspectMetadata().catch(console.error);