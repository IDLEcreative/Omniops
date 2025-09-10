const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

// Supabase Management API configuration
const SUPABASE_ACCESS_TOKEN = 'sbp_f30783ba26b0a6ae2bba917988553bd1d5f76d97';
const PROJECT_REF = 'birugqyuqhiahxvxeyqg';

// Categorized unused indexes from performance advisor
const UNUSED_INDEXES = {
  scrape_jobs: [
    'idx_scrape_jobs_status',
    'idx_scrape_jobs_domain_id', 
    'idx_scrape_jobs_customer_config_id',
    'idx_scrape_jobs_priority_status',
    'idx_scrape_jobs_queue_job'
  ],
  customer_configs: [
    'idx_customer_configs_customer_id'
  ],
  domains: [
    'idx_domains_user_id'
  ],
  website_content: [
    'idx_website_content_domain',
    'idx_website_content_url',
    'idx_website_content_type',
    'idx_website_content_hash'
  ],
  page_embeddings: [
    'idx_page_embeddings_keywords_gin',
    'idx_page_embeddings_vector_hnsw',
    'idx_page_embeddings_entities_gin',
    'idx_page_embeddings_price_range',
    'idx_page_embeddings_hnsw'
  ],
  scraped_pages: [
    'idx_scraped_pages_content_gin',
    'idx_scraped_pages_title_gin',
    'idx_scraped_pages_domain_scraped',
    'idx_scraped_pages_url_completed'
  ],
  structured_extractions: [
    'idx_structured_extractions_domain',
    'idx_structured_extractions_url'
  ],
  conversations: [
    'idx_conversations_domain_id',
    'idx_conversations_customer_id'
  ]
};

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
    console.log(`✅ Success`);
    return { success: true, result };
    
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function getIndexDefinitions() {
  console.log('\n🔍 RETRIEVING INDEX DEFINITIONS FOR BACKUP...');
  
  const query = `
    SELECT 
      schemaname,
      tablename,
      indexname,
      indexdef
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname IN (${Object.values(UNUSED_INDEXES)
        .flat()
        .map(idx => `'${idx}'`)
        .join(',')})
    ORDER BY tablename, indexname;
  `;
  
  const result = await executeSQL(query, 'Fetching index definitions');
  
  if (result.success && result.result) {
    // Save backup to file
    const backup = {
      timestamp: new Date().toISOString(),
      indexes: result.result,
      dropScript: generateDropScript(),
      recreateScript: generateRecreateScript(result.result)
    };
    
    const backupPath = path.join(__dirname, `index-backup-${Date.now()}.json`);
    fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2));
    console.log(`💾 Backup saved to: ${backupPath}`);
    
    return result.result;
  }
  
  return null;
}

function generateDropScript() {
  const statements = [];
  
  for (const [table, indexes] of Object.entries(UNUSED_INDEXES)) {
    statements.push(`-- Dropping unused indexes from ${table}`);
    for (const index of indexes) {
      statements.push(`DROP INDEX IF EXISTS public.${index};`);
    }
    statements.push('');
  }
  
  return statements.join('\n');
}

function generateRecreateScript(indexDefs) {
  if (!indexDefs || indexDefs.length === 0) {
    return '-- No indexes to recreate';
  }
  
  const statements = ['-- Script to recreate indexes if needed'];
  let currentTable = '';
  
  for (const idx of indexDefs) {
    if (idx.tablename !== currentTable) {
      currentTable = idx.tablename;
      statements.push(`\n-- Indexes for ${currentTable}`);
    }
    statements.push(`${idx.indexdef};`);
  }
  
  return statements.join('\n');
}

async function analyzeIndexUsage() {
  console.log('\n📊 ANALYZING INDEX USAGE STATISTICS...');
  
  const query = `
    SELECT 
      t.schemaname,
      t.tablename,
      t.indexname,
      s.idx_scan as index_scans,
      s.idx_tup_read as tuples_read,
      s.idx_tup_fetch as tuples_fetched,
      pg_size_pretty(pg_relation_size(s.indexrelid)) as index_size
    FROM pg_indexes t
    LEFT JOIN pg_stat_user_indexes s 
      ON t.schemaname = s.schemaname 
      AND t.tablename = s.relname 
      AND t.indexname = s.indexrelname
    WHERE t.schemaname = 'public'
      AND t.indexname IN (${Object.values(UNUSED_INDEXES)
        .flat()
        .map(idx => `'${idx}'`)
        .join(',')})
    ORDER BY s.idx_scan, t.tablename, t.indexname;
  `;
  
  const result = await executeSQL(query, 'Analyzing index statistics');
  
  if (result.success && result.result) {
    console.log('\n📈 INDEX USAGE STATISTICS:');
    console.log('─'.repeat(80));
    
    let totalSize = 0;
    for (const idx of result.result) {
      const scans = idx.index_scans || 0;
      const size = idx.index_size || 'N/A';
      console.log(`  ${idx.tablename}.${idx.indexname}:`);
      console.log(`    Scans: ${scans}, Size: ${size}`);
    }
  }
  
  return result;
}

