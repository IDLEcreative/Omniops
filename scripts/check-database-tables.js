import { createClient  } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function checkTables() {
  try {
    // Query to get all tables in public schema
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .order('table_name');

    if (error) {
      // Try alternative approach using raw SQL
      const { data: sqlData, error: sqlError } = await supabase.rpc('get_tables', {});
      
      if (sqlError) {
        console.log('Trying direct SQL query...');
        // Execute raw SQL
        const { data: rawData, error: rawError } = await supabase
          .rpc('query', { 
            query_text: `
              SELECT table_name 
              FROM information_schema.tables 
              WHERE table_schema = 'public' 
              ORDER BY table_name
            ` 
          });
        
        if (rawError) {
          console.error('Error fetching tables:', rawError);
        } else {
          console.log('Tables in database:', rawData);
        }
      } else {
        console.log('Tables in database:', sqlData);
      }
    } else {
      console.log('Tables in your production database:');
      console.log('=====================================');
      data.forEach(table => {
        console.log(`- ${table.table_name}`);
      });
      console.log('=====================================');
      console.log(`Total tables: ${data.length}`);
    }

    // Check for specific RAG-related tables
    const ragTables = [
      'training_documents',
      'training_embeddings', 
      'scraped_pages',
      'website_content',
      'page_embeddings'
    ];

    console.log('\nChecking for RAG/training tables:');
    console.log('=====================================');
    
    for (const tableName of ragTables) {
      const { data: tableExists, error: checkError } = await supabase
        .from(tableName)
        .select('*')
        .limit(0);
      
      if (!checkError) {
        console.log(`✓ ${tableName} - EXISTS`);
      } else if (checkError.message.includes('relation') && checkError.message.includes('does not exist')) {
        console.log(`✗ ${tableName} - DOES NOT EXIST`);
      } else {
        console.log(`? ${tableName} - Error: ${checkError.message}`);
      }
    }

  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

checkTables();