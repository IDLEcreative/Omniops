import { executeSQL, getSupabaseConfig } from '../../supabase-config.js';

const config = getSupabaseConfig();

export async function checkIndexUsage() {
  console.log('\n📊 Analyzing Index Usage...');

  const indexQuery = `
    SELECT 
      t.tablename,
      indexname,
      idx_scan as scans,
      idx_tup_read as tuples_read,
      idx_tup_fetch as tuples_fetched,
      pg_size_pretty(pg_relation_size(indexrelid)) as size,
      indexdef
    FROM pg_stat_user_indexes i
    JOIN pg_indexes pi ON i.indexname = pi.indexname
    WHERE i.schemaname = 'public'
    ORDER BY idx_scan DESC
    LIMIT 20;
  `;

  const result = await executeSQL(config, indexQuery);
  const unusedIndexes = result.filter((idx: any) => idx.scans === 0);

  console.log(`  Total indexes analyzed: ${result.length}`);
  console.log(`  Unused indexes: ${unusedIndexes.length}`);
  if (unusedIndexes.length > 0) {
    console.log('  ⚠️  Unused indexes (consider removal):');
    unusedIndexes.forEach((idx: any) => console.log(`    - ${idx.indexname} on ${idx.tablename} (${idx.size})`));
  }
}
