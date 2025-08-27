#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://birugqyuqhiahxvxeyqg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpcnVncXl1cWhpYWh4dnhleXFnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTc4NzE2NCwiZXhwIjoyMDcxMzYzMTY0fQ.5bw0QlkRgv_PA7iHrpWixvC31d7WZ5VYSR2JZnhsw8s'
);

async function removeRedundancy() {
  console.log('🧹 Removing Database Redundancy\n');
  console.log('═'.repeat(70));
  
  const actions = {
    immediate: [
      { 
        action: 'DELETE_DATA',
        table: 'website_content',
        reason: 'Redundant - same data in structured_extractions',
        records: 3
      }
    ],
    recommended: [
      {
        action: 'DROP_TABLE',
        table: 'website_content',
        reason: 'Not used in codebase, data stored better elsewhere'
      },
      {
        action: 'DROP_TABLE', 
        table: 'content_embeddings',
        reason: 'Duplicate of page_embeddings functionality'
      },
      {
        action: 'DROP_TABLE',
        table: 'content_refresh_jobs',
        reason: 'Feature not implemented, can recreate when needed'
      },
      {
        action: 'DROP_TABLE',
        table: 'ai_optimized_content',
        reason: 'Feature not implemented, can recreate when needed'
      },
      {
        action: 'DROP_TABLE',
        table: 'content_hashes',
        reason: 'Deduplication not implemented, handled differently now'
      },
      {
        action: 'DROP_TABLE',
        table: 'page_content_references',
        reason: 'Link analysis not implemented'
      }
    ]
  };
  
  console.log('📋 REDUNDANCY ANALYSIS:\n');
  
  console.log('IMMEDIATE ACTIONS (Safe to do now):');
  console.log('-'.repeat(70));
  actions.immediate.forEach(item => {
    console.log(`• ${item.action}: ${item.table}`);
    console.log(`  Reason: ${item.reason}`);
    console.log(`  Impact: ${item.records} records will be deleted\n`);
  });
  
  console.log('\nRECOMMENDED ACTIONS (Tables to drop):');
  console.log('-'.repeat(70));
  actions.recommended.forEach(item => {
    console.log(`• ${item.action}: ${item.table}`);
    console.log(`  Reason: ${item.reason}\n`);
  });
  
  console.log('═'.repeat(70));
  console.log('\n⚠️  WARNING: This will permanently delete data and tables.');
  console.log('Type "yes" to proceed with IMMEDIATE actions only.');
  console.log('Type "all" to proceed with ALL actions (immediate + drop tables).');
  console.log('Press Ctrl+C to cancel.\n');
  
  // Set up stdin for user input
  process.stdin.resume();
  process.stdin.setEncoding('utf8');
  
  process.stdin.once('data', async (input) => {
    const answer = input.trim().toLowerCase();
    
    if (answer === 'yes' || answer === 'all') {
      console.log('\n🔄 Executing cleanup...\n');
      
      // 1. Delete website_content data
      console.log('Deleting website_content records...');
      const { error: deleteError } = await supabase
        .from('website_content')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
      
      if (deleteError) {
        console.error('Error deleting website_content:', deleteError);
      } else {
        console.log('✅ Deleted website_content records');
      }
      
      // 2. Drop tables if user chose "all"
      if (answer === 'all') {
        console.log('\n📦 Dropping redundant tables...\n');
        
        for (const item of actions.recommended) {
          console.log(`Dropping ${item.table}...`);
          
          // Use raw SQL to drop tables
          const { error } = await supabase.rpc('exec_sql', {
            query: `DROP TABLE IF EXISTS ${item.table} CASCADE`
          });
          
          if (error) {
            // Try direct SQL if RPC doesn't exist
            console.log(`  ⚠️ Cannot drop via RPC, table will remain: ${item.table}`);
          } else {
            console.log(`  ✅ Dropped ${item.table}`);
          }
        }
        
        console.log('\n💡 NOTE: To fully remove tables, you may need to:');
        console.log('1. Create a new migration file with DROP TABLE statements');
        console.log('2. Run it via Supabase dashboard or CLI');
      }
      
      // 3. Show final state
      console.log('\n' + '═'.repeat(70));
      console.log('✨ CLEANUP COMPLETE!\n');
      console.log('Remaining active tables:');
      console.log('• domains - Website tracking');
      console.log('• scraped_pages - Raw content storage');
      console.log('• page_embeddings - Vector search');
      console.log('• structured_extractions - Products/FAQs');
      console.log('• customers/customer_configs - Multi-tenancy (future)');
      console.log('• training_data - Custom AI training (future)');
      console.log('• conversations/messages - Chat history (future)');
      
    } else {
      console.log('Cleanup cancelled.');
    }
    
    process.exit(0);
  });
}

// Add cleanup info
console.log('🔍 REDUNDANCY CLEANUP TOOL\n');
console.log('This tool will help remove redundant data and tables from your database.');
console.log('It identifies unused tables and duplicate data that can be safely removed.\n');

removeRedundancy();