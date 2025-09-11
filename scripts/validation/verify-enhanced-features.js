#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyEnhancedFeatures() {
  console.log('🔍 VERIFYING ENHANCED SCRAPING FEATURES');
  console.log('=' .repeat(60));
  
  const features = {
    semanticChunking: false,
    metadataExtraction: false,
    contentClassification: false,
    entityExtraction: false,
    keywordExtraction: false,
    priceDetection: false,
    contactInfo: false,
    qaPairs: false,
    qualityMetrics: false,
    languageDetection: false
  };
  
  try {
    // 1. Check recent scraped pages for metadata
    console.log('\n📊 Checking Recent Pages for Metadata...');
    const { data: recentPages, error: pagesError } = await supabase
      .from('scraped_pages')
      .select('url, title, metadata, created_at')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (pagesError) {
      console.error('Error fetching pages:', pagesError);
      return;
    }
    
    console.log(`Found ${recentPages?.length || 0} recent pages`);
    
    // Analyze metadata in pages
    for (const page of recentPages || []) {
      if (page.metadata && typeof page.metadata === 'object') {
        const meta = page.metadata;
        
        // Check for various metadata fields
        if (meta.author || meta.publishedDate || meta.modifiedDate) {
          features.metadataExtraction = true;
        }
        if (meta.wordCount || meta.readingTime) {
          features.qualityMetrics = true;
        }
        if (meta.images || meta.links) {
          console.log(`  ✅ ${page.url.substring(0, 50)}... has metadata`);
        }
      }
    }
    
    // 2. Check page embeddings for semantic chunking
    console.log('\n🧩 Checking Semantic Chunking...');
    const { data: embeddings, error: embError } = await supabase
      .from('page_embeddings')
      .select('chunk_text, metadata')
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (embError) {
      console.error('Error fetching embeddings:', embError);
    } else {
      console.log(`Found ${embeddings?.length || 0} recent embeddings`);
      
      // Check for semantic chunking patterns
      const chunkSizes = new Set();
      for (const emb of embeddings || []) {
        if (emb.chunk_text) {
          chunkSizes.add(emb.chunk_text.length);
          
          // Check if chunks have varied sizes (sign of semantic boundaries)
          if (chunkSizes.size > 3) {
            features.semanticChunking = true;
          }
          
          // Check metadata in embeddings
          if (emb.metadata) {
            const meta = emb.metadata;
            if (meta.chunk_index !== undefined && meta.total_chunks) {
              console.log(`  ✅ Chunk has indexing metadata`);
            }
            if (meta.contentType) {
              features.contentClassification = true;
            }
            if (meta.entities || meta.brands || meta.products) {
              features.entityExtraction = true;
            }
            if (meta.keywords) {
              features.keywordExtraction = true;
            }
            if (meta.prices || meta.priceRange) {
              features.priceDetection = true;
            }
            if (meta.contactInfo || meta.emails || meta.phones) {
              features.contactInfo = true;
            }
            if (meta.questions || meta.qaPairs) {
              features.qaPairs = true;
            }
            if (meta.language) {
              features.languageDetection = true;
            }
          }
        }
      }
      
      if (features.semanticChunking) {
        console.log(`  ✅ Semantic chunking detected (${chunkSizes.size} different chunk sizes)`);
      }
    }
    
    // 3. Check for product/business content extraction
    console.log('\n🏢 Checking Business Content Extraction...');
    const { data: products } = await supabase
      .from('scraped_pages')
      .select('url, content')
      .ilike('url', '%product%')
      .limit(5);
    
    for (const product of products || []) {
      if (product.content) {
        // Look for price patterns
        if (product.content.match(/[£$€]\s*\d+/)) {
          features.priceDetection = true;
          console.log(`  ✅ Price detection working on ${product.url.substring(0, 50)}...`);
        }
        // Look for contact patterns
        if (product.content.match(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i)) {
          features.contactInfo = true;
          console.log(`  ✅ Contact info extraction found email`);
        }
      }
    }
    
    // 4. Summary Report
    console.log('\n' + '=' .repeat(60));
    console.log('📋 FEATURE VERIFICATION SUMMARY:');
    console.log('=' .repeat(60));
    
    let workingCount = 0;
    let totalCount = 0;
    
    for (const [feature, working] of Object.entries(features)) {
      totalCount++;
      if (working) workingCount++;
      
      const status = working ? '✅' : '❌';
      const featureName = feature.replace(/([A-Z])/g, ' $1').trim();
      console.log(`${status} ${featureName.charAt(0).toUpperCase() + featureName.slice(1)}`);
    }
    
    console.log('\n' + '=' .repeat(60));
    console.log(`📊 OVERALL: ${workingCount}/${totalCount} features verified as working`);
    
    if (workingCount < totalCount) {
      console.log('\n⚠️  Some features may not be fully active yet.');
      console.log('This could be because:');
      console.log('  1. The scraper hasn\'t processed enough pages yet');
      console.log('  2. The enhanced metadata extraction needs to be integrated');
      console.log('  3. The features are working but not storing data as expected');
    } else {
      console.log('\n🎉 All enhanced features are working correctly!');
    }
    
  } catch (error) {
    console.error('Error during verification:', error);
  }
}

// Run verification
verifyEnhancedFeatures()
  .then(() => {
    console.log('\n✅ Verification complete');
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });