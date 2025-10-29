import { createServiceRoleClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
      const supabase = await createServiceRoleClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
  }
  
  try {
    // Get all tables using raw SQL query
    const { data: tables, error } = await supabase.rpc('query', {
      query_text: `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name
      `
    });

    if (error) {
      // Try alternative method - query pg_tables
      const { data: pgTables, error: pgError } = await supabase
        .from('pg_tables')
        .select('tablename')
        .eq('schemaname', 'public');
      
      if (pgError) {
        // Last resort - try known tables
        const knownTables = [
          'customer_configs',
          'conversations', 
          'messages',
          'scraped_pages',
          'website_content',
          'page_embeddings',
          'page_embeddings',
          'training_documents',
          'training_embeddings',
          'structured_extractions',
          'content_refresh_jobs'
        ];

        const existingTables = [];
        const missingTables = [];

        for (const tableName of knownTables) {
          const { error: checkError } = await supabase
            .from(tableName)
            .select('id')
            .limit(1);
          
          if (!checkError) {
            existingTables.push(tableName);
          } else if (checkError.message.includes('does not exist')) {
            missingTables.push(tableName);
          }
        }

        return NextResponse.json({
          method: 'direct_check',
          existing_tables: existingTables,
          missing_tables: missingTables,
          total: existingTables.length
        });
      }

      return NextResponse.json({
        method: 'pg_tables',
        tables: pgTables?.map(t => t.tablename) || [],
        total: pgTables?.length || 0
      });
    }

    return NextResponse.json({
      method: 'information_schema',
      tables: tables?.map((t: any) => t.table_name) || [],
      total: tables?.length || 0
    });

  } catch (err: any) {
    return NextResponse.json({ 
      error: err.message,
      stack: err.stack 
    }, { status: 500 });
  }
}