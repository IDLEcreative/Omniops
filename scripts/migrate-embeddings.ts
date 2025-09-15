#!/usr/bin/env npx tsx
/**
 * Migration script to enhance existing embeddings with rich metadata
 * Run this to upgrade all existing embeddings to the enhanced metadata format
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { MetadataExtractor } from '../lib/metadata-extractor';
import { createServiceRoleClient } from '../lib/supabase/server';

// Load environment variables
config({ path: '.env.local' });

// Validate environment
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables');
  console.error('Please ensure .env.local contains:');
  console.error('  NEXT_PUBLIC_SUPABASE_URL');
  console.error('  SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Configuration
const BATCH_SIZE = parseInt(process.env.MIGRATION_BATCH_SIZE || '50');
const DELAY_MS = parseInt(process.env.MIGRATION_DELAY_MS || '1000');
const DRY_RUN = process.env.DRY_RUN === 'true';

interface MigrationStats {
  totalEmbeddings: number;
  processed: number;
  enhanced: number;
  skipped: number;
  failed: number;
  startTime: Date;
  endTime?: Date;
}

/**
 * Migrate embeddings for a specific domain or all domains
 */
async function migrateEmbeddings(domainFilter?: string): Promise<MigrationStats> {
  const stats: MigrationStats = {
    totalEmbeddings: 0,
    processed: 0,
    enhanced: 0,
    skipped: 0,
    failed: 0,
    startTime: new Date()
  };

  console.log('🚀 Starting Embeddings Migration');
  console.log('================================');
  console.log(`Batch Size: ${BATCH_SIZE}`);
  console.log(`Delay between batches: ${DELAY_MS}ms`);
  console.log(`Domain filter: ${domainFilter || 'All domains'}`);
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`);
  console.log('');

  try {
    // Get total count of embeddings to process
    const countQuery = supabase
      .from('page_embeddings')
      .select('id', { count: 'exact', head: true });

    if (domainFilter) {
      // Get domain ID
      const { data: domainData } = await supabase
        .from('domains')
        .select('id')
        .eq('domain', domainFilter.replace('www.', ''))
        .single();

      if (domainData) {
        // Join with scraped_pages to filter by domain
        const { count } = await supabase
          .from('page_embeddings')
          .select('*, scraped_pages!inner(domain_id)', { count: 'exact', head: true })
          .eq('scraped_pages.domain_id', domainData.id);
        
        stats.totalEmbeddings = count || 0;
      }
    } else {
      const { count } = await countQuery;
      stats.totalEmbeddings = count || 0;
    }

    console.log(`Found ${stats.totalEmbeddings} embeddings to process\n`);

    if (stats.totalEmbeddings === 0) {
      console.log('No embeddings found to migrate');
      return stats;
    }

    // Process in batches
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      // Fetch batch of embeddings
      let query = supabase
        .from('page_embeddings')
        .select(`
          id,
          page_id,
          chunk_text,
          metadata,
          scraped_pages!inner(
            id,
            url,
            title,
            content,
            domain,
            domain_id
          )
        `)
        .order('id')
        .range(offset, offset + BATCH_SIZE - 1);

      if (domainFilter) {
        const { data: domainData } = await supabase
          .from('domains')
          .select('id')
          .eq('domain', domainFilter.replace('www.', ''))
          .single();

        if (domainData) {
          query = query.eq('scraped_pages.domain_id', domainData.id);
        }
      }

      const { data: embeddings, error } = await query;

      if (error) {
        console.error('Error fetching embeddings:', error);
        break;
      }

      if (!embeddings || embeddings.length === 0) {
        hasMore = false;
        break;
      }

      console.log(`\nProcessing batch ${Math.floor(offset / BATCH_SIZE) + 1} (${embeddings.length} embeddings)`);

      // Process each embedding in the batch
      for (const embedding of embeddings) {
        try {
          stats.processed++;

          // Skip if already has enhanced metadata
          if (embedding.metadata?.content_type && embedding.metadata?.keywords) {
            console.log(`  [${stats.processed}/${stats.totalEmbeddings}] Skipping ${embedding.id} - already enhanced`);
            stats.skipped++;
            continue;
          }

          // Extract scraped page data
          const page = Array.isArray(embedding.scraped_pages) 
            ? embedding.scraped_pages[0] 
            : embedding.scraped_pages;

          if (!page) {
            console.log(`  [${stats.processed}/${stats.totalEmbeddings}] Skipping ${embedding.id} - no page data`);
            stats.skipped++;
            continue;
          }

          // Extract enhanced metadata
          const enhancedMetadata = await MetadataExtractor.extractEnhancedMetadata(
            embedding.chunk_text,
            page.content || '',
            page.url,
            page.title || '',
            embedding.metadata?.chunk_index || 0,
            embedding.metadata?.total_chunks || 1,
            undefined // No HTML available for existing content
          );

          // Preserve existing metadata and add enhanced fields
          const mergedMetadata = {
            ...embedding.metadata,
            ...enhancedMetadata
          };

          if (DRY_RUN) {
            console.log(`  [${stats.processed}/${stats.totalEmbeddings}] Would enhance ${embedding.id}:`);
            console.log(`    Content Type: ${enhancedMetadata.content_type}`);
            console.log(`    Keywords: ${enhancedMetadata.keywords.slice(0, 5).join(', ')}`);
            console.log(`    Word Count: ${enhancedMetadata.word_count}`);
            if (enhancedMetadata.entities?.skus?.length) {
              console.log(`    SKUs: ${enhancedMetadata.entities.skus.join(', ')}`);
            }
          } else {
            // Update the embedding with enhanced metadata
            const { error: updateError } = await supabase
              .from('page_embeddings')
              .update({ metadata: mergedMetadata })
              .eq('id', embedding.id);

            if (updateError) {
              console.error(`  [${stats.processed}/${stats.totalEmbeddings}] Failed to update ${embedding.id}:`, updateError);
              stats.failed++;
            } else {
              console.log(`  [${stats.processed}/${stats.totalEmbeddings}] Enhanced ${embedding.id} - ${enhancedMetadata.content_type}`);
              stats.enhanced++;
            }
          }

        } catch (err) {
          console.error(`  [${stats.processed}/${stats.totalEmbeddings}] Error processing ${embedding.id}:`, err);
          stats.failed++;
        }

        // Progress indicator every 10 items
        if (stats.processed % 10 === 0) {
          const progress = ((stats.processed / stats.totalEmbeddings) * 100).toFixed(1);
          console.log(`\n📊 Progress: ${progress}% (${stats.processed}/${stats.totalEmbeddings})`);
          console.log(`   Enhanced: ${stats.enhanced}, Skipped: ${stats.skipped}, Failed: ${stats.failed}`);
        }
      }

      offset += BATCH_SIZE;

      // Delay between batches to avoid overwhelming the system
      if (hasMore && embeddings.length === BATCH_SIZE) {
        console.log(`\n⏳ Waiting ${DELAY_MS}ms before next batch...`);
        await new Promise(resolve => setTimeout(resolve, DELAY_MS));
      } else {
        hasMore = false;
      }
    }

    stats.endTime = new Date();

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    stats.endTime = new Date();
  }

  return stats;
}

/**
 * Display migration statistics
 */
function displayStats(stats: MigrationStats) {
  const duration = stats.endTime 
    ? (stats.endTime.getTime() - stats.startTime.getTime()) / 1000 
    : 0;

  console.log('\n========================================');
  console.log('📊 Migration Complete');
  console.log('========================================');
  console.log(`Total Embeddings: ${stats.totalEmbeddings}`);
  console.log(`Processed: ${stats.processed}`);
  console.log(`Enhanced: ${stats.enhanced} (${((stats.enhanced / stats.totalEmbeddings) * 100).toFixed(1)}%)`);
  console.log(`Skipped: ${stats.skipped} (${((stats.skipped / stats.totalEmbeddings) * 100).toFixed(1)}%)`);
  console.log(`Failed: ${stats.failed} (${((stats.failed / stats.totalEmbeddings) * 100).toFixed(1)}%)`);
  console.log(`Duration: ${duration.toFixed(1)} seconds`);
  
  if (duration > 0) {
    const rate = stats.processed / duration;
    console.log(`Processing Rate: ${rate.toFixed(1)} embeddings/second`);
  }

  if (DRY_RUN) {
    console.log('\n⚠️  This was a DRY RUN - no changes were made');
    console.log('To apply changes, run without DRY_RUN=true');
  }
}

/**
 * Main execution
 */
async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const domainFilter = args[0];

  if (domainFilter) {
    console.log(`🎯 Filtering migration to domain: ${domainFilter}`);
  }

  // Check if we should do a dry run first
  if (!DRY_RUN) {
    console.log('\n⚠️  WARNING: This will modify your database!');
    console.log('Consider running with DRY_RUN=true first to preview changes.');
    console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  // Run migration
  const stats = await migrateEmbeddings(domainFilter);
  
  // Display results
  displayStats(stats);

  // Check metadata quality after migration
  if (!DRY_RUN && stats.enhanced > 0) {
    console.log('\n🔍 Checking metadata quality...');
    
    const { data: qualityCheck } = await supabase.rpc('get_metadata_stats', {
      p_domain_id: domainFilter ? (
        await supabase
          .from('domains')
          .select('id')
          .eq('domain', domainFilter.replace('www.', ''))
          .single()
      ).data?.id : null
    });

    if (qualityCheck && qualityCheck.length > 0) {
      const quality = qualityCheck[0];
      console.log(`\nMetadata Coverage: ${quality.coverage_percentage?.toFixed(1)}%`);
      console.log(`Avg Keywords per Chunk: ${quality.avg_keywords_per_chunk?.toFixed(1)}`);
      console.log(`Avg Readability Score: ${quality.avg_readability_score?.toFixed(1)}`);
      
      if (quality.content_type_distribution) {
        console.log('\nContent Type Distribution:');
        Object.entries(quality.content_type_distribution).forEach(([type, count]) => {
          console.log(`  ${type}: ${count}`);
        });
      }
    }
  }

  process.exit(0);
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('\n❌ Unhandled error:', error);
  process.exit(1);
});

// Run the migration
main().catch(console.error);