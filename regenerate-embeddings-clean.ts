#!/usr/bin/env npx tsx
/**
 * Regenerate embeddings with CLEAN content (navigation removed)
 * This fixes the contamination issue by stripping repeated navigation elements
 */

import { createServiceRoleClient } from './lib/supabase-server';
import { splitIntoChunks, generateEmbeddingVectors } from './lib/embeddings-functions';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

/**
 * Clean content by removing navigation and repeated boilerplate
 */
function cleanContent(content: string): string {
  if (!content) return '';

  // Common navigation patterns to remove
  const navigationPatterns = [
    // Header navigation
    /Shop by Category[\s\S]*?(?=(SKU|Product|Description|Price|£|\$|Category:|Brand:|€))/gi,
    /Tipper Skip Hookloaders[\s\S]*?(?=(SKU|Product|Description|Price|£|\$|Category:|Brand:|€))/gi,
    
    // Footer patterns
    /Manage consent[\s\S]*?Request a Call Back/gi,
    /T 01254 \d+[\s\S]*?important/gi,
    /vc_row css[\s\S]*?important/gi,
    
    // Repeated navigation blocks
    /Thompsons Static Wacker Carrier[\s\S]*?Solenoid Valves/gi,
    /General Hookloader Sheet Systems[\s\S]*?Skiploader Parts/gi,
    
    // Common sidebar/menu items that appear everywhere
    /Electrical Parts Motors[\s\S]*?Flip over Sheet System/gi,
    
    // CSS and styling artifacts
    /padding-\w+\s*:\s*\d+px\s*!?\s*important/gi,
    /\.vc_\w+\s*\{[\s\S]*?\}/gi,
  ];

  let cleaned = content;
  
  // Remove navigation patterns
  for (const pattern of navigationPatterns) {
    cleaned = cleaned.replace(pattern, '');
  }
  
  // Remove excessive whitespace
  cleaned = cleaned
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n');
  
  // Remove duplicate consecutive lines
  const lines = cleaned.split('\n');
  const uniqueLines: string[] = [];
  let lastLine = '';
  
  for (const line of lines) {
    if (line !== lastLine && line.length > 2) {
      uniqueLines.push(line);
      lastLine = line;
    }
  }
  
  return uniqueLines.join('\n');
}

/**
 * Extract the actual product/category content
 */
function extractMainContent(content: string, url: string): string {
  // For product pages, focus on product details
  if (url.includes('/product/')) {
    // Look for product-specific content markers
    const productMarkers = [
      /SKU[\s\S]*$/i,
      /Product Code[\s\S]*$/i,
      /Description[\s\S]*$/i,
      /Price[\s\S]*$/i,
      /£[\d,]+\.?\d*[\s\S]*$/i,
    ];
    
    for (const marker of productMarkers) {
      const match = content.match(marker);
      if (match) {
        return match[0];
      }
    }
  }
  
  // For category pages, extract product listings
  if (url.includes('/category/') || url.includes('/categories/')) {
    // Remove everything before the first product mention
    const categoryContent = content.replace(/^[\s\S]*?(?=(\w+\s+\d+|Products?|Items?|Results?))/i, '');
    return categoryContent;
  }
  
  return content;
}

