#!/usr/bin/env node

/**
 * Script to remove duplicate embeddings from the database
 * This identifies and removes embeddings with identical or near-identical content
 */

const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Helper function to generate hash for chunk text
function generateChunkHash(text) {
  const normalized = text
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s]/g, '')
    .trim();
  
  return crypto.createHash('sha256')
    .update(normalized)
    .digest('hex');
}

async function deduplicateEmbeddings() {
  console.log('Starting embedding deduplication process...');
  
  try {
    // Fetch all embeddings with their chunk text
    console.log('Fetching all embeddings from database...');
    const { data: embeddings, error: fetchError } = await supabase
      .from('page_embeddings')
      .select('id, page_id, chunk_text, metadata')
      .order('created_at', { ascending: true }); // Keep oldest embeddings
    
    if (fetchError) {
      console.error('Error fetching embeddings:', fetchError);
      return;
    }
    
    console.log(`Found ${embeddings.length} total embeddings`);
    
    // Group embeddings by their content hash
    const hashGroups = new Map();
    let processedCount = 0;
    
    for (const embedding of embeddings) {
      const hash = generateChunkHash(embedding.chunk_text);
      
      if (!hashGroups.has(hash)) {
        hashGroups.set(hash, []);
      }
      
      hashGroups.get(hash).push(embedding);
      
      processedCount++;
      if (processedCount % 1000 === 0) {
        console.log(`Processed ${processedCount} embeddings...`);
      }
    }
    
    console.log(`Found ${hashGroups.size} unique content hashes`);
    
    // Identify duplicates to remove
    const duplicateIds = [];
    let duplicateGroups = 0;
    
    for (const [hash, group] of hashGroups) {
      if (group.length > 1) {
        duplicateGroups++;
        
        // Keep the first embedding (oldest), mark others for deletion
        for (let i = 1; i < group.length; i++) {
          duplicateIds.push(group[i].id);
        }
        
        if (duplicateGroups <= 10) {
          console.log(`Found duplicate group with ${group.length} embeddings for content: "${group[0].chunk_text.substring(0, 50)}..."`);
        }
      }
    }
    
    console.log(`Found ${duplicateIds.length} duplicate embeddings to remove`);
    console.log(`This represents ${((duplicateIds.length / embeddings.length) * 100).toFixed(2)}% of all embeddings`);
    
    if (duplicateIds.length === 0) {
      console.log('No duplicates found. Database is already clean!');
      return;
    }
    
    // Estimate cost savings
    const estimatedSavings = (duplicateIds.length * 0.00002).toFixed(4);
    console.log(`Estimated future API cost savings: $${estimatedSavings} per re-scrape`);
    
    // Ask for confirmation
    console.log('\nWARNING: This will permanently delete duplicate embeddings from the database.');
    console.log('It is recommended to backup your database before proceeding.');
    console.log('Press Ctrl+C to cancel, or wait 10 seconds to continue...');
    
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Delete duplicates in batches
    console.log('\nDeleting duplicate embeddings...');
    const batchSize = 100;
    let deletedCount = 0;
    
    for (let i = 0; i < duplicateIds.length; i += batchSize) {
      const batch = duplicateIds.slice(i, i + batchSize);
      
      const { error: deleteError } = await supabase
        .from('page_embeddings')
        .delete()
        .in('id', batch);
      
      if (deleteError) {
        console.error('Error deleting batch:', deleteError);
        continue;
      }
      
      deletedCount += batch.length;
      console.log(`Deleted ${deletedCount}/${duplicateIds.length} embeddings...`);
    }
    
    console.log('\nDeduplication complete!');
    console.log(`Successfully removed ${deletedCount} duplicate embeddings`);
    console.log(`Database now has approximately ${embeddings.length - deletedCount} unique embeddings`);
    
    // Analyze common duplicate patterns
    console.log('\nAnalyzing duplicate patterns...');
    const patternAnalysis = new Map();
    
    for (const [hash, group] of hashGroups) {
      if (group.length > 1) {
        const content = group[0].chunk_text.toLowerCase();
        
        // Identify common patterns
        if (content.includes('cookie') || content.includes('privacy')) {
          patternAnalysis.set('Cookie/Privacy notices', (patternAnalysis.get('Cookie/Privacy notices') || 0) + group.length - 1);
        } else if (content.includes('navigation') || content.includes('menu')) {
          patternAnalysis.set('Navigation menus', (patternAnalysis.get('Navigation menus') || 0) + group.length - 1);
        } else if (content.includes('footer') || content.includes('copyright')) {
          patternAnalysis.set('Footer content', (patternAnalysis.get('Footer content') || 0) + group.length - 1);
        } else if (content.includes('subscribe') || content.includes('newsletter')) {
          patternAnalysis.set('Newsletter signups', (patternAnalysis.get('Newsletter signups') || 0) + group.length - 1);
        } else {
          patternAnalysis.set('Other content', (patternAnalysis.get('Other content') || 0) + group.length - 1);
        }
      }
    }
    
    console.log('\nDuplicate content categories:');
    for (const [category, count] of patternAnalysis) {
      console.log(`  - ${category}: ${count} duplicates`);
    }
    
  } catch (error) {
    console.error('Fatal error during deduplication:', error);
    process.exit(1);
  }
}

// Check environment variables
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: Missing required environment variables');
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Run the deduplication
deduplicateEmbeddings()
  .then(() => {
    console.log('\nDeduplication script completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('Deduplication script failed:', error);
    process.exit(1);
  });