async function dropUnusedIndexes(dryRun = true) {
  const mode = dryRun ? 'DRY RUN' : 'EXECUTION';
  console.log(`\n🧹 DROPPING UNUSED INDEXES (${mode} MODE)`);
  console.log('='.repeat(60));
  
  const dropScript = generateDropScript();
  
  if (dryRun) {
    console.log('\n📋 SQL SCRIPT THAT WOULD BE EXECUTED:');
    console.log('─'.repeat(60));
    console.log(dropScript);
    console.log('─'.repeat(60));
    
    // Calculate estimated impact
    const totalIndexes = Object.values(UNUSED_INDEXES).flat().length;
    console.log(`\n📊 IMPACT SUMMARY:`);
    console.log(`  • Total indexes to drop: ${totalIndexes}`);
    console.log(`  • Tables affected: ${Object.keys(UNUSED_INDEXES).length}`);
    console.log(`  • Expected benefits:`);
    console.log(`    - Reduced storage overhead`);
    console.log(`    - Faster INSERT/UPDATE/DELETE operations`);
    console.log(`    - Simplified query planning`);
    
    return { success: true, dryRun: true };
  }
  
  // Execute the actual drop
  const result = await executeSQL(dropScript, 'Dropping unused indexes');
  
  if (result.success) {
    console.log('\n✅ SUCCESSFULLY DROPPED ALL UNUSED INDEXES!');
    
    // Generate rollback script
    const rollbackPath = path.join(__dirname, `index-rollback-${Date.now()}.sql`);
    const indexDefs = await getIndexDefinitions();
    if (indexDefs) {
      const rollbackScript = generateRecreateScript(indexDefs);
      fs.writeFileSync(rollbackPath, rollbackScript);
      console.log(`\n💾 Rollback script saved to: ${rollbackPath}`);
    }
  }
  
  return result;
}

async function verifyIndexRemoval() {
  console.log('\n🔍 VERIFYING INDEX REMOVAL...');
  
  const query = `
    SELECT 
      tablename,
      indexname
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname IN (${Object.values(UNUSED_INDEXES)
        .flat()
        .map(idx => `'${idx}'`)
        .join(',')});
  `;
  
  const result = await executeSQL(query, 'Checking for remaining indexes');
  
  if (result.success) {
    if (result.result && result.result.length > 0) {
      console.log('\n⚠️  Some indexes still exist:');
      for (const idx of result.result) {
        console.log(`  - ${idx.tablename}.${idx.indexname}`);
      }
    } else {
      console.log('\n✅ All unused indexes have been successfully removed!');
    }
  }
  
  return result;
}

async function main() {
  console.log('🚀 UNUSED INDEX CLEANUP UTILITY');
  console.log('='.repeat(60));
  console.log('This script will remove 24 unused indexes identified by');
  console.log('the Supabase performance advisor.');
  console.log('');
  
  // Parse command line arguments
  const args = process.argv.slice(2);
  const isDryRun = !args.includes('--execute');
  const skipBackup = args.includes('--skip-backup');
  
  if (isDryRun) {
    console.log('⚠️  Running in DRY RUN mode. Use --execute to actually drop indexes.');
  } else {
    console.log('⚠️  Running in EXECUTE mode. Indexes will be permanently dropped!');
    console.log('    Press Ctrl+C within 5 seconds to cancel...');
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
  
  try {
    // Step 1: Backup current index definitions
    if (!skipBackup && !isDryRun) {
      await getIndexDefinitions();
    }
    
    // Step 2: Analyze current usage
    await analyzeIndexUsage();
    
    // Step 3: Drop indexes
    await dropUnusedIndexes(isDryRun);
    
    // Step 4: Verify removal (only if executed)
    if (!isDryRun) {
      await verifyIndexRemoval();
    }
    
    console.log('\n✨ Index cleanup process complete!');
    
    if (isDryRun) {
      console.log('\n💡 To execute the cleanup, run:');
      console.log('   node scripts/cleanup-unused-indexes.js --execute');
    }
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    process.exit(1);
  }
}

// Run the cleanup
main().catch(console.error);