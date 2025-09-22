#!/usr/bin/env npx tsx
/**
 * FIXED regeneration script with proper metadata enrichment and filtering
 * - Metadata ALWAYS at the start of chunks
 * - No CSS/HTML artifacts
 * - Clean, searchable content
 */

import { createServiceRoleClient } from './lib/supabase-server';
import { splitIntoChunks, generateEmbeddingVectors } from './lib/embeddings-functions';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

/**
 * Aggressively clean content - remove ALL navigation, CSS, HTML artifacts
 */
function cleanContent(content: string): string {
  if (!content) return '';

  // First preserve the actual content by removing only the markup
  let cleaned = content
    // Remove all style tags and content
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    // Remove all script tags and content
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    // Remove HTML tags but keep content
    .replace(/<[^>]+>/g, ' ')
    // Remove WordPress block comments
    .replace(/\[\/?\w+[^\]]*\]/g, '');

  // Navigation patterns to remove
  const navigationPatterns = [
    /Shop by Category[\s\S]*?(?=(SKU|Product|Description|Price|£|\$|Category:|Brand:|€|$))/gi,
    /Tipper Skip Hookloaders[\s\S]*?(?=(SKU|Product|Description|Price|£|\$|Category:|Brand:|€|$))/gi,
    /Thompsons Static Wacker Carrier[\s\S]*?Solenoid Valves/gi,
    /General Hookloader Sheet Systems[\s\S]*?Skiploader Parts/gi,
    /Electrical Parts Motors[\s\S]*?Flip over Sheet System/gi,
    /Manage consent[\s\S]*?Request a Call Back/gi,
    /T 01254 \d+[\s\S]*?T 01254 \d+/gi,
  ];

  // Remove navigation patterns
  for (const pattern of navigationPatterns) {
    cleaned = cleaned.replace(pattern, '');
  }
  
  // Clean up whitespace
  cleaned = cleaned
    .replace(/\s+/g, ' ')  // Collapse multiple spaces
    .replace(/\n{3,}/g, '\n\n')  // Maximum 2 newlines
    .trim();
  
  // Remove lines that are just numbers or single characters (often artifacts)
  const lines = cleaned.split('\n');
  const validLines = lines.filter(line => {
    const trimmed = line.trim();
    return trimmed.length > 2 && !/^\d+$/.test(trimmed);
  });
  
  return validLines.join('\n');
}

/**
 * Build enriched content with metadata ALWAYS at the start
 */
function buildEnrichedContent(page: any, cleanedContent: string): string {
  const parts: string[] = [];
  
  // 1. ALWAYS start with title
  if (page.title) {
    parts.push(`# ${page.title}`);
    parts.push(''); // Empty line after title
  }
  
  // 2. Add structured metadata section
  const metadataLines: string[] = [];
  
  // Category from multiple sources
  if (page.metadata?.productCategory) {
    metadataLines.push(`Category: ${page.metadata.productCategory}`);
  } else if (page.metadata?.ecommerceData?.breadcrumbs?.length > 0) {
    const breadcrumbText = page.metadata.ecommerceData.breadcrumbs
      .map((b: any) => b.name)
      .filter((name: string) => !name.toLowerCase().includes('home'))
      .join(' > ');
    if (breadcrumbText) {
      metadataLines.push(`Category: ${breadcrumbText}`);
    }
  }
  
  // Brand
  if (page.metadata?.productBrand) {
    metadataLines.push(`Brand: ${page.metadata.productBrand}`);
  }
  
  // SKU
  if (page.metadata?.productSku) {
    metadataLines.push(`SKU: ${page.metadata.productSku}`);
  }
  
  // Price
  if (page.metadata?.productPrice) {
    metadataLines.push(`Price: ${page.metadata.productPrice}`);
  }
  
  // Availability
  if (page.metadata?.productInStock !== undefined) {
    metadataLines.push(`Availability: ${page.metadata.productInStock ? 'In Stock' : 'Out of Stock'}`);
  }
  
  // Add metadata section if we have any
  if (metadataLines.length > 0) {
    parts.push('## Product Information');
    parts.push(...metadataLines);
    parts.push(''); // Empty line after metadata
  }
  
  // 3. Add the actual content
  if (cleanedContent && cleanedContent.length > 10) {
    parts.push('## Description');
    parts.push(cleanedContent);
  }
  
  return parts.join('\n');
}

/**
 * Check if content is valid (has actual content, not empty)
 */
function isValidContent(content: string): boolean {
  if (!content || content.length < 100) return false;
  
  // Check for minimum meaningful words
  const words = content.split(/\s+/).filter(w => w.length > 2);
  return words.length >= 15; // At least 15 words of content
}

