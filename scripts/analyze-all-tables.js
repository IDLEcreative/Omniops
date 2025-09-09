const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://birugqyuqhiahxvxeyqg.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeAllTables() {
  console.log('🔍 COMPREHENSIVE DATABASE TABLE ANALYSIS');
  console.log('=' .repeat(80));
  console.log(`📅 Analysis Date: ${new Date().toISOString()}`);
  console.log(`🌐 Database: ${supabaseUrl.split('.')[0].split('//')[1]}`);
  console.log('=' .repeat(80) + '\n');

  try {
    // Get all tables from information schema
    const { data: tables, error: tablesError } = await supabase.rpc('get_all_tables_info', {}, {
      get: true,
      head: false
    }).single();

    let allTables;
    
    if (tablesError) {
      // Fallback: query information_schema directly
      const { data, error } = await supabase
        .from('scraped_pages')
        .select('*', { count: 'exact', head: true });
      
      // Since we can't query information_schema directly, use known tables
      allTables = [
        'customer_configs',
        'scraped_pages',
        'website_content',
        'page_embeddings',
        'conversations',
        'messages',
        'structured_extractions',
        'content_refresh_jobs',
        'domains',
        'training_data',
        'customers',
        'businesses',
        'business_configs',
        'business_usage',
        'customer_verifications',
        'customer_access_logs',
        'customer_data_cache',
        'privacy_requests',
        'ai_optimized_content',
        'content_hashes',
        'page_content_references',
        'domain_patterns',
        'chat_sessions',
        'chat_messages'
      ];
    } else {
      allTables = tables.map(t => t.table_name);
    }

    const tableAnalysis = [];
    let totalRows = 0;
    let usedTables = 0;
    let emptyTables = 0;

    console.log('📊 TABLE USAGE ANALYSIS\n');
    console.log('Table Name'.padEnd(30) + ' | ' + 'Row Count'.padEnd(12) + ' | Status');
    console.log('-'.repeat(30) + '-+-' + '-'.repeat(12) + '-+' + '-'.repeat(20));

    // Check each table
    for (const tableName of allTables.sort()) {
      try {
        const { count, error } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });

        if (!error) {
          const status = count > 0 ? '✅ In Use' : '⚠️  Empty';
          const rowCount = count || 0;
          
          console.log(
            tableName.padEnd(30) + ' | ' + 
            rowCount.toString().padEnd(12) + ' | ' + 
            status
          );

          tableAnalysis.push({
            table: tableName,
            count: rowCount,
            status: count > 0 ? 'used' : 'empty'
          });

          totalRows += rowCount;
          if (rowCount > 0) usedTables++;
          else emptyTables++;
        } else {
          console.log(
            tableName.padEnd(30) + ' | ' + 
            'Error'.padEnd(12) + ' | ' + 
            '❌ Not Found'
          );
          
          tableAnalysis.push({
            table: tableName,
            count: 0,
            status: 'not_found'
          });
        }
      } catch (err) {
        console.log(
          tableName.padEnd(30) + ' | ' + 
          'Error'.padEnd(12) + ' | ' + 
          '❌ Access Error'
        );
      }
    }

    console.log('\n' + '=' .repeat(80));
    console.log('\n📈 SUMMARY STATISTICS\n');
    console.log(`Total Tables Checked: ${allTables.length}`);
    console.log(`Tables with Data: ${usedTables} (${Math.round(usedTables/allTables.length*100)}%)`);
    console.log(`Empty Tables: ${emptyTables} (${Math.round(emptyTables/allTables.length*100)}%)`);
    console.log(`Total Rows Across All Tables: ${totalRows.toLocaleString()}`);

    // Group tables by category
    console.log('\n' + '=' .repeat(80));
    console.log('\n🗂️  TABLES BY CATEGORY\n');

    const categories = {
      'Core Business': ['customers', 'customer_configs', 'domains'],
      'Content & Scraping': ['scraped_pages', 'website_content', 'structured_extractions', 
                            'content_refresh_jobs', 'content_hashes', 'page_content_references', 
                            'domain_patterns'],
      'AI & Embeddings': ['page_embeddings', 'ai_optimized_content', 'training_data'],
      'Chat & Communication': ['conversations', 'messages', 'chat_sessions', 'chat_messages'],
      'Privacy & Compliance': ['customer_verifications', 'customer_access_logs', 
                              'customer_data_cache', 'privacy_requests'],
      'Multi-tenant': ['businesses', 'business_configs', 'business_usage']
    };

    for (const [category, tables] of Object.entries(categories)) {
      console.log(`\n### ${category}`);
      for (const table of tables) {
        const analysis = tableAnalysis.find(a => a.table === table);
        if (analysis) {
          const icon = analysis.status === 'used' ? '✅' : 
                      analysis.status === 'empty' ? '⚠️' : '❌';
          console.log(`  ${icon} ${table}: ${analysis.count} rows`);
        }
      }
    }

    // Check for sample data in used tables
    console.log('\n' + '=' .repeat(80));
    console.log('\n🔎 SAMPLE DATA FROM ACTIVE TABLES\n');

    for (const analysis of tableAnalysis) {
      if (analysis.status === 'used' && analysis.count > 0) {
        const { data, error } = await supabase
          .from(analysis.table)
          .select('*')
          .limit(1);

        if (data && data.length > 0) {
          console.log(`\n📌 ${analysis.table.toUpperCase()}`);
          const sample = data[0];
          const keys = Object.keys(sample).slice(0, 5);
          console.log(`  Columns: ${keys.join(', ')}${Object.keys(sample).length > 5 ? '...' : ''}`);
          
          // Show created_at if exists
          if (sample.created_at) {
            console.log(`  Latest Entry: ${new Date(sample.created_at).toLocaleDateString()}`);
          }
        }
      }
    }

    // Identify potentially deprecated tables
    console.log('\n' + '=' .repeat(80));
    console.log('\n⚠️  RECOMMENDATIONS\n');

    const emptyTablesList = tableAnalysis
      .filter(a => a.status === 'empty')
      .map(a => a.table);

    if (emptyTablesList.length > 0) {
      console.log('Empty tables that might be unused:');
      emptyTablesList.forEach(table => {
        console.log(`  - ${table}`);
      });
    }

    const notFoundTables = tableAnalysis
      .filter(a => a.status === 'not_found')
      .map(a => a.table);

    if (notFoundTables.length > 0) {
      console.log('\nTables referenced in code but not found in database:');
      notFoundTables.forEach(table => {
        console.log(`  - ${table} (might need migration or removal from code)`);
      });
    }

  } catch (error) {
    console.error('❌ Analysis failed:', error.message);
  }
}

analyzeAllTables();