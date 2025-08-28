import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ 
        error: 'Missing Supabase environment variables' 
      }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    
    // Get table list first to understand what we're working with
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');

    if (tablesError) {
      console.log('Cannot access information_schema.tables directly');
      
      // Manual approach - get indexes by examining pg_stat_user_indexes
      const { data: indexStats, error: indexStatsError } = await supabase
        .from('pg_stat_user_indexes')
        .select('*');

      if (indexStatsError) {
        console.log('Cannot access pg_stat_user_indexes');
        
        // Try a different approach - get information from pg_class
        const { data: pgClass, error: pgClassError } = await supabase
          .from('pg_class')
          .select('relname, relkind')
          .eq('relkind', 'i'); // indexes have relkind 'i'

        if (pgClassError) {
          console.log('Cannot access pg_class');
          
          // Final fallback - just return the table names we can access
          const queryResult = await supabase.rpc('get_table_info');
          
          if (queryResult.error) {
            return NextResponse.json({ 
              error: 'Unable to query database schema',
              message: 'PostgreSQL system tables are not accessible through Supabase client'
            }, { status: 500 });
          }

          return NextResponse.json({ 
            data: queryResult.data,
            method: 'fallback',
            note: 'Could not access pg_indexes directly'
          });
        }

        return NextResponse.json({ 
          data: pgClass,
          method: 'pg_class'
        });
      }

      return NextResponse.json({ 
        data: indexStats,
        method: 'pg_stat_user_indexes'
      });
    }

    // If we can access information_schema.tables, try to get more detailed index info
    return NextResponse.json({ 
      data: tables,
      method: 'information_schema_tables',
      message: 'Successfully accessed information schema, but pg_indexes may not be directly accessible'
    });

  } catch (err) {
    console.error('Failed to query database:', err);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: err instanceof Error ? err.message : 'Unknown error'
    }, { status: 500 });
  }
}