#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://birugqyuqhiahxvxeyqg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpcnVncXl1cWhpYWh4dnhleXFnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTc4NzE2NCwiZXhwIjoyMDcxMzYzMTY0fQ.5bw0QlkRgv_PA7iHrpWixvC31d7WZ5VYSR2JZnhsw8s'
);

async function checkAllTables() {
  console.log('📊 Checking ALL Database Tables\n');
  console.log('═'.repeat(80));
  
  const tables = [
    // Core tables
    { name: 'customers', purpose: 'Multi-tenant customer accounts' },
    { name: 'customer_configs', purpose: 'Customer-specific configurations' },
    { name: 'domains', purpose: 'Websites being scraped' },
    
    // Scraping & Content
    { name: 'scraped_pages', purpose: 'Raw HTML pages scraped' },
    { name: 'website_content', purpose: 'Structured website content' },
    { name: 'page_embeddings', purpose: 'Vector embeddings for pages' },
    { name: 'content_embeddings', purpose: 'Vector embeddings for content chunks' },
    
    // Structured Data
    { name: 'structured_extractions', purpose: 'Products, FAQs, contact info' },
    { name: 'content_refresh_jobs', purpose: 'Track scraping jobs' },
    
    // AI Optimization
    { name: 'ai_optimized_content', purpose: 'AI-processed and optimized content' },
    { name: 'content_hashes', purpose: 'Track duplicate content' },
    { name: 'page_content_references', purpose: 'Link relationships between pages' },
    
    // Training & Chat
    { name: 'training_data', purpose: 'Custom training data for AI' },
    { name: 'conversations', purpose: 'Chat conversation sessions' },
    { name: 'messages', purpose: 'Individual chat messages' },
  ];
  
  const tableStatus = [];
  
  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table.name)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        tableStatus.push({
          name: table.name,
          count: 'ERROR',
          status: '❌',
          purpose: table.purpose,
          error: error.message
        });
      } else {
        tableStatus.push({
          name: table.name,
          count: count || 0,
          status: count > 0 ? '✅' : '⚠️',
          purpose: table.purpose
        });
      }
    } catch (err) {
      tableStatus.push({
        name: table.name,
        count: 'ERROR',
        status: '❌',
        purpose: table.purpose,
        error: err.message
      });
    }
  }
  
  // Display results
  console.log('TABLE STATUS REPORT:\n');
  console.log('Table Name                    | Records | Status | Purpose');
  console.log('-'.repeat(80));
  
  for (const table of tableStatus) {
    const name = table.name.padEnd(28);
    const count = String(table.count).padStart(7);
    const status = table.status;
    console.log(`${name} | ${count} | ${status}     | ${table.purpose}`);
    if (table.error) {
      console.log(`  └─ Error: ${table.error}`);
    }
  }
  
  console.log('\n' + '═'.repeat(80));
  console.log('📋 ANALYSIS:\n');
  
  const populated = tableStatus.filter(t => t.count > 0);
  const empty = tableStatus.filter(t => t.count === 0);
  const errors = tableStatus.filter(t => t.count === 'ERROR');
  
  console.log(`✅ Populated tables: ${populated.length}/${tables.length}`);
  populated.forEach(t => {
    console.log(`   • ${t.name}: ${t.count} records`);
  });
  
  console.log(`\n⚠️  Empty tables: ${empty.length}/${tables.length}`);
  empty.forEach(t => {
    console.log(`   • ${t.name}: ${t.purpose}`);
  });
  
  if (errors.length > 0) {
    console.log(`\n❌ Tables with errors: ${errors.length}`);
    errors.forEach(t => {
      console.log(`   • ${t.name}: ${t.error}`);
    });
  }
  
  // Explain why tables are empty
  console.log('\n' + '═'.repeat(80));
  console.log('🔍 WHY ARE TABLES EMPTY?\n');
  
  const explanations = {
    'customers': 'No user authentication implemented yet - would be populated when users sign up',
    'customer_configs': 'No customer onboarding - would store widget configurations per customer',
    'website_content': 'Not used - we store directly in scraped_pages instead',
    'content_embeddings': 'Not used - we use page_embeddings for all embeddings',
    'content_refresh_jobs': 'Job tracking not implemented - jobs run directly without tracking',
    'ai_optimized_content': 'AI optimization not implemented - future feature for content improvement',
    'content_hashes': 'Deduplication tracking not implemented - would track duplicate content',
    'page_content_references': 'Link analysis not implemented - would map page relationships',
    'training_data': 'No custom training data added - would store Q&A pairs for fine-tuning',
    'conversations': 'Chat system not tested yet - would store chat sessions',
    'messages': 'Chat system not tested yet - would store individual messages',
  };
  
  console.log('Empty tables explained:');
  empty.forEach(t => {
    const explanation = explanations[t.name] || 'Feature not implemented yet';
    console.log(`\n📌 ${t.name}:`);
    console.log(`   Purpose: ${t.purpose}`);
    console.log(`   Why empty: ${explanation}`);
  });
  
  // Recommendations
  console.log('\n' + '═'.repeat(80));
  console.log('💡 RECOMMENDATIONS:\n');
  
  console.log('To fully utilize the system:');
  console.log('1. Test the chat widget to populate conversations/messages tables');
  console.log('2. Create a customer account to test multi-tenancy');
  console.log('3. Implement content refresh jobs for automatic updates');
  console.log('4. Add AI content optimization for better search results');
  console.log('5. Track content hashes to prevent duplicate storage');
  console.log('6. Analyze page links to understand site structure better');
  
  // What's actually being used
  console.log('\n🎯 CURRENT ACTIVE FLOW:');
  console.log('1. domains → Track websites');
  console.log('2. scraped_pages → Store raw page content');
  console.log('3. page_embeddings → Generate searchable vectors');
  console.log('4. structured_extractions → Store products and structured data');
  console.log('\nThis is the minimum viable pipeline for the AI agent to work!');
}

checkAllTables();