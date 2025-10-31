#!/usr/bin/env node

/**
 * Apply Missing Database Indexes
 *
 * This script applies the critical missing indexes identified in the
 * comprehensive database audit to achieve 30-70% query performance improvements.
 *
 * Usage:
 *   npx tsx scripts/database/apply-missing-indexes.ts
 *   npx tsx scripts/database/apply-missing-indexes.ts --dry-run
 *   npx tsx scripts/database/apply-missing-indexes.ts --verify-only
 *
 * Prerequisites:
 *   - SUPABASE_MANAGEMENT_TOKEN must be set in .env.local
 *   - NEXT_PUBLIC_SUPABASE_PROJECT_REF must be set
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { getSupabaseConfig, executeSQL } from '../supabase-config.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// CLI arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const isVerifyOnly = args.includes('--verify-only');

/**
 * Check which indexes currently exist
 */
async function checkExistingIndexes(config: any): Promise<Set<string>> {
  const query = `
    SELECT indexname
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND (
        indexname LIKE 'idx_page_embeddings_domain%'
        OR indexname LIKE 'idx_business_classifications_domain%'
        OR indexname LIKE 'idx_conversations_domain%'
        OR indexname LIKE 'idx_scraped_pages_domain_status%'
        OR indexname LIKE 'idx_messages_conversation%'
        OR indexname LIKE 'idx_scrape_jobs_domain_status%'
      )
    ORDER BY indexname;
  `;

  try {
    const result = await executeSQL(config, query);
    const indexes = new Set<string>();

    if (result && Array.isArray(result)) {
      result.forEach((row: any) => {
        indexes.add(row.indexname);
      });
    }

    return indexes;
  } catch (error) {
    console.error('❌ Error checking existing indexes:', error);
    throw error;
  }
}

/**
 * Run EXPLAIN ANALYZE on critical queries to measure performance
 */
async function runPerformanceTests(config: any, label: string): Promise<any> {
  console.log(`\n📊 Running performance tests (${label})...`);

  // Get a sample domain_id for testing
  const domainQuery = `
    SELECT id FROM customer_configs LIMIT 1;
  `;

  try {
    const domainResult = await executeSQL(config, domainQuery);
    const domainId = domainResult?.[0]?.id;

    if (!domainId) {
      console.log('⚠️  No customer configs found - skipping performance tests');
      return null;
    }

    // Test 1: page_embeddings domain filter (most critical)
    const test1 = `
      EXPLAIN ANALYZE
      SELECT * FROM page_embeddings
      WHERE domain_id = '${domainId}'
      ORDER BY created_at DESC
      LIMIT 100;
    `;

    // Test 2: business_classifications lookup
    const test2 = `
      EXPLAIN ANALYZE
      SELECT * FROM business_classifications
      WHERE domain_id = '${domainId}';
    `;

    // Test 3: scraped_pages with status filter
    const test3 = `
      EXPLAIN ANALYZE
      SELECT * FROM scraped_pages
      WHERE domain_id = '${domainId}' AND status = 'completed'
      ORDER BY created_at DESC
      LIMIT 50;
    `;

    const results = {
      page_embeddings: await executeSQL(config, test1),
      business_classifications: await executeSQL(config, test2),
      scraped_pages: await executeSQL(config, test3),
    };

    // Extract key metrics from EXPLAIN ANALYZE
    const extractMetrics = (explainOutput: any) => {
      if (!explainOutput || !Array.isArray(explainOutput)) return null;

      const planText = explainOutput.map((row: any) =>
        row['QUERY PLAN'] || row.plan || ''
      ).join('\n');

      // Extract execution time and cost
      const timeMatch = planText.match(/Execution Time: ([\d.]+) ms/);
      const costMatch = planText.match(/cost=([\d.]+)\.\.([\d.]+)/);
      const scanType = planText.includes('Index Scan') ? 'Index Scan' :
                      planText.includes('Seq Scan') ? 'Seq Scan' :
                      'Unknown';

      return {
        executionTime: timeMatch ? parseFloat(timeMatch[1]) : null,
        cost: costMatch ? parseFloat(costMatch[2]) : null,
        scanType,
        plan: planText,
      };
    };

    const metrics = {
      page_embeddings: extractMetrics(results.page_embeddings),
      business_classifications: extractMetrics(results.business_classifications),
      scraped_pages: extractMetrics(results.scraped_pages),
    };

    // Print summary
    console.log(`\n${label} Performance Metrics:`);
    console.log('━'.repeat(60));

    Object.entries(metrics).forEach(([table, data]) => {
      if (data) {
        console.log(`\n${table}:`);
        console.log(`  Scan Type: ${data.scanType}`);
        console.log(`  Execution Time: ${data.executionTime?.toFixed(2) || 'N/A'} ms`);
        console.log(`  Query Cost: ${data.cost?.toFixed(2) || 'N/A'}`);
      }
    });

    return metrics;
  } catch (error) {
    console.error('❌ Error running performance tests:', error);
    return null;
  }
}

