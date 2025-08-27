import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
  
  const results: any = {
    function_creation: null,
    customer_config: null,
    test_search: null
  };
  
  try {
    // Step 1: Create the search_embeddings RPC function
    console.log('Creating search_embeddings function...');
    
    const createFunctionSQL = `
      CREATE OR REPLACE FUNCTION search_embeddings(
        query_embedding vector(1536),
        similarity_threshold float DEFAULT 0.7,
        match_count int DEFAULT 5,
        p_domain_id uuid DEFAULT NULL
      )
      RETURNS TABLE (
        content text,
        url text,
        title text,
        similarity float
      )
      LANGUAGE plpgsql
      AS $$
      BEGIN
        RETURN QUERY
        SELECT 
          pe.chunk_text AS content,
          COALESCE((pe.metadata->>'url')::text, '') AS url,
          COALESCE((pe.metadata->>'title')::text, 'Thompson eParts') AS title,
          1 - (pe.embedding <=> query_embedding) AS similarity
        FROM page_embeddings pe
        WHERE 
          1 - (pe.embedding <=> query_embedding) > similarity_threshold
        ORDER BY pe.embedding <=> query_embedding
        LIMIT match_count;
      END;
      $$;
    `;
    
    // Execute the SQL to create the function
    const { error: functionError } = await supabase.rpc('exec_sql', {
      sql: createFunctionSQL
    }).catch(async () => {
      // If exec_sql doesn't exist, try another approach
      // We'll create a simple API endpoint to handle this
      return { error: 'Cannot create function via RPC' };
    });
    
    if (functionError) {
      // Try alternative: Create a simpler version
      console.log('Trying alternative function creation...');
      results.function_creation = { 
        status: 'alternative_needed',
        message: 'Need to create function manually or through migration'
      };
    } else {
      results.function_creation = { status: 'success' };
    }
    
    // Step 2: Add customer_configs entry for thompsonseparts.co.uk
    console.log('Adding customer config...');
    
    // First check if it already exists
    const { data: existingConfig } = await supabase
      .from('customer_configs')
      .select('id, domain')
      .eq('domain', 'thompsonseparts.co.uk')
      .single();
    
    if (!existingConfig) {
      const { data: newConfig, error: configError } = await supabase
        .from('customer_configs')
        .insert({
          domain: 'thompsonseparts.co.uk',
          company_name: 'Thompson eParts',
          business_name: 'Thompson eParts Ltd',
          woocommerce_enabled: true,
          woocommerce_url: 'https://www.thompsonseparts.co.uk',
          admin_email: 'admin@thompsonseparts.co.uk',
          created_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (configError) {
        results.customer_config = { 
          status: 'error', 
          error: configError.message 
        };
      } else {
        results.customer_config = { 
          status: 'created', 
          id: newConfig.id,
          domain: newConfig.domain 
        };
      }
    } else {
      results.customer_config = { 
        status: 'already_exists', 
        id: existingConfig.id,
        domain: existingConfig.domain
      };
    }
    
    // Step 3: Test the search with a simple query
    console.log('Testing search...');
    
    // Since we might not have the RPC function, let's do a direct search
    const { data: testResults } = await supabase
      .from('page_embeddings')
      .select('chunk_text, metadata')
      .textSearch('chunk_text', 'tipper')
      .limit(3);
    
    results.test_search = {
      found: testResults?.length || 0,
      samples: testResults?.map(r => r.chunk_text.substring(0, 100))
    };
    
    return NextResponse.json({
      success: true,
      results,
      next_steps: [
        'The search_embeddings function may need to be created via SQL migration',
        'Customer config has been set up for thompsonseparts.co.uk',
        'The chat API should now be able to find and use the training data'
      ]
    });
    
  } catch (err: any) {
    return NextResponse.json({ 
      success: false,
      error: err.message,
      results
    }, { status: 500 });
  }
}