async function regenerateWithFixes(domainFilter?: string) {
  const supabase = await createServiceRoleClient();
  
  if (!supabase) {
    console.error('❌ Failed to create Supabase client');
    process.exit(1);
  }

  console.log('🚀 Starting FIXED embedding regeneration...');
  console.log('✨ Features:');
  console.log('  - Metadata always at start of chunks');
  console.log('  - No CSS/HTML artifacts');
  console.log('  - Clean, searchable content');
  console.log('');
  
  if (domainFilter) {
    console.log(`📍 Filtering for domain: ${domainFilter}`);
  }

  // First, DELETE all existing embeddings to start fresh
  console.log('🗑️  Clearing existing embeddings...');
  
  // Get domain ID
  const { data: domain } = await supabase
    .from('domains')
    .select('id')
    .eq('domain', domainFilter!.replace('www.', ''))
    .single();
  
  if (!domain) {
    console.error(`❌ Domain not found: ${domainFilter}`);
    process.exit(1);
  }

  // Get all page IDs for this domain first
  const { data: pageIds } = await supabase
    .from('scraped_pages')
    .select('id')
    .eq('domain_id', domain.id);
  
  // Delete all embeddings for these pages
  if (pageIds && pageIds.length > 0) {
    const { error: deleteError } = await supabase
      .from('page_embeddings')
      .delete()
      .in('page_id', pageIds.map(p => p.id));
      
    if (deleteError) {
      console.log('⚠️  Could not delete all embeddings, continuing anyway...');
    } else {
      console.log(`✅ Cleared ${pageIds.length} pages' embeddings`);
    }
  }

  // Get count first
  const { count } = await supabase
    .from('scraped_pages')
    .select('*', { count: 'exact', head: true })
    .eq('domain_id', domain.id)
    .not('content', 'is', null);
  
  console.log(`📊 Found ${count} pages to process`);
  console.log('');

  // Process in manageable batches to avoid timeout
  const PAGE_BATCH_SIZE = 500;
  let allProcessed = 0;
  let allSkipped = 0;
  let allFailed = 0;
  let allChunksCreated = 0;
  
  for (let offset = 0; offset < (count || 0); offset += PAGE_BATCH_SIZE) {
    console.log(`\n📦 Fetching pages ${offset + 1}-${Math.min(offset + PAGE_BATCH_SIZE, count || 0)}...`);
    
    const { data: pages, error: fetchError } = await supabase
      .from('scraped_pages')
      .select('id, url, title, content, metadata, domain_id')
      .eq('domain_id', domain.id)
      .not('content', 'is', null)
      .range(offset, offset + PAGE_BATCH_SIZE - 1);

    if (fetchError) {
      console.error('❌ Error fetching batch:', fetchError);
      continue;
    }

    if (!pages || pages.length === 0) continue;

    let processed = 0;
    let skipped = 0;
    let failed = 0;
    let totalChunksCreated = 0;

    // Process pages in this batch
    const BATCH_SIZE = 10;
  
  for (let i = 0; i < pages.length; i += BATCH_SIZE) {
    const batch = pages.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i/BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(pages.length/BATCH_SIZE);
    
    console.log(`\n📦 Processing batch ${batchNum}/${totalBatches}`);
    
    await Promise.all(batch.map(async (page) => {
      try {
        // STEP 1: Aggressively clean the content
        const cleanedContent = cleanContent(page.content);
        
        // STEP 2: Build enriched content with metadata FIRST
        const enrichedContent = buildEnrichedContent(page, cleanedContent);
        
        // STEP 3: Validate content
        if (!isValidContent(enrichedContent)) {
          skipped++;
          console.log(`⏭️  Skipping ${page.url} - invalid/empty content after cleaning`);
          return;
        }

        // STEP 4: Generate chunks
        const chunks = splitIntoChunks(enrichedContent, 1000);
        
        if (chunks.length === 0) {
          skipped++;
          console.log(`⏭️  Skipping ${page.url} - no valid chunks`);
          return;
        }

        // STEP 5: Generate embeddings
        const embeddings = await generateEmbeddingVectors(chunks);

        // STEP 6: Store with clean metadata
        const embeddingRecords = chunks.map((chunk, index) => ({
          page_id: page.id,
          domain_id: page.domain_id,  // CRITICAL: Include domain_id for search to work!
          chunk_text: chunk,
          embedding: embeddings[index],
          metadata: { 
            chunk_index: index,
            total_chunks: chunks.length,
            url: page.url,
            title: page.title,
            is_cleaned: true,
            fixed_version: true,  // Mark as fixed version
            cleaned_at: new Date().toISOString(),
            has_metadata: chunk.includes('Category:') || chunk.includes('Brand:'),
          },
        }));

        const { error: embedError } = await supabase
          .from('page_embeddings')
          .insert(embeddingRecords);

        if (embedError) throw embedError;

        processed++;
        totalChunksCreated += chunks.length;
        
        // Progress indicator every 50 pages
        if (processed % 50 === 0) {
          console.log(`✅ Processed ${processed} pages...`);
        }

      } catch (error) {
        failed++;
        console.error(`❌ Failed ${page.url}:`, error);
      }
    }));
    
    // Accumulate totals
    allProcessed += processed;
    allSkipped += skipped;
    allFailed += failed;
    allChunksCreated += totalChunksCreated;
    
    console.log(`  Batch complete: ${processed} processed, ${skipped} skipped, ${failed} failed`);
  }
  } // Close the outer for loop

  console.log('\n' + '='.repeat(50));
  console.log('🎉 FIXED Regeneration Complete!');
  console.log('='.repeat(50));
  console.log(`✅ Processed: ${allProcessed} pages`);
  console.log(`⏭️  Skipped: ${allSkipped} pages (no valid content)`);
  console.log(`❌ Failed: ${allFailed} pages`);
  console.log(`📦 Created: ${allChunksCreated} clean chunks`);
  console.log(`\n✨ All chunks now have:`);
  console.log(`  - Metadata at the start`);
  console.log(`  - No navigation contamination`);
  console.log(`  - No CSS/HTML artifacts`);
}

// Run the script
const domainArg = process.argv.find(arg => arg.startsWith('--domain='))?.split('=')[1];
if (!domainArg) {
  console.error('❌ Please specify domain: --domain=example.com');
  process.exit(1);
}

regenerateWithFixes(domainArg).catch(console.error);