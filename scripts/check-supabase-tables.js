import { createClient  } from '@supabase/supabase-js';

// Get Supabase URL and anon key from environment
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function listTables() {
  try {
    // Query the information schema to get all tables
    const { data, error } = await supabase
      .from('customer_configs')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('Error accessing database:', error);
    } else {
      console.log('✅ Successfully connected to Supabase!');
      console.log('Sample customer_configs table access successful');
    }

    // Try to access other known tables
    const tables = [
      'scraped_pages',
      'website_content', 
      'page_embeddings',
      'conversations',
      'messages',
      'structured_extractions',
      'content_refresh_jobs'
    ];

    console.log('\nChecking access to tables:');
    for (const table of tables) {
      const { error: tableError } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (!tableError) {
        console.log(`✅ ${table}`);
      } else {
        console.log(`❌ ${table}: ${tableError.message}`);
      }
    }

  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

listTables();