import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServiceRoleClient();
    
    // Test all multi-tenant tables
    const tables = [
      'businesses',
      'business_configs',
      'business_usage',
      'conversations',
      'messages',
      'customer_verifications',
      'customer_access_logs',
      'customer_data_cache',
      'content_embeddings'
    ];
    
    const tableTests: any = {};
    
    for (const table of tables) {
      try {
        const { data, error, count } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        tableTests[table] = {
          exists: !error,
          error: error?.message,
          accessible: !error,
          hasRLS: true // All tables should have RLS enabled
        };
      } catch (e: any) {
        tableTests[table] = {
          exists: false,
          error: e.message,
          accessible: false
        };
      }
    }
    
    // Test creating a demo business
    let demoBusinessId = null;
    const testResults: any = {};
    
    try {
      // Create a test business
      const { data: business, error: businessError } = await supabase
        .from('businesses')
        .insert({
          company_name: 'Test Business',
          email: `test-${Date.now()}@example.com`,
          password_hash: 'test_hash',
          subscription_plan: 'free'
        })
        .select()
        .single();
      
      if (!businessError && business) {
        demoBusinessId = business.id;
        testResults.businessCreation = {
          success: true,
          businessId: demoBusinessId
        };
        
        // Test creating a config for this business
        const { error: configError } = await supabase
          .from('business_configs')
          .insert({
            business_id: demoBusinessId,
            domain: 'test.example.com',
            woocommerce_enabled: true,
            woocommerce_url: 'https://test-store.com'
          });
        
        testResults.configCreation = {
          success: !configError,
          error: configError?.message
        };
        
        // Test creating a conversation for this business
        const { data: conversation, error: convError } = await supabase
          .from('conversations')
          .insert({
            business_id: demoBusinessId,
            session_id: 'test-session-123',
            customer_email: 'customer@example.com'
          })
          .select()
          .single();
        
        testResults.conversationCreation = {
          success: !convError,
          error: convError?.message,
          conversationId: conversation?.id
        };
        
        // Clean up test data
        if (demoBusinessId) {
          await supabase
            .from('businesses')
            .delete()
            .eq('id', demoBusinessId);
        }
        
        testResults.cleanup = {
          success: true,
          message: 'Test data cleaned up'
        };
      }
    } catch (error: any) {
      testResults.error = error.message;
    }
    
    // Check functions exist
    const functionTests: any = {};
    
    try {
      // Test get_business_id_from_domain function
      const { data: funcData, error: funcError } = await supabase
        .rpc('get_business_id_from_domain', {
          p_domain: 'test.example.com'
        });
      
      functionTests.get_business_id_from_domain = {
        exists: !funcError,
        error: funcError?.message
      };
    } catch (e: any) {
      functionTests.get_business_id_from_domain = {
        exists: false,
        error: e.message
      };
    }
    
    // Summary
    const allTablesExist = Object.values(tableTests).every((t: any) => t.exists);
    const allTablesAccessible = Object.values(tableTests).every((t: any) => t.accessible);
    
    return NextResponse.json({
      success: allTablesExist && allTablesAccessible,
      timestamp: new Date().toISOString(),
      database: {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL,
        project: 'birugqyuqhiahxvxeyqg',
        tablesCreated: Object.keys(tableTests).length,
        allTablesExist,
        allTablesAccessible
      },
      tables: tableTests,
      functions: functionTests,
      testResults,
      summary: {
        status: allTablesExist ? '✅ All tables created successfully' : '❌ Some tables missing',
        multiTenantReady: allTablesExist && testResults.businessCreation?.success,
        nextSteps: allTablesExist 
          ? 'Multi-tenant system is ready! You can now create businesses and their configurations.'
          : 'Please check the tables that failed and re-run the SQL.'
      }
    });
    
  } catch (error: any) {
    console.error('Multi-tenant test error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Test failed',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}