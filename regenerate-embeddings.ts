#!/usr/bin/env npx tsx
/**
 * Regenerate embeddings for existing scraped pages
 * This uses the existing metadata to enrich content with categories
 * No re-scraping needed!
 */

import { createServiceRoleClient } from './lib/supabase-server';
import { splitIntoChunks, generateEmbeddingVectors } from './lib/embeddings-functions';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function regenerateEmbeddings(domainFilter?: string) {
  const supabase = await createServiceRoleClient();
  
  if (!supabase) {
    console.error('❌ Failed to create Supabase client');
    process.exit(1);
  }

  console.log('🚀 Starting embedding regeneration...');
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

  for (const page of pages) {
    try {
      // Delete existing embeddings for this page
      const { error: deleteError } = await supabase
        .from('page_embeddings')
        .delete()
        .eq('page_id', page.id);

      if (deleteError) {
        console.warn(`⚠️ Could not delete old embeddings for ${page.url}:`, deleteError.message);
      }

      // Enrich content with metadata
      let enrichedContent = page.content;
      
      // Add product category if available
      if (page.metadata?.productCategory) {
        enrichedContent = `Category: ${page.metadata.productCategory}\n\n${enrichedContent}`;
      }
      
      // Add breadcrumbs from ecommerceData if available
      if (page.metadata?.ecommerceData?.breadcrumbs?.length > 0) {
        const breadcrumbText = page.metadata.ecommerceData.breadcrumbs
          .map((b: any) => b.name)
          .join(' > ');
        enrichedContent = `${breadcrumbText}\n\n${enrichedContent}`;
      }
      
      // Add brand if available  
      if (page.metadata?.productBrand) {
        enrichedContent = `Brand: ${page.metadata.productBrand}\n${enrichedContent}`;
      }

      // Generate chunks
      const chunks = splitIntoChunks(enrichedContent);
      
      if (chunks.length === 0) {
        console.warn(`⚠️ No chunks generated for ${page.url}`);
        continue;
      }

      // Generate embeddings
      const embeddings = await generateEmbeddingVectors(chunks);

      // Save new embeddings
      const embeddingRecords = chunks.map((chunk, index) => ({
        page_id: page.id,
        domain_id: page.domain_id,  // CRITICAL: Include domain_id for search to work!
        chunk_text: chunk,
        embedding: embeddings[index],
        metadata: {
          url: page.url,
          title: page.title,
          chunk_index: index,
          total_chunks: chunks.length,
          regenerated: true,
          regenerated_at: new Date().toISOString()
        }
      }));

      // Use bulk insert if available
      const { error: insertError } = await supabase.rpc('bulk_insert_embeddings', {
        embeddings: embeddingRecords
      }).catch(async (rpcError) => {
        // Fallback to regular insert if RPC fails
        console.log('Using fallback insert method...');
        return await supabase
          .from('page_embeddings')
          .insert(embeddingRecords);
      });

      if (insertError) {
        throw insertError;
      }

      processed++;
      
      // Progress indicator
      if (processed % 10 === 0) {
        console.log(`✅ Processed ${processed}/${pages.length} pages`);
      }

    } catch (error) {
      console.error(`❌ Failed to process ${page.url}:`, error);
      failed++;
    }
  }

  console.log('\n📈 Regeneration Complete!');
  console.log(`✅ Successfully processed: ${processed} pages`);
  if (failed > 0) {
    console.log(`❌ Failed: ${failed} pages`);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
let domainFilter: string | undefined;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--domain' && args[i + 1]) {
    domainFilter = args[i + 1];
  } else if (args[i].startsWith('--domain=')) {
    domainFilter = args[i].split('=')[1];
  }
}

// Show usage if help requested
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Usage: npx tsx regenerate-embeddings.ts [options]

Options:
  --domain=DOMAIN    Only regenerate embeddings for specific domain
  --help, -h         Show this help message

Examples:
  npx tsx regenerate-embeddings.ts
  npx tsx regenerate-embeddings.ts --domain=thompsonseparts.co.uk
  `);
  process.exit(0);
}

// Run the regeneration
regenerateEmbeddings(domainFilter)
  .then(() => {
    console.log('✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });