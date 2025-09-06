import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
import { createServiceRoleClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServiceRoleClient();
    
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection unavailable' },
        { status: 503 }
      );
    }
    
    // Test 1: Try direct table query
    const tableTests: any = {};
    const tables = ['conversations', 'messages', 'customer_verifications', 'customer_access_logs', 'customer_data_cache'];
    
    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      tableTests[table] = {
        success: !error,
        error: error?.message,
        hasData: data ? data.length : 0
      };
    }
    
    // Test 2: Try raw SQL query
    let sqlTest = null;
    try {
      // Use Supabase's direct SQL execution if available
      const { data: sqlData, error: sqlError } = await supabase.rpc('exec_sql', {
        query: `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('conversations', 'messages', 'customer_verifications', 'customer_access_logs', 'customer_data_cache')`
      });
      
      sqlTest = {
        success: !sqlError,
        error: sqlError?.message,
        tables: sqlData
      };
    } catch (e: any) {
      sqlTest = {
        success: false,
        error: 'RPC function not available',
        note: 'This is normal - we can still use the REST API'
      };
    }
    
    // Test 3: Check Supabase configuration
    const config = {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    };
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      config,
      tableTests,
      sqlTest,
      summary: {
        allTablesAccessible: Object.values(tableTests).every((t: any) => t.success),
        recommendation: Object.values(tableTests).some((t: any) => !t.success) 
          ? 'Tables exist but REST API access needs to be configured. Check RLS policies or use Supabase Dashboard to expose tables.'
          : 'All tables are accessible via REST API'
      }
    });
  } catch (error: any) {
    console.error('Database test error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Test failed',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}