/**
 * Apply the indexes from the SQL migration file
 */
async function applyIndexes(config: any): Promise<void> {
  const sqlPath = join(__dirname, 'add-missing-indexes.sql');
  const sql = readFileSync(sqlPath, 'utf-8');

  console.log('📝 Applying index migration...\n');

  try {
    const result = await executeSQL(config, sql);
    console.log('✅ Index migration completed successfully');
    return result;
  } catch (error: any) {
    console.error('❌ Error applying indexes:', error.message);
    throw error;
  }
}

/**
 * Verify indexes were created successfully
 */
async function verifyIndexes(config: any, expectedIndexes: string[]): Promise<void> {
  console.log('\n🔍 Verifying index creation...\n');

  const existingIndexes = await checkExistingIndexes(config);

  const results = expectedIndexes.map(indexName => {
    const exists = existingIndexes.has(indexName);
    return { indexName, exists };
  });

  console.log('Index Verification Results:');
  console.log('━'.repeat(60));

  let successCount = 0;
  results.forEach(({ indexName, exists }) => {
    if (exists) {
      console.log(`✅ ${indexName}`);
      successCount++;
    } else {
      console.log(`❌ ${indexName} - NOT FOUND`);
    }
  });

  console.log('━'.repeat(60));
  console.log(`${successCount}/${expectedIndexes.length} indexes verified`);

  if (successCount < expectedIndexes.length) {
    throw new Error('Some indexes were not created successfully');
  }
}

/**
 * Get index sizes
 */
