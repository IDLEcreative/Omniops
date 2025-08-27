#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://birugqyuqhiahxvxeyqg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpcnVncXl1cWhpYWh4dnhleXFnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTc4NzE2NCwiZXhwIjoyMDcxMzYzMTY0fQ.5bw0QlkRgv_PA7iHrpWixvC31d7WZ5VYSR2JZnhsw8s'
);

async function checkWebsiteContent() {
  console.log('🔍 Checking website_content Table\n');
  console.log('═'.repeat(70));
  
  try {
    // Get all records from website_content
    const { data, error, count } = await supabase
      .from('website_content')
      .select('*', { count: 'exact' });
    
    if (error) {
      console.error('Error fetching website_content:', error.message);
      return;
    }
    
    console.log(`Total records: ${count}\n`);
    
    if (!data || data.length === 0) {
      console.log('No records found in website_content table.');
      return;
    }
    
    // Display each record
    data.forEach((record, index) => {
      console.log(`\n📄 Record ${index + 1}:`);
      console.log('-'.repeat(70));
      console.log(`ID: ${record.id}`);
      console.log(`Domain ID: ${record.domain_id}`);
      console.log(`URL: ${record.url}`);
      console.log(`Title: ${record.title || 'N/A'}`);
      console.log(`Content Type: ${record.content_type || 'N/A'}`);
      console.log(`Created: ${new Date(record.created_at).toLocaleString()}`);
      
      // Show content preview
      if (record.content) {
        const preview = record.content.substring(0, 200);
        console.log(`\nContent Preview:`);
        console.log(`"${preview}${record.content.length > 200 ? '...' : ''}"`);
        console.log(`(Total length: ${record.content.length} characters)`);
      }
      
      // Show metadata if present
      if (record.metadata && Object.keys(record.metadata).length > 0) {
        console.log(`\nMetadata:`);
        console.log(JSON.stringify(record.metadata, null, 2));
      }
    });
    
    // Analysis
    console.log('\n' + '═'.repeat(70));
    console.log('📊 ANALYSIS:\n');
    
    console.log('This table appears to be a legacy table that was meant to store');
    console.log('structured website content separately from raw scraped pages.');
    console.log('\nCurrently, we\'re using:');
    console.log('• scraped_pages - for raw HTML and text content');
    console.log('• page_embeddings - for searchable vector chunks');
    console.log('• structured_extractions - for products, FAQs, etc.');
    console.log('\nThe website_content table is largely redundant in our current');
    console.log('architecture and these 3 records are likely from early testing.');
    
  } catch (err) {
    console.error('Error:', err);
  }
}

checkWebsiteContent();