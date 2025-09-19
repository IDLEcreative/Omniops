
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

async function analyzeDatabaseSize() {
  console.log('🔍 DATABASE SIZE ANALYSIS');
  console.log('='.repeat(60));
  console.log('Investigating unusual database growth on January 9th...\n');

  // 1. Check overall database size
  const dbSizeQuery = `
    SELECT 
      pg_database.datname as database_name,
      pg_size_pretty(pg_database_size(pg_database.datname)) as database_size,
      pg_database_size(pg_database.datname) as size_bytes
    FROM pg_database
    WHERE datname = current_database();
  `;
  
  const dbSizeResult = await executeSQL(dbSizeQuery, 'Checking overall database size');
  if (dbSizeResult.success && dbSizeResult.result[0]) {
    console.log(`\n📊 TOTAL DATABASE SIZE: ${dbSizeResult.result[0].database_size}`);
  }

  // 2. Get table sizes with toast and indexes
  const tableSizesQuery = `
    WITH table_sizes AS (
      SELECT 
        schemaname,
        tablename,
        pg_total_relation_size(schemaname||'.'||tablename) as total_size,
        pg_relation_size(schemaname||'.'||tablename) as table_size,
        pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename) as external_size
      FROM pg_tables
      WHERE schemaname = 'public'
    )
    SELECT 
      tablename,
      pg_size_pretty(total_size) as total_size,
      pg_size_pretty(table_size) as table_only,
      pg_size_pretty(external_size) as indexes_toast,
      ROUND(100.0 * total_size / SUM(total_size) OVER (), 1) as percent_of_db
    FROM table_sizes
    WHERE total_size > 0
    ORDER BY total_size DESC;
  `;
  
  const tableSizesResult = await executeSQL(tableSizesQuery, 'Analyzing table sizes');
  if (tableSizesResult.success) {
    console.log('\n📋 TABLE SIZES (Including Indexes & TOAST):');
    console.log('─'.repeat(80));
    console.log('Table Name                | Total Size | Table Only | Indexes+TOAST | % of DB');
    console.log('─'.repeat(80));
    
    for (const row of tableSizesResult.result) {
      const tableName = row.tablename.padEnd(25);
      const totalSize = row.total_size.padEnd(10);
      const tableOnly = row.table_only.padEnd(10);
      const indexesToast = row.indexes_toast.padEnd(13);
      const percent = `${row.percent_of_db}%`.padEnd(7);
      
      console.log(`${tableName} | ${totalSize} | ${tableOnly} | ${indexesToast} | ${percent}`);
    }
  }

  // 3. Check for table bloat (dead tuples)
  const bloatQuery = `
    SELECT 
      schemaname,
      tablename,
      n_live_tup as live_tuples,
      n_dead_tup as dead_tuples,
      ROUND(100.0 * n_dead_tup / NULLIF(n_live_tup + n_dead_tup, 0), 1) as dead_percent,
      pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as table_size,
      last_vacuum,
      last_autovacuum,
      last_analyze,
      last_autoanalyze
    FROM pg_stat_user_tables
    WHERE schemaname = 'public'
      AND n_dead_tup > 1000
    ORDER BY n_dead_tup DESC;
  `;
  
  const bloatResult = await executeSQL(bloatQuery, 'Checking for table bloat');
  if (bloatResult.success && bloatResult.result.length > 0) {
    console.log('\n⚠️  TABLES WITH SIGNIFICANT DEAD TUPLES:');
    console.log('─'.repeat(80));
    console.log('Table Name            | Dead Tuples | Dead % | Size    | Last Vacuum');
    console.log('─'.repeat(80));
    
    for (const row of bloatResult.result) {
      const tableName = row.tablename.padEnd(20);
      const deadTuples = String(row.dead_tuples).padEnd(11);
      const deadPercent = `${row.dead_percent || 0}%`.padEnd(6);
      const size = row.table_size.padEnd(7);
      const lastVacuum = row.last_autovacuum ? 
        new Date(row.last_autovacuum).toISOString().split('T')[0] : 'Never';
      
      console.log(`${tableName} | ${deadTuples} | ${deadPercent} | ${size} | ${lastVacuum}`);
    }
  }

  // 4. Check WAL size and replication slots
  const walQuery = `
    SELECT 
      slot_name,
      slot_type,
      active,
      pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn)) as retained_wal_size,
      age(xmin) as transaction_age
    FROM pg_replication_slots
    WHERE pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn) > 0;
  `;
  
  const walResult = await executeSQL(walQuery, 'Checking WAL and replication slots');
  if (walResult.success && walResult.result.length > 0) {
    console.log('\n📝 WAL RETENTION BY REPLICATION SLOTS:');
    console.log('─'.repeat(60));
    for (const row of walResult.result) {
      console.log(`Slot: ${row.slot_name}`);
      console.log(`  Type: ${row.slot_type}, Active: ${row.active}`);
      console.log(`  Retained WAL: ${row.retained_wal_size}`);
      console.log(`  Transaction Age: ${row.transaction_age || 'N/A'}`);
    }
  }

  // 5. Check for long-running transactions
  const transactionQuery = `
    SELECT 
      pid,
      usename,
      application_name,
      state,
      NOW() - xact_start as transaction_duration,
      NOW() - query_start as query_duration,
      LEFT(query, 100) as query_snippet
    FROM pg_stat_activity
    WHERE xact_start IS NOT NULL
      AND NOW() - xact_start > interval '1 hour'
    ORDER BY xact_start;
  `;
  
  const transactionResult = await executeSQL(transactionQuery, 'Checking long-running transactions');
  if (transactionResult.success && transactionResult.result.length > 0) {
    console.log('\n⚠️  LONG-RUNNING TRANSACTIONS:');
    console.log('─'.repeat(60));
    for (const row of transactionResult.result) {
      console.log(`PID: ${row.pid}, User: ${row.usename}`);
      console.log(`  Duration: ${row.transaction_duration}`);
      console.log(`  Query: ${row.query_snippet}...`);
    }
  }

  // 6. Check temp files and temp tables
  const tempQuery = `
    SELECT 
      COUNT(*) as temp_tables_count,
      pg_size_pretty(COALESCE(SUM(pg_total_relation_size(c.oid)), 0)) as temp_tables_size
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname LIKE 'pg_temp%';
  `;
  
  const tempResult = await executeSQL(tempQuery, 'Checking temporary tables');
  if (tempResult.success && tempResult.result[0]) {
    const count = tempResult.result[0].temp_tables_count;
    const size = tempResult.result[0].temp_tables_size;
    if (count > 0) {
      console.log(`\n⚠️  TEMPORARY TABLES: ${count} tables using ${size}`);
    }
  }

  // 7. Check for orphaned large objects
  const lobQuery = `
    SELECT 
      COUNT(*) as orphaned_count,
      pg_size_pretty(SUM(pg_column_size(data))) as total_size
    FROM pg_largeobject
    WHERE loid NOT IN (
      SELECT unnest(string_to_array(array_to_string(
        array_agg(distinct attname || '::oid'), ','), ','))::oid
      FROM pg_attribute
      WHERE atttypid = 'oid'::regtype
    );
  `;
  
  // Note: This query might fail if there are no large objects
  const lobResult = await executeSQL(lobQuery, 'Checking for orphaned large objects');
  if (lobResult.success && lobResult.result[0] && lobResult.result[0].orphaned_count > 0) {
    console.log(`\n⚠️  ORPHANED LARGE OBJECTS: ${lobResult.result[0].orphaned_count} objects using ${lobResult.result[0].total_size}`);
  }

  // 8. Get recent data growth (if we can access statistics)
  const growthQuery = `
    SELECT 
      schemaname,
      tablename,
      n_tup_ins - n_tup_del as net_rows_added,
      n_tup_ins as total_inserts,
      n_tup_upd as total_updates,
      n_tup_del as total_deletes,
      pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as current_size
    FROM pg_stat_user_tables
    WHERE schemaname = 'public'
      AND (n_tup_ins > 10000 OR n_tup_upd > 10000)
    ORDER BY n_tup_ins DESC
    LIMIT 10;
  `;
  
  const growthResult = await executeSQL(growthQuery, 'Checking recent data activity');
  if (growthResult.success && growthResult.result.length > 0) {
    console.log('\n📈 TABLES WITH HIGH ACTIVITY:');
    console.log('─'.repeat(80));
    console.log('Table Name            | Inserts   | Updates   | Deletes   | Net Added | Size');
    console.log('─'.repeat(80));
    
    for (const row of growthResult.result) {
      const tableName = row.tablename.padEnd(20);
      const inserts = String(row.total_inserts).padEnd(9);
      const updates = String(row.total_updates).padEnd(9);
      const deletes = String(row.total_deletes).padEnd(9);
      const netAdded = String(row.net_rows_added).padEnd(9);
      const size = row.current_size;
      
      console.log(`${tableName} | ${inserts} | ${updates} | ${deletes} | ${netAdded} | ${size}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 ANALYSIS COMPLETE');
}

// Run analysis
analyzeDatabaseSize().catch(console.error);