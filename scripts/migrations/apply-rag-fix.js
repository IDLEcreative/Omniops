import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient  } from '@supabase/supabase-js';
import fs from 'node:fs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyFix() {
  try {
    console.log('🔧 Applying RAG fix to Supabase...\n');
    
    // Read the SQL file
    const sqlContent = fs.readFileSync('fix-search-embeddings.sql', 'utf8');
    
    // Split into individual statements and filter out empty ones
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    for (const statement of statements) {
      // Skip the verification SELECT at the end
      if (statement.toLowerCase().includes('select') && 
          statement.toLowerCase().includes('from pg_proc')) {
        console.log('📊 Verifying function creation...');
        const { data, error } = await supabase.rpc('sql', {
          query: statement + ';'
        }).single();
        
        if (error) {
          // Try direct query
          const { data: result, error: queryError } = await supabase
            .from('pg_proc')
            .select('*')
            .eq('proname', 'search_embeddings')
            .single();
          
          if (result || !queryError) {
            console.log('✅ Function search_embeddings exists');
          } else {
            console.log('⚠️  Could not verify function (may still be created)');
          }
        } else {
          console.log('✅ Function verified:', data);
        }
        continue;
      }
      
      // Execute each SQL statement
      console.log(`Executing: ${statement.substring(0, 50)}...`);
      
      // For Supabase, we need to use raw SQL execution
      // Since supabase-js doesn't have a direct SQL execution method,
      // we'll use the service role key to make a direct API call
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey
        },
        body: JSON.stringify({ query: statement + ';' })
      });
      
      if (!response.ok) {
        // This is expected to fail since 'sql' RPC might not exist
        // Let's try a different approach using direct execution
        console.log('Note: Direct SQL execution not available via RPC');
        console.log('You need to run the SQL in Supabase SQL Editor');
        console.log('\n📋 Please copy the contents of fix-search-embeddings.sql');
        console.log('   and run it in your Supabase SQL Editor:\n');
        console.log('   1. Go to your Supabase project dashboard');
        console.log('   2. Navigate to SQL Editor');
        console.log('   3. Paste the entire contents of fix-search-embeddings.sql');
        console.log('   4. Click "Run"\n');
        return;
      }
      
      console.log('✅ Statement executed successfully');
    }
    
    console.log('\n🎉 RAG fix applied successfully!');
    
  } catch (error) {
    console.error('Error applying fix:', error);
    console.log('\n⚠️  Automated application failed.');
    console.log('Please apply the fix manually in Supabase SQL Editor:');
    console.log('1. Go to your Supabase project dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Paste the entire contents of fix-search-embeddings.sql');
    console.log('4. Click "Run"');
  }
}

applyFix();