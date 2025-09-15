import { createClient  } from '@supabase/supabase-js';
import fs from 'node:fs';

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://birugqyuqhiahxvxeyqg.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpcnVncXl1cWhpYWh4dnhleXFnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTc4NzE2NCwiZXhwIjoyMDcxMzYzMTY0fQ.5bw0QlkRgv_PA7iHrpWixvC31d7WZ5VYSR2JZnhsw8s';

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeMigration() {
  try {
    console.log('Executing RAG fix migration...\n');
    
    // Read the SQL file
    const sql = fs.readFileSync('fix-search-embeddings.sql', 'utf8');
    
    // Split into individual statements and execute
    const statements = sql.split(';').filter(s => s.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log('Executing:', statement.substring(0, 50) + '...');
        
        // Execute raw SQL using the admin client
        const { data, error } = await supabase.rpc('exec_sql', {
          sql: statement + ';'
        }).catch(async (err) => {
          // If exec_sql doesn't exist, try direct execution
          // This will work for DDL statements
          return { error: 'RPC not available, statement may need manual execution' };
        });
        
        if (error) {
          console.log('Note:', error);
          // Try alternative approach for functions
          if (statement.includes('CREATE OR REPLACE FUNCTION')) {
            console.log('This is a function definition - needs to be run in Supabase Dashboard');
          }
        } else {
          console.log('Success!');
        }
      }
    }
    
    // Test if the function exists now
    console.log('\n=== Testing if search_embeddings function exists ===');
    const testEmbedding = new Array(1536).fill(0.1);
    const { data: testResult, error: testError } = await supabase.rpc('search_embeddings', {
      query_embedding: testEmbedding,
      p_domain_id: null,
      match_threshold: 0.1,
      match_count: 1
    });
    
    if (testError) {
      console.log('Function test failed:', testError.message);
      console.log('\n❌ The function needs to be created manually in the Supabase Dashboard.');
      console.log('Please go to: https://supabase.com/dashboard/project/birugqyuqhiahxvxeyqg/sql/new');
      console.log('And run the contents of fix-search-embeddings.sql');
    } else {
      console.log('✅ Function exists and is working!');
      console.log('Results returned:', testResult?.length || 0);
    }
    
  } catch (error) {
    console.error('Error executing migration:', error);
  }
}

executeMigration();