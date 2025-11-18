import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createServiceRoleClient();

    if (!supabase) {
      return NextResponse.json({
        error: 'Database service is currently unavailable'
      }, { status: 503 });
    }
    
    // Try using the v_index_usage view from the migration
    const { data: indexUsage, error: indexUsageError } = await supabase
      .from('v_index_usage')
      .select('*');

    if (!indexUsageError && indexUsage) {
      return NextResponse.json({ 
        data: indexUsage,
        method: 'v_index_usage_view',
        total_indexes: indexUsage.length
      });
    }


    // Try direct access to pg_stat_user_indexes (might work with service role)
    const { data: indexStats, error: indexStatsError } = await supabase
      .from('pg_stat_user_indexes')
      .select('*');

    if (!indexStatsError && indexStats) {
      // Transform the data to be more readable
      const indexesInfo = indexStats.map(stat => ({
        schema: stat.schemaname,
        table: stat.tablename,
        index_name: stat.indexname,
        scans: stat.idx_scan,
        tuples_read: stat.idx_tup_read,
        tuples_fetched: stat.idx_tup_fetch
      }));

      return NextResponse.json({ 
        data: indexesInfo,
        method: 'pg_stat_user_indexes',
        total_indexes: indexesInfo.length
      });
    }


    // Try getting table info instead
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');

    if (!tablesError && tables) {
      // Get basic table information
      const tableInfo = tables.map(table => table.table_name);
      
      return NextResponse.json({ 
        data: tableInfo,
        method: 'information_schema_tables',
        message: 'Could not access index information directly, returning table names',
        total_tables: tableInfo.length
      });
    }

    // Last resort - just return error with debugging info
    return NextResponse.json({ 
      error: 'Unable to access database schema information',
      debug_info: {
        v_index_usage_error: indexUsageError?.message || 'No error',
        pg_stat_user_indexes_error: indexStatsError?.message || 'No error',
        information_schema_tables_error: tablesError?.message || 'No error'
      }
    }, { status: 500 });

  } catch (err) {
    console.error('Failed to query database:', err);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: err instanceof Error ? err.message : 'Unknown error'
    }, { status: 500 });
  }
}