async function regenerateEmbeddingsClean(domainFilter?: string) {
  const supabase = await createServiceRoleClient();
  
  if (!supabase) {
    console.error('❌ Failed to create Supabase client');
    process.exit(1);
  }

  console.log('🚀 Starting CLEAN embedding regeneration...');
  console.log('🧹 Navigation and boilerplate will be removed');
  
  if (domainFilter) {
    console.log(`📍 Filtering for domain: ${domainFilter}`);
  }

  // Get all scraped pages with metadata
  let query = supabase
    .from('scraped_pages')
    .select('id, url, title, content, metadata, domain_id')
    .not('content', 'is', null);

  if (domainFilter) {
    // Get domain ID first
    const { data: domain } = await supabase
      .from('domains')
      .select('id')
      .eq('domain', domainFilter.replace('www.', ''))
      .single();
    
    if (domain) {
      query = query.eq('domain_id', domain.id);
    } else {
      console.error(`❌ Domain not found: ${domainFilter}`);
      process.exit(1);
    }
  }

  const { data: pages, error: fetchError } = await query;

  if (fetchError) {
    console.error('❌ Error fetching pages:', fetchError);
    process.exit(1);
  }

  if (!pages || pages.length === 0) {
    console.log('ℹ️ No pages found to process');
    return;
  }

  console.log(`📊 Found ${pages.length} pages to reprocess`);

  let processed = 0;
  let failed = 0;
  let totalChunksCreated = 0;

  // Process in batches to avoid overwhelming the API
  const BATCH_SIZE = 10;
  
  for (let i = 0; i < pages.length; i += BATCH_SIZE) {
    const batch = pages.slice(i, i + BATCH_SIZE);
    console.log(`\n📦 Processing batch ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(pages.length/BATCH_SIZE)}`);
    
    await Promise.all(batch.map(async (page) => {
      try {
        // Delete existing embeddings for this page
        const { error: deleteError } = await supabase
          .from('page_embeddings')
          .delete()
          .eq('page_id', page.id);

        if (deleteError) {
          console.warn(`⚠️ Could not delete old embeddings for ${page.url}:`, deleteError.message);
        }

        // STEP 1: Clean the content to remove navigation
        const cleanedContent = cleanContent(page.content);
        const mainContent = extractMainContent(cleanedContent, page.url);
        
        // STEP 2: Enrich with metadata (categories, brands)
        let enrichedContent = mainContent;
        
        // Add product category if available
        if (page.metadata?.productCategory) {
          enrichedContent = `Category: ${page.metadata.productCategory}\n\n${enrichedContent}`;
        }
        
        // Add breadcrumbs from ecommerceData if available
        if (page.metadata?.ecommerceData?.breadcrumbs?.length > 0) {
          const breadcrumbText = page.metadata.ecommerceData.breadcrumbs
            .map((b: any) => b.name)
            .filter((name: string) => !name.toLowerCase().includes('home'))
            .join(' > ');
          if (breadcrumbText) {
            enrichedContent = `Navigation: ${breadcrumbText}\n${enrichedContent}`;
          }
        }
        
        // Add brand if available
        if (page.metadata?.productBrand) {
          enrichedContent = `Brand: ${page.metadata.productBrand}\n${enrichedContent}`;
        }

        // Add title for context
        if (page.title && !enrichedContent.includes(page.title)) {
          enrichedContent = `${page.title}\n\n${enrichedContent}`;
        }

        // Skip if content is too short after cleaning
        if (enrichedContent.length < 50) {
          console.log(`⏭️ Skipping ${page.url} - content too short after cleaning`);
          return;
        }

        // STEP 3: Generate chunks and embeddings
        const chunks = splitIntoChunks(enrichedContent);
        
        if (chunks.length === 0) {
          console.log(`⏭️ Skipping ${page.url} - no valid chunks`);
          return;
        }

        const embeddings = await generateEmbeddingVectors(chunks);

        // STEP 4: Store clean embeddings
        const embeddingRecords = chunks.map((chunk, index) => ({
          page_id: page.id,
          chunk_text: chunk,
          embedding: embeddings[index],
          metadata: { 
            chunk_index: index,
            url: page.url,
            title: page.title,
            is_cleaned: true,  // Mark as cleaned content
            cleaned_at: new Date().toISOString()
          },
        }));

        const { error: embedError } = await supabase
          .from('page_embeddings')
          .insert(embeddingRecords);

        if (embedError) throw embedError;

        processed++;
        totalChunksCreated += chunks.length;
        console.log(`✅ ${page.title || page.url} - ${chunks.length} clean chunks`);

      } catch (error) {
        failed++;
        console.error(`❌ Failed ${page.url}:`, error);
      }
    }));
  }

  console.log('\n' + '='.repeat(50));
  console.log('🎉 CLEAN Regeneration Complete!');
  console.log('='.repeat(50));
  console.log(`✅ Processed: ${processed} pages`);
  console.log(`📦 Created: ${totalChunksCreated} clean chunks`);
  console.log(`❌ Failed: ${failed} pages`);
  console.log(`🧹 Navigation removed from all embeddings`);
}

// Run the script
const domain = process.argv.find(arg => arg.startsWith('--domain='))?.split('=')[1];
regenerateEmbeddingsClean(domain).catch(console.error);