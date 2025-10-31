// MIGRATED: Now uses environment variables via supabase-config.js
import { getSupabaseConfig, executeSQL as executeSQLHelper } from './supabase-config.js';

const config = getSupabaseConfig();

// Wrapper function that matches the original signature and adds console output
async function executeSQL(query, description) {
  console.log(`\n📝 ${description}...`);

  try {
    const result = await executeSQLHelper(config, query);
    console.log(`✅ Success`);
    return { success: true, result };
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function getSizeBeforeCleanup() {
  const query = `
    SELECT 
      'Before Cleanup' as status,
      pg_size_pretty(pg_database_size(current_database())) as database_size,
      (SELECT pg_size_pretty(pg_total_relation_size('page_embeddings'))) as page_embeddings_size,
      (SELECT pg_size_pretty(pg_total_relation_size('scraped_pages'))) as scraped_pages_size,
      (SELECT COUNT(*) FROM page_embeddings) as embedding_count,
      (SELECT COUNT(*) FROM scraped_pages) as scraped_count;
  `;
  
  const result = await executeSQL(query, 'Getting size before cleanup');
  if (result.success && result.result[0]) {
    return result.result[0];
  }
  return null;
}

async function reclaimDatabaseSpace(executeMode = false) {
  console.log('🧹 DATABASE SPACE RECLAMATION UTILITY');
  console.log('='.repeat(60));
  
  if (!executeMode) {
    console.log('⚠️  DRY RUN MODE - Use --execute to actually reclaim space');
  } else {
    console.log('⚠️  EXECUTE MODE - This will lock tables temporarily!');
    console.log('    Press Ctrl+C within 5 seconds to cancel...');
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  // Get initial sizes
  const beforeSizes = await getSizeBeforeCleanup();
  if (beforeSizes) {
    console.log('\n📊 CURRENT STATE:');
    console.log(`  Database Size: ${beforeSizes.database_size}`);
    console.log(`  Page Embeddings: ${beforeSizes.page_embeddings_size} (${beforeSizes.embedding_count} rows)`);
    console.log(`  Scraped Pages: ${beforeSizes.scraped_pages_size} (${beforeSizes.scraped_count} rows)`);
  }

  // Step 1: Remove duplicate embeddings
  console.log('\n' + '='.repeat(60));
  console.log('STEP 1: REMOVE DUPLICATE EMBEDDINGS');
  console.log('='.repeat(60));
  
  const findDuplicatesQuery = `
    WITH duplicate_embeddings AS (
      SELECT 
        id,
        content_hash,
        domain,
        url,
        ROW_NUMBER() OVER (
          PARTITION BY content_hash 
          ORDER BY created_at DESC
        ) as rn
      FROM page_embeddings
      WHERE content_hash IS NOT NULL
    )
    SELECT 
      COUNT(*) as duplicates_to_remove,
      pg_size_pretty(AVG(pg_column_size(pe.embedding))::bigint * COUNT(*)) as space_to_free
    FROM duplicate_embeddings de
    JOIN page_embeddings pe ON pe.id = de.id
    WHERE de.rn > 1;
  `;
  
  const duplicatesResult = await executeSQL(findDuplicatesQuery, 'Finding duplicate embeddings');
  if (duplicatesResult.success && duplicatesResult.result[0]) {
    const dupes = duplicatesResult.result[0];
    console.log(`  Duplicates to remove: ${dupes.duplicates_to_remove}`);
    console.log(`  Space to free: ${dupes.space_to_free || '0 bytes'}`);
    
    if (executeMode && dupes.duplicates_to_remove > 0) {
      const removeDuplicatesQuery = `
        DELETE FROM page_embeddings
        WHERE id IN (
          SELECT id FROM (
            SELECT 
              id,
              ROW_NUMBER() OVER (
                PARTITION BY content_hash 
                ORDER BY created_at DESC
              ) as rn
            FROM page_embeddings
            WHERE content_hash IS NOT NULL
          ) duplicates
          WHERE rn > 1
        );
      `;
      
      await executeSQL(removeDuplicatesQuery, 'Removing duplicate embeddings');
    }
  }

  // Step 2: Remove orphaned embeddings
  console.log('\n' + '='.repeat(60));
  console.log('STEP 2: REMOVE ORPHANED EMBEDDINGS');
  console.log('='.repeat(60));
  
  const findOrphanedQuery = `
    SELECT 
      COUNT(*) as orphaned_count,
      pg_size_pretty(AVG(pg_column_size(embedding))::bigint * COUNT(*)) as space_to_free
    FROM page_embeddings pe
    WHERE NOT EXISTS (
      SELECT 1 FROM scraped_pages sp
      WHERE sp.url = pe.url
        AND sp.domain = pe.domain
    );
  `;
  
  const orphanedResult = await executeSQL(findOrphanedQuery, 'Finding orphaned embeddings');
  if (orphanedResult.success && orphanedResult.result[0]) {
    const orphaned = orphanedResult.result[0];
    console.log(`  Orphaned embeddings: ${orphaned.orphaned_count}`);
    console.log(`  Space to free: ${orphaned.space_to_free || '0 bytes'}`);
    
    if (executeMode && orphaned.orphaned_count > 0) {
      const removeOrphanedQuery = `
        DELETE FROM page_embeddings pe
        WHERE NOT EXISTS (
          SELECT 1 FROM scraped_pages sp
          WHERE sp.url = pe.url
            AND sp.domain = pe.domain
        );
      `;
      
      await executeSQL(removeOrphanedQuery, 'Removing orphaned embeddings');
    }
  }

  // Step 3: Clean up old/incomplete scrape jobs
  console.log('\n' + '='.repeat(60));
  console.log('STEP 3: CLEAN UP OLD SCRAPE JOBS');
  console.log('='.repeat(60));
  
  const oldJobsQuery = `
    SELECT 
      COUNT(*) as old_jobs,
      COUNT(CASE WHEN status IN ('failed', 'cancelled') THEN 1 END) as failed_jobs
    FROM scrape_jobs
    WHERE created_at < NOW() - INTERVAL '7 days'
       OR status IN ('failed', 'cancelled');
  `;
  
  const oldJobsResult = await executeSQL(oldJobsQuery, 'Finding old scrape jobs');
  if (oldJobsResult.success && oldJobsResult.result[0]) {
    const jobs = oldJobsResult.result[0];
    console.log(`  Old jobs (>7 days): ${jobs.old_jobs}`);
    console.log(`  Failed/cancelled jobs: ${jobs.failed_jobs}`);
    
    if (executeMode && (jobs.old_jobs > 0 || jobs.failed_jobs > 0)) {
      const cleanJobsQuery = `
        DELETE FROM scrape_jobs
        WHERE created_at < NOW() - INTERVAL '7 days'
           OR status IN ('failed', 'cancelled');
      `;
      
      await executeSQL(cleanJobsQuery, 'Cleaning old scrape jobs');
    }
  }

  // Step 4: VACUUM ANALYZE critical tables
  console.log('\n' + '='.repeat(60));
  console.log('STEP 4: VACUUM ANALYZE TABLES');
  console.log('='.repeat(60));
  
  if (executeMode) {
    // Regular VACUUM (doesn't lock table for long)
    console.log('\n🔄 Running VACUUM ANALYZE on critical tables...');
    console.log('   This reclaims space for reuse but doesn\'t shrink files');
    
    const tables = ['page_embeddings', 'scraped_pages', 'messages', 'scrape_jobs'];
    
    for (const table of tables) {
      await executeSQL(
        `VACUUM ANALYZE ${table};`,
        `VACUUM ANALYZE on ${table}`
      );
    }
  } else {
    console.log('  Would run VACUUM ANALYZE on:');
    console.log('    - page_embeddings');
    console.log('    - scraped_pages');
    console.log('    - messages');
    console.log('    - scrape_jobs');
  }

  // Step 5: Optional VACUUM FULL (requires significant lock time)
  console.log('\n' + '='.repeat(60));
  console.log('STEP 5: VACUUM FULL (OPTIONAL - REQUIRES DOWNTIME)');
  console.log('='.repeat(60));
  
  if (executeMode) {
    console.log('\n⚠️  VACUUM FULL requires exclusive table locks!');
    console.log('   This will make tables unavailable during operation.');
    console.log('   Estimated time: 1-5 minutes per table');
    console.log('\n   Skip this step if you cannot afford downtime.');
    console.log('   To run VACUUM FULL manually later, execute in SQL editor:');
    console.log('   VACUUM FULL page_embeddings;');
    console.log('   VACUUM FULL scraped_pages;');
  } else {
    console.log('  VACUUM FULL would reclaim:');
    console.log('    - ~109 MB from page_embeddings TOAST');
    console.log('    - ~151 MB from scraped_pages TOAST');
    console.log('    - Total: ~260 MB');
  }

  // Get final sizes
  if (executeMode) {
    console.log('\n' + '='.repeat(60));
    console.log('CLEANUP COMPLETE - CHECKING RESULTS');
    console.log('='.repeat(60));
    
    const afterSizes = await getSizeBeforeCleanup();
    if (afterSizes && beforeSizes) {
      console.log('\n📊 RESULTS:');
      console.log(`  Database Size: ${beforeSizes.database_size} → ${afterSizes.database_size}`);
      console.log(`  Page Embeddings: ${beforeSizes.page_embeddings_size} → ${afterSizes.page_embeddings_size}`);
      console.log(`  Scraped Pages: ${beforeSizes.scraped_pages_size} → ${afterSizes.scraped_pages_size}`);
      console.log(`  Embedding Rows: ${beforeSizes.embedding_count} → ${afterSizes.embedding_count}`);
      console.log(`  Scraped Rows: ${beforeSizes.scraped_count} → ${afterSizes.scraped_count}`);
    }
  }

  console.log('\n💡 RECOMMENDATIONS:');
  console.log('1. Run this cleanup weekly to prevent space bloat');
  console.log('2. Monitor duplicate embeddings - may indicate scraper issues');
  console.log('3. Consider implementing automatic cleanup for old scrape jobs');
  console.log('4. Schedule VACUUM FULL during maintenance windows monthly');
  
  if (!executeMode) {
    console.log('\n📌 To execute cleanup, run:');
    console.log('   node scripts/reclaim-database-space.js --execute');
  }
}

// Parse arguments and run
const args = process.argv.slice(2);
const executeMode = args.includes('--execute');

reclaimDatabaseSpace(executeMode).catch(console.error);