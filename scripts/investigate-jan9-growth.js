const fetch = require('node-fetch');

// Supabase Management API configuration
const SUPABASE_ACCESS_TOKEN = 'sbp_f30783ba26b0a6ae2bba917988553bd1d5f76d97';
const PROJECT_REF = 'birugqyuqhiahxvxeyqg';

async function executeSQL(query, description) {
  console.log(`\n📝 ${description}...`);
  
  try {
    const response = await fetch(
      `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Failed: ${response.status} - ${errorText}`);
      return { success: false, error: errorText };
    }

    const result = await response.json();
    return { success: true, result };
    
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function investigateJan9Growth() {
  console.log('🔍 INVESTIGATING JANUARY 9TH DATABASE GROWTH');
  console.log('='.repeat(60));

  // 1. Check data inserted on January 9th
  const jan9DataQuery = `
    WITH jan9_data AS (
      SELECT 
        'page_embeddings' as table_name,
        COUNT(*) as row_count,
        pg_size_pretty(AVG(pg_column_size(embedding))::bigint * COUNT(*)) as estimated_size,
        MIN(created_at) as first_record,
        MAX(created_at) as last_record
      FROM page_embeddings
      WHERE created_at::date = '2025-01-09'
      
      UNION ALL
      
      SELECT 
        'scraped_pages' as table_name,
        COUNT(*) as row_count,
        pg_size_pretty(AVG(length(content))::bigint * COUNT(*)) as estimated_size,
        MIN(scraped_at) as first_record,
        MAX(scraped_at) as last_record
      FROM scraped_pages
      WHERE scraped_at::date = '2025-01-09'
      
      UNION ALL
      
      SELECT 
        'messages' as table_name,
        COUNT(*) as row_count,
        pg_size_pretty(AVG(length(content))::bigint * COUNT(*)) as estimated_size,
        MIN(created_at) as first_record,
        MAX(created_at) as last_record
      FROM messages
      WHERE created_at::date = '2025-01-09'
    )
    SELECT * FROM jan9_data WHERE row_count > 0;
  `;
  
  const jan9Result = await executeSQL(jan9DataQuery, 'Checking data inserted on January 9th');
  if (jan9Result.success && jan9Result.result.length > 0) {
    console.log('\n📅 DATA INSERTED ON JANUARY 9TH:');
    console.log('─'.repeat(60));
    for (const row of jan9Result.result) {
      console.log(`\n${row.table_name}:`);
      console.log(`  Rows: ${row.row_count}`);
      console.log(`  Estimated Size: ${row.estimated_size}`);
      console.log(`  Time Range: ${row.first_record} to ${row.last_record}`);
    }
  }

  // 2. Check for duplicate embeddings
  const duplicateEmbeddingsQuery = `
    SELECT 
      content_hash,
      COUNT(*) as duplicate_count,
      pg_size_pretty(AVG(pg_column_size(embedding))::bigint * COUNT(*)) as wasted_space,
      array_agg(DISTINCT domain) as domains,
      MIN(created_at)::date as first_created,
      MAX(created_at)::date as last_created
    FROM page_embeddings
    GROUP BY content_hash
    HAVING COUNT(*) > 1
    ORDER BY COUNT(*) DESC
    LIMIT 10;
  `;
  
  const duplicatesResult = await executeSQL(duplicateEmbeddingsQuery, 'Checking for duplicate embeddings');
  if (duplicatesResult.success && duplicatesResult.result.length > 0) {
    console.log('\n⚠️  DUPLICATE EMBEDDINGS FOUND:');
    console.log('─'.repeat(60));
    console.log('Duplicates | Wasted Space | Domains | Date Range');
    console.log('─'.repeat(60));
    
    let totalWasted = 0;
    for (const row of duplicatesResult.result) {
      const count = String(row.duplicate_count).padEnd(10);
      const space = (row.wasted_space || '0').padEnd(12);
      const domains = row.domains.join(', ').substring(0, 20);
      const dateRange = `${row.first_created} to ${row.last_created}`;
      
      console.log(`${count} | ${space} | ${domains} | ${dateRange}`);
    }
  }

  // 3. Check for orphaned embeddings (embeddings without corresponding scraped_pages)
  const orphanedQuery = `
    SELECT 
      COUNT(*) as orphaned_count,
      pg_size_pretty(AVG(pg_column_size(embedding))::bigint * COUNT(*)) as wasted_space,
      COUNT(DISTINCT domain) as affected_domains
    FROM page_embeddings pe
    WHERE NOT EXISTS (
      SELECT 1 FROM scraped_pages sp
      WHERE sp.url = pe.url
        AND sp.domain = pe.domain
    );
  `;
  
  const orphanedResult = await executeSQL(orphanedQuery, 'Checking for orphaned embeddings');
  if (orphanedResult.success && orphanedResult.result[0]) {
    const orphaned = orphanedResult.result[0];
    if (orphaned.orphaned_count > 0) {
      console.log('\n⚠️  ORPHANED EMBEDDINGS:');
      console.log(`  Count: ${orphaned.orphaned_count}`);
      console.log(`  Wasted Space: ${orphaned.wasted_space}`);
      console.log(`  Affected Domains: ${orphaned.affected_domains}`);
    }
  }

  // 4. Check index bloat specifically
  const indexBloatQuery = `
    SELECT 
      schemaname,
      tablename,
      indexname,
      pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
      idx_scan as scans_since_reset,
      idx_tup_read,
      idx_tup_fetch
    FROM pg_stat_user_indexes
    WHERE schemaname = 'public'
      AND pg_relation_size(indexrelid) > 1048576  -- > 1MB
    ORDER BY pg_relation_size(indexrelid) DESC
    LIMIT 10;
  `;
  
  const indexBloatResult = await executeSQL(indexBloatQuery, 'Checking largest indexes');
  if (indexBloatResult.success) {
    console.log('\n📊 LARGEST INDEXES:');
    console.log('─'.repeat(80));
    console.log('Table.Index                                        | Size    | Scans');
    console.log('─'.repeat(80));
    
    for (const row of indexBloatResult.result) {
      const fullName = `${row.tablename}.${row.indexname}`.padEnd(50);
      const size = row.index_size.padEnd(7);
      const scans = String(row.scans_since_reset);
      
      console.log(`${fullName} | ${size} | ${scans}`);
    }
  }

  // 5. Check TOAST table sizes (large text/binary data stored separately)
  const toastQuery = `
    SELECT 
      c.relname AS table_name,
      pg_size_pretty(pg_relation_size(c.oid)) AS table_size,
      pg_size_pretty(pg_relation_size(t.oid)) AS toast_size,
      pg_size_pretty(pg_relation_size(c.oid) + pg_relation_size(t.oid)) AS total_size,
      ROUND(100.0 * pg_relation_size(t.oid) / NULLIF(pg_relation_size(c.oid) + pg_relation_size(t.oid), 0), 1) AS toast_percent
    FROM pg_class c
    LEFT JOIN pg_class t ON c.reltoastrelid = t.oid
    WHERE c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
      AND c.relkind = 'r'
      AND t.oid IS NOT NULL
      AND pg_relation_size(t.oid) > 1048576  -- TOAST > 1MB
    ORDER BY pg_relation_size(t.oid) DESC;
  `;
  
  const toastResult = await executeSQL(toastQuery, 'Checking TOAST table sizes');
  if (toastResult.success && toastResult.result.length > 0) {
    console.log('\n💾 TOAST TABLE SIZES (Large Object Storage):');
    console.log('─'.repeat(60));
    console.log('Table            | Table Size | TOAST Size | Total   | TOAST %');
    console.log('─'.repeat(60));
    
    for (const row of toastResult.result) {
      const tableName = row.table_name.padEnd(16);
      const tableSize = row.table_size.padEnd(10);
      const toastSize = row.toast_size.padEnd(10);
      const totalSize = row.total_size.padEnd(7);
      const toastPercent = `${row.toast_percent}%`;
      
      console.log(`${tableName} | ${tableSize} | ${toastSize} | ${totalSize} | ${toastPercent}`);
    }
  }

  // 6. Check for failed or stuck scrape jobs that might be holding data
  const scrapeJobsQuery = `
    SELECT 
      status,
      COUNT(*) as job_count,
      MIN(created_at) as oldest_job,
      MAX(created_at) as newest_job,
      AVG(EXTRACT(EPOCH FROM (completed_at - started_at))) as avg_duration_seconds
    FROM scrape_jobs
    WHERE created_at >= '2025-01-08'
      AND created_at <= '2025-01-10'
    GROUP BY status
    ORDER BY job_count DESC;
  `;
  
  const scrapeJobsResult = await executeSQL(scrapeJobsQuery, 'Checking scrape jobs around January 9th');
  if (scrapeJobsResult.success && scrapeJobsResult.result.length > 0) {
    console.log('\n🔄 SCRAPE JOBS (Jan 8-10):');
    console.log('─'.repeat(60));
    for (const row of scrapeJobsResult.result) {
      console.log(`Status: ${row.status}`);
      console.log(`  Count: ${row.job_count}`);
      console.log(`  Period: ${row.oldest_job} to ${row.newest_job}`);
      if (row.avg_duration_seconds) {
        console.log(`  Avg Duration: ${Math.round(row.avg_duration_seconds)}s`);
      }
    }
  }

  // 7. Check embedding vector dimensions and potential issues
  const vectorAnalysisQuery = `
    SELECT 
      COUNT(*) as total_embeddings,
      COUNT(DISTINCT domain) as unique_domains,
      MIN(vector_dimension(embedding)) as min_dimensions,
      MAX(vector_dimension(embedding)) as max_dimensions,
      AVG(vector_dimension(embedding)) as avg_dimensions,
      pg_size_pretty(AVG(pg_column_size(embedding))::bigint) as avg_embedding_size,
      pg_size_pretty(SUM(pg_column_size(embedding))::bigint) as total_embedding_size
    FROM page_embeddings;
  `;
  
  const vectorResult = await executeSQL(vectorAnalysisQuery, 'Analyzing embedding vectors');
  if (vectorResult.success && vectorResult.result[0]) {
    const vec = vectorResult.result[0];
    console.log('\n🔢 EMBEDDING VECTOR ANALYSIS:');
    console.log(`  Total Embeddings: ${vec.total_embeddings}`);
    console.log(`  Unique Domains: ${vec.unique_domains}`);
    console.log(`  Dimensions: ${vec.min_dimensions} - ${vec.max_dimensions} (avg: ${vec.avg_dimensions})`);
    console.log(`  Avg Size per Embedding: ${vec.avg_embedding_size}`);
    console.log(`  Total Embeddings Size: ${vec.total_embedding_size}`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 INVESTIGATION COMPLETE');
  
  console.log('\n💡 RECOMMENDATIONS:');
  console.log('1. Remove duplicate embeddings to save space');
  console.log('2. Clean up orphaned embeddings without scraped pages');
  console.log('3. Consider VACUUM FULL on page_embeddings table');
  console.log('4. Review embedding dimension size (may be using 1536 instead of smaller)');
}

// Run investigation
investigateJan9Growth().catch(console.error);