#!/usr/bin/env node

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function deleteTestPage() {
  const url = 'https://www.thompsonseparts.co.uk/product/rexroth-a10vo-series-axial-piston-pumps/';
  console.log('Deleting test page:', url);
  
  const { error } = await client
    .from('scraped_pages')
    .delete()
    .eq('url', url);
  
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('✅ Deleted test page record');
  }
}

deleteTestPage().catch(console.error);