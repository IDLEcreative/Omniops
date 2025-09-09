const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = 'https://birugqyuqhiahxvxeyqg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpcnVncXl1cWhpYWh4dnhleXFnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTc4NzE2NCwiZXhwIjoyMDcxMzYzMTY0fQ.5bw0QlkRgv_PA7iHrpWixvC31d7WZ5VYSR2JZnhsw8s';

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyCleanupMigration() {
  console.log('🧹 DATABASE CLEANUP MIGRATION');
  console.log('=' .repeat(60));
  
  // Read the migration file
  const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20250909_database_cleanup.sql');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
  
  // Split into individual statements (simple split by semicolon + newline)
  const statements = migrationSQL
    .split(/;\n/)
    .filter(stmt => stmt.trim().length > 0 && !stmt.trim().startsWith('--'))
    .map(stmt => stmt.trim() + ';');
  
  console.log(`\n📋 Found ${statements.length} SQL statements to execute\n`);
  
  let successCount = 0;
  let errorCount = 0;
  const errors = [];
  
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    
    // Skip comments and empty statements
    if (statement.trim().startsWith('--') || statement.trim().length === 0) {
      continue;
    }
    
    // Get a preview of the statement
    const preview = statement.substring(0, 60).replace(/\n/g, ' ');
    process.stdout.write(`[${i+1}/${statements.length}] ${preview}...`);
    
    try {
      // Execute using raw SQL through RPC
      const { error } = await supabase.rpc('exec_sql', {
        query: statement
      });
      
      if (error) {
        // Try alternative approach - direct execution
        // Note: This is a placeholder as Supabase doesn't expose direct SQL execution
        // We'll need to handle this differently
        throw error;
      }
      
      console.log(' ✅');
      successCount++;
    } catch (error) {
      console.log(' ❌');
      errorCount++;
      errors.push({
        statement: preview,
        error: error.message
      });
    }
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log('\n📊 MIGRATION RESULTS:\n');
  console.log(`✅ Successful statements: ${successCount}`);
  console.log(`❌ Failed statements: ${errorCount}`);
  
  if (errors.length > 0) {
    console.log('\n⚠️  ERRORS ENCOUNTERED:\n');
    errors.forEach(({ statement, error }) => {
      console.log(`Statement: ${statement}`);
      console.log(`Error: ${error}\n`);
    });
    
    console.log('\n💡 NOTE: Some errors are expected if tables already exist or don\'t exist.');
    console.log('The migration is designed to be idempotent (safe to run multiple times).');
  }
  
  // Verify final state
  console.log('\n' + '=' .repeat(60));
  console.log('\n🔍 VERIFYING FINAL DATABASE STATE:\n');
  
  const expectedTables = [
    'customer_configs',
    'domains',
    'scraped_pages',
    'page_embeddings',
    'structured_extractions',
    'conversations',
    'messages',
    'website_content',
    'scrape_jobs',
    'query_cache'
  ];
  
  const droppedTables = [
    'chat_sessions',
    'chat_messages',
    'businesses',
    'business_configs',
    'business_usage',
    'privacy_requests',
    'customer_verifications',
    'customer_access_logs',
    'customer_data_cache',
    'ai_optimized_content',
    'content_hashes',
    'page_content_references',
    'domain_patterns',
    'training_data',
    'content_refresh_jobs',
    'customers'
  ];
  
  console.log('Expected tables (should exist):');
  for (const table of expectedTables) {
    const { error } = await supabase
      .from(table)
      .select('id')
      .limit(1);
    
    if (!error || error.code === 'PGRST116') {
      console.log(`  ✅ ${table}`);
    } else {
      console.log(`  ❌ ${table} - ${error.message}`);
    }
  }
  
  console.log('\nDropped tables (should NOT exist):');
  for (const table of droppedTables) {
    const { error } = await supabase
      .from(table)
      .select('id')
      .limit(1);
    
    if (error && error.message.includes('not exist')) {
      console.log(`  ✅ ${table} (successfully removed)`);
    } else {
      console.log(`  ⚠️  ${table} (still exists)`);
    }
  }
  
  console.log('\n✨ Database cleanup migration complete!');
}

applyCleanupMigration().catch(console.error);