async function getIndexSizes(config: any): Promise<void> {
  console.log('\n📦 Index Sizes:\n');

  const query = `
    SELECT
      tablename,
      indexname,
      pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
      pg_relation_size(indexrelid) as size_bytes
    FROM pg_stat_user_indexes
    WHERE schemaname = 'public'
      AND (
        indexname LIKE 'idx_page_embeddings_domain%'
        OR indexname LIKE 'idx_business_classifications_domain%'
        OR indexname LIKE 'idx_conversations_domain%'
        OR indexname LIKE 'idx_scraped_pages_domain_status%'
        OR indexname LIKE 'idx_messages_conversation%'
        OR indexname LIKE 'idx_scrape_jobs_domain_status%'
      )
    ORDER BY size_bytes DESC;
  `;

  try {
    const result = await executeSQL(config, query);

    if (!result || result.length === 0) {
      console.log('No matching indexes found');
      return;
    }

    let totalBytes = 0;
    result.forEach((row: any) => {
      console.log(`  ${row.indexname.padEnd(45)} ${row.index_size}`);
      totalBytes += parseInt(row.size_bytes || 0);
    });

    const totalMB = (totalBytes / (1024 * 1024)).toFixed(2);
    console.log('━'.repeat(60));
    console.log(`  Total Size: ${totalMB} MB`);
  } catch (error) {
    console.error('❌ Error getting index sizes:', error);
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🗃️  Database Index Migration Tool\n');
  console.log('━'.repeat(60));

  try {
    // Load configuration
    const config = getSupabaseConfig();
    console.log('✅ Configuration loaded');
    console.log(`   Project: ${config.projectRef}\n`);

    // Expected indexes to be created
    const expectedIndexes = [
      'idx_page_embeddings_domain_id',
      'idx_page_embeddings_domain_lookup',
      'idx_business_classifications_domain_id',
      'idx_conversations_domain_id',
      'idx_scraped_pages_domain_status_recent',
      'idx_messages_conversation_created',
      'idx_scrape_jobs_domain_status',
    ];

    // Check existing indexes
    console.log('📋 Checking current indexes...\n');
    const existingIndexes = await checkExistingIndexes(config);

    console.log('Current Indexes:');
    if (existingIndexes.size === 0) {
      console.log('  (none found)');
    } else {
      existingIndexes.forEach(idx => console.log(`  - ${idx}`));
    }

    const missingIndexes = expectedIndexes.filter(idx => !existingIndexes.has(idx));

    if (missingIndexes.length === 0) {
      console.log('\n✅ All expected indexes already exist!');

      if (isVerifyOnly) {
        await getIndexSizes(config);
        return;
      }

      console.log('\nRun with --verify-only to see index sizes');
      return;
    }

    console.log(`\n⚠️  Missing ${missingIndexes.length} indexes:`);
    missingIndexes.forEach(idx => console.log(`  - ${idx}`));

    // Verify-only mode
    if (isVerifyOnly) {
      console.log('\n❌ Cannot verify - indexes not yet created');
      console.log('Run without --verify-only to apply indexes');
      return;
    }

    // Run performance tests BEFORE applying indexes
    const beforeMetrics = await runPerformanceTests(config, 'BEFORE');

    // Dry run mode
    if (isDryRun) {
      console.log('\n🔍 DRY RUN MODE - No changes will be made');
      console.log('\nWould create the following indexes:');
      missingIndexes.forEach(idx => console.log(`  - ${idx}`));
      console.log('\nRun without --dry-run to apply changes');
      return;
    }

    // Apply indexes
    console.log('\n🚀 Applying missing indexes...');
    await applyIndexes(config);

    // Verify creation
    await verifyIndexes(config, expectedIndexes);

    // Get index sizes
    await getIndexSizes(config);

    // Run performance tests AFTER applying indexes
    const afterMetrics = await runPerformanceTests(config, 'AFTER');

    // Calculate improvements
    if (beforeMetrics && afterMetrics) {
      console.log('\n📈 Performance Improvements:\n');
      console.log('━'.repeat(60));

      Object.keys(beforeMetrics).forEach(table => {
        const before = beforeMetrics[table];
        const after = afterMetrics[table];

        if (before && after && before.executionTime && after.executionTime) {
          const improvement = ((before.executionTime - after.executionTime) / before.executionTime * 100);
          const timeReduction = before.executionTime - after.executionTime;

          console.log(`\n${table}:`);
          console.log(`  Before: ${before.executionTime.toFixed(2)} ms (${before.scanType})`);
          console.log(`  After:  ${after.executionTime.toFixed(2)} ms (${after.scanType})`);
          console.log(`  Improvement: ${improvement.toFixed(1)}% faster (${timeReduction.toFixed(2)} ms saved)`);
        }
      });
    }

    console.log('\n✅ Index migration completed successfully!');
    console.log('\n🎯 Recommendations:');
    console.log('  1. Monitor query performance over the next 24 hours');
    console.log('  2. Run VACUUM ANALYZE on affected tables if needed');
    console.log('  3. Check pg_stat_user_indexes to verify index usage');
    console.log('  4. Update docs/09-REFERENCE/REFERENCE_DATABASE_SCHEMA.md');

  } catch (error: any) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  }
}

// Run the script
main();
