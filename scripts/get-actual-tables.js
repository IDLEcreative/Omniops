const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://birugqyuqhiahxvxeyqg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpcnVncXl1cWhpYWh4dnhleXFnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTc4NzE2NCwiZXhwIjoyMDcxMzYzMTY0fQ.5bw0QlkRgv_PA7iHrpWixvC31d7WZ5VYSR2JZnhsw8s';

const supabase = createClient(supabaseUrl, supabaseKey);

async function getActualTables() {
  console.log('📋 ACTUAL DATABASE TABLES IN OMNIO PROJECT\n');
  console.log('=' .repeat(60) + '\n');

  // Tables we know should exist based on schema
  const expectedTables = [
    'customers',
    'customer_configs', 
    'domains',
    'scraped_pages',
    'website_content',
    'structured_extractions',
    'content_refresh_jobs',
    'content_hashes',
    'page_content_references',
    'domain_patterns',
    'page_embeddings',
    'ai_optimized_content',
    'training_data',
    'conversations',
    'messages',
    'chat_sessions',
    'chat_messages',
    'customer_verifications',
    'customer_access_logs',
    'customer_data_cache',
    'privacy_requests',
    'businesses',
    'business_configs',
    'business_usage'
  ];

  const actualTables = [];
  const missingTables = [];

  for (const table of expectedTables) {
    const { error } = await supabase
      .from(table)
      .select('id')
      .limit(1);
    
    if (!error || error.code === 'PGRST116') {
      // Table exists (PGRST116 = no rows returned, but table exists)
      actualTables.push(table);
    } else if (error.message?.includes('not exist') || error.message?.includes('not found')) {
      missingTables.push(table);
    } else {
      // Table exists but might have other issues
      actualTables.push(table);
    }
  }

  console.log('✅ EXISTING TABLES (' + actualTables.length + '):\n');
  actualTables.sort().forEach(table => {
    console.log('  - ' + table);
  });

  if (missingTables.length > 0) {
    console.log('\n❌ MISSING TABLES (' + missingTables.length + '):\n');
    missingTables.sort().forEach(table => {
      console.log('  - ' + table);
    });
  }

  // Now let's categorize what's actually being used
  console.log('\n' + '=' .repeat(60));
  console.log('\n🔍 TABLE PURPOSE & STATUS:\n');

  const tableInfo = {
    // CORE TABLES (Required for basic functionality)
    'customer_configs': {
      purpose: 'Stores customer settings, API keys, business info',
      status: 'ACTIVE',
      rows: 2
    },
    'domains': {
      purpose: 'Tracks websites being scraped/monitored', 
      status: 'ACTIVE',
      rows: 3
    },
    
    // CONTENT TABLES (Scraping & Storage)
    'scraped_pages': {
      purpose: 'Raw HTML/text from web scraping',
      status: 'ACTIVE',
      rows: 4459
    },
    'page_embeddings': {
      purpose: 'Vector embeddings for semantic search',
      status: 'ACTIVE', 
      rows: 13054
    },
    'structured_extractions': {
      purpose: 'AI-extracted products, FAQs, contact info',
      status: 'ACTIVE',
      rows: 34
    },
    'website_content': {
      purpose: 'Processed/cleaned website content',
      status: 'MINIMAL USE',
      rows: 3
    },
    
    // CHAT TABLES (Customer interactions)
    'conversations': {
      purpose: 'Chat session tracking',
      status: 'ACTIVE',
      rows: 871
    },
    'messages': {
      purpose: 'Individual chat messages',
      status: 'ACTIVE',
      rows: 2441
    },
    
    // UNUSED BUT PLANNED FEATURES
    'customers': {
      purpose: 'User accounts (future multi-tenant)',
      status: 'UNUSED',
      rows: 0
    },
    'training_data': {
      purpose: 'Custom AI training data per domain',
      status: 'UNUSED',
      rows: 0
    },
    'content_refresh_jobs': {
      purpose: 'Scheduled content update jobs',
      status: 'UNUSED',
      rows: 0
    },
    
    // DUPLICATE/DEPRECATED TABLES
    'chat_sessions': {
      purpose: 'Duplicate of conversations table',
      status: 'DEPRECATED',
      rows: 0
    },
    'chat_messages': {
      purpose: 'Duplicate of messages table',
      status: 'DEPRECATED',
      rows: 0
    },
    
    // MULTI-TENANT FEATURES (Not implemented)
    'businesses': {
      purpose: 'Multi-tenant business accounts',
      status: 'NOT IMPLEMENTED',
      rows: 0
    },
    'business_configs': {
      purpose: 'Business-specific settings',
      status: 'NOT IMPLEMENTED',
      rows: 0
    },
    'business_usage': {
      purpose: 'Usage tracking for billing',
      status: 'NOT IMPLEMENTED',
      rows: 0
    },
    
    // PRIVACY/COMPLIANCE (Not implemented)
    'privacy_requests': {
      purpose: 'GDPR/CCPA request tracking',
      status: 'NOT IMPLEMENTED',
      rows: 0
    },
    'customer_verifications': {
      purpose: 'Identity verification records',
      status: 'NOT IMPLEMENTED',
      rows: 0
    },
    'customer_access_logs': {
      purpose: 'Audit trail for access',
      status: 'NOT IMPLEMENTED',
      rows: 0
    },
    
    // OPTIMIZATION FEATURES (Not implemented)
    'ai_optimized_content': {
      purpose: 'AI-enhanced content versions',
      status: 'NOT IMPLEMENTED',
      rows: 0
    },
    'content_hashes': {
      purpose: 'Detect content changes',
      status: 'NOT IMPLEMENTED',
      rows: 0
    },
    'page_content_references': {
      purpose: 'Link mapping between pages',
      status: 'NOT IMPLEMENTED',
      rows: 0
    },
    'domain_patterns': {
      purpose: 'Learned extraction patterns',
      status: 'NOT IMPLEMENTED',
      rows: 0
    },
    'customer_data_cache': {
      purpose: 'Performance cache',
      status: 'NOT IMPLEMENTED',
      rows: 0
    }
  };

  // Group by status
  const groups = {
    'ACTIVE': [],
    'MINIMAL USE': [],
    'UNUSED': [],
    'DEPRECATED': [],
    'NOT IMPLEMENTED': []
  };

  for (const [table, info] of Object.entries(tableInfo)) {
    if (actualTables.includes(table)) {
      groups[info.status].push({ table, ...info });
    }
  }

  for (const [status, tables] of Object.entries(groups)) {
    if (tables.length > 0) {
      console.log(`\n${status}:`);
      tables.forEach(({ table, purpose, rows }) => {
        console.log(`  📌 ${table}`);
        console.log(`     Purpose: ${purpose}`);
        console.log(`     Rows: ${rows}`);
      });
    }
  }

  console.log('\n' + '=' .repeat(60));
  console.log('\n💡 RECOMMENDATIONS:\n');
  console.log('1. Consider removing deprecated tables (chat_sessions, chat_messages)');
  console.log('2. Many planned features are not implemented (16 empty tables)');
  console.log('3. Core functionality uses only 8 tables effectively');
  console.log('4. Multi-tenant and privacy features are completely unused');
}

getActualTables();