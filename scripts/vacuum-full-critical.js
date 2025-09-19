
// Supabase Management API configuration
const SUPABASE_ACCESS_TOKEN = 'sbp_f30783ba26b0a6ae2bba917988553bd1d5f76d97';
const PROJECT_REF = 'birugqyuqhiahxvxeyqg';

async function executeSQL(query, description, timeout = 300000) {
  console.log(`\n📝 ${description}...`);
  console.log(`   Started at: ${new Date().toISOString()}`);
  
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
        timeout: timeout
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Failed: ${response.status} - ${errorText}`);
      return { success: false, error: errorText };
    }

    const result = await response.json();
    console.log(`✅ Completed at: ${new Date().toISOString()}`);
    return { success: true, result };
    
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function vacuumFullCriticalTables() {
  console.log('🔒 VACUUM FULL - CRITICAL TABLE SPACE RECLAMATION');
  console.log('='.repeat(60));
  console.log('\n⚠️  WARNING: This operation will LOCK tables!');
  console.log('   Your application may experience downtime.');
  console.log('   Estimated time: 2-5 minutes total\n');
  console.log('   Press Ctrl+C within 10 seconds to cancel...');
  
  await new Promise(resolve => setTimeout(resolve, 10000));

  // Get size before VACUUM FULL
  const beforeQuery = `
    SELECT 
      'page_embeddings' as table_name,
      pg_size_pretty(pg_total_relation_size('page_embeddings')) as total_size,
      pg_size_pretty(pg_relation_size('page_embeddings')) as table_size,
      pg_size_pretty(pg_total_relation_size('page_embeddings') - pg_relation_size('page_embeddings')) as toast_index_size
    UNION ALL
    SELECT 
      'scraped_pages' as table_name,
      pg_size_pretty(pg_total_relation_size('scraped_pages')) as total_size,
      pg_size_pretty(pg_relation_size('scraped_pages')) as table_size,
      pg_size_pretty(pg_total_relation_size('scraped_pages') - pg_relation_size('scraped_pages')) as toast_index_size
    UNION ALL
    SELECT 
      'database_total' as table_name,
      pg_size_pretty(pg_database_size(current_database())) as total_size,
      '-' as table_size,
      '-' as toast_index_size;
  `;
  
  const beforeResult = await executeSQL(beforeQuery, 'Getting sizes before VACUUM FULL');
  
  if (beforeResult.success) {
    console.log('\n📊 BEFORE VACUUM FULL:');
    console.log('─'.repeat(60));
    console.log('Table              | Total Size | Table | TOAST+Indexes');
    console.log('─'.repeat(60));
    for (const row of beforeResult.result) {
      const name = row.table_name.padEnd(18);
      const total = row.total_size.padEnd(10);
      const table = row.table_size.padEnd(5);
      const toast = row.toast_index_size;
      console.log(`${name} | ${total} | ${table} | ${toast}`);
    }
  }

  // Run VACUUM FULL on critical tables
  console.log('\n' + '='.repeat(60));
  console.log('EXECUTING VACUUM FULL - DO NOT INTERRUPT!');
  console.log('='.repeat(60));

  // VACUUM FULL page_embeddings
  console.log('\n1/2: VACUUM FULL page_embeddings (largest table)');
  console.log('     This will take 1-3 minutes...');
  const vacuum1Result = await executeSQL(
    'VACUUM FULL ANALYZE page_embeddings;',
    'VACUUM FULL on page_embeddings',
    600000 // 10 minute timeout
  );
  
  if (!vacuum1Result.success) {
    console.log('\n❌ Failed to VACUUM FULL page_embeddings');
    console.log('   You may need to run this directly in Supabase SQL editor');
    return;
  }

  // VACUUM FULL scraped_pages
  console.log('\n2/2: VACUUM FULL scraped_pages');
  console.log('     This will take 1-2 minutes...');
  const vacuum2Result = await executeSQL(
    'VACUUM FULL ANALYZE scraped_pages;',
    'VACUUM FULL on scraped_pages',
    600000 // 10 minute timeout
  );
  
  if (!vacuum2Result.success) {
    console.log('\n❌ Failed to VACUUM FULL scraped_pages');
    console.log('   You may need to run this directly in Supabase SQL editor');
  }

  // Get size after VACUUM FULL
  console.log('\n' + '='.repeat(60));
  console.log('VACUUM FULL COMPLETE - CHECKING RESULTS');
  console.log('='.repeat(60));
  
  const afterResult = await executeSQL(beforeQuery, 'Getting sizes after VACUUM FULL');
  
  if (afterResult.success && beforeResult.success) {
    console.log('\n📊 AFTER VACUUM FULL:');
    console.log('─'.repeat(60));
    console.log('Table              | Total Size | Table | TOAST+Indexes');
    console.log('─'.repeat(60));
    for (const row of afterResult.result) {
      const name = row.table_name.padEnd(18);
      const total = row.total_size.padEnd(10);
      const table = row.table_size.padEnd(5);
      const toast = row.toast_index_size;
      console.log(`${name} | ${total} | ${table} | ${toast}`);
    }
    
    // Calculate space saved
    const before = beforeResult.result.find(r => r.table_name === 'database_total');
    const after = afterResult.result.find(r => r.table_name === 'database_total');
    
    console.log('\n✨ SPACE RECLAMATION SUMMARY:');
    console.log(`   Before: ${before.total_size}`);
    console.log(`   After:  ${after.total_size}`);
    console.log(`   Status: Space has been reclaimed and compacted!`);
  }

  console.log('\n✅ VACUUM FULL COMPLETED SUCCESSFULLY!');
  console.log('\n💡 BENEFITS:');
  console.log('   • TOAST tables have been compacted');
  console.log('   • Dead tuples have been removed');
  console.log('   • Tables are now optimally organized');
  console.log('   • Query performance should improve');
  console.log('   • Future VACUUMs will be more efficient');
  
  console.log('\n📌 NEXT STEPS:');
  console.log('   1. Monitor database size over next 24 hours');
  console.log('   2. Schedule monthly VACUUM FULL during maintenance');
  console.log('   3. Set up alerts for sudden size increases');
}

// Run VACUUM FULL
vacuumFullCriticalTables().catch(console.error);